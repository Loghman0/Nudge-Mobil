import {describe,it} from 'node:test';
import assert from 'node:assert/strict';
import {resolveReminder} from '../src/reminder-time';
describe('native reminder time keeps explicit local intent',()=>{
 it('resolves a valid selected local time and enforces future/year bounds',()=>{
  const previous=process.env.TZ;try{process.env.TZ='UTC';const now=Date.parse('2026-01-01T12:00:00Z');
   assert.deepEqual(resolveReminder({year:2026,month:1,day:2,hour:10,minute:15},now),{dueAt:'2026-01-02T10:15:00.000Z'});
   assert.match(resolveReminder({year:2026,month:1,day:1,hour:12,minute:0},now).error!,/future/);
   assert.match(resolveReminder({year:2027,month:1,day:2,hour:12,minute:0},now).error!,/next year/);
   assert.ok(resolveReminder({year:2026,month:2,day:30,hour:12,minute:0},now).error);
   assert.ok(resolveReminder({year:2026,month:1,day:2,hour:12.5,minute:0},now).error);
  }finally{if(previous===undefined)delete process.env.TZ;else process.env.TZ=previous;}
 });
 it('rejects missing and repeated clock hours rather than silently choosing an instant',()=>{
  const previous=process.env.TZ;try{process.env.TZ='America/New_York';const now=Date.parse('2026-01-01T00:00:00Z');
   assert.match(resolveReminder({year:2026,month:3,day:8,hour:2,minute:30},now).error!,/does not exist/);
   assert.match(resolveReminder({year:2026,month:11,day:1,hour:1,minute:30},now).error!,/happens twice/);
   assert.equal(resolveReminder({year:2026,month:11,day:1,hour:3,minute:30},now).dueAt,'2026-11-01T08:30:00.000Z');
  }finally{if(previous===undefined)delete process.env.TZ;else process.env.TZ=previous;}
 });
});
