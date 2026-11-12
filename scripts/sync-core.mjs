import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const outputs=[
 ['src/lib/discovery/types.ts','src/core/types.ts'],
 ['src/lib/discovery/mood.ts','src/core/mood.ts'],
 ['src/lib/discovery/contracts.ts','src/core/contracts.ts'],
 ['src/lib/discovery/taxonomy.ts','src/core/taxonomy.ts'],
 ['src/lib/discovery/validation.ts','src/core/validation.ts'],
 ['src/lib/discovery/observation-core.ts','src/core/observation-core.ts'],
 ['src/lib/services/comparison-criteria.ts','src/core/comparison-criteria.ts'],
 ['src/lib/services/reminder-local-time.ts','src/core/reminder-local-time.ts'],
 ['data/discovery-preview.json','src/core/questions.json'],
];
const root=new URL('../',import.meta.url),webRoot=new URL('../../',import.meta.url);
const provenance=[];
for(const [source,target] of outputs){
 const bytes=await readFile(new URL(source,webRoot));
 provenance.push({source,target,sha256:createHash('sha256').update(bytes).digest('hex')});
 const file=new URL(target,root);
 if(process.argv.includes('--check')){
  if(!bytes.equals(await readFile(file)))throw new Error('Shared core is out of date: '+source);
 }else{await mkdir(new URL('./',file),{recursive:true});await writeFile(file,bytes);}
}
const manifest=JSON.stringify({notice:'Generated from the existing web source. Run npm run sync:core after reviewed web changes. Do not edit these copies.',files:provenance},null,2)+'\n';
const file=new URL('src/core/provenance.json',root);
if(process.argv.includes('--check')){if((await readFile(file,'utf8'))!==manifest)throw new Error('Shared core provenance is out of date.');}
else await writeFile(file,manifest);
console.log(`Native discovery uses exact web contracts, questions, validators and evidence rules; ${outputs.length} source hashes verified.`);
