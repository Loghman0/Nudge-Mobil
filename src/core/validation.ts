import type { DiscoveryAnswerInput, DiscoveryQuestion, DiscoveryResponse } from './types';
const object = (v:unknown):v is Record<string,unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const only = (v:Record<string,unknown>, keys:string[]) => Object.keys(v).every(key => keys.includes(key));
export function validateDiscoveryResponse(question:DiscoveryQuestion, raw:unknown):{value?:DiscoveryResponse;error?:string} {
  const invalid = {error:'Choose an answer that fits this question, or skip it.'};
  if(!object(raw) || typeof raw.kind !== 'string') return invalid;
  if(['both','depends','neither','skip'].includes(raw.kind)) {
    if(!question.allowedResponses.includes(raw.kind as 'skip') || !only(raw,raw.kind==='depends'?['kind','context']:['kind']))return invalid;
    if(raw.context!==undefined && (typeof raw.context!=='string'||raw.context.length>140))return invalid;
    return {value:raw as unknown as DiscoveryResponse};
  }
  if(raw.kind!==question.format || !only(raw,raw.kind==='choice'?['kind','optionId']:raw.kind==='scale'?['kind','value']:raw.kind==='ranking'?['kind','groups']:['kind','text'])) return invalid;
  if(raw.kind==='choice') return typeof raw.optionId==='string' && question.choices?.some(choice=>choice.id===raw.optionId)?{value:{kind:'choice',optionId:raw.optionId}}:invalid;
  if(raw.kind==='scale') {
    const s=question.scale,v=raw.value;
    return s && typeof v==='number' && Number.isFinite(v) && v>=s.min && v<=s.max && Math.abs((v-s.min)/s.step-Math.round((v-s.min)/s.step))<1e-8?{value:{kind:'scale',value:v}}:invalid;
  }
  if(raw.kind==='ranking') {
    if(!question.ranking || !Array.isArray(raw.groups) || raw.groups.some(group=>!Array.isArray(group)||!group.length||group.some(id=>typeof id!=='string'||!question.choices?.some(choice=>choice.id===id))||(!question.ranking!.allowTies && group.length!==1)))return invalid;
    const ids=raw.groups.flat();
    return ids.length>=question.ranking.min&&ids.length<=question.ranking.max&&new Set(ids).size===ids.length?{value:{kind:'ranking',groups:raw.groups as string[][]}}:invalid;
  }
  if(raw.kind==='text' && typeof raw.text==='string' && raw.text.trim().length>0 && raw.text.length<=140 && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(raw.text))return {value:{kind:'text',text:raw.text.trim()}};
  return invalid;
}
export function parseAnswersFromCatalog(raw:unknown,catalog:readonly DiscoveryQuestion[],options:{previewOnly?:boolean;maxAnswers?:number}={}):{value?:DiscoveryAnswerInput[];error?:string} {
  if(!Array.isArray(raw)||!raw.length||raw.length>(options.maxAnswers??20))return {error:'Review the answers before saving.'};
  const answers:DiscoveryAnswerInput[]=[],seen=new Set<string>();
  for(const item of raw){
    if(!object(item)||!only(item,['questionId','questionVersion','response'])||typeof item.questionId!=='string'||!Number.isSafeInteger(item.questionVersion))return {error:'An answer has an invalid question version.'};
    const question=catalog.find(q=>q.id===item.questionId&&q.version===item.questionVersion);
    if(!question||question.status!=='published'||(options.previewOnly&&!question.preview)||seen.has(question.id))return {error:'This question is unavailable or repeated. Review your answers.'};
    const parsed=validateDiscoveryResponse(question,item.response);if(!parsed.value)return {error:parsed.error};
    seen.add(question.id);answers.push({questionId:question.id,questionVersion:question.version,response:parsed.value});
  }
  return {value:answers};
}
/** A narrow English safeguard, not a diagnosis or a promise of crisis detection. */
export function discoveryTextNeedsSupport(response:DiscoveryResponse):boolean {
  const text=response.kind==='text'?response.text:response.kind==='depends'?response.context??'':'';
  return /\b(?:kill myself|end my life|hurt myself|suicid(?:e|al)|want to die|can't go on|cannot go on)\b/i.test(text);
}
export function describeDiscoveryResponse(question:DiscoveryQuestion,response:DiscoveryResponse):string {
  if(response.kind==='choice')return question.choices?.find(choice=>choice.id===response.optionId)?.label??'Unavailable choice';
  if(response.kind==='ranking')return response.groups.map(group=>group.map(id=>question.choices?.find(choice=>choice.id===id)?.label??id).join(' = ')).join(' → ');
  if(response.kind==='scale')return `${response.value} of ${question.scale?.max??5}`;
  if(response.kind==='text')return response.text;
  return {both:'Both fit',depends:'It depends',neither:'Neither fits',skip:'Skipped'}[response.kind];
}
