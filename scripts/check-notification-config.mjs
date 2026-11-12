import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),app=JSON.parse(await readFile(new URL('app.json',root),'utf8')).expo;
const sdk=JSON.parse(await readFile(new URL('google-services.json',root),'utf8'));
if(app.android?.googleServicesFile!=='./google-services.json'||sdk.project_info?.project_id!=='nudge-502812'||sdk.type==='service_account'||sdk.private_key||sdk.client_email)throw Error('Expected only the reviewed public Android client configuration. Never use a private sender key here.');
if(!sdk.client?.some(client=>client.client_info?.android_client_info?.package_name===app.android.package&&client.client_info?.mobilesdk_app_id?.startsWith('1:'+sdk.project_info.project_number+':android:')))throw Error('Firebase Android package mismatch.');
const png=await readFile(new URL('assets/notification-icon.png',root));if(png.readUInt32BE(16)!==96||png.readUInt32BE(20)!==96)throw Error('Expected the generated 96px monochrome notification mark.');
if(!app.plugins.includes('./plugins/with-push-consent.js'))throw Error('Push consent plugin must disable Firebase automatic registration.');
console.log('Public Firebase client, package and notification asset checked; no private sender credential used.');
