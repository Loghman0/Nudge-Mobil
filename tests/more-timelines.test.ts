import {describe,it} from 'node:test';
import assert from 'node:assert/strict';
import {MoreApi,MoreApiError} from '../src/more-api';

const id='00000000-0000-4000-8000-000000000001',asOf='2026-11-09T12:00:00.000Z',week=604800000;
const activity=()=>({asOf,timeZone:'Asia/Baku',sampleLimit:250,sampleSize:1,sampleCapped:false,period:'rolling_seven_days',windowStart:new Date(Date.parse(asOf)-12*week).toISOString(),windowEndExclusive:asOf,buckets:Array.from({length:12},(_,index)=>({start:new Date(Date.parse(asOf)-(12-index)*week).toISOString(),endExclusive:new Date(Date.parse(asOf)-(11-index)*week).toISOString(),count:index===11?1:0})),weekdays:Array.from({length:7},(_,weekday)=>({weekday,count:weekday===0?1:0}))});
const outcomes=()=>({sampleLimit:250,sampleSize:1,reflectionCount:0,ratedCount:0,averageRating:null,regretRate:null,categories:[],recent:[],aiRecapAvailable:false,activity:activity()});
const timeline=()=>({asOf,timeZone:'UTC',limit:6,items:[{id,key:'hobby.walking',label:'Walking',polarity:'like',source:'explicit',createdAt:'2026-11-08T00:00:00Z',reinforcedAt:null,occurredAt:'2026-11-08T00:00:00Z'}]});
const json=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
const apiFor=(value:unknown)=>new MoreApi({baseUrl:'https://nudge.test',accessToken:async()=>'fixture',fetch:async()=>json(value)});
describe('native timeline read contracts',()=>{
 it('loads read-only owner transports without cookies or write payloads',async()=>{
  const calls:{url:string;init:RequestInit}[]=[],api=new MoreApi({baseUrl:'https://nudge.test',accessToken:async()=>'fixture',fetch:async(url,init)=>{calls.push({url:String(url),init:init!});return json(String(url).endsWith('/timeline')?timeline():outcomes());}});
  assert.equal((await api.timeline()).items[0].id,id);assert.equal((await api.outcomes()).activity?.buckets.length,12);for(const call of calls){assert.equal(call.init.method,'GET');assert.equal(call.init.body,undefined);assert.equal(call.init.credentials,'omit');assert.equal(call.init.cache,'no-store');assert.equal(call.init.redirect,'error');assert.equal((call.init.headers as Record<string,string>).Authorization,'Bearer fixture');}assert.equal(calls[0].url,'https://nudge.test/api/v1/tools/timeline');
 });
 it('accepts the earlier outcomes contract without inventing zero activity',async()=>{const {activity:_activity,...old}=outcomes();assert.equal((await apiFor(old).outcomes()).activity,undefined);});
 it('rejects invalid periods, inconsistent sample sizes, gaps, bad zones and invented totals',async()=>{
  for(const mutate of [(v:ReturnType<typeof outcomes>)=>{v.activity.buckets[1].start=v.activity.buckets[0].start;},(v:ReturnType<typeof outcomes>)=>{v.activity.timeZone='Unknown/Zone';},(v:ReturnType<typeof outcomes>)=>{v.activity.sampleSize=2;},(v:ReturnType<typeof outcomes>)=>{v.activity.weekdays[0].count=0;},(v:ReturnType<typeof outcomes>)=>{v.activity.buckets.pop();},(v:ReturnType<typeof outcomes>)=>{v.activity.buckets[0].count=-1;}]){const value=outcomes();mutate(value);await assert.rejects(apiFor(value).outcomes(),MoreApiError);}
 });
 it('rejects discovery entries, duplicate IDs, malformed dates and future timeline records',async()=>{
  for(const mutate of [(v:ReturnType<typeof timeline>)=>{v.items[0].key='discovery.private';},(v:ReturnType<typeof timeline>)=>{v.items.push({...v.items[0]});},(v:ReturnType<typeof timeline>)=>{v.items[0].occurredAt='not a date';},(v:ReturnType<typeof timeline>)=>{v.items[0].createdAt='2026-02-30T00:00:00Z';v.items[0].occurredAt=v.items[0].createdAt;},(v:ReturnType<typeof timeline>)=>{v.items[0].createdAt='2027-01-01T00:00:00Z';v.items[0].occurredAt=v.items[0].createdAt;}]){const value=timeline();mutate(value);await assert.rejects(apiFor(value).timeline(),MoreApiError);}
 });
 it('reports read failure without mutation uncertainty and never silently retries',async()=>{let calls=0;const api=new MoreApi({baseUrl:'https://nudge.test',accessToken:async()=>'fixture',fetch:async()=>{calls++;throw new TypeError('offline');}});await assert.rejects(api.timeline(),(error:unknown)=>error instanceof MoreApiError&&error.code==='offline'&&!/may have saved/i.test(error.message));assert.equal(calls,1);});
 it('retains an unavailable endpoint as an error rather than a fabricated empty history',async()=>{const api=new MoreApi({baseUrl:'https://nudge.test',accessToken:async()=>'fixture',fetch:async()=>json({error:{code:'not_found',message:'Timeline unavailable.'}},404)});await assert.rejects(api.timeline(),(error:unknown)=>error instanceof MoreApiError&&error.status===404);});
});
