import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../src/components/', import.meta.url);
const read = name => readFileSync(new URL(name, root), 'utf8');

test('GoldAmount uses the generated gold icon with a screen-reader label', () => {
  const source = read('GoldAmount.tsx');
  assert.match(source, /resource-icons\/gold\.png/);
  assert.match(source, /aria-label={`골드 \$\{display\}`}/);
  assert.match(source, /aria-hidden="true"/);
});

test('purchase and ownership surfaces render gold amounts through the shared component', () => {
  for (const name of ['MercenaryModal.tsx', 'TileActionModal.tsx', 'BuildModal.tsx', 'ShopModal.tsx', 'ForcedSellModal.tsx']) {
    assert.match(read(name), /import GoldAmount from '\.\/GoldAmount'/, name);
    assert.match(read(name), /<GoldAmount amount=/, name);
  }
});

test('board counters and tile cost tooltips no longer render G or 골드 suffixes for dynamic amounts', () => {
  const board = read('Board.tsx');
  const tile = read('BoardTile.tsx');
  assert.match(board, /<GoldAmount amount=\{state\.player\.gold\}/);
  assert.doesNotMatch(board, /state\.player\.gold\}G/);
  assert.match(tile, /<GoldAmount amount=\{currentToll\}/);
  assert.doesNotMatch(tile, /currentToll\}골드/);
});
