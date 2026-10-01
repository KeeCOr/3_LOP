import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('defeated pieces retreat backward to their start base or nearest owned tile', async () => {
  const source = await readFile(new URL('../src/lib/gameReducer.ts', import.meta.url), 'utf8');
  const helperStart = source.indexOf('function getDefeatedPiecePosition');
  const battleFinish = source.slice(source.indexOf("case 'BATTLE_FINISH'"), source.indexOf("case 'DEPLOY_TROOPS'"));

  assert.notEqual(helperStart, -1);
  const helper = source.slice(helperStart, source.indexOf('function getEnemyPieceOnTile', helperStart));
  assert.match(helper, /startTileIndex: number/);
  assert.match(helper, /startTile\?\.owner === owner/);
  assert.match(helper, /backwardDistance/);
  assert.match(helper, /TOTAL_TILES/);
  assert.match(helper, /ownedTiles\.length === 0/);
  assert.doesNotMatch(helper, /Math\.random/);

  assert.doesNotMatch(battleFinish, /position:\s*attackerPiece\.startTileIndex/);
  assert.doesNotMatch(battleFinish, /position:\s*defendingPiece\.startTileIndex/);
  assert.match(battleFinish, /getDefeatedPiecePosition\(stateAfterBattle,\s*attackerPiece\.owner,\s*attackerPiece\.position,\s*attackerPiece\.startTileIndex\)/);
  assert.match(battleFinish, /getDefeatedPiecePosition\(stateAfterBattle,\s*defendingPiece\.owner,\s*defendingPiece\.position,\s*defendingPiece\.startTileIndex,\s*battle\.defenderTileId\)/);
});
