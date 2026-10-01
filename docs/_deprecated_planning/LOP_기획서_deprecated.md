# LOP 기획서

문제 정의: 작은 선택이 다음 국면에 영향을 주는 게임을 원하는 플레이어가 단순 반복이 아닌 판단의 기록을 기대한다.

## 게임 소개
전략 선택과 성장 경로가 누적되는 실험형 전술 프로젝트.

LOP의 핵심 매력은 한 번의 선택이 다음 장면의 위험도, 보상, 성장 방향으로 이어지는 구조다. 이 문서는 처음 보는 사람에게 게임의 재미와 현재 방향을 빠르게 소개하기 위한 단일 기획서이며, 세부 변경 이력은 별도 업데이트 내역서에서 관리한다.

## 한 줄 소개
전략 선택과 성장 경로가 누적되는 실험형 전술 프로젝트.

## 핵심 루프
유저가 현재 전장의 정보를 읽고 선택을 하면 전투/운영 결과가 갱신되고, 그 보상과 손실 때문에 다시 다음 선택을 준비한다.

## 게임 플레이 예시
- 1단계: 플레이어가 LOP의 현재 목표, 보유 자원, 즉시 대응해야 할 위험을 확인한다.
- 2단계: 카드, 유닛, 배치, 명령, 이동 중 현재 상황에 맞는 핵심 행동을 선택한다.
- 3단계: 선택 결과가 전투, 운영, 보상, 손실로 즉시 갱신되고 다음 판단의 근거가 된다.
- 4단계: 획득한 보상이나 변화한 상태를 바탕으로 다음 선택을 준비하며 핵심 루프를 반복한다.
- 플레이 감각: 짧은 세션 안에서 상황 파악, 의미 있는 선택, 즉각적인 피드백, 다음 목표 제시가 끊기지 않는 흐름을 지향한다.

## 핵심 재미
- 읽기 쉬운 상황 판단: 지금 위험한 요소와 얻을 수 있는 보상이 한눈에 들어온다.
- 직접적인 선택 피드백: 선택 직후 전투, 점수, 자원, 성장 상태가 변해 손맛을 만든다.
- 누적되는 성장감: 반복 플레이가 단순 재시작이 아니라 다음 전략의 재료로 이어진다.

## 주요 시스템
- 핵심 선택 시스템: 현재 국면에서 가능한 행동을 5개 이하의 명확한 선택지로 제시한다.
- 위험/보상 피드백: 행동 전후의 이득, 손실, 위협 변화를 빠르게 보여준다.
- 성장과 해금: 세션 결과가 능력, 카드, 유닛, 건물, 장비, 스테이지 등 다음 플레이의 선택지를 넓힌다.
- 상태별 UX: 로딩, 빈 상태, 오류, 많은 데이터, 긴 텍스트 상황에서도 레이아웃이 무너지지 않도록 관리한다.
- 실행 안정성: 테스트와 빌드 산출물을 기준으로 현재 플레이 가능한 범위를 계속 확인한다.

## 게임 구성과 규칙 (GDD 통합)
- 통합 기준 문서: `superpowers/specs/2026-04-21-lop-design.md`, `superpowers/specs/2026-05-13-lop-layout-onboarding-redesign.md`
- 작성 기준: 16_PokerStrike_GDD처럼 화면 구조, 핵심 시스템, 진행/승패 규칙, UI/HUD, 미결 항목을 한 문서에서 바로 읽을 수 있게 정리한다.

### 화면/플레이 구조
- **1. 게임 개요** (superpowers/specs/2026-04-21-lop-design.md)
| 항목 | 내용 |
|------|------|
| 장르 | 전략 보드게임 (모노폴리 메카닉 참조, IP 무관) |
| 플랫폼 | 브라우저 (Next.js), 추후 Electron + 온라인 멀티 |
| 핵심 루프 | 주사위 굴림 → 말 선택 → 이동 → 칸 이벤트 → 전투/건설/구매 |
| 승리 조건 | 상대방을 파산(돈 0)시키기 |
| 패배 조건 | 돈이 0이 되면 탈락 |
- **3. 게임 플로우** (superpowers/specs/2026-04-21-lop-design.md)
  - 게임 시작 → 캐릭터 랜덤 선택 연출 → 보드 시작 (시작 배치)
  - ├→ 주사위 굴림 (2d4, 0~6 + 보너스)
  - ├→ 이동할 말 1개 선택
  - ├→ 선택한 말 이동 (애니메이션)
  - ├→ [이동 경로 통과] 내 영토 지나칠 때 → 병력 징집 선택 (PassCollect)
  - ├→ 중립 땅: 전투 또는 골드 지불로 구매
  - ├→ 내 땅: 건물 건설/업그레이드 여부 선택
- **4. 보드 레이아웃** (superpowers/specs/2026-04-21-lop-design.md)
  - 5×4 외곽 14칸 구성. 플레이어(P: index 0)와 AI(E: index 7)는 대각선 반대편에서 시작.
  - [P:왕도성문] [드래곤고원] [남부평원] [용병소] [황금계곡]
  - [북부고지] [운명의길:찬스]
  - [고갯길:찬스] [서쪽숲길]
  - [포호스강] [용병시장] [철광산맥] [동부항구] [E:변방요새]
| 칸 종류 | 수 | index | 설명 |
|---------|-----|-------|------|

### 핵심 시스템
- **2. 기술 스택** (superpowers/specs/2026-04-21-lop-design.md)
  - **Next.js 16 + React 19 + TypeScript**
  - **Tailwind CSS v4** — UI 스타일링
  - 상태관리: React `useReducer` (외부 라이브러리 없음)
  - **Electron 41** — 데스크탑 빌드 (portable exe)
  - 캐릭터 원화: `/public/player/` PNG 7종 (pirate, agitator, smuggler, swindler, warlock, cleric, general)
- **5.1 기본 능력치 & 고유 스킬** (superpowers/specs/2026-04-21-lop-design.md)
| 능력치 | 역할 |
|--------|------|
| `통솔력` | 데리고 다닐 수 있는 최대 병력 수 결정 |
| `고유 스킬` | 조건 충족 시 자동 발동되는 패시브 효과 |
  - 게임 시작 시 캐릭터 **7종** 중 랜덤 1개 선택. 공격/방어 배율은 모두 동일(1.0×), 통솔력과 고유 스킬로 차별화.
| 캐릭터 | 통솔력 | 고유 스킬 | 스킬 효과 | 발동 조건 |
|--------|--------|----------|----------|----------|
| 해적 | 45명 | 약탈 | 골드 +100 | 전투 승리 시 |
| 선동가 | 40명 | 선동 | 랜덤 병종 2명 말에 합류 | 랩 완주 시 |
| 종교인 | 40명 | 축복 | 보유 영토에 랜덤 병종 3명 분배 | 랩 완주 시 |
- **6.1 병종 (6종)** (superpowers/specs/2026-04-21-lop-design.md)
| 병종 | 이모지 | 공격 | 방어 | 가격 | 상성(강한 상대) | 비고 |
|------|--------|------|------|------|----------------|------|
| 검사 | ⚔️ | 1.1× | 1.0× | 60G | 창병 | 기본 균형형 |
| 궁사 | 🏹 | 1.5× | 0.5× | 80G | 검사·창병 | 고공격·저방어 |
| 기마병 | 🐎 | 1.4× | 0.7× | 120G | 검사·궁사 | 창병에 취약 |
| 창병 | 🔱 | 0.6× | 1.6× | 70G | 기마병 | 저공격·고방어 |
| 암살자 | 🥷 | 0.7× (말전투 3.8×) | 0.4× | — | — | 용병소 전용. 말 전투 시 극강 |
| 광전사 | 🪓 | 2.8× | 0.15× | — | — | 용병소 전용. 상성 없음. 고공격·극저방어 |
  - > 암살자·광전사는 용병소 계약으로만 획득. 상점 구매 불가.
  - **상성 보너스**: 아군이 적의 약점 병종을 보유할 때 공격력 보너스(+최대 60%, 구성 비율 비례) 자동 적용.
- **6.2 병력 운용** (superpowers/specs/2026-04-21-lop-design.md)
| 항목 | 내용 |
|------|------|
| 시작 병력 | 말마다 20명 (검사 15 + 궁사 5) |
| 최대 보유 | 말의 통솔력에 따라 결정 (사기꾼 25 ~ 장군 60) |
| 영토 자동 생산 | 한 바퀴 완주 시 내 영토마다 baseLapProduction + 병영 보너스 자동 증가 |
| 전투 점령 자동 배치 | 전투 승리 시 기본 5명(검사) 즉시 배치됨 |
| 이동 중 징집 | 내 땅을 지나칠 때 PassCollect 모달 → 원하는 만큼 말에 징집 가능 |
  - 말이 이동할 때 데리고 다니는 병력만 전투에 참여
  - 땅에 배치된 병력은 수비 전용
  - 내 땅 착지 시 말에서 땅으로 배치 또는 땅에서 말로 징집 가능

### 진행/승패 규칙
- **14.1 타겟 플랫폼 및 배포 방식** (superpowers/specs/2026-04-21-lop-design.md)
| 플랫폼 | 배포 방식 | 수익 모델 |
|--------|----------|----------|
| 모바일 웹 (PWA) | 무료 설치 | F2P + 보석 IAP |
| PC (Electron) | 무료 다운로드 | F2P + 보석 IAP |
| 추후: 앱스토어 (iOS/Android) | 무료 설치 | F2P + 보석 IAP + 시즌 패스 |
- **14.7 수익 목표 및 핵심 지표** (superpowers/specs/2026-04-21-lop-design.md)
| 지표 | 목표 |
|------|------|
| 전환율 (무료→유료) | 5~10% |
| ARPU (평균 유저 결제액) | ₩3,000~₩6,000 |
| ARPPU (결제 유저 평균) | ₩15,000~₩30,000 |
| 리텐션 (7일) | 30% 이상 |
| 리텐션 (30일) | 15% 이상 |

### UI/HUD/피드백
- **Error Handling And Edge Cases** (superpowers/specs/2026-05-13-lop-layout-onboarding-redesign.md)
  - If no tile is selected, the panel shows the current active tile or a compact board guide.
  - During animations, the action bar should indicate movement is in progress and avoid showing premature modal actions.
  - On narrow screens, the right panel collapses below the board or becomes a tabbed panel to avoid crushing the board.
  - Text must fit in buttons and panels without overlap on desktop and mobile.
  - Existing Korean copy should be reviewed while editing to avoid preserving mojibake where clean copy is needed.
- **Testing** (superpowers/specs/2026-05-13-lop-layout-onboarding-redesign.md)
  - Verification should include:
  - `npm run build` inside `lop`.
  - Manual browser check of the start flow.
  - Manual browser check of the play screen through at least roll, select piece, move, tile action, and one modal.
  - Responsive checks for desktop and narrow viewport.
  - Required final packaging commands from `AGENTS.md` after implementation:
  - frontend build from the correct app directory.

### 구현 메모/미결
- **Start And Onboarding Design** (superpowers/specs/2026-05-13-lop-layout-onboarding-redesign.md)
  - The start flow becomes three steps:
  1. Goal: a concise explanation of winning, losing, turns, and board ownership.
  2. Setup: player count and difficulty, with short descriptions for each option.
  3. Character reveal: random character selection with ability summary and a first-turn strategy hint.
  - The first play turn should include lightweight contextual hints in the action bar. These hints should disappear naturally after the player completes the relevant action, without creating a separate tutorial mode.

## MVP 가설
| 기능 | 검증할 가설 | 검증 방법 |
|------|-------------|-----------|
| 핵심 전투/운영 루프 | 플레이어는 한 판 안에서 선택 결과를 이해하면 다음 판을 자발적으로 시작한다. | 1회 플레이 후 재시작률 60% 이상 |
| 위험/보상 표시 | 위험과 보상이 동시에 보이면 선택 시간이 줄고 납득도가 오른다. | 주요 선택 평균 8초 이내, 결과 불만 피드백 20% 이하 |
| 성장 보상 | 보상이 다음 전략을 바꾸면 반복 플레이 피로가 낮아진다. | 3판 내 서로 다른 빌드 선택률 50% 이상 |

## 레퍼런스 분석
- 장르 기준 레퍼런스는 한 판 시작까지 3단계 이내, 첫 의미 있는 선택까지 30초 이내가 목표다.
- 적용 교훈: 규칙 설명보다 먼저 선택 가능한 상황을 보여주고, 결과 화면에서 다음 판의 개선 포인트를 바로 제안한다.

## 현재 개발 상태 예상 수치
- 완성 목표 대비 구현 체감도: 약 76%
- 첫 세션에서 핵심 루프가 전달될 가능성: 약 82%
- UI/리소스 일관성 체감: 약 72%
- 콘텐츠와 반복 플레이 분량 충족도: 약 72%
- 빌드/실행 안정성 기대치: 약 86%
- 해석 기준: 현재 문서, 최근 산출물 기록, 연결된 예시 이미지 유무를 기준으로 한 사전 추정치이며 실제 플레이 테스트 후 ±15%p 정도 보정이 필요하다.

- 첫 세션 평균 플레이 시간 8분 이상
- 첫 세션 내 2회차 진입률 55% 이상
- 핵심 선택 화면에서 무응답/이탈률 15% 이하

## 현재 구현 상태
- 이 문서는 2026-06-24 기준으로 현재 플레이 방향과 구현 체감 상태를 요약한다.
- 핵심 루프, 조작 원칙, 리소스 적용 현황, 빌드 기준은 프로젝트별 실제 구현과 산출물 기록을 기준으로 계속 보정한다.
- 세부 변경 이력은 별도 업데이트 내역서에서 관리하고, 본 기획서는 처음 보는 사람이 현재 방향을 빠르게 이해하는 공유 문서로 유지한다.
- 새 기능, 밸런스 변경, 리소스 교체, UX 개선이 들어가면 본문과 HTML 문서를 함께 갱신한다.

## 조작과 UX 원칙
- 주요 버튼은 44px 이상으로 유지하고, 화면당 CTA 강조색은 하나만 사용한다.
- 버튼/선택지는 한 번에 5개 이하로 노출해 판단 부담을 줄인다.
- 로딩, 빈 상태, 에러, 많은 데이터, 긴 텍스트 상태를 각각 별도 화면/컴포넌트로 확인한다.
- HUD 동일 레이어 요소는 겹치지 않게 배치하고, 겹침이 필요한 효과는 별도 depth/z-order를 쓴다.

## 적용 리소스
- 런타임에 쓰이는 대표 이미지와 UI 리소스는 프로젝트별 asset/public/Resources 경로를 기준으로 관리한다.
- 새 이미지가 필요할 때는 프로젝트 접두어를 포함한 lowercase kebab-case 파일명을 사용한다.
- 최종 런타임 비주얼은 PNG/WebP 등 비트맵 자산을 우선 사용하고, SVG 또는 코드 드로잉은 문서/임시 참조로만 남긴다.

## 공유용 이미지 미리보기
![LOP 공유용 예시 1](archive/LOP_gameplay_preview_v1.png)

![LOP 공유용 예시 2](LOP_01_플레이예시.png)

- docs/LOP_01_플레이예시.png
- docs/LOP_레퍼런스_layout-polish-check-0.4.8.png
- lop/public/building.png

## 빌드, 테스트, 릴리스
- 프로젝트별 엔진/에디터 빌드 절차를 따른다.
- 문서 전용 갱신에서는 실행 파일을 새로 생성하지 않았다.

## 남은 리스크와 다음 우선순위
- 첫 화면에서 게임의 목표와 다음 행동이 5초 안에 보이는지 확인한다.
- 주요 선택의 결과 예측과 실제 결과가 어긋나는 지점을 플레이 테스트로 수집한다.
- 기획서에 남아 있던 변경 이력성 내용은 업데이트 내역서로 계속 이동해 소개 문서의 밀도를 유지한다.
