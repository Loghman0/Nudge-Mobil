import {describe,it} from 'node:test';
import assert from 'node:assert/strict';
import {answerPreview,previewAnswerList,previewInsights,previewQuestions} from '../src/preview';
import {themes} from '../src/theme';
describe('native preview uses the web evidence semantics',()=>{
 it('uses the six current published choice questions and validates option identity',()=>{
  assert.equal(previewQuestions.length,6);
  for(const [index,q] of previewQuestions.entries()){
   assert.equal(q.version,2);assert.equal(q.format,'choice');assert.equal(q.status,'published');assert.equal(q.preview,true);
   assert.throws(()=>answerPreview({},index,{kind:'choice',optionId:'unknown'}));
  }
 });
 it('does not infer a trait from skipped, dependent, neither or unknown answers',()=>{
  for(const kind of ['skip','depends','neither'] as const){let answers={};for(let i=0;i<6;i++)answers=answerPreview(answers,i,{kind});assert.deepEqual(previewInsights(answers),[]);}
  assert.deepEqual(previewAnswerList({unknown:{kind:'choice',optionId:'a'}}),[]);
 });
 it('revises and retracts evidence rather than accumulating contradictory preview history',()=>{
  const q=previewQuestions[0],original=answerPreview({},0,{kind:'choice',optionId:q.choices![0].id});
  assert.ok(previewInsights(original).length>0);
  const revised=answerPreview(original,0,{kind:'skip'});
  assert.equal(previewAnswerList(revised).length,1);assert.deepEqual(previewInsights(revised),[]);
  assert.equal(previewAnswerList(original)[0].response.kind,'choice');
 });
});
function luminance(hex:string){const c=hex.slice(1).match(/../g)!.map(v=>parseInt(v,16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);return c[0]*0.2126+c[1]*0.7152+c[2]*0.0722;}
function contrast(a:string,b:string){const [lo,hi]=[luminance(a),luminance(b)].sort((a,b)=>a-b);return (hi+0.05)/(lo+0.05);}
it('keeps normal text, secondary text and primary buttons readable in both themes',()=>{
 for(const t of Object.values(themes)){
  for(const [text,bg] of [[t.text,t.surface],[t.text,t.card],[t.text,t.selection],[t.muted,t.surface],[t.muted,t.card],[t.accent,t.surface],[t.onAccent,t.accent]])assert.ok(contrast(text,bg)>=4.5,`${text} on ${bg}`);
  assert.ok(contrast(t.controlLine,t.card)>=3);assert.ok(contrast(t.accent,t.selection)>=3);
 }
});
