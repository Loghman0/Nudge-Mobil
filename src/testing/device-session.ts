import type {SupabaseClient} from '@supabase/supabase-js';
import {File,Paths} from 'expo-file-system';
/** Local emulator tests only. This module is never enabled in a release build. */
export async function consumeDeviceTestSession(client:SupabaseClient){
 if(!__DEV__||process.env.EXPO_PUBLIC_NATIVE_TEST_HARNESS!=='1')return;
 const file=new File(Paths.document,'nudge-native-test-session.json');
 if(!file.exists)return;
 const raw=await file.text();file.delete();
 if(raw.length>16000)throw new Error('Invalid local device fixture.');
 const value=JSON.parse(raw);
 if(typeof value.access_token!=='string'||typeof value.refresh_token!=='string')throw new Error('Invalid local device fixture.');
 const {data,error}=await client.auth.getUser(value.access_token);
 if(error||data.user?.user_metadata.nudge_native_fixture!==true)throw new Error('Local device fixture is unavailable.');
 const result=await client.auth.setSession({access_token:value.access_token,refresh_token:value.refresh_token});
 if(result.error)throw new Error('Could not start local device test session.');
}
