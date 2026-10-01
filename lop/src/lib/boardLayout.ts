import type { TileType } from './gameTypes';

export interface TileDefinition {
  index: number;
  type: TileType;
  label: string;
  gridRow: number;
  gridCol: number;
}

export const TILE_DEFINITIONS: TileDefinition[] = [
  { index: 0,  type: 'start_p', label: '왕도 성문',    gridRow: 1, gridCol: 1 },
  { index: 1,  type: 'land',    label: '드래곤 고원',  gridRow: 1, gridCol: 2 },
  { index: 2,  type: 'land',    label: '남부 평원',    gridRow: 1, gridCol: 3 },
  { index: 3,  type: 'mercenary', label: '용병소',       gridRow: 1, gridCol: 4 },
  { index: 4,  type: 'land',    label: '황금 계곡',    gridRow: 1, gridCol: 5 },
  { index: 5,  type: 'chance',  label: '운명의 길',    gridRow: 2, gridCol: 5 },
  { index: 6,  type: 'land',    label: '서쪽 숲길',    gridRow: 3, gridCol: 5 },
  { index: 7,  type: 'start_e', label: '변방 요새',    gridRow: 4, gridCol: 5 },
  { index: 8,  type: 'land',    label: '동부 항구',    gridRow: 4, gridCol: 4 },
  { index: 9,  type: 'land',    label: '철광 산맥',    gridRow: 4, gridCol: 3 },
  { index: 10, type: 'mercenary', label: '용병 시장',    gridRow: 4, gridCol: 2 },
  { index: 11, type: 'land',    label: '포호스 강',    gridRow: 4, gridCol: 1 },
  { index: 12, type: 'chance',  label: '고갯길 쉼터',  gridRow: 3, gridCol: 1 },
  { index: 13, type: 'land',    label: '북부 고지',    gridRow: 2, gridCol: 1 },
];

export const TOTAL_TILES = 14;
export const PLAYER_START = 0;
export const AI_START = 7;
export const LAND_INDICES = [1, 2, 4, 6, 8, 9, 11, 13];

export function nextPosition(current: number, steps: number): number {
  return (current + steps) % TOTAL_TILES;
}

export function didPassStart(from: number, steps: number, startIndex: number): boolean {
  if (steps <= 0) return false;
  if (steps >= TOTAL_TILES) return true;
  const to = (from + steps) % TOTAL_TILES;
  if (from + steps < TOTAL_TILES) {
    return startIndex > from && startIndex <= to;
  } else {
    return startIndex > from || startIndex <= to;
  }
}
