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
