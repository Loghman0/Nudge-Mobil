import {resolveLocalReminderTime} from './core/reminder-local-time';
export type LocalReminderParts={year:number;month:number;day:number;hour:number;minute:number};
export function reminderParts(date:Date):LocalReminderParts{return {year:date.getFullYear(),month:date.getMonth()+1,day:date.getDate(),hour:date.getHours(),minute:date.getMinutes()};}
export function resolveReminder(parts:LocalReminderParts,now=Date.now()):{dueAt?:string;error?:string}{
 const values=[parts.year,parts.month,parts.day,parts.hour,parts.minute];
 if(!values.every(Number.isInteger)||parts.year<2000||parts.year>9999)return {error:'Choose a valid date and time.'};
 const pad=(value:number)=>String(value).padStart(2,'0');
 const resolved=resolveLocalReminderTime(`${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`);
 if(!resolved.value)return {error:resolved.error};
 const instant=Date.parse(resolved.value);
 if(instant<=now)return {error:'Choose a time in the future.'};
 if(instant>now+365*86400000)return {error:'Choose a time within the next year.'};
 return {dueAt:resolved.value};
}
