import {previewAnswerList,previewQuestions,type PreviewAnswers} from './preview';
import {validateDiscoveryResponse} from './core/validation';
export const DRAFT_KEY='nudge.preview.v2',DRAFT_MAX_AGE=86400000;
export interface PreviewClaim {requestId:string;expectedGeneration:number;userId:string}
export interface NativeDraft {version:2;createdAt:number;answers:PreviewAnswers;claim?:PreviewClaim}
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
export function parseNativeDraft(raw:string|null,now=Date.now()):NativeDraft|null{
 if(!raw||raw.length>16000)return null;
 try{
  const d=JSON.parse(raw);
  if(d.version!==2||!Number.isFinite(d.createdAt)||d.createdAt>now||now-d.createdAt>DRAFT_MAX_AGE||!d.answers||typeof d.answers!=='object'||Array.isArray(d.answers))return null;
  if(Object.keys(d.answers).some(id=>!previewQuestions.some(q=>q.id===id)))return null;
  const answers:Record<string,import('./core/types').DiscoveryResponse>={};
  for(const q of previewQuestions){if(d.answers[q.id]!==undefined){const r=validateDiscoveryResponse(q,d.answers[q.id]);if(!r.value)return null;answers[q.id]=r.value;}}
  if(d.claim&&(!uuid(d.claim.requestId)||!uuid(d.claim.userId)||!Number.isSafeInteger(d.claim.expectedGeneration)||d.claim.expectedGeneration<0||!previewAnswerList(answers).length))return null;
  return {version:2,createdAt:d.createdAt,answers,...(d.claim?{claim:{requestId:d.claim.requestId,expectedGeneration:d.claim.expectedGeneration,userId:d.claim.userId}}:{})};
 }catch{return null;}
}
export function prepareClaim(draft:NativeDraft,userId:string,generation:number,requestId:string):NativeDraft{
 if(!parseNativeDraft(JSON.stringify(draft)))throw new Error('This preview has expired. Start again before saving.');
 if(draft.claim){if(draft.claim.userId!==userId)throw new Error('These answers are attached to a different account. Discard this device preview to start again.');return draft;}
 const next={...draft,answers:JSON.parse(JSON.stringify(draft.answers)) as PreviewAnswers,claim:{userId,expectedGeneration:generation,requestId}};
 if(!parseNativeDraft(JSON.stringify(next)))throw new Error('Review your preview again before saving.');return next;
}
