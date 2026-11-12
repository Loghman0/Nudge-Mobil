import {it} from 'node:test';
import assert from 'node:assert/strict';
import {AUTH_MAX_AGE,googleAuthorizeUrl,NATIVE_CALLBACK,parsePendingAuth,readAuthCallback} from '../src/auth-protocol';
import {DRAFT_MAX_AGE,parseNativeDraft,prepareClaim,type NativeDraft} from '../src/draft';
import {answerPreview,previewQuestions} from '../src/preview';
const id='73c1009d-2340-48a5-a07d-c9d741c331ef',user='af3de3c2-4f0b-4a60-9fb9-8b0453b5e10d';
it('only exchanges exact native PKCE callbacks, never credentials in a fragment',()=>{
 assert.deepEqual(readAuthCallback(NATIVE_CALLBACK+'?code=abc-123456'),{code:'abc-123456'});
 for(const url of ['https://auth/callback?code=abc-123456',NATIVE_CALLBACK+'/other?code=abc-123456',NATIVE_CALLBACK+'?code=a&code=b',NATIVE_CALLBACK+'#access_token=private',NATIVE_CALLBACK+'?access_token=private&code=abc-123456','com.projectnudge.app://evil/callback?code=abc-123456'])assert.equal(readAuthCallback(url),null);
 assert.deepEqual(readAuthCallback(NATIVE_CALLBACK+'?error=access_denied'),{cancelled:true});
});
it('auth attempt expires and generated authorization always uses s256',()=>{
 assert.equal(parsePendingAuth(JSON.stringify({version:1,startedAt:0}),AUTH_MAX_AGE+1),null);
 assert.equal(parsePendingAuth(JSON.stringify({version:1,startedAt:2}),1),null);
 const url=new URL(googleAuthorizeUrl('https://project.supabase.co','a'.repeat(43)));
 assert.equal(url.searchParams.get('code_challenge_method'),'s256');assert.equal(url.searchParams.get('redirect_to'),NATIVE_CALLBACK);
 assert.throws(()=>googleAuthorizeUrl('http://project.supabase.co','a'.repeat(43)));
});
it('native drafts reject expired, tampered and unsupported answers',()=>{
 const d:NativeDraft={version:2,createdAt:Date.now(),answers:answerPreview({},0,{kind:'choice',optionId:previewQuestions[0].choices![0].id})};
 assert.ok(parseNativeDraft(JSON.stringify(d)));
 assert.equal(parseNativeDraft(JSON.stringify(d),d.createdAt+DRAFT_MAX_AGE+1),null);
 assert.equal(parseNativeDraft(JSON.stringify({...d,answers:{unknown:{kind:'skip'}}})),null);
 assert.equal(parseNativeDraft(JSON.stringify({...d,answers:{[previewQuestions[0].id]:{kind:'choice',optionId:'made-up'}}})),null);
});
it('preview claim retries keep original generation and account binding',()=>{
 const d:NativeDraft={version:2,createdAt:Date.now(),answers:answerPreview({},0,{kind:'skip'})};
 const pinned=prepareClaim(d,user,4,id);
 assert.equal(prepareClaim(pinned,user,9,'d702cc6e-0b2f-43d9-ae29-1f0d9f44418c'),pinned);
 assert.equal(pinned.claim!.expectedGeneration,4);
 assert.throws(()=>prepareClaim(pinned,'d702cc6e-0b2f-43d9-ae29-1f0d9f44418c',4,id));
 assert.throws(()=>prepareClaim({...pinned,createdAt:Date.now()-DRAFT_MAX_AGE-1},user,4,id));
});
