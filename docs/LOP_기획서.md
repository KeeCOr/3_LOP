# LOP 기획서 (Game Design Document)

> 현재 문서 기준 버전: 0.4.22  
> 최종 갱신: 2026-09-03

---

## 1. 게임 개요

| 항목 | 내용 |
|------|------|
| **타이틀** | Lord of Poly |
| **장르** | 전략 보드게임 (vs AI, 싱글플레이어) |
| **플랫폼** | Steam (Windows) 1차, 웹/모바일 2차 |
| **기술 스택** | Next.js (웹 빌드) + Electron 래퍼 |
| **타깃 세션** | 10~20분 |
| **연령 등급** | PEGI 3~7 / ESRB E / GRB 전체이용가 |

---

## 2. 문제 정의

전략 보드게임과 짧은 로그라이크 선택지를 좋아하는 플레이어가 10~20분 세션에서 빠르게 판단하고 싶을 때, 선택 결과와 다음 목표가 즉시 읽히지 않으면 보드 이동이 단순 주사위 굴림처럼 느껴져 이탈한다.

LOP는 Monopoly식 이동 감각과 Risk식 병력 판단을 짧은 PC 보드게임 루프로 압축해, 한 번의 선택이 캐릭터 성장 · 병력 구성 · 다음 장면의 유불리로 이어지는 게임이다.

---

## 3. 주 페르소나

- **이름/나이/직업**: 윤하겸, 25세, 전략 보드게임 팬
- **사용 맥락**: 퇴근 후 20분 안에 끝나는 전략 세션을 원한다. 규칙 설명이 긴 게임보다 선택 결과가 바로 보이는 게임을 선호한다.
- **선호**: 이동 → 이벤트 → 전투 → 보상 선택이 다음 턴의 판단으로 이어지는 구조.
- **이탈 포인트**: 선택 후 무엇이 좋아졌는지, 다음 목표가 무엇인지 보이지 않을 때.

---

## 4. 핵심 루프

```
현재 보드·목표 확인
  → 주사위/이동으로 칸 이벤트 조우
    → 전투 / 징집 / 건설 / 보상 / 강제 판매 처리
      → 골드·병력·영토 상태 변화
        → 다음 이동에서 더 나은 선택 시도
```

**하단 행동 바**: 선택 1회 → 결과 1회 → 다음 목표 1회 순서를 고정 노출해 첫 턴부터 "뭘 눌렀고 어떤 결과가 났으며 다음에 뭘 해야 하는지"가 같은 화면에서 읽힌다.

---

## 5. 게임 구성

| 구성 | 내용 |
|------|------|
| **이동** | 주사위 + 캐릭터 보너스로 이동 결과 결정 |
| **이벤트** | 전투, 징집, 건설, 보상, 강제 판매 등 짧은 모달 이벤트 |
| **전투** | 병력 수 × 병종 상성 계산, 결과 이유 텍스트 표시 |
| **성장** | 캐릭터 능력 + 영토 상태가 다음 턴 선택 근거가 됨 |
| **목표** | 상대 거점 압박, 골드/병력/영토 우위 구축 |

### 5.1 캐릭터

각 캐릭터는 이동 · 전투 · 영토 중 하나에 명확히 연결된 고유 능력을 가진다. 2회차 플레이에서 다른 캐릭터를 선택할 동기를 만드는 것이 핵심.

### 5.2 병종 상성

전투 결과 화면에 **승패 + 병종 상성 + 병력 차이 + 주요 손실 이유**를 함께 표시해 패배 납득도를 높인다.

---

## 6. UX 규칙

- 선택지는 한 화면에 5개 이하.
- 선택 직후 400ms 이내에 결과 요약 · 변화 수치 · 다음 추천 행동 표시.
- 전투 결과: 승패 외 병종 상성 · 병력 차이 · 주요 손실 이유 포함.
- 모바일/좁은 화면: 보드보다 현재 선택 모달과 다음 CTA 우선 표시.

---

## 7. MVP 가설

| 가설 | 확인 방법 |
|------|---------|
| 선택 결과와 다음 목표가 같은 화면에 나오면 첫 세션 이탈이 줄어든다. | 첫 3분 안에 다음 행동 CTA를 이해하는지 관찰. |
| 병종 상성 설명이 전투 결과에 붙으면 패배 납득도가 오른다. | 전투 후 재시도율과 결과 불만 피드백 비교. |
| 캐릭터 고유 능력이 이동/전투/영토 중 하나에 명확히 연결되면 재플레이 의도가 오른다. | 2회차에서 다른 캐릭터 선택 비율 측정. |

---

## 8. 기술 아키텍처

### 8.1 스택

| 계층 | 선택 | 역할 |
|------|------|------|
| 웹 앱 | Next.js | 게임 UI, 보드 렌더링 |
| 런타임 | React | 컴포넌트 기반 상태 관리 |
| 스타일 | Tailwind CSS | 반응형 레이아웃 |
| 데스크톱 | Electron | Windows 실행파일 래퍼 |
| Steam | steamworks.js | Steam 통합 (graceful fallback) |
| 빌드 | electron-builder | NSIS 인스톨러 + portable |

### 8.2 Electron 구조

```
lop/
├── electron/
│   ├── main.js       # BrowserWindow, ipcMain, Steam 초기화
│   └── preload.js    # contextBridge 노출
├── src/              # Next.js 앱
├── out/              # next build 출력 (electron이 serve)
└── package.json      # build 설정, NSIS 타깃
```

### 8.3 Steam 통합

- **앱 ID**: 480 (개발/테스트용 Spacewar ID) → 출시 전 실제 ID로 교체
- **Cloud Save**: `window.steamCloud.save(key, data)` → ipcMain → steamworks.js
- **Achievements**: `window.steamAchievement.unlock(id)` → ipcMain → Steam API
- `steam_appid.txt` 파일로 로컬 SDK 연결 (gitignore 예외 처리됨)

### 8.4 IPC 인터페이스

```javascript
// renderer에서 사용
window.steam.isAvailable()              // Boolean
window.steam.getUserName()              // String
window.steamCloud.save(key, data)       // Promise<Boolean>
window.steamCloud.load(key)             // Promise<any>
window.steamAchievement.unlock(id)      // Promise<Boolean>
window.steamAchievement.isUnlocked(id)  // Boolean
```

---

## 9. Steam 업적 목록

| ID | 이름 | 설명 | 조건 |
|----|------|------|------|
| FIRST_VICTORY | 첫 번째 승리 | 첫 번째 게임에서 승리 | 첫 승리 |
| LAND_RUSH | 토지 강점 | 10개 영토 동시 보유 | 영토 10개 |
| ALL_IN | 올인 | 병력 전부 걸고 승리 | 풀병력 전투 승리 |
| LUCKY_DRAW | 럭키 드로우 | 찬스 카드 20장 획득 | 누적 20장 |
| IRON_FORT | 철의 요새 | 방어 3회 연속 성공 | 연속 방어 승리 |
| MERCHANT_KING | 상인왕 | 골드 1000 보유 | 골드 1000 |
| WARLORD | 군벌 | 총 병력 50 이상 | 병력 50 |
| COMEBACK | 역전승 | 병력 10% 미만에서 역전 | 위기 역전 |
| TAX_EVADER | 세금 회피 | 강제 판매 3회 회피 | 이벤트 회피 |
| SPEED_RUN | 스피드런 | 15분 이내 승리 | 시간 제한 |
| TROOP_MASTER | 병력 지휘관 | 총 전투 100회 | 누적 전투 |
| MONOPOLIST | 독점가 | 전 영토 점령 | 완전 점령 |
| ENEMY_BROKE | 상대 파산 | 상대 골드 0으로 만들기 | 파산 유도 |
| VETERAN | 베테랑 | 게임 50회 완주 | 누적 플레이 |
| POLYGLOT | 폴리글롯 | 모든 캐릭터로 1회 이상 승리 | 캐릭터 다양성 |

---

## 10. 플랫폼 및 배포

### 10.1 Steam (1차)

- **빌드 타입**: NSIS 인스톨러 + Portable EXE
- **등급**: PEGI 3~7, ESRB E, GRB 전체이용가
- **스토어 에셋**: `docs/store-description.md` (영문), `docs/store-description-ko.md` (한국어)
- **개인정보처리방침**: `docs/privacy-policy.md`

### 10.2 IARC 설문 요약

| 항목 | 응답 |
|------|------|
| 폭력 | 경미 (병력 전투, 숫자/텍스트 표현) |
| 성적 콘텐츠 | 없음 |
| 공포 | 없음 |
| 도박 | 없음 (찬스 카드는 인게임 이벤트) |
| 온라인 기능 | 없음 (오프라인 싱글) |
| 인앱 구매 | 없음 |

---

## 11. 빌드, 테스트, 릴리스

```bash
# 웹 빌드
cd C:/Users/bada/3_LOP/lop
npm run build

# 개발용 Electron 실행
npm run electron

# Steam 포함 배포판 빌드
npm run electron:build:steam
```

**출력**: `release/LOP_v0.4.22_portable.exe`

---

## 12. 적용 리소스

| 파일 | 용도 |
|------|------|
| `docs/LOP_gameplay_preview.png` | 공유용 플레이 미리보기 |
| `docs/app_icon.png` | 앱 아이콘 참고 |
| `docs/splash.png` | 스플래시/대표 이미지 |
| `docs/steam-achievements.md` | Steam 업적 전체 목록 및 구현 가이드 |
| `docs/store-description.md` | Steam 스토어 영문 설명 |
| `docs/store-description-ko.md` | 한국어 스토어 설명 |
| `docs/privacy-policy.md` | 개인정보처리방침 |
| `docs/iarc-rating-guide.md` | IARC 설문 응답 가이드 |

---

## 13. 남은 리스크 & 다음 우선순위

1. **캐릭터 밸런스 확정** — 미기입 항목 확정해야 보류 판단 해제 가능.
2. **전투 납득도 검증** — 전투 결과 설명이 실제 플레이에서 충분히 납득되는지 플레이테스트.
3. **실제 Steam 앱 ID 발급** — Steamworks에서 앱 등록 후 480 → 실제 ID 교체.
4. **리더보드 연동** — 글로벌 점수 순위 (Steam Leaderboard API).
5. **빌드 산출물 정리** — dirty 빌드와 release 폴더 상태 정리해 배포 신뢰도 복구.

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-09-03 | Steam 통합, 업적 목록, 플랫폼 배포 섹션 추가; 전체 GDD 구조 개편 |
| 2026-07-27 | 하단 행동 바 폴리시 (선택→결과→다음 목표 3-step 고정 표시) 추가 |
| 2026-07-02 | mojibake 제거, UTF-8 GDD로 재작성 |
| 2026-06-30 | 시작 흐름 및 chance-card 결과 표시 개선 확인 |
