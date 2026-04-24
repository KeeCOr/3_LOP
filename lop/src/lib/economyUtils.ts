import type { Tile } from './gameTypes';
import { BUILDING_DATA, TAX_RATE } from './gameData';

export function getToll(tile: Tile, tollDouble = false, lapCount = 0): number {
  const lapBonus = 1 + lapCount * 0.08; // +8% per global lap
  let base: number;
  if (tile.building && tile.buildingLevel > 0) {
    base = BUILDING_DATA[tile.building].toll[tile.buildingLevel - 1];
  } else {
    base = tile.baseToll ?? 50;
  }
  const scaled = Math.round(base * lapBonus / 10) * 10;
  return tollDouble ? scaled * 2 : scaled;
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
  if (level >= 3) return Infinity;
  const cost = BUILDING_DATA[type].cost[level];
  return discount ? Math.floor(cost * 0.5) : cost;
}

export function calcTax(gold: number): number {
  return Math.floor(gold * TAX_RATE);
}

export function isBankrupt(gold: number): boolean {
  return gold <= 0;
}
