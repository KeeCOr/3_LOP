# Lord of Poly — Steam 도전과제 정의

> Steam 도전과제 ID는 Steamworks 파트너 페이지 > 도전과제 관리에서 등록 후 아래 ID와 동일하게 설정.

---

## 도전과제 목록 (15개)

| ID | 이름 | 설명 | 달성 조건 | 아이콘 |
|----|------|------|---------|-------|
| `FIRST_VICTORY` | 첫 승리 | 첫 번째 대국에서 승리하다 | 첫 승리 시 | 트로피 |
| `LAND_RUSH` | 땅 욕심 | 한 판에 5개 이상의 땅을 점령하다 | 보유 땅 5개 이상 동시 달성 | 깃발 |
| `ALL_IN` | 올인 | 남은 골드를 전부 병력에 투자하고 이기다 | 골드 0인 상태로 승리 | 동전 |
| `LUCKY_DRAW` | 행운아 | 한 판에 찬스 카드를 3회 연속 유리하게 뽑다 | 3연속 긍정 찬스 이벤트 | 클로버 |
| `IRON_FORT` | 철벽 | 한 번도 땅을 빼앗기지 않고 승리하다 | 승리까지 점령지 손실 0 | 방패 |
| `MERCHANT_KING` | 상인왕 | 상점을 5회 이용하다 | 상점 방문 누적 5회 | 금화 |
| `WARLORD` | 전쟁광 | 한 판에 전투를 10회 이상 치르다 | 전투 횟수 10회 | 검 |
| `COMEBACK` | 역전극 | 골드 50 이하에서 역전하여 승리하다 | 골드 ≤50 상태에서 최종 승리 | 화살 |
| `TAX_EVADER` | 세금 면제 | 세금 칸에서 면제를 2회 받다 | 세금 면제 이벤트 2회 | 서류 |
| `SPEED_RUN` | 스피드런 | 10턴 이내에 승리하다 | 10턴 이하 승리 | 시계 |
| `TROOP_MASTER` | 병력의 신 | 한 판에 총 50명 이상의 병력을 모집하다 | 누적 병력 수 50 | 군기 |
| `MONOPOLIST` | 독점왕 | 보드 위의 모든 땅을 동시에 점유하다 | 전체 8개 땅 동시 보유 | 왕관 |
| `ENEMY_BROKE` | 파산 선고 | 상대방을 한 번에 파산시키다 | 상대 골드를 한 전투에서 0으로 만들기 | 망치 |
| `VETERAN` | 백전노장 | 총 10판을 완료하다 | 누적 게임 수 10 | 별 |
| `POLYGLOT` | 폴리글랏 | 영어 설정으로 게임을 완료하다 | 영어 언어 설정 상태로 승리 | 지구 |

---

## 도전과제 ID → 트리거 위치 (개발 참고용)

```
FIRST_VICTORY     → 게임 승리 처리 함수 (GameResult: WIN)
LAND_RUSH         → 땅 점령 처리 후 보유 땅 수 체크
ALL_IN            → 게임 종료 시 골드 == 0 && 승리 체크
LUCKY_DRAW        → 찬스 카드 처리 (연속 긍정 카운터)
IRON_FORT         → 게임 종료 시 점령지 손실 카운터 == 0
MERCHANT_KING     → 상점 방문 처리 (누적 카운터)
WARLORD           → 전투 처리 (누적 카운터)
COMEBACK          → 게임 종료 시 골드 히스토리 최저점 ≤ 50 && WIN
TAX_EVADER        → 세금 면제 이벤트 처리 (카운터)
SPEED_RUN         → 게임 종료 시 턴 수 ≤ 10 && WIN
TROOP_MASTER      → 병력 모집 처리 (누적 카운터)
MONOPOLIST        → 땅 점령 후 전체 보유 수 == 8 체크
ENEMY_BROKE       → 전투 후 상대 골드 == 0 체크
VETERAN           → 게임 종료 시 누적 게임 수 체크 (저장 필요)
POLYGLOT          → 게임 종료 시 현재 언어 설정 == 'en' && WIN
```

---

## 게임에서 도전과제 잠금 해제하는 법

```typescript
// React 게임 코드에서 — window.steamAchievement가 있을 때만 호출
function unlockAchievement(id: string) {
  if (typeof window !== 'undefined' && window.steamAchievement) {
    window.steamAchievement.unlock(id);
  }
}

// 예시: 첫 승리
unlockAchievement('FIRST_VICTORY');
```
