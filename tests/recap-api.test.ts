import {it} from 'node:test';
import assert from 'node:assert/strict';
import {MoreApi,MoreApiError} from '../src/more-api';
const asOf='2026-11-10T12:00:00Z',windowStart='2026-10-11T12:00:00Z';
const recap={text:'A short recap.',sampleSize:3,sampled:false,asOf,windowStart};
const api=(value:unknown)=>new MoreApi({baseUrl:'https://nudge.test',accessToken:async()=>'fixture',fetch:async()=>Response.json(value)});
it('explicitly requests recap using bearer-only POST and validates bounded sample/window',async()=>{
 let count=0;const a=new MoreApi({baseUrl:'https://nudge.test',accessToken:async()=>'fixture',fetch:async(url,init)=>{count++;assert.ok(String(url).endsWith('/outcomes/recap'));assert.equal(init?.method,'POST');assert.equal(init?.credentials,'omit');assert.equal(init?.cache,'no-store');assert.deepEqual(JSON.parse(String(init?.body)),{confirmed:true});return Response.json(recap);}});
 assert.equal(count,0);assert.deepEqual(await a.recap(),recap);assert.equal(count,1);
 for(const reason of ['off','unavailable','capacity','no_data','failed','timed_out','changed'])assert.deepEqual(await api({text:null,reason}).recap(),{text:null,reason});
});
it('rejects invented success, unbounded samples, invalid dates and stale/unknown envelopes',async()=>{
 for(const bad of [{...recap,sampleSize:2},{...recap,sampleSize:101},{...recap,sampled:true},{...recap,windowStart:asOf},{...recap,text:' '},{...recap,text:'x'.repeat(6001)},{text:null,reason:'unknown'},{...recap,reason:'changed'}])await assert.rejects(api(bad).recap(),MoreApiError);
});
it('does not describe a failed recap read as a possibly saved memory and never retries automatically',async()=>{
 let calls=0;const a=new MoreApi({baseUrl:'https://nudge.test',accessToken:async()=>'fixture',fetch:async()=>{calls++;throw Error('offline');}});
 await assert.rejects(a.recap(),(e:unknown)=>e instanceof MoreApiError&&!/change|saved/.test(e.message));assert.equal(calls,1);
});
