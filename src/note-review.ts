import type {MemoryDraft,MemoryReview,MemorySuggestion} from './more-api';
export type NoteEntry=MemorySuggestion&{selected:boolean};
export function startNoteReview(draft:MemoryDraft):NoteEntry[]{return draft.suggestions.map(entry=>({...entry,selected:false}));}
/** Retain this exact intent after an uncertain save; never rebase its generation. */
export function noteReviewIntent(draft:MemoryDraft,entries:NoteEntry[],reviewed:boolean,requestId:string):MemoryReview{
 const memories=entries.filter(entry=>entry.selected).map(({kind,content})=>({kind,content:content.trim()}));
 if(!reviewed||!memories.length||memories.some(entry=>!entry.content||entry.content.length>300))throw new Error('Review and select the statements you want to save.');
 const keys=memories.map(entry=>`${entry.kind}:${entry.content.toLowerCase().replace(/\s+/gu,' ')}`);
 if(new Set(keys).size!==keys.length)throw new Error('Select each statement only once.');
 return {requestId,generation:draft.generation,reviewed:true,memories};
}
