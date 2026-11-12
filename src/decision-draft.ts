import {parseCriteria,validDecisionInput,type CreateDecisionInput,type ComparisonCriterion} from './decision-api';
import {savedSettingFields,validSettingDraft,SETTING_CATEGORIES,type SavedSetting,type SettingCategory,type SettingAlias} from './settings-api';

interface AppliedSource {name:string;domain:string;goal:string;category:SettingCategory;aliases:SettingAlias[]}
export interface DecisionDraft {title:string;options:string[];domain:string;goal:string;details:Record<string,string>;basis:'journal'|'criteria';criteria:ComparisonCriterion[];expectedOutcome:string;category?:SettingCategory;appliedSetting?:{id:string;generation:number};appliedSource?:AppliedSource;appliedAliases?:Record<string,string>}
export const emptyDecisionDraft=():DecisionDraft=>({title:'',options:['',''],domain:'',goal:'',details:{},basis:'journal',criteria:[],expectedOutcome:''});
export const DECISION_DRAFT_MAX_AGE=86400000;
const MAX_BYTES=60000;
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const text=(v:unknown,max:number):v is string=>typeof v==='string'&&v.length<=max;
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=1e12;
const fresh=(value:unknown,now:number):value is number=>typeof value==='number'&&Number.isFinite(value)&&value<=now&&now-value<=DECISION_DRAFT_MAX_AGE;
const domainKey=(value:string)=>value.trim().replace(/\s+/gu,' ').toLowerCase();
function withoutAppliedAliases(draft:DecisionDraft){return Object.fromEntries(Object.entries(draft.details).filter(([label,value])=>!Object.hasOwn(draft.appliedAliases??{},label)||draft.appliedAliases![label]!==value));}
/** Removing/changing a preset never removes meanings the user has since edited. */
export function detachDraftSetting(draft:DecisionDraft,clearUnchangedFields=false):DecisionDraft{
 const {appliedSetting:_,appliedSource,appliedAliases:__,...rest}=draft;
 return {...rest,details:withoutAppliedAliases(draft),...(clearUnchangedFields&&appliedSource?{domain:domainKey(draft.domain)===domainKey(appliedSource.domain)?'':draft.domain,goal:draft.goal===appliedSource.goal?'':draft.goal,category:draft.category===appliedSource.category?undefined:draft.category}:{})};
}
export function applyDraftSetting(draft:DecisionDraft,setting:SavedSetting,generation:number):DecisionDraft{
 const fields=savedSettingFields(setting,generation,draft.options,withoutAppliedAliases(draft));
 return {...draft,domain:fields.domain,goal:fields.goal,category:fields.category,details:fields.optionDetails,appliedSetting:fields.appliedSetting,appliedAliases:fields.appliedAliases,
  appliedSource:{name:setting.name,domain:setting.domain,goal:setting.goal,category:setting.category,aliases:setting.aliases.map(alias=>({...alias}))}};
}
export function patchDecisionDraft(draft:DecisionDraft,patch:Partial<DecisionDraft>):DecisionDraft{
 const changedIdentity=!!draft.appliedSetting&&((patch.domain!==undefined&&domainKey(patch.domain)!==domainKey(draft.domain))||(patch.goal!==undefined&&patch.goal!==draft.goal)||('category'in patch&&patch.category!==draft.category));
 const base=changedIdentity?detachDraftSetting(draft):draft,next={...base,...patch};
 if(patch.options&&next.appliedSetting&&next.appliedSource){
  const clean=withoutAppliedAliases(next),source=next.appliedSource;
  const fields=savedSettingFields({...source,id:next.appliedSetting.id,memory_generation:next.appliedSetting.generation,created_at:'',updated_at:''},next.appliedSetting.generation,patch.options,clean);
  return {...next,details:fields.optionDetails,appliedAliases:fields.appliedAliases};
 }
 return next;
}
/** Only the final review action submits this input; drafts themselves are not account writes. */
export function decisionInput(draft:DecisionDraft,requestId:string):CreateDecisionInput{
 const options=draft.options.map(label=>label.trim()).filter(Boolean);
 if(options.length<2||options.length>8||options.some(label=>label.length>80)||new Set(options.map(label=>label.toLowerCase())).size!==options.length)throw new Error('Add two to eight different options, each within 80 characters.');
 if(draft.title.length>120)throw new Error('Keep the title within 120 characters.');
 if(!draft.domain.trim()||draft.domain.length>100)throw new Error('Name the setting in 100 characters or fewer.');
 const criteria=parseCriteria({comparisonBasis:draft.basis,criteria:draft.criteria,criteriaConfirmed:true,criteriaVersion:1},options);if(criteria.error)throw new Error(criteria.error);
 return {requestId,options,title:draft.title.trim(),context:{domain:draft.domain.trim(),goal:draft.goal.trim(),optionDetails:Object.fromEntries(options.map(label=>[label,draft.details[label]??''])),meaningConfirmed:true,...criteria.value,expectedOutcome:draft.expectedOutcome.trim(),...(draft.category?{category:draft.category}:{}),...(draft.appliedSetting?{appliedSetting:{...draft.appliedSetting}}:{})}};
}
function validWorkingDraft(v:unknown):v is DecisionDraft{
 if(!object(v)||!text(v.title,120)||!text(v.domain,100)||!text(v.goal,300)||!text(v.expectedOutcome,300)||!['journal','criteria'].includes(String(v.basis))
  ||!Array.isArray(v.options)||v.options.length<2||v.options.length>8||!v.options.every(option=>text(option,80))
  ||!object(v.details)||Object.keys(v.details).length>32||!Object.entries(v.details).every(([key,value])=>key.length<=80&&text(value,500))
  ||!Array.isArray(v.criteria)||v.criteria.length>5||(v.category!==undefined&&!SETTING_CATEGORIES.includes(v.category as SettingCategory))
  ||(v.appliedAliases!==undefined&&(!object(v.appliedAliases)||Object.entries(v.appliedAliases).length>12||!Object.entries(v.appliedAliases).every(([key,value])=>key.length<=80&&text(value,500)))))return false;
 if(v.appliedSetting!==undefined){if(!object(v.appliedSetting)||!uuid(v.appliedSetting.id)||!Number.isSafeInteger(v.appliedSetting.generation)||Number(v.appliedSetting.generation)<0||!object(v.appliedSource)||!validSettingDraft({...v.appliedSource,id:v.appliedSetting.id,generation:v.appliedSetting.generation}))return false;}
 else if(v.appliedSource!==undefined||v.appliedAliases!==undefined)return false;
 // Working inputs may have empty labels or an unfinished range. They are not confirmed criteria.
 return v.criteria.every(c=>object(c)&&text(c.id,50)&&/^[a-zA-Z0-9-]+$/.test(c.id)&&text(c.label,100)&&text(c.unit,40)
  &&finite(c.low)&&finite(c.high)&&Number.isInteger(c.weight)&&Number(c.weight)>=1&&Number(c.weight)<=5&&['higher','lower'].includes(String(c.direction))
  &&object(c.values)&&Object.keys(c.values).length<=8&&Object.entries(c.values).every(([key,cell])=>key.length<=80&&object(cell)&&(cell.value===null||finite(cell.value))&&(cell.note===undefined||text(cell.note,500))&&(cell.sourceUrl===undefined||text(cell.sourceUrl,2048)))
  &&(c.discoverySuggestion===undefined||object(c.discoverySuggestion)&&text(c.discoverySuggestion.id,512)&&Number.isSafeInteger(c.discoverySuggestion.generation)&&Number(c.discoverySuggestion.generation)>=0));
}
export interface WorkingDecisionDraft {version:1;userId:string;updatedAt:number;step:0|1|2|3;draft:DecisionDraft}
export interface PendingDecisionCreate {version:1;userId:string;createdAt:number;input:CreateDecisionInput;decisionId?:string}
export function parseWorkingDecisionDraft(raw:string|null,userId:string,now=Date.now()):WorkingDecisionDraft|null{
 if(!raw||raw.length>MAX_BYTES)return null;
 try{const value=JSON.parse(raw);return value.version===1&&value.userId===userId&&uuid(userId)&&fresh(value.updatedAt,now)&&Number.isInteger(value.step)&&value.step>=0&&value.step<=3&&validWorkingDraft(value.draft)?value:null;}catch{return null;}
}
export function parsePendingDecisionCreate(raw:string|null,userId:string,now=Date.now()):PendingDecisionCreate|null{
 if(!raw||raw.length>MAX_BYTES)return null;
 try{const value=JSON.parse(raw);return value.version===1&&value.userId===userId&&uuid(userId)&&fresh(value.createdAt,now)&&validDecisionInput(value.input)&&(value.decisionId===undefined||uuid(value.decisionId))?value:null;}catch{return null;}
}
export interface DraftStorage {getItem:(key:string)=>Promise<string|null>;setItem:(key:string,value:string)=>Promise<void>;removeItem:(key:string)=>Promise<void>}
export const decisionDraftKeys=(userId:string)=>({working:'nudge.decision.working.v1.'+userId,pending:'nudge.decision.pending.v1.'+userId});
class ChangedDraftError extends Error{constructor(){super('Your account or device draft changed. Reopen the comparison before continuing.');}}
/** One repository per storage backend serializes device intent and fences account sign-out. */
export class DecisionDraftRepository{
 private generations=new Map<string,number>();
 private workingVersions=new Map<string,number>();
 private queues=new Map<string,Promise<unknown>>();
 constructor(private storage:DraftStorage,private now=Date.now){}
 private enqueue<T>(userId:string,operation:()=>Promise<T>):Promise<T>{
  const promise=(this.queues.get(userId)??Promise.resolve()).catch(()=>{}).then(operation);
  this.queues.set(userId,promise);void promise.finally(()=>{if(this.queues.get(userId)===promise)this.queues.delete(userId);}).catch(()=>{});return promise;
 }
 async clear(userId:string):Promise<void>{
  if(!uuid(userId))throw new ChangedDraftError();
  this.generations.set(userId,(this.generations.get(userId)??0)+1);
  await this.enqueue(userId,async()=>{const keys=decisionDraftKeys(userId);await this.storage.removeItem(keys.pending);await this.storage.removeItem(keys.working);});
 }
 scope(userId:string){
  if(!uuid(userId))throw new ChangedDraftError();
  const generation=this.generations.get(userId)??0,keys=decisionDraftKeys(userId);
  const current=()=>{if((this.generations.get(userId)??0)!==generation)throw new ChangedDraftError();};
  const readPending=async()=>parsePendingDecisionCreate(await this.storage.getItem(keys.pending),userId,this.now());
  const encode=(value:unknown)=>{const raw=JSON.stringify(value);if(raw.length>MAX_BYTES)throw new Error('This device draft is too long. Shorten its notes or sources before saving.');return raw;};
  return {
   load:()=>this.enqueue(userId,async()=>{
    current();const raw=await this.storage.getItem(keys.pending);current();const pending=parsePendingDecisionCreate(raw,userId,this.now());
    if(pending)return {pending,working:null};
    if(raw){await this.storage.removeItem(keys.pending);await this.storage.removeItem(keys.working);return {pending:null,working:null};}
    const workingRaw=await this.storage.getItem(keys.working);current();const working=parseWorkingDecisionDraft(workingRaw,userId,this.now());
    if(workingRaw&&!working)await this.storage.removeItem(keys.working);return {pending:null,working};
   }),
   saveWorking:async(draft:DecisionDraft,step:0|1|2|3)=>{
    const value:WorkingDecisionDraft={version:1,userId,updatedAt:this.now(),step,draft};
    // Serialize before yielding so later edits cannot mutate this queued snapshot.
    if(!validWorkingDraft(draft))return Promise.reject(new Error('This draft could not be kept on the device. Check its numbers before leaving the screen.'));
    const raw=encode(value);
    const version=(this.workingVersions.get(userId)??0)+1;this.workingVersions.set(userId,version);
    return this.enqueue(userId,async()=>{current();if(this.workingVersions.get(userId)!==version||await readPending())return false;current();await this.storage.setItem(keys.working,raw);return true;});
   },
   begin:async(input:CreateDecisionInput)=>{
    if(!validDecisionInput(input))return Promise.reject(new Error('Review this comparison before saving.'));
    const raw=encode({version:1,userId,createdAt:this.now(),input}),value=parsePendingDecisionCreate(raw,userId,this.now())!;
    return this.enqueue(userId,async()=>{
     current();const existing=await readPending();current();
     if(existing){if(JSON.stringify(existing.input)!==JSON.stringify(value.input))throw new Error('Finish or discard the previous comparison before creating another.');return existing;}
     await this.storage.setItem(keys.pending,raw);await this.storage.removeItem(keys.working);return value;
    });
   },
   receipt:(pending:PendingDecisionCreate,decisionId:string)=>this.enqueue(userId,async()=>{
    current();if(!uuid(decisionId))throw new Error('The saved comparison could not be confirmed.');
    const existing=await readPending();current();
    if(!existing||existing.userId!==pending.userId||JSON.stringify(existing.input)!==JSON.stringify(pending.input)||(existing.decisionId&&existing.decisionId!==decisionId))throw new ChangedDraftError();
    const value={...existing,decisionId};await this.storage.setItem(keys.pending,encode(value));return value;
   }),
  };
 }
}
