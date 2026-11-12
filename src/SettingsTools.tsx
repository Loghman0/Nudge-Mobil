import {useEffect,useRef,useState} from 'react';
import {BackHandler,ScrollView,TextInput,View} from 'react-native';
import {SettingsApi,SettingsApiError,SETTING_CATEGORIES,type SettingCategory,type SettingDraft,type SavedSetting,type SettingsState} from './settings-api';
import type {Theme} from './theme';
import {layout} from './theme';
import {Action,Card,Copy,LoadingCard,ui} from './components/native-ui';
export interface SettingsToolsProps{theme:Theme;api:SettingsApi;onApply?:(setting:SavedSetting,generation:number)=>void;onBack?:()=>void;backLabel?:string}
function Field({label,value,onChange,max,theme,disabled,multiline=false}:{label:string;value:string;onChange:(value:string)=>void;max:number;theme:Theme;disabled:boolean;multiline?:boolean}){return <View style={ui.smallStack}><Copy theme={theme}>{label}</Copy><TextInput accessibilityLabel={label} editable={!disabled} value={value} onChangeText={onChange} maxLength={max} multiline={multiline} style={[ui.input,{color:theme.text,backgroundColor:theme.card,borderColor:theme.controlLine}]}/></View>;}
export function SettingsTools({theme,api,onApply,onBack,backLabel='Back to tools'}:SettingsToolsProps){
 const [state,setState]=useState<SettingsState|null>(null),[draft,setDraft]=useState<SettingDraft|null>(null),[deleting,setDeleting]=useState<SavedSetting|null>(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[blocked,setBlocked]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[types,setTypes]=useState(false);
 const mounted=useRef(true),locked=useRef(false),epoch=useRef(0);
 const disabled=busy||loading||blocked;
 useEffect(()=>{mounted.current=true;void reload();return()=>{mounted.current=false;epoch.current++;};},[api]);
 useEffect(()=>{const back=BackHandler.addEventListener('hardwareBackPress',()=>{if(locked.current)return true;if(deleting){setDeleting(null);return true;}if(draft){setDraft(null);return true;}if(onBack){onBack();return true;}return false;});return()=>back.remove();},[draft,deleting,onBack]);
 function report(reason:unknown){if(mounted.current)setError(reason instanceof SettingsApiError?reason.message:'Could not finish this saved-setting step. Reload before trying again.');}
 async function load(){const version=++epoch.current,result=await api.list();if(mounted.current&&version===epoch.current)setState(result.state);}
 async function reload(){if(locked.current)return;locked.current=true;setLoading(true);setError('');try{await load();if(mounted.current){setBlocked(false);setDraft(null);setDeleting(null);}}catch(reason){report(reason);}finally{locked.current=false;if(mounted.current)setLoading(false);}}
 async function change(run:()=>Promise<unknown>,label:string){
  if(locked.current||disabled)return;locked.current=true;setBusy(true);setError('');setNotice('');
  try{await run();if(!mounted.current)return;setDraft(null);setDeleting(null);setNotice(label);try{await load();}catch{if(mounted.current){setBlocked(true);setNotice(label+' Reload to see the latest settings.');}}}
  catch(reason){if(mounted.current){report(reason);setBlocked(!(reason instanceof SettingsApiError)||reason.status===0||reason.status>=500||reason.code==='changed');}}
  finally{locked.current=false;if(mounted.current)setBusy(false);}
 }
 function create(){if(!state||disabled)return;setDraft({id:null,name:'',domain:'',category:'other',goal:'',aliases:[],generation:state.generation});setTypes(false);setError('');}
 function edit(row:SavedSetting){if(!state||disabled)return;setDraft({id:row.id,name:row.name,domain:row.domain,category:row.category,goal:row.goal,aliases:row.aliases.map(a=>({...a})),generation:state.generation});setTypes(false);setError('');}
 async function apply(row:SavedSetting){if(!state||disabled||!onApply)return;locked.current=true;setBusy(true);setError('');try{const current=await api.get(row.id,state.generation);if(mounted.current)onApply(current.setting,current.generation);}catch(reason){if(mounted.current){report(reason);setBlocked(true);}}finally{locked.current=false;if(mounted.current)setBusy(false);}}
 const patch=(next:Partial<SettingDraft>)=>{if(draft)setDraft({...draft,...next});};
 return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:layout.space.lg,gap:layout.space.md,width:'100%',maxWidth:layout.maxWidth,alignSelf:'center'}}>
  {onBack&&<Action label={deleting?'Keep setting':draft?'Cancel editor':backLabel} theme={theme} disabled={busy} onPress={()=>{if(deleting)setDeleting(null);else if(draft)setDraft(null);else onBack();}}/>}<Copy kind="hero" theme={theme}>Saved comparison settings</Copy><Copy kind="muted" theme={theme}>Reuse a setting, goal and the meanings you entered. Review them again for each comparison.</Copy>
  {loading&&<LoadingCard label="Loading saved settings…" theme={theme}/>}{!!error&&<Copy theme={theme} live>{error}</Copy>}{!!notice&&<Copy theme={theme} live>{notice}</Copy>}
  {blocked&&<Copy kind="muted" theme={theme}>Reload ends this editor. An uncertain save may already be in the list; check before creating another.</Copy>}
  <Action label="Reload saved settings" theme={theme} disabled={busy||loading} onPress={()=>void reload()}/>
  {!draft&&<><Action label="Create a saved setting" theme={theme} primary disabled={disabled||!state||state.settings.length>=20} onPress={create}/>{state&&!state.settings.length&&<Card theme={theme}><Copy theme={theme}>No saved settings yet. You can save the vocabulary for a game, project or recurring choice.</Copy></Card>}
   {state?.settings.map(row=><Card key={row.id} theme={theme}><Copy kind="title" theme={theme}>{row.name}</Copy><Copy theme={theme}>{row.domain}{row.goal?' · '+row.goal:''}</Copy><Copy kind="muted" theme={theme}>{row.aliases.length} saved meanings</Copy>{row.aliases.map(alias=><View key={alias.term} style={ui.smallStack}><Copy theme={theme}>{alias.term}</Copy><Copy kind="muted" theme={theme}>{alias.meaning}</Copy></View>)}
    {onApply&&<Action label="Use in a comparison" theme={theme} primary disabled={disabled} onPress={()=>void apply(row)}/>}<Action label="Edit saved setting" theme={theme} disabled={disabled} onPress={()=>edit(row)}/><Action label="Delete saved setting" theme={theme} disabled={disabled} onPress={()=>setDeleting(row)}/>
    {deleting?.id===row.id&&<View style={ui.stack}><Copy theme={theme}>Delete this saved setting? Your decisions remain in your journal.</Copy><Action label="Delete this setting" theme={theme} disabled={disabled} onPress={()=>void change(()=>api.remove(row.id,state!.generation),'Saved setting deleted.')}/><Action label="Keep setting" theme={theme} disabled={disabled} onPress={()=>setDeleting(null)}/></View>}
   </Card>)}</>}
  {draft&&<Card theme={theme}><Copy kind="title" theme={theme}>{draft.id?'Edit saved setting':'New saved setting'}</Copy>
   <Field label="Name" value={draft.name} onChange={name=>patch({name})} max={80} theme={theme} disabled={disabled}/><Field label="Setting or domain" value={draft.domain} onChange={domain=>patch({domain})} max={100} theme={theme} disabled={disabled}/><Field label="Goal (optional)" value={draft.goal} onChange={goal=>patch({goal})} max={300} theme={theme} disabled={disabled} multiline/>
   <Action label={'Decision type: '+draft.category} theme={theme} disabled={disabled} onPress={()=>setTypes(!types)}/>{types&&SETTING_CATEGORIES.map(category=><Action key={category} label={category[0].toUpperCase()+category.slice(1)} theme={theme} selected={draft.category===category} disabled={disabled} onPress={()=>{patch({category});setTypes(false);}}/>)}
   {draft.aliases.map((alias,index)=><View key={index} style={ui.stack}><Field label={`Term ${index+1}`} value={alias.term} onChange={term=>patch({aliases:draft.aliases.map((item,at)=>at===index?{...item,term}:item)})} max={80} theme={theme} disabled={disabled}/><Field label={`Meaning ${index+1}`} value={alias.meaning} onChange={meaning=>patch({aliases:draft.aliases.map((item,at)=>at===index?{...item,meaning}:item)})} max={500} theme={theme} disabled={disabled} multiline/><Action label={`Remove term ${index+1}`} theme={theme} disabled={disabled} onPress={()=>patch({aliases:draft.aliases.filter((_,at)=>at!==index)})}/></View>)}
   <Action label="Add a term and meaning" theme={theme} disabled={disabled||draft.aliases.length>=12} onPress={()=>patch({aliases:[...draft.aliases,{term:'',meaning:''}]})}/><Action label="Save this setting" theme={theme} primary disabled={disabled||!draft.name.trim()||!draft.domain.trim()||draft.aliases.some(a=>!a.term.trim()||!a.meaning.trim())} onPress={()=>void change(()=>api.save({...draft,aliases:draft.aliases.map(a=>({...a}))}),'Saved setting updated.')}/><Action label="Cancel editor" theme={theme} disabled={busy} onPress={()=>setDraft(null)}/>
  </Card>}
 </ScrollView>;
}
