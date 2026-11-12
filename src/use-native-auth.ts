import 'react-native-url-polyfill/auto';
import {useEffect,useRef,useState} from 'react';
import {AppState,Linking} from 'react-native';
import {createClient,type Session} from '@supabase/supabase-js';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import {secureStorage} from './secure-storage';
import {publicConfig} from './public-config';
import {googleAuthorizeUrl,NATIVE_CALLBACK,parsePendingAuth,readAuthCallback} from './auth-protocol';
import {consumeDeviceTestSession} from './testing/device-session';
const STORAGE_KEY='nudge.auth.session.v1',PENDING_KEY='nudge.auth.pending.v1',VERIFIER_KEY=STORAGE_KEY+'-code-verifier';
const boundedFetch:typeof fetch=async(input,init)=>{
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
 try{return await fetch(input,{...init,signal:controller.signal});}finally{clearTimeout(timer);}
};
const client=createClient(publicConfig.supabaseUrl,publicConfig.supabaseAnonKey,{
 auth:{storage:secureStorage,storageKey:STORAGE_KEY,persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,flowType:'pkce'},
 global:{fetch:boundedFetch},
});
async function clearAttempt(){await secureStorage.removeItem(PENDING_KEY);await secureStorage.removeItem(VERIFIER_KEY);}
export function useNativeAuth(){
 const [session,setSession]=useState<Session|null>(null),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const mounted=useRef(false),epoch=useRef(0),opening=useRef(false),exchanging=useRef<Promise<void>|null>(null);
 const signingOut=useRef(false);
 const sessionUser=useRef<string|null>(null);
 useEffect(()=>{
  mounted.current=true;
  const initialEpoch=epoch.current;
  const subscription=client.auth.onAuthStateChange((_event,value)=>{sessionUser.current=value?.user.id??null;if(mounted.current&&!signingOut.current)setSession(value);});
  void (async()=>{
   if(__DEV__&&process.env.EXPO_PUBLIC_NATIVE_TEST_HARNESS==='1')await consumeDeviceTestSession(client);
   return client.auth.getSession();
  })().then(({data,error:failure})=>{if(mounted.current&&!signingOut.current&&epoch.current===initialEpoch){if(failure)setError('Could not restore sign-in. Try signing in again.');else {sessionUser.current=data.session?.user.id??null;setSession(data.session);}}}).catch(()=>{if(mounted.current)setError('Device storage is unavailable. Unlock your device and reopen Nudge.');}).finally(()=>{if(mounted.current)setReady(true);});
  const update=(state:string|null|undefined)=>{if(state==='active')client.auth.startAutoRefresh();else client.auth.stopAutoRefresh();};update(AppState.currentState);
  const app=AppState.addEventListener('change',update);
  const links=Linking.addEventListener('url',({url})=>{void handleCallback(url);});
  void Linking.getInitialURL().then(url=>{if(url)void handleCallback(url);}).catch(()=>{});
  return()=>{mounted.current=false;epoch.current++;subscription.data.subscription.unsubscribe();app.remove();links.remove();client.auth.stopAutoRefresh();};
 },[]);
 async function handleCallback(url:string):Promise<void>{
  const callback=readAuthCallback(url);if(!callback||signingOut.current)return;
  if(exchanging.current)return exchanging.current;
  const currentEpoch=epoch.current;
  const task=(async()=>{
   const pending=parsePendingAuth(await secureStorage.getItem(PENDING_KEY));
   if(!pending)return;
   if(mounted.current){setBusy(true);setError('');}
   if('cancelled' in callback){await clearAttempt();return;}
   try{
    // The library reads the verifier from the encrypted storage. No implicit tokens accepted.
    const {error:failure}=await client.auth.exchangeCodeForSession(callback.code);
    if(failure)throw failure;
    await clearAttempt();
   }catch{
    await clearAttempt();
    if(mounted.current&&epoch.current===currentEpoch)setError('Sign-in did not finish. Try Continue with Google again. Your preview is still here.');
   }
  })().catch(()=>{if(mounted.current)setError('Could not use secure device storage. Unlock your device and try again.');}).finally(()=>{exchanging.current=null;if(mounted.current){setBusy(false);opening.current=false;}});
  exchanging.current=task;return task;
 }
 async function signIn(){
  if(opening.current||exchanging.current||signingOut.current)return;
  opening.current=true;setBusy(true);setError('');const currentEpoch=epoch.current;
  try{
   await clearAttempt();
   const bytes=await Crypto.getRandomBytesAsync(64),verifier=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
   const base64=await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,verifier,{encoding:Crypto.CryptoEncoding.BASE64});
   const challenge=base64.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
   await secureStorage.setItem(VERIFIER_KEY,JSON.stringify(verifier));
   await secureStorage.setItem(PENDING_KEY,JSON.stringify({version:1,startedAt:Date.now()}));
   const result=await WebBrowser.openAuthSessionAsync(googleAuthorizeUrl(publicConfig.supabaseUrl,challenge),NATIVE_CALLBACK);
   if(result.type==='success')await handleCallback(result.url);
   else if(exchanging.current)await exchanging.current;
   else await clearAttempt();
  }catch{
   await clearAttempt().catch(()=>{});
   if(mounted.current&&epoch.current===currentEpoch)setError('Could not open Google sign-in. Check your connection and try again.');
  }finally{opening.current=false;if(mounted.current)setBusy(false);}
 }
 async function signOut(){
  if(signingOut.current)return;
  signingOut.current=true;
  epoch.current++;setBusy(true);setError('');
  try{
   if(exchanging.current)await exchanging.current;
   // Local credentials are cleared even if revocation cannot reach the network.
   await client.auth.signOut({scope:'local'}).catch(()=>{});
   await clearAttempt();await secureStorage.removeItem(STORAGE_KEY);setSession(null);
  }catch{setError('Could not clear secure device storage. Unlock your device and try signing out again.');throw new Error('Signout requires another try.');}
  finally{signingOut.current=false;setBusy(false);}
 }
 async function accessToken(expectedUserId?:string){const {data,error:failure}=await client.auth.getSession();if(failure)throw new Error('Sign in again to continue.');if(expectedUserId&&data.session?.user.id!==expectedUserId)return null;return data.session?.access_token??null;}
  return {session,ready,busy,error,signIn,signOut,accessToken,isCurrentUser:(id:string)=>sessionUser.current===id};
}
