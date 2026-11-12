const {withAndroidColors,withAndroidStyles}=require('expo/config-plugins');

module.exports=config=>{
  const background=config.splash?.backgroundColor??'#edf2f7';
  config=withAndroidColors(config,result=>{
    const resources=result.modResults.resources;
    resources.color=(resources.color??[]).filter(color=>color.$.name!=='splashscreen_background');
    resources.color.push({$:{name:'splashscreen_background'},_:background});
    return result;
  });
  return withAndroidStyles(config,result=>{
    const styles=result.modResults.resources.style??[];
    const set=(style,name,value)=>{
      style.item=(style.item??[]).filter(item=>item.$.name!==name);
      style.item.push({$:{name},_:value});
    };
    const app=styles.find(style=>style.$.name==='AppTheme');
    const splash=styles.find(style=>style.$.name==='Theme.App.SplashScreen');
    if(!app||!splash)throw Error('Nudge Android opening themes are missing.');
    set(app,'android:windowBackground','@color/splashscreen_background');
    set(app,'android:windowLightStatusBar','true');
    set(splash,'android:windowSplashScreenBackground','@color/splashscreen_background');
    return result;
  });
};
