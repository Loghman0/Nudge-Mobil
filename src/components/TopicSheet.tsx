import {useEffect,useState} from 'react';
import {StyleSheet,View,useWindowDimensions} from 'react-native';
import {DISCOVERY_DOMAINS,type DiscoveryDomain,type DiscoveryMood,type DiscoveryProfile} from '../discovery-api';
import {layout,type Theme} from '../theme';
import {Action,ActionMenu,Copy,ui} from './native-ui';
import {MoodChoices} from './MoodChoices';
const topicNames:Record<DiscoveryDomain,string>={rest:'Rest',time:'Time',values:'Values',relationships:'Relationships',work:'Work',learning:'Learning',money:'Money',food:'Food',culture:'Culture',play:'Play & humor',creativity:'Creativity',childhood:'Childhood',uncertainty:'Uncertainty',community:'Community',places:'Places',movement:'Movement',digital:'Digital life',future:'Goals'};
type Pace='light'|'curious'|'reflect';
type Section='mood'|'pace'|'topic';
export function TopicSheet({visible,topic,mode,mood,profile,theme,disabled,onClose,onApply}:{visible:boolean;topic:DiscoveryDomain|null;mode:Pace;mood:DiscoveryMood|null;profile:DiscoveryProfile;theme:Theme;disabled:boolean;onClose:()=>void;onApply:(topic:DiscoveryDomain|null,mode:Pace,mood:DiscoveryMood|null)=>void}){
 const [selection,setSelection]=useState(topic),[pace,setPace]=useState(mode),[feeling,setFeeling]=useState(mood),[section,setSection]=useState<Section>('mood');
 const {fontScale}=useWindowDimensions();
 // Snapshot the applied values on opening; a day change must not erase this draft.
 useEffect(()=>{if(visible){setSelection(topic);setPace(mode);setFeeling(mood);setSection('mood');}},[visible]);
 return <ActionMenu visible={visible} title="Question settings" theme={theme} onClose={()=>{if(!disabled)onClose();}} footer={<Action label="Show a question" theme={theme} primary disabled={disabled} onPress={()=>onApply(selection,pace,feeling)}/>}>
  <View style={ui.row}>{(['mood','pace','topic'] as const).map(value=><View key={value} style={fontScale>=1.5?styles.expandedSection:styles.section}><Action label={{mood:'Mood',pace:'Pace',topic:'Topic'}[value]} role="tab" theme={theme} selected={section===value} disabled={disabled} onPress={()=>setSection(value)}/></View>)}</View>
  {section==='mood'&&<>
   <Copy theme={theme} kind="title">How are you feeling?</Copy>
   <MoodChoices value={feeling} onChange={setFeeling} theme={theme} disabled={disabled}/>
  </>}
  {section==='pace'&&<><Copy theme={theme} kind="title">How much do you feel like doing?</Copy>{(['light','curious','reflect'] as const).map(value=><Action key={value} label={{light:'Light',curious:'Curious',reflect:'Deeper'}[value]} theme={theme} selected={pace===value} disabled={disabled} onPress={()=>setPace(value)}/>)}</>}
  {section==='topic'&&<><Copy theme={theme} kind="title">Pick a topic</Copy><View style={styles.choices}><View style={styles.twoColumns}><Action label="Any topic" theme={theme} selected={selection===null} disabled={disabled} onPress={()=>setSelection(null)}/></View>
   {DISCOVERY_DOMAINS.filter(domain=>!profile.settings.mutedTopics.includes(domain.id)&&(!domain.optional||profile.settings.optionalTopics&&profile.capabilities.optionalTopics)).map(domain=><View key={domain.id} style={styles.twoColumns}><Action label={topicNames[domain.id]} hint={domain.label} theme={theme} selected={selection===domain.id} disabled={disabled} onPress={()=>setSelection(domain.id)}/></View>)}
  </View></>}
 </ActionMenu>;
}
const styles=StyleSheet.create({section:{flex:1,minWidth:layout.target*1.5},expandedSection:{flexBasis:'48%',flexGrow:1,minWidth:layout.target*2},choices:{flexDirection:'row',flexWrap:'wrap',gap:layout.space.sm},twoColumns:{width:'48%'},threeColumns:{width:'31%'}});
