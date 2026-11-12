export type PushSettings={enabled:false}|{enabled:true;token:string;timeZone:string;quietStart:number;quietEnd:number};
export interface PushIntent{installationId:string;secret:string;epoch:number;settings:PushSettings}
export interface PushReceipt{saved:true;enabled:boolean;epoch:number}
export interface PushState{configured:boolean;device:null|{enabled:boolean;time_zone:string;quiet_start:number;quiet_end:number;expires_at:string}}
export interface PushPreferences{timeZone:string;quietStart:number;quietEnd:number}
export interface PushRegistration{version:1;installationId:string;secret:string;epoch:number;ownerId:string|null;desired:boolean;preferences:PushPreferences;pending:{ownerId:string;intent:PushIntent}|null}
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
export const pushUuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const epoch=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0;
export function validPushPreferences(v:unknown):v is PushPreferences{
 if(!record(v)||typeof v.timeZone!=='string'||!v.timeZone||v.timeZone.length>64||!Number.isInteger(v.quietStart)||Number(v.quietStart)<0||Number(v.quietStart)>1439||!Number.isInteger(v.quietEnd)||Number(v.quietEnd)<0||Number(v.quietEnd)>1439)return false;
 try{new Intl.DateTimeFormat('en-US',{timeZone:v.timeZone}).format(0);return true;}catch{return false;}
}
export function validPushIntent(v:unknown):v is PushIntent{
 if(!record(v)||!pushUuid(v.installationId)||typeof v.secret!=='string'||!/^[a-f0-9]{64}$/.test(v.secret)||!epoch(v.epoch)||v.epoch<1||!record(v.settings))return false;
 if(v.settings.enabled===false)return Object.keys(v.settings).length===1;
 return v.settings.enabled===true&&typeof v.settings.token==='string'&&v.settings.token.length>=20&&v.settings.token.length<=4096&&/^[A-Za-z0-9:_.~-]+$/.test(v.settings.token)&&validPushPreferences(v.settings);
}
export function parsePushRegistration(raw:string|null):PushRegistration|null{
 if(raw===null)return null;
 try{
  if(raw.length>20000)throw Error();const v:unknown=JSON.parse(raw);
  if(!record(v)||v.version!==1||!pushUuid(v.installationId)||typeof v.secret!=='string'||!/^[a-f0-9]{64}$/.test(v.secret)||!epoch(v.epoch)||!(v.ownerId===null||pushUuid(v.ownerId))||typeof v.desired!=='boolean'||!validPushPreferences(v.preferences))throw Error();
  if(v.pending!==null&&(!record(v.pending)||!pushUuid(v.pending.ownerId)||v.pending.ownerId!==v.ownerId||!validPushIntent(v.pending.intent)||v.pending.intent.epoch!==v.epoch||v.pending.intent.installationId!==v.installationId||v.pending.intent.secret!==v.secret))throw Error();
  return v as unknown as PushRegistration;
 }catch{throw new Error('Could not read this device’s notification registration. Your answers are unaffected.');}
}
const key='nudge.push.installation.v1';
/** One encrypted record and a serialized read/modify/write sequence across accounts. */
export class PushRegistrationRepository{
 private pending:Promise<unknown>=Promise.resolve();
 constructor(private storage:{getItem:(key:string)=>Promise<string|null>;setItem:(key:string,value:string)=>Promise<void>},private create:()=>Promise<{installationId:string;secret:string}>){ }
 private serial<T>(run:()=>Promise<T>):Promise<T>{const next=this.pending.catch(()=>{}).then(run);this.pending=next;return next;}
 read(){return this.serial(()=>this.load());}
 private async load(){return parsePushRegistration(await this.storage.getItem(key));}
 private async write(value:PushRegistration){await this.storage.setItem(key,JSON.stringify(value));return value;}
 ensure(timeZone:string){return this.serial(async()=>{const existing=await this.load();if(existing)return existing;const created=await this.create();const value:PushRegistration={version:1,...created,epoch:0,ownerId:null,desired:false,preferences:{timeZone,quietStart:1320,quietEnd:480},pending:null};parsePushRegistration(JSON.stringify(value));return this.write(value);});}
 prepare(ownerId:string,settings:PushSettings){return this.serial(async()=>{
  if(!pushUuid(ownerId))throw Error('Sign in again to change notifications.');const existing=await this.load();if(!existing||existing.epoch>=Number.MAX_SAFE_INTEGER)throw Error('Could not prepare this device registration.');
  const intent:PushIntent={installationId:existing.installationId,secret:existing.secret,epoch:existing.epoch+1,settings:JSON.parse(JSON.stringify(settings))};if(!validPushIntent(intent))throw Error('Review notification settings.');
  await this.write({...existing,ownerId,epoch:intent.epoch,desired:settings.enabled,preferences:settings.enabled?{timeZone:settings.timeZone,quietStart:settings.quietStart,quietEnd:settings.quietEnd}:existing.preferences,pending:{ownerId,intent}});return intent;
 });}
 confirm(ownerId:string,receipt:PushReceipt){return this.serial(async()=>{const existing=await this.load();if(existing?.pending?.ownerId!==ownerId||existing.epoch!==receipt.epoch)return false;await this.write({...existing,desired:receipt.enabled,pending:null});return true;});}
}
export function notificationDecision(data:unknown,userId:string|null):string|null{
 if(!record(data)||!userId||data.recipientUserId!==userId||!pushUuid(data.notificationId)||!pushUuid(data.decisionId))return null;return data.decisionId;
}
export type DailyNotificationQuestion={questionId:string;questionVersion:number};
export function notificationQuestion(data:unknown,userId:string|null):DailyNotificationQuestion|null{
 if(!record(data)||!userId||data.recipientUserId!==userId||data.kind!=='daily_question'||!pushUuid(data.notificationId))return null;
 const {questionId,questionVersion}=data;
 if(typeof questionId!=='string'||!/^[a-z0-9-]{1,96}$/.test(questionId)||typeof questionVersion!=='string'||!/^\d{1,8}$/.test(questionVersion)||Number(questionVersion)<1)return null;
 return {questionId,questionVersion:Number(questionVersion)};
}
export function quietMinute(value:string):number|null{const match=/^(\d{2}):(\d{2})$/.exec(value);if(!match)return null;const hour=Number(match[1]),minute=Number(match[2]);return hour<24&&minute<60?hour*60+minute:null;}
export function quietLabel(value:number){return `${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`;}
