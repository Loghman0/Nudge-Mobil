import {it} from 'node:test';
import assert from 'node:assert/strict';
import {MoreApi,MoreApiError,type MemoryDraft} from '../src/more-api';
import {startNoteReview,noteReviewIntent} from '../src/note-review';
const requestId='00000000-0000-4000-8000-000000000001';
const draft:MemoryDraft={generation:7,suggestions:[{kind:'goal',content:'Walk more'},{kind:'habit',content:'Read nightly'}]};
it('starts unselected and creates an independent reviewed snapshot of edited selections',()=>{
 const entries=startNoteReview(draft);assert.ok(entries.every(entry=>!entry.selected));assert.throws(()=>noteReviewIntent(draft,entries,true,requestId));
 entries[0].selected=true;entries[0].content=' Walk on weekends ';assert.throws(()=>noteReviewIntent(draft,entries,false,requestId));
 const intent=noteReviewIntent(draft,entries,true,requestId);entries[0].content='Changed later';assert.deepEqual(intent,{requestId,generation:7,reviewed:true,memories:[{kind:'goal',content:'Walk on weekends'}]});assert.equal(draft.suggestions[0].content,'Walk more');
});
it('rejects blank and duplicate selected statements',()=>{
 const entries=startNoteReview(draft);entries[0].selected=true;entries[0].content=' ';assert.throws(()=>noteReviewIntent(draft,entries,true,requestId));
 entries[0].content='Walk more';entries[1]={...entries[0],content:' WALK  more '};assert.throws(()=>noteReviewIntent(draft,entries,true,requestId),/once/);
});
it('uses bearer-only explicit extraction and rejects malformed drafts',async()=>{
 let calls=0;const api=new MoreApi({baseUrl:'https://nudge.test',accessToken:async()=>'fixture',fetch:async(url,init)=>{calls++;assert.ok(String(url).endsWith('/memories/extract'));assert.equal(init?.credentials,'omit');assert.deepEqual(JSON.parse(String(init?.body)),{text:'I read nightly'});return Response.json({draft});}});
 assert.deepEqual(await api.extractNotes('I read nightly'),{draft});assert.equal(calls,1);assert.throws(()=>api.extractNotes('x'));assert.equal(calls,1);
 for(const value of [{draft:{...draft,generation:-1}},{draft:{...draft,suggestions:[]}},{draft:{...draft,suggestions:[{kind:'diagnosis',content:'X'}]}}]){
  const bad=new MoreApi({baseUrl:'https://nudge.test',accessToken:async()=>'fixture',fetch:async()=>Response.json(value)});await assert.rejects(bad.extractNotes('A concrete note'),MoreApiError);
 }
});
it('replays the identical confirmation after a lost response and validates the saved count',async()=>{
 const entries=startNoteReview(draft);entries[0].selected=true;const intent=noteReviewIntent(draft,entries,true,requestId),bodies:string[]=[];
 const api=new MoreApi({baseUrl:'https://nudge.test',accessToken:async()=>'fixture',fetch:async(_,init)=>{bodies.push(String(init?.body));if(bodies.length===1)throw new Error('Lost response');return Response.json({saved:1});}});
 await assert.rejects(api.confirmNotes(intent));assert.equal((await api.confirmNotes(intent)).saved,1);assert.equal(bodies[0],bodies[1]);
 const bad=new MoreApi({baseUrl:'https://nudge.test',accessToken:async()=>'fixture',fetch:async()=>Response.json({saved:2})});await assert.rejects(bad.confirmNotes(intent),MoreApiError);
});
