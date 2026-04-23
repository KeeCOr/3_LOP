import type { BattleState, BattleRound, TroopComp } from './gameTypes';
import { TROOP_DATA } from './gameData';

export function compAttackMod(comp: TroopComp, total: number): number {
  if (total === 0) return 1;
  const sum = Object.entries(comp).reduce((s, [t, n]) => s + (TROOP_DATA[t as keyof typeof TROOP_DATA].attack * (n ?? 0)), 0);
  return sum / total;
}

export function compDefenseMod(comp: TroopComp, total: number): number {
  if (total === 0) return 1;
  const sum = Object.entries(comp).reduce((s, [t, n]) => s + (TROOP_DATA[t as keyof typeof TROOP_DATA].defense * (n ?? 0)), 0);
  return sum / total;
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
  piece: { characterType: string; equipment: { attackBonus: number }[]; troops: number; composition: TroopComp },
  buildingAttackBonus = 1
): number {
  const charData = { general: 1.3, knight: 1.1, merchant: 0.9, scout: 1.0 } as Record<string, number>;
  const base = charData[piece.characterType] ?? 1.0;
  const equipBonus = piece.equipment.reduce((acc, e) => acc * e.attackBonus, 1);
  const compMod = compAttackMod(piece.composition, piece.troops);
  return base * equipBonus * compMod * buildingAttackBonus;
}

export function getBattleDefense(
  piece: { characterType: string; equipment: { defenseBonus: number }[]; troops: number; composition: TroopComp },
  buildingDefenseBonus = 1
): number {
  const charData = { general: 0.8, knight: 1.2, merchant: 0.9, scout: 1.0 } as Record<string, number>;
  const base = charData[piece.characterType] ?? 1.0;
  const equipBonus = piece.equipment.reduce((acc, e) => acc * e.defenseBonus, 1);
  const compMod = compDefenseMod(piece.composition, piece.troops);
  return base * equipBonus * compMod * buildingDefenseBonus;
}

export function getGarrisonAttack(garrison: TroopComp, total: number, buildingBonus = 1): number {
  return compAttackMod(garrison, total) * buildingBonus;
}

export function getGarrisonDefense(garrison: TroopComp, total: number, buildingBonus = 1): number {
  return compDefenseMod(garrison, total) * buildingBonus;
}
