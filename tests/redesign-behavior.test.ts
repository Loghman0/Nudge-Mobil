import {test} from 'node:test';
import assert from 'node:assert/strict';
import {shouldAskPushOnce} from '../src/push-permission';
import {nextMilestone} from '../src/milestones';
import {AccountApi} from '../src/account-api';

test('first-use notification permission respects a past choice and OS denial',()=>{
 assert.equal(shouldAskPushOnce({status:'undetermined',canAskAgain:true},false),true);
 for(const seen of [false,true])for(const status of ['granted','denied'])assert.equal(shouldAskPushOnce({status,canAskAgain:true},seen),false);
 assert.equal(shouldAskPushOnce({status:'undetermined'},true),false);
 assert.equal(shouldAskPushOnce({status:'undetermined',canAskAgain:false},false),false);
});
test('answer milestones cannot be re-earned by editing, deleting, or a bad counter',()=>{
 assert.equal(nextMilestone(5,6),6);assert.equal(nextMilestone(6,6),null);assert.equal(nextMilestone(10,5),null);assert.equal(nextMilestone(10,9),null);assert.equal(nextMilestone(11,24),null);assert.equal(nextMilestone(24,25),25);assert.equal(nextMilestone(0,26),25);assert.equal(nextMilestone(-1,6),null);assert.equal(nextMilestone(0,NaN),null);
});
test('automatic timezone sync serializes concurrent refreshes and retries a failed write',async()=>{
 let requests=0,fail=true,finish!:()=>void;const gate=new Promise<void>(resolve=>finish=resolve);
 const api=new AccountApi({baseUrl:'https://nudge.test',accessToken:async()=>'test-token',fetch:async(url,init)=>{requests++;assert.ok(String(url).endsWith('/timezone'));assert.equal(JSON.parse(String(init?.body)).timezone,Intl.DateTimeFormat().resolvedOptions().timeZone);if(fail){fail=false;return Response.json({error:{code:'unavailable',message:'Try again.'}},{status:503});}await gate;return Response.json({saved:true});}});
 await assert.rejects(api.syncDeviceTimezone());assert.equal(requests,1);
 const a=api.syncDeviceTimezone(),b=api.syncDeviceTimezone();finish();await Promise.all([a,b]);assert.equal(requests,2);
 await api.syncDeviceTimezone();assert.equal(requests,2);
});
