import assert from 'node:assert/strict';
import test from 'node:test';
import { getEventResultInfo } from '../src/lib/eventResultInfo.mjs';

test('골드 카드는 자원 변화와 다음 사용 판단을 분리한다', () => {
  const info = getEventResultInfo({ kind: 'gold', amount: 400 });
  assert.deepEqual(info, { area: '자원', change: '골드 +400', next: '병력·건물·통행 대비 중 어디에 쓸지 정하세요.' });
});

test('병력 카드는 세력 변화로 표시한다', () => {
  const info = getEventResultInfo({ kind: 'troops', amount: 5 });
  assert.equal(info.area, '세력');
  assert.match(info.change, /\+5명/);
});

test('주둔군과 영토 초기화는 지도 변화로 표시한다', () => {
  assert.equal(getEventResultInfo({ kind: 'garrison_reinforce', amount: 8 }).area, '지도');
  assert.equal(getEventResultInfo({ kind: 'reset_land' }).area, '지도');
});

test('이동 선택 카드는 확정 전 선택임을 설명한다', () => {
  const info = getEventResultInfo({ kind: 'move_to_tile' });
  assert.equal(info.area, '이동');
  assert.match(info.change, /선택 해금/);
});

test('알 수 없는 효과는 결과를 지어내지 않고 재확인을 요청한다', () => {
  const info = getEventResultInfo({ kind: 'unknown' });
  assert.equal(info.area, '상태');
  assert.match(info.next, /다시 확인/);
});
