// Short mobile wording for the existing six versioned questions. IDs, choice
// meanings, and evidence rules stay unchanged; this is not a new personality test.
export const previewOrder=['food-snack','play-humor','time-free-day','creativity-postcard','rest-break','learning-puzzle'];
export const previewCopy:Record<string,{prompt:string;choices:string[]}>={
 'food-snack':{prompt:'Something new on the menu. What usually wins?',choices:['My favorite. I know I like it.','Something new. I’m curious.','The price matters most.','Whatever’s easiest.','What I’m hungry for today.']},
 'play-humor':{prompt:'What made you laugh recently?',choices:['Something completely unexpected.','A sharp or sarcastic comment.','Someone laughing at their own mistake.','An everyday thing we all recognize.','An inside joke only we understand.']},
 'time-free-day':{prompt:'A whole day with no plans. What usually happens?',choices:['One plan, then leave the rest open.','Plan it so the day doesn’t slip away.','See what I feel like doing.','Catch up on things I’ve put off.','Let someone suggest something.']},
 'creativity-postcard':{prompt:'You want to make something. How do you start?',choices:['Make a rough first attempt.','Start with one detail in mind.','Find an example to adapt.','Work out what I want to say first.','Put it off. Starting is the hard part.']},
 'rest-break':{prompt:'After a draining day, what comes first?',choices:['Something familiar, on my own.','Someone I’m comfortable with.','Something to do with my hands.','Go outside or move around.','Scroll, even when I meant to rest.']},
 'learning-puzzle':{prompt:'Last time a small task wouldn’t work, what did you do?',choices:['Kept trying different things.','Looked up instructions or an example.','Asked someone to help work it out.','Got frustrated and left it for later.','Tried a shortcut, even if it was messy.']},
};
