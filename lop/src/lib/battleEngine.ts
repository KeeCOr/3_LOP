import type { BattleState, BattleRound, TroopComp, TroopType } from './gameTypes';
import { TROOP_DATA, CHARACTERS } from './gameData';

const COUNTER_BONUS = 0.6;

export function compAttackMod(comp: TroopComp, total: number, vsPiece = false): number {
  if (total === 0) return 1;
  const sum = Object.entries(comp).reduce((s, [t, n]) => {
    const td = TROOP_DATA[t as TroopType];
    const atk = (vsPiece && td.pieceBattleAttack !== undefined) ? td.pieceBattleAttack : td.attack;
    return s + atk * (n ?? 0);
  }, 0);
  return sum / total;
}

export function compDefenseMod(comp: TroopComp, total: number): number {
  if (total === 0) return 1;
  const sum = Object.entries(comp).reduce((s, [t, n]) => s + (TROOP_DATA[t as TroopType].defense * (n ?? 0)), 0);
  return sum / total;
}

export function counterMultiplier(atkComp: TroopComp, atkTotal: number, defComp: TroopComp, defTotal: number): number {
  if (atkTotal === 0 || defTotal === 0) return 1;
  let bonus = 0;
  for (const [aType, aCount] of Object.entries(atkComp) as [TroopType, number][]) {
    const counteredTypes = TROOP_DATA[aType].counters;
    for (const countered of counteredTypes) {
      const dCount = defComp[countered] ?? 0;
      if (dCount > 0) bonus += (aCount / atkTotal) * (dCount / defTotal) * COUNTER_BONUS;
    }
  }
  return 1 + bonus;
}

export const DAMAGE_RATE = 0.35;

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
  if (newAtkTroops <= 0 && newDefTroops <= 0) result = 'defender_wins';
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

export function getBattleAttack(
  piece: { characterType: string; troops: number; composition: TroopComp },
  buildingAttackBonus = 1,
  vsPiece = false
): number {
  const base = (CHARACTERS as Record<string, { attack: number }>)[piece.characterType]?.attack ?? 1.0;
  const compMod = compAttackMod(piece.composition, piece.troops, vsPiece);
  return base * compMod * buildingAttackBonus;
}

export function getBattleDefense(
  piece: { characterType: string; troops: number; composition: TroopComp },
  buildingDefenseBonus = 1
): number {
  const base = (CHARACTERS as Record<string, { defense: number }>)[piece.characterType]?.defense ?? 1.0;
  const compMod = compDefenseMod(piece.composition, piece.troops);
  return base * compMod * buildingDefenseBonus;
}

export function getGarrisonAttack(garrison: TroopComp, total: number, buildingBonus = 1): number {
  return compAttackMod(garrison, total) * buildingBonus;
}

export function getGarrisonDefense(garrison: TroopComp, total: number, buildingBonus = 1): number {
  return compDefenseMod(garrison, total) * buildingBonus;
}
