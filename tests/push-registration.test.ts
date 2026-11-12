import {it} from 'node:test';
import assert from 'node:assert/strict';
import {PushRegistrationRepository,parsePushRegistration,notificationDecision,quietMinute,validPushIntent} from '../src/push-registration';
import {MoreApi} from '../src/more-api';
import {requestPushPermission} from '../src/push-permission';
const id='10000000-0000-4000-8000-000000000001',a='20000000-0000-4000-8000-000000000001',b='20000000-0000-4000-8000-000000000002',secret='a'.repeat(64);
const settings={enabled:true as const,token:'synthetic-fcm-token-for-tests',timeZone:'Asia/Baku',quietStart:1320,quietEnd:480};
it('waits for the human permission choice and ignores a late result after an account change',async()=>{
 let reply!:(value:{status:string})=>void,current=true,asked=false;
 const pending=requestPushPermission({read:async()=>({status:'undetermined',canAskAgain:true}),request:()=>{asked=true;return new Promise(resolve=>{reply=resolve;});},current:()=>current},true);
 await new Promise(resolve=>setImmediate(resolve));assert.equal(asked,true);current=false;reply({status:'granted'});assert.equal(await pending,null);
});
it('does not ask again after permanent denial or during a background renewal',async()=>{
 let requests=0;const request=async()=>{requests++;return {status:'granted'};};
 await assert.rejects(requestPushPermission({read:async()=>({status:'denied',canAskAgain:false}),request,current:()=>true},true),/Android settings/);
 await assert.rejects(requestPushPermission({read:async()=>({status:'denied',canAskAgain:true}),request,current:()=>true},false),/Android settings/);
 assert.equal(requests,0);assert.equal((await requestPushPermission({read:async()=>({status:'granted'}),request,current:()=>true},true))?.status,'granted');assert.equal(requests,0);
});
function fixture(){let raw:string|null=null;const writes:string[]=[];const store={getItem:async()=>raw,setItem:async(key:string,value:string)=>{writes.push(key);raw=value;}};return {repo:new PushRegistrationRepository(store,async()=>({installationId:id,secret})),writes,get raw(){return raw;}};}
it('persists exact uncertain intent before transport and serializes monotonically increasing account changes',async()=>{
 const h=fixture();await h.repo.ensure('Asia/Baku');const [first,second,third]=await Promise.all([h.repo.prepare(a,settings),h.repo.prepare(a,{enabled:false}),h.repo.prepare(b,settings)]);assert.deepEqual([first.epoch,second.epoch,third.epoch],[1,2,3]);assert.equal(first.settings.enabled,true);assert.equal(second.settings.enabled,false);
 const record=await h.repo.read();assert.equal(record?.ownerId,b);assert.equal(record?.pending?.intent.epoch,3);assert.deepEqual(record?.pending?.intent,third);assert.ok(h.writes.every(key=>key==='nudge.push.installation.v1'));
 assert.equal(await h.repo.confirm(a,{saved:true,enabled:true,epoch:1}),false);assert.equal((await h.repo.read())?.pending?.ownerId,b);assert.equal(await h.repo.confirm(b,{saved:true,enabled:true,epoch:3}),true);assert.equal((await h.repo.read())?.pending,null);
});
it('does not replace corrupt credentials or fall back to unencrypted state on storage failure',async()=>{
 let creates=0;const repo=new PushRegistrationRepository({getItem:async()=>'{bad',setItem:async()=>{}},async()=>{creates++;return {installationId:id,secret};});await assert.rejects(repo.ensure('UTC'));assert.equal(creates,0);
 const broken=new PushRegistrationRepository({getItem:async()=>null,setItem:async()=>{throw Error('locked');}},async()=>({installationId:id,secret}));await assert.rejects(broken.ensure('UTC'),/locked/);assert.throws(()=>parsePushRegistration('{"version":1}'));
});
it('keeps the previous confirmed settings when disabling and binds receipts to the latest intent',async()=>{
 const h=fixture();await h.repo.ensure('UTC');const on=await h.repo.prepare(a,settings);await h.repo.confirm(a,{saved:true,enabled:true,epoch:on.epoch});const off=await h.repo.prepare(a,{enabled:false});assert.equal(off.epoch,2);assert.deepEqual((await h.repo.read())?.preferences,{timeZone:'Asia/Baku',quietStart:1320,quietEnd:480});assert.equal((await h.repo.read())?.desired,false);assert.equal(await h.repo.confirm(a,{saved:true,enabled:true,epoch:1}),false);
});
it('routes only valid notification taps for the current account and validates quiet-hour input',()=>{
 const data={recipientUserId:a,decisionId:id,notificationId:id};assert.equal(notificationDecision(data,a),id);assert.equal(notificationDecision(data,b),null);assert.equal(notificationDecision(data,null),null);assert.equal(notificationDecision({...data,decisionId:'foreign'},a),null);
 assert.equal(quietMinute('22:30'),1350);assert.equal(quietMinute('00:00'),0);for(const bad of ['24:00','12:60','2:30','later','-1:00'])assert.equal(quietMinute(bad),null);
});
it('sends only explicit bearer device mutations with the same exact epoch/body on retry',async()=>{
 const h=fixture();await h.repo.ensure('UTC');const intent=await h.repo.prepare(a,settings),calls:string[]=[];
 const api=new MoreApi({baseUrl:'https://nudge.test',accessToken:async()=>'fixture',fetch:async(url,init)=>{assert.ok(String(url).endsWith('/push/device'));assert.equal(init?.credentials,'omit');calls.push(String(init?.body));if(calls.length===1)throw Error('offline');return Response.json({saved:true,enabled:true,epoch:intent.epoch});}});
 await assert.rejects(api.pushDevice(intent));assert.deepEqual((await h.repo.read())?.pending?.intent,intent);await api.pushDevice(intent);assert.equal(calls[0],calls[1]);assert.equal(validPushIntent({...intent,settings:{...settings,token:'short'}}),false);
});
