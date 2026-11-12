import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {AppState} from 'react-native';
import {setAudioModeAsync,useAudioPlayer} from 'expo-audio';
import * as Haptics from 'expo-haptics';
import {secureStorage} from './secure-storage';

type Preferences={sound:boolean;touch:boolean};
const initial:Preferences={sound:true,touch:true};
const key='nudge.feedback.v1';
const FeedbackContext=createContext({preferences:initial,error:'',play:(_kind:'tap'|'saved'='tap')=>{},setPreference:async(_name:keyof Preferences,_enabled:boolean)=>{}});
export const useFeedback=()=>useContext(FeedbackContext);
/** Two short mechanical mouse samples. No synthesized tones, streams, recording or background audio. */
export function FeedbackProvider({children}:{children:ReactNode}){
 const click=useAudioPlayer(require('../assets/sounds/mouseclick1.ogg'));
 const release=useAudioPlayer(require('../assets/sounds/mouserelease1.ogg'));
 const [preferences,setPreferences]=useState(initial),[error,setError]=useState('');
 const preferencesRef=useRef(initial),active=useRef(AppState.currentState==='active'),alive=useRef(true),last=useRef(0),audioReady=useRef(false),generation=useRef(0),writes=useRef(Promise.resolve());
 useEffect(()=>{alive.current=true;void secureStorage.getItem(key).then(raw=>{if(!alive.current||!raw)return;try{const v=JSON.parse(raw);if(typeof v.sound==='boolean'&&typeof v.touch==='boolean'){preferencesRef.current=v;setPreferences(v);}}catch{/* Keep defaults if an old preference is unreadable. */}}).catch(()=>{});
  void setAudioModeAsync({playsInSilentMode:false,interruptionMode:'mixWithOthers',allowsRecording:false,shouldPlayInBackground:false}).then(()=>{audioReady.current=true;}).catch(()=>{});
  const listener=AppState.addEventListener('change',state=>{active.current=state==='active';generation.current++;if(!active.current){click.pause();release.pause();}});
  return()=>{alive.current=false;generation.current++;listener.remove();};
 },[click,release]);
 const play=useCallback((kind:'tap'|'saved'='tap')=>{
  if(!active.current||!alive.current||Date.now()-last.current<100)return;last.current=Date.now();
  if(preferencesRef.current.touch)void Haptics.selectionAsync().catch(()=>{});
  if(!preferencesRef.current.sound||!audioReady.current)return;
  const player=kind==='saved'?release:click,stamp=generation.current;player.volume=.20;
  void player.seekTo(0).then(()=>{if(alive.current&&active.current&&preferencesRef.current.sound&&stamp===generation.current)player.play();}).catch(()=>{});
 },[click,release]);
 async function setPreference(name:keyof Preferences,enabled:boolean){
  const next={...preferencesRef.current,[name]:enabled};preferencesRef.current=next;setPreferences(next);generation.current++;
  if(!next.sound){click.pause();release.pause();}
  const write=writes.current.catch(()=>{}).then(()=>secureStorage.setItem(key,JSON.stringify(next)));writes.current=write;
  try{await write;if(alive.current)setError('');}catch{if(alive.current)setError('Could not keep this preference. Try again.');}
 }
 return <FeedbackContext.Provider value={{preferences,error,play,setPreference}}>{children}</FeedbackContext.Provider>;
}
