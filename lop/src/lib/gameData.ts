import type { CharacterType, EventCard, BuildingType, TroopType } from './gameTypes';

export const TROOP_DATA: Record<TroopType, {
  name: string; emoji: string; attack: number; defense: number; price: number; desc: string; counters: TroopType[]; mercenaryOnly?: boolean; pieceBattleAttack?: number;
}> = {
  swordsman: { name: '검사',   emoji: '⚔️',  attack: 1.1, defense: 1.0, price: 60,  desc: '저렴한 균형형. 창병에 강함',                       counters: ['spearman'] },
  archer:    { name: '궁사',   emoji: '🏹',  attack: 1.5, defense: 0.5, price: 80,  desc: '고공격. 검사·창병에 강함',                          counters: ['swordsman', 'spearman'] },
  cavalry:   { name: '기마병', emoji: '🐎',  attack: 1.4, defense: 0.7, price: 120, desc: '비싼 돌격대. 검사·궁사에 강하나 창병에 약함',          counters: ['swordsman', 'archer'] },
  spearman:  { name: '창병',   emoji: '🔱',  attack: 0.6, defense: 1.6, price: 70,  desc: '저렴한 수비형. 기마병에 강함',                       counters: ['cavalry'] },
  assassin:  { name: '암살자', emoji: '🥷',  attack: 0.7, defense: 0.4, price: 0,   desc: '용병소 전용. 말 전투 시 극강. 평소엔 약함',            counters: [], mercenaryOnly: true, pieceBattleAttack: 3.8 },
  berserker: { name: '광전사', emoji: '🪓',  attack: 2.8, defense: 0.15, price: 0,  desc: '용병소 전용. 초고공격·극저방어. 상성 없음',             counters: [], mercenaryOnly: true },
};

export const BUYABLE_TROOPS: TroopType[] = ['swordsman', 'archer', 'cavalry', 'spearman'];

export const CHARACTERS: Record<CharacterType, {
  name: string;
  attack: number;
  defense: number;
  maxTroops: number;
  moveBonus: number;
  description: string;
  skill: { name: string; desc: string };
}> = {
  agitator: { name: '선동가',  attack: 1.0, defense: 1.0, maxTroops: 40, moveBonus: 0, description: '매 바퀴 랜덤 병사 2명 획득',        skill: { name: '선동',   desc: '랩 완주 시 랜덤 병종 2명 합류' } },
  warlock:  { name: '흑마술사', attack: 1.0, defense: 1.0, maxTroops: 30, moveBonus: 0, description: '매 바퀴 적 병력 2명 제거',          skill: { name: '저주',   desc: '랩 완주 시 적 말 병력 2명 소멸' } },
  smuggler: { name: '밀수꾼',  attack: 1.0, defense: 1.0, maxTroops: 30, moveBonus: 0, description: '매 바퀴 골드 +200',                  skill: { name: '밀수',   desc: '랩 완주 시 골드 +200' } },
  swindler: { name: '사기꾼',  attack: 1.0, defense: 1.0, maxTroops: 25, moveBonus: 0, description: '주사위 0 시 골드 +200',              skill: { name: '사기',   desc: '주사위 합계 0 → 골드 +200' } },
  cleric:   { name: '종교인',  attack: 1.0, defense: 1.0, maxTroops: 40, moveBonus: 0, description: '매 바퀴 보유 영토에 랜덤 병사 3명 분배', skill: { name: '축복',   desc: '랩 완주 시 보유 영토에 랜덤 병종 3명 분배' } },
  general:  { name: '장군',   attack: 1.0, defense: 1.0, maxTroops: 60, moveBonus: 0, description: '전투 승리 시 랜덤 병종 1명 말에 추가', skill: { name: '전리품', desc: '전투 승리 시 랜덤 병종 1명 말에 추가' } },
  pirate:   { name: '해적',   attack: 1.0, defense: 1.0, maxTroops: 45, moveBonus: 0, description: '전투 승리 시 골드 +100',              skill: { name: '약탈',   desc: '전투 승리 시 골드 +100' } },
};


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
    lapIncome: [80, 200, 400],
    toll: [150, 300, 550],
  },
  barracks: {
    name: ['병영', '훈련소', '대병영'],
    cost: [200, 500, 1000],
    description: '한 바퀴마다 병력 생산 +',
    lapTroops: [2, 5, 10],
    toll: [150, 300, 550],
  },
  fort: {
    name: ['초소', '성벽', '요새'],
    cost: [200, 500, 1000],
    description: '수비 병력 강화',
    attackBonus: [1.1, 1.2, 1.35],
    defenseBonus: [1.05, 1.15, 1.3],
    toll: [300, 600, 1200],
  },
  toll_gate: {
    name: ['관문', '성관', '관세청'],
    cost: [300, 750, 1500],
    description: '높은 통행세 전문 건물',
    toll: [400, 800, 1400],
  },
};

export const BASE_LAND_PRICE = 300;
export const TROOP_PRICE = 50;
export const LAP_TROOP_BONUS = 5;
export const LAP_GOLD_BONUS = 200;
export const LAP_LAND_PRODUCTION = 2;
export const TAX_RATE = 0.1;
export const TROOP_PRICE_SCALE = 0.06;

export const HIRE_COST_BASE = [0, 500, 1200, 2000, 5000];
export function nextHireCost(count: number): number {
  if (count < HIRE_COST_BASE.length) return HIRE_COST_BASE[count];
  return Math.floor(HIRE_COST_BASE[HIRE_COST_BASE.length - 1] * Math.pow(2, count - HIRE_COST_BASE.length + 1) + 300);
}

export const CHANCE_CARDS: EventCard[] = [
  // ── 즉시 골드 ────────────────────────────────────────────────────
  { id: 'c_g1', type: 'chance', text: '즉시 골드 +200',
    effect: { kind: 'gold', amount: 200, target: 'self' },
    usablePhases: [] },
  { id: 'c_g2', type: 'chance', text: '즉시 골드 +400',
    effect: { kind: 'gold', amount: 400, target: 'self' },
    usablePhases: [] },
  { id: 'c_g3', type: 'chance', text: '즉시 골드 +600',
    effect: { kind: 'gold', amount: 600, target: 'self' },
    usablePhases: [] },

  // ── 즉시 병력 ────────────────────────────────────────────────────
  { id: 'c_t1', type: 'chance', text: '즉시 병력 +3명',
    effect: { kind: 'troops', amount: 3 },
    usablePhases: [] },
  { id: 'c_t2', type: 'chance', text: '즉시 병력 +5명',
    effect: { kind: 'troops', amount: 5 },
    usablePhases: [] },
  { id: 'c_t3', type: 'chance', text: '즉시 병력 +8명',
    effect: { kind: 'troops', amount: 8 },
    usablePhases: [] },

  // ── 무료 징집 ────────────────────────────────────────────────────
  { id: 'c_tb1', type: 'chance', text: '긴급 징집! 300골드로 병력 10명',
    effect: { kind: 'troop_boost', costPerTroop: 30, maxAmount: 10 },
    usablePhases: [] },
  { id: 'c_tb2', type: 'chance', text: '무료 징병! 병력 6명 무상 지급',
    effect: { kind: 'troop_boost', costPerTroop: 0, maxAmount: 6 },
    usablePhases: [] },

  // ── 주사위 보너스 ─────────────────────────────────────────────────
  { id: 'c_d1', type: 'chance', text: '순풍! 다음 주사위 +2',
    effect: { kind: 'dice_bonus', amount: 2 },
    usablePhases: [] },
  { id: 'c_d2', type: 'chance', text: '대순풍! 다음 주사위 +4',
    effect: { kind: 'dice_bonus', amount: 4 },
    usablePhases: [] },

  // ── 전투 강화 ────────────────────────────────────────────────────
  { id: 'c_a1', type: 'chance', text: '돌격 명령! 다음 전투 공격력 1.5배',
    effect: { kind: 'attack_boost', multiplier: 1.5 },
    usablePhases: [] },
  { id: 'c_a2', type: 'chance', text: '결사 돌격! 다음 전투 공격력 2배',
    effect: { kind: 'attack_boost', multiplier: 2.0 },
    usablePhases: [] },
  { id: 'c_db1', type: 'chance', text: '요새화! 다음 전투 수비력 1.5배',
    effect: { kind: 'defense_boost', multiplier: 1.5 },
    usablePhases: [] },
  { id: 'c_db2', type: 'chance', text: '철벽 방어! 다음 전투 수비력 2배',
    effect: { kind: 'defense_boost', multiplier: 2.0 },
    usablePhases: [] },

  // ── 경제 전략 ────────────────────────────────────────────────────
  { id: 'c_te', type: 'chance', text: '외교 협상! 이번 통행세 면제',
    effect: { kind: 'toll_exempt' },
    usablePhases: [] },
  { id: 'c_td1', type: 'chance', text: '증세령! 1바퀴 적 통행세 2배',
    effect: { kind: 'toll_double', laps: 1 },
    usablePhases: [] },
  { id: 'c_td2', type: 'chance', text: '가혹한 세금! 2바퀴 적 통행세 2배',
    effect: { kind: 'toll_double', laps: 2 },
    usablePhases: [] },
  { id: 'c_bd1', type: 'chance', text: '건설 붐! 이번 건물 50% 할인',
    effect: { kind: 'build_discount', laps: 1 },
    usablePhases: [] },

  // ── 병력 배치 ────────────────────────────────────────────────────
  { id: 'c_gr1', type: 'chance', text: '증원군 도착! 보유 영토에 랜덤 병사 5명 배치',
    effect: { kind: 'garrison_reinforce', amount: 5 },
    usablePhases: [] },
  { id: 'c_gr2', type: 'chance', text: '대규모 증원! 보유 영토에 랜덤 병사 8명 배치',
    effect: { kind: 'garrison_reinforce', amount: 8 },
    usablePhases: [] },

  // ── 건물 건설 ────────────────────────────────────────────────────
  { id: 'c_fb1', type: 'chance', text: '왕실 지원! 다음 건물 1채 무료 건설',
    effect: { kind: 'free_build' },
    usablePhases: [] },

  // ── 드래곤 ───────────────────────────────────────────────────────
  { id: 'c_dragon', type: 'chance', text: '드래곤의 각성! 5바퀴 후 가장 비싼 땅에 드래곤 출현',
    effect: { kind: 'dragon_summon' },
    usablePhases: [] },

  // ── 이동 / 특수 ──────────────────────────────────────────────────
  { id: 'c_mv', type: 'chance', text: '신속 행군! 원하는 칸으로 이동',
    effect: { kind: 'move_to_tile' },
    usablePhases: [] },
  { id: 'c_sp', type: 'chance', text: '군수물자 조달! 상점으로 이동',
    effect: { kind: 'move_to_shop' },
    usablePhases: [] },
  { id: 'c_rl', type: 'chance', text: '반란 선동! 랜덤 적 땅 초기화',
    effect: { kind: 'reset_land' },
    usablePhases: [] },
];
