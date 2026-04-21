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

export const BASE_LAND_PRICE = 300;
export const TROOP_PRICE = 50;
export const LAP_TROOP_BONUS = 5;
export const LAP_GOLD_BONUS = 200;
export const TAX_RATE = 0.1;

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
