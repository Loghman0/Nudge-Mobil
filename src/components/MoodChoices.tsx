import {StyleSheet,View} from 'react-native';
import {DISCOVERY_MOODS,type DiscoveryMood} from '../discovery-api';
import {layout,type Theme} from '../theme';
import {Action,Copy} from './native-ui';
export function MoodChoices({value,onChange,theme,disabled=false}:{value:DiscoveryMood|null;onChange:(mood:DiscoveryMood|null)=>void;theme:Theme;disabled?:boolean}){
 const selected=DISCOVERY_MOODS.find(item=>item.id===value);
 return <><Action label="No preference" theme={theme} selected={value===null} disabled={disabled} onPress={()=>onChange(null)}/><View style={styles.choices}>{DISCOVERY_MOODS.map(item=><View key={item.id} style={styles.twoColumns}><Action label={item.label} theme={theme} selected={value===item.id} disabled={disabled} onPress={()=>onChange(item.id)}/></View>)}</View>{selected&&<Copy theme={theme} kind="muted">{selected.hint}</Copy>}</>;
}
const styles=StyleSheet.create({choices:{flexDirection:'row',flexWrap:'wrap',gap:layout.space.sm},twoColumns:{width:'48%'}});
