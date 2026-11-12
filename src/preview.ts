import questions from './core/questions.json';
import type {DiscoveryAnswerInput,DiscoveryQuestion,DiscoveryResponse} from './core/types';
import {validateDiscoveryResponse} from './core/validation';
import {buildDiscoveryInsights} from './core/observation-core';
import {previewCopy,previewOrder} from './preview-copy';
export {describeDiscoveryResponse} from './core/validation';
export type {DiscoveryResponse} from './core/types';
export const previewQuestions=previewOrder.map(id=>{
 const source=(questions as DiscoveryQuestion[]).find(question=>question.id===id);
 if(!source)throw new Error('Preview question is unavailable.');
 const copy=previewCopy[id];
 if(!copy||source.choices?.length!==copy.choices.length)throw new Error('Preview wording is unavailable.');
 return {...source,prompt:copy.prompt,choices:source.choices.map((choice,index)=>({...choice,label:copy.choices[index]}))};
});
export type PreviewAnswers=Readonly<Record<string,DiscoveryResponse>>;

export function answerPreview(answers:PreviewAnswers,index:number,response:DiscoveryResponse):PreviewAnswers{
 const question=previewQuestions[index];
 if(!question)throw new Error('This question is unavailable.');
 const parsed=validateDiscoveryResponse(question,response);
 if(!parsed.value)throw new Error(parsed.error??'Choose an answer or skip.');
 return {...answers,[question.id]:parsed.value};
}
export function previewAnswerList(answers:PreviewAnswers):DiscoveryAnswerInput[]{
 return previewQuestions.flatMap(question=>{
  const response=answers[question.id];
  if(!response)return [];
  const parsed=validateDiscoveryResponse(question,response);
  return parsed.value?[{questionId:question.id,questionVersion:question.version,response:parsed.value}]:[];
 });
}
export function previewInsights(answers:PreviewAnswers){return buildDiscoveryInsights(previewAnswerList(answers),previewQuestions);}
