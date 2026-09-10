import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function readBoardTileSource() {
  return readFile(new URL('../src/components/BoardTile.tsx', import.meta.url), 'utf8');
}

// Scope matching to the piece composition badge (emoji + count span rendered
// from `Object.entries(p.composition)`), not the unrelated garrison spans
// elsewhere in the file that share the same `TROOP_DATA[t].emoji` shape.
function getCompositionSpanBlock(source) {
  const anchorIdx = source.indexOf('Object.entries(p.composition)');
  assert.notEqual(anchorIdx, -1, 'expected the p.composition rendering block to exist in BoardTile.tsx');
  const spanStart = source.indexOf('<span key={t}', anchorIdx);
  assert.notEqual(spanStart, -1, 'expected a per-troop <span> inside the p.composition block');
  const spanEnd = source.indexOf('</span>', spanStart) + '</span>'.length;
  return source.slice(spanStart, spanEnd);
}

function getCompositionContainerBlock(source) {
  const anchorIdx = source.indexOf('Object.entries(p.composition)');
  assert.notEqual(anchorIdx, -1, 'expected the p.composition rendering block to exist in BoardTile.tsx');
  const containerStart = source.lastIndexOf('<div className=', anchorIdx);
  assert.notEqual(containerStart, -1, 'expected a wrapping <div> immediately around the p.composition block');
  const spanEnd = source.indexOf('</span>', anchorIdx);
  const containerEnd = source.indexOf('</div>', spanEnd) + '</div>'.length;
  return source.slice(containerStart, containerEnd);
}

test('piece composition emoji/count span uses a readable, compact font size', async () => {
  const source = await readBoardTileSource();
  const span = getCompositionSpanBlock(source);

  assert.doesNotMatch(span, /text-\[7px\]/, 'composition span must not use the illegibly small text-[7px] size');
  assert.match(span, /className="[^"]*text-\[(1[1-9]|[2-9]\d)px\][^"]*"/, 'composition span must use a readable class of at least text-[11px]');
  assert.match(span, /className="[^"]*leading-(none|tight)[^"]*"/, 'composition span must keep compact leading');
});

test('piece composition container keeps wrap/center alignment and adds two-row gap spacing', async () => {
  const source = await readBoardTileSource();
  const block = getCompositionContainerBlock(source);
  const openTagMatch = block.match(/^<div className="([^"]*)">/);
  assert.ok(openTagMatch, 'expected the composition container to be a <div> with a static className');

  const className = openTagMatch[1];
  assert.match(className, /flex-wrap/, 'composition container must retain flex-wrap so troop types can span two rows');
  assert.match(className, /justify-center/, 'composition container must retain center alignment');
  assert.match(className, /gap-x-\[\d+px\]/, 'composition container must define an explicit horizontal gap');
  assert.match(className, /gap-y-\[\d+px\]/, 'composition container must define an explicit vertical gap so two rows do not collide');
  assert.match(className, /leading-(none|tight)/, 'composition container must keep readable/compact leading');
});

test('globals.css prioritizes local Korean-friendly fonts in the body stack', async () => {
  const source = await readFile(new URL('../src/app/globals.css', import.meta.url), 'utf8');
  const bodyBlock = source.match(/body\s*\{[^}]*\}/);
  assert.ok(bodyBlock, 'expected a body rule in globals.css');

  const fontFamilyMatch = bodyBlock[0].match(/font-family:\s*([^;]+);/);
  assert.ok(fontFamilyMatch, 'expected a font-family declaration in the body rule');

  const stack = fontFamilyMatch[1];
  const pretendardIdx = stack.indexOf('Pretendard');
  const notoIdx = stack.indexOf('Noto Sans KR');
  const malgunIdx = stack.indexOf('Malgun Gothic');
  const sansSerifIdx = stack.indexOf('sans-serif');

  assert.notEqual(pretendardIdx, -1, 'body font stack must include Pretendard');
  assert.notEqual(notoIdx, -1, 'body font stack must include Noto Sans KR');
  assert.notEqual(malgunIdx, -1, 'body font stack must include Malgun Gothic');
  assert.notEqual(sansSerifIdx, -1, 'body font stack must fall back to a generic sans-serif');
  assert.ok(
    pretendardIdx < sansSerifIdx && notoIdx < sansSerifIdx && malgunIdx < sansSerifIdx,
    'Pretendard, Noto Sans KR, and Malgun Gothic must all precede the generic sans-serif fallback'
  );
});

test('outer Electron package keeps the LOP portable artifact naming and entrypoint', async () => {
  const pkgSource = await readFile(new URL('../../electron/package.json', import.meta.url), 'utf8');
  const pkg = JSON.parse(pkgSource);

  assert.equal(pkg.build?.portable?.artifactName, 'LOP_v${version}_portable.exe');

  await assert.doesNotReject(
    readFile(new URL('../../electron/main.js', import.meta.url), 'utf8'),
    'expected electron/main.js to exist'
  );
});
