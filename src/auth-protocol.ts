export const NATIVE_CALLBACK='com.projectnudge.app://auth/callback';
export const AUTH_MAX_AGE=10*60*1000;
export interface PendingAuth {version:1;startedAt:number}
export function parsePendingAuth(raw:string|null,now=Date.now()):PendingAuth|null{
 if(!raw||raw.length>200)return null;
 try{const p=JSON.parse(raw);return p.version===1&&Number.isFinite(p.startedAt)&&p.startedAt<=now&&now-p.startedAt<=AUTH_MAX_AGE?{version:1,startedAt:p.startedAt}:null;}catch{return null;}
}
/** Only our callback with one authorization code is eligible for PKCE exchange. */
export function readAuthCallback(raw:string):{code:string}|{cancelled:true}|null{
 if(raw.length>8192)return null;
 try{
  const u=new URL(raw),expected=new URL(NATIVE_CALLBACK);
  if(u.protocol!==expected.protocol||u.hostname!==expected.hostname||u.pathname!==expected.pathname||u.port||u.username||u.password||u.hash)return null;
  if(u.searchParams.has('access_token')||u.searchParams.has('refresh_token'))return null;
  if(u.searchParams.has('error'))return {cancelled:true};
  const codes=u.searchParams.getAll('code');
  return codes.length===1&&/^[A-Za-z0-9._~-]{8,2048}$/.test(codes[0])?{code:codes[0]}:null;
 }catch{return null;}
}
export function googleAuthorizeUrl(baseUrl:string,challenge:string){
 const u=new URL(baseUrl);
 if(u.protocol!=='https:'||u.username||u.password||u.pathname!=='/'||u.search||u.hash||!/^[A-Za-z0-9_-]{43}$/.test(challenge))throw new Error('Invalid sign-in configuration.');
 u.pathname='/auth/v1/authorize';u.searchParams.set('provider','google');u.searchParams.set('redirect_to',NATIVE_CALLBACK);
 u.searchParams.set('code_challenge',challenge);u.searchParams.set('code_challenge_method','s256');
 return u.toString();
}
