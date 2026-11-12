import {it} from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
it('the installed auth SDK exchanges the encrypted verifier format used by native sign-in',async()=>{
 const storageKey='nudge.auth.session.v1',verifier='a'.repeat(128),values=new Map([[storageKey+'-code-verifier',JSON.stringify(verifier)]]);
 let calls=0;
 const client=createClient('https://project.supabase.co','public-anon-fixture',{
  auth:{storageKey,flowType:'pkce',autoRefreshToken:false,detectSessionInUrl:false,persistSession:true,
   storage:{getItem:async key=>values.get(key)??null,setItem:async(key,value)=>{values.set(key,value);},removeItem:async key=>{values.delete(key);}}},
  global:{fetch:async(input,init)=>{
   calls++;const url=new URL(String(input));assert.equal(url.pathname,'/auth/v1/token');assert.equal(url.searchParams.get('grant_type'),'pkce');
   const body=JSON.parse(init!.body as string);assert.equal(body.auth_code,'test-code');assert.equal(body.code_verifier,verifier);
   return new Response(JSON.stringify({access_token:'test-access-token',refresh_token:'test-refresh-token',token_type:'bearer',expires_in:3600,user:{id:'af3de3c2-4f0b-4a60-9fb9-8b0453b5e10d',aud:'authenticated',role:'authenticated',email:'fixture@example.test'}}),{status:200,headers:{'Content-Type':'application/json'}});
  }},
 });
 const result=await client.auth.exchangeCodeForSession('test-code');assert.equal(result.error,null);assert.ok(result.data.session);
 assert.equal(calls,1);assert.ok(values.has(storageKey));assert.equal(values.has(storageKey+'-code-verifier'),false);
 await client.auth.stopAutoRefresh();
});
