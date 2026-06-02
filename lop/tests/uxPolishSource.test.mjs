import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('TileActionModal previews combat and toll risk before committing', async () => {
  const source = await readFile(new URL('../src/components/TileActionModal.tsx', import.meta.url), 'utf8');

  assert.match(source, /getBattleOutlook/);
  assert.match(source, /getTollRisk/);
  assert.match(source, /battleOutlook/);
  assert.match(source, /tollRisk/);
});

test('Board renders a center turn summary in the empty board space', async () => {
  const source = await readFile(new URL('../src/components/Board.tsx', import.meta.url), 'utf8');

  assert.match(source, /CenterTurnSummary/);
  assert.match(source, /getTurnActionInfo/);
  assert.match(source, /gridRow:\s*'2 \/ span 2'/);
  assert.match(source, /gridColumn:\s*'2 \/ span 3'/);
});

test('BoardTile supports actionable candidate and dimmed states', async () => {
  const source = await readFile(new URL('../src/components/BoardTile.tsx', import.meta.url), 'utf8');

  assert.match(source, /isActionCandidate/);
  assert.match(source, /isDimmed/);
  assert.match(source, /ring-cyan-300/);
  assert.match(source, /opacity-45/);
});

test('BoardTile shows a prominent bottom toll strip on occupied land', async () => {
  const source = await readFile(new URL('../src/components/BoardTile.tsx', import.meta.url), 'utf8');

  assert.match(source, /occupiedTollStrip/);
  assert.match(source, /점령 통행세/);
  assert.match(source, /currentToll/);
});

test('BoardTile shows a bottom toll strip on start tiles too', async () => {
  const source = await readFile(new URL('../src/components/BoardTile.tsx', import.meta.url), 'utf8');

  assert.match(source, /const showsBottomToll = isOwnedLand \|\| isHome/);
  assert.match(source, /\{\(isLand \|\| isHome\) && \(/);
  assert.match(source, /시작 통행세/);
});

test('BuildModal groups collect and skip actions together', async () => {
  const source = await readFile(new URL('../src/components/BuildModal.tsx', import.meta.url), 'utf8');

  assert.match(source, /primaryActionRow/);
  assert.match(source, /징집/);
  assert.match(source, /그냥 지나가기/);
  assert.doesNotMatch(source, /<button onClick=\{\(\) => dispatch\(\{ type: 'SKIP_BUILD' \}\)\}\s*className="w-full/);
});

test('BuildModal collect UI matches deploy modal and does not cover the full card', async () => {
  const source = await readFile(new URL('../src/components/BuildModal.tsx', import.meta.url), 'utf8');

  assert.match(source, /showCollect && piece/);
  assert.match(source, /max-w-\[440px\]/);
  assert.match(source, /징집 선택/);
  assert.match(source, /징집 후 영토/);
  assert.match(source, /징집 후 말/);
  assert.doesNotMatch(source, /absolute inset-0 bg-gray-900\/95/);
});

test('reference-inspired layout uses premium board game panels', async () => {
  const hud = await readFile(new URL('../src/components/HUD.tsx', import.meta.url), 'utf8');
  const board = await readFile(new URL('../src/components/Board.tsx', import.meta.url), 'utf8');
  const panel = await readFile(new URL('../src/components/TileDetailPanel.tsx', import.meta.url), 'utf8');
  const actionBar = await readFile(new URL('../src/components/TurnActionBar.tsx', import.meta.url), 'utf8');
  const tile = await readFile(new URL('../src/components/BoardTile.tsx', import.meta.url), 'utf8');

  assert.match(hud, /hudStatCard/);
  assert.match(board, /boardGameFrame/);
  assert.match(panel, /detailPanelFrame/);
  assert.match(actionBar, /phaseFlowStep/);
  assert.match(tile, /stoneTileFrame/);
});
