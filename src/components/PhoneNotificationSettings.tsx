import {useEffect,useState} from 'react';
import {Linking,TextInput,View} from 'react-native';
import type {Theme} from '../theme';
import {quietLabel,quietMinute} from '../push-registration';
import {useNativePushControls} from '../use-native-push';
import {Action,ActionMenu,Copy,ui} from './native-ui';
export function PhoneNotificationSettings({theme}:{theme:Theme}){
 const push=useNativePushControls(),[quiet,setQuiet]=useState(true),[start,setStart]=useState('22:00'),[end,setEnd]=useState('08:00'),[zone,setZone]=useState('UTC'),[error,setError]=useState('');
 useEffect(()=>{if(push?.settingsVisible&&push.registration){const p=push.registration.preferences,on=p.quietStart!==p.quietEnd;setQuiet(on);setStart(on?quietLabel(p.quietStart):'22:00');setEnd(on?quietLabel(p.quietEnd):'08:00');setZone(p.timeZone);setError('');}},[push?.settingsVisible,push?.registration?.installationId]);
 if(!push)return null;
 function enable(){const a=quiet?quietMinute(start):0,b=quiet?quietMinute(end):0;if(a===null||b===null){setError('Use a 24-hour time such as 22:00.');return;}if(quiet&&a===b){setError('Choose different times, or turn quiet hours off.');return;}setError('');void push!.enable({timeZone:zone,quietStart:a,quietEnd:b});}
 return <ActionMenu title="Phone notifications" theme={theme} visible={push.settingsVisible} onClose={push.closeSettings}>
  <Copy theme={theme}>{push.registration?.pending?'A device change needs confirmation':push.error?'Could not confirm phone notifications':push.registration?.desired&&push.permission==='granted'?'Enabled on this phone':push.ready?'Off on this phone':'Checking this phone…'}</Copy>
  <Copy theme={theme} kind="muted">Google Firebase delivers generic check-ins. Your decision questions and answers stay inside Nudge.</Copy>
  {!push.ready&&<Copy theme={theme} live>Checking this device…</Copy>}
  {push.ready&&!push.configured&&!push.error&&<Copy theme={theme}>Phone notifications are not configured yet. In-app check-ins still work.</Copy>}
  <Action label="Quiet hours" theme={theme} selected={quiet} disabled={push.busy} onPress={()=>setQuiet(!quiet)}/>
  {quiet&&<View style={ui.row}>{([['From (HH:MM)',start,setStart],['Until (HH:MM)',end,setEnd]] as const).map(([label,value,change])=><View key={label} style={[ui.smallStack,{flex:1}]}><Copy theme={theme}>{label}</Copy><TextInput accessibilityLabel={label} value={value} onChangeText={change} autoCapitalize="none" autoCorrect={false} maxLength={5} editable={!push.busy} style={[ui.input,{color:theme.text,borderColor:theme.controlLine,backgroundColor:theme.card}]}/></View>)}</View>}
  <Copy theme={theme} kind="muted">{zone}</Copy>
  <Action label="Use current device time zone" theme={theme} disabled={push.busy} onPress={()=>{try{setZone(Intl.DateTimeFormat().resolvedOptions().timeZone);}catch{setError('Could not read the device time zone.');}}}/>
  {!!(error||push.error)&&<Copy theme={theme} live>{error||push.error}</Copy>}
  <Action label={push.registration?.desired?'Save phone settings':'Enable phone notifications'} theme={theme} primary busy={push.busy} disabled={!push.ready||!push.configured} onPress={enable}/>
  {!!push.registration?.pending&&<Action label="Check same device change" theme={theme} disabled={push.busy} onPress={()=>void push.retry()}/>}
  {(push.registration?.desired||push.registration?.pending)&&<Action label="Turn off phone notifications" theme={theme} disabled={push.busy} onPress={()=>void push.disable()}/>}
  <View style={ui.row}><Action label="Android settings" theme={theme} disabled={push.busy} onPress={()=>void Linking.openSettings().catch(()=>setError('Could not open Android settings.'))}/><Action label="Refresh status" theme={theme} disabled={push.busy} onPress={()=>void push.reload()}/></View>
 </ActionMenu>;
}
