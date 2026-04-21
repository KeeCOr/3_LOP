import type { TileType } from './gameTypes';

export interface TileDefinition {
  index: number;
  type: TileType;
  label: string;
  gridRow: number;
  gridCol: number;
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
  const to = (from + steps) % TOTAL_TILES;
  if (from < startIndex) return to >= startIndex || to < from;
  return to < startIndex && to >= 0;
}
