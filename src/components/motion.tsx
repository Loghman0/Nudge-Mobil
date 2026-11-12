import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {AccessibilityInfo,Animated} from 'react-native';

const MotionContext=createContext(true);
export const useReducedMotion=()=>useContext(MotionContext);
export function MotionProvider({children}:{children:ReactNode}){
 const [reduced,setReduced]=useState(true);
 useEffect(()=>{let active=true;void AccessibilityInfo.isReduceMotionEnabled().then(value=>{if(active)setReduced(value);}).catch(()=>{});const listener=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);return()=>{active=false;listener.remove();};},[]);
 return <MotionContext.Provider value={reduced}>{children}</MotionContext.Provider>;
}
/** Short response to an explicit navigation action, never a looping decoration. */
export function ScreenTransition({identity,children}:{identity:string;children:ReactNode}){
 const reduced=useReducedMotion(),opacity=useRef(new Animated.Value(1)).current;
 useEffect(()=>{opacity.stopAnimation();if(reduced){opacity.setValue(1);return;}opacity.setValue(.45);const animation=Animated.timing(opacity,{toValue:1,duration:150,useNativeDriver:true});animation.start();return()=>animation.stop();},[identity,reduced,opacity]);
 return <Animated.View style={{flex:1,opacity}}>{children}</Animated.View>;
}
