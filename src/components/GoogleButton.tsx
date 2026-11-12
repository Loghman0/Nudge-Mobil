import {ActivityIndicator,Image,Pressable,StyleSheet,Text,View,type StyleProp,type ViewStyle} from 'react-native';
import {layout,typography} from '../theme';

// Provider branding stays fixed instead of inheriting Nudge's blue accent.
const google={surface:'#ffffff',pressed:'#f2f2f2',text:'#1f1f1f',line:'#747775',disabled:'#8e918f'};
export function GoogleButton({label='Continue with Google',onPress,busy=false,disabled=false,hint,style}:{
 label?:string;onPress:()=>void;busy?:boolean;disabled?:boolean;hint?:string;style?:StyleProp<ViewStyle>;
}){
 const blocked=disabled||busy;
 return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint={hint}
  accessibilityState={{disabled:blocked,busy}} disabled={blocked} onPress={onPress}
  style={({pressed})=>[styles.button,{backgroundColor:pressed?google.pressed:google.surface,borderColor:blocked&&!busy?google.disabled:google.line},style]}>
  <View accessible={false} importantForAccessibility="no-hide-descendants" style={styles.iconSlot}>
   <Image source={require('../../assets/google-g.png')} resizeMode="contain" style={styles.icon} accessible={false}/>
  </View>
  <Text style={[styles.label,{color:blocked&&!busy?google.disabled:google.text}]}>{label}</Text>
  <View accessible={false} importantForAccessibility="no-hide-descendants" style={styles.status}>
   {busy?<ActivityIndicator color={google.text} size="small"/>:null}
  </View>
 </Pressable>;
}
const styles=StyleSheet.create({
 // Google's Android spacing: 12dp edges and 10dp between mark and label.
 button:{minHeight:layout.target,minWidth:layout.target,borderWidth:1,borderRadius:layout.radius.small,paddingHorizontal:12,paddingVertical:layout.space.sm,flexDirection:'row',alignItems:'center',gap:10},
 iconSlot:{width:20,height:24,alignItems:'center',justifyContent:'center',backgroundColor:google.surface},
 icon:{width:20,height:20.4},label:{...typography.button,fontWeight:'500',flex:1,textAlign:'center'},status:{width:20,alignItems:'center',justifyContent:'center'},
});
