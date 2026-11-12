import {useCallback,useEffect,useRef,useState} from 'react';
import {AppState,BackHandler,Linking,ScrollView,StyleSheet,View,type ScrollViewInstance} from 'react-native';
import {randomUUID} from 'expo-crypto';
import {DiscoveryApi,DiscoveryApiError,DISCOVERY_DOMAINS,DISCOVERY_MOODS,discoveryDomainLabel,type DiscoveryDomain,type DiscoveryMood,type DiscoveryProfile,type DiscoveryResponse,type NextQuestionInput,type NextQuestionResult,type SavedDiscoveryAnswer} from './discovery-api';
import {describeDiscoveryResponse,validateDiscoveryResponse} from './core/validation';
import {previewAnswerList,previewQuestions,type PreviewAnswers} from './preview';
import {layout,type Theme} from './theme';
import {Action,Card,Copy,LoadingCard,ui} from './components/native-ui';
import {ProfilePanel} from './components/ProfilePanel';
import {QuestionInput} from './components/QuestionInput';
import {TopicSheet} from './components/TopicSheet';

import {NavigationDrawer,type NativePage} from './components/NavigationDrawer';
import {RecentAnswers} from './components/RecentAnswers';
import {ScreenTransition} from './components/motion';
import {AnswerMilestone} from './components/AnswerMilestone';
import {useFeedback} from './feedback';
import type {DailyNotificationQuestion} from './push-registration';
import {DecisionApi} from './decision-api';
import {DecisionScreen} from './DecisionScreen';
import {AccountApi} from './account-api';
import {AccountTools} from './AccountTools';
import {MoreApi} from './more-api';
import {MoreTools} from './MoreTools';
import type {SettingsApi,FoundationApi} from './settings-api';
import {FoundationTools} from './FoundationTools';

type Claim={requestId:string;expectedGeneration:number};
export interface AccountScreenProps {
 theme:Theme;api:DiscoveryApi;userLabel:string;previewAnswers:PreviewAnswers;previewClaim?:Claim;
 userId:string;decisionApi:DecisionApi;accountApi:AccountApi;moreApi:MoreApi;settingsApi:SettingsApi;foundationApi:FoundationApi;onReauthenticate:()=>Promise<void>;
 onPreparePreviewClaim:(generation:number)=>Promise<Claim>;
 onPreviewSaved:()=>Promise<void>;onSignOut:()=>Promise<void>;
 pushTarget?:{id:string;key:string}|null;
 dailyTarget?:{question:DailyNotificationQuestion;key:string}|null;
 returnSequence:number;menuVisible:boolean;onCloseMenu:()=>void;
}
type Job={run:()=>Promise<unknown>;done:()=>void|Promise<void>;label:string;refreshProfile?:boolean};
const site='https://projectnudge.vercel.app';

/** The parent keys this component by verified account ID; account data never survives a switch. */
export function AccountScreen({theme,api,userId,decisionApi,accountApi,moreApi,settingsApi,foundationApi,onReauthenticate,userLabel,previewAnswers,previewClaim,onPreparePreviewClaim,onPreviewSaved,onSignOut,pushTarget,dailyTarget,returnSequence,menuVisible,onCloseMenu}:AccountScreenProps){
 const {play}=useFeedback();
 const [tab,setTab]=useState<NativePage>('today');
 const [toolPage,setToolPage]=useState<'home'|'foundation'>('home');
 const [decisionTarget,setDecisionTarget]=useState<{mode:'compare'|'journal';id?:string;key:number}>({mode:'compare',key:0}),[preferencesSignal,setPreferencesSignal]=useState(0),[reviewPreview,setReviewPreview]=useState(false);
 const [profile,setProfile]=useState<DiscoveryProfile|null>(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[error,setError]=useState('');
 const [needsTerms,setNeedsTerms]=useState(false),[needsAuth,setNeedsAuth]=useState(false),[conflict,setConflict]=useState(false),[retryJob,setRetryJob]=useState<Job|null>(null);
 const [next,setNext]=useState<NextQuestionResult|null>(null),[value,setValue]=useState<DiscoveryResponse|null>(null),[questionError,setQuestionError]=useState('');
 const [showTopics,setShowTopics]=useState(false),[topic,setTopic]=useState<DiscoveryDomain|null>(null),[mode,setMode]=useState<'light'|'curious'|'reflect'>('light');
 const [moodChoice,setMoodChoice]=useState<{value:DiscoveryMood;chosenAt:number}|null>(null);
 const mood=moodChoice?.value??null;
 const today=useRef(new Date().toDateString());
 const [showPreview,setShowPreview]=useState(true),[confirmDiscard,setConfirmDiscard]=useState(false),[confirmSignOut,setConfirmSignOut]=useState(false);
 const [refreshRequired,setRefreshRequired]=useState(false);
 
 const autoAdvance=useRef(false);
 const handledDaily=useRef<string|null>(null);
 const handledDecision=useRef<string|null>(null);
 const handledReturn=useRef(returnSequence);
 const mounted=useRef(true),locked=useRef(false),epoch=useRef(0),initialQuestion=useRef(false),counts=useRef({sessionAnswers:0,consecutiveSkips:0});
 const scroll=useRef<ScrollViewInstance>(null);
 const preview=previewAnswerList(previewAnswers);
 const previewNeedsSave=showPreview&&preview.length>0;
 
 const disabled=busy||loading||!!retryJob||needsTerms||needsAuth||refreshRequired;
 useEffect(()=>{
  const listener=AppState.addEventListener('change',state=>{
   if(state==='background')setMoodChoice(null);
   if(state==='active'&&today.current!==new Date().toDateString()){
    today.current=new Date().toDateString();
    initialQuestion.current=false;
    setNext(null);
    setValue(null);
   }
  });
  return()=>listener.remove();
 },[]);
 useEffect(()=>{
  if(!moodChoice)return;
  const timer=setTimeout(()=>setMoodChoice(current=>current===moodChoice?null:current),Math.max(0,3600000-(Date.now()-moodChoice.chosenAt)));
  return()=>clearTimeout(timer);
 },[moodChoice]);
 function chooseMood(chosen:DiscoveryMood|null){
  setMoodChoice(chosen?{value:chosen,chosenAt:Date.now()}:null);
 }
 function applyQuestionSettings(chosenTopic:DiscoveryDomain|null,chosenMode:'light'|'curious'|'reflect',chosenMood:DiscoveryMood|null){
  if(disabled||locked.current)return;
  chooseMood(chosenMood);
  counts.current={sessionAnswers:0,consecutiveSkips:0};
  initialQuestion.current=true;
  ask(true,true,false,chosenTopic,chosenMode,chosenMood);
 }
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;epoch.current++;};},[]);
 const report=useCallback((reason:unknown)=>{
  if(!mounted.current)return;
  setError(reason instanceof DiscoveryApiError?reason.message:'Could not finish this step. Check your connection and try again.');
  setNeedsTerms(reason instanceof DiscoveryApiError&&reason.code==='needs_terms');
  setNeedsAuth(reason instanceof DiscoveryApiError&&reason.status===401);
  setConflict(reason instanceof DiscoveryApiError&&reason.status===409);
 },[]);
 const refresh=useCallback(async()=>{
  const request=++epoch.current;
  await accountApi.syncDeviceTimezone();
  const result=await api.profile();
  if(!mounted.current||request!==epoch.current)return null;
  setProfile(result);setNeedsTerms(false);setNeedsAuth(false);setRefreshRequired(false);return result;
 },[api,accountApi]);
 useEffect(()=>{
  void refresh().catch(report).finally(()=>{if(mounted.current)setLoading(false);});
 },[refresh,report]);
 useEffect(()=>{
  if(handledReturn.current===returnSequence||busy||loading||locked.current)return;
  handledReturn.current=returnSequence;
  setShowTopics(false);
  setConfirmDiscard(false);
  setConfirmSignOut(false);
  if(dailyTarget&&dailyTarget.key!==handledDaily.current||pushTarget&&pushTarget.key!==handledDecision.current)return;
  setTab('today');
  scroll.current?.scrollTo({y:0,animated:false});
  if(retryJob||refreshRequired)return;
  autoAdvance.current=false;
  initialQuestion.current=false;
  counts.current={sessionAnswers:0,consecutiveSkips:0};
  setNext(null);
  setValue(null);
  setTopic(null);
  setMode('light');
  setQuestionError('');
 },[returnSequence,busy,loading,dailyTarget,pushTarget,retryJob,refreshRequired]);
 useEffect(()=>{scroll.current?.scrollTo({y:0,animated:false});},[tab]);
 useEffect(()=>{const listener=BackHandler.addEventListener('hardwareBackPress',()=>{
  if(showTopics){setShowTopics(false);return true;}
  if(tab==='account'&&confirmSignOut){setConfirmSignOut(false);return true;}
  if(tab==='decide'||tab==='about'||tab==='tools'||tab==='account')return false;
  if(tab!=='today'){setTab('today');return true;}
  return false;
 });return()=>listener.remove();},[tab,showTopics,confirmSignOut]);

 // A failed mutation keeps its exact closure, UUID, revision, payload and privacy generation.
 async function perform(job:Job):Promise<boolean>{
  if(locked.current||!mounted.current)return false;
  locked.current=true;setBusy(true);setError('');setNotice('');
  try{
   await job.run();
   if(!mounted.current)return false;
   setRetryJob(null);setConflict(false);if(job.label==='Answer saved.'||job.label==='Answer corrected.')play('saved');
   try{await job.done();}catch{if(mounted.current)setNotice('Saved to your account. This device could not clear its preview yet.');}
   if(!mounted.current)return true;
   try{if(job.refreshProfile!==false)await refresh();if(mounted.current&&job.label&&!['Answer saved.','Question skipped.'].includes(job.label))setNotice(current=>current||job.label);}
   catch{if(mounted.current){setRefreshRequired(true);setNotice('Saved to your account. Refresh to see the latest answers.');}}
   return true;
  }catch(reason){if(mounted.current){
   if(reason instanceof DiscoveryApiError&&reason.code==='support'){
    setRetryJob(null);setValue(null);setNext({question:null,reason:'pause',generation:profile?.generation??0});
   }else setRetryJob(job);
   report(reason);
  }return false;}
  finally{locked.current=false;if(mounted.current)setBusy(false);}
 }
 async function reload(){
  if(locked.current)return;
  locked.current=true;setLoading(true);setError('');setNotice('');
  try{
   await refresh();
   if(mounted.current){setRetryJob(null);setConflict(false);setNext(null);setValue(null);setQuestionError('');initialQuestion.current=false;}
  }catch(reason){report(reason);}finally{locked.current=false;if(mounted.current)setLoading(false);}
 }
 function ask(daily:boolean,change=false,continueAfterPause=false,chosenTopic=topic,chosenMode=mode,chosenMood=mood,notificationQuestion?:DailyNotificationQuestion){
  if(!profile||disabled)return;
  const input:NextQuestionInput={requestId:randomUUID(),expectedGeneration:profile.generation,daily,change,topic:chosenTopic,mode:chosenMode,mood:chosenMood,
   localHour:new Date().getHours(),...counts.current,continueAfterPause,notificationQuestion};
  let result:NextQuestionResult;
  void perform({run:async()=>{await accountApi.syncDeviceTimezone();result=await api.next(input);},done:()=>{
   setNext(result!);setValue(null);setQuestionError('');setShowTopics(false);setTopic(chosenTopic);setMode(chosenMode);
  },label:'',refreshProfile:false});
 }
 useEffect(()=>{
  if(!dailyTarget||handledDaily.current===dailyTarget.key||disabled||!profile?.available||previewNeedsSave)return;
  handledDaily.current=dailyTarget.key;
  autoAdvance.current=false;
  initialQuestion.current=true;
  onCloseMenu();setTab('today');
  ask(true,false,false,null,'light',null,dailyTarget.question);
 },[dailyTarget,disabled,profile,previewNeedsSave]);
 useEffect(()=>{
  if(tab!=='today'||!profile||!profile.available||loading||busy||retryJob||initialQuestion.current||previewNeedsSave||dailyTarget&&handledDaily.current!==dailyTarget.key)return;
  initialQuestion.current=true;ask(true);
  // The ref makes this a one-time daily reservation, never an answer save.
 },[tab,profile,loading,busy,retryJob,previewNeedsSave,dailyTarget]);
 useEffect(()=>{
  if(tab!=='today'||!autoAdvance.current||disabled||!profile?.available||previewNeedsSave||next&&!next.answered)return;
  autoAdvance.current=false;ask(false);
 },[tab,profile,disabled,previewNeedsSave,next]);
 function saveAnswer(responseOverride?:DiscoveryResponse){
  if(!profile||!next?.question||next.answered||disabled)return;
  const parsed=validateDiscoveryResponse(next.question,responseOverride??value);
  if(!parsed.value){setQuestionError(parsed.error??'Choose an answer or skip.');return;}
  const response=parsed.value,input={requestId:randomUUID(),expectedGeneration:next.generation,answers:[{questionId:next.question.id,questionVersion:next.question.version,response}]};
  void perform({run:()=>api.answer(input),done:()=>{
   setNext(current=>current?{...current,answered:true}:current);setValue(null);setQuestionError('');
   autoAdvance.current=true;
   counts.current={sessionAnswers:counts.current.sessionAnswers+1,consecutiveSkips:response.kind==='skip'?counts.current.consecutiveSkips+1:0};
  },label:response.kind==='skip'?'Question skipped.':'Answer saved.'});
 }
 async function claimPreview(){
  if(!profile||disabled||!preview.length)return;
  // Persist before sending, including on the very first attempt. Parent binds it to this account.
  locked.current=true;setBusy(true);setError('');
  let prepared:Claim;
  try{prepared=await onPreparePreviewClaim(profile.generation);}
  catch(reason){if(mounted.current)setError(reason instanceof Error?reason.message:'Could not protect your preview on this device. Try again before saving.');return;}
  finally{locked.current=false;if(mounted.current)setBusy(false);}
  if(!mounted.current)return;
  const input={...prepared,answers:preview};
  await perform({run:()=>api.claim(input),done:async()=>{await onPreviewSaved();if(mounted.current){setShowPreview(false);setNext(null);setValue(null);initialQuestion.current=false;}},label:'Your answers are saved.'});
 }
 async function discardPreview(){
  if(locked.current)return;locked.current=true;setBusy(true);
  try{await onPreviewSaved();if(mounted.current){setShowPreview(false);setConfirmDiscard(false);}}
  catch{if(mounted.current)setError('Could not clear the preview from this device. Try again.');}
  finally{locked.current=false;if(mounted.current)setBusy(false);}
 }
 function edit(answer:SavedDiscoveryAnswer,response:DiscoveryResponse,onSaved?:()=>void){
  if(!profile||disabled)return Promise.resolve(false);
  const input={requestId:randomUUID(),expectedGeneration:profile.generation,expectedRevision:answer.revision,response};
  return perform({run:()=>api.edit(answer.id,input),done:()=>{setNext(null);onSaved?.();},label:'Answer corrected.'});
 }
 function toggle(answer:SavedDiscoveryAnswer){
  if(!profile||disabled)return Promise.resolve(false);
  const input={requestId:randomUUID(),expectedGeneration:profile.generation,expectedRevision:answer.revision,active:!answer.active};
  return perform({run:()=>api.edit(answer.id,input),done:()=>{setNext(null);},label:input.active?'Answer included in your profile.':'Answer excluded from your profile.'});
 }
 function remove(answer:SavedDiscoveryAnswer){
  if(!profile||disabled)return Promise.resolve(false);
  const input={requestId:randomUUID(),expectedGeneration:profile.generation,expectedRevision:answer.revision};
  return perform({run:()=>api.remove(answer.id,input),done:()=>{setNext(null);},label:'Answer deleted.'});
 }
 async function open(path:string){try{await Linking.openURL(site+path);}catch{if(mounted.current)setError('Could not open your browser. Try again.');}}
 async function signOut(){
  if(locked.current)return;locked.current=true;setBusy(true);setError('');
  try{await onSignOut();}catch{if(mounted.current)setError('Could not sign out safely. Try again.');}
  finally{locked.current=false;if(mounted.current)setBusy(false);}
 }
 function openDecision(mode:'compare'|'journal',id?:string){setDecisionTarget(current=>({mode,id,key:current.key+1}));setTab('decide');}
 useEffect(()=>{
  if(!pushTarget||handledDecision.current===pushTarget.key||busy||loading)return;
  handledDecision.current=pushTarget.key;
  openDecision('journal',pushTarget.id);
 },[pushTarget,busy,loading]);
 async function privacyChanged(){await onPreviewSaved();setNext(null);setValue(null);setRetryJob(null);autoAdvance.current=false;initialQuestion.current=false;await reload();}
 return <View style={styles.shell}><ScreenTransition identity={tab}>
  {tab==='decide'?<DecisionScreen key={decisionTarget.key} theme={theme} api={decisionApi} settingsApi={settingsApi} userId={userId} sessionMood={mood} onMoodChange={chooseMood} initialMode={decisionTarget.mode} initialDecisionId={decisionTarget.id} onExit={()=>setTab('today')}/>:tab==='tools'?toolPage==='foundation'?<FoundationTools theme={theme} api={foundationApi} onBack={()=>setToolPage('home')} onSaved={()=>void refresh().catch(report)}/>:<MoreTools theme={theme} api={moreApi} userId={userId} onOpenDecision={id=>openDecision('journal',id)} onFoundation={()=>setToolPage('foundation')} onExit={()=>setTab('today')}/>:<ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
   <View style={styles.content}>
    {!!notice&&<Card theme={theme}><Copy theme={theme} live>{notice}</Copy>{refreshRequired&&<Action label="Refresh saved answers" theme={theme} disabled={busy||loading} onPress={()=>void reload()}/>}</Card>}
    {!!error&&<Card theme={theme}><Copy theme={theme} live>{error}</Copy>
     {!!retryJob&&!needsAuth&&!needsTerms&&!conflict&&<Action label="Retry the same change" theme={theme} primary disabled={busy||loading} onPress={()=>void perform(retryJob)}/>}
     {needsTerms&&<Action label="Review terms in Account" theme={theme} disabled={busy} onPress={()=>setTab('account')}/>}
     {needsAuth&&<Action label="Sign out and reconnect" theme={theme} disabled={busy} onPress={()=>void signOut()}/>}
     <Action label="Reload latest answers" theme={theme} disabled={busy||loading} hint="Loads your saved answers and ends any pending retry. Review before making another change." onPress={()=>void reload()}/>
    </Card>}
    {loading&&<LoadingCard label="Loading your answers…" theme={theme}/>}
    {profile&&!profile.available&&<Card theme={theme}><Copy theme={theme}>Your question history is temporarily unavailable. Try refreshing in a moment.</Copy><Action label="Refresh" theme={theme} disabled={busy||loading} onPress={()=>void reload()}/></Card>}
    {tab==='today'&&profile?.available&&previewNeedsSave&&<Card theme={theme}>
     <Copy theme={theme} kind="title">Save your {preview.length} {preview.length===1?'answer':'answers'}</Copy>
     <Action label={reviewPreview?'Hide preview answers':`Review ${preview.length} ${preview.length===1?'answer':'answers'}`} theme={theme} onPress={()=>setReviewPreview(!reviewPreview)}/>
     {reviewPreview&&preview.map(answer=>{const q=previewQuestions.find(question=>question.id===answer.questionId)!;return <View key={answer.questionId} style={ui.smallStack}><Copy theme={theme}>{q.prompt}</Copy><Copy theme={theme} kind="muted">{describeDiscoveryResponse(q,answer.response)}</Copy></View>;})}
     {previewClaim&&previewClaim.expectedGeneration!==profile.generation&&<Copy theme={theme}>Your account changed after this preview was prepared. Discard this device preview before starting again.</Copy>}
     <Action label="Save answers" theme={theme} primary disabled={disabled||!!previewClaim&&previewClaim.expectedGeneration!==profile.generation} onPress={()=>void claimPreview()}/>
     <Action label="Discard preview" theme={theme} disabled={disabled} onPress={()=>setConfirmDiscard(true)}/>
     {confirmDiscard&&<View style={ui.stack}><Copy theme={theme}>Clear these unsaved preview answers from this device? Saved account answers stay in your account.</Copy><Action label="Clear the preview" theme={theme} disabled={disabled} onPress={()=>void discardPreview()}/><Action label="Keep reviewing" theme={theme} disabled={disabled} onPress={()=>setConfirmDiscard(false)}/></View>}
    </Card>}
    {tab==='today'&&profile?.available&&!previewNeedsSave&&<View style={ui.smallStack}>
     <View style={ui.row}><View style={{flexGrow:1,justifyContent:'center'}}><Copy theme={theme} kind="title">Today</Copy></View><Action label={mood?`Mood: ${DISCOVERY_MOODS.find(item=>item.id===mood)!.label}`:'Mood & topic'} hint="Choose a mood, pace or topic for your next question." theme={theme} disabled={disabled} onPress={()=>setShowTopics(true)}/></View>
     {busy&&!next&&<LoadingCard label="Finding your question…" theme={theme}/>}
     {next?.question&&<View style={ui.smallStack}>
      <Copy theme={theme} kind="muted">{discoveryDomainLabel(next.question.domain)}</Copy>
      {next.answered?<><Copy theme={theme} kind="title">{next.question.prompt}</Copy><Copy theme={theme}>You’ve answered this question. You can review it in About you, or explore another.</Copy><Action label="One more question" theme={theme} primary disabled={disabled} onPress={()=>ask(false)}/><Action label="See your reflections" theme={theme} disabled={disabled} onPress={()=>setTab('about')}/></>:<>
       <QuestionInput question={next.question} value={value} onChange={response=>{setValue(response);setQuestionError('');if(response.kind!=='ranking'&&response.kind!=='text')saveAnswer(response);}} theme={theme} disabled={disabled} includeSkip={false} submitOnTap/>
       {!!questionError&&<Copy theme={theme} live>{questionError}</Copy>}
      </>}
     </View>}
     {next&&!next.question&&<Card theme={theme}><Copy theme={theme} kind="title">{next.reason==='pause'?'A good place to pause.':'You’ve explored this corner.'}</Copy><Copy theme={theme}>{next.reason==='pause'?'Your answers are saved. Come back whenever you feel like it.':'Try another topic or check back for new questions.'}</Copy>
      {next.reason==='pause'&&<Action label="I’d like one more question" theme={theme} disabled={disabled} onPress={()=>ask(false,false,true)}/>}
      <Action label="Choose another topic" theme={theme} disabled={disabled} onPress={()=>setShowTopics(true)}/><Action label="See your reflections" theme={theme} disabled={disabled} onPress={()=>setTab('about')}/>
     </Card>}
     {!next&&!busy&&!loading&&<Action label="Open today’s question" theme={theme} primary disabled={disabled} onPress={()=>ask(true)}/>}
    </View>}
    {tab==='recent'&&profile?.available&&<RecentAnswers profile={profile} theme={theme} disabled={disabled} onEdit={edit} onDelete={remove}/>}
    {tab==='about'&&profile?.available&&<ProfilePanel theme={theme} profile={profile} preferencesSignal={preferencesSignal} disabled={disabled} onEdit={edit} onToggle={toggle} onDelete={remove}
     onFeedback={(insightId,feedback)=>{const input={requestId:randomUUID(),expectedGeneration:profile.generation,insightId,feedback};return disabled?Promise.resolve(false):perform({run:()=>api.feedback(input),done:()=>{},label:'Reflection updated.'});}}
     onSettings={settings=>disabled?Promise.resolve(false):perform({run:()=>api.settings({...settings,expectedGeneration:profile.generation}),done:()=>{setNext(null);initialQuestion.current=false;},label:'Question preferences saved.'})}
     onToday={()=>setTab('today')} onExit={()=>setTab('today')}/>}
    {tab==='account'&&<View style={ui.stack}><Copy theme={theme} kind="hero">Your account</Copy><Copy theme={theme}>{userLabel}</Copy>
     <AccountTools theme={theme} api={accountApi} onSignOut={onSignOut} onReauthenticate={onReauthenticate} onDataChanged={privacyChanged} onTermsAccepted={reload} onDecision={id=>openDecision('journal',id)} onExit={()=>setTab('today')}/>
     <Action label="Sign out" theme={theme} disabled={busy||loading} onPress={()=>setConfirmSignOut(true)}/>
     {confirmSignOut&&<Card theme={theme}><Copy theme={theme}>Sign out on this device? Your saved answers stay in your account.</Copy><Action label="Sign out of this device" theme={theme} primary disabled={busy} onPress={()=>void signOut()}/><Action label="Stay signed in" theme={theme} disabled={busy} onPress={()=>setConfirmSignOut(false)}/></Card>}
    </View>}
   </View>
  </ScrollView>}
  {tab==='today'&&!previewNeedsSave&&next?.question&&!next.answered&&<View style={[styles.answerFooter,{backgroundColor:theme.surface,borderColor:theme.line}]}><View style={styles.answerFooterContent}>
   {['ranking','text'].includes(next.question.format)&&<View style={{flex:2}}><Action label="Save answer" theme={theme} primary disabled={disabled||!value} onPress={()=>saveAnswer()}/></View>}
   {next.question.allowedResponses.includes('skip')&&<View style={{flex:1}}><Action label="Skip" hint="Skip without adding a preference." theme={theme} disabled={disabled} onPress={()=>saveAnswer({kind:'skip'})}/></View>}
  </View></View>}
  </ScreenTransition>
  {profile&&<TopicSheet visible={showTopics} topic={topic} mode={mode} mood={mood} profile={profile} theme={theme} disabled={disabled} onClose={()=>setShowTopics(false)} onApply={applyQuestionSettings}/>}
  <NavigationDrawer visible={menuVisible} value={tab==='decide'&&decisionTarget.mode==='journal'?'journal':tab} theme={theme} onClose={onCloseMenu} onChange={page=>{if(page==='journal')openDecision('journal');else if(page==='decide')openDecision('compare');else setTab(page);}}/>
  {profile?.available&&<AnswerMilestone userId={userId} count={new Set(profile.answers.filter(answer=>answer.response.kind!=='skip').map(answer=>answer.questionId)).size} theme={theme}/>}
 </View>;
}
const styles=StyleSheet.create({shell:{flex:1},scroll:{flexGrow:1,padding:layout.space.lg,paddingTop:layout.space.sm,paddingBottom:layout.space.md},content:{width:'100%',maxWidth:layout.maxWidth,alignSelf:'center',gap:layout.space.md},answerFooter:{borderTopWidth:1,paddingHorizontal:layout.space.lg,paddingVertical:layout.space.sm},answerFooterContent:{width:'100%',maxWidth:layout.maxWidth,alignSelf:'center',flexDirection:'row',gap:layout.space.sm}});
