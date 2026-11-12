import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {LONG_BACKGROUND_MS,shouldReplayOpening} from '../src/launch-policy';

test('opening replays only after a full background interval',()=>{
  const start=5_000;
  assert.equal(shouldReplayOpening(null,start+LONG_BACKGROUND_MS),false);
  assert.equal(shouldReplayOpening(start,start-1),false);
  assert.equal(shouldReplayOpening(start,start+LONG_BACKGROUND_MS-1),false);
  assert.equal(shouldReplayOpening(start,start+LONG_BACKGROUND_MS),true);
});
