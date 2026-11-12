import {useEffect,useRef,useState} from 'react';
import {TextInput,View} from 'react-native';
import {randomUUID} from 'expo-crypto';
import {MoreApi,MoreApiError,type MemoryDraft,type MemoryReview} from '../more-api';
import {noteReviewIntent,startNoteReview,type NoteEntry} from '../note-review';
import type {Theme} from '../theme';
import {Action,Card,Copy,ui} from './native-ui';

export function NoteReview({api,theme,onBusyChange}:{api:MoreApi;theme:Theme;onBusyChange:(busy:boolean)=>void}){
 const [text,setText]=useState(''),[draft,setDraft]=useState<MemoryDraft|null>(null),[entries,setEntries]=useState<NoteEntry[]>([]),[index,setIndex]=useState(0);
 const [reviewed,setReviewed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[pending,setPending]=useState<MemoryReview|null>(null);
 const [step,setStep]=useState<'review'|'confirm'>('review'),[showTypes,setShowTypes]=useState(false);
 const mounted=useRef(true),locked=useRef(false);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 function discard(){setDraft(null);setEntries([]);setPending(null);setReviewed(false);setIndex(0);setError('');setStep('review');setShowTypes(false);}
 function report(e:unknown){setError(e instanceof MoreApiError||e instanceof Error?e.message:'Could not finish this step.');}
 async function extract(){
  if(locked.current)return;locked.current=true;setBusy(true);onBusyChange(true);setError('');setNotice('');
  try{const value=await api.extractNotes(text);if(mounted.current){setDraft(value.draft);setEntries(startNoteReview(value.draft));setIndex(0);setReviewed(false);setStep('review');setShowTypes(false);}}
  catch(e){if(mounted.current)report(e);}finally{locked.current=false;if(mounted.current){setBusy(false);onBusyChange(false);}}
 }
 async function save(){
  if(locked.current||!draft)return;
  let intent:MemoryReview;try{intent=pending??noteReviewIntent(draft,entries,reviewed,randomUUID());}catch(e){report(e);return;}
  locked.current=true;setPending(intent);setBusy(true);onBusyChange(true);setError('');
  try{const result=await api.confirmNotes(intent);if(mounted.current){discard();setText('');setNotice(`${result.saved} ${result.saved===1?'memory':'memories'} saved. You can edit or delete them in Memory library.`);}}
  catch(e){if(mounted.current){if(e instanceof MoreApiError&&e.code==='changed')discard();report(e);}}
  finally{locked.current=false;if(mounted.current){setBusy(false);onBusyChange(false);}}
 }
 function edit(change:Partial<NoteEntry>){if(busy||pending)return;setEntries(current=>current.map((entry,at)=>at===index?{...entry,...change}:entry));setReviewed(false);setError('');}
 const current=entries[index],selected=entries.filter(entry=>entry.selected),frozen=busy||!!pending;
 return <View style={ui.stack}>
  {!!notice&&<Copy theme={theme} live>{notice}</Copy>}
  {!!error&&<Copy theme={theme} live>{error}</Copy>}
  {!draft?<Card theme={theme}>
   <Copy theme={theme}>What would you like Nudge to remember?</Copy>
   <TextInput accessibilityLabel="Notes for AI review" value={text} onChangeText={setText} maxLength={2000} multiline editable={!busy} placeholder="A goal, habit or practical limit" placeholderTextColor={theme.muted} style={[ui.input,{minHeight:112,color:theme.text,borderColor:theme.controlLine,backgroundColor:theme.card}]}/>
   <Copy theme={theme} kind="muted">Sends this note to AI. Nothing is saved until you confirm.</Copy>
   <Action label="Find suggestions" theme={theme} primary busy={busy} disabled={text.trim().length<3} onPress={()=>void extract()}/>
  </Card>:step==='review'&&current?<>
   <Copy theme={theme} kind="muted">Edit or leave out anything that does not fit.</Copy>
   <Card theme={theme}>
    <Copy theme={theme} kind="title">{index+1} of {entries.length} · {current.kind}</Copy>
    <TextInput accessibilityLabel="Suggested memory" value={current.content} onChangeText={content=>edit({content})} maxLength={300} multiline editable={!frozen} style={[ui.input,{color:theme.text,borderColor:theme.controlLine,backgroundColor:theme.card}]}/>
    <Action label={showTypes?'Close types':'Change type'} theme={theme} disabled={frozen} onPress={()=>setShowTypes(!showTypes)}/>
    {showTypes&&<View style={ui.row}>{(['fact','goal','habit','constraint'] as const).map(kind=><Action key={kind} label={kind[0].toUpperCase()+kind.slice(1)} theme={theme} selected={current.kind===kind} disabled={frozen} onPress={()=>{edit({kind});setShowTypes(false);}}/>)}</View>}
    <Action label={current.selected?'Selected to save':'Include this memory'} selected={current.selected} theme={theme} disabled={frozen} onPress={()=>edit({selected:!current.selected})}/>
    {entries.length>1&&<View style={ui.row}><Action label="Previous" style={{flex:1}} theme={theme} disabled={busy||index===0} onPress={()=>{setIndex(index-1);setShowTypes(false);}}/><Action label="Next" style={{flex:1}} theme={theme} disabled={busy||index===entries.length-1} onPress={()=>{setIndex(index+1);setShowTypes(false);}}/></View>}
   </Card>
   <Action label={`Review selected (${selected.length})`} theme={theme} primary disabled={busy||!selected.length||selected.some(entry=>!entry.content.trim())} onPress={()=>{setStep('confirm');setReviewed(true);setError('');}}/>
   <Action label="Discard suggestions" theme={theme} disabled={busy} onPress={()=>{discard();setNotice('Suggestions discarded. Nothing was saved.');}}/>
  </>:<>
   <Copy theme={theme} kind="title">Save {selected.length} {selected.length===1?'memory':'memories'}?</Copy>
   <Card theme={theme}>{selected.map((entry,at)=><View key={at} style={ui.smallStack}><Copy theme={theme} kind="muted">{entry.kind}</Copy><Copy theme={theme}>{entry.content}</Copy></View>)}</Card>
   {!!pending&&!busy&&<Copy theme={theme} kind="muted">This may have saved. Check the same request to confirm it without duplicates.</Copy>}
   <Action label={pending&&!busy?'Check same save request':'Confirm and save'} theme={theme} primary busy={busy} disabled={!pending&&(!reviewed||!selected.length)} onPress={()=>void save()}/>
   {!pending&&<Action label="Back to suggestions" theme={theme} disabled={busy} onPress={()=>{setStep('review');setReviewed(false);setError('');}}/>}
   <Action label={pending?'Close this review':'Discard suggestions'} theme={theme} disabled={busy} onPress={()=>{const uncertain=!!pending;discard();setNotice(uncertain?'Review closed. Check Memory library for any saved entries.':'Suggestions discarded. Nothing was saved.');}}/>
  </>}
 </View>;
}
