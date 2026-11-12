import {validPushIntent,validPushPreferences,pushUuid,type PushIntent,type PushReceipt,type PushState} from './push-registration';
export interface CircleSummary{id:string;name:string;owner_id:string;invite_code:string|null;created_at?:string}
export interface CirclePoll{id:string;question:string;status:string;createdBy:string;createdAt:string;myVote:string|null;options:{id:string;label:string;count:number}[];totalVotes:number;winnerId:string|null;tiedIds:string[];hasVotes:boolean}
export interface CircleDetail{circle:CircleSummary;members:{user_id:string;full_name:string;role:string;joined_at:string}[];polls:CirclePoll[];pollLimit:number}
export interface EarlierState{generation:number;checks:{id:string;nodeId:string;prompt:string;key:string;polarity:string;label:string}[];pattern:{prefKey:string;label:string;evidence:number}|null}
export interface Belief{id:string;key:string;value:string|null;polarity:string;source:string;status:string;evidenceCount:number;category:string|null}
export interface BeliefPage{nodes:Belief[];generation:number;offset:number;hasMore:boolean}
export interface Memory{id:string;content:string;kind:string;confidence:number;created_at:string}
export interface MemoryPage{memories:Memory[];hasMore:boolean;generation:number;offset:number}
export type MemoryKind='fact'|'goal'|'habit'|'constraint';
export interface MemorySuggestion{kind:MemoryKind;content:string}
export interface MemoryDraft{generation:number;suggestions:MemorySuggestion[]}
export interface MemoryReview{requestId:string;generation:number;reviewed:true;memories:MemorySuggestion[]}
export type RecapReason='off'|'unavailable'|'capacity'|'no_data'|'failed'|'timed_out'|'changed';
export type RecapResult={text:string;sampleSize:number;sampled:boolean;windowStart:string;asOf:string}|{text:null;reason:RecapReason};
function recap(v:unknown):v is RecapResult{
 if(!record(v))return false;
 if(v.text===null)return ['off','unavailable','capacity','no_data','failed','timed_out','changed'].includes(String(v.reason));
 return string(v.text)&&!!v.text.trim()&&v.text.length<=6000&&v.reason===undefined&&integer(v.sampleSize)&&v.sampleSize>=3&&v.sampleSize<=100&&typeof v.sampled==='boolean'&&(!v.sampled||v.sampleSize===100)&&timestamp(v.windowStart)&&timestamp(v.asOf)&&Date.parse(v.asOf)-Date.parse(v.windowStart)===30*86400000;
}
function suggestion(v:unknown):v is MemorySuggestion{return record(v)&&['fact','goal','habit','constraint'].includes(String(v.kind))&&string(v.content)&&!!v.content.trim()&&v.content.length<=300;}
function memoryDraft(v:unknown):v is {draft:MemoryDraft}{return record(v)&&record(v.draft)&&integer(v.draft.generation)&&Array.isArray(v.draft.suggestions)&&v.draft.suggestions.length>=1&&v.draft.suggestions.length<=6&&v.draft.suggestions.every(suggestion);}
export interface Evidence{id:string;kind:string;direction:number|string;weight:number;created_at:string;source_decision_id:string|null;detail:unknown}
export interface DecisionActivity{asOf:string;timeZone:string;sampleLimit:250;sampleSize:number;sampleCapped:boolean;period:'rolling_seven_days';windowStart:string;windowEndExclusive:string;buckets:{start:string;endExclusive:string;count:number}[];weekdays:{weekday:number;count:number}[]}
export interface PreferenceTimeline{asOf:string;timeZone:string;limit:6;items:{id:string;key:string;label:string;polarity:'like'|'dislike'|'neutral';source:'explicit'|'inferred'|'reflected';createdAt:string;reinforcedAt:string|null;occurredAt:string}[]}
export interface Outcomes{sampleLimit:number;sampleSize:number;reflectionCount:number;ratedCount:number;averageRating:number|null;regretRate:number|null;categories:{category:string;count:number;rated:number;average:number|null}[];recent:{id:string;question:string;chosen:string|null;rating:number|null;regret:boolean|null}[];aiRecapAvailable:boolean;activity?:DecisionActivity}
export class MoreApiError extends Error{constructor(public status:number,public code:string,message:string){super(message);this.name='MoreApiError';}}
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const string=(v:unknown):v is string=>typeof v==='string';
const integer=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0;
const numeric=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const uuid=(v:unknown):v is string=>string(v)&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const nullableString=(v:unknown)=>v===null||string(v);
function circle(v:unknown):v is CircleSummary{return record(v)&&uuid(v.id)&&string(v.name)&&uuid(v.owner_id)&&nullableString(v.invite_code);}
function detail(v:unknown):v is CircleDetail{return record(v)&&circle(v.circle)&&integer(v.pollLimit)&&Array.isArray(v.members)&&v.members.every(m=>record(m)&&uuid(m.user_id)&&string(m.full_name)&&string(m.role)&&string(m.joined_at))&&Array.isArray(v.polls)&&v.polls.every(p=>record(p)&&uuid(p.id)&&string(p.question)&&['open','closed'].includes(String(p.status))&&uuid(p.createdBy)&&string(p.createdAt)&&nullableString(p.myVote)&&integer(p.totalVotes)&&nullableString(p.winnerId)&&typeof p.hasVotes==='boolean'&&Array.isArray(p.tiedIds)&&p.tiedIds.every(uuid)&&Array.isArray(p.options)&&p.options.every(o=>record(o)&&uuid(o.id)&&string(o.label)&&integer(o.count)));}
function earlier(v:unknown):v is EarlierState{return record(v)&&integer(v.generation)&&Array.isArray(v.checks)&&v.checks.every(c=>record(c)&&uuid(c.id)&&uuid(c.nodeId)&&string(c.prompt)&&string(c.key)&&string(c.polarity)&&string(c.label))&&(v.pattern===null||record(v.pattern)&&string(v.pattern.prefKey)&&string(v.pattern.label)&&integer(v.pattern.evidence));}
function beliefs(v:unknown):v is BeliefPage{return record(v)&&integer(v.generation)&&integer(v.offset)&&typeof v.hasMore==='boolean'&&Array.isArray(v.nodes)&&v.nodes.every(n=>record(n)&&uuid(n.id)&&string(n.key)&&nullableString(n.value)&&['like','dislike','neutral'].includes(String(n.polarity))&&string(n.source)&&string(n.status)&&integer(n.evidenceCount)&&nullableString(n.category));}
function memories(v:unknown):v is MemoryPage{return record(v)&&integer(v.generation)&&integer(v.offset)&&typeof v.hasMore==='boolean'&&Array.isArray(v.memories)&&v.memories.every(m=>record(m)&&uuid(m.id)&&string(m.content)&&string(m.kind)&&numeric(m.confidence)&&string(m.created_at));}
function timestamp(v:unknown):v is string{
 if(!string(v)||v.length>40||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(v)||!Number.isFinite(Date.parse(v)))return false;
 const year=Number(v.slice(0,4)),month=Number(v.slice(5,7)),day=Number(v.slice(8,10)),leap=year%4===0&&(year%100!==0||year%400===0);
 return month>=1&&month<=12&&day>=1&&day<=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31][month-1]&&Number(v.slice(11,13))<24&&Number(v.slice(14,16))<60&&Number(v.slice(17,19))<60;
}
function timeZone(v:unknown):v is string{if(!string(v)||!v||v.length>64)return false;try{new Intl.DateTimeFormat('en-US',{timeZone:v}).format(0);return true;}catch{return false;}}
function activity(v:unknown):v is DecisionActivity{
 if(!record(v)||!timestamp(v.asOf)||!timeZone(v.timeZone)||v.sampleLimit!==250||!integer(v.sampleSize)||v.sampleSize>250||v.sampleCapped!==(v.sampleSize===250)||v.period!=='rolling_seven_days'||!timestamp(v.windowStart)||v.windowEndExclusive!==v.asOf||!Array.isArray(v.buckets)||v.buckets.length!==12||!Array.isArray(v.weekdays)||v.weekdays.length!==7)return false;
 let previous=Date.parse(v.windowStart),total=0;
 for(const bucket of v.buckets){if(!record(bucket)||!timestamp(bucket.start)||!timestamp(bucket.endExclusive)||Date.parse(bucket.start)!==previous||Date.parse(bucket.endExclusive)-previous!==604800000||!integer(bucket.count)||bucket.count>v.sampleSize)return false;previous=Date.parse(bucket.endExclusive);total+=bucket.count;}
 if(previous!==Date.parse(v.asOf)||total>v.sampleSize)return false;
 let weekdayTotal=0;for(let index=0;index<7;index++){const day=v.weekdays[index];if(!record(day)||day.weekday!==index||!integer(day.count)||day.count>v.sampleSize)return false;weekdayTotal+=day.count;}
 return weekdayTotal===total;
}
function timeline(v:unknown):v is PreferenceTimeline{
 if(!record(v)||!timestamp(v.asOf)||!timeZone(v.timeZone)||v.limit!==6||!Array.isArray(v.items)||v.items.length>6)return false;
 const ids=new Set<string>();let previous=Infinity;
 for(const item of v.items){if(!record(item)||!uuid(item.id)||ids.has(item.id)||!string(item.key)||!item.key||item.key.length>512||item.key.startsWith('discovery.')||!string(item.label)||!item.label.trim()||item.label.length>2000||!['like','dislike','neutral'].includes(String(item.polarity))||!['explicit','inferred','reflected'].includes(String(item.source))||!timestamp(item.createdAt)||!(item.reinforcedAt===null||timestamp(item.reinforcedAt))||!timestamp(item.occurredAt)||item.occurredAt!==(item.reinforcedAt??item.createdAt))return false;
  const occurred=Date.parse(item.occurredAt);if(occurred>Date.parse(v.asOf)||Date.parse(item.createdAt)>Date.parse(v.asOf)||occurred>previous)return false;previous=occurred;ids.add(item.id);
 }
 return true;
}
function outcomes(v:unknown):v is Outcomes{return record(v)&&integer(v.sampleLimit)&&integer(v.sampleSize)&&integer(v.reflectionCount)&&integer(v.ratedCount)&&(v.averageRating===null||numeric(v.averageRating))&&(v.regretRate===null||numeric(v.regretRate))&&typeof v.aiRecapAvailable==='boolean'&&Array.isArray(v.categories)&&v.categories.every(c=>record(c)&&string(c.category)&&integer(c.count)&&integer(c.rated)&&(c.average===null||numeric(c.average)))&&Array.isArray(v.recent)&&v.recent.every(r=>record(r)&&uuid(r.id)&&string(r.question)&&nullableString(r.chosen)&&(r.rating===null||numeric(r.rating))&&(r.regret===null||typeof r.regret==='boolean'))&&(v.activity===undefined||activity(v.activity)&&v.activity.sampleLimit===v.sampleLimit&&v.activity.sampleSize===v.sampleSize);}
const saved=(v:unknown):v is {saved:true}=>record(v)&&v.saved===true;
const created=(v:unknown):v is {id:string}=>record(v)&&uuid(v.id);
const invalid=()=>new MoreApiError(400,'invalid_request','Check this change before saving.');
/** No mutation auto-retries: several inherited RPCs have no durable request ID. */
export class MoreApi{
 private readonly origin:string;private readonly fetcher:typeof fetch;private readonly token:()=>Promise<string|null>;
 constructor({baseUrl,accessToken,fetch:fetcher=fetch}:{baseUrl:string;accessToken:()=>Promise<string|null>;fetch?:typeof fetch}){
  const url=new URL(baseUrl);if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw new Error('Use the HTTPS Nudge API origin.');this.origin=url.origin;this.fetcher=fetcher;this.token=accessToken;
 }
 circles(){return this.call('circles','GET',undefined,(v):v is {circles:CircleSummary[];limit:number}=>record(v)&&Array.isArray(v.circles)&&v.circles.every(circle)&&integer(v.limit));}
 circle(id:string){this.id(id);return this.call('circles/'+id,'GET',undefined,detail);}
 createCircle(name:string){if(!name.trim()||name.length>80)throw invalid();return this.call('circles/create','POST',{name},created);}
 joinCircle(code:string){if(!/^[a-f0-9]{18}$/i.test(code.trim()))throw invalid();return this.call('circles/join','POST',{code:code.trim()},created);}
 manageCircle(id:string,action:'leave'|'rotate'|'delete',confirmation?:string){this.id(id);if(action==='delete'&&confirmation!=='DELETE')throw invalid();return this.call(`circles/${id}/${action}`,'POST',action==='delete'?{confirmation}:{},saved);}
 createPoll(circleId:string,question:string,options:string[]){this.id(circleId);if(!question.trim()||question.length>200||options.length<2||options.length>5||options.some(o=>!o.trim()||o.length>100)||new Set(options.map(o=>o.trim().toLowerCase())).size!==options.length)throw invalid();return this.call(`circles/${circleId}/polls`,'POST',{question,options:[...options]},created);}
 vote(pollId:string,optionId:string){this.id(pollId);this.id(optionId);return this.call(`polls/${pollId}/vote`,'POST',{optionId},saved);}
 close(pollId:string,circleId:string){this.id(pollId);this.id(circleId);return this.call(`polls/${pollId}/close`,'POST',{circleId},saved);}
 earlier(){return this.call('earlier','GET',undefined,earlier);}
 verify(queueId:string,answer:'still_true'|'not_anymore'|'forget'){this.id(queueId);return this.call('earlier/check','POST',{queueId,answer},saved);}
 pattern(key:string,confirmed:boolean,expectedGeneration:number){this.generation(expectedGeneration);return this.call('earlier/pattern','POST',{key,confirmed,expectedGeneration},saved);}
 beliefs(query='',offset=0){this.page(query,offset);return this.call('beliefs?q='+encodeURIComponent(query)+'&offset='+offset,'GET',undefined,beliefs);}
 evidence(id:string){this.id(id);return this.call(`beliefs/${id}/evidence`,'GET',undefined,(v):v is {evidence:Evidence[]}=>record(v)&&Array.isArray(v.evidence)&&v.evidence.every(e=>record(e)&&uuid(e.id)&&string(e.kind)&&(numeric(e.direction)||string(e.direction))&&numeric(e.weight)&&string(e.created_at)&&nullableString(e.source_decision_id)));}
 correctBelief(id:string,polarity:'like'|'dislike'|'neutral',note:string,expectedGeneration:number){this.id(id);this.generation(expectedGeneration);if(note.length>300)throw invalid();return this.call(`beliefs/${id}/correct`,'POST',{polarity,note,expectedGeneration},saved);}
 forgetBelief(id:string,expectedGeneration:number){this.id(id);this.generation(expectedGeneration);return this.call(`beliefs/${id}/forget`,'POST',{expectedGeneration},saved);}
 memories(query='',offset=0){this.page(query,offset);return this.call('memories?q='+encodeURIComponent(query)+'&offset='+offset,'GET',undefined,memories);}
 extractNotes(text:string){if(text.trim().length<3||text.length>2000)throw invalid();return this.call('memories/extract','POST',{text},memoryDraft);}
 confirmNotes(review:MemoryReview){
  if(!uuid(review.requestId)||!integer(review.generation)||review.reviewed!==true||!Array.isArray(review.memories)||review.memories.length<1||review.memories.length>6||!review.memories.every(suggestion))throw invalid();
  return this.call('memories/confirm','POST',review,(v):v is {saved:number}=>record(v)&&v.saved===review.memories.length);
 }
 editMemory(id:string,content:string,kind:string,expectedGeneration:number){this.id(id);this.generation(expectedGeneration);if(!content.trim()||content.length>300||!['fact','goal','habit','constraint'].includes(kind))throw invalid();return this.call(`memories/${id}/edit`,'POST',{content,kind,expectedGeneration},saved);}
 deleteMemory(id:string,expectedGeneration:number){this.id(id);this.generation(expectedGeneration);return this.call(`memories/${id}/delete`,'POST',{expectedGeneration},saved);}
 outcomes(){return this.call('outcomes','GET',undefined,outcomes);}
 recap(){return this.call('outcomes/recap','POST',{confirmed:true},recap,true);}
 pushStatus(installationId:string){if(!pushUuid(installationId))throw invalid();return this.call('push/status','POST',{installationId},(v):v is PushState=>record(v)&&typeof v.configured==='boolean'&&(v.device===null||record(v.device)&&typeof v.device.enabled==='boolean'&&timestamp(v.device.expires_at)&&validPushPreferences({timeZone:v.device.time_zone,quietStart:v.device.quiet_start,quietEnd:v.device.quiet_end})),true,10000);}
 pushDevice(intent:PushIntent){if(!validPushIntent(intent))throw invalid();return this.call('push/device','POST',intent,(v):v is PushReceipt=>record(v)&&v.saved===true&&typeof v.enabled==='boolean'&&v.epoch===intent.epoch,false,10000);}
 enableDailyQuestions(device:{installationId:string;secret:string;epoch:number}){
  return this.call('push/daily','POST',{installationId:device.installationId,secret:device.secret,epoch:device.epoch},(v):v is {saved:boolean}=>record(v)&&typeof v.saved==='boolean',false,10000);
 }
 timeline(){return this.call('timeline','GET',undefined,timeline);}
 private id(id:string){if(!uuid(id))throw invalid();}private generation(n:number){if(!integer(n))throw invalid();}private page(q:string,n:number){if(q.length>80||!integer(n)||n>1000000)throw invalid();}
 private async call<T>(path:string,method:string,input:unknown,validate:(v:unknown)=>v is T,readOnlyPost=false,timeoutMs=20000):Promise<T>{
  const reads=method==='GET'||readOnlyPost;
  const wire=input===undefined?undefined:JSON.stringify(input);if(wire&&wire.length>12000)throw invalid();const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
  const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new MoreApiError(0,'timeout',reads?'This is taking longer than expected. Try loading again.':'Could not confirm the change. Reload before trying again.'));},timeoutMs);});
  const run=async()=>{
   const token=await this.token();if(!token||/[\s,]/.test(token))throw new MoreApiError(401,'unauthenticated','Sign in again to continue.');if(controller.signal.aborted)throw new MoreApiError(0,'timeout','Load this tool again.');
   const res=await this.fetcher(this.origin+'/api/v1/tools/'+path,{method,headers:{Authorization:'Bearer '+token,Accept:'application/json',...(wire===undefined?{}:{'Content-Type':'application/json'})},...(wire===undefined?{}:{body:wire}),credentials:'omit',cache:'no-store',redirect:'error',signal:controller.signal});
   if(res.url&&new URL(res.url).origin!==this.origin)throw new MoreApiError(503,'unavailable','Could not load this tool.');const data:unknown=await res.json();
   if(!res.ok){if(record(data)&&record(data.error)&&string(data.error.code)&&['unauthenticated','forbidden','needs_terms','invalid_request','not_found','changed','uncertain_create','unavailable','too_large'].includes(data.error.code)&&string(data.error.message)&&data.error.message.length<=1000)throw new MoreApiError(res.status,data.error.code,data.error.message);throw new MoreApiError(res.status,'unavailable','Could not finish this step. Reload before trying again.');}
   if(!validate(data))throw new MoreApiError(503,'unavailable','Could not confirm the response. Reload before making another change.');return data;
  };
  try{return await Promise.race([run(),timeout]);}catch(e){if(e instanceof MoreApiError)throw e;throw new MoreApiError(0,'offline',reads?'Could not reach Nudge. Check your connection and load again.':'Could not confirm the change. Check your connection and reload before trying again.');}finally{if(timer!==undefined)clearTimeout(timer);}
 }
}
