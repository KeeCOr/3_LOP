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

test('Board keeps progress notifications out of the board center', async () => {
  const source = await readFile(new URL('../src/components/Board.tsx', import.meta.url), 'utf8');

  assert.match(source, /progressToastFrame/);
  assert.match(source, /fixed right-4 top-24/);
  assert.doesNotMatch(source, /fixed inset-0 pointer-events-none flex items-center justify-center z-35/);
  assert.doesNotMatch(source, /fixed inset-0 pointer-events-none flex items-center justify-center z-30/);
  assert.doesNotMatch(source, /fixed inset-0 pointer-events-none flex items-center justify-center z-25/);
});

test('Electron window title uses the LOP game name', async () => {
  const source = await readFile(new URL('../../electron/main.js', import.meta.url), 'utf8');

  assert.match(source, /title:\s*'Land of Power'/);
  assert.doesNotMatch(source, /Pioneer/);
});

test('Electron serves the exported app over local HTTP instead of file URLs', async () => {
  const source = await readFile(new URL('../../electron/main.js', import.meta.url), 'utf8');

  assert.match(source, /createServer/);
  assert.match(source, /127\.0\.0\.1/);
  assert.match(source, /loadURL/);
  assert.doesNotMatch(source, /loadFile/);
});

test('BoardTile supports actionable candidate and dimmed states', async () => {
  const source = await readFile(new URL('../src/components/BoardTile.tsx', import.meta.url), 'utf8');

  assert.match(source, /isActionCandidate/);
  assert.match(source, /isDimmed/);
  assert.match(source, /ring-cyan-300/);
  assert.match(source, /opacity-45/);
});

test('BoardTile uses cropped board art and larger pieces', async () => {
  const source = await readFile(new URL('../src/components/BoardTile.tsx', import.meta.url), 'utf8');

  assert.match(source, /boardTileBackground/);
  assert.match(source, /lop-board-track-bg\.png/);
  assert.match(source, /500% 400%/);
  assert.match(source, /tileBgX/);
  assert.match(source, /tileBgY/);
  assert.match(source, /w-16 h-\[88px\]/);
});

test('BoardTile shows a prominent bottom toll strip on occupied land', async () => {
  const source = await readFile(new URL('../src/components/BoardTile.tsx', import.meta.url), 'utf8');

  assert.match(source, /occupiedTollStrip/);
  assert.match(source, /occupiedTollStrip/);
  assert.match(source, /currentToll/);
});

test('BoardTile shows a bottom toll strip on start tiles too', async () => {
  const source = await readFile(new URL('../src/components/BoardTile.tsx', import.meta.url), 'utf8');

  assert.match(source, /const showsBottomToll = isOwnedLand \|\| isHome/);
  assert.match(source, /\{showsBottomToll && \(/);
  assert.match(source, /showsBottomToll/);
});

test('BoardTile does not show a bottom strip for unoccupied land', async () => {
  const source = await readFile(new URL('../src/components/BoardTile.tsx', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /unoccupiedPriceStrip/);
  assert.doesNotMatch(source, /showsBottomToll \? occupiedTollStrip :/);
  assert.doesNotMatch(source, /landPrice\}G/);
});

test('BuildModal groups collect and skip actions together', async () => {
  const source = await readFile(new URL('../src/components/BuildModal.tsx', import.meta.url), 'utf8');

  assert.match(source, /primaryActionRow/);
  assert.match(source, /COLLECT_TROOPS/);
  assert.match(source, /SKIP_BUILD/);
  assert.doesNotMatch(source, /<button onClick=\{\(\) => dispatch\(\{ type: 'SKIP_BUILD' \}\)\}\s*className="w-full/);
});

test('BuildModal collect UI matches deploy modal and does not cover the full card', async () => {
  const source = await readFile(new URL('../src/components/BuildModal.tsx', import.meta.url), 'utf8');

  assert.match(source, /showCollect && piece/);
  assert.match(source, /max-w-\[440px\]/);
  assert.match(source, /showCollect/);
  assert.match(source, /collectAfterTile/);
  assert.match(source, /collectAfterPiece/);
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

test('EventModal presents chance cards as an illustrated board-game card', async () => {
  const source = await readFile(new URL('../src/components/EventModal.tsx', import.meta.url), 'utf8');

  assert.match(source, /eventCardBackdrop/);
  assert.match(source, /cardSceneFrame/);
  assert.match(source, /data-event-card-visual/);
  assert.match(source, /linear-gradient\(135deg, rgba\(245, 158, 11, 0\.24\)/);
});

test('EventModal explains the card consequence and why the next decision matters', async () => {
  const source = await readFile(new URL('../src/components/EventModal.tsx', import.meta.url), 'utf8');

  assert.match(source, /getEventResultExplanation/);
  assert.match(source, /resultExplanation/);
  assert.match(source, /data-event-result-explanation/);
  assert.match(source, /Next decision/);
  assert.match(source, /choose where to reposition/);
});

test('GDD documents the lop package build path before the Electron wrapper build', async () => {
  const gdd = await readFile(new URL('../../docs/LOP_기획서.md', import.meta.url), 'utf8');

  assert.match(gdd, /cd C:\/Development\/3_LOP\/lop && npm run build/);
  assert.match(gdd, /cd C:\/Development\/3_LOP\/electron && npm run dist/);
  assert.doesNotMatch(gdd, /cd C:\/Development\/3_LOP && npm run build/);
});
