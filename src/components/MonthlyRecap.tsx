import {useEffect,useRef,useState} from 'react';
import {View} from 'react-native';
import {MoreApi,MoreApiError,type RecapResult,type RecapReason} from '../more-api';
import type {Theme} from '../theme';
import {Action,Copy,ui} from './native-ui';
const reasons:Record<RecapReason,string>={
 off:'Optional AI is off. You can review it in Account settings.',
 unavailable:'AI recaps are unavailable here. Your outcome patterns still work.',
 capacity:'The AI usage limit has been reached. Try again later.',
 no_data:'A recap needs at least three completed decisions in the last 30 days.',
 failed:'Could not create a recap. Try again later.',
 timed_out:'The recap took too long and was stopped. Try again later.',
 changed:'Your privacy or AI settings changed. This recap was discarded.',
};
export function MonthlyRecap({api,theme,onBusyChange}:{api:MoreApi;theme:Theme;onBusyChange:(busy:boolean)=>void}){
 const [result,setResult]=useState<RecapResult|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const mounted=useRef(true),locked=useRef(false);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 async function generate(){
  if(locked.current)return;locked.current=true;setBusy(true);onBusyChange(true);setResult(null);setError('');
  try{const value=await api.recap();if(mounted.current)setResult(value);}
  catch(e){if(mounted.current)setError(e instanceof MoreApiError?e.message:'Could not load your recap. Try again later.');}
  finally{locked.current=false;if(mounted.current){setBusy(false);onBusyChange(false);}}
 }
 return <View style={ui.stack}>
  {result?.text?<><Copy theme={theme}>{result.text}</Copy><Copy theme={theme} kind="muted">{result.sampled?'Sample of the latest':'Based on'} {result.sampleSize} completed decisions in the 30 days ending {new Date(result.asOf).toLocaleDateString()}.{result.sampled?' Older decisions in this period are outside this sample.':''}</Copy></>:<Copy theme={theme} kind="muted">AI uses decision totals and up to six question/choice examples from the last 30 days. It does not receive your reflection notes.</Copy>}
  {result?.text===null&&<Copy theme={theme} live>{reasons[result.reason]}</Copy>}
  {!!error&&<Copy theme={theme} live>{error}</Copy>}
  <Action label={result?.text?'Write a new recap':'Write my recap'} theme={theme} primary busy={busy} onPress={()=>void generate()}/>
  {(result||error)&&<Action label="Dismiss recap" theme={theme} disabled={busy} onPress={()=>{setResult(null);setError('');}}/>}
 </View>;
}
