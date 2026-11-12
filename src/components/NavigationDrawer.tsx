import {useEffect,useRef} from 'react';
import {AccessibilityInfo,Animated,Modal,Pressable,ScrollView,StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {layout,typography,type Theme} from '../theme';
import {useReducedMotion} from './motion';
import {useFeedback} from '../feedback';

export type NativePage='today'|'about'|'decide'|'journal'|'recent'|'tools'|'account';
const destinations:readonly {id:NativePage;label:string;symbol:string}[]=[
 {id:'today',label:'Today',symbol:'☀'},{id:'about',label:'About you',symbol:'◎'},
 {id:'decide',label:'Decide',symbol:'⇄'},{id:'journal',label:'Journal',symbol:'▤'},
 {id:'recent',label:'Recent answers',symbol:'↺'},{id:'tools',label:'Tools',symbol:'◇'},
 {id:'account',label:'Account',symbol:'⚙'},
];
export function NavigationDrawer({visible,value,theme,onClose,onChange}:{visible:boolean;value:NativePage;theme:Theme;onClose:()=>void;onChange:(page:NativePage)=>void}){
 const reduced=useReducedMotion(),progress=useRef(new Animated.Value(0)).current,{width}=useWindowDimensions();
 const {play}=useFeedback();
 const panelWidth=Math.min(width*.88,360);
 useEffect(()=>{progress.stopAnimation();if(!visible){progress.setValue(0);return;}if(reduced){progress.setValue(1);return;}const animation=Animated.timing(progress,{toValue:1,duration:200,useNativeDriver:true});animation.start();return()=>animation.stop();},[visible,reduced,progress]);
 function close(page?:NativePage){play();const finish=()=>{onClose();if(page)onChange(page);};if(reduced){finish();return;}Animated.timing(progress,{toValue:0,duration:140,useNativeDriver:true}).start(({finished})=>{if(finished)finish();});}
 return <Modal visible={visible} transparent animationType="none" onRequestClose={()=>close()} onShow={()=>AccessibilityInfo.announceForAccessibility('Nudge menu')}>
  <View style={styles.overlay} accessibilityViewIsModal>
   <Animated.View style={[StyleSheet.absoluteFill,{backgroundColor:theme.scrim,opacity:progress}]}><Pressable accessibilityRole="button" accessibilityLabel="Close menu" style={{flex:1}} onPress={()=>close()}/></Animated.View>
   <Animated.View style={{width:panelWidth,height:'100%',backgroundColor:theme.surface,transform:[{translateX:progress.interpolate({inputRange:[0,1],outputRange:[panelWidth,0]})}]}}>
    <SafeAreaView edges={['top','right','bottom']} style={styles.panel}>
     <View style={styles.heading}><Text accessibilityRole="header" style={[typography.title,{color:theme.text,flex:1}]}>Nudge</Text><Pressable accessibilityRole="button" accessibilityLabel="Close menu" onPress={()=>close()} style={({pressed})=>[styles.close,{backgroundColor:pressed?theme.selection:theme.surface}]}><Text accessible={false} style={[typography.title,{color:theme.text}]}>×</Text></Pressable></View>
     <ScrollView contentContainerStyle={{gap:layout.space.xs}}>
      {destinations.map(item=><Pressable key={item.id} accessibilityRole="button" accessibilityState={{selected:value===item.id}} onPress={()=>close(item.id)} style={({pressed})=>[styles.destination,{backgroundColor:pressed||value===item.id?theme.selection:theme.surface}]}>
       <Text accessible={false} style={[styles.symbol,{color:theme.accent}]}>{item.symbol}</Text><Text style={[typography.button,{color:theme.text,flex:1}]}>{item.label}</Text>{value===item.id&&<Text accessible={false} style={{color:theme.accent}}>●</Text>}
      </Pressable>)}
     </ScrollView>
    </SafeAreaView>
   </Animated.View>
  </View>
 </Modal>;
}
const styles=StyleSheet.create({overlay:{flex:1,alignItems:'flex-end'},panel:{flex:1,padding:layout.space.md,gap:layout.space.lg},heading:{flexDirection:'row',alignItems:'center'},close:{minHeight:layout.target,minWidth:layout.target,alignItems:'center',justifyContent:'center',borderRadius:layout.radius.small},destination:{minHeight:56,padding:layout.space.md,borderRadius:layout.radius.small,flexDirection:'row',alignItems:'center',gap:layout.space.md},symbol:{...typography.title,width:28,textAlign:'center'}});
