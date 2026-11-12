import {useEffect,useState} from 'react';
import {View} from 'react-native';
import type {DecisionStatus} from '../decision-api';
import {SETTING_CATEGORIES,type SettingCategory} from '../settings-api';
import type {Theme} from '../theme';
import {Action,ActionMenu,Copy,ui} from './native-ui';
export interface JournalFilterValue{status?:DecisionStatus;category?:SettingCategory}
export const journalStatusLabel={open:'Still deciding',decided:'Choice made',reflected:'Reflected on',abandoned:'Set aside'} as const;
export const categoryLabel=(category:SettingCategory)=>category[0].toUpperCase()+category.slice(1);
export function JournalFilters({visible,value,onClose,onApply,theme,disabled}:{visible:boolean;value:JournalFilterValue;onClose:()=>void;onApply:(value:JournalFilterValue)=>void;theme:Theme;disabled:boolean}){
 const [draft,setDraft]=useState(value);
 useEffect(()=>{if(visible)setDraft(value);},[visible,value.status,value.category]);
 return <ActionMenu visible={visible} title="Filter journal" theme={theme} onClose={onClose} footer={<><Action label="Clear filters" theme={theme} disabled={disabled} onPress={()=>setDraft({})}/><Action label="Apply filters" theme={theme} primary disabled={disabled} onPress={()=>onApply(draft)}/></>}>
  <Copy theme={theme} kind="title">Progress</Copy>
  <View style={ui.row}>{([undefined,'open','decided','reflected','abandoned'] as const).map(status=><View key={status??'all'} style={{flexGrow:1,flexBasis:140}}><Action label={status?journalStatusLabel[status]:'Any progress'} theme={theme} disabled={disabled} selected={draft.status===status} onPress={()=>setDraft({...draft,status})}/></View>)}</View>
  <Copy theme={theme} kind="title">Category</Copy>
  <View style={ui.row}>{([undefined,...SETTING_CATEGORIES] as const).map(category=><View key={category??'all'} style={{flexGrow:1,flexBasis:140}}><Action label={category?categoryLabel(category):'Any category'} theme={theme} disabled={disabled} selected={draft.category===category} onPress={()=>setDraft({...draft,category})}/></View>)}</View>
 </ActionMenu>;
}
