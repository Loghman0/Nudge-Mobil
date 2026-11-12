import type {DiscoveryMood,DiscoveryQuestion} from './types';

/** Product heuristics for question comfort/effort, not a clinical assessment. */
export const DISCOVERY_MOODS:readonly {id:DiscoveryMood;label:string;hint:string}[]=[
 {id:'happy',label:'Happy',hint:'Play, tastes and connections.'},
 {id:'excited',label:'Excited',hint:'Ideas, creativity and things you might like to try.'},
 {id:'calm',label:'Calm',hint:'Room to reflect on everyday preferences and values.'},
 {id:'sad',label:'Sad',hint:'Everyday questions about comfort, support and what matters to you.'},
 {id:'angry',label:'Angry',hint:'Concrete questions about boundaries and priorities.'},
 {id:'anxious',label:'Anxious',hint:'Familiarity, routines and straightforward choices.'},
 {id:'tired',label:'Tired',hint:'Quick questions with less reading and sorting.'},
 {id:'mixed',label:'Mixed',hint:'A varied mix, with your usual settings.'},
];
export function discoveryMood(value:unknown):DiscoveryMood|null{
 return typeof value==='string'&&DISCOVERY_MOODS.some(mood=>mood.id===value)?value as DiscoveryMood:null;
}

export type MoodDecisionPriority=Readonly<{id:string;label:string;direction:'higher'|'lower'}>;
const decisionPriorities={
 effort:Object.freeze({id:'effort',label:'Effort needed',direction:'lower'}),
 flexibility:Object.freeze({id:'flexibility',label:'Flexibility to change plans',direction:'higher'}),
 commitments:Object.freeze({id:'commitments',label:'Commitments required',direction:'lower'}),
 familiarity:Object.freeze({id:'familiarity',label:'Familiarity',direction:'higher'}),
 enjoyment:Object.freeze({id:'enjoyment',label:'Enjoyment',direction:'higher'}),
 novelty:Object.freeze({id:'novelty',label:'Novelty',direction:'higher'}),
} as const satisfies Record<string,MoodDecisionPriority>;
const decisionPriorityIds:Record<DiscoveryMood,readonly (keyof typeof decisionPriorities)[]>={
 happy:['enjoyment','novelty','flexibility'],
 excited:['novelty','enjoyment','flexibility'],
 calm:['flexibility','effort','familiarity'],
 sad:['effort','familiarity','commitments'],
 angry:['flexibility','commitments','effort'],
 anxious:['familiarity','flexibility','effort'],
 tired:['effort','commitments','familiarity'],
 mixed:['flexibility','effort','familiarity'],
};
/**
 * Optional questions about what matters in this choice, not inferred needs.
 * The user must choose a priority, importance and option ratings. This helper
 * supplies no weights, option facts, evidence references or saved mood context.
 */
export function moodDecisionPriorities(mood?:DiscoveryMood|null):readonly MoodDecisionPriority[]{
 if(!mood||!discoveryMood(mood))return [];
 return Object.freeze(decisionPriorityIds[mood].map(id=>decisionPriorities[id]));
}

/**
 * A bounded preference after eligibility checks. It never changes answer meaning,
 * turns an emotion into evidence, or grants permission for depth/writing/topics.
 * These are product choices about question fit, not treatment recommendations.
 */
export function discoveryMoodFit(question:DiscoveryQuestion,mood?:DiscoveryMood|null):number{
 if(!mood||mood==='mixed')return 0;
 const quick=Math.max(0,1-question.estimatedSeconds/90);
 const simple=question.format==='choice'||question.format==='scale'?1:0;
 const easy=question.depth===0?1:0;
 const ordinary=question.sensitivity==='ordinary'?1:0;
 const playful=question.purpose==='playful'?1:0;
 const familiar=(domains:readonly string[])=>domains.includes(question.domain)?1:0;
 switch(mood){
  case 'happy':return .55*playful+.25*familiar(['play','creativity','community','food'])+.20*quick;
  case 'excited':return .50*playful+.30*familiar(['play','creativity','learning','future'])+.20*simple;
  case 'calm':return .30*(question.depth>0?1:0)+.25*(1-playful)+.15*(question.format==='scale'||question.format==='text'?1:0)+.30*familiar(['values','relationships','future','rest']);
  case 'sad':return .20*easy+.15*quick+.10*simple+.10*ordinary+.45*familiar(['rest','relationships','places','movement','food']);
  case 'angry':return .20*easy+.20*quick+.15*simple+.10*ordinary+.35*familiar(['rest','movement','digital','time','values']);
  case 'anxious':return .20*easy+.20*quick+.15*simple+.10*ordinary+.35*familiar(['rest','time','places','relationships']);
  case 'tired':return .40*quick+.30*simple+.20*easy+.10*ordinary;
 }
}
