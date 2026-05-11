import type { Tile, BuildingType } from './gameTypes';
import { BUILDING_DATA, TAX_RATE } from './gameData';

export function getToll(tile: Tile, tollDouble = false, lapCount = 0): number {
  const lapBonus = 1 + lapCount * 0.12;
  const buildingEntries = Object.entries(tile.buildings ?? {}) as [BuildingType, number][];
  // Use the highest toll among all buildings; fall back to baseToll if no buildings
  const buildingMaxToll = buildingEntries.reduce((max, [type, level]) =>
    level > 0 ? Math.max(max, BUILDING_DATA[type].toll[level - 1]) : max, 0);
  const base = buildingMaxToll > 0 ? buildingMaxToll : (tile.baseToll ?? 50);
  const scaled = Math.round(base * lapBonus / 10) * 10;
  return tollDouble ? scaled * 2 : scaled;
}

export function getLapIncome(tile: Tile): number {
  const level = tile.buildings?.vault ?? 0;
  if (level === 0) return 0;
  return BUILDING_DATA.vault.lapIncome![level - 1];
}

export function getLapTroops(tile: Tile): number {
  const level = tile.buildings?.barracks ?? 0;
  if (level === 0) return 0;
  return BUILDING_DATA.barracks.lapTroops![level - 1];
}

export function getBuildingAttackBonus(tile: Tile): number {
  const level = tile.buildings?.fort ?? 0;
  if (level === 0) return 1;
  return BUILDING_DATA.fort.attackBonus![level - 1];
}

export function getBuildingDefenseBonus(tile: Tile): number {
  const level = tile.buildings?.fort ?? 0;
  if (level === 0) return 1;
  return BUILDING_DATA.fort.defenseBonus![level - 1];
}

export function getBuildCost(tile: Tile, type: BuildingType, discount = false): number {
  const level = tile.buildings?.[type] ?? 0;
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
