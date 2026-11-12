import {describe,it} from 'node:test';
import assert from 'node:assert/strict';
import {DECISION_DRAFT_MAX_AGE,DecisionDraftRepository,decisionDraftKeys,emptyDecisionDraft,parsePendingDecisionCreate,parseWorkingDecisionDraft,type DraftStorage} from '../src/decision-draft';
import type {CreateDecisionInput} from '../src/decision-api';
const user='3f1e2bce-c5e8-4aa7-b812-e5eab074781d',other='b14130f1-8db2-40d6-b43f-3d4a1cb63d3d',requestId='04f89e94-676f-423e-a4c0-5f0ea57adb1f',savedId='f170a303-a532-420e-9756-87cdc4a04450';
const input=():CreateDecisionInput=>({requestId,title:'Build a base',options:['Mining','Cutting trees'],context:{domain:'Minecraft',meaningConfirmed:true,comparisonBasis:'journal'}});
function fixture(){
 const values=new Map<string,string>();let failKey:string|null=null,now=1000;
 const storage:DraftStorage={getItem:async key=>values.get(key)??null,setItem:async(key,value)=>{if(failKey===key)throw new Error('Device storage unavailable');values.set(key,value);},removeItem:async key=>{values.delete(key);}};
 const repository=new DecisionDraftRepository(storage,()=>now);
 return {values,storage,repository,setFailure:(key:string|null)=>{failKey=key;},setNow:(value:number)=>{now=value;}};
}
describe('native comparison drafts survive navigation without rebasing pending intent',()=>{
 it('keeps unfinished options, context and current form step across a new screen/repository',async()=>{
  const f=fixture(),draft=emptyDecisionDraft();draft.options=['Mining',''];draft.domain='my own game';draft.goal='Build somewhere quiet';draft.details={Mining:'Only I know this custom rule'};
  draft.basis='criteria';draft.criteria=[{id:'effort',label:'',unit:'points',weight:2,direction:'lower',low:0,high:0,values:{Mining:{value:null}}}];
  await f.repository.scope(user).saveWorking(draft,2);
  const restored=await new DecisionDraftRepository(f.storage,()=>1001).scope(user).load();
  assert.equal(restored.pending,null);assert.equal(restored.working!.step,2);assert.deepEqual(restored.working!.draft,draft);
 });
 it('freezes queued snapshots before later edits and keeps the newest deliberate edit',async()=>{
  const f=fixture(),scope=f.repository.scope(user),draft=emptyDecisionDraft();draft.options[0]='First version';
  const first=scope.saveWorking(draft,0);draft.options[0]='Next version';await first;
  assert.equal((await scope.load()).working!.draft.options[0],'First version');
  await scope.saveWorking(draft,1);assert.equal((await scope.load()).working!.draft.options[0],'Next version');assert.equal((await scope.load()).working!.step,1);
 });
 it('coalesces rapid typing into the latest secure write without losing the current stage',async()=>{
  const f=fixture();let writes=0;const repo=new DecisionDraftRepository({...f.storage,setItem:async(key,value)=>{writes++;await f.storage.setItem(key,value);}},()=>1000),scope=repo.scope(user),draft=emptyDecisionDraft();
  const first=scope.saveWorking({...draft,goal:'B'},0),second=scope.saveWorking({...draft,goal:'Bu'},1),third=scope.saveWorking({...draft,goal:'Build'},2);
  assert.deepEqual(await Promise.all([first,second,third]),[false,false,true]);assert.equal(writes,1);const loaded=await scope.load();assert.equal(loaded.working!.draft.goal,'Build');assert.equal(loaded.working!.step,2);
 });
 it('rejects another account, expired/future entries and malformed working state',()=>{
  const raw={version:1,userId:user,updatedAt:1000,step:1,draft:emptyDecisionDraft()};
  assert.equal(parseWorkingDecisionDraft(JSON.stringify(raw),other,1001),null);
  assert.equal(parseWorkingDecisionDraft(JSON.stringify(raw),user,1000+DECISION_DRAFT_MAX_AGE+1),null);
  assert.equal(parseWorkingDecisionDraft(JSON.stringify(raw),user,999),null);
  for(const value of [{...raw,step:4},{...raw,draft:{...raw.draft,options:['only one']}},{...raw,draft:{...raw.draft,goal:'x'.repeat(301)}},{...raw,draft:{...raw.draft,details:{Mining:{secret:'not text'}}}}])assert.equal(parseWorkingDecisionDraft(JSON.stringify(value),user,1001),null);
 });
 it('promotes working input to an exclusive immutable pending intent before transport',async()=>{
  const f=fixture(),scope=f.repository.scope(user),draft=emptyDecisionDraft();draft.options=['Mining','Cutting trees'];await scope.saveWorking(draft,3);
  const body=input(),pendingPromise=scope.begin(body);body.context.domain='A different game';const pending=await pendingPromise;
  assert.equal(pending.input.context.domain,'Minecraft');assert.equal(f.values.has(decisionDraftKeys(user).working),false);
  const frozen=f.values.get(decisionDraftKeys(user).pending);assert.equal(await scope.saveWorking({...draft,goal:'New goal'},0),false);assert.equal(f.values.get(decisionDraftKeys(user).pending),frozen);
  assert.deepEqual(await scope.begin(input()),pending);
  await assert.rejects(scope.begin({...input(),requestId:other}),/previous comparison/);
  const restored=await new DecisionDraftRepository(f.storage,()=>1001).scope(user).load();assert.equal(restored.working,null);assert.deepEqual(restored.pending,pending);
 });
 it('pins a confirmed receipt to the same request and rejects unrelated replacements',async()=>{
  const f=fixture(),scope=f.repository.scope(user),pending=await scope.begin(input());
  await assert.rejects(scope.receipt({...pending,input:{...input(),requestId:other}},savedId),/changed/);
  const receipt=await scope.receipt(pending,savedId);assert.equal(receipt.decisionId,savedId);
  assert.equal((await new DecisionDraftRepository(f.storage,()=>1001).scope(user).load()).pending!.decisionId,savedId);
  await assert.rejects(scope.receipt(pending,other),/changed/);
 });
 it('clearing an account fences queued autosaves and late network receipts without touching another account',async()=>{
  const f=fixture(),scope=f.repository.scope(user),draft=emptyDecisionDraft();draft.options=['Private thought',''];
  await f.repository.scope(other).saveWorking(draft,1);const pending=await scope.begin(input());
  const queued=scope.saveWorking(draft,1),cleared=f.repository.clear(user);
  await assert.rejects(queued,/changed/);await cleared;await assert.rejects(scope.receipt(pending,savedId),/changed/);
  assert.deepEqual(await f.repository.scope(user).load(),{pending:null,working:null});assert.ok((await f.repository.scope(other).load()).working);
  const newScope=f.repository.scope(user),newInput={...input(),requestId:other};await newScope.begin(newInput);
  await assert.rejects(scope.receipt(pending,savedId),/changed/);assert.equal((await newScope.load()).pending!.input.requestId,other);
 });
 it('retains the last durable working input when secure storage rejects an update or promotion',async()=>{
  const f=fixture(),scope=f.repository.scope(user),draft=emptyDecisionDraft();draft.options=['Last saved',''];await scope.saveWorking(draft,1);
  f.setFailure(decisionDraftKeys(user).working);await assert.rejects(scope.saveWorking({...draft,goal:'An unsaved edit'},2),/unavailable/);
  assert.equal((await scope.load()).working!.draft.goal,'');
  f.setFailure(decisionDraftKeys(user).pending);await assert.rejects(scope.begin(input()),/unavailable/);assert.ok((await scope.load()).working);
  f.setFailure(null);assert.ok(await scope.begin(input()));
 });
 it('expires pending creates instead of giving old requests a fresh timestamp',async()=>{
  const f=fixture(),scope=f.repository.scope(user);await scope.begin(input());f.setNow(1000+DECISION_DRAFT_MAX_AGE+1);
  assert.deepEqual(await f.repository.scope(user).load(),{pending:null,working:null});assert.equal(f.values.size,0);
  assert.equal(parsePendingDecisionCreate(JSON.stringify({version:1,userId:user,createdAt:1000,input:input()}),other,1001),null);
 });
 it('rejects unsafe identifiers, invalid numbers and oversized device drafts visibly',async()=>{
  const f=fixture();assert.throws(()=>f.repository.scope('foreign'),/changed/);
  const scope=f.repository.scope(user),draft=emptyDecisionDraft();draft.criteria=[{id:'cost',label:'Cost',unit:'USD',weight:2,direction:'lower',low:NaN,high:10,values:{}}];
  await assert.rejects(scope.saveWorking(draft,2),/numbers/);assert.equal(f.values.size,0);
  const oversized=emptyDecisionDraft();oversized.options=Array.from({length:8},(_,i)=>'Option '+i);oversized.criteria=Array.from({length:5},(_,i)=>({id:'criterion-'+i,label:'Criterion',unit:'points',weight:3,direction:'higher' as const,low:0,high:10,values:Object.fromEntries(oversized.options.map(label=>[label,{value:null,sourceUrl:'https://example.test/'+ 'a'.repeat(1800),note:'a'.repeat(500)}]))}));
  await assert.rejects(scope.saveWorking(oversized,2),/too long/);assert.equal(f.values.size,0);
 });
});
