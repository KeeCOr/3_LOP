import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('defeated pieces retreat to owned land or remain in place when no owned land exists', async () => {
  const source = await readFile(new URL('../src/lib/gameReducer.ts', import.meta.url), 'utf8');
  const helperStart = source.indexOf('function getDefeatedPiecePosition');
  const battleFinish = source.slice(source.indexOf("case 'BATTLE_FINISH'"), source.indexOf("case 'DEPLOY_TROOPS'"));

  assert.notEqual(helperStart, -1);
  const helper = source.slice(helperStart, source.indexOf('function getEnemyPieceOnTile', helperStart));
  assert.match(helper, /state\.tiles\.filter\(t => t\.owner === owner && t\.id !== excludedTileId\)/);
  assert.match(helper, /ownedTiles\.length === 0\s*\?\s*currentPosition/);
  assert.match(helper, /ownedTiles\[Math\.floor\(Math\.random\(\) \* ownedTiles\.length\)\]\.id/);

  assert.doesNotMatch(battleFinish, /position:\s*attackerPiece\.startTileIndex/);
  assert.doesNotMatch(battleFinish, /position:\s*defendingPiece\.startTileIndex/);
  assert.match(battleFinish, /getDefeatedPiecePosition\(stateAfterBattle,\s*attackerPiece\.owner,\s*attackerPiece\.position\)/);
  assert.match(battleFinish, /getDefeatedPiecePosition\(stateAfterBattle,\s*defendingPiece\.owner,\s*defendingPiece\.position,\s*battle\.defenderTileId\)/);
});
