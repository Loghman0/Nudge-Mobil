import {useEffect,useRef,useState} from 'react';
import {BackHandler,Linking,TextInput,View} from 'react-native';
import {File,Paths} from 'expo-file-system';

import {AccountApi,AccountApiError,type AccountBasics,type AccountSnapshot,type CheckIn} from './account-api';
import {type Theme} from './theme';
import {Action,Card,Copy,LoadingCard,ui} from './components/native-ui';
import {GoogleButton} from './components/GoogleButton';
import {useFeedback} from './feedback';
type Section='menu'|'basics'|'privacy'|'terms'|'checkins';
type Danger='reset'|'history'|'delete';
export interface AccountToolsProps{theme:Theme;api:AccountApi;onSignOut:()=>Promise<void>;onReauthenticate?:()=>Promise<void>;onDataChanged?:()=>Promise<void>|void;onTermsAccepted?:()=>Promise<void>|void;onDecision?:(id:string)=>void;onExit?:()=>void}
/** Renders within the Account tab's existing scroll container. */
export function AccountTools({theme,api,onSignOut,onReauthenticate,onDataChanged,onTermsAccepted,onDecision,onExit}:AccountToolsProps){
 const feedback=useFeedback();
 const [section,setSection]=useState<Section>('menu'),[data,setData]=useState<AccountSnapshot|null>(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[uncertain,setUncertain]=useState(false),[reauth,setReauth]=useState(false),[openingGoogle,setOpeningGoogle]=useState(false);
 const [basics,setBasics]=useState<AccountBasics>({full_name:null,country:null,language:null,occupation:null}),[danger,setDanger]=useState<Danger|null>(null),[confirmation,setConfirmation]=useState(''),[eligible,setEligible]=useState(false),[accepted,setAccepted]=useState(false),[checkins,setCheckins]=useState<CheckIn[]>([]),[checksLoaded,setChecksLoaded]=useState(false),[checksPage,setChecksPage]=useState(0);
 const mounted=useRef(true),locked=useRef(false),version=useRef(0),googleLock=useRef(false);
 const disabled=busy||loading||uncertain;
 useEffect(()=>{mounted.current=true;try{const old=new File(Paths.cache,'nudge-export.json');if(old.exists)old.delete();}catch{/* Clear a legacy private export on the next app launch. */}void reload();return()=>{mounted.current=false;version.current++;};},[api]);
 useEffect(()=>{const listener=BackHandler.addEventListener('hardwareBackPress',()=>{if(busy)return true;if(danger){setDanger(null);setConfirmation('');return true;}if(section!=='menu'){setSection('menu');return true;}if(onExit){onExit();return true;}return false;});return()=>listener.remove();},[busy,danger,section,onExit]);
 function report(reason:unknown){if(!mounted.current)return;setError(reason instanceof AccountApiError?reason.message:'Could not finish this account step. Reload before trying again.');setReauth(reason instanceof AccountApiError&&reason.code==='reauthenticate');}
 async function load(){const epoch=++version.current,result=await api.profile();if(!mounted.current||epoch!==version.current)return null;setData(result);setBasics({full_name:result.profile.full_name,country:result.profile.country,language:result.profile.language,occupation:result.profile.occupation});return result;}
 async function reload(){if(locked.current)return;locked.current=true;setLoading(true);setError('');setNotice('');try{await load();if(mounted.current){setUncertain(false);setDanger(null);setConfirmation('');setReauth(false);}}catch(reason){report(reason);}finally{locked.current=false;if(mounted.current)setLoading(false);}}
 async function mutate(run:()=>Promise<unknown>,message:string,options:{privacy?:boolean;deleted?:boolean;terms?:boolean}={}){
  if(locked.current||disabled)return;locked.current=true;setBusy(true);setError('');setNotice('');setReauth(false);
  try{
   await run();if(!mounted.current)return;
   if(options.deleted){setNotice('Account deleted.');await onSignOut();return;}
   setDanger(null);setConfirmation('');setNotice(message);
   // The write succeeded. Never present a failed refresh as a failed write.
   try{if(options.privacy)await onDataChanged?.();if(options.terms)await onTermsAccepted?.();await load();}catch{if(mounted.current){setUncertain(true);setNotice(message+' Reload to see the latest account.');}}
  }catch(reason){if(mounted.current){report(reason);if(!(reason instanceof AccountApiError)||reason.status===0||reason.status>=500)setUncertain(true);}}
  finally{locked.current=false;if(mounted.current)setBusy(false);}
 }
 async function loadChecks(){
  if(locked.current)return;locked.current=true;setBusy(true);setError('');setSection('checkins');
  try{const result=await api.checkins();if(mounted.current){setCheckins(result.checkins);setChecksLoaded(true);setChecksPage(0);}}catch(reason){report(reason);}finally{locked.current=false;if(mounted.current)setBusy(false);}
 }
 async function dismiss(id:string|'all'){
  if(locked.current||disabled)return;locked.current=true;setBusy(true);setError('');
  try{await api.dismiss(id);if(mounted.current)setCheckins(rows=>rows.map(row=>id==='all'||row.id===id?{...row,read_at:row.read_at??new Date().toISOString()}:row));}
  catch(reason){report(reason);if(mounted.current)setNotice('Refresh check-ins to confirm their status.');}finally{locked.current=false;if(mounted.current)setBusy(false);}
 }
 async function openPolicy(path:string){try{await Linking.openURL('https://projectnudge.vercel.app'+path);}catch{if(mounted.current)setError('Could not open your browser. Try again.');}}
 async function reconnectGoogle(){
  if(googleLock.current||!onReauthenticate)return;
  googleLock.current=true;setOpeningGoogle(true);
  try{await onReauthenticate();}catch(reason){report(reason);}
  finally{googleLock.current=false;if(mounted.current)setOpeningGoogle(false);}
 }
 function chooseDanger(next:Danger){setDanger(next);setConfirmation('');setError('');}
 const keyword=danger==='reset'?'FORGET':danger==='history'?'DELETE HISTORY':'DELETE';
 return <View style={ui.stack}>
  {section!=='menu'&&<Action label="Back to account" theme={theme} disabled={busy} onPress={()=>{setSection('menu');setDanger(null);}}/>}
  {loading&&<LoadingCard label="Loading account settings…" theme={theme}/>}
  {!!notice&&<Card theme={theme}><Copy theme={theme} live>{notice}</Copy></Card>}
  {!!error&&<Card theme={theme}><Copy theme={theme} live>{error}</Copy>{reauth&&onReauthenticate&&<GoogleButton label="Sign in with Google again" disabled={busy} busy={openingGoogle} onPress={()=>void reconnectGoogle()}/>}<Action label="Reload account" theme={theme} disabled={busy} onPress={()=>void reload()}/></Card>}
  {uncertain&&!error&&<Action label="Reload account before continuing" theme={theme} disabled={busy} onPress={()=>void reload()}/>}
  {section==='menu'&&<View style={ui.stack}>
   <Action label="Edit profile" theme={theme} disabled={disabled} onPress={()=>setSection('basics')}/>
   <Action label="Privacy and data" theme={theme} disabled={disabled} onPress={()=>setSection('privacy')}/>
   <Action label="Check-ins" theme={theme} disabled={disabled} onPress={()=>void loadChecks()}/>
   <Action label="Gentle sounds" theme={theme} selected={feedback.preferences.sound} onPress={()=>void feedback.setPreference('sound',!feedback.preferences.sound)}/>
   {!!feedback.error&&<Copy theme={theme} live>{feedback.error}</Copy>}
   {data&&data.profile.terms_version!==data.policyVersion&&<Action label="Review the current terms" theme={theme} disabled={disabled} onPress={()=>setSection('terms')}/>}
  </View>}
  {section==='basics'&&data&&<Card theme={theme}><Copy theme={theme} kind="title">Your profile</Copy>
   {([{key:'full_name',label:'Name',max:80},{key:'country',label:'Country',max:60},{key:'language',label:'Language',max:40},{key:'occupation',label:'Occupation',max:80}]as const).map(field=><View key={field.key} style={ui.smallStack}><Copy theme={theme}>{field.label}</Copy><TextInput accessibilityLabel={field.label} value={basics[field.key]??''} onChangeText={value=>setBasics(current=>({...current,[field.key]:value}))} maxLength={field.max} editable={!disabled} style={[ui.input,{backgroundColor:theme.card,color:theme.text,borderColor:theme.controlLine}]}/></View>)}
   <Action label="Save profile" theme={theme} primary disabled={disabled} onPress={()=>void mutate(()=>api.basics({...basics}),'Profile saved.')}/>
  </Card>}
  {section==='terms'&&data&&<Card theme={theme}><Copy theme={theme} kind="title">Your choice about the terms</Copy><Copy theme={theme}>Read Nudge’s current Terms and Privacy policy before continuing. They describe eligibility, how your answers are used and your controls.</Copy>
   <Action label="Read Terms · opens browser" theme={theme} onPress={()=>void openPolicy('/terms')}/><Action label="Read Privacy policy · opens browser" theme={theme} onPress={()=>void openPolicy('/privacy')}/>
   <Action label={`I meet the Terms’ eligibility requirements (${data.minimumAge}+).`} theme={theme} selected={eligible} disabled={disabled} onPress={()=>setEligible(!eligible)}/>
   <Action label="I accept the current Terms and acknowledge the Privacy policy." theme={theme} selected={accepted} disabled={disabled} onPress={()=>setAccepted(!accepted)}/>
   <Action label="Save my agreement" theme={theme} primary disabled={disabled||!eligible||!accepted} onPress={()=>void mutate(()=>api.terms(data.policyVersion,true,true),'Your agreement is saved.',{terms:true})}/>
  </Card>}
  {section==='privacy'&&data&&<View style={ui.stack}>
   {(data.aiAvailable||data.profile.ai_enabled)&&<Card theme={theme}><Copy theme={theme} kind="title">AI assistance</Copy><Copy theme={theme}>AI can process questions and notes you submit, along with limited decision summaries.</Copy>
    {data.profile.terms_version!==data.policyVersion?<Action label="Review terms before enabling AI" theme={theme} disabled={disabled} onPress={()=>setSection('terms')}/>:null}
    <Action label={data.profile.ai_enabled?'Turn off AI assistance':'Turn on AI assistance'} theme={theme} disabled={disabled||!data.profile.ai_enabled&&(!data.aiAvailable||data.profile.terms_version!==data.policyVersion)} selected={data.profile.ai_enabled} onPress={()=>void mutate(()=>api.ai(!data.profile.ai_enabled),data.profile.ai_enabled?'AI assistance turned off. Saved comparison settings and explanations were cleared.':'AI assistance turned on.',{privacy:true})}/>
   </Card>}
   <Action label="Privacy policy" hint="Opens in your browser" theme={theme} onPress={()=>void openPolicy('/privacy')}/>
   <Card theme={theme}><Copy theme={theme} kind="title">Start fresh, or leave</Copy><Action label="Make Nudge forget learned patterns" theme={theme} disabled={disabled} onPress={()=>chooseDanger('reset')}/><Action label="Delete decision history" theme={theme} disabled={disabled} onPress={()=>chooseDanger('history')}/><Action label="Delete my account" theme={theme} disabled={disabled} onPress={()=>chooseDanger('delete')}/>
    {danger&&<View style={ui.stack}>
     <Copy theme={theme}>{danger==='reset'?'This removes learned patterns from use. Your journal stays, but Nudge will not use older learning to rank decisions.':danger==='history'?'This permanently deletes your decisions, options and reflections. Review anything you need first.':'This permanently removes your live account, answers, journal, memories, reminders and votes. Your owned circles and polls are removed for their members too. Review anything you need first. Restricted backups and logs follow the published retention policy.'}</Copy>
     <Copy theme={theme}>Type {keyword} to confirm</Copy><TextInput accessibilityLabel={`Type ${keyword} to confirm`} value={confirmation} onChangeText={setConfirmation} autoCapitalize="characters" autoCorrect={false} editable={!disabled} style={[ui.input,{backgroundColor:theme.card,color:theme.text,borderColor:theme.controlLine}]}/>
     <Action label={danger==='delete'?'Permanently delete my account':danger==='history'?'Delete my decision history':'Forget learned patterns'} theme={theme} primary disabled={disabled||confirmation!==keyword} onPress={()=>{if(danger==='reset')void mutate(()=>api.reset('FORGET'),'Learned patterns reset.',{privacy:true});else if(danger==='history')void mutate(()=>api.deleteHistory('DELETE HISTORY'),'Decision history deleted.',{privacy:true});else void mutate(()=>api.deleteAccount('DELETE'),'Account deleted.',{deleted:true});}}/>
     <Action label="Keep my data" theme={theme} disabled={busy} onPress={()=>{setDanger(null);setConfirmation('');}}/>
    </View>}
   </Card>
  </View>}
  {section==='checkins'&&<View style={ui.stack}><Copy theme={theme} kind="title">Check-ins</Copy>
   {busy&&!checksLoaded&&<LoadingCard label="Loading your check-ins…" theme={theme}/>}
   {checksLoaded&&!checkins.length&&<Card theme={theme}><Copy theme={theme}>No check-ins yet. Schedule one after choosing a decision.</Copy></Card>}
   {checkins.some(c=>!c.read_at)&&<Action label="Dismiss all unread check-ins" theme={theme} disabled={disabled} onPress={()=>void dismiss('all')}/>}
   {checkins.slice(checksPage*10,(checksPage+1)*10).map(check=><Card key={check.id} theme={theme}><Copy theme={theme} kind="title">{check.title}</Copy>{!!check.body&&<Copy theme={theme}>{check.body}</Copy>}<Copy theme={theme} kind="muted">{check.read_at?'Read':'Unread'} · {new Date(check.created_at).toLocaleDateString()}</Copy>
    {check.payload.decision_id&&onDecision&&<Action label="Reflect on this decision" theme={theme} disabled={disabled} onPress={()=>onDecision(check.payload.decision_id!)}/>}
    {!check.read_at&&<Action label="Dismiss check-in" theme={theme} disabled={disabled} onPress={()=>void dismiss(check.id)}/>}</Card>)}
   {checkins.length>10&&<View style={ui.row}><Action label="Previous check-ins" theme={theme} disabled={busy||checksPage===0} onPress={()=>setChecksPage(page=>page-1)}/><Action label="More check-ins" theme={theme} disabled={busy||(checksPage+1)*10>=checkins.length} onPress={()=>setChecksPage(page=>page+1)}/></View>}
   <Action label="Refresh check-ins" theme={theme} disabled={busy} onPress={()=>void loadChecks()}/>
  </View>}
 </View>;
}
