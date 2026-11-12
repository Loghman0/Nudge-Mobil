import {useEffect,useState} from 'react';
import {BackHandler,TextInput,View} from 'react-native';
import type {DiscoveryFeedback,DiscoveryProfile,DiscoverySettings,SavedDiscoveryAnswer} from '../core/contracts';
import type {DiscoveryResponse} from '../core/types';
import {DISCOVERY_DOMAINS,discoveryDomainLabel} from '../core/taxonomy';
import {describeDiscoveryResponse,validateDiscoveryResponse} from '../core/validation';
import type {Theme} from '../theme';
import {Action,Card,Copy,ui} from './native-ui';
import {QuestionInput} from './QuestionInput';

const stateLabels={you_said:'You said',early_signal:'Early reflection',repeated_pattern:'Repeated pattern',mixed:'Mixed answers',user_confirmed:'Confirmed by you'};
interface Props{
 theme:Theme;profile:DiscoveryProfile;disabled:boolean;
 preferencesSignal?:number;
 onEdit:(answer:SavedDiscoveryAnswer,response:DiscoveryResponse)=>Promise<boolean>;
 onToggle:(answer:SavedDiscoveryAnswer)=>Promise<boolean>;
 onDelete:(answer:SavedDiscoveryAnswer)=>Promise<boolean>;
 onFeedback:(id:string,feedback:DiscoveryFeedback)=>Promise<boolean>;
 onSettings:(settings:DiscoverySettings)=>Promise<boolean>;
 onToday:()=>void;
 onExit?:()=>void;
}
export function ProfilePanel({theme,profile,disabled,preferencesSignal=0,onEdit,onToggle,onDelete,onFeedback,onSettings,onToday,onExit}:Props){
 const [showAnswers,setShowAnswers]=useState(false),[showSettings,setShowSettings]=useState(false),[evidence,setEvidence]=useState<string|null>(null);
 const [editing,setEditing]=useState<string|null>(null),[value,setValue]=useState<DiscoveryResponse|null>(null),[deleting,setDeleting]=useState<string|null>(null),[validationError,setValidationError]=useState('');
 const [answerPage,setAnswerPage]=useState(0),[insightPage,setInsightPage]=useState(0),[settings,setSettings]=useState(profile.settings);
 useEffect(()=>{if(preferencesSignal>0)setShowSettings(true);},[preferencesSignal]);
 useEffect(()=>{setSettings(profile.settings);},[profile.settings]);
 useEffect(()=>{setAnswerPage(page=>Math.min(page,Math.max(0,Math.ceil(profile.answers.length/10)-1)));setInsightPage(page=>Math.min(page,Math.max(0,profile.insights.length-1)));},[profile.answers.length,profile.insights.length]);
 useEffect(()=>{const listener=BackHandler.addEventListener('hardwareBackPress',()=>{
  if(disabled)return false;
  if(editing){setEditing(null);setValidationError('');return true;}
  if(deleting){setDeleting(null);return true;}
  if(evidence){setEvidence(null);return true;}
  if(showSettings){setShowSettings(false);return true;}
  if(showAnswers){setShowAnswers(false);return true;}
  if(onExit){onExit();return true;}return false;
 });return()=>listener.remove();},[disabled,editing,deleting,evidence,showSettings,showAnswers]);
 async function saveEdit(answer:SavedDiscoveryAnswer){
  const parsed=validateDiscoveryResponse(answer.question,value);
  if(!parsed.value){setValidationError(parsed.error??'Choose an answer or skip.');return;}
  if((parsed.value.kind==='text'||parsed.value.kind==='depends'&&!!parsed.value.context)&&!writtenAllowed){
   setValidationError('Written answers are unavailable. Choose a response below, or cancel.');return;
  }
  setValidationError('');if(await onEdit(answer,parsed.value))setEditing(null);
 }
 const writtenAllowed=profile.capabilities.writtenAnswers&&profile.settings.writtenAnswers;
 function startEdit(answer:SavedDiscoveryAnswer){setEditing(answer.id);setValue(answer.response);setValidationError('');setDeleting(null);}
 function editor(answer:SavedDiscoveryAnswer){return editing===answer.id&&<View style={ui.stack}>
  <QuestionInput question={answer.question} value={value} onChange={setValue} theme={theme} disabled={disabled} writtenAllowed={writtenAllowed}/>
  {value?.kind==='depends'&&writtenAllowed&&<>
   <Copy theme={theme}>When does it depend? (optional)</Copy>
   <TextInput accessibilityLabel="When does it depend?" editable={!disabled} multiline maxLength={140} value={value.context??''}
    onChangeText={context=>setValue({kind:'depends',context})} style={[ui.input,{color:theme.text,backgroundColor:theme.card,borderColor:theme.controlLine}]}/>
  </>}
  {!!validationError&&<Copy theme={theme} live>{validationError}</Copy>}
  <Action label="Save correction" theme={theme} primary disabled={disabled||!value} onPress={()=>void saveEdit(answer)}/>
  <Action label="Cancel correction" theme={theme} disabled={disabled} onPress={()=>{setEditing(null);setValidationError('');}}/>
 </View>;}
 return <View style={ui.stack}>
  {!showSettings&&<><Copy theme={theme} kind="hero">{showAnswers?'Your answers':'About you'}</Copy>
  {!showAnswers&&<>
  <Copy theme={theme} kind="muted">{profile.counts.answers} answers · {profile.counts.domains} areas explored</Copy>
  {!profile.insights.length&&<Card theme={theme}><Copy theme={theme}>No reflection to make yet. A few answers can be a place to start.</Copy><Action label="Try a question" theme={theme} disabled={disabled} onPress={onToday}/></Card>}
  {profile.insights.slice(insightPage,insightPage+1).map(insight=><Card key={insight.id} theme={theme}>
   <Copy theme={theme} kind="muted">{discoveryDomainLabel(insight.domain)} · {stateLabels[insight.state]}{insight.feedback==='not_me'?' · Excluded from suggestions':insight.feedback==='sometimes'?' · Context needed':''}</Copy>
   {insight.title!=='From your answers'&&<Copy theme={theme} kind="title">{insight.title}</Copy>}{(()=>{const source=profile.answers.find(answer=>insight.evidenceIds.includes(answer.id));return insight.statement.startsWith('For “')&&source?<View style={ui.smallStack}><Copy theme={theme} kind="muted">{source.question.prompt}</Copy><Copy theme={theme}>You chose “{describeDiscoveryResponse(source.question,source.response)}”.</Copy></View>:<Copy theme={theme}>{insight.statement}</Copy>;})()}
   {insight.state==='mixed'&&<Copy theme={theme} kind="muted">Your answers point in different directions. Nudge will ask for context instead of using this as a fixed preference.</Copy>}
   <Action label={evidence===insight.id?'Hide source answers':'See source answers'} theme={theme} disabled={disabled} onPress={()=>setEvidence(evidence===insight.id?null:insight.id)}/>
   {evidence===insight.id&&profile.answers.filter(answer=>insight.evidenceIds.includes(answer.id)).map(answer=><View key={answer.id} style={ui.smallStack}>
    <Copy theme={theme}>{answer.question.prompt}</Copy><Copy theme={theme} kind="muted">{describeDiscoveryResponse(answer.question,answer.response)}</Copy>
    {answer.response.kind==='depends'&&!!answer.response.context&&<Copy theme={theme}>{answer.response.context}</Copy>}
    <Copy theme={theme} kind="muted">{new Date(answer.answeredAt).toLocaleDateString()}</Copy>
    {!profile.suppressedQuestionIds.includes(answer.questionId)&&editing!==answer.id&&<Action label="Correct this answer" hint={answer.question.prompt} theme={theme} disabled={disabled} onPress={()=>startEdit(answer)}/>}
    {editor(answer)}
   </View>)}
   <View style={ui.row}>{(['fits','sometimes','not_me'] as const).map(feedback=><View key={feedback} style={{flex:1}}><Action label={{fits:'Fits me',sometimes:'At times',not_me:'Not me'}[feedback]} theme={theme}
    disabled={disabled} selected={insight.feedback===feedback} onPress={()=>void onFeedback(insight.id,feedback)}/></View>)}</View>
  </Card>)}
  {profile.insights.length>1&&<View style={ui.row}><Action label="Previous" theme={theme} disabled={disabled||insightPage===0} onPress={()=>{setInsightPage(page=>page-1);setEvidence(null);}}/><View style={{justifyContent:'center'}}><Copy theme={theme} kind="muted">{insightPage+1} of {profile.insights.length}</Copy></View><Action label="Next" hint="Next reflection" theme={theme} disabled={disabled||insightPage+1>=profile.insights.length} onPress={()=>{setInsightPage(page=>page+1);setEvidence(null);}}/></View>}</>}
  <Action label={`${showAnswers?'Hide':'Review'} your answers (${profile.answers.length})`} theme={theme} disabled={disabled} onPress={()=>setShowAnswers(!showAnswers)}/>
  {showAnswers&&<View style={ui.stack}>
   <Copy theme={theme} kind="muted">Exclude an answer to keep it in your history without using it in reflections. Delete removes it and its revisions.</Copy>
   {profile.answers.slice(answerPage*10,(answerPage+1)*10).map(answer=>{
    const forgotten=profile.suppressedQuestionIds.includes(answer.questionId);
    return <Card key={answer.id} theme={theme}>
     <Copy theme={theme}>{answer.question.prompt}</Copy><Copy theme={theme} kind="muted">{describeDiscoveryResponse(answer.question,answer.response)}{forgotten?' · Forgotten — not used in your profile':!answer.active?' · Excluded':''}</Copy>
     {!forgotten&&<>
      <Action label="Edit answer" theme={theme} disabled={disabled} hint={answer.question.prompt} onPress={()=>startEdit(answer)}/>
      <Action label={answer.active?'Exclude from profile':'Use in profile'} theme={theme} disabled={disabled} onPress={()=>void onToggle(answer)}/>
     </>}
     <Action label="Delete answer" theme={theme} disabled={disabled} hint={answer.question.prompt} onPress={()=>{setDeleting(answer.id);setEditing(null);}}/>
     {deleting===answer.id&&<View style={ui.stack}><Copy theme={theme}>Delete this answer and its history? This cannot be undone.</Copy>
      <Action label="Delete this answer permanently" theme={theme} primary disabled={disabled} onPress={()=>void onDelete(answer).then(saved=>{if(saved)setDeleting(null);})}/>
      <Action label="Keep it" theme={theme} disabled={disabled} onPress={()=>setDeleting(null)}/>
     </View>}
     {editor(answer)}
    </Card>;
   })}
   {profile.answers.length>10&&<View style={ui.smallStack}><Copy theme={theme} kind="muted">Answers {answerPage*10+1}–{Math.min((answerPage+1)*10,profile.answers.length)} of {profile.answers.length}</Copy><View style={ui.row}>
    <Action label="Previous answers" theme={theme} disabled={disabled||answerPage===0} onPress={()=>{setAnswerPage(page=>page-1);setEditing(null);setDeleting(null);}}/>
    <Action label="Next answers" theme={theme} disabled={disabled||(answerPage+1)*10>=profile.answers.length} onPress={()=>{setAnswerPage(page=>page+1);setEditing(null);setDeleting(null);}}/>
   </View></View>}
  </View>}
  <Action label={showSettings?'Hide question preferences':'Question preferences'} theme={theme} disabled={disabled} onPress={()=>setShowSettings(!showSettings)}/>
  </>}
  {showSettings&&<Action label="Back to About you" theme={theme} disabled={disabled} onPress={()=>setShowSettings(false)}/>}
  {showSettings&&<Card theme={theme}>
   <Copy theme={theme} kind="title">Question preferences</Copy>
   <Copy theme={theme}>How deep would you like to go?</Copy>
   {(['Easy and light','A little more context','Open to deeper questions'] as const).map((label,index)=><Action key={label} label={label} theme={theme} disabled={disabled} selected={settings.maxDepth===index} onPress={()=>setSettings({...settings,maxDepth:index as 0|1|2})}/>)}
   {profile.capabilities.optionalTopics&&<Action label="Include childhood and uncertainty" theme={theme} disabled={disabled} selected={settings.optionalTopics} onPress={()=>setSettings({...settings,optionalTopics:!settings.optionalTopics})}/>}
   {profile.capabilities.writtenAnswers&&<Action label="Include short written answers" theme={theme} disabled={disabled} selected={settings.writtenAnswers} onPress={()=>setSettings({...settings,writtenAnswers:!settings.writtenAnswers})}/>}
   <Action label="Share activity counts to improve Nudge" theme={theme} disabled={disabled} selected={settings.metricsEnabled} onPress={()=>setSettings({...settings,metricsEnabled:!settings.metricsEnabled})}/>
   <Copy theme={theme} kind="muted">Optional activity counts contain event names and times, never answer text. Turning this off deletes those counts.</Copy>
   <Copy theme={theme}>Topics to leave out</Copy>
   {DISCOVERY_DOMAINS.map(domain=><Action key={domain.id} label={domain.label} theme={theme} disabled={disabled} selected={settings.mutedTopics.includes(domain.id)} onPress={()=>setSettings({...settings,mutedTopics:settings.mutedTopics.includes(domain.id)?settings.mutedTopics.filter(id=>id!==domain.id):[...settings.mutedTopics,domain.id]})}/>)}
   <Action label="Save question preferences" theme={theme} primary disabled={disabled} onPress={()=>void onSettings({...settings,writtenAnswers:settings.writtenAnswers&&profile.capabilities.writtenAnswers,optionalTopics:settings.optionalTopics&&profile.capabilities.optionalTopics})}/>
  </Card>}
 </View>;
}
