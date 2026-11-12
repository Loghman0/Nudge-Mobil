import {useCallback,useEffect,useMemo,useRef,useState,type ComponentType} from 'react';
import {AccessibilityInfo,AppState,BackHandler,Image,Linking,Pressable,ScrollView,StyleSheet,Text,View,type ScrollViewInstance} from 'react-native';
import {SafeAreaProvider,SafeAreaView} from 'react-native-safe-area-context';
import {StatusBar} from 'expo-status-bar';
import {answerPreview,describeDiscoveryResponse,previewInsights,previewQuestions,type DiscoveryResponse,type PreviewAnswers} from './src/preview';
import {layout,themes,typography,type Theme} from './src/theme';
import * as Crypto from 'expo-crypto';
import {Action} from './src/components/native-ui';
import {GoogleButton} from './src/components/GoogleButton';
import {AccountScreen} from './src/AccountScreen';
import {DiscoveryApi} from './src/discovery-api';
import {useNativeAuth} from './src/use-native-auth';
import {secureStorage} from './src/secure-storage';
import {DRAFT_KEY,parseNativeDraft,prepareClaim,type NativeDraft} from './src/draft';
import {publicConfig} from './src/public-config';
import {DecisionApi} from './src/decision-api';
import {clearDecisionDeviceDraft} from './src/DecisionScreen';
import {AccountApi} from './src/account-api';
import {MoreApi} from './src/more-api';
import {SettingsApi,FoundationApi} from './src/settings-api';
import {NativePushContext,useNativePush} from './src/use-native-push';
import {FeedbackProvider,useFeedback} from './src/feedback';
import {MotionProvider,ScreenTransition} from './src/components/motion';
import {OpeningMotion} from './src/components/OpeningMotion';
import {shouldReplayOpening} from './src/launch-policy';


type Screen={kind:'question';index:number;editing:boolean}|{kind:'results'};
function NativePreview(){
 const auth=useNativeAuth();
 const theme=themes.light;
 const {play}=useFeedback();
 const styles=useMemo(()=>makeStyles(theme),[theme]);
 const [screen,setScreen]=useState<Screen>({kind:'question',index:0,editing:false}),[answers,setAnswers]=useState<PreviewAnswers>({});
 const [pending,setPending]=useState<DiscoveryResponse>(),[error,setError]=useState(''),[review,setReview]=useState(false),[allInsights,setAllInsights]=useState(false);
 const [expandedInsight,setExpandedInsight]=useState<string|null>(null);
 const [menuVisible,setMenuVisible]=useState(false);
 useEffect(()=>{setMenuVisible(false);},[auth.session?.user.id]);
 const [Gallery,setGallery]=useState<ComponentType<{theme:Theme;onClose:()=>void}>|null>(null);
 const [draftReady,setDraftReady]=useState(false),[draft,setDraft]=useState<NativeDraft|null>(null);
 const [previewBusy,setPreviewBusy]=useState(false),previewLock=useRef(false);
 const [opening,setOpening]=useState(true);
 const [returnSequence,setReturnSequence]=useState(0);
 const backgroundedAt=useRef<number|null>(null);
 const closeOpening=useCallback(()=>setOpening(false),[]);
 const draftRef=useRef<NativeDraft|null>(null),userRef=useRef<string|undefined>(undefined);
 userRef.current=auth.session?.user.id;
 const tokenRef=useRef(auth.accessToken);tokenRef.current=auth.accessToken;
 const accountId=auth.session?.user.id;
 useEffect(()=>{
  const listener=AppState.addEventListener('change',state=>{
   if(state==='background'){
    backgroundedAt.current??=Date.now();
    return;
   }
   if(state!=='active')return;
   const previous=backgroundedAt.current;
   backgroundedAt.current=null;
   if(!shouldReplayOpening(previous,Date.now())||auth.busy||previewLock.current)return;
   setOpening(true);
   setReturnSequence(sequence=>sequence+1);
   setMenuVisible(false);
   setGallery(null);
   if(accountId||!draftReady)return;
   const first=previewQuestions.findIndex(question=>!answers[question.id]);
   setScreen(first<0?{kind:'results'}:{kind:'question',index:first,editing:false});
   setPending(undefined);
   setReview(false);
   setAllInsights(false);
   setExpandedInsight(null);
  });
  return()=>listener.remove();
 },[accountId,answers,auth.busy,draftReady]);
 const api=useMemo(()=>new DiscoveryApi({baseUrl:publicConfig.apiOrigin,accessToken:()=>tokenRef.current(accountId)}),[accountId]);
 const decisionApi=useMemo(()=>new DecisionApi({baseUrl:publicConfig.apiOrigin,accessToken:()=>tokenRef.current(accountId)}),[accountId]);
 const accountApi=useMemo(()=>new AccountApi({baseUrl:publicConfig.apiOrigin,accessToken:()=>tokenRef.current(accountId)}),[accountId]);
 const moreApi=useMemo(()=>new MoreApi({baseUrl:publicConfig.apiOrigin,accessToken:()=>tokenRef.current(accountId)}),[accountId]);
 const push=useNativePush(accountId??null,moreApi,auth.ready);
 const settingsApi=useMemo(()=>new SettingsApi({baseUrl:publicConfig.apiOrigin,accessToken:()=>tokenRef.current(accountId)}),[accountId]);
 const foundationApi=useMemo(()=>new FoundationApi({baseUrl:publicConfig.apiOrigin,accessToken:()=>tokenRef.current(accountId)}),[accountId]);
 useEffect(()=>{
  if(!__DEV__||process.env.EXPO_PUBLIC_NATIVE_TEST_HARNESS!=='1')return;
  let active=true;
  const open=(url:string|null|undefined)=>{if(url==='com.projectnudge.app://dev/gallery')void import('./src/testing/ComponentGallery').then(module=>{if(active)setGallery(()=>module.ComponentGallery);});};
  void Linking.getInitialURL().then(open);const listener=Linking.addEventListener('url',event=>open(event.url));
  return()=>{active=false;listener.remove();};
 },[]);
 useEffect(()=>{let active=true;void secureStorage.getItem(DRAFT_KEY).then(async raw=>{
  const saved=parseNativeDraft(raw);if(raw&&!saved)await secureStorage.removeItem(DRAFT_KEY);
  if(active&&saved){draftRef.current=saved;setDraft(saved);setAnswers(saved.answers);const firstUnanswered=previewQuestions.findIndex(question=>!saved.answers[question.id]);if(firstUnanswered<0)setScreen({kind:'results'});else setScreen({kind:'question',index:firstUnanswered,editing:false});}
 }).catch(()=>{if(active)setError('Could not restore your preview. Unlock your device and try again.');}).finally(()=>{if(active)setDraftReady(true);});return()=>{active=false;};},[]);
 const clearDraft=useCallback(async()=>{await secureStorage.removeItem(DRAFT_KEY);draftRef.current=null;setDraft(null);setAnswers({});},[]);
 useEffect(()=>{if(draftReady&&auth.session&&draft?.claim&&draft.claim.userId!==auth.session.user.id){void clearDraft().catch(()=>setError('Could not clear this device preview. Try signing out and reopening Nudge.'));}},[draftReady,auth.session?.user.id,draft?.claim?.userId,clearDraft]);
 async function persistAnswers(next:PreviewAnswers){
  if(draftRef.current?.claim)throw new Error('This preview is waiting to save. Sign in to finish, or start again.');
  const value:NativeDraft={version:2,createdAt:draftRef.current?.createdAt??Date.now(),answers:next};
  await secureStorage.setItem(DRAFT_KEY,JSON.stringify(value));draftRef.current=value;setDraft(value);
 }
 async function beginSignIn(){
  if(!previewQuestions.every(question=>answers[question.id]))return;
  try{setError('');if(Object.keys(answers).length&&!draftRef.current?.claim)await persistAnswers(answers);await auth.signIn();}
  catch(e){setError(e instanceof Error?e.message:'Could not keep your preview for sign-in. Try again.');}
 }
 async function preparePreviewClaim(generation:number){
  const current=draftRef.current,userId=auth.session?.user.id;if(!current||!userId)throw new Error('Review your preview before saving.');
  const next=prepareClaim(current,userId,generation,Crypto.randomUUID());
  await secureStorage.setItem(DRAFT_KEY,JSON.stringify(next));
  if(userRef.current!==userId)throw new Error('Your account changed. Sign in again.');
  draftRef.current=next;setDraft(next);return next.claim!;
 }
 async function signOut(){try{const warning=await push.beforeSignOut().catch(()=>'Phone notification cleanup could not be confirmed. You can turn notifications off in Android settings.');if(accountId&&!auth.isCurrentUser(accountId))return;await clearDraft();if(accountId)await clearDecisionDeviceDraft(accountId);if(accountId&&!auth.isCurrentUser(accountId))return;await auth.signOut();setScreen({kind:'question',index:0,editing:false});setPending(undefined);if(warning)setError(warning);}finally{push.endSignOut();}}
 const scroll=useRef<ScrollViewInstance>(null);
 const question=screen.kind==='question'?previewQuestions[screen.index]:undefined;
 const insights=useMemo(()=>previewInsights(answers),[answers]);
 const openQuestion=useCallback((index:number,editing=false)=>{
  if(previewLock.current||draftRef.current?.claim){setError('This preview is waiting to save. Sign in to finish, or start again.');return;}
  setPending(answers[previewQuestions[index].id]);setError('');setScreen({kind:'question',index,editing});
 },[answers]);
 const goBack=useCallback(()=>{
  if(opening||previewLock.current)return true;
  if(auth.session)return false;
  setError('');
  if(screen.kind==='results'){openQuestion(previewQuestions.length-1);return true;}
  if(screen.kind==='question'){
   if(screen.editing)setScreen({kind:'results'});
   else if(screen.index===0)return false;
   else openQuestion(screen.index-1);
   return true;
  }
  return false;
 },[opening,screen,openQuestion,auth.session]);
 useEffect(()=>{const listener=BackHandler.addEventListener('hardwareBackPress',goBack);return()=>listener.remove();},[goBack]);
 useEffect(()=>{
  scroll.current?.scrollTo({y:0,animated:false});
  if(screen.kind==='question')AccessibilityInfo.announceForAccessibility(`Question ${screen.index+1} of ${previewQuestions.length}. ${previewQuestions[screen.index].prompt}`);
  else if(screen.kind==='results')AccessibilityInfo.announceForAccessibility('Your preview is complete.');
 },[screen]);
 async function commit(response:DiscoveryResponse){
  if(screen.kind!=='question'||previewLock.current)return;
  previewLock.current=true;setPreviewBusy(true);
  try{
   const next=answerPreview(answers,screen.index,response);await persistAnswers(next);setAnswers(next);setError('');
   if(screen.editing||screen.index===previewQuestions.length-1){setReview(false);setScreen({kind:'results'});}
   else{const index=screen.index+1;setPending(next[previewQuestions[index].id]);setScreen({kind:'question',index,editing:false});}
  }catch(e){setError(e instanceof Error?e.message:'Could not save your preview on this device. Try again.');}
  finally{previewLock.current=false;setPreviewBusy(false);}
 }
 const reset=()=>{void clearDraft().then(()=>{setPending(undefined);setError('');setReview(false);setAllInsights(false);setScreen({kind:'question',index:0,editing:false});}).catch(()=>setError('Could not clear the preview. Unlock your device and try again.'));};
 return <NativePushContext.Provider value={push}><SafeAreaView style={styles.safe} edges={['top','bottom','left','right']}>
  <StatusBar style="dark"/>
  <View style={base.appSurface} pointerEvents={opening?'none':'auto'} accessibilityElementsHidden={opening} importantForAccessibility={opening?'no-hide-descendants':'auto'}>
  <View style={styles.header}>
   <View style={base.brand}><Image source={require('./assets/mark.png')} style={base.mark} accessible={false}/><Text style={styles.brandName}>Nudge</Text></View>
   {!!auth.session&&!Gallery&&<Pressable accessibilityRole="button" accessibilityLabel="Open Nudge menu" accessibilityState={{expanded:menuVisible}} onPress={()=>{play();setMenuVisible(true);}} style={({pressed})=>({minHeight:layout.target,minWidth:layout.target,alignItems:"center",justifyContent:"center",borderRadius:layout.radius.small,backgroundColor:pressed?theme.selection:theme.surface,gap:5})}>{[0,1,2].map(line=><View key={line} style={{height:2,width:22,backgroundColor:theme.text,borderRadius:1}}/>)}</Pressable>}
  </View>
  {auth.error?<Text accessibilityLiveRegion="assertive" style={[styles.body,{paddingHorizontal:layout.space.lg}]}>{auth.error}</Text>:null}
  {Gallery?<Gallery theme={theme} onClose={()=>setGallery(null)}/>:!auth.ready||!draftReady?null:auth.session?<AccountScreen key={auth.session.user.id} theme={theme} api={api} userId={auth.session.user.id} decisionApi={decisionApi} accountApi={accountApi} moreApi={moreApi} settingsApi={settingsApi} foundationApi={foundationApi} onReauthenticate={auth.signIn} pushTarget={push.target} dailyTarget={push.dailyTarget} returnSequence={returnSequence} menuVisible={menuVisible} onCloseMenu={()=>setMenuVisible(false)}
   userLabel={typeof auth.session.user.user_metadata?.full_name==='string'&&auth.session.user.user_metadata.full_name.trim()?auth.session.user.user_metadata.full_name.slice(0,120):'Your Nudge account'} previewAnswers={!draft?.claim||draft.claim.userId===auth.session.user.id?answers:{}}
   previewClaim={draft?.claim?.userId===auth.session.user.id?draft.claim:undefined} onPreparePreviewClaim={preparePreviewClaim} onPreviewSaved={clearDraft} onSignOut={signOut}/>:<ScreenTransition identity={screen.kind==='question'?`preview-${screen.index}`:'preview-results'}><ScrollView ref={scroll} contentContainerStyle={base.scroll} contentInsetAdjustmentBehavior="automatic">
   <View style={base.content}>
    {screen.kind==='question'&&question&&<>
     <View style={base.progressRow}>
      <View/>
      <Text style={styles.secondary} accessibilityLabel={`Question ${screen.index+1} of ${previewQuestions.length}`}>{screen.index+1} / {previewQuestions.length}</Text>
     </View>
     <View accessible={false} style={base.progressTrack}>{previewQuestions.map((q,index)=><View key={q.id} style={[base.progressSegment,{backgroundColor:index<=screen.index?theme.accent:theme.line}]}/>)}</View>
     <Text accessibilityRole="header" style={styles.question}>{question.prompt}</Text>
     <View style={base.answerList}>
      {question.choices?.map(choice=><Action key={choice.id} label={choice.label} theme={theme}
       disabled={previewBusy} busy={previewBusy&&pending?.kind==='choice'&&pending.optionId===choice.id} hint="Saves this answer and opens the next question." selected={pending?.kind==='choice'&&pending.optionId===choice.id} onPress={()=>{const response={kind:'choice' as const,optionId:choice.id};setPending(response);void commit(response);}}/>) }
     </View>
     <View style={base.neutralRow}>{question.allowedResponses.filter(kind=>kind!=='skip').map(kind=><View key={kind} style={base.neutralChoice}><Action
      label={describeDiscoveryResponse(question,{kind})} theme={theme} disabled={previewBusy} busy={previewBusy&&pending?.kind===kind} hint="Saves this answer and opens the next question." selected={pending?.kind===kind} onPress={()=>{setPending({kind});void commit({kind});}}/></View>)}</View>
     {error?<Text accessibilityLiveRegion="assertive" style={styles.body}>{error}</Text>:null}
    </>}
    {screen.kind==='results'&&<>
     <Text accessibilityRole="header" style={styles.hero}>{insights.length?'Your reflections':'No reflection yet'}</Text>
     {!insights.length&&<Text style={styles.intro}>Review your answers or try another question.</Text>}
     {(allInsights?insights:insights.slice(0,2)).map(insight=><View key={insight.id} style={styles.card}>
      {insight.title!=='From your answers'&&<Text style={styles.cardTitle}>{insight.title}</Text>}
      <Text style={styles.body}>{insight.statement}</Text>
      <Action label={expandedInsight===insight.id?'Hide source answers':'See source answers'} theme={theme} onPress={()=>setExpandedInsight(expandedInsight===insight.id?null:insight.id)}/>
      {expandedInsight===insight.id&&insight.questionIds.map(id=>{const index=previewQuestions.findIndex(q=>q.id===id),q=previewQuestions[index],response=answers[id];return q&&response?<View key={id} style={base.source}>
       <Text style={styles.secondary}>{q.prompt}</Text><Text style={styles.body}>{describeDiscoveryResponse(q,response)}</Text>
       <Action label="Change answer" hint={q.prompt} theme={theme} onPress={()=>openQuestion(index,true)}/>
      </View>:null;})}
     </View>)}
     {!allInsights&&insights.length>2&&<Action label="See all reflections" theme={theme} onPress={()=>setAllInsights(true)}/>}
     <Action label={review?'Hide your answers':'Review your answers'} theme={theme} onPress={()=>setReview(!review)}/>
     <GoogleButton busy={auth.busy} disabled={auth.busy} hint="Sign in with Google, then review and save your answers." onPress={()=>void beginSignIn()}/>
     {error?<Text accessibilityLiveRegion="assertive" style={styles.body}>{error}</Text>:null}
     {review&&previewQuestions.map((q,index)=><View key={q.id} style={styles.card}>
      <Text style={styles.cardTitle}>{q.prompt}</Text><Text style={styles.body}>{answers[q.id]?describeDiscoveryResponse(q,answers[q.id]):'Not answered'}</Text>
      <Action label="Change answer" theme={theme} hint={q.prompt} onPress={()=>openQuestion(index,true)}/>
     </View>)}
     <Action label="Start again" theme={theme} hint="Clears this preview’s answers and starts again." onPress={reset}/>
    </>}
   </View>
  </ScrollView></ScreenTransition>}
  {!Gallery&&!auth.session&&auth.ready&&draftReady&&screen.kind==='question'&&question&&<View style={[base.previewFooter,{borderColor:theme.line,backgroundColor:theme.surface}]}><View style={base.footerContent}>
   <View style={base.continueChoice}><Action theme={theme} label="Back" hint={screen.editing?'Return to your reflections.':'Return to the previous question and change your answer.'} disabled={previewBusy||screen.index===0&&!screen.editing} onPress={goBack}/></View>
   {question.allowedResponses.includes('skip')&&<View style={base.neutralChoice}><Action label="Skip" hint="Skip this question without adding a preference." theme={theme} disabled={previewBusy} onPress={()=>void commit({kind:'skip'})}/></View>}
  </View></View>}
  </View>
  {opening&&<OpeningMotion key={returnSequence} ready={auth.ready&&draftReady} theme={theme} onComplete={closeOpening}/>}
 </SafeAreaView></NativePushContext.Provider>;
}
export default function App(){return <SafeAreaProvider><MotionProvider><FeedbackProvider><NativePreview/></FeedbackProvider></MotionProvider></SafeAreaProvider>;}
const base=StyleSheet.create({
 appSurface:{flex:1},
 brand:{flexDirection:'row',alignItems:'center',gap:layout.space.sm,flexShrink:1},mark:{width:28,height:28},
 scroll:{flexGrow:1,paddingHorizontal:layout.space.lg,paddingBottom:layout.space.xl},
 content:{width:'100%',maxWidth:layout.maxWidth,alignSelf:'center',gap:layout.space.md,paddingTop:layout.space.sm},
 answerList:{gap:layout.space.sm},neutralRow:{flexDirection:'row',gap:layout.space.sm},neutralChoice:{flex:1},
 previewFooter:{borderTopWidth:1,paddingHorizontal:layout.space.lg,paddingVertical:layout.space.sm},footerContent:{width:'100%',maxWidth:layout.maxWidth,alignSelf:'center',gap:layout.space.sm,flexDirection:'row'},continueChoice:{flex:2},source:{gap:layout.space.sm,paddingTop:layout.space.md},
 progressRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:layout.space.sm},
 progressTrack:{flexDirection:'row',gap:layout.space.xs},progressSegment:{height:4,flex:1,borderRadius:layout.radius.pill},
});
function makeStyles(t:Theme){return StyleSheet.create({
 safe:{flex:1,backgroundColor:t.surface},header:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',alignItems:'center',paddingHorizontal:layout.space.lg,paddingVertical:layout.space.sm,gap:layout.space.sm},
 brandName:{...typography.brand,color:t.text,flexShrink:1},
 hero:{...typography.hero,color:t.text},
 intro:{...typography.intro,color:t.muted},question:{...typography.question,color:t.text},
 card:{backgroundColor:t.card,borderRadius:layout.radius.card,borderWidth:1,borderColor:t.line,padding:layout.space.lg,gap:layout.space.md},
 cardTitle:{...typography.cardTitle,color:t.text},body:{...typography.body,color:t.text},secondary:{...typography.caption,color:t.muted},
});}
