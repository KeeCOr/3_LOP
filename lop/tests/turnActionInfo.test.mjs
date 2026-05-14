import test from 'node:test';
import assert from 'node:assert/strict';

import { getTurnActionInfo } from '../src/lib/turnActionInfo.mjs';

function stateWith(turnPhase, overrides = {}) {
  return {
    turnPhase,
    currentTurn: 'player',
    diceResult: null,
    selectedPieceId: null,
    activeTileAction: null,
    activeDeployTileId: null,
    pendingStopTiles: null,
    ...overrides,
  };
}

test('describes the roll phase as the dice step', () => {
  const info = getTurnActionInfo(stateWith('roll'), false);

  assert.equal(info.step, '1단계');
  assert.equal(info.title, '주사위 굴리기');
  assert.match(info.description, /이동 거리를 정합니다/);
  assert.equal(info.tone, 'ready');
});

test('describes movement animation as a waiting state', () => {
  const info = getTurnActionInfo(stateWith('tile_event'), true);

  assert.equal(info.title, '말 이동 중');
  assert.equal(info.tone, 'waiting');
});

test('describes forced sell as an urgent payment step', () => {
  const info = getTurnActionInfo(stateWith('forced_sell'), false);

  assert.equal(info.title, '통행료 정산');
  assert.equal(info.tone, 'danger');
  assert.match(info.description, /부족하면 영토를 매각/);
});
