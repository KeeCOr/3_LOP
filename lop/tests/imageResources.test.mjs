import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const generatedAssets = [
  '../public/generated/lop-board-map-bg.png',
  '../public/generated/lop-start-hero-bg.png',
  '../public/generated/lop-battle-result-bg.png',
];

test('generated image resources exist in the public asset folder', async () => {
  for (const assetPath of generatedAssets) {
    await access(new URL(assetPath, import.meta.url));
  }
});

test('image resource list documents generated assets', async () => {
  const source = await readFile(new URL('../../docs/LOP_이미지_리소스_목록.md', import.meta.url), 'utf8');

  assert.match(source, /lop-board-map-bg\.png/);
  assert.match(source, /lop-start-hero-bg\.png/);
  assert.match(source, /lop-battle-result-bg\.png/);
});

test('generated images are wired into main gameplay UI', async () => {
  const start = await readFile(new URL('../src/components/StartScreen.tsx', import.meta.url), 'utf8');
  const board = await readFile(new URL('../src/components/Board.tsx', import.meta.url), 'utf8');
  const battle = await readFile(new URL('../src/components/BattleModal.tsx', import.meta.url), 'utf8');
  const gameOver = await readFile(new URL('../src/components/GameOver.tsx', import.meta.url), 'utf8');

  assert.match(start, /lop-start-hero-bg\.png/);
  assert.match(board, /lop-board-map-bg\.png/);
  assert.match(battle, /lop-battle-result-bg\.png/);
  assert.match(gameOver, /lop-battle-result-bg\.png/);
});
