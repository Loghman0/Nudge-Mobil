const {withAppBuildGradle}=require('expo/config-plugins');

// Keep native object paths below Windows' compiler limit without changing OS settings.
module.exports=config=>withAppBuildGradle(config,config=>{
 if(config.modResults.language!=='groovy')throw new Error('Nudge expects the generated Groovy Android build file.');
 const marker='// nudge: short CMake object paths';
 if(config.modResults.contents.includes(marker))config.modResults.contents=config.modResults.contents.replace(/-DCMAKE_OBJECT_PATH_MAX=\d+/g,'-DCMAKE_OBJECT_PATH_MAX=250');
 else config.modResults.contents+=`\n${marker}\nandroid {\n    defaultConfig {\n        externalNativeBuild {\n            cmake { arguments "-DCMAKE_OBJECT_PATH_MAX=250" }\n        }\n    }\n}\n`;
 return config;
});
