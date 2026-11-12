import {useEffect,useRef,useState} from 'react';
import {matchingSavedPriorities,type SavedSetting,type SettingCategory,type SettingsApi,type SettingsState} from '../settings-api';
import type {Theme} from '../theme';
import {Action,Card,Copy} from './native-ui';

interface SavedPrioritiesProps {
 api:SettingsApi;
 domain:string;
 category?:SettingCategory;
 disabled:boolean;
 theme:Theme;
 onApply:(setting:SavedSetting,generation:number)=>boolean;
}

export function SavedPriorities({api,domain,category,disabled,theme,onApply}:SavedPrioritiesProps){
 const [state,setState]=useState<SettingsState|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const request=useRef(0);
 const locked=useRef(false);

 useEffect(()=>{
  const attempt=++request.current;
  void api.list().then(result=>{if(request.current===attempt)setState(result.state);}).catch(()=>{});
  return ()=>{request.current++;};
 },[api]);

 async function apply(setting:SavedSetting,generation:number){
  if(locked.current||disabled)return;
  locked.current=true;
  const attempt=request.current;
  setBusy(true);
  setError('');
  try{
   const current=await api.get(setting.id,generation);
   if(request.current!==attempt)return;
   if(current.setting.goal!==setting.goal||!onApply(current.setting,current.generation)){
    setError('This priority or setting changed. Review it before using it.');
    const latest=await api.list().catch(()=>null);
    if(request.current===attempt)setState(latest?.state??null);
   }
  }catch(reason){
   if(request.current!==attempt)return;
   setError(reason instanceof Error?reason.message:'Could not load this priority.');
   const latest=await api.list().catch(()=>null);
   if(request.current===attempt)setState(latest?.state??null);
  }finally{
   locked.current=false;
   if(request.current===attempt)setBusy(false);
  }
 }

 const matches=state?matchingSavedPriorities(state.settings,domain,category).slice(0,2):[];
 if(!matches.length&&!error)return null;
 return <Card theme={theme}>
  <Copy theme={theme} kind="title">Your saved priorities</Copy>
  {matches.map(setting=><Action key={setting.id} label={setting.goal} hint="Use this priority in this comparison" theme={theme} disabled={disabled||busy} onPress={()=>void apply(setting,state!.generation)}/>)}
  {!!error&&<Copy theme={theme} live>{error}</Copy>}
 </Card>;
}
