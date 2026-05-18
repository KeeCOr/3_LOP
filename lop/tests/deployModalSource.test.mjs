import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('DeployModal keeps the confirm button clickable when deploying zero troops', async () => {
  const source = await readFile(new URL('../src/components/DeployModal.tsx', import.meta.url), 'utf8');

  assert.equal(source.includes('disabled={totalDeploy === 0}'), false);
  assert.match(source, /배치 없이 지나가기|기본 병력만 두고 지나가기/);
});

test('DeployModal previews base, added, final, and remaining troop counts', async () => {
  const source = await readFile(new URL('../src/components/DeployModal.tsx', import.meta.url), 'utf8');

  assert.match(source, /현재 주둔/);
  assert.match(source, /추가 배치/);
  assert.match(source, /배치 후 주둔/);
  assert.match(source, /말에 남음/);
});

test('buying land opens the deploy phase for optional reinforcement', async () => {
  const source = await readFile(new URL('../src/lib/gameReducer.ts', import.meta.url), 'utf8');
  const buyCase = source.slice(source.indexOf("case 'CHOOSE_BUY_LAND'"), source.indexOf("case 'CHOOSE_PAY_TOLL'"));

  assert.match(buyCase, /activeDeployTileId:\s*action\.tileId/);
  assert.match(buyCase, /turnPhase:\s*'deploy'/);
});
