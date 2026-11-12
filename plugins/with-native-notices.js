const fs=require('node:fs');
const path=require('node:path');
const {withDangerousMod}=require('expo/config-plugins');
module.exports=config=>withDangerousMod(config,['android',async result=>{
 const root=path.resolve(result.modRequest.projectRoot),android=path.resolve(result.modRequest.platformProjectRoot);
 if(android!==path.join(root,'android'))throw new Error('Unexpected Android notices destination.');
 const target=path.join(android,'app/src/main/assets');fs.mkdirSync(target,{recursive:true});
 fs.copyFileSync(path.join(root,'assets/native-notices.txt'),path.join(target,'native-notices.txt'));
 return result;
}]);
