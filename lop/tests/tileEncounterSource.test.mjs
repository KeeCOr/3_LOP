import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('landing on an enemy piece forces battle unless that piece is on its own land', async () => {
  const source = await readFile(new URL('../src/lib/gameReducer.ts', import.meta.url), 'utf8');
  const landing = source.slice(source.indexOf('function handleTileLanding'), source.indexOf('function applyEventCardEffect'));

  assert.match(source, /function getEnemyPieceOnTile/);
  assert.match(landing, /const enemyPiece = getEnemyPieceOnTile\(state,\s*tileId,\s*owner,\s*_pieceId\)/);
  assert.match(landing, /if \(enemyPiece && tile\.owner !== enemyPiece\.owner\) \{/);
  assert.match(landing, /return executeBattle\(state,\s*tileId\)/);
});

test('paid troop production directly onto a landed tile is removed', async () => {
  const reducer = await readFile(new URL('../src/lib/gameReducer.ts', import.meta.url), 'utf8');
  const buildModal = await readFile(new URL('../src/components/BuildModal.tsx', import.meta.url), 'utf8');

  assert.doesNotMatch(reducer, /tileId\?: number/);
  assert.doesNotMatch(reducer, /action\.tileId !== undefined/);
  assert.doesNotMatch(reducer, /garrison: addToComp\(t\.garrison, action\.troopType, canBuy\)/);
  assert.doesNotMatch(buildModal, /BUY_TROOPS/);
});
