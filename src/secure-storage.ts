import * as SecureStore from 'expo-secure-store';
// Android Keystore encryption. Backups are disabled in app configuration.
// Fail visibly on native storage errors; never fall back to unencrypted storage.
const options={keychainService:'com.projectnudge.private',keychainAccessible:SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY};
const pending=new Map<string,Promise<unknown>>();
function serial<T>(key:string,operation:()=>Promise<T>):Promise<T>{
 const next=(pending.get(key)??Promise.resolve()).catch(()=>{}).then(operation);
 pending.set(key,next);void next.finally(()=>{if(pending.get(key)===next)pending.delete(key);}).catch(()=>{});return next;
}
export const secureStorage={
 getItem:(key:string)=>serial(key,()=>SecureStore.getItemAsync(key,options)),
 setItem:(key:string,value:string)=>serial(key,async()=>{if(value.length>65536)throw new Error('This saved session is too large.');await SecureStore.setItemAsync(key,value,options);}),
 removeItem:(key:string)=>serial(key,()=>SecureStore.deleteItemAsync(key,options)),
};
