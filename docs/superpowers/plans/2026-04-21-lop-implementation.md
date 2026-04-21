# LOP (Land of Power) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모노폴리 기반 전략 보드게임 — 주사위 이동, 중립 병력 점령, 자동 전투 시뮬레이션, AI 상대, 건물/경제 시스템을 갖춘 싱글플레이어 웹 게임을 Next.js로 구현한다.

**Architecture:** React `useReducer`로 단일 GameState를 관리하고 모든 게임 로직을 순수 함수로 분리한다. UI 컴포넌트는 상태를 읽기만 하고 dispatch로만 상태를 변경한다. AI도 동일한 dispatch를 사용한다.

**Tech Stack:** Next.js 14, React, TypeScript, Tailwind CSS

---

## 파일 구조

```
src/
  app/
    page.tsx              ← Game 컴포넌트 렌더링
    globals.css
    layout.tsx
  components/
    Game.tsx              ← phase 분기 (start/board/gameover)
    StartScreen.tsx       ← 난이도 + 캐릭터 선택
    Board.tsx             ← 14칸 보드 렌더링
    BoardTile.tsx         ← 개별 타일 (아이콘, 소유자 색상, 병력 수)
    HUD.tsx               ← 플레이어/AI 자원 현황
    DiceRoller.tsx        ← 주사위 굴림 UI
    PieceSelector.tsx     ← 이동할 말 선택 UI
    BattleModal.tsx       ← 전투 시뮬레이션 모달
    TileActionModal.tsx   ← 착지 후 행동 선택 (전투/구매/통행세)
    DeployModal.tsx       ← 점령 후 병력 배치 UI
    ShopModal.tsx         ← 상점 (병력/말/장비)
    BuildModal.tsx        ← 건물 건설/업그레이드
    EventModal.tsx        ← 찬스/커뮤니티 카드
    GameOver.tsx          ← 승패 화면
  lib/
    gameTypes.ts          ← 모든 타입/인터페이스
    gameData.ts           ← 정적 데이터 (캐릭터, 장비, 카드, 건물)
    boardLayout.ts        ← 14칸 정의 및 좌표
    gameReducer.ts        ← 메인 reducer + 초기 state
    battleEngine.ts       ← 전투 계산 순수 함수
    economyUtils.ts       ← 임대료, 파산, 골드 계산
    aiEngine.ts           ← AI 의사결정
```

---

## Task 1: 프로젝트 초기화 + 타입 정의

**Files:**
- Create: `src/lib/gameTypes.ts`
- Modify: `package.json` (Next.js 프로젝트 생성)

- [ ] **Step 1: Next.js 프로젝트 생성**

```bash
cd "c:/Users/오진우/OneDrive - 스토익엔터테인먼트/바탕 화면/게임개발/3_LOP"
npx create-next-app@latest lop --typescript --tailwind --eslint --app --src-dir --no-import-alias
cd lop
```

- [ ] **Step 2: `src/lib/gameTypes.ts` 생성**

```typescript
export type GamePhase = 'start' | 'board' | 'gameover';
export type TurnPhase =
  | 'roll'
  | 'select_piece'
  | 'tile_event'
  | 'battle'
  | 'deploy'
  | 'build'
  | 'shop'
  | 'event_card'
  | 'end_turn';

export type TileType = 'start_p' | 'start_e' | 'land' | 'shop' | 'tax' | 'chance' | 'community';
export type Owner = 'player' | 'ai' | 'neutral' | null;
export type BuildingType = 'vault' | 'barracks' | 'fort';
export type CharacterType = 'general' | 'knight' | 'merchant' | 'scout';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type EquipmentType = 'sword' | 'armor' | 'banner' | 'boots';

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  attackBonus: number;   // 곱연산: 1.2 = +20%
  defenseBonus: number;
  commandBonus: number;  // 최대 병력 추가
  moveBonus: number;     // 주사위 +N
  price: number;
}

export interface Piece {
  id: string;
  owner: 'player' | 'ai';
  characterType: CharacterType;
  position: number;      // 타일 인덱스 0~13
  troops: number;        // 현재 보유 병력
  equipment: Equipment[];
  startTileIndex: number; // 이 말의 출발점 (0 = player, 7 = ai)
}

export interface Tile {
  id: number;
  type: TileType;
  owner: Owner;
  troops: number;        // 배치된 수비 병력
  building: BuildingType | null;
  buildingLevel: number; // 0 = 없음, 1~3
  landPrice: number;     // 골드 구매 시 가격 (중립 병력 수 × 80)
}

export interface BattleRound {
  attackerTroopsBefore: number;
  defenderTroopsBefore: number;
  attackerDamage: number;
  defenderDamage: number;
  log: string;
}

export interface BattleState {
  attackerPieceId: string;
  defenderTileId: number;
  attackerTroops: number;
  defenderTroops: number;
  attackerAttack: number;
  attackerDefense: number;
  defenderAttack: number;
  defenderDefense: number;
  rounds: BattleRound[];
  result: 'ongoing' | 'attacker_wins' | 'defender_wins';
}

export type CardEffectType =
  | { kind: 'gold'; amount: number; target: 'self' | 'all' }
  | { kind: 'troops'; amount: number }
  | { kind: 'attack_boost'; multiplier: number }
  | { kind: 'move_to_shop' }
  | { kind: 'tax_exempt' }
  | { kind: 'toll_exempt' }
  | { kind: 'toll_double'; laps: number }
  | { kind: 'build_discount'; laps: number }
  | { kind: 'reset_land' }
  | { kind: 'dice_bonus'; amount: number };

export interface EventCard {
  id: string;
  type: 'chance' | 'community';
  text: string;
  effect: CardEffectType;
}

export interface PlayerState {
  id: 'player' | 'ai';
  gold: number;
  hireCost: number;       // 다음 말 고용 비용
  pieceCount: number;
  attackBoostActive: boolean;
  taxExemptTurns: number;
  tollExemptTurns: number;
  tollDoubleLaps: number;
  buildDiscountLaps: number;
  diceBonusTurns: number;
  diceBonusAmount: number;
}

export interface GameState {
  phase: GamePhase;
  turnPhase: TurnPhase;
  currentTurn: 'player' | 'ai';
  difficulty: Difficulty;
  player: PlayerState;
  ai: PlayerState;
  pieces: Piece[];
  tiles: Tile[];
  diceResult: number | null;
  selectedPieceId: string | null;
  activeBattle: BattleState | null;
  activeEvent: EventCard | null;
  activeTileAction: number | null; // 착지한 타일 id
  activeDeployTileId: number | null;
  winner: 'player' | 'ai' | null;
  log: string[];
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/lib/gameTypes.ts
git commit -m "feat: add all game types"
```

---

## Task 2: 정적 데이터 정의

**Files:**
- Create: `src/lib/gameData.ts`
- Create: `src/lib/boardLayout.ts`

- [ ] **Step 1: `src/lib/gameData.ts` 생성**

```typescript
import type { CharacterType, Equipment, EventCard, BuildingType } from './gameTypes';

export const CHARACTERS: Record<CharacterType, {
  name: string;
  attack: number;
  defense: number;
  maxTroops: number;
  moveBonus: number;
  slots: number;
  description: string;
}> = {
  general:  { name: '장군',  attack: 1.3, defense: 0.8, maxTroops: 20, moveBonus: 0, slots: 3, description: '강력한 공격력' },
  knight:   { name: '기사',  attack: 1.1, defense: 1.2, maxTroops: 15, moveBonus: 1, slots: 3, description: '균형잡힌 수비형' },
  merchant: { name: '상인',  attack: 0.9, defense: 0.9, maxTroops: 12, moveBonus: 0, slots: 3, description: '경제 특화 (골드 +200 시작)' },
  scout:    { name: '척후',  attack: 1.0, defense: 1.0, maxTroops: 10, moveBonus: 2, slots: 3, description: '빠른 이동' },
};

export const EQUIPMENT: Equipment[] = [
  { id: 'sword',  name: '검',   type: 'sword',  attackBonus: 1.2, defenseBonus: 1.0, commandBonus: 0, moveBonus: 0, price: 400 },
  { id: 'armor',  name: '갑옷', type: 'armor',  attackBonus: 1.0, defenseBonus: 1.2, commandBonus: 0, moveBonus: 0, price: 400 },
  { id: 'banner', name: '군기', type: 'banner', attackBonus: 1.0, defenseBonus: 1.0, commandBonus: 8, moveBonus: 0, price: 350 },
  { id: 'boots',  name: '군화', type: 'boots',  attackBonus: 1.0, defenseBonus: 1.0, commandBonus: 0, moveBonus: 1, price: 300 },
];

export const BUILDING_DATA: Record<BuildingType, {
  name: string[];
  cost: number[];
  description: string;
  lapIncome?: number[];
  lapTroops?: number[];
  attackBonus?: number[];
  defenseBonus?: number[];
  toll: number[];
}> = {
  vault: {
    name: ['금고', '은행', '왕실 금고'],
    cost: [200, 500, 1000],
    description: '한 바퀴마다 골드 수입',
    lapIncome: [100, 250, 500],
    toll: [100, 200, 350],
  },
  barracks: {
    name: ['병영', '훈련소', '대병영'],
    cost: [200, 500, 1000],
    description: '한 바퀴마다 병력 생산',
    lapTroops: [3, 7, 15],
    toll: [100, 200, 350],
  },
  fort: {
    name: ['초소', '성벽', '요새'],
    cost: [200, 500, 1000],
    description: '수비 병력 강화',
    attackBonus: [1.15, 1.35, 1.6],
    defenseBonus: [1.1, 1.25, 1.5],
    toll: [200, 450, 900],
  },
};

export const BASE_LAND_PRICE = 300; // 건물 없는 땅 기본 구매가

export const TROOP_PRICE = 50;    // 병력 1명당 가격
export const LAP_TROOP_BONUS = 5; // 출발점 통과 시 병력 보너스
export const LAP_GOLD_BONUS = 200; // 출발점 통과 시 골드 보너스
export const TAX_RATE = 0.1;      // 세금 칸 세율

export const HIRE_COST_BASE = [0, 500, 1200, 2500, 5000];
export function nextHireCost(count: number): number {
  if (count < HIRE_COST_BASE.length) return HIRE_COST_BASE[count];
  return Math.floor(HIRE_COST_BASE[HIRE_COST_BASE.length - 1] * Math.pow(2, count - HIRE_COST_BASE.length + 1) + 300);
}

export const CHANCE_CARDS: EventCard[] = [
  { id: 'c1', type: 'chance', text: '황금 전리품! 골드 200 획득', effect: { kind: 'gold', amount: 200, target: 'self' } },
  { id: 'c2', type: 'chance', text: '지원군 도착! 병력 5명 지급', effect: { kind: 'troops', amount: 5 } },
  { id: 'c3', type: 'chance', text: '다음 전투 공격력 1.5배!', effect: { kind: 'attack_boost', multiplier: 1.5 } },
  { id: 'c4', type: 'chance', text: '군수물자 조달! 가장 가까운 상점으로 이동', effect: { kind: 'move_to_shop' } },
  { id: 'c5', type: 'chance', text: '귀족 면세 혜택! 다음 세금 칸 면제', effect: { kind: 'tax_exempt' } },
  { id: 'c6', type: 'chance', text: '외교 협상! 다음 통행세 면제 1회', effect: { kind: 'toll_exempt' } },
];

export const COMMUNITY_CARDS: EventCard[] = [
  { id: 'com1', type: 'community', text: '풍년! 모든 진영 골드 100 지급', effect: { kind: 'gold', amount: 100, target: 'all' } },
  { id: 'com2', type: 'community', text: '대규모 징집! 이 바퀴 통행세 2배', effect: { kind: 'toll_double', laps: 1 } },
  { id: 'com3', type: 'community', text: '건설 붐! 이 바퀴 건물 비용 50% 할인', effect: { kind: 'build_discount', laps: 1 } },
  { id: 'com4', type: 'community', text: '반란 발생! 무작위 땅 1곳 중립으로 전환', effect: { kind: 'reset_land' } },
  { id: 'com5', type: 'community', text: '순풍! 다음 턴 주사위 +2', effect: { kind: 'dice_bonus', amount: 2 } },
  { id: 'com6', type: 'community', text: '군사 원조! 모든 진영 병력 3명 지급', effect: { kind: 'troops', amount: 3 } },
];
```

- [ ] **Step 2: `src/lib/boardLayout.ts` 생성**

보드 인덱스는 시계방향: 0(P출발)→1→2→3→4(상단)→5→6(우측)→7(E출발)→8→9→10→11(하단)→12→13(좌측)→0

```typescript
import type { TileType } from './gameTypes';

export interface TileDefinition {
  index: number;
  type: TileType;
  label: string;
  gridRow: number;    // CSS grid row (1-4)
  gridCol: number;    // CSS grid col (1-5)
}

export const TILE_DEFINITIONS: TileDefinition[] = [
  { index: 0,  type: 'start_p',   label: '출발 P', gridRow: 1, gridCol: 1 },
  { index: 1,  type: 'land',      label: '땅',     gridRow: 1, gridCol: 2 },
  { index: 2,  type: 'land',      label: '땅',     gridRow: 1, gridCol: 3 },
  { index: 3,  type: 'shop',      label: '상점',   gridRow: 1, gridCol: 4 },
  { index: 4,  type: 'land',      label: '땅',     gridRow: 1, gridCol: 5 },
  { index: 5,  type: 'chance',    label: '찬스',   gridRow: 2, gridCol: 5 },
  { index: 6,  type: 'land',      label: '땅',     gridRow: 3, gridCol: 5 },
  { index: 7,  type: 'start_e',   label: '출발 E', gridRow: 4, gridCol: 5 },
  { index: 8,  type: 'land',      label: '땅',     gridRow: 4, gridCol: 4 },
  { index: 9,  type: 'land',      label: '땅',     gridRow: 4, gridCol: 3 },
  { index: 10, type: 'community', label: '커뮤니티', gridRow: 4, gridCol: 2 },
  { index: 11, type: 'land',      label: '땅',     gridRow: 4, gridCol: 1 },
  { index: 12, type: 'tax',       label: '세금',   gridRow: 3, gridCol: 1 },
  { index: 13, type: 'land',      label: '땅',     gridRow: 2, gridCol: 1 },
];

export const TOTAL_TILES = 14;
export const PLAYER_START = 0;
export const AI_START = 7;
export const LAND_INDICES = [1, 2, 4, 6, 8, 9, 11, 13];
export const SHOP_INDEX = 3;

export function nextPosition(current: number, steps: number): number {
  return (current + steps) % TOTAL_TILES;
}

export function didPassStart(from: number, steps: number, startIndex: number): boolean {
  // 출발점을 넘겼는지 (정확히 밟은 경우 포함)
  const to = (from + steps) % TOTAL_TILES;
  if (from < startIndex) return to >= startIndex || to < from;
  return to < startIndex && to >= 0;
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/lib/gameData.ts src/lib/boardLayout.ts
git commit -m "feat: add static game data and board layout"
```

---

## Task 3: 전투 엔진 (순수 함수)

**Files:**
- Create: `src/lib/battleEngine.ts`

- [ ] **Step 1: `src/lib/battleEngine.ts` 생성**

```typescript
import type { BattleState, BattleRound } from './gameTypes';

export const DAMAGE_RATE = 0.35; // 매 라운드 기본 데미지 비율

export function calcDamage(
  troops: number,
  attack: number,
  opponentDefense: number
): number {
  return Math.max(1, Math.ceil(troops * attack * DAMAGE_RATE / opponentDefense));
}

export function runBattleRound(state: BattleState): BattleState {
  if (state.result !== 'ongoing') return state;

  const atkDmg = calcDamage(state.attackerTroops, state.attackerAttack, state.defenderDefense);
  const defDmg = calcDamage(state.defenderTroops, state.defenderAttack, state.attackerDefense);

  const round: BattleRound = {
    attackerTroopsBefore: state.attackerTroops,
    defenderTroopsBefore: state.defenderTroops,
    attackerDamage: atkDmg,
    defenderDamage: defDmg,
    log: `공격 ${state.attackerTroops}명 → 적 ${atkDmg}명 전사 / 수비 ${state.defenderTroops}명 → 아군 ${defDmg}명 전사`,
  };

  const newAtkTroops = Math.max(0, state.attackerTroops - defDmg);
  const newDefTroops = Math.max(0, state.defenderTroops - atkDmg);

  let result: BattleState['result'] = 'ongoing';
  if (newAtkTroops <= 0 && newDefTroops <= 0) result = 'defender_wins'; // 동귀어진 = 수비 승
  else if (newAtkTroops <= 0) result = 'defender_wins';
  else if (newDefTroops <= 0) result = 'attacker_wins';

  return {
    ...state,
    attackerTroops: newAtkTroops,
    defenderTroops: newDefTroops,
    rounds: [...state.rounds, round],
    result,
  };
}

export function runFullBattle(initial: BattleState): BattleState {
  let state = initial;
  let maxRounds = 50;
  while (state.result === 'ongoing' && maxRounds-- > 0) {
    state = runBattleRound(state);
  }
  return state;
}

export function getBattleAttack(piece: { characterType: string; equipment: { attackBonus: number }[] }, buildingAttackBonus = 1): number {
  const charData = { general: 1.3, knight: 1.1, merchant: 0.9, scout: 1.0 } as Record<string, number>;
  const base = charData[piece.characterType] ?? 1.0;
  const equipBonus = piece.equipment.reduce((acc, e) => acc * e.attackBonus, 1);
  return base * equipBonus * buildingAttackBonus;
}

export function getBattleDefense(piece: { characterType: string; equipment: { defenseBonus: number }[] }, buildingDefenseBonus = 1): number {
  const charData = { general: 0.8, knight: 1.2, merchant: 0.9, scout: 1.0 } as Record<string, number>;
  const base = charData[piece.characterType] ?? 1.0;
  const equipBonus = piece.equipment.reduce((acc, e) => acc * e.defenseBonus, 1);
  return base * equipBonus * buildingDefenseBonus;
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/lib/battleEngine.ts
git commit -m "feat: add battle engine pure functions"
```

---

## Task 4: 경제 유틸리티

**Files:**
- Create: `src/lib/economyUtils.ts`

- [ ] **Step 1: `src/lib/economyUtils.ts` 생성**

```typescript
import type { Tile } from './gameTypes';
import { BUILDING_DATA, TAX_RATE } from './gameData';

export function getToll(tile: Tile, tollDouble = false): number {
  if (!tile.building || tile.buildingLevel === 0) return 50; // 건물 없는 내 땅 기본 통행세
  const data = BUILDING_DATA[tile.building];
  const base = data.toll[tile.buildingLevel - 1];
  return tollDouble ? base * 2 : base;
}

export function getLapIncome(tile: Tile): number {
  if (tile.building !== 'vault' || tile.buildingLevel === 0) return 0;
  return BUILDING_DATA.vault.lapIncome![tile.buildingLevel - 1];
}

export function getLapTroops(tile: Tile): number {
  if (tile.building !== 'barracks' || tile.buildingLevel === 0) return 0;
  return BUILDING_DATA.barracks.lapTroops![tile.buildingLevel - 1];
}

export function getBuildingAttackBonus(tile: Tile): number {
  if (tile.building !== 'fort' || tile.buildingLevel === 0) return 1;
  return BUILDING_DATA.fort.attackBonus![tile.buildingLevel - 1];
}

export function getBuildingDefenseBonus(tile: Tile): number {
  if (tile.building !== 'fort' || tile.buildingLevel === 0) return 1;
  return BUILDING_DATA.fort.defenseBonus![tile.buildingLevel - 1];
}

export function getBuildCost(tile: Tile, type: 'vault' | 'barracks' | 'fort', discount = false): number {
  const level = tile.building === type ? tile.buildingLevel : 0;
  if (level >= 3) return Infinity; // 최고 레벨
  const cost = BUILDING_DATA[type].cost[level];
  return discount ? Math.floor(cost * 0.5) : cost;
}

export function calcTax(gold: number): number {
  return Math.floor(gold * TAX_RATE);
}

export function isBankrupt(gold: number): boolean {
  return gold <= 0;
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/lib/economyUtils.ts
git commit -m "feat: add economy utility functions"
```

---

## Task 5: 게임 Reducer (초기 상태 + 핵심 액션)

**Files:**
- Create: `src/lib/gameReducer.ts`

- [ ] **Step 1: `src/lib/gameReducer.ts` 생성 (초기 상태 + 기본 액션)**

```typescript
import type { GameState, Piece, Tile, CharacterType, Difficulty } from './gameTypes';
import { LAND_INDICES, PLAYER_START, AI_START, nextPosition, didPassStart } from './boardLayout';
import { CHARACTERS, TROOP_PRICE, LAP_TROOP_BONUS, LAP_GOLD_BONUS, nextHireCost, CHANCE_CARDS, COMMUNITY_CARDS } from './gameData';
import { getToll, getLapIncome, getLapTroops, calcTax, getBuildCost } from './economyUtils';
import { runFullBattle, getBattleAttack, getBattleDefense, getBuildingAttackBonus, getBuildingDefenseBonus } from './battleEngine';

function createPiece(id: string, owner: 'player' | 'ai', characterType: CharacterType, startIndex: number): Piece {
  return { id, owner, characterType, position: startIndex, troops: 10, equipment: [], startTileIndex: startIndex };
}

function createInitialTiles(): Tile[] {
  const neutralTroopRanges: Record<number, [number, number]> = {
    1: [3, 6], 2: [3, 6], 4: [5, 10],
    6: [5, 10], 8: [3, 6], 9: [5, 10],
    11: [5, 10], 13: [3, 6],
  };
  return Array.from({ length: 14 }, (_, i) => {
    const range = neutralTroopRanges[i];
    const troops = range ? Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0] : 0;
    const landPrice = troops * 80;
    return { id: i, type: LAND_INDICES.includes(i) ? 'land' : i === 0 ? 'start_p' : i === 7 ? 'start_e' : i === 3 ? 'shop' : i === 12 ? 'tax' : i === 5 ? 'chance' : 'community', owner: troops > 0 ? 'neutral' : null, troops, building: null, buildingLevel: 0, landPrice } as Tile;
  });
}

export function createInitialState(characterType: CharacterType, difficulty: Difficulty): GameState {
  const merchantBonus = characterType === 'merchant' ? 200 : 0;
  return {
    phase: 'board',
    turnPhase: 'roll',
    currentTurn: 'player',
    difficulty,
    player: { id: 'player', gold: 1500 + merchantBonus, hireCost: 0, pieceCount: 1, attackBoostActive: false, taxExemptTurns: 0, tollExemptTurns: 0, tollDoubleLaps: 0, buildDiscountLaps: 0, diceBonusTurns: 0, diceBonusAmount: 0 },
    ai:     { id: 'ai',     gold: 1500,                 hireCost: 0, pieceCount: 1, attackBoostActive: false, taxExemptTurns: 0, tollExemptTurns: 0, tollDoubleLaps: 0, buildDiscountLaps: 0, diceBonusTurns: 0, diceBonusAmount: 0 },
    pieces: [createPiece('p0', 'player', characterType, PLAYER_START), createPiece('e0', 'ai', 'general', AI_START)],
    tiles: createInitialTiles(),
    diceResult: null,
    selectedPieceId: null,
    activeBattle: null,
    activeEvent: null,
    activeTileAction: null,
    activeDeployTileId: null,
    winner: null,
    log: [],
  };
}

export type GameAction =
  | { type: 'ROLL_DICE' }
  | { type: 'SELECT_PIECE'; pieceId: string }
  | { type: 'CHOOSE_FIGHT'; tileId: number }
  | { type: 'CHOOSE_BUY_LAND'; tileId: number }
  | { type: 'CHOOSE_PAY_TOLL'; tileId: number }
  | { type: 'BATTLE_NEXT_ROUND' }
  | { type: 'BATTLE_FINISH' }
  | { type: 'DEPLOY_TROOPS'; tileId: number; amount: number }
  | { type: 'BUILD'; tileId: number; buildingType: 'vault' | 'barracks' | 'fort' }
  | { type: 'SKIP_BUILD' }
  | { type: 'BUY_TROOPS'; pieceId: string; amount: number }
  | { type: 'BUY_PIECE'; characterType: CharacterType }
  | { type: 'BUY_EQUIPMENT'; pieceId: string; equipmentId: string }
  | { type: 'CLOSE_SHOP' }
  | { type: 'APPLY_EVENT_CARD' }
  | { type: 'END_TURN' };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {

    case 'ROLL_DICE': {
      const owner = state.currentTurn;
      const ownerState = state[owner];
      const bonus = ownerState.diceBonusTurns > 0 ? ownerState.diceBonusAmount : 0;
      const dice = Math.floor(Math.random() * 6) + 1 + bonus;
      return { ...state, diceResult: dice, turnPhase: 'select_piece' };
    }

    case 'SELECT_PIECE': {
      const piece = state.pieces.find(p => p.id === action.pieceId);
      if (!piece) return state;
      const dice = state.diceResult!;
      // 이동력 보너스 적용
      const charMoveBonus = CHARACTERS[piece.characterType].moveBonus;
      const equipMoveBonus = piece.equipment.reduce((acc, e) => acc + e.moveBonus, 0);
      const steps = dice + charMoveBonus + equipMoveBonus;
      const newPos = nextPosition(piece.position, steps);
      const owner = state.currentTurn;
      const passedStart = didPassStart(piece.position, steps, piece.startTileIndex);

      let newState = {
        ...state,
        pieces: state.pieces.map(p => p.id === piece.id ? { ...p, position: newPos } : p),
        selectedPieceId: piece.id,
        log: [...state.log, `${owner === 'player' ? '플레이어' : 'AI'} ${piece.id} → ${newPos}번 칸`],
      };

      // 출발점 통과 보상
      if (passedStart) {
        const lapIncome = state.tiles.filter(t => t.owner === owner).reduce((sum, t) => sum + getLapIncome(t), 0);
        const lapTroops = state.tiles.filter(t => t.owner === owner).reduce((sum, t) => sum + getLapTroops(t), 0);
        const maxTroops = CHARACTERS[piece.characterType].maxTroops + piece.equipment.reduce((a, e) => a + e.commandBonus, 0);
        newState = {
          ...newState,
          [owner]: { ...newState[owner], gold: newState[owner].gold + LAP_GOLD_BONUS + lapIncome },
          pieces: newState.pieces.map(p => p.id === piece.id ? { ...p, troops: Math.min(maxTroops, p.troops + LAP_TROOP_BONUS + lapTroops) } : p),
          log: [...newState.log, `출발점 통과! 골드 +${LAP_GOLD_BONUS + lapIncome}, 병력 +${LAP_TROOP_BONUS + lapTroops}`],
        };
      }

      // 타일 이벤트 처리
      return handleTileLanding(newState, newPos, piece.id);
    }

    case 'CHOOSE_FIGHT': {
      const piece = state.pieces.find(p => p.id === state.selectedPieceId)!;
      const tile = state.tiles.find(t => t.id === action.tileId)!;
      const owner = state.currentTurn;
      const atkBoost = state[owner].attackBoostActive ? 1.5 : 1;
      const battle = {
        attackerPieceId: piece.id,
        defenderTileId: tile.id,
        attackerTroops: piece.troops,
        defenderTroops: tile.troops,
        attackerAttack: getBattleAttack(piece) * atkBoost,
        attackerDefense: getBattleDefense(piece),
        defenderAttack: getBuildingAttackBonus(tile),
        defenderDefense: getBuildingDefenseBonus(tile),
        rounds: [],
        result: 'ongoing' as const,
      };
      return { ...state, activeBattle: battle, turnPhase: 'battle', activeTileAction: null };
    }

    case 'BATTLE_FINISH': {
      const battle = state.activeBattle!;
      const owner = state.currentTurn;
      const piece = state.pieces.find(p => p.id === battle.attackerPieceId)!;
      const finishedBattle = runFullBattle(battle);

      if (finishedBattle.result === 'attacker_wins') {
        // 점령 - 배치 모달로
        const newState = {
          ...state,
          activeBattle: finishedBattle,
          pieces: state.pieces.map(p => p.id === piece.id ? { ...p, troops: finishedBattle.attackerTroops } : p),
          activeDeployTileId: battle.defenderTileId,
          turnPhase: 'deploy' as const,
          log: [...state.log, `${owner} 전투 승리! ${battle.defenderTileId}번 땅 점령 가능`],
        };
        return { ...newState, activeBattle: null };
      } else {
        // 패배 - 귀환
        const newState = {
          ...state,
          activeBattle: null,
          pieces: state.pieces.map(p => p.id === piece.id ? { ...p, troops: 0, position: piece.startTileIndex } : p),
          turnPhase: 'end_turn' as const,
          log: [...state.log, `${owner} 전투 패배. ${piece.id} 귀환`],
        };
        return checkBankruptcy(newState);
      }
    }

    case 'DEPLOY_TROOPS': {
      const piece = state.pieces.find(p => p.id === state.selectedPieceId)!;
      const owner = state.currentTurn;
      const amount = Math.max(1, action.amount);
      const actualAmount = Math.min(amount, piece.troops);
      const newTiles = state.tiles.map(t => t.id === action.tileId
        ? { ...t, owner, troops: actualAmount }
        : t
      );
      const newPieces = state.pieces.map(p => p.id === piece.id ? { ...p, troops: p.troops - actualAmount } : p);
      return { ...state, tiles: newTiles, pieces: newPieces, activeDeployTileId: null, turnPhase: 'end_turn' };
    }

    case 'CHOOSE_BUY_LAND': {
      const tile = state.tiles.find(t => t.id === action.tileId)!;
      const owner = state.currentTurn;
      const cost = tile.landPrice || tile.troops * 80;
      if (state[owner].gold < cost) return state;
      const newTiles = state.tiles.map(t => t.id === action.tileId ? { ...t, owner } : t);
      return { ...state, tiles: newTiles, [owner]: { ...state[owner], gold: state[owner].gold - cost }, activeTileAction: null, activeDeployTileId: null, turnPhase: 'end_turn' };
    }

    case 'CHOOSE_PAY_TOLL': {
      const tile = state.tiles.find(t => t.id === action.tileId)!;
      const owner = state.currentTurn;
      const opponent = owner === 'player' ? 'ai' : 'player';
      const exempt = state[owner].tollExemptTurns > 0;
      const tollDouble = state[opponent].tollDoubleLaps > 0;
      const toll = exempt ? 0 : getToll(tile, tollDouble);
      let newState = {
        ...state,
        [owner]: { ...state[owner], gold: state[owner].gold - toll, tollExemptTurns: Math.max(0, state[owner].tollExemptTurns - 1) },
        [opponent]: { ...state[opponent], gold: state[opponent].gold + toll },
        activeTileAction: null,
        turnPhase: 'end_turn' as const,
        log: [...state.log, `통행세 ${toll}골드 납부`],
      };
      return checkBankruptcy(newState);
    }

    case 'BUILD': {
      const tile = state.tiles.find(t => t.id === action.tileId)!;
      const owner = state.currentTurn;
      const discount = state[owner].buildDiscountLaps > 0;
      const cost = getBuildCost(tile, action.buildingType, discount);
      if (state[owner].gold < cost) return state;
      const newLevel = tile.building === action.buildingType ? tile.buildingLevel + 1 : 1;
      const newTiles = state.tiles.map(t => t.id === action.tileId ? { ...t, building: action.buildingType, buildingLevel: newLevel } : t);
      return { ...state, tiles: newTiles, [owner]: { ...state[owner], gold: state[owner].gold - cost }, turnPhase: 'end_turn' };
    }

    case 'SKIP_BUILD': {
      return { ...state, turnPhase: 'end_turn' };
    }

    case 'BUY_TROOPS': {
      const piece = state.pieces.find(p => p.id === action.pieceId)!;
      const owner = piece.owner;
      const maxTroops = CHARACTERS[piece.characterType].maxTroops + piece.equipment.reduce((a, e) => a + e.commandBonus, 0);
      const canBuy = Math.min(action.amount, Math.floor(state[owner].gold / TROOP_PRICE), maxTroops - piece.troops);
      if (canBuy <= 0) return state;
      return {
        ...state,
        [owner]: { ...state[owner], gold: state[owner].gold - canBuy * TROOP_PRICE },
        pieces: state.pieces.map(p => p.id === piece.id ? { ...p, troops: p.troops + canBuy } : p),
      };
    }

    case 'BUY_PIECE': {
      const owner = state.currentTurn;
      const cost = nextHireCost(state[owner].pieceCount);
      if (state[owner].gold < cost) return state;
      const newId = `${owner[0]}${state[owner].pieceCount}`;
      const startIdx = owner === 'player' ? PLAYER_START : AI_START;
      const newPiece = createPiece(newId, owner, action.characterType, startIdx);
      return {
        ...state,
        [owner]: { ...state[owner], gold: state[owner].gold - cost, pieceCount: state[owner].pieceCount + 1 },
        pieces: [...state.pieces, newPiece],
      };
    }

    case 'CLOSE_SHOP': {
      return { ...state, turnPhase: 'end_turn' };
    }

    case 'APPLY_EVENT_CARD': {
      if (!state.activeEvent) return state;
      return applyEventCard(state, state.activeEvent);
    }

    case 'END_TURN': {
      const next = state.currentTurn === 'player' ? 'ai' : 'player';
      return {
        ...state,
        currentTurn: next,
        turnPhase: 'roll',
        diceResult: null,
        selectedPieceId: null,
        activeTileAction: null,
      };
    }

    default:
      return state;
  }
}

function handleTileLanding(state: GameState, tileId: number, pieceId: string): GameState {
  const tile = state.tiles.find(t => t.id === tileId)!;
  const owner = state.currentTurn;
  const opponent = owner === 'player' ? 'ai' : 'player';

  switch (tile.type) {
    case 'start_p':
    case 'start_e':
      return { ...state, turnPhase: 'end_turn' };

    case 'land': {
      if (tile.owner === null || tile.owner === 'neutral') {
        return { ...state, activeTileAction: tileId, turnPhase: 'tile_event' };
      }
      if (tile.owner === owner) {
        return { ...state, activeTileAction: tileId, turnPhase: 'build' };
      }
      // 적 땅 - 전투 or 통행세
      return { ...state, activeTileAction: tileId, turnPhase: 'tile_event' };
    }

    case 'shop':
      return { ...state, turnPhase: 'shop' };

    case 'tax': {
      if (state[owner].taxExemptTurns > 0) {
        return { ...state, [owner]: { ...state[owner], taxExemptTurns: state[owner].taxExemptTurns - 1 }, turnPhase: 'end_turn' };
      }
      const tax = calcTax(state[owner].gold);
      const newState = {
        ...state,
        [owner]: { ...state[owner], gold: state[owner].gold - tax },
        log: [...state.log, `세금 ${tax}골드 납부`],
        turnPhase: 'end_turn' as const,
      };
      return checkBankruptcy(newState);
    }

    case 'chance': {
      const card = CHANCE_CARDS[Math.floor(Math.random() * CHANCE_CARDS.length)];
      return { ...state, activeEvent: card, turnPhase: 'event_card' };
    }

    case 'community': {
      const card = COMMUNITY_CARDS[Math.floor(Math.random() * COMMUNITY_CARDS.length)];
      return { ...state, activeEvent: card, turnPhase: 'event_card' };
    }

    default:
      return { ...state, turnPhase: 'end_turn' };
  }
}

function applyEventCard(state: GameState, card: EventCard): GameState {
  const owner = state.currentTurn;
  const effect = card.effect;
  let newState = { ...state, activeEvent: null, turnPhase: 'end_turn' as const };

  switch (effect.kind) {
    case 'gold':
      if (effect.target === 'all') {
        newState = { ...newState, player: { ...newState.player, gold: newState.player.gold + effect.amount }, ai: { ...newState.ai, gold: newState.ai.gold + effect.amount } };
      } else {
        newState = { ...newState, [owner]: { ...newState[owner], gold: newState[owner].gold + effect.amount } };
      }
      break;
    case 'troops': {
      const piece = newState.pieces.find(p => p.owner === owner && p.position === newState.selectedPieceId);
      const activePiece = newState.pieces.filter(p => p.owner === owner)[0];
      if (activePiece) {
        const maxTroops = CHARACTERS[activePiece.characterType].maxTroops;
        newState = { ...newState, pieces: newState.pieces.map(p => p.id === activePiece.id ? { ...p, troops: Math.min(maxTroops, p.troops + effect.amount) } : p) };
      }
      break;
    }
    case 'attack_boost':
      newState = { ...newState, [owner]: { ...newState[owner], attackBoostActive: true } };
      break;
    case 'move_to_shop': {
      const piece = newState.pieces.find(p => p.id === newState.selectedPieceId);
      if (piece) {
        newState = { ...newState, pieces: newState.pieces.map(p => p.id === piece.id ? { ...p, position: 3 } : p), turnPhase: 'shop' };
      }
      break;
    }
    case 'tax_exempt':
      newState = { ...newState, [owner]: { ...newState[owner], taxExemptTurns: 1 } };
      break;
    case 'toll_exempt':
      newState = { ...newState, [owner]: { ...newState[owner], tollExemptTurns: 1 } };
      break;
    case 'toll_double':
      newState = { ...newState, [owner]: { ...newState[owner], tollDoubleLaps: effect.laps } };
      break;
    case 'build_discount':
      newState = { ...newState, [owner]: { ...newState[owner], buildDiscountLaps: effect.laps } };
      break;
    case 'reset_land': {
      const ownedLands = newState.tiles.filter(t => t.owner !== null && t.owner !== 'neutral' && t.type === 'land');
      if (ownedLands.length > 0) {
        const target = ownedLands[Math.floor(Math.random() * ownedLands.length)];
        const neutralTroops = Math.floor(Math.random() * 6) + 3;
        newState = { ...newState, tiles: newState.tiles.map(t => t.id === target.id ? { ...t, owner: 'neutral', troops: neutralTroops, building: null, buildingLevel: 0 } : t) };
      }
      break;
    }
    case 'dice_bonus':
      newState = { ...newState, [owner]: { ...newState[owner], diceBonusTurns: 1, diceBonusAmount: effect.amount } };
      break;
  }
  return newState;
}

function checkBankruptcy(state: GameState): GameState {
  if (state.player.gold <= 0) return { ...state, phase: 'gameover', winner: 'ai' };
  if (state.ai.gold <= 0) return { ...state, phase: 'gameover', winner: 'player' };
  return state;
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/lib/gameReducer.ts
git commit -m "feat: add game reducer with full state management"
```

---

## Task 6: AI 엔진

**Files:**
- Create: `src/lib/aiEngine.ts`

- [ ] **Step 1: `src/lib/aiEngine.ts` 생성**

```typescript
import type { GameState, GameAction, Piece, Tile } from './gameTypes';
import { CHARACTERS } from './gameData';
import { getToll, getBuildCost } from './economyUtils';

export function getAiAction(state: GameState): GameAction {
  const difficulty = state.difficulty;
  const ai = state.ai;
  const aiPieces = state.pieces.filter(p => p.owner === 'ai');

  switch (state.turnPhase) {
    case 'roll':
      return { type: 'ROLL_DICE' };

    case 'select_piece': {
      if (difficulty === 'easy') {
        const piece = aiPieces[Math.floor(Math.random() * aiPieces.length)];
        return { type: 'SELECT_PIECE', pieceId: piece.id };
      }
      // 보통/어려움: 가장 유리한 말 선택 (병력 많은 말 우선)
      const best = aiPieces.reduce((a, b) => a.troops > b.troops ? a : b);
      return { type: 'SELECT_PIECE', pieceId: best.id };
    }

    case 'tile_event': {
      const tileId = state.activeTileAction!;
      const tile = state.tiles.find(t => t.id === tileId)!;
      const piece = state.pieces.find(p => p.id === state.selectedPieceId)!;

      if (tile.owner === 'neutral' || tile.owner === null) {
        // 중립 땅: 전투 or 골드 구매
        if (difficulty === 'easy') {
          return Math.random() > 0.5 ? { type: 'CHOOSE_FIGHT', tileId } : { type: 'CHOOSE_BUY_LAND', tileId };
        }
        // 보통/어려움: 병력 우세면 전투, 아니면 구매 (돈 있으면)
        const cost = tile.landPrice || tile.troops * 80;
        if (piece.troops > tile.troops * 1.3) return { type: 'CHOOSE_FIGHT', tileId };
        if (ai.gold >= cost) return { type: 'CHOOSE_BUY_LAND', tileId };
        return { type: 'CHOOSE_FIGHT', tileId }; // 돈도 없으면 그냥 싸움
      }

      if (tile.owner === 'player') {
        // 적 땅: 전투 or 통행세
        if (difficulty === 'easy') return { type: 'CHOOSE_PAY_TOLL', tileId };
        const toll = getToll(tile);
        if (piece.troops > tile.troops * 1.5 && ai.gold > toll * 2) return { type: 'CHOOSE_FIGHT', tileId };
        return { type: 'CHOOSE_PAY_TOLL', tileId };
      }

      return { type: 'CHOOSE_PAY_TOLL', tileId };
    }

    case 'battle':
      return { type: 'BATTLE_FINISH' };

    case 'deploy': {
      const tileId = state.activeDeployTileId!;
      const piece = state.pieces.find(p => p.id === state.selectedPieceId)!;
      // 최소 3명 배치, 나머지는 유지
      const deployAmount = Math.min(piece.troops, Math.max(1, Math.floor(piece.troops * 0.3)));
      return { type: 'DEPLOY_TROOPS', tileId, amount: deployAmount };
    }

    case 'build': {
      const tileId = state.activeTileAction!;
      const tile = state.tiles.find(t => t.id === tileId)!;
      if (difficulty === 'easy') return { type: 'SKIP_BUILD' };

      // 돈 상황에 따라 건물 선택
      if (ai.gold < 300) return { type: 'SKIP_BUILD' };
      if (ai.gold < 600) {
        // 병영 우선
        const cost = getBuildCost(tile, 'barracks');
        if (cost <= ai.gold) return { type: 'BUILD', tileId, buildingType: 'barracks' };
      } else {
        // 균형 전략 (어려움: 금고 우선)
        const preferVault = difficulty === 'hard' && ai.gold < 1000;
        const type = preferVault ? 'vault' : tile.building ?? 'barracks';
        const cost = getBuildCost(tile, type as 'vault' | 'barracks' | 'fort');
        if (cost <= ai.gold) return { type: 'BUILD', tileId, buildingType: type as 'vault' | 'barracks' | 'fort' };
      }
      return { type: 'SKIP_BUILD' };
    }

    case 'shop': {
      // AI는 병력이 부족하면 구매
      const piece = state.pieces.find(p => p.id === state.selectedPieceId);
      if (piece && piece.troops < 5 && ai.gold >= 250) {
        const buyCount = Math.min(5, Math.floor(ai.gold / 50 / 2));
        if (buyCount > 0) return { type: 'BUY_TROOPS', pieceId: piece.id, amount: buyCount };
      }
      return { type: 'CLOSE_SHOP' };
    }

    case 'event_card':
      return { type: 'APPLY_EVENT_CARD' };

    default:
      return { type: 'END_TURN' };
  }
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/lib/aiEngine.ts
git commit -m "feat: add AI engine with 3 difficulty levels"
```

---

## Task 7: 메인 Game 컴포넌트 + StartScreen

**Files:**
- Create: `src/components/Game.tsx`
- Create: `src/components/StartScreen.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: `src/app/page.tsx` 수정**

```tsx
import Game from '@/components/Game';
export default function Home() {
  return <main className="min-h-screen bg-gray-950"><Game /></main>;
}
```

- [ ] **Step 2: `src/components/Game.tsx` 생성**

```tsx
'use client';
import { useReducer, useEffect, useRef } from 'react';
import type { CharacterType, Difficulty } from '@/lib/gameTypes';
import { gameReducer, createInitialState } from '@/lib/gameReducer';
import { getAiAction } from '@/lib/aiEngine';
import StartScreen from './StartScreen';
import Board from './Board';
import GameOver from './GameOver';

export default function Game() {
  const [state, dispatch] = useReducer(gameReducer, null as any);
  const [started, setStarted] = useState(false);
  const aiTimerRef = useRef<NodeJS.Timeout | null>(null);

  function handleStart(char: CharacterType, diff: Difficulty) {
    dispatch({ type: '__INIT__', char, diff } as any); // handled below
    setStarted(true);
  }

  // AI 자동 실행
  useEffect(() => {
    if (!state || state.phase !== 'board') return;
    if (state.currentTurn !== 'ai') return;
    if (state.turnPhase === 'end_turn') {
      dispatch({ type: 'END_TURN' });
      return;
    }
    aiTimerRef.current = setTimeout(() => {
      dispatch(getAiAction(state));
    }, 800);
    return () => { if (aiTimerRef.current) clearTimeout(aiTimerRef.current); };
  }, [state]);

  if (!started) return <StartScreen onStart={handleStart} />;
  if (!state) return null;
  if (state.phase === 'gameover') return <GameOver winner={state.winner!} onRestart={() => setStarted(false)} />;
  return <Board state={state} dispatch={dispatch} />;
}
```

> **참고:** Game.tsx에서 `useState`도 import해야 합니다. `createInitialState`를 직접 호출하도록 리팩토링 필요:

```tsx
'use client';
import { useReducer, useState, useEffect, useRef } from 'react';
import type { CharacterType, Difficulty } from '@/lib/gameTypes';
import { gameReducer, createInitialState } from '@/lib/gameReducer';
import { getAiAction } from '@/lib/aiEngine';
import StartScreen from './StartScreen';
import Board from './Board';
import GameOver from './GameOver';

export default function Game() {
  const [gameState, setGameState] = useState<ReturnType<typeof createInitialState> | null>(null);
  const [state, dispatch] = useReducer(gameReducer, null as any);
  const aiTimerRef = useRef<NodeJS.Timeout | null>(null);

  function handleStart(char: CharacterType, diff: Difficulty) {
    const initial = createInitialState(char, diff);
    // useReducer를 initial state와 함께 재초기화
    // 실제로는 key prop으로 컴포넌트를 리마운트하는 방식 사용
    setGameState(initial);
  }

  if (!gameState) return <StartScreen onStart={handleStart} />;
  return <GameWithState key={JSON.stringify(gameState.player.gold)} initialState={gameState} />;
}

function GameWithState({ initialState }: { initialState: ReturnType<typeof createInitialState> }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const aiTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (state.phase !== 'board' || state.currentTurn !== 'ai') return;
    if (state.turnPhase === 'end_turn') { dispatch({ type: 'END_TURN' }); return; }
    aiTimerRef.current = setTimeout(() => dispatch(getAiAction(state)), 800);
    return () => { if (aiTimerRef.current) clearTimeout(aiTimerRef.current); };
  }, [state]);

  if (state.phase === 'gameover') return <GameOver winner={state.winner!} onRestart={() => window.location.reload()} />;
  return <Board state={state} dispatch={dispatch} />;
}
```

- [ ] **Step 3: `src/components/StartScreen.tsx` 생성**

```tsx
'use client';
import { useState } from 'react';
import type { CharacterType, Difficulty } from '@/lib/gameTypes';
import { CHARACTERS } from '@/lib/gameData';

interface Props { onStart: (char: CharacterType, diff: Difficulty) => void; }

export default function StartScreen({ onStart }: Props) {
  const [char, setChar] = useState<CharacterType>('general');
  const [diff, setDiff] = useState<Difficulty>('normal');
  const chars = Object.entries(CHARACTERS) as [CharacterType, typeof CHARACTERS[CharacterType]][];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-4xl font-bold text-yellow-400">⚔️ Land of Power</h1>

      <div>
        <h2 className="text-lg font-semibold text-gray-300 mb-3 text-center">캐릭터 선택</h2>
        <div className="grid grid-cols-2 gap-3">
          {chars.map(([type, data]) => (
            <button key={type} onClick={() => setChar(type)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${char === type ? 'border-yellow-400 bg-yellow-400/10' : 'border-gray-700 hover:border-gray-500'}`}>
              <div className="font-bold">{data.name}</div>
              <div className="text-xs text-gray-400 mt-1">{data.description}</div>
              <div className="text-xs text-gray-500 mt-2">
                공격 {data.attack}× | 방어 {data.defense}× | 병력 {data.maxTroops}명
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-300 mb-3 text-center">난이도</h2>
        <div className="flex gap-3">
          {(['easy','normal','hard'] as Difficulty[]).map(d => (
            <button key={d} onClick={() => setDiff(d)}
              className={`px-6 py-2 rounded-lg border-2 transition-all ${diff === d ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
              {d === 'easy' ? '쉬움' : d === 'normal' ? '보통' : '어려움'}
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => onStart(char, diff)}
        className="mt-4 px-12 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg text-lg transition-colors">
        게임 시작
      </button>
    </div>
  );
}
```

- [ ] **Step 4: 커밋**

```bash
git add src/app/page.tsx src/components/Game.tsx src/components/StartScreen.tsx
git commit -m "feat: add game shell and start screen"
```

---

## Task 8: 보드 렌더링

**Files:**
- Create: `src/components/Board.tsx`
- Create: `src/components/BoardTile.tsx`
- Create: `src/components/HUD.tsx`

- [ ] **Step 1: `src/components/BoardTile.tsx` 생성**

```tsx
import type { Tile, Piece } from '@/lib/gameTypes';
import { TILE_DEFINITIONS } from '@/lib/boardLayout';

const TILE_ICONS: Record<string, string> = {
  start_p: '🏠', start_e: '🏯', land: '🌾', shop: '🛒', tax: '💰', chance: '🎲', community: '📜'
};
const OWNER_COLORS: Record<string, string> = {
  player: 'border-blue-500 bg-blue-950', ai: 'border-red-500 bg-red-950',
  neutral: 'border-gray-600 bg-gray-900', null: 'border-gray-700 bg-gray-900'
};

interface Props {
  tile: Tile;
  pieces: Piece[];
  isActive: boolean;
  onClick?: () => void;
}

export default function BoardTile({ tile, pieces, isActive, onClick }: Props) {
  const def = TILE_DEFINITIONS.find(d => d.index === tile.id)!;
  const piecesHere = pieces.filter(p => p.position === tile.id);
  const ownerColor = OWNER_COLORS[tile.owner ?? 'null'];

  return (
    <div onClick={onClick}
      style={{ gridRow: def.gridRow, gridColumn: def.gridCol }}
      className={`relative flex flex-col items-center justify-center p-1 rounded-lg border-2 min-h-[80px] min-w-[80px] cursor-pointer transition-all
        ${ownerColor} ${isActive ? 'ring-2 ring-yellow-400 scale-105' : 'hover:brightness-110'}`}>
      <div className="text-xl">{TILE_ICONS[tile.type]}</div>
      <div className="text-xs text-gray-300 text-center leading-tight">{def.label}</div>
      {tile.troops > 0 && (
        <div className={`text-xs font-bold mt-1 ${tile.owner === 'player' ? 'text-blue-300' : tile.owner === 'ai' ? 'text-red-300' : 'text-gray-400'}`}>
          ⚔️{tile.troops}
        </div>
      )}
      {tile.building && (
        <div className="text-xs text-yellow-400">
          {tile.building === 'vault' ? '🏦' : tile.building === 'barracks' ? '🏕️' : '🏰'}Lv{tile.buildingLevel}
        </div>
      )}
      {/* 말 토큰 */}
      <div className="flex gap-1 flex-wrap justify-center mt-1">
        {piecesHere.map(p => (
          <div key={p.id} className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold
            ${p.owner === 'player' ? 'bg-blue-500' : 'bg-red-500'}`}>
            {p.troops}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `src/components/HUD.tsx` 생성**

```tsx
import type { GameState } from '@/lib/gameTypes';
import { CHARACTERS } from '@/lib/gameData';

export default function HUD({ state }: { state: GameState }) {
  const playerPieces = state.pieces.filter(p => p.owner === 'player');
  const aiPieces = state.pieces.filter(p => p.owner === 'ai');
  const playerLands = state.tiles.filter(t => t.owner === 'player').length;
  const aiLands = state.tiles.filter(t => t.owner === 'ai').length;

  return (
    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-900 rounded-lg">
      <div className="text-blue-300">
        <div className="font-bold text-blue-400">👤 플레이어</div>
        <div>💰 {state.player.gold}골드</div>
        <div>🏠 영토 {playerLands}칸</div>
        {playerPieces.map(p => (
          <div key={p.id} className="text-sm text-gray-400">
            {CHARACTERS[p.characterType].name} ⚔️{p.troops}명
          </div>
        ))}
      </div>
      <div className="text-red-300 text-right">
        <div className="font-bold text-red-400">🤖 AI</div>
        <div>💰 {state.ai.gold}골드</div>
        <div>🏠 영토 {aiLands}칸</div>
        {aiPieces.map(p => (
          <div key={p.id} className="text-sm text-gray-400">
            {CHARACTERS[p.characterType].name} ⚔️{p.troops}명
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: `src/components/Board.tsx` 생성**

```tsx
'use client';
import type { GameState, GameAction } from '@/lib/gameTypes';
import { TILE_DEFINITIONS } from '@/lib/boardLayout';
import BoardTile from './BoardTile';
import HUD from './HUD';
import DiceRoller from './DiceRoller';
import PieceSelector from './PieceSelector';
import TileActionModal from './TileActionModal';
import BattleModal from './BattleModal';
import DeployModal from './DeployModal';
import BuildModal from './BuildModal';
import ShopModal from './ShopModal';
import EventModal from './EventModal';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }

export default function Board({ state, dispatch }: Props) {
  const isPlayerTurn = state.currentTurn === 'player';
  const activeTileId = state.activeTileAction ?? state.activeDeployTileId ?? -1;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 flex flex-col gap-4">
      <HUD state={state} />

      {/* 보드 그리드 */}
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: 'repeat(4, 1fr)' }}>
        {TILE_DEFINITIONS.map(def => {
          const tile = state.tiles.find(t => t.id === def.index)!;
          return (
            <BoardTile key={def.index} tile={tile} pieces={state.pieces}
              isActive={def.index === activeTileId}
              onClick={() => {}} />
          );
        })}
      </div>

      {/* 현재 턴 표시 */}
      <div className={`text-center font-bold ${isPlayerTurn ? 'text-blue-400' : 'text-red-400'}`}>
        {isPlayerTurn ? '🎮 플레이어 턴' : '🤖 AI 턴'} — {state.turnPhase}
      </div>

      {/* 플레이어 행동 UI */}
      {isPlayerTurn && state.turnPhase === 'roll' && <DiceRoller result={state.diceResult} onRoll={() => dispatch({ type: 'ROLL_DICE' })} />}
      {isPlayerTurn && state.turnPhase === 'select_piece' && <PieceSelector state={state} dispatch={dispatch} />}
      {isPlayerTurn && state.turnPhase === 'tile_event' && state.activeTileAction !== null && <TileActionModal state={state} dispatch={dispatch} />}
      {state.turnPhase === 'battle' && state.activeBattle && <BattleModal state={state} dispatch={dispatch} />}
      {state.turnPhase === 'deploy' && state.activeDeployTileId !== null && <DeployModal state={state} dispatch={dispatch} />}
      {isPlayerTurn && state.turnPhase === 'build' && <BuildModal state={state} dispatch={dispatch} />}
      {isPlayerTurn && state.turnPhase === 'shop' && <ShopModal state={state} dispatch={dispatch} />}
      {state.turnPhase === 'event_card' && state.activeEvent && <EventModal state={state} dispatch={dispatch} />}

      {/* 로그 */}
      <div className="bg-gray-900 rounded p-3 max-h-32 overflow-y-auto text-xs text-gray-400">
        {[...state.log].reverse().slice(0, 10).map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 커밋**

```bash
git add src/components/Board.tsx src/components/BoardTile.tsx src/components/HUD.tsx
git commit -m "feat: add board rendering and HUD"
```

---

## Task 9: 턴 UI 컴포넌트들

**Files:**
- Create: `src/components/DiceRoller.tsx`
- Create: `src/components/PieceSelector.tsx`
- Create: `src/components/TileActionModal.tsx`
- Create: `src/components/DeployModal.tsx`

- [ ] **Step 1: `src/components/DiceRoller.tsx`**

```tsx
interface Props { result: number | null; onRoll: () => void; }
export default function DiceRoller({ result, onRoll }: Props) {
  const faces = ['', '⚀','⚁','⚂','⚃','⚄','⚅'];
  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-gray-900 rounded-lg">
      {result && <div className="text-5xl">{faces[result]}</div>}
      <button onClick={onRoll}
        className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg text-lg transition-colors">
        🎲 주사위 굴리기
      </button>
    </div>
  );
}
```

- [ ] **Step 2: `src/components/PieceSelector.tsx`**

```tsx
import type { GameState, GameAction } from '@/lib/gameTypes';
import { CHARACTERS } from '@/lib/gameData';
import { TILE_DEFINITIONS } from '@/lib/boardLayout';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }
export default function PieceSelector({ state, dispatch }: Props) {
  const pieces = state.pieces.filter(p => p.owner === 'player');
  return (
    <div className="p-4 bg-gray-900 rounded-lg">
      <div className="text-yellow-400 font-bold mb-3">이동할 말 선택 (주사위: {state.diceResult})</div>
      <div className="flex flex-wrap gap-3">
        {pieces.map(p => {
          const tileDef = TILE_DEFINITIONS.find(d => d.index === p.position);
          return (
            <button key={p.id} onClick={() => dispatch({ type: 'SELECT_PIECE', pieceId: p.id })}
              className="px-4 py-2 bg-blue-800 hover:bg-blue-700 rounded-lg text-sm transition-colors">
              <div className="font-bold">{CHARACTERS[p.characterType].name}</div>
              <div className="text-gray-300">⚔️{p.troops}명 | 현재 {tileDef?.label ?? p.position}칸</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: `src/components/TileActionModal.tsx`**

```tsx
import type { GameState, GameAction } from '@/lib/gameTypes';
import { getToll } from '@/lib/economyUtils';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }
export default function TileActionModal({ state, dispatch }: Props) {
  const tileId = state.activeTileAction!;
  const tile = state.tiles.find(t => t.id === tileId)!;
  const piece = state.pieces.find(p => p.id === state.selectedPieceId)!;
  const toll = getToll(tile);
  const landCost = tile.landPrice || tile.troops * 80;
  const isNeutral = tile.owner === 'neutral' || tile.owner === null;
  const isEnemy = tile.owner === 'ai';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 min-w-[300px] text-white">
        <h2 className="text-xl font-bold text-yellow-400 mb-4">
          {isNeutral ? '🌾 중립 영토' : '⚔️ 적 영토'} ({tileId}번 칸)
        </h2>
        <div className="text-gray-300 mb-4">
          <div>수비 병력: {tile.troops}명</div>
          {isNeutral && <div>구매 비용: {landCost}골드 (보유: {state.player.gold}골드)</div>}
          {isEnemy && <div>통행세: {toll}골드</div>}
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={() => dispatch({ type: 'CHOOSE_FIGHT', tileId })}
            disabled={piece.troops === 0}
            className="px-4 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-40 rounded-lg font-bold">
            ⚔️ 전투 (내 병력: {piece.troops}명)
          </button>
          {isNeutral && (
            <button onClick={() => dispatch({ type: 'CHOOSE_BUY_LAND', tileId })}
              disabled={state.player.gold < landCost}
              className="px-4 py-2 bg-yellow-700 hover:bg-yellow-600 disabled:opacity-40 rounded-lg font-bold">
              💰 골드로 구매 ({landCost}골드)
            </button>
          )}
          {isEnemy && (
            <button onClick={() => dispatch({ type: 'CHOOSE_PAY_TOLL', tileId })}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold">
              🚶 통행세 납부 ({toll}골드)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: `src/components/DeployModal.tsx`**

```tsx
'use client';
import { useState } from 'react';
import type { GameState, GameAction } from '@/lib/gameTypes';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }
export default function DeployModal({ state, dispatch }: Props) {
  const tileId = state.activeDeployTileId!;
  const piece = state.pieces.find(p => p.id === state.selectedPieceId)!;
  const [amount, setAmount] = useState(Math.min(3, piece.troops));

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 min-w-[300px] text-white">
        <h2 className="text-xl font-bold text-green-400 mb-4">🏴 점령 성공! 병력 배치</h2>
        <div className="text-gray-300 mb-4">
          <div>남은 병력: {piece.troops}명</div>
          <div>배치할 수비대: <span className="text-yellow-400 font-bold">{amount}명</span></div>
        </div>
        <input type="range" min={1} max={piece.troops} value={amount}
          onChange={e => setAmount(Number(e.target.value))}
          className="w-full mb-4" />
        <button onClick={() => dispatch({ type: 'DEPLOY_TROOPS', tileId, amount })}
          className="w-full px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg font-bold">
          배치 확정
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 커밋**

```bash
git add src/components/DiceRoller.tsx src/components/PieceSelector.tsx src/components/TileActionModal.tsx src/components/DeployModal.tsx
git commit -m "feat: add turn UI components"
```

---

## Task 10: 전투 시뮬레이션 모달

**Files:**
- Create: `src/components/BattleModal.tsx`

- [ ] **Step 1: `src/components/BattleModal.tsx` 생성**

```tsx
'use client';
import { useState, useEffect } from 'react';
import type { GameState, GameAction, BattleState } from '@/lib/gameTypes';
import { runBattleRound } from '@/lib/battleEngine';
import { CHARACTERS } from '@/lib/gameData';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }

export default function BattleModal({ state, dispatch }: Props) {
  const [battle, setBattle] = useState<BattleState>(state.activeBattle!);
  const [animating, setAnimating] = useState(false);
  const isPlayerTurn = state.currentTurn === 'player';
  const piece = state.pieces.find(p => p.id === battle.attackerPieceId)!;

  function runNextRound() {
    if (battle.result !== 'ongoing') { dispatch({ type: 'BATTLE_FINISH' }); return; }
    setAnimating(true);
    setTimeout(() => {
      setBattle(prev => runBattleRound(prev));
      setAnimating(false);
    }, 400);
  }

  // AI 턴이면 자동 진행
  useEffect(() => {
    if (!isPlayerTurn && battle.result === 'ongoing') {
      const t = setTimeout(runNextRound, 600);
      return () => clearTimeout(t);
    }
    if (!isPlayerTurn && battle.result !== 'ongoing') {
      const t = setTimeout(() => dispatch({ type: 'BATTLE_FINISH' }), 1000);
      return () => clearTimeout(t);
    }
  }, [isPlayerTurn, battle]);

  const atkPct = Math.round((battle.attackerTroops / (state.activeBattle?.attackerTroops || 1)) * 100);
  const defPct = Math.round((battle.defenderTroops / (state.activeBattle?.defenderTroops || 1)) * 100);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className={`bg-gray-900 rounded-xl p-6 w-full max-w-lg text-white transition-all ${animating ? 'scale-95' : 'scale-100'}`}>
        <h2 className="text-2xl font-bold text-center text-yellow-400 mb-6">⚔️ 전투!</h2>

        <div className="grid grid-cols-3 gap-4 items-center mb-6">
          {/* 공격자 */}
          <div className="text-center">
            <div className="text-blue-400 font-bold">{CHARACTERS[piece.characterType].name}</div>
            <div className="text-3xl font-bold text-blue-300">{battle.attackerTroops}</div>
            <div className="text-xs text-gray-400">공격측 병력</div>
            <div className="mt-2 h-3 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${atkPct}%` }} />
            </div>
          </div>

          <div className="text-center text-3xl">VS</div>

          {/* 수비자 */}
          <div className="text-center">
            <div className="text-red-400 font-bold">수비대</div>
            <div className="text-3xl font-bold text-red-300">{battle.defenderTroops}</div>
            <div className="text-xs text-gray-400">수비측 병력</div>
            <div className="mt-2 h-3 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${defPct}%` }} />
            </div>
          </div>
        </div>

        {/* 전투 로그 */}
        <div className="bg-gray-800 rounded-lg p-3 max-h-32 overflow-y-auto mb-4 text-sm text-gray-300">
          {battle.rounds.length === 0 && <div className="text-gray-500">전투 시작...</div>}
          {[...battle.rounds].reverse().map((r, i) => <div key={i}>{r.log}</div>)}
        </div>

        {/* 결과 */}
        {battle.result !== 'ongoing' && (
          <div className={`text-center text-xl font-bold mb-4 ${battle.result === 'attacker_wins' ? 'text-green-400' : 'text-red-400'}`}>
            {battle.result === 'attacker_wins' ? '🏆 승리!' : '💀 패배...'}
          </div>
        )}

        {/* 버튼 */}
        {isPlayerTurn && (
          <button onClick={runNextRound}
            className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-bold transition-colors">
            {battle.result === 'ongoing' ? '▶ 다음 라운드' : '확인'}
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/components/BattleModal.tsx
git commit -m "feat: add battle simulation modal"
```

---

## Task 11: 건물/상점/이벤트/게임오버 컴포넌트

**Files:**
- Create: `src/components/BuildModal.tsx`
- Create: `src/components/ShopModal.tsx`
- Create: `src/components/EventModal.tsx`
- Create: `src/components/GameOver.tsx`

- [ ] **Step 1: `src/components/BuildModal.tsx`**

```tsx
import type { GameState, GameAction } from '@/lib/gameTypes';
import { BUILDING_DATA } from '@/lib/gameData';
import { getBuildCost } from '@/lib/economyUtils';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }
export default function BuildModal({ state, dispatch }: Props) {
  const tileId = state.activeTileAction!;
  const tile = state.tiles.find(t => t.id === tileId)!;
  const gold = state.player.gold;
  const discount = state.player.buildDiscountLaps > 0;

  const buildingTypes = ['vault', 'barracks', 'fort'] as const;
  const icons = { vault: '🏦', barracks: '🏕️', fort: '🏰' };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 min-w-[340px] text-white">
        <h2 className="text-xl font-bold text-yellow-400 mb-4">🏗️ 건물 건설</h2>
        {discount && <div className="text-green-400 text-sm mb-3">✨ 건설 비용 50% 할인 중!</div>}
        <div className="flex flex-col gap-3 mb-4">
          {buildingTypes.map(type => {
            const data = BUILDING_DATA[type];
            const canBuild = tile.building === null || tile.building === type;
            const isMax = tile.building === type && tile.buildingLevel >= 3;
            const cost = getBuildCost(tile, type, discount);
            const level = tile.building === type ? tile.buildingLevel : 0;
            return (
              <button key={type}
                onClick={() => dispatch({ type: 'BUILD', tileId, buildingType: type })}
                disabled={!canBuild || isMax || gold < cost}
                className="flex items-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 rounded-lg transition-colors text-left">
                <span className="text-2xl">{icons[type]}</span>
                <div className="flex-1">
                  <div className="font-bold">{data.name[Math.max(0, level)]} {isMax && '(최대)'}</div>
                  <div className="text-xs text-gray-400">{data.description}</div>
                </div>
                <div className="text-yellow-400 font-bold">{isMax ? '-' : `${cost}골드`}</div>
              </button>
            );
          })}
        </div>
        <button onClick={() => dispatch({ type: 'SKIP_BUILD' })}
          className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">건설 안함</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `src/components/ShopModal.tsx`**

```tsx
'use client';
import { useState } from 'react';
import type { GameState, GameAction } from '@/lib/gameTypes';
import { EQUIPMENT, CHARACTERS, TROOP_PRICE, nextHireCost } from '@/lib/gameData';
import type { CharacterType } from '@/lib/gameTypes';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }
export default function ShopModal({ state, dispatch }: Props) {
  const [buyTroopAmount, setBuyTroopAmount] = useState(5);
  const gold = state.player.gold;
  const activePiece = state.pieces.find(p => p.id === state.selectedPieceId) ?? state.pieces.find(p => p.owner === 'player')!;
  const hireCost = nextHireCost(state.player.pieceCount);
  const chars = Object.keys(CHARACTERS) as CharacterType[];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 min-w-[360px] text-white max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-yellow-400 mb-4">🛒 상점 (보유: {gold}골드)</h2>

        {/* 병력 구매 */}
        <div className="mb-4">
          <div className="font-bold text-gray-300 mb-2">⚔️ 병력 구매 (1명 = {TROOP_PRICE}골드)</div>
          <div className="flex items-center gap-3">
            <input type="range" min={1} max={20} value={buyTroopAmount}
              onChange={e => setBuyTroopAmount(Number(e.target.value))} className="flex-1" />
            <span>{buyTroopAmount}명 = {buyTroopAmount * TROOP_PRICE}골드</span>
          </div>
          <button onClick={() => dispatch({ type: 'BUY_TROOPS', pieceId: activePiece.id, amount: buyTroopAmount })}
            disabled={gold < TROOP_PRICE}
            className="mt-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 rounded-lg w-full">구매</button>
        </div>

        {/* 장비 구매 */}
        <div className="mb-4">
          <div className="font-bold text-gray-300 mb-2">🗡️ 장비</div>
          {EQUIPMENT.map(eq => {
            const owned = activePiece.equipment.some(e => e.id === eq.id);
            const slotFull = activePiece.equipment.length >= 3;
            return (
              <div key={eq.id} className="flex items-center justify-between py-2 border-b border-gray-700">
                <span>{eq.name} {owned && '✓'}</span>
                <button onClick={() => dispatch({ type: 'BUY_EQUIPMENT', pieceId: activePiece.id, equipmentId: eq.id })}
                  disabled={owned || slotFull || gold < eq.price}
                  className="px-3 py-1 bg-yellow-700 hover:bg-yellow-600 disabled:opacity-40 rounded text-sm">
                  {eq.price}골드
                </button>
              </div>
            );
          })}
        </div>

        {/* 말 고용 */}
        <div className="mb-4">
          <div className="font-bold text-gray-300 mb-2">🧑‍✈️ 말 고용 ({hireCost}골드)</div>
          <div className="grid grid-cols-2 gap-2">
            {chars.map(c => (
              <button key={c} onClick={() => dispatch({ type: 'BUY_PIECE', characterType: c })}
                disabled={gold < hireCost}
                className="px-3 py-2 bg-purple-800 hover:bg-purple-700 disabled:opacity-40 rounded text-sm">
                {CHARACTERS[c].name}
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => dispatch({ type: 'CLOSE_SHOP' })}
          className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">닫기</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: `src/components/EventModal.tsx`**

```tsx
import type { GameState, GameAction } from '@/lib/gameTypes';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }
export default function EventModal({ state, dispatch }: Props) {
  const card = state.activeEvent!;
  const icon = card.type === 'chance' ? '🎲' : '📜';
  const color = card.type === 'chance' ? 'text-yellow-400' : 'text-green-400';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 min-w-[300px] text-white text-center">
        <div className="text-5xl mb-3">{icon}</div>
        <h2 className={`text-xl font-bold ${color} mb-4`}>
          {card.type === 'chance' ? '찬스 카드' : '커뮤니티 카드'}
        </h2>
        <p className="text-gray-200 text-lg mb-6">{card.text}</p>
        {state.currentTurn === 'player' && (
          <button onClick={() => dispatch({ type: 'APPLY_EVENT_CARD' })}
            className="px-8 py-3 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-bold">
            확인
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: `src/components/GameOver.tsx`**

```tsx
interface Props { winner: 'player' | 'ai'; onRestart: () => void; }
export default function GameOver({ winner, onRestart }: Props) {
  const isWin = winner === 'player';
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-6">
      <div className="text-7xl">{isWin ? '🏆' : '💀'}</div>
      <h1 className={`text-4xl font-bold ${isWin ? 'text-yellow-400' : 'text-red-400'}`}>
        {isWin ? '승리!' : '패배...'}
      </h1>
      <p className="text-gray-400">{isWin ? 'AI를 파산시켰습니다!' : '파산했습니다...'}</p>
      <button onClick={onRestart}
        className="px-10 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg text-lg">
        다시 시작
      </button>
    </div>
  );
}
```

- [ ] **Step 5: gameReducer에 BUY_EQUIPMENT 케이스 추가**

`src/lib/gameReducer.ts`의 `gameReducer` switch에 추가:

```typescript
case 'BUY_EQUIPMENT': {
  const piece = state.pieces.find(p => p.id === action.pieceId)!;
  const owner = piece.owner;
  const eq = EQUIPMENT.find(e => e.id === action.equipmentId);
  if (!eq) return state;
  if (state[owner].gold < eq.price) return state;
  if (piece.equipment.length >= 3) return state;
  return {
    ...state,
    [owner]: { ...state[owner], gold: state[owner].gold - eq.price },
    pieces: state.pieces.map(p => p.id === piece.id ? { ...p, equipment: [...p.equipment, eq] } : p),
  };
}
```

그리고 `gameData.ts`에서 `EQUIPMENT` import 추가: `gameReducer.ts` 상단에

```typescript
import { CHARACTERS, TROOP_PRICE, LAP_TROOP_BONUS, LAP_GOLD_BONUS, nextHireCost, CHANCE_CARDS, COMMUNITY_CARDS, EQUIPMENT } from './gameData';
```

- [ ] **Step 6: 커밋**

```bash
git add src/components/BuildModal.tsx src/components/ShopModal.tsx src/components/EventModal.tsx src/components/GameOver.tsx src/lib/gameReducer.ts
git commit -m "feat: add build/shop/event/gameover UI components"
```

---

## Task 12: 개발 서버 실행 + 통합 테스트

- [ ] **Step 1: 개발 서버 실행**

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 열기

- [ ] **Step 2: 체크리스트 검증**

- [ ] 시작 화면에서 캐릭터 4종 선택 가능
- [ ] 난이도 3단계 선택 가능
- [ ] 게임 시작 시 보드 14칸 렌더링
- [ ] 8개 땅에 중립 병력 표시
- [ ] 주사위 굴리기 작동
- [ ] 말 선택 후 이동
- [ ] 중립 땅 착지 → 전투/구매 선택 모달
- [ ] 전투 라운드 진행 → 승리 시 배치 모달
- [ ] 내 땅 착지 → 건물 건설 모달
- [ ] 상점 칸 → 상점 모달
- [ ] 세금 칸 → 골드 차감
- [ ] AI 턴 자동 진행
- [ ] 파산 시 게임오버 화면

- [ ] **Step 3: 빌드 확인**

```bash
npm run build
```

Expected: 에러 없이 빌드 완료

- [ ] **Step 4: 최종 커밋**

```bash
git add -A
git commit -m "feat: complete LOP game v1.0 - single player vs AI board game"
```

---

## 자체 검토

**Spec 커버리지:**
- ✅ 5×4 보드 14칸 (§4)
- ✅ 플레이어/AI 대각선 시작 (§4)
- ✅ 말 능력치 + 장비 슬롯 (§5)
- ✅ 병력 구매/배치 시스템 (§6)
- ✅ 건물 3종 × 3등급 (§7)
- ✅ 전투 vs 통행세 선택 (§8)
- ✅ 전투 시뮬레이션 모달 (§8.4)
- ✅ 중립 병력 + 전투/골드 구매 (§6-1)
- ✅ 점령 후 병력 배치 선택 (§6-1)
- ✅ AI 3난이도 (§10)
- ✅ 말 고용 비용 증가 (§5.3)
- ✅ 찬스/커뮤니티 카드 6종씩 (§4)
- ✅ 한 바퀴 완주 보상 (§6, §9)
- ✅ 파산 조건 (§9)
