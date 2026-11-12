import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../../',import.meta.url);
const values={};
for(const line of (await readFile(new URL('.env.local',root),'utf8')).split(/\r?\n/)){
 const match=line.match(/^(NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY)=(.*)$/);
 if(match)values[match[1]]=match[2].trim().replace(/^['"]|['"]$/g,'');
}
const url=values.NEXT_PUBLIC_SUPABASE_URL,key=values.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if(!url||new URL(url).protocol!=='https:'||!key)throw new Error('Public Supabase configuration is missing.');
if(key.startsWith('eyJ')){const claims=JSON.parse(Buffer.from(key.split('.')[1],'base64url'));if(claims.role!=='anon')throw new Error('Only the public anon key is allowed.');}
else if(!key.startsWith('sb_publishable_'))throw new Error('Only a publishable Supabase key is allowed.');
await writeFile(new URL('mobile/src/public-endpoints.json',root),JSON.stringify({apiOrigin:'https://projectnudge.vercel.app',supabaseUrl:url,supabaseAnonKey:key},null,2)+'\n');
console.log('Native public endpoints generated; private environment values were not copied.');
