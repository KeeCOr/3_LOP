# LOP Next Improvement Instruction

Date: 2026-06-24

## Goal
Turn the current biggest project issue into a small, executable improvement batch. This file is intentionally scoped so the next worker can start without rereading the whole workspace audit.

## Instructions
1. Build the first-session choice chain around one clear loop: choose event, receive character/stat consequence, unlock the next scene.
2. Add result explanations so each short choice says what changed and why the next decision matters.
3. Verify desktop wrapper/build path and document the authoritative build command before the next release package.

## Completion Rules
- Do not include discarded projects in this batch.
- If gameplay, UI, systems, content, controls, build behavior, or project scope changes, update the project planning document and update log before build/release.
- If runtime source changes, run the nearest available validation and then perform the required build/package step from the project instructions.
- If a folder or asset looks ambiguous, document the decision instead of deleting it.

## 2026-06-30 Completion Note
- First-session chain verified: the start flow already moves goal -> setup -> character reveal -> board loop.
- Narrow supplement added: chance-card results now explain the immediate consequence and why the next decision matters.
- Desktop wrapper path documented: run `npm run build` in `C:/Development/3_LOP/lop`, then `npm run dist` in `C:/Development/3_LOP/electron`.

## 2026-09-18 전체 프로젝트 공통 완료 조건

1. **첫 5분 핵심 루프**: 시작 10초 안에 목표가 읽히고, 5분 안에 첫 판단→실행→결과→보상/손실→다음 목표가 한 번 완결되어야 한다.
2. **판단 전후 피드백**: 선택 전 예상 이득·위험·비용, 실행 직후 성공·실패·상태 변화, 결과 화면의 원인·변화·다음 점검 행동을 같은 흐름으로 제공한다. 정답을 자동 추천하지 않는다.
3. **출시 증거 패키지**: 테스트·빌드·첫 5분 수동 확인·대표 실행 화면·로딩/빈 상태/오류/저장 복귀·버전과 검증 날짜를 기록한다. 수행하지 않은 항목은 미검증으로 표시한다.

공통 기준 원문: `C:\Development\_workspace_docs\전체_프로젝트_공통_개선기준_2026-09-18.md`

## 2026-09-18 프로젝트별 고유 개선 3개
> 아래 세 항목은 이 프로젝트의 고유 우선순위다. 구현 후에만 완료로 표시한다.

1. 첫 3분을 선택 1회·결과 1회·다음 목표 1회로 축소
2. 선택 결과가 지도·세력·자원 중 무엇을 바꿨는지 즉시 표시
3. 장기 목표 하나와 이번 턴 목표 하나를 분리해 노출

## 2026-09-21 완료 및 다음 후보

- 완료: 장기 목표 `상대 전원 파산`과 이번 턴 목표를 하단 행동 바에서 분리했다.
- 완료: 구현 전 목표 화면을 `docs/design-references/2026-09-21-long-current-objective-strip.png`에 저장하고 레이아웃/컴포넌트/데이터/상태를 GDD에 기록했다.
- 검증 완료: 소스 테스트 32/32, Next.js 빌드, Electron 포터블 패키징, UI detector.
- 미검증: 실제 전투 보드 수동 시각 QA.
- 다음 후보: 선택 결과가 지도·세력·자원 중 무엇을 바꿨는지 즉시 요약하는 결과 피드백.
