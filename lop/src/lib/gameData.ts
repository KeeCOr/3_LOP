import type { CharacterType, Equipment, EventCard, BuildingType, TroopType } from './gameTypes';

export const TROOP_DATA: Record<TroopType, {
  name: string; emoji: string; attack: number; defense: number; price: number; desc: string; counters: TroopType[];
}> = {
  swordsman: { name: '검사',   emoji: '⚔️',  attack: 1.1, defense: 1.0, price: 60,  desc: '저렴한 균형형. 창병에 강함',              counters: ['spearman'] },
  archer:    { name: '궁사',   emoji: '🏹',  attack: 1.5, defense: 0.5, price: 80,  desc: '고공격. 검사·창병에 강함',               counters: ['swordsman', 'spearman'] },
  cavalry:   { name: '기마병', emoji: '🐎',  attack: 1.4, defense: 0.7, price: 120, desc: '비싼 돌격대. 검사·궁사에 강하나 창병에 약함', counters: ['swordsman', 'archer'] },
  spearman:  { name: '창병',   emoji: '🔱',  attack: 0.6, defense: 1.6, price: 70,  desc: '저렴한 수비형. 기마병에 강함',             counters: ['cavalry'] },
};

export const CHARACTERS: Record<CharacterType, {
  name: string;
  attack: number;
  defense: number;
  maxTroops: number;
  moveBonus: number;
  description: string;
  skill: { name: string; desc: string };
}> = {
  general:  { name: '장군', attack: 1.3, defense: 0.8, maxTroops: 20, moveBonus: 0, description: '강력한 공격력',     skill: { name: '공세',     desc: '전투 공격력 +20%' } },
  knight:   { name: '기사', attack: 1.1, defense: 1.2, maxTroops: 15, moveBonus: 1, description: '균형잡힌 수비형', skill: { name: '기마 지휘', desc: '기마병 공격력 +20%' } },
  merchant: { name: '상인', attack: 0.9, defense: 0.9, maxTroops: 12, moveBonus: 0, description: '경제 특화',       skill: { name: '협상술',   desc: '고용·구매 10% 할인' } },
  scout:    { name: '척후', attack: 1.0, defense: 1.0, maxTroops: 10, moveBonus: 2, description: '빠른 이동',       skill: { name: '신속',     desc: '이동력 항상 +2' } },
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
    description: '한 바퀴마다 병력 생산 +',
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

export const BASE_LAND_PRICE = 300;
export const TROOP_PRICE = 50;
export const LAP_TROOP_BONUS = 5;
export const LAP_GOLD_BONUS = 200;
export const LAP_LAND_PRODUCTION = 2;
export const TAX_RATE = 0.1;
export const TROOP_PRICE_SCALE = 0.06;

export const HIRE_COST_BASE = [0, 500, 1200, 2500, 5000];
export function nextHireCost(count: number): number {
  if (count < HIRE_COST_BASE.length) return HIRE_COST_BASE[count];
  return Math.floor(HIRE_COST_BASE[HIRE_COST_BASE.length - 1] * Math.pow(2, count - HIRE_COST_BASE.length + 1) + 300);
}

export const CHANCE_CARDS: EventCard[] = [
  // 골드
  { id: 'c1',   type: 'chance', text: '황금 전리품! 골드 200 획득',                      effect: { kind: 'gold', amount: 200, target: 'self' } },
  { id: 'c2',   type: 'chance', text: '세금 폭탄! 골드 150 손실',                         effect: { kind: 'gold', amount: -150, target: 'self' } },
  { id: 'com1', type: 'chance', text: '풍년! 모든 진영 골드 100 지급',                    effect: { kind: 'gold', amount: 100, target: 'all' } },
  // 병력
  { id: 'c3',   type: 'chance', text: '지원군 도착! 병력 5명 지급',                       effect: { kind: 'troops', amount: 5 } },
  { id: 'com6', type: 'chance', text: '군사 원조! 모든 진영 병력 3명 지급',               effect: { kind: 'troops', amount: 3 } },
  // 전투
  { id: 'c4',   type: 'chance', text: '다음 전투 공격력 1.5배!',                          effect: { kind: 'attack_boost', multiplier: 1.5 } },
  // 이동
  { id: 'c5',   type: 'chance', text: '군수물자 조달! 가장 가까운 상점으로 이동',         effect: { kind: 'move_to_shop' } },
  { id: 'c_mv', type: 'chance', text: '신속 행군! 원하는 칸으로 이동',                    effect: { kind: 'move_to_tile' } },
  // 경제
  { id: 'c6',   type: 'chance', text: '외교 협상! 다음 통행세 면제 1회',                  effect: { kind: 'toll_exempt' } },
  { id: 'com2', type: 'chance', text: '대규모 징집! 이 바퀴 통행세 2배',                  effect: { kind: 'toll_double', laps: 1 } },
  { id: 'com3', type: 'chance', text: '건설 붐! 이 바퀴 건물 비용 50% 할인',              effect: { kind: 'build_discount', laps: 1 } },
  { id: 'com4', type: 'chance', text: '반란 발생! 무작위 땅 1곳 중립으로 전환',           effect: { kind: 'reset_land' } },
  { id: 'com5', type: 'chance', text: '순풍! 다음 턴 주사위 +2',                          effect: { kind: 'dice_bonus', amount: 2 } },
  // 용병 고용 (골드 소모)
  { id: 'c_b1', type: 'chance', text: '용병 고용! 300골드로 병력 10명 즉시 징집',         effect: { kind: 'troop_boost', costPerTroop: 30, maxAmount: 10 } },
  { id: 'c_b2', type: 'chance', text: '정예 용병단! 600골드로 병력 20명 즉시 징집',       effect: { kind: 'troop_boost', costPerTroop: 30, maxAmount: 20 } },
  // 방어 (수비 개입용)
  { id: 'c_d1', type: 'chance', text: '수비 지원군! 적 공격 시 방어 영토에 병력 5명 증원', effect: { kind: 'defense_reinforce', amount: 5 } },
  { id: 'c_d2', type: 'chance', text: '요새화! 적 공격 시 이번 수비력 1.5배 강화',        effect: { kind: 'defense_boost', multiplier: 1.5 } },
];
