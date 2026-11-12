import {useRef,type ReactNode} from 'react';
import {AccessibilityInfo,ActivityIndicator,Animated,Modal,Pressable,ScrollView,StyleSheet,Text,View,useWindowDimensions,type StyleProp,type ViewStyle} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {layout,typography,type Theme} from '../theme';
import {useReducedMotion} from './motion';
import {useFeedback} from '../feedback';

export function Action({label,onPress,theme,primary=false,disabled=false,busy=false,selected,hint,role='button',style}:{
 label:string;onPress:()=>void;theme:Theme;primary?:boolean;disabled?:boolean;busy?:boolean;selected?:boolean;hint?:string;role?:'button'|'tab';style?:StyleProp<ViewStyle>;
}){
 const {fontScale}=useWindowDimensions();
 const reduced=useReducedMotion(),scale=useRef(new Animated.Value(1)).current,{play}=useFeedback();
 const press=(toValue:number)=>{scale.stopAnimation();if(reduced){scale.setValue(1);return;}Animated.timing(scale,{toValue,duration:toValue===1?110:65,useNativeDriver:true}).start();};
 return <Animated.View style={[style,{transform:[{scale}]}]}><Pressable accessibilityRole={role} accessibilityLabel={label} accessibilityHint={hint}
  accessibilityState={{disabled:disabled||busy,busy,...(selected===undefined?{}:{selected})}} disabled={disabled||busy} onPress={()=>{play();onPress();}} onPressIn={()=>press(.98)} onPressOut={()=>press(1)}
  style={({pressed})=>[ui.action,{paddingHorizontal:fontScale>=1.5?layout.space.sm:layout.space.md,backgroundColor:primary?theme.accent:pressed||selected?theme.selection:theme.card,
   borderColor:primary||selected?theme.accent:theme.controlLine,opacity:disabled&&!busy?0.45:pressed?0.85:1}]}>
  <Text style={[ui.actionText,{color:primary?theme.onAccent:theme.text}]}>{label}</Text>
  {busy?<ActivityIndicator accessible={false} color={primary?theme.onAccent:theme.accent}/>:selected?<Text accessible={false} style={[ui.check,{color:theme.accent}]}>✓</Text>:null}
 </Pressable></Animated.View>;
}
export function Copy({children,theme,kind='body',live=false}:{children:ReactNode;theme:Theme;kind?:'body'|'muted'|'title'|'hero';live?:boolean}){
 return <Text accessibilityRole={kind==='title'||kind==='hero'?'header':undefined} accessibilityLiveRegion={live?'polite':undefined}
  style={[kind==='hero'?ui.hero:kind==='title'?ui.title:ui.copy,{color:kind==='muted'?theme.muted:theme.text}]}>{children}</Text>;
}
export function Card({children,theme}:{children:ReactNode;theme:Theme}){
 return <View style={[ui.card,{backgroundColor:theme.card,borderColor:theme.line}]}>{children}</View>;
}
export function LoadingCard({label,theme}:{label:string;theme:Theme}){
 return <Card theme={theme}><View accessibilityState={{busy:true}}><Copy theme={theme} live>{label}</Copy></View><View accessible={false} style={ui.stack}>
  {[100,80,60].map(width=><View key={width} style={{height:16,width:`${width}%`,borderRadius:layout.radius.small,backgroundColor:theme.selection}}/>)}
 </View></Card>;
}
export function ActionMenu({visible,title,theme,onClose,onShown,children,footer}:{visible:boolean;title:string;theme:Theme;onClose:()=>void;onShown?:()=>void;children:ReactNode;footer?:ReactNode}){
 return <Modal transparent visible={visible} animationType="none" onRequestClose={onClose} onShow={()=>{AccessibilityInfo.announceForAccessibility(title);onShown?.();}}><View style={[ui.menuOverlay,{backgroundColor:theme.scrim}]}><SafeAreaView edges={['bottom','left','right']} accessibilityViewIsModal style={[ui.menuSheet,{backgroundColor:theme.surface}]}><View style={ui.row}><View style={{flex:1,justifyContent:'center'}}><Copy theme={theme} kind="title">{title}</Copy></View><Action label="Close" theme={theme} onPress={onClose}/></View><ScrollView style={{flexShrink:1}} contentContainerStyle={ui.smallStack}>{children}</ScrollView>{footer?<View style={ui.smallStack}>{footer}</View>:null}</SafeAreaView></View></Modal>;
}
export const ui=StyleSheet.create({
 stack:{gap:layout.space.md},smallStack:{gap:layout.space.sm},row:{flexDirection:'row',flexWrap:'wrap',gap:layout.space.sm},
 action:{minHeight:layout.target,minWidth:layout.target,borderWidth:1,borderRadius:layout.radius.small,paddingHorizontal:layout.space.md,paddingVertical:layout.space.sm,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:layout.space.sm},
 actionText:{...typography.button,flexShrink:1},check:typography.check,
 copy:typography.body,title:typography.title,hero:typography.hero,
 card:{padding:layout.space.md,borderWidth:1,borderRadius:layout.radius.card,gap:layout.space.md},
 input:{...typography.body,borderWidth:1,borderRadius:layout.radius.small,padding:layout.space.md,minHeight:layout.target,textAlignVertical:'top'},
 menuOverlay:{flex:1,justifyContent:'flex-end',alignItems:'center'},menuSheet:{width:'100%',maxWidth:layout.maxWidth,maxHeight:'90%',borderTopLeftRadius:layout.radius.card,borderTopRightRadius:layout.radius.card,padding:layout.space.md,gap:layout.space.md},
});
