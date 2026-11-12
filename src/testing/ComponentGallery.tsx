import {useEffect,useState} from 'react';
import {BackHandler,ScrollView,TextInput,View} from 'react-native';
import type {Theme} from '../theme';
import {layout} from '../theme';
import {Action,Card,Copy,LoadingCard,ui} from '../components/native-ui';
import {NativeTabs,type NativeTab} from '../components/NativeTabs';
import {NoteReview} from '../components/NoteReview';
import {MoreApi} from '../more-api';
import {MonthlyRecap} from '../components/MonthlyRecap';
// Synthetic transport for visual/interaction tests, never account or AI data.
const noteApi=new MoreApi({baseUrl:'https://nudge.test',accessToken:async()=>'synthetic-gallery',fetch:async(url,init)=>new Response(JSON.stringify(String(url).endsWith('/recap')?{text:'You recorded three completed decisions, two about food and one about work. Two outcomes were rated, with an average of four out of five. These are recorded outcomes, not a prediction.',sampleSize:3,sampled:false,windowStart:'2026-10-11T12:00:00Z',asOf:'2026-11-10T12:00:00Z'}:String(url).endsWith('/extract')?{draft:{generation:0,suggestions:[{kind:'habit',content:'I read every evening.'},{kind:'goal',content:'I want to run five kilometers.'}]}}:{saved:JSON.parse(String(init?.body)).memories.length}),{status:200,headers:{'Content-Type':'application/json'}})});
/** Device-only component review, enabled solely by the development test flag. */
export function ComponentGallery({theme,onClose}:{theme:Theme;onClose:()=>void}){
 const [selected,setSelected]=useState(false),[tab,setTab]=useState<NativeTab>('today'),[text,setText]=useState('');
 const [notes,setNotes]=useState(false),[noteBusy,setNoteBusy]=useState(false);
 const [recap,setRecap]=useState(false);
 useEffect(()=>{const listener=BackHandler.addEventListener('hardwareBackPress',()=>{onClose();return true;});return()=>listener.remove();},[onClose]);
 if(notes)return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:layout.space.lg,gap:layout.space.md}}><Copy theme={theme} kind="title">Synthetic note UI test</Copy><Action label="Back to gallery" theme={theme} disabled={noteBusy} onPress={()=>setNotes(false)}/><NoteReview api={noteApi} theme={theme} onBusyChange={setNoteBusy}/></ScrollView>;
 if(recap)return <ScrollView contentContainerStyle={{padding:layout.space.lg,gap:layout.space.md}}><Copy theme={theme} kind="title">Synthetic recap UI test</Copy><Action label="Back to gallery" theme={theme} disabled={noteBusy} onPress={()=>setRecap(false)}/><MonthlyRecap api={noteApi} theme={theme} onBusyChange={setNoteBusy}/></ScrollView>;
 
 return <View style={{flex:1}}><ScrollView contentContainerStyle={{padding:layout.space.lg,gap:layout.space.md}}>
  <Copy theme={theme} kind="hero">Component gallery</Copy><Copy theme={theme} kind="muted">Development preview. These controls do not save account data.</Copy>
  <Action label="Close gallery" theme={theme} onPress={onClose}/>
  <Action label="Review note controls" theme={theme} onPress={()=>setNotes(true)}/>
  <Action label="Review recap controls" theme={theme} onPress={()=>setRecap(true)}/>
  <Card theme={theme}><Copy theme={theme} kind="title">Actions and answers</Copy>
   <Action label="Primary action" theme={theme} primary onPress={()=>setSelected(!selected)}/>
   <Action label="Select this answer" theme={theme} selected={selected} onPress={()=>setSelected(!selected)}/>
   <Action label="Disabled action" theme={theme} disabled onPress={()=>{}}/>
   <Action label="Saving…" theme={theme} primary disabled onPress={()=>{}}/>
  </Card>
  <Card theme={theme}><Copy theme={theme} kind="title">Text and validation</Copy><Copy theme={theme}>Option name</Copy><TextInput accessibilityLabel="Option name" value={text} onChangeText={setText} style={[ui.input,{color:theme.text,borderColor:theme.controlLine,backgroundColor:theme.card}]}/>
   {!text&&<Copy theme={theme} live>Add an option name to continue.</Copy>}
   <Action label="Continue" theme={theme} primary disabled={!text.trim()} onPress={()=>setText('')}/>
  </Card>
  <LoadingCard label="Loading your question…" theme={theme}/>
  <Card theme={theme}><Copy theme={theme} kind="title">Connection unavailable</Copy><Copy theme={theme}>Your draft is still here. Reconnect, then retry the same change.</Copy><Action label="Retry" theme={theme} onPress={()=>{}}/></Card>
  <Card theme={theme}><Copy theme={theme} kind="title">No decisions yet</Copy><Action label="Compare two options" theme={theme} onPress={()=>{}}/></Card>
 </ScrollView><NativeTabs theme={theme} value={tab} onChange={setTab}/></View>;
}
