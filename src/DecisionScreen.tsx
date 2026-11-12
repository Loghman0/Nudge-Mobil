import {useEffect,useRef,useState} from 'react';
import {BackHandler,FlatList,ScrollView,View,type ScrollViewInstance} from 'react-native';
import type {Theme} from './theme';
import {layout} from './theme';
import {secureStorage} from './secure-storage';
import {DecisionApi,DecisionApiError,assessCriteria,parseCriteria,type CreateDecisionInput,type DecisionRecord,type JournalPage,type DecisionStatus,type ReflectionInput,type JournalInput} from './decision-api';
import {Action,ActionMenu,Card,Copy,LoadingCard,ui} from './components/native-ui';
import {DecisionField,DecisionForm,emptyDecisionDraft,type DecisionDraft} from './components/DecisionForm';
import {applyDraftSetting,DecisionDraftRepository,type PendingDecisionCreate} from './decision-draft';
import {SettingsApi,SETTING_CATEGORIES,matchingSavedPriorities,type SavedSetting,type SettingCategory} from './settings-api';
import {SettingsTools} from './SettingsTools';
import {JournalFilters,journalStatusLabel,categoryLabel,type JournalFilterValue} from './components/JournalFilters';
import {ReminderSheet} from './components/ReminderSheet';
import {SavedPriorities} from './components/SavedPriorities';
import type {DiscoveryMood} from './core/types';

const deviceDrafts=new DecisionDraftRepository(secureStorage);
export const clearDecisionDeviceDraft=(userId:string)=>deviceDrafts.clear(userId);
type PendingCreate=PendingDecisionCreate;
interface Job {run:()=>Promise<unknown>;done:()=>Promise<void>;retrySafe:boolean;label:string}
export interface DecisionScreenProps {theme:Theme;api:DecisionApi;settingsApi:SettingsApi;userId:string;initialDecisionId?:string;initialMode?:'compare'|'journal';sessionMood?:DiscoveryMood|null;onMoodChange?:(mood:DiscoveryMood|null)=>void;onExit?:()=>void}
export function DecisionScreen({theme,api,settingsApi,userId,initialDecisionId,initialMode='compare',sessionMood=null,onMoodChange,onExit}:DecisionScreenProps){
 const [surface,setSurface]=useState<'create'|'journal'|'detail'|'settings'>(initialDecisionId?'detail':initialMode==='journal'?'journal':'create'),[draft,setDraft]=useState<DecisionDraft>(emptyDecisionDraft),[record,setRecord]=useState<DecisionRecord|null>(null);
 const [formStep,setFormStep]=useState<0|1|2|3>(0);
 const [draftError,setDraftError]=useState('');
 const [moreActions,setMoreActions]=useState(false);
 const [page,setPage]=useState<JournalPage|null>(null),[query,setQuery]=useState(''),[filter,setFilter]=useState<DecisionStatus|undefined>(),[category,setCategory]=useState<SettingCategory|undefined>(),[filters,setFilters]=useState(false);
 const [showReminder,setShowReminder]=useState(false),[confirmAbandon,setConfirmAbandon]=useState(false);
 const [showPriority,setShowPriority]=useState(false),[priority,setPriority]=useState('');
 const appliedJournal=useRef<JournalInput>({});
 const [loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[retry,setRetry]=useState<Job|null>(null),[needsReload,setNeedsReload]=useState(false),[pending,setPending]=useState<PendingCreate|null>(null),[deviceReady,setDeviceReady]=useState(false);
 const [choice,setChoice]=useState<string|null>(null),[showReflection,setShowReflection]=useState(false),[rating,setRating]=useState<number|null>(null),[notes,setNotes]=useState(''),[followups,setFollowups]=useState<ReflectionInput>({rating:3}),[extra,setExtra]=useState(''),[showExtra,setShowExtra]=useState(false),[confirmClear,setConfirmClear]=useState(false);
 const alive=useRef(true),locked=useRef(false),epoch=useRef(0),currentId=useRef(initialDecisionId??null),scroll=useRef<ScrollViewInstance>(null);
 const draftScope=useRef(deviceDrafts.scope(userId)),draftRef=useRef(draft),stepRef=useRef<0|1|2|3>(0),pendingRef=useRef<PendingCreate|null>(null);
 const report=(reason:unknown)=>{if(alive.current)setError(reason instanceof DecisionApiError?reason.message:reason instanceof Error?reason.message:'Could not finish this step. Try again.');};
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;epoch.current++;};},[]);
 useEffect(()=>{let mounted=true;void draftScope.current.load().then(({pending:saved,working})=>{
  if(!mounted)return;
  if(saved){pendingRef.current=saved;setPending(saved);if(saved.decisionId){currentId.current=saved.decisionId;setSurface('detail');void loadDecision(saved.decisionId);}}
  else if(working){draftRef.current=working.draft;stepRef.current=working.step;setDraft(working.draft);setFormStep(working.step);}
 }).catch(()=>{if(mounted)setError('Could not open secure device storage. Unlock the device and reopen this screen.');}).finally(()=>{if(mounted)setDeviceReady(true);});return()=>{mounted=false;};},[userId]);
 useEffect(()=>{if(initialDecisionId)void loadDecision(initialDecisionId);else if(initialMode==='journal')void loadJournal();},[initialDecisionId,initialMode]);
 useEffect(()=>{scroll.current?.scrollTo({y:0,animated:false});},[surface,record?.id]);
 useEffect(()=>{const back=BackHandler.addEventListener('hardwareBackPress',()=>{
  if(locked.current)return true;
  if(surface==='settings')return false;
  if(choice){setChoice(null);return true;}if(showPriority){setShowPriority(false);return true;}if(showReflection){setShowReflection(false);return true;}if(showExtra){setShowExtra(false);return true;}
  if(surface==='detail'){setSurface('journal');void loadJournal();return true;}if(surface==='journal'){setSurface('create');return true;}
  if(surface==='create'&&formStep===0&&onExit){onExit();return true;}return false;
 });return()=>back.remove();},[surface,choice,showPriority,showReflection,showExtra,formStep,onExit]);
 function updateDraft(value:DecisionDraft){
  if(pendingRef.current)return;
  draftRef.current=value;setDraft(value);
  keepWorkingDraft(value,stepRef.current);
 }
 function updateStep(value:0|1|2|3){
  if(pendingRef.current)return;
  stepRef.current=value;setFormStep(value);
  keepWorkingDraft(draftRef.current,value);
 }
 function keepWorkingDraft(value:DecisionDraft,step:0|1|2|3){
  void draftScope.current.saveWorking(value,step).then(()=>{if(alive.current)setDraftError('');}).catch(()=>{if(alive.current)setDraftError('Could not keep this draft on the device. Your edits are still on this screen. Check its numbers and retry before leaving.');});
 }
 async function loadDecision(id:string){
  const generation=++epoch.current;setLoading(true);setNeedsReload(true);setError('');currentId.current=id;setRecord(previous=>previous?.id===id?previous:null);
  try{const value=await api.get(id);if(alive.current&&generation===epoch.current){setRecord(value);setNeedsReload(false);setRetry(null);setChoice(null);setShowExtra(false);setExtra('');}}
  catch(reason){report(reason);}finally{if(alive.current&&generation===epoch.current)setLoading(false);}
 }
 async function loadJournal(offset=0,criteria=appliedJournal.current){
  const generation=++epoch.current;setLoading(true);setError('');if(offset===0)setPage(null);
  try{const value=await api.list({...criteria,offset});if(alive.current&&generation===epoch.current){setPage(value);setNeedsReload(false);}}
  catch(reason){report(reason);}finally{if(alive.current&&generation===epoch.current)setLoading(false);}
 }
 function applyJournal(value:JournalFilterValue){
  const criteria={query:query.trim(),status:value.status,category:value.category};appliedJournal.current=criteria;setFilter(value.status);setCategory(value.category);setFilters(false);void loadJournal(0,criteria);
 }
 async function perform(job:Job){
  if(locked.current||!alive.current)return;locked.current=true;setBusy(true);setError('');setNotice('');
  try{await job.run();if(!alive.current)return;setRetry(null);setNeedsReload(false);setNotice(job.label);try{await job.done();}catch{if(alive.current){setNeedsReload(true);setNotice(job.label+' Refresh to load the latest saved details.');}}}
  catch(reason){if(alive.current){report(reason);if(job.retrySafe&&!(reason instanceof DecisionApiError&&[400,403,404,409,413,415,422].includes(reason.status)))setRetry(job);else setNeedsReload(true);}}
  finally{locked.current=false;if(alive.current)setBusy(false);}
 }
 async function clearPending(){await clearDecisionDeviceDraft(userId);if(alive.current){draftScope.current=deviceDrafts.scope(userId);pendingRef.current=null;draftRef.current=emptyDecisionDraft();stepRef.current=0;setPending(null);setDraft(draftRef.current);setFormStep(0);setConfirmClear(false);setDraftError('');}}
 async function create(input:CreateDecisionInput){
  if(locked.current)return;locked.current=true;setBusy(true);setError('');
  // Freeze/persist before transport so an app restart can retry the original intent.
  let value:PendingCreate;
  try{value=await draftScope.current.begin(input);if(!alive.current)return;pendingRef.current=value;setPending(value);setDraftError('');}
  catch{report(new Error('Could not protect this comparison on the device. Try again before saving.'));return;}
  finally{locked.current=false;if(alive.current)setBusy(false);}
  await sendCreate(value!);
 }
 async function sendCreate(value:PendingCreate){
  let savedId:string;
  const scope=draftScope.current;
  await perform({run:async()=>{const result=await api.create(value.input);savedId=result.decisionId;const receipt={...value,decisionId:savedId};if(alive.current){pendingRef.current=receipt;setPending(receipt);}try{await scope.receipt(value,savedId);}catch{if(alive.current)setNotice('Comparison saved. Its device copy could not be updated; open the saved decision before retrying.');}},done:async()=>{
   currentId.current=savedId!;setSurface('detail');const result=await api.get(savedId!);if(!alive.current)return;setRecord(result);setDraft(emptyDecisionDraft());await clearPending();
  },retrySafe:true,label:'Comparison saved.'});
 }
 async function reload(){setRetry(null);setNeedsReload(false);if(surface==='detail'&&currentId.current)await loadDecision(currentId.current);else if(surface==='journal')await loadJournal(page?.pagination.offset??0);}
 const disabled=busy||loading||needsReload||!!retry||!deviceReady;
 function openRecord(id:string){setSurface('detail');setShowReflection(false);setShowPriority(false);setPriority('');void loadDecision(id);}
 function copyRecord(withPriority=false){
  if(!record||pendingRef.current)return;
  const options=record.decision_options.map(option=>option.label);
  const criteria=parseCriteria(record.context as unknown as Record<string,unknown>,options);
  const copied:DecisionDraft={
   title:record.question,options,domain:record.context.domain??'',goal:record.context.goal??'',
   details:record.context.optionDetails??{},category:SETTING_CATEGORIES.find(category=>category===record.category),
   basis:withPriority||criteria.value?.comparisonBasis==='criteria'?'criteria':'journal',
   criteria:criteria.value?.criteria??[],expectedOutcome:record.expected_outcome??'',
  };
  const nextStep=withPriority?2:0;
  stepRef.current=nextStep;setFormStep(nextStep);updateDraft(copied);setSurface('create');
  setNotice(withPriority?'Start with one priority and rate each option on it.':'Review the copied inputs before creating a separate comparison.');
  setError('');setNeedsReload(false);
 }
 function applySetting(setting:SavedSetting,generation:number){
  if(locked.current||pendingRef.current)return;
  try{const next=applyDraftSetting(draftRef.current,setting,generation);updateDraft(next);updateStep(1);setSurface('create');setError('');setNotice('Review the saved setting and your current options before comparing.');}catch(reason){report(reason);}
 }
 function applySavedPriority(setting:SavedSetting,generation:number){
  const current=draftRef.current;
  if(!alive.current||locked.current||pendingRef.current||current.appliedSetting||current.goal.trim()
   ||!matchingSavedPriorities([setting],current.domain,current.category).length)return false;
  updateDraft(applyDraftSetting(current,setting,generation));
  return true;
 }
 async function rememberPriority(){
  const domain=record?.context.domain,category=SETTING_CATEGORIES.find(item=>item===record?.category);
  if(!domain||!category||!priority.trim())return;
  const goal=priority.trim();
  await perform({run:()=>settingsApi.rememberPriority(domain,category,goal),done:async()=>{setShowPriority(false);setPriority('');},retrySafe:true,label:'Priority saved in Saved settings.'});
 }
 async function choose(){if(!record||!choice)return;const id=record.id,option=choice;await perform({run:()=>api.choose(id,option),done:async()=>{setChoice(null);const result=await api.get(id);if(alive.current)setRecord(result);},retrySafe:true,label:'Choice saved.'});}
 async function reflect(){if(!record||rating===null)return;const id=record.id,input={...followups,rating,notes};await perform({run:()=>api.reflect(id,input),done:async()=>{setShowReflection(false);const result=await api.get(id);if(alive.current)setRecord(result);},retrySafe:true,label:'Reflection saved.'});}
 async function scheduleAt(dueAt:string|null){if(!record)return;const id=record.id,input={enabled:dueAt!==null,dueAt};setShowReminder(false);await perform({run:()=>api.reminder(id,input),done:async()=>{const result=await api.get(id);if(alive.current)setRecord(result);},retrySafe:false,label:dueAt===null?'Check-in turned off.':'Check-in scheduled.'});}
 async function schedule(days:number|null){await scheduleAt(days===null?null:new Date(Date.now()+days*86400000).toISOString());}
 async function abandon(){if(!record||record.status!=='open')return;const id=record.id;setConfirmAbandon(false);await perform({run:()=>api.abandon(id),done:async()=>{const result=await api.get(id);if(alive.current){setRecord(result);setMoreActions(false);}},retrySafe:false,label:'Decision set aside.'});}
 async function refreshComparison(){if(!record)return;const id=record.id,revision=record.comparison_revision,extraLabel=showExtra?extra.trim():undefined;await perform({run:()=>api.refresh(id,revision,extraLabel),done:async()=>{const result=await api.get(id);if(alive.current){setRecord(result);setShowExtra(false);setExtra('');}},retrySafe:false,label:'Comparison refreshed.'});}
 const savedPriorities=!!draft.domain.trim()&&!draft.goal.trim()&&!draft.appliedSetting&&<SavedPriorities api={settingsApi} domain={draft.domain} category={draft.category} theme={theme} disabled={disabled} onApply={applySavedPriority}/>;
 const header=<View style={ui.stack}>
  <View style={ui.row}><View style={{flex:1,justifyContent:'center'}}><Copy theme={theme} kind="title">{surface==='journal'?'Journal':surface==='detail'?'Decision':'Decide'}</Copy></View>{surface==='create'&&<Action label="Saved settings" theme={theme} disabled={busy||!deviceReady||!!pending} onPress={()=>setSurface('settings')}/>}</View>
  {busy&&surface!=='create'&&<Copy theme={theme} live>Saving changes…</Copy>}
  {!!notice&&<Copy theme={theme} live>{notice}</Copy>}
  {!!draftError&&surface==='create'&&!pending&&<Card theme={theme}><Copy theme={theme} live>{draftError}</Copy><Action label="Retry keeping this device draft" theme={theme} disabled={busy||!deviceReady} onPress={()=>keepWorkingDraft(draftRef.current,stepRef.current)}/></Card>}
  {!!error&&<Card theme={theme}><Copy theme={theme} live>{error}</Copy>{retry&&<Action label="Retry the same change" theme={theme} primary disabled={busy||loading} onPress={()=>void perform(retry)}/>}<Action label="Reload saved details" theme={theme} disabled={busy||loading} onPress={()=>void reload()}/></Card>}
  {needsReload&&!error&&<Action label="Refresh saved details" theme={theme} disabled={busy||loading} onPress={()=>void reload()}/>}
  {(loading||!deviceReady)&&<LoadingCard theme={theme} label="Loading your decision…"/>}
 </View>;
 if(surface==='settings')return <SettingsTools theme={theme} api={settingsApi} onApply={applySetting} onBack={()=>setSurface('create')} backLabel="Back to comparison"/>;
 return <View style={{flex:1}}>
  {surface==='journal'?<FlatList data={page?.decisions??[]} keyExtractor={item=>item.id} keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:layout.space.lg,gap:layout.space.md,maxWidth:layout.maxWidth,width:'100%',alignSelf:'center'}}
   ListHeaderComponent={<View style={ui.stack}>{header}<Copy theme={theme} kind="hero">Your journal</Copy><DecisionField label="Search decisions" value={query} onChange={setQuery} theme={theme} maxLength={120}/><Action label="Search journal" theme={theme} disabled={busy||loading} onPress={()=>applyJournal({status:filter,category})}/><Action label="Filter journal" theme={theme} disabled={busy||loading} selected={!!filter||!!category} onPress={()=>setFilters(true)}/>{!!(filter||category)&&<Copy theme={theme} kind="muted">{[filter?journalStatusLabel[filter]:null,category?categoryLabel(category):null].filter(Boolean).join(' · ')}</Copy>}</View>}
   ListEmptyComponent={!loading&&!error?<Card theme={theme}><Copy theme={theme}>{appliedJournal.current.query||filter||category?'No matches. Change the search or filters.':'Your journal is empty.'}</Copy><Action label="Start a comparison" theme={theme} primary onPress={()=>setSurface('create')}/></Card>:undefined}
   renderItem={({item})=><Card theme={theme}><Copy theme={theme} kind="title">{item.question}</Copy><Copy theme={theme} kind="muted">{new Date(item.created_at).toLocaleDateString()} · {{open:'Still deciding',decided:'Choice made',reflected:'Reflected on',abandoned:'Set aside'}[item.status]}</Copy><Action label="Open decision" theme={theme} hint={item.question} disabled={busy||loading} onPress={()=>openRecord(item.id)}/></Card>}
   ListFooterComponent={page?<View style={ui.stack}><Copy theme={theme} kind="muted">{page.pagination.total} saved {page.pagination.total===1?'decision':'decisions'}</Copy><View style={ui.row}><Action label="Previous decisions" theme={theme} disabled={loading||page.pagination.offset===0} onPress={()=>void loadJournal(Math.max(0,page.pagination.offset-page.pagination.limit))}/><Action label="More decisions" theme={theme} disabled={loading||page.pagination.nextOffset===null} onPress={()=>void loadJournal(page.pagination.nextOffset!)}/></View></View>:undefined}/>
  :<ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:layout.space.lg,gap:layout.space.md,maxWidth:layout.maxWidth,width:'100%',alignSelf:'center'}}>
   {header}
   {surface==='create'&&pending?busy?<LoadingCard theme={theme} label="Saving comparison…"/>:<Card theme={theme}><Copy theme={theme} kind="title">{pending.decisionId?'Your comparison was saved.':'Finish this comparison?'}</Copy><Copy theme={theme}>{pending.input.options.join(' · ')}</Copy><Copy theme={theme} kind="muted">{pending.decisionId?'Open the saved comparison to continue.':needsReload?'These inputs need review. Clear the device draft and review a new comparison. A saved comparison remains in your journal.':'A previous save may have reached your account. Retry the same inputs to avoid creating a duplicate.'}</Copy><Action label={pending.decisionId?'Open saved comparison':'Retry this exact comparison'} theme={theme} primary disabled={busy||loading||!deviceReady||needsReload&&!pending.decisionId} onPress={()=>pending.decisionId?openRecord(pending.decisionId):void sendCreate(pending)}/><Action label="Discard this device draft" theme={theme} disabled={busy||loading} onPress={()=>setConfirmClear(true)}/>{confirmClear&&<><Copy theme={theme}>This clears only the device draft. A comparison already saved to your account stays in your journal.</Copy><Action label="Clear device draft" theme={theme} disabled={busy} onPress={()=>void clearPending().then(()=>{setNeedsReload(false);setRetry(null);setError('');}).catch(report)}/><Action label="Keep this draft" theme={theme} disabled={busy} onPress={()=>setConfirmClear(false)}/></>}</Card>:surface==='create'&&<DecisionForm theme={theme} api={api} savedPriorities={savedPriorities} draft={draft} sessionMood={sessionMood} onMoodChange={onMoodChange} step={formStep} onStepChange={updateStep} onChange={updateDraft} onCreate={input=>void create(input)} disabled={disabled} error="" onStageChange={()=>scroll.current?.scrollTo({y:0,animated:false})}/>}
   {surface==='detail'&&record&&<>
    <Copy theme={theme} kind="hero">{record.question}</Copy>
    <Copy theme={theme} kind="muted">{record.context.domain??record.category}{record.context.goal?' · '+record.context.goal:''}</Copy>
    {record.status==='abandoned'&&<Copy theme={theme}>Set aside in your journal.</Copy>}
    <DecisionEvidence theme={theme} record={record} disabled={disabled||!!pending} onRefresh={()=>void refreshComparison()} onCopy={()=>copyRecord()} onPrioritize={()=>copyRecord(true)}/>
    {record.decision_options.map(option=><View key={option.id} style={ui.smallStack}>{record.status==='open'?<Action label={`Choose ${option.label}`} theme={theme} disabled={disabled} onPress={()=>setChoice(option.id)}/>:<><Copy theme={theme} kind="title">{option.label}</Copy>{record.selected_option_id===option.id&&<Copy theme={theme}>Your saved choice</Copy>}</>}{!!record.context.optionDetails?.[option.label]&&<Copy theme={theme} kind="muted">{record.context.optionDetails[option.label]}</Copy>}</View>)}
    {choice&&<Card theme={theme}><Copy theme={theme}>Save {record.decision_options.find(o=>o.id===choice)?.label} as your choice?</Copy><Action label="Save my choice" theme={theme} primary disabled={disabled} onPress={()=>void choose()}/><Action label="Keep deciding" theme={theme} disabled={disabled} onPress={()=>setChoice(null)}/></Card>}
    {(record.status==='decided'||record.status==='reflected')&&!!record.context.domain&&SETTING_CATEGORIES.some(category=>category===record.category)&&
     (showPriority?<Card theme={theme}>
      <DecisionField label="What mattered in this choice?" placeholder="A short commute on weekdays" value={priority} onChange={setPriority} theme={theme} maxLength={80} disabled={disabled}/>
      <Copy theme={theme} kind="muted">You can reuse this priority for {record.context.domain} decisions.</Copy>
      <Action label="Save priority" theme={theme} primary disabled={disabled||!priority.trim()} onPress={()=>void rememberPriority()}/>
      <Action label="Cancel" theme={theme} disabled={disabled} onPress={()=>setShowPriority(false)}/>
     </Card>:<Action label="Remember what mattered" theme={theme} disabled={disabled} onPress={()=>{setPriority(record.context.goal?.length&&record.context.goal.length<=80?record.context.goal:'');setShowPriority(true);}}/>)}
    <Action label={moreActions?'Hide decision actions':'More decision actions'} theme={theme} disabled={busy} onPress={()=>setMoreActions(!moreActions)}/>
    {moreActions&&record.status==='open'&&<Card theme={theme}><Action label="Let it go" theme={theme} disabled={disabled} onPress={()=>setConfirmAbandon(true)}/><Action label="Refresh with current knowledge" theme={theme} disabled={disabled} onPress={()=>void refreshComparison()}/>{record.decision_options.length<8&&<Action label={showExtra?'Cancel extra option':'Compare one more option'} theme={theme} disabled={disabled} onPress={()=>setShowExtra(!showExtra)}/>}{showExtra&&<><DecisionField label="Extra option" value={extra} onChange={setExtra} theme={theme} maxLength={80}/><Action label="Add and refresh comparison" theme={theme} disabled={disabled||!extra.trim()} onPress={()=>void refreshComparison()}/></>}</Card>}
    {record.status==='decided'&&<Card theme={theme}><Action label={showReflection?'Cancel reflection':'Reflect on this choice'} theme={theme} primary disabled={disabled} onPress={()=>{setShowReflection(!showReflection);setRating(null);setNotes('');setFollowups({rating:3});}}/>
     {showReflection&&<View style={ui.stack}><Copy theme={theme} kind="title">How did it go?</Copy><View style={ui.row}>{[1,2,3,4,5].map(value=><Action key={value} label={String(value)} hint={`${value} out of 5`} theme={theme} selected={rating===value} disabled={disabled} onPress={()=>setRating(value)}/>)}</View><Copy theme={theme} kind="muted">1: went poorly · 5: went well</Copy>{(['wouldRepeat','hasRegrets','wouldRecommend','wouldChooseAgain'] as const).map(key=><View key={key} style={ui.smallStack}><Copy theme={theme}>{{wouldRepeat:'Would you repeat the experience?',hasRegrets:'Do you have regrets?',wouldRecommend:'Would you recommend it?',wouldChooseAgain:'Would you choose it again?'}[key]}</Copy><View style={ui.row}>{([true,false,null] as const).map(value=><Action key={String(value)} label={value===null?'Leave unanswered':value?'Yes':'No'} theme={theme} selected={(followups[key]??null)===value} disabled={disabled} onPress={()=>setFollowups({...followups,[key]:value})}/>)}</View></View>)}<DecisionField label="Reflection notes (optional)" value={notes} onChange={setNotes} theme={theme} maxLength={500} multiline/><Action label="Save reflection" theme={theme} primary disabled={disabled||rating===null} onPress={()=>void reflect()}/></View>}
     <Copy theme={theme} kind="title">Check in later</Copy><Copy theme={theme} kind="muted">{record.reminder_enabled&&record.reflection_due_at?'Scheduled for '+new Date(record.reflection_due_at).toLocaleString():'No check-in scheduled.'}</Copy><Action label="Check in tomorrow" theme={theme} disabled={disabled} onPress={()=>void schedule(1)}/><Action label="Check in next week" theme={theme} disabled={disabled} onPress={()=>void schedule(7)}/><Action label="Choose date and time" theme={theme} disabled={disabled} onPress={()=>setShowReminder(true)}/>{record.reminder_enabled&&<Action label="Turn off this check-in" theme={theme} disabled={disabled} onPress={()=>void schedule(null)}/>}</Card>}
    {record.decision_reflections.map((reflection,index)=><Card key={index} theme={theme}><Copy theme={theme} kind="title">Your reflection</Copy><Copy theme={theme}>{reflection.rating} / 5</Copy>{!!reflection.notes&&<Copy theme={theme}>{reflection.notes}</Copy>}</Card>)}
    {moreActions&&<><Action label="Copy and review this comparison" theme={theme} disabled={disabled||!!pending} onPress={()=>copyRecord()}/><Action label="Back to journal" theme={theme} disabled={busy} onPress={()=>{setSurface('journal');void loadJournal();}}/></>}
   </>}
   {surface==='detail'&&!record&&!loading&&<Action label="Open your journal" theme={theme} primary onPress={()=>{setSurface('journal');void loadJournal();}}/>}
  </ScrollView>}
  <JournalFilters visible={filters} theme={theme} value={{status:filter,category}} disabled={busy||loading} onClose={()=>setFilters(false)} onApply={applyJournal}/>
  <ReminderSheet visible={showReminder} dueAt={record?.reflection_due_at??null} theme={theme} busy={busy} onClose={()=>setShowReminder(false)} onSave={dueAt=>void scheduleAt(dueAt)}/>

  <ActionMenu visible={confirmAbandon} title="Set this decision aside?" theme={theme} onClose={()=>{if(!busy)setConfirmAbandon(false);}}><Copy theme={theme}>Keep it in your journal without choosing an option.</Copy><Action label="Let it go" theme={theme} primary busy={busy} onPress={()=>void abandon()}/><Action label="Keep deciding" theme={theme} disabled={busy} onPress={()=>setConfirmAbandon(false)}/></ActionMenu>
 </View>;
}
function DecisionEvidence({theme,record,disabled,onRefresh,onCopy,onPrioritize}:{theme:Theme;record:DecisionRecord;disabled:boolean;onRefresh:()=>void;onCopy:()=>void;onPrioritize:()=>void}){
 const [expanded,setExpanded]=useState(false),saved=record.saved_explanation;
 if(saved.state!=='saved')return <Card theme={theme}><Copy theme={theme} kind="title">{record.status==='open'?'Refresh this comparison':'Review this choice'}</Copy><Action label={record.status==='open'?'Load current comparison':'Review a copy'} theme={theme} disabled={disabled} onPress={record.status==='open'?onRefresh:onCopy}/></Card>;
 const snapshot=saved.snapshot,parsed=parseCriteria(record.context as unknown as Record<string,unknown>,record.decision_options.map(o=>o.label));
 const assessment=snapshot.basis==='criteria'&&parsed.value?.criteria?assessCriteria(parsed.value.criteria,record.decision_options.map(o=>o.label)):null;
 const insufficient=snapshot.evidenceState==='insufficient'||snapshot.coldStart;
 return <Card theme={theme}><Copy theme={theme} kind="title">{assessment?assessment.outcome==='winner'?`${assessment.leader} fits your entered criteria best.`:assessment.outcome==='tie'?'Your entered criteria are tied.':'More information could change this comparison.':insufficient?'No clear match in your history':'Based on your recorded experiences'}</Copy>
  {!assessment&&insufficient&&<><Copy theme={theme}>Pick one thing that matters here, such as time or effort, and compare the options on that.</Copy><Action label="Compare with one priority" theme={theme} primary disabled={disabled} onPress={onPrioritize}/></>}
  {expanded&&<Copy theme={theme} kind="muted">{assessment?'These results use the values you entered. Unknown values span the range you set.':'This reflects saved preferences and outcomes, not verified facts about your options.'}</Copy>}
  <Action label={expanded?'Hide the reasoning':'See what this is based on'} theme={theme} onPress={()=>setExpanded(!expanded)}/>
  {expanded&&snapshot.options.map(option=><View key={option.label} style={ui.smallStack}><Copy theme={theme} kind="title">{option.label}</Copy>{option.reasons.map((reason,index)=><Copy key={index} theme={theme}>{reason}</Copy>)}{!assessment&&<Copy theme={theme} kind="muted">{option.sourceCounts.preferences} relevant preferences · {option.sourceCounts.decisions} recorded decisions · {option.sourceCounts.reflections} reflections</Copy>}{option.warning&&<Copy theme={theme}>Some past reflections on this option were negative. Check whether that context still applies.</Copy>}</View>)}
  {expanded&&<Copy theme={theme} kind="muted">Saved on {new Date(snapshot.scoredAt).toLocaleString()} · revision {record.comparison_revision}</Copy>}
 </Card>;
}
