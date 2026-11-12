import type {DiscoveryAnswer,DiscoveryQuestion,DiscoveryResponse,DiscoveryInsight,DiscoveryExposure,DiscoveryDomain} from './types';
export type DiscoveryFeedback='fits'|'sometimes'|'not_me';
export interface SavedDiscoveryAnswer extends DiscoveryAnswer {id:string;question:DiscoveryQuestion;revision:number;active:boolean;answeredAt:string;response:DiscoveryResponse}
export interface DiscoverySettings {mutedTopics:DiscoveryDomain[];optionalTopics:boolean;maxDepth:0|1|2;writtenAnswers:boolean;metricsEnabled:boolean}
export interface DiscoveryProfile {available:boolean;generation:number;today?:string;suppressedQuestionIds:string[];capabilities:{writtenAnswers:boolean;optionalTopics:boolean};answers:SavedDiscoveryAnswer[];insights:(DiscoveryInsight&{feedback?:DiscoveryFeedback})[];counts:{answers:number;domains:number;confirmed:number};settings:DiscoverySettings;exposures:DiscoveryExposure[]}
export const DEFAULT_DISCOVERY_SETTINGS:DiscoverySettings={mutedTopics:[],optionalTopics:false,maxDepth:0,writtenAnswers:false,metricsEnabled:false};

