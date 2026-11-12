type Permission={status:string;canAskAgain?:boolean};
export function shouldAskPushOnce(permission:Permission,seen:boolean){return !seen&&permission.status==='undetermined'&&permission.canAskAgain!==false;}
/** The user's time in the Android permission dialog is not a network timeout. */
export async function requestPushPermission(deps:{read:()=>Promise<Permission>;request:()=>Promise<Permission>;current:()=>boolean},ask:boolean){
 let status=await deps.read();if(!deps.current())return null;
 if(status.status!=='granted'&&ask&&status.canAskAgain!==false)status=await deps.request();
 if(!deps.current())return null;
 if(status.status!=='granted')throw Error('Phone notifications are off in Android settings. Your in-app check-ins still work.');
 return status;
}
