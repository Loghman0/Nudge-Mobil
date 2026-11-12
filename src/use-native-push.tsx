import {createContext,useContext,useEffect,useRef,useState} from 'react';
import {AppState,Platform} from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Crypto from 'expo-crypto';
import {secureStorage} from './secure-storage';
import {MoreApi,MoreApiError} from './more-api';
import {PushRegistrationRepository,notificationDecision,notificationQuestion,type DailyNotificationQuestion,type PushPreferences,type PushRegistration,type PushSettings} from './push-registration';
import {requestPushPermission,shouldAskPushOnce} from './push-permission';

const repository=new PushRegistrationRepository(secureStorage,async()=>({installationId:Crypto.randomUUID(),secret:Array.from(await Crypto.getRandomBytesAsync(32),v=>v.toString(16).padStart(2,'0')).join('')}));
let nativeWork:Promise<unknown>=Promise.resolve();
function serialNative<T>(run:()=>Promise<T>){const next=nativeWork.catch(()=>{}).then(run);nativeWork=next;return next;}
async function bounded<T>(promise:Promise<T>,timeout=10000){let timer:ReturnType<typeof setTimeout>|undefined;try{return await Promise.race([promise,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('Phone notification setup is taking too long. Try again later.')),timeout);})]);}finally{if(timer)clearTimeout(timer);}}
function deviceZone(){try{return Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';}catch{return 'UTC';}}
async function cleanupNative(){await Notifications.unregisterForNotificationsAsync();await Notifications.dismissAllNotificationsAsync();await Notifications.clearLastNotificationResponseAsync();}

export function useNativePush(userId:string|null,api:MoreApi,authReady:boolean){
 const [registration,setRegistration]=useState<PushRegistration|null>(null),[configured,setConfigured]=useState(false),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[settingsVisible,setSettingsVisible]=useState(false),[permission,setPermission]=useState('undetermined');
 const [target,setTarget]=useState<{id:string;key:string;ownerId:string}|null>(null),[renewal,setRenewal]=useState(0),[activation,setActivation]=useState(0),[promptSettled,setPromptSettled]=useState(false);
 const [dailyTarget,setDailyTarget]=useState<{question:DailyNotificationQuestion;key:string;ownerId:string}|null>(null);
 const dailyRegistration=useRef('');
 const automaticAttempt=useRef('');
 const active=useRef(userId),mounted=useRef(true),version=useRef(0),operation=useRef<number|null>(null),sequence=useRef(0),desired=useRef(false),handled=useRef('');
 const signingOut=useRef(false);
 active.current=userId;desired.current=registration?.ownerId===userId&&registration.desired===true;
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;version.current++;};},[]);
 const valid=(owner:string|null,stamp:number)=>mounted.current&&active.current===owner&&version.current===stamp;
 async function publish(owner:string|null,stamp:number){const local=await repository.read();if(valid(owner,stamp))setRegistration(local);}
 const message=(e:unknown)=>e instanceof MoreApiError||e instanceof Error?e.message:'Could not update phone notifications. In-app check-ins still work.';
 async function load(){
  const owner=userId,stamp=version.current;if(!authReady||operation.current!==null||signingOut.current)return;
  try{
   if(!owner){const existing=await repository.read();if(!valid(owner,stamp))return;if(existing?.ownerId&&(existing.desired||existing.pending)){await repository.prepare(existing.ownerId,{enabled:false});if(valid(owner,stamp))await bounded(serialNative(cleanupNative)).catch(()=>{});}return;}
   let local=await repository.ensure(deviceZone());
   if(!valid(owner,stamp))return;
   if(local.ownerId&&local.ownerId!==owner){
    const intent=await repository.prepare(owner,{enabled:false});
    if(!valid(owner,stamp))return;
    await Promise.allSettled([api.pushDevice(intent).then(receipt=>repository.confirm(owner,receipt)),bounded(serialNative(cleanupNative))]);
    local=(await repository.read())!;
   }
   if(!valid(owner,stamp))return;
   // Keep offline opt-out available without treating a failed status read as off.
   setRegistration(local);
   const [state,os]=await Promise.all([api.pushStatus(local.installationId),Notifications.getPermissionsAsync()]);
   if(!valid(owner,stamp))return;
   if(local.ownerId===owner&&local.desired&&(os.status!=='granted'||(!local.pending&&!state.device?.enabled))){
    const intent=await repository.prepare(owner,{enabled:false});await api.pushDevice(intent).then(receipt=>repository.confirm(owner,receipt));await bounded(serialNative(cleanupNative)).catch(()=>{});local=(await repository.read())!;
   }
   const fresh=await repository.read();if(fresh?.epoch!==local.epoch||operation.current!==null)return;
   if(valid(owner,stamp)){setRegistration(local);setConfigured(state.configured);setPermission(os.status);setReady(true);setActivation(value=>value+1);setError('');if(local.ownerId===owner&&local.desired&&!local.pending&&state.configured&&os.status==='granted'&&state.device?.enabled&&Date.parse(state.device.expires_at)<Date.now()+7*86400000)setRenewal(value=>value+1);}
  }catch(e){if(valid(owner,stamp)){setError(message(e));setReady(true);setPromptSettled(true);}}
 }
 useEffect(()=>{
  version.current++;operation.current=null;signingOut.current=false;automaticAttempt.current='';dailyRegistration.current='';setPromptSettled(false);setBusy(false);setReady(false);setConfigured(false);setRegistration(null);setError('');setSettingsVisible(false);setTarget(null);setDailyTarget(null);handled.current='';
  if(authReady)void load();
  const listener=AppState.addEventListener('change',state=>{if(state==='active')void load();});return()=>{listener.remove();};
 },[userId,api,authReady]);
 useEffect(()=>{
  Notifications.setNotificationHandler({handleNotification:async(notification)=>{const data=notification.request.content.data;const matches=!!(notificationDecision(data,active.current)||notificationQuestion(data,active.current))&&desired.current;return {shouldShowBanner:matches,shouldShowList:matches,shouldPlaySound:false,shouldSetBadge:false};}});
  function open(response:Notifications.NotificationResponse|null){
   if(!authReady||!response||active.current!==userId||!mounted.current)return;const data=response.notification.request.content.data,id=notificationDecision(data,userId),key=response.notification.request.identifier;
   const question=notificationQuestion(data,userId);
   if(userId&&handled.current!==key&&(id||question)){
    handled.current=key;setSettingsVisible(false);
    if(question){setTarget(null);setDailyTarget({question,key,ownerId:userId});}
    else if(id){setDailyTarget(null);setTarget({id,key,ownerId:userId});}
   }
   void Notifications.clearLastNotificationResponseAsync().catch(()=>{});
  }
  if(authReady)open(Notifications.getLastNotificationResponse());
  const listener=Notifications.addNotificationResponseReceivedListener(open);return()=>{listener.remove();Notifications.setNotificationHandler(null);};
 },[userId,authReady]);
 useEffect(()=>{
  if(!configured||permission!=='granted'||!registration||registration.ownerId!==userId||!registration.desired||registration.pending||signingOut.current)return;
  const attempt=userId+':'+registration.epoch+':'+activation;
  if(dailyRegistration.current===attempt)return;
  dailyRegistration.current=attempt;
  const stamp=version.current;
  void serialNative(async()=>{
   if(!valid(userId,stamp))return;
   await Notifications.setNotificationChannelAsync('daily_questions',{
    name:'Daily question',importance:Notifications.AndroidImportance.HIGH,
    lockscreenVisibility:Notifications.AndroidNotificationVisibility.PRIVATE,
   });
   if(valid(userId,stamp))await api.enableDailyQuestions(registration);
  }).catch(()=>{});
 },[api,activation,configured,permission,registration,userId]);
 async function submit(settings:PushSettings){
  const owner=userId,stamp=version.current;if(!owner||!valid(owner,stamp))return;
  const intent=await repository.prepare(owner,settings);if(!valid(owner,stamp))return;
  await publish(owner,stamp);const receipt=await api.pushDevice(intent);await repository.confirm(owner,receipt);
  await publish(owner,stamp);
 }
 async function action(run:()=>Promise<void>){
  if(operation.current!==null||!userId||signingOut.current)return;const stamp=version.current,owner=userId,number=++sequence.current;operation.current=number;setBusy(true);setError('');
  try{await run();}catch(e){if(valid(owner,stamp))setError(message(e));}
  finally{if(operation.current===number){operation.current=null;if(valid(owner,stamp)){setBusy(false);await publish(owner,stamp).catch(()=>{});}}}
 }
 async function enable(preferences:PushPreferences,ask=true){
  const owner=userId,stamp=version.current;await action(async()=>{
   if(!configured)throw Error('Phone notifications are not configured yet. In-app check-ins still work.');
   let cancelled=false;
   try{
    const current=()=>!cancelled&&valid(owner,stamp);
    const permission=await requestPushPermission({
     current,
     read:()=>bounded(serialNative(async()=>{if(!current())return {status:'undetermined'};await Notifications.setNotificationChannelAsync('checkins',{name:'Check-ins',importance:Notifications.AndroidImportance.DEFAULT,lockscreenVisibility:Notifications.AndroidNotificationVisibility.PRIVATE});return Notifications.getPermissionsAsync();})),
     request:()=>serialNative(async()=>current()?Notifications.requestPermissionsAsync():{status:'undetermined'}),
    },ask);
    if(!permission||!current())return;
    setPermission(permission.status);
    const result=await bounded(serialNative(async()=>{
     if(cancelled||!valid(owner,stamp))return null;
     const token=await Notifications.getDevicePushTokenAsync();if(cancelled||!valid(owner,stamp))return null;
     if(token.type!=='android'||typeof token.data!=='string')throw Error('Android notification registration is unavailable.');return token.data;
    }),30000);
    if(!result||!valid(owner,stamp))return;setPermission('granted');await submit({enabled:true,token:result,...preferences});
   }finally{cancelled=true;}
  });
 }
 async function disable(){await action(async()=>{
  const results=await Promise.allSettled([submit({enabled:false}),bounded(serialNative(cleanupNative))]);
  if(results.every(result=>result.status==='rejected'))throw Error('Could not confirm notification disconnect. You can turn notifications off in Android settings.');
 });}
 async function retry(){await action(async()=>{const local=await repository.read();if(!userId||local?.pending?.ownerId!==userId)return;const receipt=await api.pushDevice(local.pending.intent);await repository.confirm(userId,receipt);});}
 async function beforeSignOut(){
  signingOut.current=true;version.current++;operation.current=null;setBusy(true);
  const local=await repository.read();if(!userId||active.current!==userId||local?.ownerId!==userId||(!local.desired&&!local.pending))return '';
  const intent=await repository.prepare(userId,{enabled:false});
  const results=await Promise.allSettled([api.pushDevice(intent).then(receipt=>repository.confirm(userId,receipt)),bounded(serialNative(cleanupNative))]);
  return results.every(result=>result.status==='rejected')?'Phone notifications could not be fully disconnected. Turn them off in Android settings if needed.':'';
 }
 function endSignOut(){if(active.current===userId){signingOut.current=false;if(mounted.current)setBusy(false);}}
 useEffect(()=>{if(renewal&&ready&&configured&&registration?.ownerId===userId&&registration.desired&&!registration.pending)void enable({timeZone:deviceZone(),quietStart:0,quietEnd:0},false);},[renewal]);
 // Ask once per account/installation. Reopening may finish an exact pending intent,
 // but never reopens a denied permission dialog. Android settings remain authoritative.
 useEffect(()=>{
  if(!userId||!authReady||!ready||busy||Platform.OS!=='android'||AppState.currentState!=='active')return;
  if(!configured){setPromptSettled(true);return;}
  const attempt=userId+':'+activation;if(automaticAttempt.current===attempt)return;automaticAttempt.current=attempt;
  const owner=userId,stamp=version.current;
  void (async()=>{
   try{
    const key='nudge.push.prompt.v1.'+owner,seen=await secureStorage.getItem(key);if(!valid(owner,stamp))return;
    const os=await Notifications.getPermissionsAsync();if(!valid(owner,stamp))return;
    const ask=shouldAskPushOnce(os,seen==='seen');
    if(ask)await secureStorage.setItem(key,'seen');
    if(!valid(owner,stamp))return;
    if(!ask&&os.status!=='granted')return;
    const local=await repository.read();if(!valid(owner,stamp))return;
    if(local?.pending?.ownerId===owner){await retry();if((await repository.read())?.pending)return;}
    if(!valid(owner,stamp))return;
    const preferences={timeZone:deviceZone(),quietStart:0,quietEnd:0};
    const current=await repository.read();
    if(os.status==='granted'&&current?.ownerId===owner&&current.desired&&!current.pending&&current.preferences.timeZone===preferences.timeZone&&current.preferences.quietStart===0&&current.preferences.quietEnd===0)return;
    await enable(preferences,ask);
   }catch(e){if(valid(owner,stamp))setError(message(e));}
   finally{if(valid(owner,stamp))setPromptSettled(true);}
  })();
 },[userId,authReady,ready,configured,busy,activation]);
 useEffect(()=>{
  const listener=Notifications.addPushTokenListener(token=>{
   if(Platform.OS!=='android'||!userId||typeof token.data!=='string'||operation.current!==null||signingOut.current)return;
   void repository.read().then(local=>{if(local?.ownerId===userId&&local.desired&&active.current===userId)void action(()=>submit({enabled:true,token:token.data as string,timeZone:deviceZone(),quietStart:0,quietEnd:0}));}).catch(()=>{});
  });return()=>listener.remove();
 },[userId,api]);
 return {registration,configured,ready,busy,error,permission,promptSettled,settingsVisible,target:target?.ownerId===userId?target:null,dailyTarget:dailyTarget?.ownerId===userId?dailyTarget:null,enable,disable,retry,beforeSignOut,endSignOut,reload:load,openSettings:()=>setSettingsVisible(true),closeSettings:()=>{if(!busy)setSettingsVisible(false);}};
}
export type NativePushControls=ReturnType<typeof useNativePush>;
export const NativePushContext=createContext<NativePushControls|null>(null);
export const useNativePushControls=()=>useContext(NativePushContext);
