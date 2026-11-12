export interface AccountBasics{full_name:string|null;country:string|null;language:string|null;occupation:string|null}
export interface AccountProfile extends AccountBasics{timezone:string;ai_enabled:boolean;terms_version:string|null;memory_generation:number}
export interface AccountSnapshot{profile:AccountProfile;policyVersion:string;minimumAge:number;aiAvailable:boolean}
export interface CheckIn{id:string;title:string;body:string|null;payload:{decision_id?:string};read_at:string|null;created_at:string}
export class AccountApiError extends Error{constructor(public status:number,public code:string,message:string){super(message);this.name='AccountApiError';}}
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const nullableString=(v:unknown)=>v===null||typeof v==='string';
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const saved=(v:unknown):v is {saved:true}=>record(v)&&v.saved===true;
const unavailable=()=>new AccountApiError(503,'unavailable','Could not load this account step. Check your connection and reload.');
function snapshot(v:unknown):v is AccountSnapshot{
 if(!record(v)||!record(v.profile)||typeof v.policyVersion!=='string'||!Number.isSafeInteger(v.minimumAge)||typeof v.aiAvailable!=='boolean')return false;
 const p=v.profile;return ['full_name','country','language','occupation','terms_version'].every(key=>nullableString(p[key]))&&typeof p.timezone==='string'&&typeof p.ai_enabled==='boolean'&&typeof p.memory_generation==='number'&&Number.isSafeInteger(p.memory_generation)&&p.memory_generation>=0;
}
function checkins(v:unknown):v is {checkins:CheckIn[]}{
 return record(v)&&Array.isArray(v.checkins)&&v.checkins.length<=50&&v.checkins.every(c=>record(c)&&uuid(c.id)&&typeof c.title==='string'&&nullableString(c.body)&&nullableString(c.read_at)&&typeof c.created_at==='string'&&record(c.payload)&&(c.payload.decision_id===undefined||uuid(c.payload.decision_id)));
}
export class AccountApi{
 private syncedZone:string|null=null;private syncingZone:Promise<void>|null=null;
 private base:string;private transport:typeof fetch;private token:()=>Promise<string|null>;
 constructor(options:{baseUrl:string;accessToken:()=>Promise<string|null>;fetch?:typeof fetch}){
  const u=new URL(options.baseUrl);if(u.protocol!=='https:'||u.username||u.password||u.pathname!=='/'||u.hash||u.search)throw new Error('Account access needs an HTTPS origin.');this.base=u.origin;this.transport=options.fetch??fetch;this.token=options.accessToken;
 }
 profile(){return this.call('profile','GET',undefined,snapshot);}
 basics(value:AccountBasics){return this.call('basics','PATCH',value,saved);}
 timezone(timezone:string){return this.call('timezone','POST',{timezone},saved);}
 async syncDeviceTimezone():Promise<void>{
  let zone:string;try{zone=Intl.DateTimeFormat().resolvedOptions().timeZone;if(!zone)return;new Intl.DateTimeFormat('en',{timeZone:zone});}catch{return;}
  if(this.syncingZone){await this.syncingZone;return this.syncDeviceTimezone();}
  if(this.syncedZone===zone)return;
  this.syncingZone=this.timezone(zone).then(()=>{this.syncedZone=zone;});
  try{await this.syncingZone;}finally{this.syncingZone=null;}
 }
 ai(enabled:boolean){return this.call('ai','POST',{enabled},saved);}
 terms(version:string,eligible:true,accepted:true){return this.call('terms','POST',{version,eligible,accepted},saved);}
 reset(confirmation:'FORGET'){return this.call('reset','POST',{confirmation},saved);}
 deleteHistory(confirmation:'DELETE HISTORY'){return this.call('history','DELETE',{confirmation},saved);}
 checkins(){return this.call('checkins','GET',undefined,checkins);}
 dismiss(id:string|'all'){if(id!=='all'&&!uuid(id))throw new AccountApiError(400,'invalid_request','This check-in is unavailable.');return this.call('checkins/'+id,'PATCH',{},saved);}
 deleteAccount(confirmation:'DELETE'){return this.call('delete','DELETE',{confirmation},(v):v is {deleted:true}=>record(v)&&v.deleted===true);}
 exportData(){return this.call('export','GET',undefined,(v):v is Record<string,unknown>=>record(v)&&v.export_version===6&&typeof v.exported_at==='string'&&record(v.account)&&uuid(v.account.id)&&record(v.profile)&&Array.isArray(v.decisions)&&record(v.discovery),60000);}
 private async call<T>(path:string,method:string,body:unknown,validate:(v:unknown)=>v is T,timeoutMs=20000):Promise<T>{
  const wire=body===undefined?undefined:JSON.stringify(body);if(wire&&wire.length>8192)throw new AccountApiError(413,'too_large','This change is too long.');
  const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
  const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new AccountApiError(0,'timeout',method==='GET'?'This is taking longer than expected. Try loading again.':'This change may have saved. Reload your account before making another change.'));},timeoutMs);});
  const perform=async()=>{
   const token=await this.token();if(!token||/[\s,]/.test(token))throw new AccountApiError(401,'unauthenticated','Sign in again to continue.');if(controller.signal.aborted)throw unavailable();
   const response=await this.transport(this.base+'/api/v1/account/'+path,{method,headers:{Accept:'application/json',Authorization:'Bearer '+token,...(wire===undefined?{}:{'Content-Type':'application/json'})},...(wire===undefined?{}:{body:wire}),credentials:'omit',cache:'no-store',redirect:'error',signal:controller.signal});
   if(response.url&&new URL(response.url).origin!==this.base)throw unavailable();
   if(response.status===404)throw new AccountApiError(404,'not_found','This account feature is not available on the server yet. Try again after the app is updated.');
   let data:unknown;try{data=await response.json();}catch{throw unavailable();}
   if(!response.ok){if(record(data)&&record(data.error)&&typeof data.error.code==='string'&&['invalid_request','too_large','unavailable','not_found','unauthenticated','needs_terms','forbidden','reauthenticate'].includes(data.error.code)&&typeof data.error.message==='string'&&data.error.message.length<=1000)throw new AccountApiError(response.status,data.error.code,data.error.message);throw unavailable();}
   if(!validate(data))throw unavailable();return data;
  };
  try{return await Promise.race([perform(),timeout]);}catch(error){if(error instanceof AccountApiError)throw error;throw new AccountApiError(0,'offline',method==='GET'?'Could not reach Nudge. Check your connection and try again.':'Could not confirm this change. Reload your account before trying again.');}finally{if(timer!==undefined)clearTimeout(timer);}
 }
}
