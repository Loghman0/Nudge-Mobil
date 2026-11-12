import {describe,it} from 'node:test';
import assert from 'node:assert/strict';
import {SettingsApi,FoundationApi,SettingsApiError,validSettingDraft,savedSettingFields,matchingSavedPriorities,type SettingDraft} from '../src/settings-api';
const id='00000000-0000-4000-8000-000000000001';
const draft:SettingDraft={id:null,name:'Game materials',domain:'Minecraft survival',category:'hobbies',goal:'Gather iron',aliases:[{term:'mine',meaning:'Look for iron underground'}],generation:3};
const saved={...draft,id,memory_generation:3,created_at:'2026-11-08',updated_at:'2026-11-08'};
const json=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
describe('native saved-setting transport',()=>{
 it('keeps remembered priorities inside their setting and requires a category for broad domains',()=>{
  const commute={...saved,name:'Short commute',goal:'Short commute',domain:'everyday life',category:'work' as const,aliases:[]};
  const game={...commute,name:'Quick rounds',goal:'Quick rounds',domain:'my co-op game',category:'hobbies' as const};
  assert.deepEqual(matchingSavedPriorities([commute,game,saved],' Everyday  life '),[]);
  assert.deepEqual(matchingSavedPriorities([commute,game,saved],'everyday life','work'),[commute]);
  assert.deepEqual(matchingSavedPriorities([commute,game,saved],'everyday life','food'),[]);
  assert.deepEqual(matchingSavedPriorities([commute,game,saved],'My CO-OP game'),[game]);
  assert.deepEqual(matchingSavedPriorities([commute,game,saved],'Minecraft survival'),[]);
 });
 it('recovers a saved priority after a lost receipt without submitting a duplicate',async()=>{
  const priority={...saved,name:'Short commute',goal:'Short commute',domain:'work',category:'work',aliases:[]};
  let writes=0;
  const api=new SettingsApi({baseUrl:'https://nudge.test',accessToken:async()=>'fixture',fetch:async(_url,init)=>{
   if(init?.method==='GET')return json({state:{available:true,generation:3,settings:writes?[priority]:[]}});
   writes++;
   assert.deepEqual(JSON.parse(String(init?.body)),{id:null,name:'Short commute',goal:'Short commute',domain:'work',category:'work',aliases:[],generation:3});
   throw new TypeError('connection lost after save');
  }});
  assert.deepEqual(await api.rememberPriority('Work','work',' Short commute '),{saved:true,id});
  assert.deepEqual(await api.rememberPriority('work','work','Short commute'),{saved:true,id});
  assert.equal(writes,1);
 });
 it('applies only exact whole terms, preserves user meanings and keeps the privacy reference',()=>{
  const fields=savedSettingFields(saved,3,[' Mine ','Mine stone','cut'],{cut:'My project action'});
  assert.deepEqual(fields.optionDetails,{cut:'My project action',Mine:'Look for iron underground'});assert.deepEqual(fields.appliedSetting,{id,generation:3});
  assert.equal(savedSettingFields(saved,3,['mine'],{mine:'My own explanation'}).optionDetails.mine,'My own explanation');assert.throws(()=>savedSettingFields(saved,4,['mine'],{}),SettingsApiError);
 });
 it('binds bearer identity without cookies and only applies a current owner/generation row',async()=>{
  const calls:RequestInit[]=[];const api=new SettingsApi({baseUrl:'https://nudge.test',accessToken:async()=>'fixture',fetch:async(input,init)=>{calls.push(init!);assert.equal(String(input),`https://nudge.test/api/v1/decision-settings?id=${id}&generation=3`);return json({setting:saved,generation:3});}});
  assert.equal((await api.get(id,3)).setting.id,id);assert.equal(calls[0].credentials,'omit');assert.equal(calls[0].cache,'no-store');assert.equal(calls[0].redirect,'error');assert.equal((calls[0].headers as Record<string,string>).Authorization,'Bearer fixture');
 });
 it('freezes save input before a token refresh and never blindly retries',async()=>{
  let release!:(token:string)=>void;const refresh=new Promise<string>(resolve=>{release=resolve;});let calls=0;const input=structuredClone(draft);
  const api=new SettingsApi({baseUrl:'https://nudge.test',accessToken:()=>refresh,fetch:async(_url,init)=>{calls++;assert.equal(JSON.parse(init!.body as string).generation,3);assert.equal(JSON.parse(init!.body as string).aliases[0].meaning,draft.aliases[0].meaning);return json({saved:true,id});}});
  const saving=api.save(input);input.generation=7;input.aliases[0].meaning='Changed after tap';release('fixture');assert.equal((await saving).id,id);assert.equal(calls,1);
 });
 it('rejects unsafe configuration, invalid duplicate aliases and missing bearer without transport',async()=>{
  for(const baseUrl of ['http://nudge.test','https://nudge.test/path','https://user:pass@nudge.test','https://nudge.test?x=1'])assert.throws(()=>new SettingsApi({baseUrl,accessToken:async()=>'fixture'}));
  assert.equal(validSettingDraft({...draft,aliases:[{term:'mine iron',meaning:'One'},{term:' Mine  iron ',meaning:'Other'}]}),false);
  const api=new SettingsApi({baseUrl:'https://nudge.test',accessToken:async()=>null,fetch:async()=>{throw new Error('Must not send');}});await assert.rejects(api.list(),(e:unknown)=>e instanceof SettingsApiError&&e.status===401);
 });
 it('does not manufacture success from wrong-generation or malformed receipts',async()=>{
  const stale=new SettingsApi({baseUrl:'https://nudge.test',accessToken:async()=>'fixture',fetch:async()=>json({setting:{...saved,memory_generation:2},generation:3})});await assert.rejects(stale.get(id,3),SettingsApiError);
  const bad=new SettingsApi({baseUrl:'https://nudge.test',accessToken:async()=>'fixture',fetch:async()=>json({saved:false})});await assert.rejects(bad.save(draft),SettingsApiError);
 });
 it('preserves delete generation and distinguishes conflicts from uncertain writes',async()=>{
  let calls=0;const api=new SettingsApi({baseUrl:'https://nudge.test',accessToken:async()=>'fixture',fetch:async(_url,init)=>{calls++;assert.equal(init!.method,'DELETE');assert.deepEqual(JSON.parse(init!.body as string),{id,generation:3});return json({error:{code:'changed',message:'Reload your settings.'}},409);}});await assert.rejects(api.remove(id,3),(e:unknown)=>e instanceof SettingsApiError&&e.code==='changed');assert.equal(calls,1);
  const offline=new SettingsApi({baseUrl:'https://nudge.test',accessToken:async()=>'fixture',fetch:async()=>{throw new TypeError('network');}});await assert.rejects(offline.save(draft),(e:unknown)=>e instanceof SettingsApiError&&e.code==='offline'&&/Reload/.test(e.message));
 });
 it('keeps the legacy foundation separate and preserves exact reviewed answers',async()=>{
  let calls=0;const api=new FoundationApi({baseUrl:'https://nudge.test',accessToken:async()=>'fixture',fetch:async(url,init)=>{calls++;assert.equal(String(url),'https://nudge.test/api/v1/foundation');assert.deepEqual(JSON.parse(init!.body as string),{expectedGeneration:3,answers:[{questionId:id,answer:'skip'}]});return json({saved:true,generation:3});}});
  assert.equal((await api.complete({expectedGeneration:3,answers:[{questionId:id,answer:'skip'}]})).generation,3);assert.equal(calls,1);assert.throws(()=>api.complete({expectedGeneration:3,answers:[{questionId:id,answer:'a'},{questionId:id,answer:'b'}]}));
 });
});
