import {useEffect} from 'react';
import {AccessibilityInfo,TextInput,View} from 'react-native';
import type {DiscoveryQuestion,DiscoveryResponse} from '../core/types';
import {describeDiscoveryResponse} from '../core/validation';
import type {Theme} from '../theme';
import {Action,Copy,ui} from './native-ui';

export function QuestionInput({question,value,onChange,theme,disabled=false,writtenAllowed=true,includeSkip=true,submitOnTap=false}:{question:DiscoveryQuestion;value:DiscoveryResponse|null;onChange:(value:DiscoveryResponse)=>void;theme:Theme;disabled?:boolean;writtenAllowed?:boolean;includeSkip?:boolean;submitOnTap?:boolean}){
 useEffect(()=>{AccessibilityInfo.announceForAccessibility(question.prompt);},[question.id,question.version,question.prompt]);
 const groups=value?.kind==='ranking'?value.groups:[];
 function rank(id:string){
  const without=groups.map(group=>group.filter(item=>item!==id)).filter(group=>group.length);
  onChange({kind:'ranking',groups:groups.flat().includes(id)?without:[...without,[id]]});
 }
 return <View style={ui.smallStack}>
  <Copy theme={theme} kind="title">{question.prompt}</Copy>
  {question.format==='choice'&&question.choices?.map(choice=><Action key={choice.id} label={choice.label} theme={theme} disabled={disabled}
   hint={submitOnTap?'Saves this answer and opens the next question.':undefined} selected={value?.kind==='choice'&&value.optionId===choice.id} onPress={()=>onChange({kind:'choice',optionId:choice.id})}/>)}
  {question.format==='scale'&&question.scale&&<View style={ui.stack}>
   <Copy theme={theme} kind="muted">{question.scale.min}: {question.scale.minLabel}{'\n'}{question.scale.max}: {question.scale.maxLabel}</Copy>
   <View style={ui.row}>{Array.from({length:Math.floor((question.scale.max-question.scale.min)/question.scale.step)+1},(_,index)=>question.scale!.min+index*question.scale!.step).map(point=><Action key={point} label={String(point)} hint={submitOnTap?`Saves ${point} on this scale and opens the next question.`:`Choose ${point} on this scale`} theme={theme} disabled={disabled}
    selected={value?.kind==='scale'&&value.value===point} onPress={()=>onChange({kind:'scale',value:point})}/>)}</View>
  </View>}
  {question.format==='ranking'&&<View style={ui.stack}>
   <Copy theme={theme} kind="muted">Tap in your preferred order. Tap again to remove.</Copy>
   {question.choices?.map(choice=>{const index=groups.findIndex(group=>group.includes(choice.id));return <Action key={choice.id} label={`${index>=0?`${index+1}. `:''}${choice.label}`} theme={theme} disabled={disabled} selected={index>=0} onPress={()=>rank(choice.id)}/>;})}
   {question.ranking?.allowTies&&groups.length>1&&<Action label="Tie the last two places" theme={theme} disabled={disabled} onPress={()=>onChange({kind:'ranking',groups:[...groups.slice(0,-2),[...groups[groups.length-2],...groups[groups.length-1]]]})}/>}
   <Copy theme={theme} kind="muted" live>{groups.length?describeDiscoveryResponse(question,{kind:'ranking',groups}):'No order selected'}</Copy>
  </View>}
  {question.format==='text'&&writtenAllowed&&<View style={ui.smallStack}>
   <Copy theme={theme}>A few words are enough</Copy>
   <TextInput accessibilityLabel="Your answer, up to 140 characters" editable={!disabled} multiline maxLength={140} value={value?.kind==='text'?value.text:''}
    onChangeText={text=>onChange({kind:'text',text})} style={[ui.input,{color:theme.text,backgroundColor:theme.card,borderColor:theme.controlLine}]} />
   <Copy theme={theme} kind="muted">Written answers do not create personality labels.</Copy>
  </View>}
  {question.format==='text'&&!writtenAllowed&&<Copy theme={theme} kind="muted">Written answers are currently unavailable. You can choose a response below, or cancel this correction.</Copy>}
  <View style={ui.row}>{question.allowedResponses.filter(kind=>includeSkip||kind!=='skip').map(kind=><View key={kind} style={{flexGrow:1,flexBasis:120}}><Action theme={theme} disabled={disabled}
   label={kind==='skip'?'Skip':describeDiscoveryResponse(question,{kind})} hint={submitOnTap?'Saves this response and opens the next question.':undefined} selected={value?.kind===kind} onPress={()=>onChange({kind})}/></View>)}</View>
 </View>;
}
