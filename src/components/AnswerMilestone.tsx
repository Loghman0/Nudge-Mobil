import {useEffect,useRef,useState} from 'react';
import {Animated,StyleSheet,Text,View} from 'react-native';
import {secureStorage} from '../secure-storage';
import {nextMilestone} from '../milestones';
import {layout,typography,type Theme} from '../theme';
import {useReducedMotion} from './motion';
import {useFeedback} from '../feedback';

export function AnswerMilestone({userId,count,theme}:{userId:string;count:number;theme:Theme}){
 const [milestone,setMilestone]=useState<number|null>(null),high=useRef<number|null>(null),latest=useRef(count),opacity=useRef(new Animated.Value(0)).current,reduced=useReducedMotion(),{play}=useFeedback();latest.current=count;
 useEffect(()=>{let active=true;const key='nudge.milestones.v1.'+userId;void secureStorage.getItem(key).then(raw=>{if(!active)return;const old=Number(raw),base=Math.max(latest.current,raw&&Number.isSafeInteger(old)&&old>=0?old:0);high.current=base;return secureStorage.setItem(key,String(base));}).catch(()=>{if(active)high.current=latest.current;});return()=>{active=false;high.current=null;};},[userId]);
 useEffect(()=>{if(high.current===null||count<=high.current)return;const found=nextMilestone(high.current,count);high.current=count;void secureStorage.setItem('nudge.milestones.v1.'+userId,String(count)).catch(()=>{});if(found){setMilestone(found);play('saved');}},[count,userId,play]);
 useEffect(()=>{if(!milestone)return;opacity.setValue(reduced?1:0);const animation=Animated.timing(opacity,{toValue:1,duration:reduced?0:160,useNativeDriver:true});animation.start();const timer=setTimeout(()=>setMilestone(null),2800);return()=>{animation.stop();clearTimeout(timer);};},[milestone,reduced,opacity]);
 if(!milestone)return null;
 return <Animated.View pointerEvents="none" style={[styles.toast,{backgroundColor:theme.selection,opacity}]}><Text accessible={false} style={{fontSize:22}}>🌱</Text><View style={{flexShrink:1}}><Text accessibilityLiveRegion="polite" style={[typography.button,{color:theme.text}]}>{milestone} answers saved</Text></View></Animated.View>;
}
const styles=StyleSheet.create({toast:{position:'absolute',bottom:layout.space.lg,alignSelf:'center',maxWidth:layout.maxWidth,marginHorizontal:layout.space.lg,borderRadius:layout.radius.small,padding:layout.space.md,flexDirection:'row',alignItems:'center',gap:layout.space.sm,elevation:2}});
