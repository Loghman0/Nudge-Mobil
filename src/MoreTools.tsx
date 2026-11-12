import {useEffect,useRef,useState} from 'react';
import {NoteReview} from './components/NoteReview';
import {MonthlyRecap} from './components/MonthlyRecap';
import {BackHandler,ScrollView,Share,StyleSheet,TextInput,View,type ScrollViewInstance} from 'react-native';
import {MoreApi,MoreApiError,type BeliefPage,type CircleDetail,type CircleSummary,type EarlierState,type Evidence,type MemoryPage,type Outcomes,type DecisionActivity,type PreferenceTimeline} from './more-api';
import {Action,Card,Copy,LoadingCard,ui} from './components/native-ui';
import {layout,type Theme} from './theme';
type Page='recap'|'notes'|'home'|'circles'|'circle'|'earlier'|'beliefs'|'memories'|'outcomes'|'activity'|'timeline';
type Editor={kind:'memory';id:string;content:string;type:string}|{kind:'belief';id:string;polarity:'like'|'dislike'|'neutral';note:string}|{kind:'forget';id:string}|{kind:'deleteMemory';id:string}|{kind:'deleteCircle'};
export interface MoreToolsProps{theme:Theme;api:MoreApi;userId:string;onOpenDecision?:(id:string)=>void;onFoundation?:()=>void;onExit?:()=>void}
function Field({label,value,onChange,maxLength,theme,multiline=false,disabled=false}:{label:string;value:string;onChange:(v:string)=>void;maxLength:number;theme:Theme;multiline?:boolean;disabled?:boolean}){
 return <View style={ui.smallStack}><Copy theme={theme}>{label}</Copy><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} maxLength={maxLength} multiline={multiline} editable={!disabled} autoCapitalize="sentences" style={[ui.input,{backgroundColor:theme.card,borderColor:theme.controlLine,color:theme.text}]}/></View>;
}
function dateInZone(value:string,timeZone:string){try{return new Intl.DateTimeFormat('en-US',{timeZone,year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(new Date(value));}catch{return value;}}
function ActivityView({activity,theme}:{activity:DecisionActivity;theme:Theme}){
 const [periodPage,setPeriodPage]=useState(0),[details,setDetails]=useState(false);
 useEffect(()=>{setPeriodPage(0);},[activity.asOf]);
 const periods=[...activity.buckets].reverse(),shown=periods.slice(periodPage*4,periodPage*4+4),total=activity.buckets.reduce((sum,bucket)=>sum+bucket.count,0),maximum=Math.max(1,...activity.buckets.map(bucket=>bucket.count));
 const date=(value:string)=>new Intl.DateTimeFormat(undefined,{timeZone:activity.timeZone,month:'short',day:'numeric'}).format(new Date(value));
 return <View style={ui.stack}>
  <Copy theme={theme} kind="muted">{total} recorded {total===1?'decision':'decisions'} across 12 seven-day periods.</Copy>
  {!total&&<Copy theme={theme}>{activity.sampleSize?'No sampled decisions in this period.':'No decisions recorded yet.'}</Copy>}
  {shown.map(bucket=><View key={bucket.start} style={ui.smallStack}>
   <View style={ui.row}><View style={{flexGrow:1}}><Copy theme={theme}>{date(bucket.start)} – {date(new Date(Date.parse(bucket.endExclusive)-1).toISOString())}</Copy></View><Copy theme={theme}>{bucket.count}</Copy></View>
   <View accessible={false} style={[styles.activityTrack,{backgroundColor:theme.selection}]}><View style={[styles.activityBar,{backgroundColor:theme.accent,width:`${bucket.count/maximum*100}%`}]}/></View>
  </View>)}
  <View style={ui.row}><Action label="Newer periods" theme={theme} disabled={periodPage===0} onPress={()=>setPeriodPage(value=>value-1)}/><Action label="Older periods" theme={theme} disabled={(periodPage+1)*4>=periods.length} onPress={()=>setPeriodPage(value=>value+1)}/></View>
  <Action label={details?'Hide count details':'About these counts'} theme={theme} onPress={()=>setDetails(!details)}/>
  {details&&<View style={ui.smallStack}><Copy theme={theme} kind="muted">From your latest {activity.sampleSize} saved decisions, limited to {activity.sampleLimit}. These are rolling seven-day periods based on when each decision was created.</Copy><Copy theme={theme} kind="muted">Updated {dateInZone(activity.asOf,activity.timeZone)}. Time zone: {activity.timeZone}.</Copy><Copy theme={theme} kind="muted">Window: {dateInZone(activity.windowStart,activity.timeZone)} to before {dateInZone(activity.windowEndExclusive,activity.timeZone)}.</Copy>{activity.sampleCapped&&<Copy theme={theme} kind="muted">Older decisions may be outside this sample.</Copy>}</View>}
 </View>;
}
export function MoreTools({theme,api,userId,onOpenDecision,onFoundation,onExit}:MoreToolsProps){
 const [showMore,setShowMore]=useState(false);
 const [page,setPage]=useState<Page>('home'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[blocked,setBlocked]=useState(false);
 const [circles,setCircles]=useState<CircleSummary[]>([]),[detail,setDetail]=useState<CircleDetail|null>(null),[earlier,setEarlier]=useState<EarlierState|null>(null),[beliefs,setBeliefs]=useState<BeliefPage|null>(null),[memories,setMemories]=useState<MemoryPage|null>(null),[outcomes,setOutcomes]=useState<Outcomes|null>(null);
 const [timeline,setTimeline]=useState<PreferenceTimeline|null>(null);
 const [circleId,setCircleId]=useState(''),[name,setName]=useState(''),[invite,setInvite]=useState(''),[showCreate,setShowCreate]=useState(false),[showJoin,setShowJoin]=useState(false),[showPoll,setShowPoll]=useState(false),[showCircleControls,setShowCircleControls]=useState(false);
 const [question,setQuestion]=useState(''),[options,setOptions]=useState(['','']),[query,setQuery]=useState(''),[activeQuery,setActiveQuery]=useState(''),[offset,setOffset]=useState(0),[editor,setEditor]=useState<Editor|null>(null),[confirmation,setConfirmation]=useState(''),[evidence,setEvidence]=useState<{id:string;rows:Evidence[]}|null>(null);
 const mounted=useRef(true),locked=useRef(false),epoch=useRef(0),scroll=useRef<ScrollViewInstance>(null);
 const disabled=busy||blocked;
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;epoch.current++;};},[]);
 useEffect(()=>{scroll.current?.scrollTo({y:0,animated:false});},[page]);
 function back(){
  if(locked.current)return true;
  if(editor){setEditor(null);return true;}if(evidence){setEvidence(null);return true;}if(showPoll){setShowPoll(false);return true;}if(showCircleControls){setShowCircleControls(false);return true;}
  if(page==='circle'){void open('circles');return true;}if(page==='activity'||page==='recap'){void open('outcomes');return true;}if(page==='timeline'){void open('earlier');return true;}if(page!=='home'){epoch.current++;setPage('home');setError('');setNotice('');setBlocked(false);return true;}if(onExit){onExit();return true;}return false;
 }
 useEffect(()=>{const listener=BackHandler.addEventListener('hardwareBackPress',back);return()=>listener.remove();},[page,editor,evidence,showPoll,showCircleControls]);
 function report(e:unknown){if(mounted.current)setError(e instanceof MoreApiError?e.message:'Could not load this tool. Check your connection and try again.');}
 async function fetchPage(target:Page,id=circleId,q=activeQuery,at=offset){
  const request=++epoch.current;
  if(target==='circles'){const value=await api.circles();if(mounted.current&&request===epoch.current)setCircles(value.circles);}
  if(target==='circle'){const value=await api.circle(id);if(mounted.current&&request===epoch.current)setDetail(value);}
  if(target==='earlier'){const value=await api.earlier();if(mounted.current&&request===epoch.current)setEarlier(value);}
  if(target==='beliefs'){const value=await api.beliefs(q,at);if(mounted.current&&request===epoch.current)setBeliefs(value);}
  if(target==='memories'){const value=await api.memories(q,at);if(mounted.current&&request===epoch.current)setMemories(value);}
  if(target==='outcomes'||target==='activity'){const value=await api.outcomes();if(mounted.current&&request===epoch.current)setOutcomes(value);}
  if(target==='timeline'){const value=await api.timeline();if(mounted.current&&request===epoch.current)setTimeline(value);}
 }
 async function open(target:Page,id='',q='',at=0){
  if(locked.current)return;locked.current=true;setBusy(true);setError('');setNotice('');setEditor(null);setEvidence(null);setPage(target);setCircleId(id);setOffset(at);setActiveQuery(q);setQuery(q);setShowCircleControls(false);setShowPoll(false);
  try{await fetchPage(target,id,q,at);if(mounted.current)setBlocked(false);}catch(e){report(e);}finally{locked.current=false;if(mounted.current)setBusy(false);}
 }
 async function reload(){
  if(locked.current)return;locked.current=true;setBusy(true);setError('');setNotice('');
  try{await fetchPage(page);if(mounted.current){setBlocked(false);setEditor(null);setEvidence(null);}}catch(e){report(e);}finally{locked.current=false;if(mounted.current)setBusy(false);}
 }
 async function change(run:()=>Promise<unknown>,message:string,nextPage:Page=page,nextId=circleId,onSuccess?:()=>void){
  if(locked.current||blocked||!mounted.current)return;locked.current=true;setBusy(true);setError('');setNotice('');
  try{
   await run();if(!mounted.current)return;onSuccess?.();setEditor(null);setConfirmation('');setPage(nextPage);setCircleId(nextId);setNotice(message);
   try{await fetchPage(nextPage,nextId);if(mounted.current)setBlocked(false);}catch(e){if(mounted.current){setBlocked(true);setNotice('Saved. Reload to see the latest data before making another change.');}report(e);}
  }catch(e){if(mounted.current)setBlocked(true);report(e);}finally{locked.current=false;if(mounted.current)setBusy(false);}
 }
 async function shareInvite(){if(!detail?.circle.invite_code)return;try{await Share.share({message:`Join my Nudge decision circle with this code: ${detail.circle.invite_code}`});}catch{setError('Could not open sharing. The invitation code is still shown here.');}}
 async function inspect(id:string){if(locked.current)return;locked.current=true;setBusy(true);setError('');try{const value=await api.evidence(id);if(mounted.current)setEvidence({id,rows:value.evidence});}catch(e){report(e);}finally{locked.current=false;if(mounted.current)setBusy(false);}}
 const title={recap:'Your last 30 days',notes:'Add a note',home:'Tools',circles:'Decision circles',circle:detail?.circle.name??'Decision circle',earlier:'Earlier preferences',beliefs:'Earlier memory',memories:'Memories',outcomes:'Outcome patterns',activity:'Decision activity',timeline:'Preference timeline'}[page];
 return <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}><View style={styles.content}>
  {page!=='home'&&<Action label={page==='circle'?'All circles':page==='activity'||page==='recap'?'Back to outcome patterns':page==='timeline'?'Back to earlier preferences':'Back to tools'} theme={theme} disabled={busy} onPress={back}/>}
  <Copy theme={theme} kind="hero">{title}</Copy>
  {!!notice&&<Card theme={theme}><Copy theme={theme} live>{notice}</Copy></Card>}
  {!!error&&<Card theme={theme}><Copy theme={theme} live>{error}</Copy>{blocked&&<Copy theme={theme} kind="muted">The change may have saved. Reload and review the current data before trying it again.</Copy>}<Action label="Reload latest data" theme={theme} disabled={busy} onPress={()=>void reload()}/></Card>}
  {!!error&&((page==='activity'&&!!outcomes?.activity)||(page==='timeline'&&!!timeline))&&<Copy theme={theme} kind="muted">Showing the last loaded timeline. Its as-of time is shown below.</Copy>}
  {busy&&page!=='notes'&&page!=='recap'&&<LoadingCard label="Loading…" theme={theme}/>}
  {page==='home'&&<View style={ui.stack}>
   {([['memories','Memory library'],['outcomes','Outcome patterns'],['circles','Decision circles']] as const).map(([target,label])=><Action key={target} label={label} theme={theme} disabled={busy} onPress={()=>void open(target)}/>)}
   <Action label={showMore?'Fewer tools':'More tools'} theme={theme} onPress={()=>setShowMore(current=>!current)}/>
   {showMore&&<View style={ui.smallStack}>
    {([['notes','Add a note'],['earlier','Check an earlier preference'],['beliefs','Inspect earlier memory']] as const).map(([target,label])=><Action key={target} label={label} theme={theme} disabled={busy} onPress={()=>void open(target)}/>)}
    {onFoundation&&<Action label="Starter preferences and milestones" theme={theme} disabled={busy} onPress={onFoundation}/>}
   </View>}
  </View>}
  {page==='notes'&&<NoteReview key={userId} api={api} theme={theme} onBusyChange={value=>{locked.current=value;setBusy(value);}}/>} 
  {page==='recap'&&<MonthlyRecap key={userId} api={api} theme={theme} onBusyChange={value=>{locked.current=value;setBusy(value);}}/>}
  {page==='circles'&&<View style={ui.stack}>
   <Copy theme={theme} kind="muted">Keep shared votes separate from your personal answers and memory.</Copy>
   <View style={ui.row}><Action label={showCreate?'Close new circle':'Create a circle'} theme={theme} disabled={disabled} onPress={()=>setShowCreate(!showCreate)}/><Action label={showJoin?'Close invitation':'Join with a code'} theme={theme} disabled={disabled} onPress={()=>setShowJoin(!showJoin)}/></View>
   {showCreate&&<Card theme={theme}><Field label="Circle name" value={name} maxLength={80} onChange={setName} theme={theme} disabled={disabled}/><Action label="Create circle" theme={theme} primary disabled={disabled||!name.trim()} onPress={()=>void change(async()=>{const value=await api.createCircle(name);setCircleId(value.id);},'Circle created.','circles','',()=>{setName('');setShowCreate(false);})}/></Card>}
   {showJoin&&<Card theme={theme}><Field label="Invitation code" value={invite} maxLength={18} onChange={setInvite} theme={theme} disabled={disabled}/><Action label="Join circle" theme={theme} primary disabled={disabled||!/^[a-f0-9]{18}$/i.test(invite.trim())} onPress={()=>void change(()=>api.joinCircle(invite),'Circle joined.','circles','',()=>{setInvite('');setShowJoin(false);})}/></Card>}
   {!busy&&!circles.length&&<Card theme={theme}><Copy theme={theme}>No circles yet. Create one for people you decide with, or enter an invitation code.</Copy></Card>}
   {circles.map(group=><Card key={group.id} theme={theme}><Copy theme={theme} kind="title">{group.name}</Copy><Copy theme={theme} kind="muted">{group.owner_id===userId?'You own this circle':'Circle member'}</Copy><Action label="Open circle" hint={group.name} theme={theme} disabled={busy} onPress={()=>void open('circle',group.id)}/></Card>)}
  </View>}
  {page==='circle'&&detail&&<View style={ui.stack}>
   <Copy theme={theme} kind="muted">{detail.members.length} members · vote totals are shared; your selection is private.</Copy>
   <Card theme={theme}><Copy theme={theme} kind="title">Members</Copy>{detail.members.map(member=><Copy key={member.user_id} theme={theme}>{member.full_name}{member.user_id===userId?' (you)':''}{member.role==='owner'?' · owner':''}</Copy>)}
    {!!detail.circle.invite_code&&<><Copy theme={theme}>Invitation code: {detail.circle.invite_code}</Copy><Action label="Share invitation code" theme={theme} disabled={busy} onPress={()=>void shareInvite()}/></>}
   </Card>
   <Action label={showCircleControls?'Hide circle controls':'Circle controls'} theme={theme} disabled={disabled} onPress={()=>setShowCircleControls(!showCircleControls)}/>
   {showCircleControls&&<Card theme={theme}>{detail.circle.owner_id===userId?<>
    <Copy theme={theme}>Refreshing the invitation disables the old code.</Copy><Action label="Refresh invitation code" theme={theme} disabled={disabled} onPress={()=>void change(()=>api.manageCircle(circleId,'rotate'),'Invitation code refreshed.')}/>
    <Action label="Delete circle" theme={theme} disabled={disabled} onPress={()=>{setEditor({kind:'deleteCircle'});setConfirmation('');}}/>
    {editor?.kind==='deleteCircle'&&<><Copy theme={theme}>This removes the circle and shared votes for every member.</Copy><Field label="Type DELETE to confirm" value={confirmation} onChange={setConfirmation} maxLength={6} theme={theme} disabled={disabled}/><Action label="Delete this circle permanently" theme={theme} primary disabled={disabled||confirmation!=='DELETE'} onPress={()=>void change(()=>api.manageCircle(circleId,'delete',confirmation),'Circle deleted.','circles','')}/><Action label="Keep circle" theme={theme} disabled={disabled} onPress={()=>setEditor(null)}/></>}
   </>:<><Copy theme={theme}>Leave this circle? Your personal answer history stays in your account.</Copy><Action label="Leave circle" theme={theme} disabled={disabled} onPress={()=>void change(()=>api.manageCircle(circleId,'leave'),'You left the circle.','circles','')}/></>}</Card>}
   <Action label={showPoll?'Close new vote':'Start a vote'} theme={theme} disabled={disabled} onPress={()=>setShowPoll(!showPoll)}/>
   {showPoll&&<Card theme={theme}><Field label="Vote question" value={question} onChange={setQuestion} maxLength={200} theme={theme} disabled={disabled}/>
    {options.map((value,index)=><Field key={index} label={`Option ${index+1}`} value={value} onChange={next=>setOptions(previous=>previous.map((old,i)=>i===index?next:old))} maxLength={100} theme={theme} disabled={disabled}/>)}
    {options.length<5&&<Action label="Add option" theme={theme} disabled={disabled} onPress={()=>setOptions([...options,''])}/>}{options.length>2&&<Action label="Remove last option" theme={theme} disabled={disabled} onPress={()=>setOptions(options.slice(0,-1))}/>}
    <Action label="Open vote" theme={theme} primary disabled={disabled||!question.trim()||options.some(o=>!o.trim())} onPress={()=>void change(()=>api.createPoll(circleId,question,options),'Vote opened.','circle',circleId,()=>{setQuestion('');setOptions(['','']);setShowPoll(false);})}/>
   </Card>}
   {!busy&&!detail.polls.length&&<Card theme={theme}><Copy theme={theme}>No votes yet. Start one when there is something to decide together.</Copy></Card>}
   {detail.polls.map(poll=><Card key={poll.id} theme={theme}><Copy theme={theme} kind="title">{poll.question}</Copy><Copy theme={theme} kind="muted">{poll.status==='open'?'Voting open':'Vote closed'} · {poll.totalVotes} votes</Copy>
    {poll.options.map(option=><Action key={option.id} label={`${option.label} · ${option.count} votes${poll.status==='closed'&&poll.winnerId===option.id?' · most votes':''}${poll.status==='closed'&&poll.tiedIds.includes(option.id)?' · tied':''}`} selected={poll.myVote===option.id} theme={theme} disabled={disabled||poll.status!=='open'} onPress={()=>void change(()=>api.vote(poll.id,option.id),'Your vote is saved.')}/>)}
    {poll.status==='closed'&&<Copy theme={theme} kind="muted">{!poll.hasVotes?'No votes were cast; there is no winner.':poll.tiedIds.length?'The result is tied; there is no single winner.':'One option received the most votes.'}</Copy>}
    {poll.status==='open'&&(poll.createdBy===userId||detail.circle.owner_id===userId)&&<Action label="Close vote and show result" theme={theme} disabled={disabled} onPress={()=>void change(()=>api.close(poll.id,circleId),'Vote closed.')}/>}
   </Card>)}<Copy theme={theme} kind="muted">Showing the latest {detail.pollLimit} votes at most.</Copy>
  </View>}
  {page==='earlier'&&<Action label="Preference timeline" theme={theme} disabled={busy} onPress={()=>void open('timeline')}/>}
  {page==='earlier'&&earlier&&<View style={ui.stack}>
   <Copy theme={theme} kind="muted">Review preferences learned from earlier decisions. You can change your mind.</Copy>
   {earlier.pattern&&<Card theme={theme}><Copy theme={theme} kind="title">Does this still fit?</Copy><Copy theme={theme}>{earlier.pattern.label}</Copy><Copy theme={theme} kind="muted">Based on {earlier.pattern.evidence} earlier evidence items.</Copy><Action label="Yes, it fits" theme={theme} disabled={disabled} onPress={()=>void change(()=>api.pattern(earlier.pattern!.prefKey,true,earlier.generation),'Earlier preference confirmed.')}/><Action label="No, clear this assumption" theme={theme} disabled={disabled} onPress={()=>void change(()=>api.pattern(earlier.pattern!.prefKey,false,earlier.generation),'Assumption cleared.')}/></Card>}
   {earlier.checks.map(check=><Card key={check.id} theme={theme}><Copy theme={theme} kind="title">{check.prompt}</Copy><Copy theme={theme}>{check.label}</Copy>{([['still_true','Still true'],['not_anymore','Not anymore'],['forget','Forget this preference']] as const).map(([answer,label])=><Action key={answer} label={label} theme={theme} disabled={disabled} onPress={()=>void change(()=>api.verify(check.id,answer),'Preference check saved.')}/>)}</Card>)}
   {!earlier.pattern&&!earlier.checks.length&&<Card theme={theme}><Copy theme={theme}>No earlier preferences need a check right now. New questions are in Today.</Copy></Card>}
  </View>}
  {(page==='beliefs'||page==='memories')&&<Card theme={theme}><Field label={page==='beliefs'?'Find an earlier belief':'Find a memory'} value={query} onChange={setQuery} maxLength={80} theme={theme} disabled={disabled}/><Action label="Search" theme={theme} disabled={disabled} onPress={()=>void open(page,'',query,0)}/></Card>}
  {page==='beliefs'&&beliefs&&<View style={ui.stack}><Copy theme={theme} kind="muted">Correct or forget older beliefs. Changes clear saved comparison settings and explanations; your journal stays.</Copy>
   {beliefs.nodes.map(node=><Card key={node.id} theme={theme}><Copy theme={theme} kind="title">{node.value??node.key.split('.').pop()?.replace(/-/g,' ')}</Copy><Copy theme={theme} kind="muted">{node.polarity} · {node.evidenceCount} evidence items</Copy>
    <Action label="Inspect evidence" theme={theme} disabled={disabled} onPress={()=>void inspect(node.id)}/><Action label="Correct belief" theme={theme} disabled={disabled||node.status!=='active'} onPress={()=>setEditor({kind:'belief',id:node.id,polarity:node.polarity as 'like'|'dislike'|'neutral',note:''})}/><Action label="Forget belief" theme={theme} disabled={disabled} onPress={()=>setEditor({kind:'forget',id:node.id})}/>
    {evidence?.id===node.id&&<View style={ui.stack}>{!evidence.rows.length&&<Copy theme={theme}>No recent evidence is available.</Copy>}{evidence.rows.map(row=><View key={row.id} style={ui.smallStack}><Copy theme={theme}>{row.kind.replace(/_/g,' ')} · {new Date(row.created_at).toLocaleDateString()}</Copy>{row.source_decision_id&&onOpenDecision&&<Action label="Open source decision" theme={theme} onPress={()=>onOpenDecision(row.source_decision_id!)}/>}</View>)}<Action label="Hide evidence" theme={theme} onPress={()=>setEvidence(null)}/></View>}
    {editor?.kind==='belief'&&editor.id===node.id&&<View style={ui.stack}>{(['like','dislike','neutral'] as const).map(polarity=><Action key={polarity} label={{like:'I like this',dislike:'I dislike this',neutral:'Neither / no preference'}[polarity]} theme={theme} selected={editor.polarity===polarity} disabled={disabled} onPress={()=>setEditor({...editor,polarity})}/>)}<Field label="Context (optional)" value={editor.note} onChange={note=>setEditor({...editor,note})} maxLength={300} theme={theme} disabled={disabled} multiline/><Action label="Save correction" theme={theme} primary disabled={disabled} onPress={()=>void change(()=>api.correctBelief(node.id,editor.polarity,editor.note,beliefs.generation),'Belief corrected.')}/><Action label="Cancel correction" theme={theme} disabled={disabled} onPress={()=>setEditor(null)}/></View>}
    {editor?.kind==='forget'&&editor.id===node.id&&<View style={ui.stack}><Copy theme={theme}>Stop using this belief and its supporting preference? Your journal remains.</Copy><Action label="Forget this belief" theme={theme} primary disabled={disabled} onPress={()=>void change(()=>api.forgetBelief(node.id,beliefs.generation),'Belief forgotten.')}/><Action label="Keep belief" theme={theme} disabled={disabled} onPress={()=>setEditor(null)}/></View>}
   </Card>)}{!busy&&!beliefs.nodes.length&&<Copy theme={theme}>No earlier beliefs match this page.</Copy>}
   <View style={ui.row}><Action label="Previous beliefs" theme={theme} disabled={disabled||offset===0} onPress={()=>void open('beliefs','',activeQuery,Math.max(0,offset-20))}/><Action label="Next beliefs" theme={theme} disabled={disabled||!beliefs.hasMore} onPress={()=>void open('beliefs','',activeQuery,offset+20)}/></View>
  </View>}
  {page==='memories'&&memories&&<View style={ui.stack}><Copy theme={theme} kind="muted">Facts, goals, habits and constraints you previously reviewed. Editing or deleting clears saved comparison settings and explanations; your journal stays.</Copy>
   {memories.memories.map(memory=><Card key={memory.id} theme={theme}><Copy theme={theme} kind="muted">{memory.kind}</Copy><Copy theme={theme}>{memory.content}</Copy><Action label="Edit memory" theme={theme} disabled={disabled} onPress={()=>setEditor({kind:'memory',id:memory.id,content:memory.content,type:memory.kind})}/><Action label="Delete memory" theme={theme} disabled={disabled} onPress={()=>setEditor({kind:'deleteMemory',id:memory.id})}/>
    {editor?.kind==='memory'&&editor.id===memory.id&&<View style={ui.stack}><Field label="Memory" value={editor.content} onChange={content=>setEditor({...editor,content})} maxLength={300} theme={theme} multiline disabled={disabled}/>{['fact','goal','habit','constraint'].map(type=><Action key={type} label={type} theme={theme} selected={editor.type===type} disabled={disabled} onPress={()=>setEditor({...editor,type})}/>)}<Action label="Save memory" theme={theme} primary disabled={disabled||!editor.content.trim()} onPress={()=>void change(()=>api.editMemory(memory.id,editor.content,editor.type,memories.generation),'Memory updated.')}/><Action label="Cancel edit" theme={theme} disabled={disabled} onPress={()=>setEditor(null)}/></View>}
    {editor?.kind==='deleteMemory'&&editor.id===memory.id&&<View style={ui.stack}><Copy theme={theme}>Delete this memory? It will no longer be available to Nudge.</Copy><Action label="Delete this memory" theme={theme} primary disabled={disabled} onPress={()=>void change(()=>api.deleteMemory(memory.id,memories.generation),'Memory deleted.')}/><Action label="Keep memory" theme={theme} disabled={disabled} onPress={()=>setEditor(null)}/></View>}
   </Card>)}{!busy&&!memories.memories.length&&<Copy theme={theme}>No memories match this page.</Copy>}
   <View style={ui.row}><Action label="Previous memories" theme={theme} disabled={disabled||offset===0} onPress={()=>void open('memories','',activeQuery,Math.max(0,offset-20))}/><Action label="Next memories" theme={theme} disabled={disabled||!memories.hasMore} onPress={()=>void open('memories','',activeQuery,offset+20)}/></View>
  </View>}
  {page==='outcomes'&&<View style={ui.row}><Action label="Decision activity" theme={theme} disabled={busy} onPress={()=>void open('activity')}/><Action label="30-day AI recap" theme={theme} disabled={busy} onPress={()=>void open('recap')}/></View>}
  {page==='outcomes'&&outcomes&&<View style={ui.stack}>
   <Copy theme={theme} kind="muted">From your latest {outcomes.sampleSize} decisions, up to {outcomes.sampleLimit}. These are descriptions of recorded outcomes, not predictions.</Copy>
   <Card theme={theme}><Copy theme={theme}>Average outcome: {outcomes.averageRating===null?'No ratings':outcomes.averageRating.toFixed(1)+' / 5'}</Copy><Copy theme={theme}>{outcomes.ratedCount} rated · {outcomes.reflectionCount} reflections</Copy><Copy theme={theme}>Regret recorded: {outcomes.regretRate===null?'Not answered':Math.round(outcomes.regretRate*100)+'%'}</Copy></Card>
   {outcomes.categories.map(category=><Card key={category.category} theme={theme}><Copy theme={theme} kind="title">{category.category}</Copy><Copy theme={theme}>{category.count} decisions · {category.average===null?'No ratings':category.average.toFixed(1)+' / 5 from '+category.rated+' ratings'}</Copy></Card>)}
   {outcomes.recent.length>0&&<Copy theme={theme} kind="title">Recent reflections</Copy>}{outcomes.recent.map(row=><Card key={row.id} theme={theme}><Copy theme={theme}>{row.question}</Copy>{row.chosen&&<Copy theme={theme} kind="muted">Chose: {row.chosen}</Copy>}<Copy theme={theme}>{row.rating===null?'Not rated':row.rating+' / 5'}{row.regret===true?' · regret recorded':''}</Copy>{onOpenDecision&&<Action label="Review this decision" theme={theme} onPress={()=>onOpenDecision(row.id)}/>}</Card>)}
   {!outcomes.sampleSize&&<Card theme={theme}><Copy theme={theme}>Save decisions and reflect on what happened to build an outcome history.</Copy></Card>}
  </View>}
  {page==='activity'&&outcomes?.activity&&<ActivityView activity={outcomes.activity} theme={theme}/>}
  {page==='activity'&&!busy&&!error&&outcomes&&!outcomes.activity&&<Card theme={theme}><Copy theme={theme}>The activity timeline is unavailable on this server. Outcome patterns are still available.</Copy></Card>}
  {page==='timeline'&&timeline&&<View style={ui.stack}>
   <Copy theme={theme} kind="muted">Up to {timeline.limit} recent earlier preferences, as of {dateInZone(timeline.asOf,timeline.timeZone)}. Time zone: {timeline.timeZone}. These are separate from Today's answers.</Copy>
   {!timeline.items.length&&<Card theme={theme}><Copy theme={theme}>No earlier preferences to show.</Copy></Card>}
   {timeline.items.map(item=><Card key={item.id} theme={theme}>
    <Copy theme={theme} kind="title">{item.label}</Copy><Copy theme={theme}>{({like:'Like',dislike:'Dislike',neutral:'No preference'} as const)[item.polarity]}</Copy>
    <Copy theme={theme} kind="muted">{item.reinforcedAt?'Reinforced':'Recorded'} {dateInZone(item.occurredAt,timeline.timeZone)}</Copy>
    <Copy theme={theme} kind="muted">{({explicit:'You stated this preference',inferred:'Earlier inference — open to correction',reflected:'From earlier recorded outcomes'} as const)[item.source]}</Copy>
   </Card>)}
   <Action label="Inspect or correct earlier memory" theme={theme} disabled={busy} onPress={()=>void open('beliefs')}/>
  </View>}
  {page!=='home'&&page!=='notes'&&page!=='recap'&&<Action label="Refresh" theme={theme} disabled={busy} onPress={()=>void reload()}/>}
 </View></ScrollView>;
}
const styles=StyleSheet.create({scroll:{flexGrow:1,padding:layout.space.lg,paddingTop:layout.space.sm,paddingBottom:layout.space.xl},content:{width:'100%',maxWidth:layout.maxWidth,alignSelf:'center',gap:layout.space.lg},activityTrack:{height:layout.space.sm,borderRadius:layout.radius.small,overflow:'hidden'},activityBar:{height:'100%',borderRadius:layout.radius.small}});
