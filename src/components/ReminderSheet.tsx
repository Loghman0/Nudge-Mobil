import {useEffect,useRef,useState} from 'react';
import {DateTimePickerAndroid} from '@react-native-community/datetimepicker';
import type {Theme} from '../theme';
import {reminderParts,resolveReminder,type LocalReminderParts} from '../reminder-time';
import {Action,ActionMenu,Copy} from './native-ui';
export function ReminderSheet({visible,dueAt,theme,busy,onClose,onSave}:{visible:boolean;dueAt:string|null;theme:Theme;busy:boolean;onClose:()=>void;onSave:(dueAt:string)=>void}){
 const [parts,setParts]=useState<LocalReminderParts>(()=>reminderParts(new Date(Date.now()+86400000))),[error,setError]=useState('');
 const active=useRef(visible),picker=useRef(false);active.current=visible;
 useEffect(()=>{if(visible){const saved=dueAt?new Date(dueAt):null;setParts(reminderParts(saved&&Number.isFinite(saved.getTime())&&saved.getTime()>Date.now()?saved:new Date(Date.now()+86400000)));setError('');}},[visible,dueAt]);
 useEffect(()=>{if(!visible){picker.current=false;void DateTimePickerAndroid.dismiss('date').catch(()=>{});void DateTimePickerAndroid.dismiss('time').catch(()=>{});}},[visible]);
 useEffect(()=>()=>{active.current=false;void DateTimePickerAndroid.dismiss('date').catch(()=>{});void DateTimePickerAndroid.dismiss('time').catch(()=>{});},[]);
 const date=new Date(parts.year,parts.month-1,parts.day,parts.hour,parts.minute);
 function open(mode:'date'|'time'){
  if(busy||picker.current)return;picker.current=true;
  try{DateTimePickerAndroid.open({mode,value:date,display:'default',...(mode==='date'?{minimumDate:new Date(),maximumDate:new Date(Date.now()+365*86400000)}:{}),
   positiveButton:{label:mode==='date'?'Set date':'Set time'},negativeButton:{label:'Cancel'},
   onValueChange:(_event,chosen)=>{picker.current=false;if(!active.current)return;const next=reminderParts(chosen);setParts(current=>mode==='date'?{...current,year:next.year,month:next.month,day:next.day}:{...current,hour:next.hour,minute:next.minute});setError('');},
   onDismiss:()=>{picker.current=false;},onError:()=>{picker.current=false;if(active.current)setError('Could not open the picker. Try again.');},
  });}catch{picker.current=false;setError('Could not open the picker. Try again.');}
 }
 function save(){const result=resolveReminder(parts);if(!result.dueAt){setError(result.error??'Review this time.');return;}setError('');onSave(result.dueAt);}
 let zone='Device time';try{zone=Intl.DateTimeFormat().resolvedOptions().timeZone||zone;}catch{}
 return <ActionMenu visible={visible} title="Schedule a check-in" theme={theme} onClose={()=>{if(!busy)onClose();}} footer={<><Action label="Save check-in" theme={theme} primary busy={busy} onPress={save}/><Action label="Cancel" theme={theme} disabled={busy} onPress={onClose}/></>}>
  <Action label={`Date: ${date.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})}`} theme={theme} disabled={busy} onPress={()=>open('date')}/>
  <Action label={`Time: ${date.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})}`} theme={theme} disabled={busy} onPress={()=>open('time')}/>
  <Copy theme={theme} kind="muted">{zone}</Copy>
  {!!error&&<Copy theme={theme} live>{error}</Copy>}
 </ActionMenu>;
}
