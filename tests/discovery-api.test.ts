import {describe,it} from 'node:test';
import assert from 'node:assert/strict';
import {DiscoveryApi,DiscoveryApiError,DISCOVERY_MOODS,type DiscoveryProfile,type SaveAnswersInput,type NextQuestionInput} from '../src/discovery-api';
import {previewQuestions} from '../src/preview';

const origin='https://nudge.example';
const requestId='13c122aa-9e25-4cc3-aa17-2c843ea52acb';
const answerId='034f01fc-6dc3-4f7d-945b-444276b724e2';
const q=previewQuestions[0];
const answer={questionId:q.id,questionVersion:q.version,response:{kind:'choice' as const,optionId:q.choices![0].id}};
const saved={saved:true,generation:4,answerIds:[answerId]};
function emptyProfile():DiscoveryProfile{return {
 available:true,generation:4,today:'2026-11-08',suppressedQuestionIds:[],capabilities:{writtenAnswers:false,optionalTopics:false},
 answers:[],insights:[],counts:{answers:0,domains:0,confirmed:0},
 settings:{mutedTopics:[],optionalTopics:false,maxDepth:0,writtenAnswers:false,metricsEnabled:false},exposures:[],
};}
function json(value:unknown,status=200){return new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});}
function transport(handler:(url:string,init:RequestInit)=>Promise<Response>|Response):typeof fetch{
 return (async(url,init)=>handler(String(url),init!)) as typeof fetch;
}
function client(fetch:typeof fetch,accessToken=async()=> 'native-access-token'){
 return new DiscoveryApi({baseUrl:origin,accessToken,fetch});
}
const expectCode=(code:string,status?:number)=>(error:unknown)=>error instanceof DiscoveryApiError&&error.code===code&&(status===undefined||error.status===status);

describe('native discovery transport',()=>{
 it('sends bearer identity without cookies, redirects or cache, and keeps profile data',async()=>{
  const profile=emptyProfile();
  profile.answers=[{...answer,id:answerId,question:q,revision:2,active:false,useInProfile:false,answeredAt:'2026-11-08T12:00:00Z'}];
  const api=client(transport((url,init)=>{
   assert.equal(url,`${origin}/api/v1/discovery/profile`);assert.equal(init.method,'GET');
   assert.equal(new Headers(init.headers).get('Authorization'),'Bearer native-access-token');
   assert.equal(new Headers(init.headers).get('Cookie'),null);assert.equal(init.credentials,'omit');
   assert.equal(init.redirect,'error');assert.equal(init.cache,'no-store');assert.equal(init.body,undefined);
   return json(profile);
  }));
  assert.deepEqual(await api.profile(),profile);
 });

 it('rejects absent or malformed credentials without a network request',async()=>{
  for(const token of [null,'','bad token','bad,token','bad\r\ntoken']){
   let calls=0;const api=new DiscoveryApi({baseUrl:origin,accessToken:async()=>token,fetch:transport(()=>{calls++;return json(emptyProfile());})});
   await assert.rejects(api.profile(),expectCode('unauthenticated',401));assert.equal(calls,0);
  }
 });

 it('requires an HTTPS origin without path, credentials, query or hash',()=>{
  for(const baseUrl of ['http://nudge.example','https://name:secret@nudge.example','https://nudge.example/api','https://nudge.example/?key=x','https://nudge.example/#x','invalid'])
   assert.throws(()=>new DiscoveryApi({baseUrl,accessToken:async()=>null}));
 });

 it('pins a claim body before awaiting refresh and only retries when the caller asks',async()=>{
  let resolveToken!:(value:string)=>void;
  const token=new Promise<string>(resolve=>{resolveToken=resolve;});
  const requests:string[]=[];
  const api=client(transport((_url,init)=>{requests.push(String(init.body));return json(saved);}),()=>token);
  const input:SaveAnswersInput={requestId,expectedGeneration:4,answers:[structuredClone(answer)]};
  const original=JSON.stringify(input),pending=api.claim(input);
  input.expectedGeneration=9;input.answers[0].response={kind:'skip'};
  resolveToken('native-access-token');await pending;
  assert.deepEqual(requests,[original]);
  await api.claim(JSON.parse(original));assert.deepEqual(requests,[original,original]);
 });

 it('keeps generation, revision and exact method in edit/delete intents',async()=>{
  const calls:{url:string;init:RequestInit}[]=[];
  const api=client(transport((url,init)=>{calls.push({url,init});return json({saved:true,generation:5});}));
  const edit={requestId,expectedGeneration:4,expectedRevision:3,active:false};
  assert.equal((await api.edit(answerId,edit)).generation,5);
  assert.equal(calls[0].url,`${origin}/api/v1/discovery/answers/${answerId}`);
  assert.equal(calls[0].init.method,'PATCH');assert.deepEqual(JSON.parse(String(calls[0].init.body)),edit);
  const remove={requestId,expectedGeneration:5,expectedRevision:4};await api.remove(answerId,remove);
  assert.equal(calls[1].init.method,'DELETE');assert.deepEqual(JSON.parse(String(calls[1].init.body)),remove);
 });

 it('changes a topic through next and never submits an answer as a side effect',async()=>{
  let calls=0;const input={requestId,expectedGeneration:4,daily:true,change:true,topic:'food' as const,mode:'light' as const};
  const api=client(transport((url,init)=>{calls++;assert.ok(url.endsWith('/next'));assert.deepEqual(JSON.parse(String(init.body)),input);return json({question:q,reason:'coverage',generation:4,answered:false});}));
  assert.equal((await api.next(input)).question?.id,q.id);assert.equal(calls,1);
 });

 it('retains explicit pause/exhaustion results',async()=>{
  for(const reason of ['pause','exhausted']){
   const api=client(transport(()=>json({question:null,reason,generation:4,selectorVersion:1,score:0})));
   assert.equal((await api.next({requestId,expectedGeneration:4})).reason,reason);
  }
 });

 it('sends optional session moods only in next requests and rejects unknown moods before transport',async()=>{
  const bodies:Record<string,unknown>[]=[];
  const api=client(transport((url,init)=>{assert.ok(url.endsWith('/next'));bodies.push(JSON.parse(String(init.body)));return json({question:q,reason:'coverage',generation:4});}));
  for(const mood of [null,...DISCOVERY_MOODS.map(item=>item.id)])await api.next({requestId,expectedGeneration:4,mood});
  assert.deepEqual(bodies.map(body=>body.mood),[null,...DISCOVERY_MOODS.map(item=>item.id)]);
  const count=bodies.length;
  await assert.rejects(api.next({requestId,expectedGeneration:4,mood:'diagnose'} as unknown as NextQuestionInput),expectCode('invalid_request',400));
  assert.equal(bodies.length,count);
 });

 it('freezes a selected mood and next intent while token refresh is pending',async()=>{
  let finish!:(value:string)=>void;
  const token=new Promise<string>(resolve=>{finish=resolve;}),bodies:Record<string,unknown>[]=[];
  const api=client(transport((_url,init)=>{bodies.push(JSON.parse(String(init.body)));return json({question:q,reason:'coverage',generation:4});}),()=>token);
  const input:NextQuestionInput={requestId,expectedGeneration:4,mood:'sad',mode:'light',change:true};
  const pending=api.next(input);input.mood='happy';input.change=false;finish('native-access-token');await pending;
  assert.deepEqual(bodies,[{requestId,expectedGeneration:4,mood:'sad',mode:'light',change:true}]);
 });

 it('surfaces generation conflicts, terms, distress and auth errors without retrying',async()=>{
  for(const [code,status] of [['changed',409],['needs_terms',403],['support',422],['unauthenticated',401],['rate_limit',429]] as const){
   let calls=0;
   const api=client(transport(()=>{calls++;return json({error:{code,message:'Review before continuing.'}},status);}));
   await assert.rejects(api.claim({requestId,expectedGeneration:4,answers:[answer]}),expectCode(code,status));assert.equal(calls,1);
  }
 });

 it('does not fabricate success from malformed profiles, questions or save receipts',async()=>{
  const invalidProfiles=[{}, {...emptyProfile(),generation:-1}, {...emptyProfile(),capabilities:null},
   {...emptyProfile(),answers:[{...answer,id:answerId,question:q,revision:1,active:true,answeredAt:'now',response:{kind:'choice',optionId:'unknown'}}]}];
  for(const value of invalidProfiles)await assert.rejects(client(transport(()=>json(value))).profile(),expectCode('unavailable',503));
  for(const value of [{saved:true}, {saved:false,generation:4}, {...saved,answerIds:['unknown']}])
   await assert.rejects(client(transport(()=>json(value))).claim({requestId,expectedGeneration:4,answers:[answer]}),expectCode('unavailable',503));
  for(const question of [{...q,status:'draft'}, {...q,choices:null}, {...q,allowedResponses:['unknown']}])
   await assert.rejects(client(transport(()=>json({question,reason:'coverage',generation:4}))).next({requestId,expectedGeneration:4}),expectCode('unavailable',503));
 });

 it('handles invalid JSON and unexpected redirect responses safely',async()=>{
  await assert.rejects(client(transport(()=>new Response('<html>error</html>'))).profile(),expectCode('unavailable',503));
  const response=json(emptyProfile());Object.defineProperty(response,'url',{value:'https://unexpected.example/profile'});
  await assert.rejects(client(transport(()=>response)).profile(),expectCode('unavailable',503));
  await assert.rejects(client(transport(()=>json({error:{code:'arbitrary',message:'debug secret'}},503))).profile(),error=>expectCode('unavailable',503)(error)&&!(error as Error).message.includes('debug secret'));
 });

 it('validates mutation identity before transport and bounds payload size',async()=>{
  let calls=0;const api=client(transport(()=>{calls++;return json(saved);}));
  await assert.rejects(api.claim({requestId:'invalid',expectedGeneration:4,answers:[answer]}),expectCode('invalid_request',400));
  await assert.rejects(api.claim({requestId,expectedGeneration:-1,answers:[answer]}),expectCode('invalid_request',400));
  await assert.rejects(api.answer({requestId,expectedGeneration:4,answers:[answer,answer]}),expectCode('invalid_request',400));
  await assert.rejects(api.edit(answerId,{requestId,expectedGeneration:4,expectedRevision:0}),expectCode('invalid_request',400));
  await assert.rejects(api.remove('../profile',{requestId,expectedGeneration:4,expectedRevision:0}),expectCode('invalid_request',400));
  await assert.rejects(api.claim({requestId,expectedGeneration:4,answers:[{...answer,response:{kind:'text',text:'x'.repeat(25000)}}]}),expectCode('too_large',413));
  assert.equal(calls,0);
 });

 it('maps offline mutation uncertainty without issuing another request',async()=>{
  let calls=0;const api=client(transport(()=>{calls++;throw new TypeError('network secret');}));
  await assert.rejects(api.claim({requestId,expectedGeneration:4,answers:[answer]}),error=>expectCode('offline',0)(error)&&(error as Error).message.includes('may have saved'));
  assert.equal(calls,1);
 });

 it('describes a failed read without claiming a change might have saved',async()=>{
  const api=client(transport(()=>{throw new TypeError('network secret');}));
  await assert.rejects(api.profile(),error=>expectCode('offline',0)(error)
   &&(error as Error).message.includes('reload')&&!(error as Error).message.includes('may have saved'));
 });

 it('times out a stalled token without sending after it later resolves',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});
  let calls=0,resolveToken!:(value:string)=>void;
  const api=client(transport(()=>{calls++;return json(emptyProfile());}),()=>new Promise(resolve=>{resolveToken=resolve;}));
  const result=assert.rejects(api.profile(),error=>expectCode('timeout',0)(error)
   &&(error as Error).message.includes('load')&&!(error as Error).message.includes('may have saved'));
  t.mock.timers.tick(20001);await result;resolveToken('late-token');
  await Promise.resolve();await Promise.resolve();assert.equal(calls,0);
 });

 it('aborts stalled transport and rejects a stalled response body',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});
  let signal:AbortSignal|undefined;
  const api=client(transport((_url,init)=>{signal=init.signal as AbortSignal;return new Promise(()=>{});}));
  const result=assert.rejects(api.profile(),expectCode('timeout',0));
  await Promise.resolve();t.mock.timers.tick(20001);await result;assert.equal(signal?.aborted,true);
  const bodyApi=client(transport(()=>({ok:true,url:'',json:()=>new Promise(()=>{})} as Response)));
  const bodyResult=assert.rejects(bodyApi.profile(),expectCode('timeout',0));
  await Promise.resolve();await Promise.resolve();t.mock.timers.tick(20001);await bodyResult;
 });
});
