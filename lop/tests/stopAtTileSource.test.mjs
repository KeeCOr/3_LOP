import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('passed owned-land stop prompt stores the unresolved final movement', async () => {
  const reducer = await readFile(new URL('../src/lib/gameReducer.ts', import.meta.url), 'utf8');
  const types = await readFile(new URL('../src/lib/gameTypes.ts', import.meta.url), 'utf8');

  assert.match(types, /pendingStopTiles:\s*Array<\{\s*tileId:\s*number;\s*finalTileId:\s*number;\s*steps:\s*number\s*\}>/);
  assert.match(reducer, /pendingStopTiles:\s*ownedPassedIds\.map\(id\s*=>\s*\(\{\s*tileId:\s*id,\s*finalTileId:\s*newPos,\s*steps\s*\}\)\)/);
});

test('stop and continue resolve movement after the player chooses', async () => {
  const source = await readFile(new URL('../src/lib/gameReducer.ts', import.meta.url), 'utf8');
  const stopCase = source.slice(source.indexOf("case 'STOP_AT_TILE'"), source.indexOf("case 'CONTINUE_MOVE'"));
  const continueCase = source.slice(source.indexOf("case 'CONTINUE_MOVE'"), source.indexOf("case 'BATTLE_FINISH'"));

  assert.match(stopCase, /resolvePieceMove\([^)]*action\.tileId[^)]*false/s);
  assert.match(continueCase, /pendingStopTiles\?\.\[0\]/);
  assert.match(continueCase, /resolvePieceMove\([^)]*pendingStop\.finalTileId[^)]*pendingStop\.steps[^)]*false/s);
});

test('stop modal previews the unresolved final destination', async () => {
  const source = await readFile(new URL('../src/components/StopAtTileModal.tsx', import.meta.url), 'utf8');

  assert.match(source, /const destination = tiles\[0\]\?\.finalTileId/);
  assert.match(source, /타일까지 계속 이동/);
});
