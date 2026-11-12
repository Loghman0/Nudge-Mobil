import { validateDiscoveryResponse } from './validation';
import type { DiscoveryAnswer, DiscoveryInsight, DiscoveryObservation, DiscoveryQuestion } from './types';
const identity=(value:string)=>encodeURIComponent(value);
export function deriveDiscoveryObservations(answers:readonly DiscoveryAnswer[],catalog:readonly DiscoveryQuestion[]):DiscoveryObservation[]{
  const observations=new Map<string,DiscoveryObservation>();
  for(const answer of answers){
    if(answer.useInProfile===false||answer.superseded)continue;
    const q=catalog.find(q=>q.id===answer.questionId&&q.version===answer.questionVersion);
    if(!q||q.purpose!=='evidence'||!validateDiscoveryResponse(q,answer.response).value)continue;
    const picked=answer.response.kind==='choice'?[answer.response.optionId]:answer.response.kind==='ranking'?answer.response.groups[0]??[]:[];
    for(const signal of q.signals??[]){
      if(!signal.optionId||!picked.includes(signal.optionId))continue;
      const id=`${signal.attributeKey}:${identity(signal.scope)}:${identity(signal.value)}`;
      const evidenceId=answer.id??`preview:${q.id}`;
      const existing=observations.get(id);
      if(existing){
        if(!existing.evidenceIds.includes(evidenceId))existing.evidenceIds.push(evidenceId);
        if(!existing.questionIds.includes(q.id))existing.questionIds.push(q.id);
        if(!existing.familyIds.includes(q.familyId))existing.familyIds.push(q.familyId);
        if(answer.answeredAt&&(!existing.answeredAt||answer.answeredAt>existing.answeredAt))existing.answeredAt=answer.answeredAt;
      }else observations.set(id,{id,attributeKey:signal.attributeKey,domain:q.domain,kind:signal.kind,value:signal.value,statement:signal.statement,scope:signal.scope,
        evidenceIds:[evidenceId],questionIds:[q.id],familyIds:[q.familyId],answeredAt:answer.answeredAt??null,strength:signal.strength,state:signal.strength==='direct'?'you_said':'early_signal',
        allowedUses:signal.criterion?['reflection','suggest_criterion']:['reflection'],...(signal.criterion?{criterion:signal.criterion}:{})});
    }
  }
  const result=[...observations.values()];
  for(const observation of result){
    // Joint first choices are compatible priorities, not a contradiction. Only
    // a different answer can provide opposing evidence for an observation.
    const opposition=result.filter(other=>other.attributeKey===observation.attributeKey&&other.scope===observation.scope&&other.value!==observation.value&&other.evidenceIds.some(id=>!observation.evidenceIds.includes(id)));
    if(opposition.length){observation.state='mixed';observation.opposingEvidenceIds=opposition.flatMap(other=>other.evidenceIds);}
    else if(observation.familyIds.length>=3){
      const days=new Set(answers.filter(answer=>observation.evidenceIds.includes(answer.id??`preview:${answer.questionId}`)&&answer.answeredAt).map(answer=>answer.answeredAt!.slice(0,10)));
      if(days.size>=2)observation.state='repeated_pattern';
    }
  }
  return result;
}
export function buildDiscoveryInsights(answers:readonly DiscoveryAnswer[],catalog:readonly DiscoveryQuestion[]):DiscoveryInsight[]{
  const observations=deriveDiscoveryObservations(answers,catalog);
  return observations.map(observation=>({id:observation.id,title:observation.state==='mixed'?'Different situations may matter':'From your answers',statement:observation.statement,evidenceIds:observation.evidenceIds,questionIds:observation.questionIds,state:observation.state,domain:observation.domain,attributeKey:observation.attributeKey}));
}
