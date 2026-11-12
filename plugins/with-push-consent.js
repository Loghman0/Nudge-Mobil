const {withAndroidManifest, AndroidConfig}=require('expo/config-plugins');

// getDevicePushTokenAsync explicitly requests a token after opt-in. Keep Firebase
// from generating one during anonymous onboarding or recreating it after opt-out.
module.exports=config=>withAndroidManifest(config,result=>{
  const application=AndroidConfig.Manifest.getMainApplicationOrThrow(result.modResults);
  for(const name of ['firebase_messaging_auto_init_enabled','firebase_analytics_collection_enabled']){
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(application,name,'false');
  }
  return result;
});
