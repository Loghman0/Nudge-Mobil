export const SETTING_CATEGORIES=['food','entertainment','travel','shopping','lifestyle','work','social','health','career','relationships','finance','hobbies','other'] as const;
export type SettingCategory=typeof SETTING_CATEGORIES[number];
export interface SettingAlias{term:string;meaning:string}
export interface SettingDraft{id:string|null;name:string;domain:string;category:SettingCategory;goal:string;aliases:SettingAlias[];generation:number}
export interface SavedSetting extends Omit<SettingDraft,'generation'|'id'>{id:string;memory_generation:number;created_at:string;updated_at:string}
export interface SettingsState{available:true;generation:number;settings:SavedSetting[]}
const settingDomainKey=(value:string)=>value.trim().replace(/\s+/gu,' ').toLowerCase();

export function matchingSavedPriorities(settings:SavedSetting[],domain:string,category?:SettingCategory){
 const scope=settingDomainKey(domain);
 if(!scope)return [];
 const broad=['everyday life','real life','daily life'].includes(scope);
 return settings.filter(setting=>setting.goal.trim()&&setting.aliases.length===0&&settingDomainKey(setting.domain)===scope
  &&(category?setting.category===category:!broad));
}
/** Matches web applyComparisonAliases: exact whole label, no synonym guessing or overwriting user notes. */
export function savedSettingFields(setting:SavedSetting,expectedGeneration:number,labels:string[],currentDetails:Record<string,string>){
 if(setting.memory_generation!==expectedGeneration)throw new SettingsApiError(409,'changed','Reload this saved setting before applying it.');
 const details=new Map(Object.entries(currentDetails)),applied=new Map<string,string>();
 const aliases=new Map(setting.aliases.map(alias=>[alias.term.trim().toLowerCase(),alias.meaning]));
 for(const label of labels.map(value=>value.trim()).filter(Boolean)){
  const meaning=aliases.get(label.toLowerCase());if(meaning&&!details.get(label)?.trim()){details.set(label,meaning);applied.set(label,meaning);}
 }
 return {domain:setting.domain,category:setting.category,goal:setting.goal,optionDetails:Object.fromEntries(details),appliedAliases:Object.fromEntries(applied),appliedSetting:{id:setting.id,generation:expectedGeneration}};
}
export interface FoundationQuestion{id:string;prompt:string;optionA:string;optionB:string;rationale:string;saved:'a'|'b'|'skip'|null}
export interface FoundationState{generation:number;completed:boolean;available:boolean;questions:FoundationQuestion[];milestones:{id:string;title:string;description:string;earnedAt:string}[]}
export interface FoundationInput{expectedGeneration:number;answers:{questionId:string;answer:'a'|'b'|'skip'}[]}
export class SettingsApiError extends Error{constructor(public status:number,public code:string,message:string){super(message);this.name='SettingsApiError';}}
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const uuid=(value:unknown):value is string=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const generation=(value:unknown):value is number=>typeof value==='number'&&Number.isSafeInteger(value)&&value>=0;
const text=(value:unknown,max:number,required=false):value is string=>typeof value==='string'&&value.length<=max&&(!required||!!value.trim());
export function validSettingDraft(value:unknown):value is SettingDraft{
 if(!record(value)||value.id!==null&&!uuid(value.id)||!generation(value.generation)||!text(value.name,80,true)||!text(value.domain,100,true)||!text(value.goal,300)||!SETTING_CATEGORIES.includes(value.category as SettingCategory)||!Array.isArray(value.aliases)||value.aliases.length>12)return false;
 const terms=new Set<string>();
 for(const alias of value.aliases){if(!record(alias)||!text(alias.term,80,true)||!text(alias.meaning,500,true))return false;const key=alias.term.trim().replace(/\s+/gu,' ').toLowerCase();if(terms.has(key))return false;terms.add(key);}
 return true;
}
function setting(value:unknown):value is SavedSetting{return record(value)&&uuid(value.id)&&text(value.created_at,80)&&text(value.updated_at,80)&&validSettingDraft({...value,generation:value.memory_generation});}
function state(value:unknown):value is SettingsState{return record(value)&&value.available===true&&generation(value.generation)&&Array.isArray(value.settings)&&value.settings.length<=20&&value.settings.every(row=>setting(row)&&row.memory_generation===value.generation);}
function foundation(value:unknown):value is FoundationState{
 return record(value)&&generation(value.generation)&&typeof value.completed==='boolean'&&typeof value.available==='boolean'&&Array.isArray(value.questions)&&value.questions.length<=6&&(!value.available||value.questions.length===6)&&value.questions.every(q=>record(q)&&uuid(q.id)&&text(q.prompt,2000)&&text(q.optionA,1000)&&text(q.optionB,1000)&&text(q.rationale,2000)&&(q.saved===null||['a','b','skip'].includes(String(q.saved))))&&Array.isArray(value.milestones)&&value.milestones.length<=50&&value.milestones.every(m=>record(m)&&text(m.id,100)&&text(m.title,500)&&text(m.description,2000)&&text(m.earnedAt,80));
}
const unavailable=()=>new SettingsApiError(503,'unavailable','Could not load this step. Reload and try again.');
export class SettingsApi{
 protected base:string;protected token:()=>Promise<string|null>;protected transport:typeof fetch;
 constructor(options:{baseUrl:string;accessToken:()=>Promise<string|null>;fetch?:typeof fetch}){
  const url=new URL(options.baseUrl);if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.hash||url.search)throw new Error('Settings need a valid HTTPS origin.');this.base=url.origin;this.token=options.accessToken;this.transport=options.fetch??fetch;
 }
 list(){return this.call('decision-settings','GET',undefined,(value):value is {state:SettingsState}=>record(value)&&state(value.state));}
 get(id:string,expectedGeneration:number){if(!uuid(id)||!generation(expectedGeneration))throw new SettingsApiError(400,'invalid_request','Reload settings before applying one.');return this.call(`decision-settings?id=${id}&generation=${expectedGeneration}`,'GET',undefined,(value):value is {setting:SavedSetting;generation:number}=>record(value)&&value.generation===expectedGeneration&&setting(value.setting)&&value.setting.id===id&&value.setting.memory_generation===expectedGeneration);}
 save(input:SettingDraft){if(!validSettingDraft(input))throw new SettingsApiError(400,'invalid_request','Review the name, setting and explicit meanings before saving.');return this.call('decision-settings','POST',input,(value):value is {saved:true;id:string}=>record(value)&&value.saved===true&&uuid(value.id));}
 async rememberPriority(domain:string,category:SettingCategory,priority:string){
  const goal=priority.trim();
  const input:SettingDraft={id:null,name:goal,goal,domain:settingDomainKey(domain),category,aliases:[],generation:0};
  if(!validSettingDraft(input))throw new SettingsApiError(400,'invalid_request','Enter a priority in 80 characters or fewer for this setting.');
  const {state}=await this.list();
  const matches=(settings:SavedSetting[])=>matchingSavedPriorities(settings,domain,category)
   .find(setting=>setting.name.toLowerCase()===goal.toLowerCase()&&setting.goal.toLowerCase()===goal.toLowerCase());
  const saved=matches(state.settings);
  if(saved)return {saved:true as const,id:saved.id};
  try{return await this.save({...input,generation:state.generation});}
  catch(error){
   if(error instanceof SettingsApiError&&(error.status===0||error.status>=500||error.code==='limit')){
    const latest=await this.list().catch(()=>null);
    const recovered=latest&&matches(latest.state.settings);
    if(recovered)return {saved:true as const,id:recovered.id};
   }
   throw error;
  }
 }
 remove(id:string,expectedGeneration:number){if(!uuid(id)||!generation(expectedGeneration))throw new SettingsApiError(400,'invalid_request','Reload settings before deleting.');return this.call('decision-settings','DELETE',{id,generation:expectedGeneration},(value):value is {saved:true}=>record(value)&&value.saved===true);}
 protected async call<T>(path:string,method:string,body:unknown,validate:(value:unknown)=>value is T):Promise<T>{
  const wire=body===undefined?undefined:JSON.stringify(body);if(wire&&wire.length>65536)throw new SettingsApiError(413,'too_large','This change is too long.');
  const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
  const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new SettingsApiError(0,'timeout',method==='GET'?'This is taking longer than expected. Reload and try again.':'This change may have saved. Reload before making another change.'));},20000);});
  const perform=async()=>{
   const token=await this.token();if(!token||/[\s,]/.test(token))throw new SettingsApiError(401,'unauthenticated','Sign in again to continue.');if(controller.signal.aborted)throw unavailable();
   const response=await this.transport(this.base+'/api/v1/'+path,{method,headers:{Accept:'application/json',Authorization:'Bearer '+token,...(wire===undefined?{}:{'Content-Type':'application/json'})},...(wire===undefined?{}:{body:wire}),credentials:'omit',cache:'no-store',redirect:'error',signal:controller.signal});
   if(response.url&&new URL(response.url).origin!==this.base)throw unavailable();
   let value:unknown;try{value=await response.json();}catch{throw unavailable();}
   if(!response.ok){if(record(value)&&record(value.error)&&['changed','limit','not_found','invalid_request','too_large','unavailable','forbidden','needs_terms','unauthenticated'].includes(String(value.error.code))&&text(value.error.message,1000,true))throw new SettingsApiError(response.status,String(value.error.code),value.error.message);throw unavailable();}
   if(!validate(value))throw unavailable();return value;
  };
  try{return await Promise.race([perform(),timeout]);}catch(error){if(error instanceof SettingsApiError)throw error;throw new SettingsApiError(0,'offline',method==='GET'?'Could not reach Nudge. Check your connection and reload.':'Could not confirm this change. Reload before making another change.');}finally{if(timer!==undefined)clearTimeout(timer);}
 }
}
export class FoundationApi extends SettingsApi{
 read(){return this.call('foundation','GET',undefined,foundation);}
 complete(input:FoundationInput){
  if(!generation(input.expectedGeneration)||!Array.isArray(input.answers)||input.answers.length>6||new Set(input.answers.map(a=>a.questionId)).size!==input.answers.length||input.answers.some(a=>!uuid(a.questionId)||!['a','b','skip'].includes(a.answer)))throw new SettingsApiError(400,'invalid_request','Review these starter answers before saving.');
  return this.call('foundation','POST',input,(value):value is {saved:true;generation:number}=>record(value)&&value.saved===true&&generation(value.generation));
 }
}
