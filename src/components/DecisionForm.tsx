import {createContext,useContext,useState,type ReactNode} from 'react';
import {AccessibilityInfo,BackHandler,TextInput,View} from 'react-native';
import {useEffect} from 'react';
import {randomUUID} from 'expo-crypto';
import type {Theme} from '../theme';
import {Action,Card,Copy,ui} from './native-ui';
import {parseCriteria,criteriaForOptions,type ComparisonCriterion,type CreateDecisionInput,type DecisionSuggestion,type DecisionApi} from '../decision-api';
import {decisionInput,detachDraftSetting,patchDecisionDraft,type DecisionDraft} from '../decision-draft';
import {SETTING_CATEGORIES} from '../settings-api';
import {DISCOVERY_MOODS,type DiscoveryMood} from '../discovery-api';
import {moodDecisionPriorities} from '../core/mood';
import {MoodChoices} from './MoodChoices';
export {decisionInput,emptyDecisionDraft,type DecisionDraft} from '../decision-draft';
const FormDisabled=createContext(false);
export function DecisionField({label,value,onChange,theme,maxLength=100,multiline=false,numeric=false,placeholder,disabled=false,compact=false}:{label:string;value:string;onChange:(value:string)=>void;theme:Theme;maxLength?:number;multiline?:boolean;numeric?:boolean;placeholder?:string;disabled?:boolean;compact?:boolean}){
 const locked=useContext(FormDisabled)||disabled;
 return <View style={ui.smallStack}>{!compact&&<Copy theme={theme}>{label}</Copy>}<TextInput accessibilityLabel={label} editable={!locked} value={value} onChangeText={onChange} maxLength={maxLength} multiline={multiline}
  keyboardType={numeric?'numbers-and-punctuation':'default'} autoCapitalize={numeric?'none':'sentences'} placeholder={placeholder??(compact?label:undefined)} placeholderTextColor={theme.muted}
  style={[ui.input,{color:theme.text,backgroundColor:theme.card,borderColor:theme.controlLine}]}/></View>;
}
function freshCriterion(label=''):ComparisonCriterion{return {id:randomUUID(),label,unit:'points',weight:3,direction:'higher',low:0,high:10,values:{}};}
export function DecisionForm({theme,api,draft,onChange,onCreate,disabled,error,onStageChange,step,onStepChange,sessionMood=null,onMoodChange,savedPriorities}:{theme:Theme;api:DecisionApi;draft:DecisionDraft;onChange:(draft:DecisionDraft)=>void;onCreate:(input:CreateDecisionInput)=>void;disabled:boolean;error:string;onStageChange?:()=>void;step:0|1|2|3;onStepChange:(step:0|1|2|3)=>void;sessionMood?:DiscoveryMood|null;onMoodChange?:(mood:DiscoveryMood|null)=>void;savedPriorities?:ReactNode}){
 const [localError,setLocalError]=useState(''),[details,setDetails]=useState(false),[advanced,setAdvanced]=useState<string|null>(null),[sources,setSources]=useState<string|null>(null),[categories,setCategories]=useState(false);
 const [suggestions,setSuggestions]=useState<{generation:number;suggestions:DecisionSuggestion[]}|null>(null),[suggesting,setSuggesting]=useState(false),[showTitle,setShowTitle]=useState(false);
 const [showMood,setShowMood]=useState(false),[changeMood,setChangeMood]=useState(false);
 const [showFullPriorities,setShowFullPriorities]=useState(false);
 const patch=(value:Partial<DecisionDraft>)=>{onChange(patchDecisionDraft(draft,{...value,...(value.options?{criteria:criteriaForOptions(draft.criteria,value.options.map(label=>label.trim()).filter(Boolean))}:{})}));setLocalError('');};
 const labels=draft.options.map(label=>label.trim()).filter(Boolean);
 const back=()=>{if(disabled)return;onStepChange(0);setLocalError('');onStageChange?.();};
 useEffect(()=>{const listener=BackHandler.addEventListener('hardwareBackPress',()=>{if(disabled)return true;if(step>0){back();return true;}return false;});return()=>listener.remove();},[step,disabled]);
 useEffect(()=>{AccessibilityInfo.announceForAccessibility(step===2?'Optional priorities and ratings':step===3?'Review your choice':'Your options');},[step]);
 function changeCriterion(index:number,value:Partial<ComparisonCriterion>){patch({criteria:draft.criteria.map((c,i)=>i===index?{...c,...value}:c)});}
 const firstPriority=draft.criteria[0];
 const quickPriority=draft.basis==='criteria'&&!showFullPriorities&&draft.criteria.length<=1&&(!firstPriority||
  (firstPriority.unit==='points'&&firstPriority.low===0&&firstPriority.high===10&&firstPriority.direction==='higher'));
 async function loadSuggestions(){setSuggesting(true);setLocalError('');try{setSuggestions(await api.suggestions(draft.domain,draft.category));}catch(reason){setLocalError(reason instanceof Error?reason.message:'Could not load suggestions. You can add your own criteria.');}finally{setSuggesting(false);}}
 return <FormDisabled.Provider value={disabled}><View style={ui.smallStack}>
  {(step===0||step===1)&&<>
   <Copy theme={theme} kind="hero">What are you choosing?</Copy>
   {draft.options.map((label,index)=><View key={index} style={ui.smallStack}><DecisionField compact label={`Option ${index+1}`} value={label} onChange={value=>patch({options:draft.options.map((v,i)=>i===index?value:v)})} theme={theme} maxLength={80}/>{index>1&&<Action label={`Remove option ${index+1}`} theme={theme} disabled={disabled} onPress={()=>patch({options:draft.options.filter((_,i)=>i!==index)})}/>}</View>)}
   {draft.options.length<8&&<Action label="Add another option" theme={theme} disabled={disabled} onPress={()=>patch({options:[...draft.options,'']})}/>}

   {draft.appliedSource&&<Card theme={theme}><Copy theme={theme}>Using {draft.appliedSource.name}</Copy><Copy theme={theme} kind="muted">Review the setting and meanings for this choice.</Copy><Action label="Remove saved setting" theme={theme} disabled={disabled} onPress={()=>onChange(detachDraftSetting(draft,true))}/></Card>}
   <DecisionField label="Setting" placeholder="A game, a project, work, everyday life…" value={draft.domain} onChange={domain=>{patch({domain});setSuggestions(null);}} theme={theme}/>
   <Action label={details?"Hide extra context":"Add context (optional)"} theme={theme} disabled={disabled} onPress={()=>setDetails(!details)}/>
   {details&&<><DecisionField label="What matters in this choice?" value={draft.goal} onChange={goal=>patch({goal})} theme={theme} maxLength={300}/>
   <Action label={draft.category?'Decision type: '+draft.category:'Choose a decision type (optional)'} theme={theme} disabled={disabled} onPress={()=>setCategories(!categories)}/>
   {categories&&<View style={ui.smallStack}>{SETTING_CATEGORIES.map(category=><Action key={category} label={category[0].toUpperCase()+category.slice(1)} theme={theme} selected={draft.category===category} disabled={disabled} onPress={()=>{patch({category});setCategories(false);}}/>)}</View>}

   {labels.map(label=><DecisionField key={label} label={`What does ${label} mean here?`} value={draft.details[label]??''} onChange={value=>patch({details:{...draft.details,[label]:value}})} theme={theme} maxLength={500} multiline/>)}
   </>}
   {savedPriorities}
  </>}
  {step===2&&quickPriority&&<>
   <Copy theme={theme} kind="hero">What matters most for this choice?</Copy>
   <DecisionField label="Priority" placeholder="For example, easier to get to" value={firstPriority?.label??''} theme={theme}
    onChange={label=>patch({criteria:[firstPriority?{...firstPriority,label,discoverySuggestion:undefined}:freshCriterion(label)]})}/>
   <Copy theme={theme} kind="muted">Rate how well each option fits from 0 to 10. Leave an unknown rating blank.</Copy>
   {labels.map(label=><DecisionField key={label} label={label} placeholder="Unknown" numeric theme={theme} disabled={!firstPriority?.label.trim()}
    maxLength={20} value={firstPriority?.values[label]?.value?.toString()??''}
    onChange={value=>{if(firstPriority)changeCriterion(0,{values:{...firstPriority.values,[label]:{...firstPriority.values[label],value:value.trim()===''?null:Number(value)}}});}}/>)}
   <Action label="More comparison options" theme={theme} disabled={disabled} onPress={()=>setShowFullPriorities(true)}/>
  </>}
  {step===2&&!quickPriority&&<>
   <Copy theme={theme} kind="hero">Priorities & ratings</Copy>
   <Action label="My recorded preferences and experiences" theme={theme} selected={draft.basis==='journal'} disabled={disabled} onPress={()=>patch({basis:'journal'})}/>
   <Action label="Criteria I choose" theme={theme} selected={draft.basis==='criteria'} disabled={disabled} onPress={()=>patch({basis:'criteria'})}/>
   {onMoodChange&&<Action label={showMood?'Hide mood priorities':'Consider how I feel'} theme={theme} disabled={disabled} onPress={()=>setShowMood(!showMood)}/>}
   {showMood&&onMoodChange&&<Card theme={theme}>
    {sessionMood?<><Copy theme={theme} kind="title">Current mood: {DISCOVERY_MOODS.find(item=>item.id===sessionMood)!.label}</Copy><Action label={changeMood?'Keep this mood':'Change mood'} theme={theme} disabled={disabled} onPress={()=>setChangeMood(!changeMood)}/></>:null}
    {(!sessionMood||changeMood)&&<MoodChoices value={sessionMood} onChange={onMoodChange} theme={theme} disabled={disabled}/>}
    {!!sessionMood&&<Copy theme={theme} kind="muted">Add a priority if it matters here, then rate the options yourself.</Copy>}
    {moodDecisionPriorities(sessionMood).map(priority=><Action key={priority.id} label={`Use ${priority.label}`} theme={theme} disabled={disabled||draft.criteria.length>=5||draft.criteria.some(item=>item.label.trim().toLowerCase()===priority.label.toLowerCase())} onPress={()=>patch({basis:'criteria',criteria:[...draft.criteria,{...freshCriterion(priority.label),direction:priority.direction}]})}/>)}
   </Card>}
   {draft.basis==='journal'?<Copy theme={theme} kind="muted">Nudge can reflect on relevant experiences you have saved. If there is not enough evidence, it will leave the choice open.</Copy>:<>
    <Copy theme={theme} kind="muted">Use your own ratings or known measurements. Leave anything you do not know blank.</Copy>
    <Action label="Suggest criteria from my answers" busy={suggesting} theme={theme} disabled={disabled||suggesting} onPress={()=>void loadSuggestions()}/>
    {suggestions&&!suggestions.suggestions.length&&<Copy theme={theme} kind="muted">No relevant suggestion for this setting yet. Add what matters to you.</Copy>}
    {suggestions?.suggestions.map(suggestion=><Card key={suggestion.id} theme={theme}><Copy theme={theme} kind="title">{suggestion.label}</Copy><Copy theme={theme}>{suggestion.statement}</Copy><Copy theme={theme} kind="muted">Applies to: {suggestion.scope}. Review how it fits this choice.</Copy><Action label={`Use ${suggestion.label}`} theme={theme} disabled={disabled||draft.criteria.length>=5||draft.criteria.some(c=>c.discoverySuggestion?.id===suggestion.id)} onPress={()=>patch({criteria:[...draft.criteria,{...freshCriterion(suggestion.label),discoverySuggestion:{id:suggestion.id,generation:suggestions.generation}}]})}/></Card>)}
    {draft.criteria.map((criterion,index)=><Card key={criterion.id} theme={theme}>
     <DecisionField label={`Criterion ${index+1}`} value={criterion.label} onChange={label=>changeCriterion(index,{label,discoverySuggestion:undefined})} theme={theme}/>
     {labels.map(label=><View key={label} style={ui.smallStack}><DecisionField label={`${label} · ${criterion.unit||'value'}`} placeholder="Unknown" numeric value={criterion.values[label]?.value==null?'':String(criterion.values[label].value)} onChange={value=>changeCriterion(index,{values:{...criterion.values,[label]:{...criterion.values[label],value:value.trim()===''?null:Number(value)}}})} theme={theme} maxLength={20}/>
      {sources===criterion.id&&<><DecisionField label={`${label} source link (optional)`} value={criterion.values[label]?.sourceUrl??''} onChange={sourceUrl=>changeCriterion(index,{values:{...criterion.values,[label]:{...(criterion.values[label]??{value:null}),sourceUrl}}})} theme={theme} maxLength={2048}/><DecisionField label={`${label} note (optional)`} value={criterion.values[label]?.note??''} onChange={note=>changeCriterion(index,{values:{...criterion.values,[label]:{...(criterion.values[label]??{value:null}),note}}})} theme={theme} maxLength={500} multiline/></>}
     </View>)}
     <Copy theme={theme} kind="muted">{criterion.low}–{criterion.high} {criterion.unit} · {criterion.direction==='higher'?'Higher':'Lower'} suits you · Importance {criterion.weight}/5</Copy>
     <Action label={advanced===criterion.id?'Hide scale and importance':'Scale and importance'} theme={theme} disabled={disabled} onPress={()=>setAdvanced(advanced===criterion.id?null:criterion.id)}/>
     {advanced===criterion.id&&<View style={ui.stack}><DecisionField label="Unit" value={criterion.unit} onChange={unit=>changeCriterion(index,{unit})} theme={theme} maxLength={40}/><DecisionField label="Lowest possible value" numeric value={String(criterion.low)} onChange={value=>changeCriterion(index,{low:Number(value)})} theme={theme} maxLength={20}/><DecisionField label="Highest possible value" numeric value={String(criterion.high)} onChange={value=>changeCriterion(index,{high:Number(value)})} theme={theme} maxLength={20}/>
      <Action label="Higher values suit me" theme={theme} selected={criterion.direction==='higher'} disabled={disabled} onPress={()=>changeCriterion(index,{direction:'higher'})}/><Action label="Lower values suit me" theme={theme} selected={criterion.direction==='lower'} disabled={disabled} onPress={()=>changeCriterion(index,{direction:'lower'})}/>
      <Copy theme={theme}>Importance</Copy><View style={ui.row}>{[1,2,3,4,5].map(weight=><Action key={weight} label={String(weight)} theme={theme} selected={criterion.weight===weight} disabled={disabled} onPress={()=>changeCriterion(index,{weight})}/>)}</View>
     </View>}
     <Action label={sources===criterion.id?'Hide notes and sources':'Add notes or sources'} theme={theme} disabled={disabled} onPress={()=>setSources(sources===criterion.id?null:criterion.id)}/>
     <Action label="Remove criterion" theme={theme} disabled={disabled} onPress={()=>patch({criteria:draft.criteria.filter((_,i)=>i!==index)})}/>
    </Card>)}
    {draft.criteria.length<5&&<Action label="Add a criterion" theme={theme} disabled={disabled} onPress={()=>patch({criteria:[...draft.criteria,freshCriterion()]})}/>}
   </>}
  </>}
  {step===3&&<>
   <Copy theme={theme} kind="hero">Does this describe your choice?</Copy>
   <Action label={showTitle?'Hide title':'Add a title'} theme={theme} disabled={disabled} onPress={()=>setShowTitle(!showTitle)}/>
   {showTitle&&<DecisionField label="Title (optional)" value={draft.title} onChange={title=>patch({title})} theme={theme} maxLength={120}/>}
   <Card theme={theme}><Copy theme={theme} kind="title">{draft.domain}</Copy>{!!draft.goal&&<Copy theme={theme}>{draft.goal}</Copy>}{labels.map(label=><View key={label} style={ui.smallStack}><Copy theme={theme}>{label}</Copy>{!!draft.details[label]&&<Copy theme={theme} kind="muted">{draft.details[label]}</Copy>}</View>)}</Card>
   <Copy theme={theme}>{draft.basis==='criteria'?'Using your criteria and entered values. Unknowns stay unknown.':'Using relevant recorded experiences. Nudge has not verified facts about these options.'}</Copy>
   {draft.basis==='criteria'&&draft.criteria.map(c=><Card key={c.id} theme={theme}><Copy theme={theme} kind="title">{c.label}</Copy><Copy theme={theme} kind="muted">{c.low}–{c.high} {c.unit} · {c.direction} is better · Importance {c.weight}/5</Copy>{labels.map(label=><Copy key={label} theme={theme}>{label}: {c.values[label]?.value==null?'Unknown':c.values[label].value}{c.unit?' '+c.unit:''}</Copy>)}</Card>)}
   <DecisionField label="What do you expect to happen? (optional)" value={draft.expectedOutcome} onChange={expectedOutcome=>patch({expectedOutcome})} theme={theme} maxLength={300} multiline/>
  </>}
  {!!(localError||error)&&<Copy theme={theme} live>{localError||error}</Copy>}
  <Action label="Compare these options" theme={theme} primary disabled={disabled} onPress={()=>{try{onCreate(decisionInput(draft,randomUUID()));}catch(reason){setLocalError(reason instanceof Error?reason.message:'Review this decision first.');}}}/>
  {(step===0||step===1)&&<Action label={draft.basis==='criteria'?"Edit priorities & ratings":"Choose one priority"} theme={theme} disabled={disabled} onPress={()=>{setShowFullPriorities(false);patch({basis:'criteria'});onStepChange(2);onStageChange?.();}}/>}
  {step>=2&&<Action label="Back to options" theme={theme} disabled={disabled} onPress={back}/>}
 </View></FormDisabled.Provider>;
}
