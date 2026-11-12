import {parseCriteria as parseCriteriaInput,type ComparisonCriterion,type CriteriaContext} from './core/comparison-criteria';
import {SETTING_CATEGORIES,type SettingCategory} from './settings-api';
export type {ComparisonCriterion,CriteriaContext} from './core/comparison-criteria';
export {assessCriteria,parseCriteria,criteriaForOptions} from './core/comparison-criteria';
export type DecisionStatus='open'|'decided'|'reflected'|'abandoned';
export interface JournalInput{query?:string;status?:DecisionStatus;category?:SettingCategory;offset?:number;limit?:number}
export interface DecisionContext extends CriteriaContext {domain?:string;goal?:string;optionDetails?:Record<string,string>;meaningConfirmed?:boolean;category?:string;mood?:string;budget?:string;company?:string;expectedOutcome?:string;appliedSetting?:{id:string;generation:number}}
export interface CreateDecisionInput {requestId:string;options:string[];title:string;context:DecisionContext}
export interface JournalEntry {id:string;question:string;category:string;status:DecisionStatus;created_at:string;decided_at:string|null;selected_option_id:string|null;reflection_due_at:string|null;reminder_enabled:boolean}
export interface JournalPage {decisions:JournalEntry[];pagination:{offset:number;limit:number;total:number;nextOffset:number|null};consistency:'live'}
export interface SavedOption {id:string;label:string;rank:number|null;score:number|null;score_breakdown:Record<string,number>|null}
export interface SavedReflection {rating:number;would_repeat:boolean|null;has_regrets:boolean|null;would_recommend:boolean|null;would_choose_again:boolean|null;notes:string|null}
export interface EvidenceOption {label:string;score:number;reasons:string[];warning:boolean;sourceCounts:{preferences:number;decisions:number;reflections:number}}
export interface DecisionRecord extends JournalEntry {comparison_revision:number;context:DecisionContext;expected_outcome:string|null;decision_options:SavedOption[];decision_reflections:SavedReflection[];saved_explanation:{state:'saved';revision:number;snapshot:{basis:'journal'|'criteria';confidence:'high'|'medium'|'low';coldStart:boolean;evidenceState:'personal_fit'|'insufficient';scoredAt:string;options:EvidenceOption[]}}|{state:'unavailable';revision:number}}
export interface SavedComparison {decisionId:string;revision:number;options:{id:string;label:string;score:number;breakdown:Record<string,number>;reasons:string[];warning:boolean}[];evidenceSnapshotState:'saved'|'unavailable';evidenceState:'personal_fit'|'insufficient';criteriaAssessment?:unknown}
export interface ReflectionInput {rating:number;wouldRepeat?:boolean|null;hasRegrets?:boolean|null;wouldRecommend?:boolean|null;wouldChooseAgain?:boolean|null;notes?:string}
export interface DecisionSuggestion {id:string;kind:'criterion';label:string;statement:string;scope:string;evidenceIds:string[];questionIds:string[];observedAt:string|null;requiresConfirmation:true}
export class DecisionApiError extends Error {constructor(public status:number,public code:string,message:string){super(message);this.name='DecisionApiError';}}
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const text=(v:unknown):v is string=>typeof v==='string';
const number=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const integer=(v:unknown):v is number=>number(v)&&Number.isSafeInteger(v)&&v>=0;
const uuid=(v:unknown):v is string=>text(v)&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const nullableText=(v:unknown):v is string|null=>v===null||text(v);
const nullableBool=(v:unknown)=>v===null||typeof v==='boolean';
const numbers=(v:unknown)=>object(v)&&Object.values(v).every(number);
const status=(v:unknown):v is DecisionStatus=>text(v)&&['open','decided','reflected','abandoned'].includes(v);
const strings=(v:unknown):v is string[]=>Array.isArray(v)&&v.every(text);
const invalid=()=>new DecisionApiError(400,'invalid_input','Review this decision before saving.');
const unavailable=()=>new DecisionApiError(503,'unavailable','Could not read this decision. Refresh and try again.');
function entry(v:unknown):v is JournalEntry{return object(v)&&uuid(v.id)&&text(v.question)&&text(v.category)&&status(v.status)&&text(v.created_at)&&nullableText(v.decided_at)&&nullableText(v.selected_option_id)&&nullableText(v.reflection_due_at)&&typeof v.reminder_enabled==='boolean';}
function page(v:unknown):v is JournalPage{return object(v)&&Array.isArray(v.decisions)&&v.decisions.length<=50&&v.decisions.every(entry)&&object(v.pagination)&&[v.pagination.offset,v.pagination.limit,v.pagination.total].every(integer)&&(v.pagination.nextOffset===null||integer(v.pagination.nextOffset))&&v.consistency==='live';}
function detail(v:unknown):v is DecisionRecord{
 if(!entry(v)||!object(v)||!integer(v.comparison_revision)||!object(v.context)||!nullableText(v.expected_outcome)||!Array.isArray(v.decision_options)||v.decision_options.length<2||v.decision_options.length>8||!Array.isArray(v.decision_reflections)||!object(v.saved_explanation))return false;
 if(!meaning(v.context)||!v.decision_options.every(o=>object(o)&&uuid(o.id)&&text(o.label)&&(o.rank===null||integer(o.rank))&&(o.score===null||number(o.score))&&(o.score_breakdown===null||numbers(o.score_breakdown))))return false;
 if(!v.decision_reflections.every(r=>object(r)&&integer(r.rating)&&r.rating>=1&&r.rating<=5&&nullableBool(r.would_repeat)&&nullableBool(r.has_regrets)&&nullableBool(r.would_recommend)&&nullableBool(r.would_choose_again)&&nullableText(r.notes)))return false;
 const e=v.saved_explanation;if(e.revision!==v.comparison_revision)return false;
 if(e.state==='unavailable')return true;
 if(e.state!=='saved'||!object(e.snapshot)||!['journal','criteria'].includes(String(e.snapshot.basis))||!['high','medium','low'].includes(String(e.snapshot.confidence))||typeof e.snapshot.coldStart!=='boolean'||!['personal_fit','insufficient'].includes(String(e.snapshot.evidenceState))||!text(e.snapshot.scoredAt)||!Array.isArray(e.snapshot.options)||e.snapshot.options.length!==v.decision_options.length)return false;
 const savedOptions=v.decision_options;
 return e.snapshot.options.every(o=>object(o)&&text(o.label)&&savedOptions.some((option:unknown)=>object(option)&&option.label===o.label)&&number(o.score)&&strings(o.reasons)&&typeof o.warning==='boolean'&&object(o.sourceCounts)&&[o.sourceCounts.preferences,o.sourceCounts.decisions,o.sourceCounts.reflections].every(integer));
}
function comparison(v:unknown):v is SavedComparison{return object(v)&&uuid(v.decisionId)&&integer(v.revision)&&Array.isArray(v.options)&&v.options.length>=2&&v.options.length<=8&&v.options.every(o=>object(o)&&uuid(o.id)&&text(o.label)&&number(o.score)&&numbers(o.breakdown)&&strings(o.reasons)&&typeof o.warning==='boolean')&&['saved','unavailable'].includes(String(v.evidenceSnapshotState))&&['personal_fit','insufficient'].includes(String(v.evidenceState));}
// The existing Supabase relation is one-to-one: its wire shape is null or an
// object, while historical fixtures used arrays. Keep one native collection.
function normalizeDecision(v:unknown):unknown{
 if(!object(v))return v;
 return {...v,decision_reflections:v.decision_reflections===null?[]:object(v.decision_reflections)?[v.decision_reflections]:v.decision_reflections};
}
function meaning(v:Record<string,unknown>){return (v.domain===undefined||text(v.domain))&&(v.goal===undefined||text(v.goal))&&(v.optionDetails===undefined||object(v.optionDetails)&&Object.values(v.optionDetails).every(text))&&(v.appliedSetting===undefined||object(v.appliedSetting)&&uuid(v.appliedSetting.id)&&integer(v.appliedSetting.generation));}
export function validDecisionInput(v:unknown):v is CreateDecisionInput{
 if(!object(v)||!uuid(v.requestId)||!Array.isArray(v.options)||v.options.length<2||v.options.length>8||!v.options.every(o=>text(o)&&!!o.trim()&&o.length<=80)||new Set(v.options.map(o=>o.trim().toLowerCase())).size!==v.options.length||!text(v.title)||v.title.length>120||!object(v.context)||!meaning(v.context)||!text(v.context.domain)||!v.context.domain.trim()||v.context.domain.length>100||v.context.meaningConfirmed!==true)return false;
 return !parseCriteriaInput(v.context,v.options).error;
}
/** Shared production endpoints, native bearer identity, and no automatic mutations/retries. */
export class DecisionApi {
 private origin:string;private token:()=>Promise<string|null>;private fetcher:typeof fetch;
 constructor(options:{baseUrl:string;accessToken:()=>Promise<string|null>;fetch?:typeof fetch}){
  const u=new URL(options.baseUrl);if(u.protocol!=='https:'||u.pathname!=='/'||u.username||u.password||u.search||u.hash)throw new Error('A valid HTTPS Nudge origin is required.');
  this.origin=u.origin;this.token=options.accessToken;this.fetcher=options.fetch??fetch;
 }
 async list(input:JournalInput={}):Promise<JournalPage>{
  if(input.query!==undefined&&(typeof input.query!=='string'||input.query.length>120)||input.status!==undefined&&!status(input.status)
   ||input.category!==undefined&&!SETTING_CATEGORIES.includes(input.category)||input.offset!==undefined&&(!integer(input.offset)||input.offset>100000)
   ||input.limit!==undefined&&(!integer(input.limit)||input.limit<1||input.limit>50))throw invalid();
  const params=new URLSearchParams({limit:String(input.limit??20),offset:String(input.offset??0)});
  if(input.query?.trim())params.set('q',input.query.trim());if(input.status)params.set('status',input.status);if(input.category)params.set('category',input.category);
  return this.call('/api/v1/decisions?'+params,'GET',undefined,page);
 }
 async get(id:string):Promise<DecisionRecord>{this.id(id);const data=await this.call('/api/v1/decisions/'+id,'GET',undefined,(v):v is {decision:unknown}=>object(v)&&detail(normalizeDecision(v.decision)));return normalizeDecision(data.decision) as DecisionRecord;}
 async create(input:CreateDecisionInput):Promise<SavedComparison>{if(!validDecisionInput(input))throw invalid();const result=await this.call('/api/v1/decisions','POST',input,(v):v is {comparison:SavedComparison}=>object(v)&&comparison(v.comparison));return result.comparison;}
 async refresh(id:string,revision:number,extraLabel?:string):Promise<SavedComparison>{this.id(id);if(!integer(revision)||extraLabel!==undefined&&(!extraLabel.trim()||extraLabel.length>80))throw invalid();const result=await this.call('/api/v1/decisions/'+id+'/comparison','POST',{revision,...(extraLabel?{extraLabel}:{})},(v):v is {comparison:SavedComparison}=>object(v)&&comparison(v.comparison));return result.comparison;}
 async choose(id:string,optionId:string):Promise<{decisionId:string;selectedOptionId:string;status:'decided'|'reflected'}>{this.id(id);this.id(optionId);return this.call('/api/v1/decisions/'+id+'/choice','POST',{optionId},(v):v is {decisionId:string;selectedOptionId:string;status:'decided'|'reflected'}=>object(v)&&v.decisionId===id&&v.selectedOptionId===optionId&&['decided','reflected'].includes(String(v.status)));}
 async abandon(id:string):Promise<{abandoned:true;decisionId:string;status:'abandoned'}>{this.id(id);return this.call('/api/v1/decisions/'+id+'/abandon','POST',{},(v):v is {abandoned:true;decisionId:string;status:'abandoned'}=>object(v)&&v.abandoned===true&&v.decisionId===id&&v.status==='abandoned');}
 async reflect(id:string,input:ReflectionInput):Promise<{decisionId:string;saved:boolean}>{this.id(id);if(!integer(input.rating)||input.rating<1||input.rating>5||input.notes!==undefined&&input.notes.length>500)throw invalid();return this.call('/api/v1/decisions/'+id+'/reflection','POST',input,(v):v is {decisionId:string;saved:boolean}=>object(v)&&v.decisionId===id&&typeof v.saved==='boolean');}
 async reminder(id:string,input:{enabled:boolean;dueAt:string|null}):Promise<{decisionId:string;enabled:boolean;dueAt:string|null;reminderVersion:number}>{
  this.id(id);const {enabled,dueAt}=input;
  if(typeof enabled!=='boolean'||(enabled?typeof dueAt!=='string'||!Number.isFinite(Date.parse(dueAt))||new Date(dueAt).toISOString()!==dueAt:dueAt!==null))throw invalid();
  return this.call('/api/v1/decisions/'+id+'/reminder','POST',{enabled,dueAt},(v):v is {decisionId:string;enabled:boolean;dueAt:string|null;reminderVersion:number}=>object(v)&&v.decisionId===id&&v.enabled===enabled&&v.dueAt===dueAt&&integer(v.reminderVersion));
 }
 async suggestions(domain:string,category?:string):Promise<{generation:number;suggestions:DecisionSuggestion[]}>{return this.call('/api/v1/discovery/suggestions','POST',{domain,category},(v):v is {generation:number;suggestions:DecisionSuggestion[]}=>object(v)&&integer(v.generation)&&Array.isArray(v.suggestions)&&v.suggestions.length<=3&&v.suggestions.every(s=>object(s)&&text(s.id)&&text(s.label)&&text(s.statement)&&text(s.scope)&&strings(s.evidenceIds)&&strings(s.questionIds)&&s.kind==='criterion'&&s.requiresConfirmation===true),false);}
 private id(value:string){if(!uuid(value))throw invalid();}
 private async call<T>(path:string,method:string,body:unknown,valid:(v:unknown)=>v is T,envelope=true):Promise<T>{
  // Serialize before yielding to token refresh. UI retries use this same unchanged body.
  let wire:string|undefined;try{wire=body===undefined?undefined:JSON.stringify(body);}catch{throw invalid();}
  const maximum=path==='/api/v1/decisions'?512*1024:path.endsWith('/reflection')?8192:24000;
  if(wire&&[...wire].reduce((n,c)=>n+(c.codePointAt(0)!<=127?1:c.codePointAt(0)!<=2047?2:c.codePointAt(0)!<=65535?3:4),0)>maximum)throw new DecisionApiError(413,'payload_too_large','This decision is too long. Shorten the notes and try again.');
  const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
  const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new DecisionApiError(0,'timeout',method==='GET'?'This is taking longer to load. Check your connection, then reload.':'Nudge is taking longer than expected. Your change may have saved. Reload, or retry the same change when offered.'));},20000);});
  const run=async()=>{
   const token=await this.token();if(!token||/[\s,]/.test(token))throw new DecisionApiError(401,'unauthenticated','Sign in again to continue.');if(controller.signal.aborted)throw unavailable();
   const response=await this.fetcher(this.origin+path,{method,headers:{Accept:'application/json',Authorization:'Bearer '+token,...(wire?{'Content-Type':'application/json'}:{})},...(wire?{body:wire}:{}),credentials:'omit',cache:'no-store',redirect:'error',signal:controller.signal});
   if(response.url&&new URL(response.url).origin!==this.origin)throw unavailable();
   let value:unknown;try{value=await response.json();}catch{throw unavailable();}
   if(!response.ok){if(object(value)&&object(value.error)&&text(value.error.code)&&text(value.error.message)&&value.error.message.length<=1000)throw new DecisionApiError(response.status,value.error.code,value.error.message);throw unavailable();}
   if(envelope){if(!object(value)||value.apiVersion!=='1')throw unavailable();value=value.data;}
   if(!valid(value))throw unavailable();return value;
  };
  try{return await Promise.race([run(),timeout]);}catch(error){if(error instanceof DecisionApiError)throw error;throw new DecisionApiError(0,'offline',method==='GET'?'Could not load this decision. Check your connection, then reload.':'Could not reach Nudge. Your change may have saved. Check your connection, then reload or retry the same change.');}finally{if(timer)clearTimeout(timer);}
 }
}
