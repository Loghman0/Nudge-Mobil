import {Pressable,StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import {layout,typography,type Theme} from '../theme';
export type NativeTab='today'|'about'|'decide'|'tools'|'account';
const labels:Record<NativeTab,string>={today:'Today',about:'About you',decide:'Decide',tools:'Tools',account:'Account'};
export function NativeTabs({value,onChange,theme}:{value:NativeTab;onChange:(tab:NativeTab)=>void;theme:Theme}){
 const {fontScale,width}=useWindowDimensions();
 const expanded=fontScale>=1.5||width<330;
 return <View accessibilityRole="tablist" style={[styles.bar,expanded&&styles.expandedBar,{backgroundColor:theme.surface,borderColor:theme.line}]}>{(Object.keys(labels) as NativeTab[]).map(tab=><Pressable key={tab}
  accessibilityRole="tab" accessibilityLabel={labels[tab]} accessibilityState={{selected:value===tab}} onPress={()=>onChange(tab)}
  style={({pressed})=>[styles.tab,expanded&&styles.expandedTab,{backgroundColor:pressed||value===tab?theme.selection:theme.surface,borderColor:value===tab?theme.accent:theme.surface,opacity:pressed?0.75:1}]}>
  <Text style={[styles.text,{color:value===tab?theme.accent:theme.text,fontWeight:value===tab?'700':'500'}]}>{tab==='about'?'You':labels[tab]}</Text>
 </Pressable>)}</View>;
}
const styles=StyleSheet.create({bar:{flexDirection:'row',gap:layout.space.sm,paddingHorizontal:layout.space.sm,paddingVertical:layout.space.sm,borderTopWidth:1},expandedBar:{flexWrap:'wrap'},expandedTab:{flex:0,flexBasis:'28%',flexGrow:1,minWidth:layout.target*2},tab:{flex:1,minHeight:layout.target,borderWidth:1,borderRadius:layout.radius.small,paddingHorizontal:layout.space.xs,paddingVertical:layout.space.sm,justifyContent:'center',alignItems:'center'},text:{...typography.tab,textAlign:'center',flexShrink:1}});
