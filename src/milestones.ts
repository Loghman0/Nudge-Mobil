const steps=[6,10,25,50,100,250,500,1000] as const;
/** Only newly crossed distinct-answer counts; edits and exclusions do not earn repeats. */
export function nextMilestone(previous:number,current:number):number|null{
 if(!Number.isSafeInteger(previous)||!Number.isSafeInteger(current)||previous<0||current<=previous)return null;
 return [...steps].reverse().find(step=>step>previous&&step<=current)??null;
}
