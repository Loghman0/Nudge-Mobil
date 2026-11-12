import {useEffect,useState} from 'react';
import {BackHandler,View} from 'react-native';
import type {DiscoveryProfile,SavedDiscoveryAnswer} from '../core/contracts';
import type {DiscoveryResponse} from '../core/types';
import {describeDiscoveryResponse,validateDiscoveryResponse} from '../core/validation';
import type {Theme} from '../theme';
import {Action,Card,Copy,ui} from './native-ui';
import {QuestionInput} from './QuestionInput';

export function RecentAnswers({profile,theme,disabled,onEdit,onDelete}:{profile:DiscoveryProfile;theme:Theme;disabled:boolean;onEdit:(answer:SavedDiscoveryAnswer,response:DiscoveryResponse)=>Promise<boolean>;onDelete:(answer:SavedDiscoveryAnswer)=>Promise<boolean>}){
 const [editing,setEditing]=useState<string|null>(null),[deleting,setDeleting]=useState<string|null>(null),[value,setValue]=useState<DiscoveryResponse|null>(null),[error,setError]=useState('');
 const answers=[...profile.answers].sort((a,b)=>Date.parse(b.answeredAt)-Date.parse(a.answeredAt)).slice(0,5);
 useEffect(()=>{const listener=BackHandler.addEventListener('hardwareBackPress',()=>{if(disabled)return false;if(editing||deleting){setEditing(null);setDeleting(null);setError('');return true;}return false;});return()=>listener.remove();},[disabled,editing,deleting]);
 async function save(answer:SavedDiscoveryAnswer){const parsed=validateDiscoveryResponse(answer.question,value);if(!parsed.value){setError(parsed.error??'Choose an answer.');return;}if(parsed.value.kind==='text'&&(!profile.capabilities.writtenAnswers||!profile.settings.writtenAnswers)){setError('Written answers are unavailable. Choose another response.');return;}setError('');if(await onEdit(answer,parsed.value))setEditing(null);}
 return <View style={ui.stack}><Copy theme={theme} kind="hero">Recent answers</Copy>{!answers.length&&<Copy theme={theme}>Your next saved answer will appear here.</Copy>}
 {answers.map(answer=><Card key={answer.id} theme={theme}>
  {editing!==answer.id&&<><Copy theme={theme}>{answer.question.prompt}</Copy><Copy theme={theme} kind="muted">{describeDiscoveryResponse(answer.question,answer.response)}</Copy></>}
  {editing===answer.id?<><QuestionInput question={answer.question} value={value} onChange={setValue} theme={theme} disabled={disabled} writtenAllowed={profile.capabilities.writtenAnswers&&profile.settings.writtenAnswers}/>{!!error&&<Copy theme={theme} live>{error}</Copy>}<Action label="Save correction" theme={theme} primary disabled={disabled||!value} onPress={()=>void save(answer)}/><Action label="Cancel" theme={theme} disabled={disabled} onPress={()=>{setEditing(null);setError('');}}/></>:deleting===answer.id?<><Copy theme={theme}>Delete this answer and its history?</Copy><Action label="Delete permanently" theme={theme} primary disabled={disabled} onPress={()=>void onDelete(answer).then(saved=>{if(saved)setDeleting(null);})}/><Action label="Keep answer" theme={theme} disabled={disabled} onPress={()=>setDeleting(null)}/></>:<View style={ui.row}>
   {!profile.suppressedQuestionIds.includes(answer.questionId)&&<Action label="Change answer" hint={answer.question.prompt} theme={theme} disabled={disabled} onPress={()=>{setEditing(answer.id);setValue(answer.response);setError('');}}/>}<Action label="Delete" hint={answer.question.prompt} theme={theme} disabled={disabled} onPress={()=>setDeleting(answer.id)}/>
  </View>}
 </Card>)}</View>;
}
