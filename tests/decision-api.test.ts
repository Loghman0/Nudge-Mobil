import {describe,it} from 'node:test';
import assert from 'node:assert/strict';
import {DecisionApi,DecisionApiError,assessCriteria,type CreateDecisionInput,type ComparisonCriterion} from '../src/decision-api';
const origin='https://nudge.example',id='97a2dafa-d337-49db-8457-808bba46853f',option='1d8ca2a8-e5dd-45e8-a969-d563937f0ba2',other='660fa82f-f5cc-4b24-a315-4e33432fd012',requestId='69d29939-9946-4cda-8d7c-2eb79de5507d';
const input=():CreateDecisionInput=>({requestId,title:'What next?',options:['Mining','Trees'],context:{domain:'my game',goal:'build a base',meaningConfirmed:true,comparisonBasis:'journal'}});
const comparison={decisionId:id,revision:0,evidenceSnapshotState:'saved',evidenceState:'insufficient',options:[{id:option,label:'Mining',score:.5,breakdown:{novelty:.5},reasons:['No relevant history'],warning:false},{id:other,label:'Trees',score:.5,breakdown:{novelty:.5},reasons:['No relevant history'],warning:false}]};
const entry={id,question:'What next?',category:'other',status:'open',created_at:'2026-11-08T12:00:00Z',decided_at:null,selected_option_id:null,reflection_due_at:null,reminder_enabled:false};
const detail={...entry,comparison_revision:0,context:{domain:'my game',comparisonBasis:'journal'},expected_outcome:null,decision_options:[{id:option,label:'Mining',rank:1,score:null,score_breakdown:null},{id:other,label:'Trees',rank:2,score:null,score_breakdown:null}],decision_reflections:[],saved_explanation:{state:'unavailable',revision:0}};
const json=(data:unknown,status=200)=>new Response(JSON.stringify({apiVersion:'1',data}),{status,headers:{'Content-Type':'application/json'}});
const transport=(handler:(url:string,init:RequestInit)=>Response|Promise<Response>):typeof fetch=>(async(url,init)=>handler(String(url),init!)) as typeof fetch;
const client=(handler:(url:string,init:RequestInit)=>Response|Promise<Response>,token=async()=> 'native-token')=>new DecisionApi({baseUrl:origin,accessToken:token,fetch:transport(handler)});
const code=(expected:string,status?:number)=>(e:unknown)=>e instanceof DecisionApiError&&e.code===expected&&(status===undefined||e.status===status);
describe('native decisions preserve the server contract',()=>{
 it('opens live one-to-one Supabase reflection relations before and after a reflection',async()=>{
  const reflection={rating:4,would_repeat:true,has_regrets:false,would_recommend:null,would_choose_again:null,notes:'A recorded outcome.'};
  for(const relation of [null,reflection,[reflection]]){
   const api=client(()=>json({decision:{...detail,decision_reflections:relation}}));
   assert.deepEqual((await api.get(id)).decision_reflections,relation===null?[]:[reflection]);
  }
  const malformed=client(()=>json({decision:{...detail,decision_reflections:{rating:'4'}}}));
  await assert.rejects(malformed.get(id),code('unavailable',503));
 });
 it('uses bearer/no-cookie private reads and encoded stable pagination',async()=>{
  const api=client((url,init)=>{const u=new URL(url);assert.equal(u.pathname,'/api/v1/decisions');assert.equal(u.searchParams.get('q'),'work & play');assert.equal(u.searchParams.get('offset'),'20');assert.equal(new Headers(init.headers).get('Authorization'),'Bearer native-token');assert.equal(new Headers(init.headers).get('Cookie'),null);assert.equal(init.credentials,'omit');assert.equal(init.redirect,'error');assert.equal(init.cache,'no-store');return json({decisions:[entry],pagination:{offset:20,limit:20,total:21,nextOffset:null},consistency:'live'});});
  assert.equal((await api.list({query:'work & play',offset:20})).decisions[0].id,id);
 });
 it('rejects unsafe origins and malformed identity without transport',async()=>{
  for(const baseUrl of ['http://nudge.example','https://user:secret@nudge.example','https://nudge.example/path','https://nudge.example/?q=x','https://nudge.example/#x'])assert.throws(()=>new DecisionApi({baseUrl,accessToken:async()=>null}));
  for(const token of [null,'bad token','bad,token']){let calls=0;const api=client(()=>{calls++;return json({});},async()=>token as string);await assert.rejects(api.get(id),code('unauthenticated',401));assert.equal(calls,0);}
 });
 it('keeps combined category/status/search through pagination and rejects invalid filters before transport',async()=>{
  let calls=0;const api=client((url)=>{calls++;const q=new URL(url).searchParams;assert.equal(q.get('category'),'food');assert.equal(q.get('status'),'abandoned');assert.equal(q.get('q'),'work & play');assert.equal(q.get('offset'),'20');return json({decisions:[],pagination:{offset:20,limit:20,total:20,nextOffset:null},consistency:'live'});});
  await api.list({category:'food',status:'abandoned',query:' work & play ',offset:20});
  for(const input of [{category:'private'}, {status:'unknown'}, {offset:-1}, {limit:51}, {query:'x'.repeat(121)}])await assert.rejects(api.list(input as never),code('invalid_input',400));
  assert.equal(calls,1);
 });
 it('sets aside only the requested decision and requires its confirmed saved status',async()=>{
  let calls=0;const api=client((url,init)=>{calls++;assert.equal(url,origin+'/api/v1/decisions/'+id+'/abandon');assert.equal(init.method,'POST');assert.equal(init.body,'{}');return json({abandoned:true,decisionId:id,status:'abandoned'});});
  assert.equal((await api.abandon(id)).status,'abandoned');assert.equal(calls,1);
  for(const data of [{abandoned:false,decisionId:id,status:'abandoned'},{abandoned:true,decisionId:other,status:'abandoned'},{abandoned:true,decisionId:id,status:'open'}])await assert.rejects(client(()=>json(data)).abandon(id),code('unavailable',503));
 });
 it('freezes a create intent before token refresh and resends only on explicit retry',async()=>{
  let resolve!:(v:string)=>void;const token=new Promise<string>(r=>{resolve=r;}),bodies:string[]=[];
  const api=client((_url,init)=>{bodies.push(String(init.body));return json({comparison});},()=>token);
  const draft=input(),original=JSON.stringify(draft),promise=api.create(draft);draft.context.domain='changed';draft.options[0]='different';resolve('native-token');await promise;assert.deepEqual(bodies,[original]);await api.create(JSON.parse(original));assert.deepEqual(bodies,[original,original]);
 });
 it('sends confirmed criteria with unknown cells and exact suggestion generation',async()=>{
  const draft=input();draft.context={domain:'work',meaningConfirmed:true,comparisonBasis:'criteria',criteriaConfirmed:true,criteriaVersion:1,criteria:[{id:'cost',label:'Cost',unit:'USD',weight:4,direction:'lower',low:0,high:100,values:{Mining:{value:null},Trees:{value:50}},discoverySuggestion:{id:'observation-id',generation:8}}]};
  const api=client((_url,init)=>{assert.deepEqual(JSON.parse(String(init.body)),draft);return json({comparison});});await api.create(draft);
 });
 it('keeps path identity, saved revision, choice and nullable reflections unchanged',async()=>{
  const calls:{url:string;body:any}[]=[];
  const api=client((url,init)=>{const body=JSON.parse(String(init.body));calls.push({url,body});if(url.endsWith('/comparison'))return json({comparison});if(url.endsWith('/choice'))return json({decisionId:id,selectedOptionId:option,status:'decided'});return json({decisionId:id,saved:false});});
  await api.refresh(id,4,'Iron');await api.choose(id,option);await api.reflect(id,{rating:4,wouldRepeat:null,hasRegrets:false,notes:'It depended on the timing.'});
  assert.deepEqual(calls[0].body,{revision:4,extraLabel:'Iron'});assert.deepEqual(calls[1].body,{optionId:option});assert.deepEqual(calls[2].body,{rating:4,wouldRepeat:null,hasRegrets:false,notes:'It depended on the timing.'});assert.ok(calls.every(call=>call.url.includes('/'+id+'/')));
 });
 it('sends reminder settings once without inventing exactly-once semantics',async()=>{
  const dueAt='2026-12-01T10:00:00.000Z';let calls=0;
  const api=client((url,init)=>{calls++;assert.equal(url,origin+'/api/v1/decisions/'+id+'/reminder');assert.deepEqual(JSON.parse(String(init.body)),{enabled:true,dueAt});return json({decisionId:id,enabled:true,dueAt,reminderVersion:3});});assert.equal((await api.reminder(id,{enabled:true,dueAt})).reminderVersion,3);assert.equal(calls,1);
 });
 it('pins reminder intent during token refresh and rejects contradictory input',async()=>{
  let resolve!:(value:string)=>void;const token=new Promise<string>(r=>{resolve=r;}),dueAt='2026-12-01T10:00:00.000Z';let calls=0;
  const api=client((_url,init)=>{calls++;assert.deepEqual(JSON.parse(String(init.body)),{enabled:true,dueAt});return json({decisionId:id,enabled:true,dueAt,reminderVersion:3});},()=>token);
  const value={enabled:true,dueAt},pending=api.reminder(id,value);value.dueAt='2026-12-02T10:00:00.000Z';resolve('native-token');assert.equal((await pending).dueAt,dueAt);
  for(const bad of [{enabled:false,dueAt},{enabled:true,dueAt:null},{enabled:true,dueAt:'not a date'}])await assert.rejects(api.reminder(id,bad as never),code('invalid_input',400));assert.equal(calls,1);
 });
 it('does not describe failed journal reads as possibly saved changes',async()=>{
  const api=client(()=>{throw Error('offline');});await assert.rejects(api.list(),error=>code('offline',0)(error)&&!(error as Error).message.includes('may have saved'));
 });
 it('reads the bare discovery suggestion envelope and requires explicit confirmation',async()=>{
  const api=client((_url,init)=>{assert.deepEqual(JSON.parse(String(init.body)),{domain:'work'});return new Response(JSON.stringify({generation:3,suggestions:[{id:'source',kind:'criterion',label:'Time for myself',statement:'You chose this before.',scope:'after work',evidenceIds:['answer'],questionIds:['question'],observedAt:null,requiresConfirmation:true}]}),{status:200});});
  assert.equal((await api.suggestions('work')).suggestions[0].requiresConfirmation,true);
 });
 it('accepts saved evidence absence but rejects a mismatched evidence revision',async()=>{
  const api=client(()=>json({decision:detail}));assert.equal((await api.get(id)).saved_explanation.state,'unavailable');
  const wrong=client(()=>json({decision:{...detail,saved_explanation:{state:'unavailable',revision:1}}}));await assert.rejects(wrong.get(id),code('unavailable',503));
 });
 it('rejects bad envelopes, options and redirected responses instead of fabricating success',async()=>{
  for(const value of [{apiVersion:'2',data:{comparison}},{apiVersion:'1',data:{comparison:{...comparison,decisionId:'bad'}}},{apiVersion:'1',data:{comparison:{...comparison,options:[]}}}]){const api=client(()=>new Response(JSON.stringify(value),{status:200}));await assert.rejects(api.create(input()),code('unavailable',503));}
  const api=client(()=>new Response('not JSON',{status:200}));await assert.rejects(api.get(id),code('unavailable',503));
 });
 it('surfaces conflicts, terms and forbidden scope without automatically retrying',async()=>{
  for(const [status,errorCode] of [[409,'conflict'],[403,'needs_terms'],[403,'forbidden'],[503,'unavailable']] as const){let calls=0;const api=client(()=>{calls++;return new Response(JSON.stringify({apiVersion:'1',error:{code:errorCode,message:'Review this first.'}}),{status});});await assert.rejects(api.create(input()),code(errorCode,status));assert.equal(calls,1);}
 });
 it('keeps an ambiguous offline mutation as an error without repeating it',async()=>{let calls=0;const api=client(()=>{calls++;throw new Error('offline');});await assert.rejects(api.create(input()),code('offline',0));assert.equal(calls,1);});
 it('times out token/body stalls and does not send a request after timeout',async context=>{
  context.mock.timers.enable({apis:['setTimeout']});let resolve!:(v:string)=>void,calls=0;const token=new Promise<string>(r=>{resolve=r;});const api=client(()=>{calls++;return json({comparison});},()=>token);
  const pending=api.create(input());const rejected=assert.rejects(pending,code('timeout',0));context.mock.timers.tick(20001);await rejected;resolve('native-token');await Promise.resolve();assert.equal(calls,0);
 });
 it('retains unknown costs as uncertainty in the exact shared assessment',()=>{
  const criterion:ComparisonCriterion={id:'cost',label:'Cost',unit:'USD',weight:5,direction:'lower',low:0,high:100,values:{Mining:{value:null},Trees:{value:50}}};
  const result=assessCriteria([criterion],['Mining','Trees']);assert.equal(result.outcome,'uncertain');assert.equal(result.leader,null);assert.deepEqual(result.options.find(o=>o.label==='Mining')&&[result.options[0].low,result.options[0].high],[0,1]);
 });
});
