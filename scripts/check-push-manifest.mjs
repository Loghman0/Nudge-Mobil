import {readFile} from 'node:fs/promises';
const xml=await readFile(new URL('../android/app/src/main/AndroidManifest.xml',import.meta.url),'utf8');
for(const name of ['firebase_messaging_auto_init_enabled','firebase_analytics_collection_enabled']){
  const tag=xml.match(new RegExp('<meta-data\\b[^>]*android:name="'+name+'"[^>]*/?>','g'));
  if(tag?.length!==1||!tag[0].includes('android:value="false"'))throw Error('Firebase must remain opt-in: '+name);
}
console.log('Generated manifest disables Firebase automatic registration and Analytics collection.');
