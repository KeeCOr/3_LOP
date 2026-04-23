import type { GameState, Piece, Tile, CharacterType, Difficulty, TroopComp, TroopType } from './gameTypes';
import { LAND_INDICES, PLAYER_START, AI_START, nextPosition, didPassStart } from './boardLayout';
import { CHARACTERS, TROOP_DATA, LAP_TROOP_BONUS, LAP_GOLD_BONUS, nextHireCost, CHANCE_CARDS, COMMUNITY_CARDS, EQUIPMENT } from './gameData';
import { getToll, getLapIncome, getLapTroops, calcTax, getBuildCost, getBuildingAttackBonus, getBuildingDefenseBonus } from './economyUtils';
import { runFullBattle, getBattleAttack, getBattleDefense, getGarrisonAttack, getGarrisonDefense } from './battleEngine';

function totalComp(comp: TroopComp): number {
  return Object.values(comp).reduce((s, n) => s + (n ?? 0), 0);
}

function scaleComp(comp: TroopComp, newTotal: number): TroopComp {
  const old = totalComp(comp);
  if (old === 0 || newTotal === 0) return {};
  const ratio = newTotal / old;
  const result: TroopComp = {};
  let assigned = 0;
  const entries = Object.entries(comp) as [TroopType, number][];
  entries.forEach(([t, n], i) => {
    if (i === entries.length - 1) {
      result[t] = Math.max(0, newTotal - assigned);
    } else {
      const scaled = Math.round((n ?? 0) * ratio);
      result[t] = scaled;
      assigned += scaled;
    }
  });
  return result;
}

function addToComp(comp: TroopComp, type: TroopType, amount: number): TroopComp {
  return { ...comp, [type]: (comp[type] ?? 0) + amount };
}

function createPiece(id: string, owner: 'player' | 'ai', characterType: CharacterType, startIndex: number): Piece {
  return { id, owner, characterType, position: startIndex, troops: 10, composition: { infantry: 10 }, equipment: [], startTileIndex: startIndex };
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
    const startOwner = i === PLAYER_START ? 'player' : i === AI_START ? 'ai' : null;
    return {
      id: i,
      type: LAND_INDICES.includes(i) ? 'land' : i === 0 ? 'start_p' : i === 7 ? 'start_e' : i === 3 ? 'shop' : i === 12 ? 'tax' : i === 5 ? 'chance' : 'community',
      owner: startOwner ?? (troops > 0 ? 'neutral' : null),
      troops,
      garrison: troops > 0 ? { spearman: Math.ceil(troops * 0.4), infantry: Math.floor(troops * 0.6) } : {},
      building: null,
      buildingLevel: 0,
      landPrice,
    } as Tile;
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
  | { type: 'CHOOSE_PASS' }
  | { type: 'SELL_LAND'; tileId: number }
  | { type: 'CONFIRM_FORCED_SELL' }
  | { type: 'COLLECT_TROOPS'; tileId: number }
  | { type: 'BATTLE_NEXT_ROUND' }
  | { type: 'BATTLE_FINISH' }
  | { type: 'DEPLOY_TROOPS'; tileId: number; garrison: TroopComp }
  | { type: 'BUILD'; tileId: number; buildingType: 'vault' | 'barracks' | 'fort' }
  | { type: 'SKIP_BUILD' }
  | { type: 'BUY_TROOPS'; pieceId: string; troopType: TroopType; amount: number }
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

      if (passedStart) {
        const lapIncome = state.tiles.filter(t => t.owner === owner).reduce((sum, t) => sum + getLapIncome(t), 0);
        const lapTroops = state.tiles.filter(t => t.owner === owner).reduce((sum, t) => sum + getLapTroops(t), 0);
        const maxTroops = CHARACTERS[piece.characterType].maxTroops + piece.equipment.reduce((a, e) => a + e.commandBonus, 0);
        newState = {
          ...newState,
          [owner]: { ...newState[owner], gold: newState[owner].gold + LAP_GOLD_BONUS + lapIncome },
          pieces: newState.pieces.map(p => {
            if (p.id !== piece.id) return p;
            const bonus = Math.min(maxTroops - p.troops, LAP_TROOP_BONUS + lapTroops);
            return { ...p, troops: p.troops + bonus, composition: addToComp(p.composition, 'infantry', bonus) };
          }),
          tiles: newState.tiles.map(t => {
            if (t.owner !== owner || t.type !== 'land') return t;
            const replenish = 1 + (t.building === 'barracks' ? t.buildingLevel : 0);
            return { ...t, troops: t.troops + replenish, garrison: addToComp(t.garrison, 'infantry', replenish) };
          }),
          log: [...newState.log, `출발점 통과! 골드 +${LAP_GOLD_BONUS + lapIncome}, 병력 +${LAP_TROOP_BONUS + lapTroops}, 영토 병력 보강`],
        };
      }

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
        defenderAttack: getGarrisonAttack(tile.garrison, tile.troops, getBuildingAttackBonus(tile)),
        defenderDefense: getGarrisonDefense(tile.garrison, tile.troops, getBuildingDefenseBonus(tile)),
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
        const scaledComp = scaleComp(piece.composition, finishedBattle.attackerTroops);
        const newState = {
          ...state,
          activeBattle: finishedBattle,
          pieces: state.pieces.map(p => p.id === piece.id
            ? { ...p, troops: finishedBattle.attackerTroops, composition: scaledComp }
            : p),
          activeDeployTileId: battle.defenderTileId,
          turnPhase: 'deploy' as const,
          log: [...state.log, `${owner} 전투 승리! ${battle.defenderTileId}번 땅 점령 가능`],
        };
        return { ...newState, activeBattle: null };
      } else {
        const newState = {
          ...state,
          activeBattle: null,
          pieces: state.pieces.map(p => p.id === piece.id
            ? { ...p, troops: 0, composition: {}, position: piece.startTileIndex }
            : p),
          turnPhase: 'end_turn' as const,
          log: [...state.log, `${owner} 전투 패배. ${piece.id} 귀환`],
        };
        return checkBankruptcy(newState);
      }
    }

    case 'DEPLOY_TROOPS': {
      const piece = state.pieces.find(p => p.id === state.selectedPieceId)!;
      const owner = state.currentTurn;
      const deployed = totalComp(action.garrison);
      if (deployed <= 0) return { ...state, activeDeployTileId: null, turnPhase: 'end_turn' };
      const subtracted: TroopComp = {};
      (Object.keys(action.garrison) as TroopType[]).forEach(t => {
        subtracted[t] = (piece.composition[t] ?? 0) - (action.garrison[t] ?? 0);
      });
      const newComp: TroopComp = { ...piece.composition, ...subtracted };
      const newTiles = state.tiles.map(t => t.id === action.tileId
        ? { ...t, owner, troops: deployed, garrison: action.garrison }
        : t
      );
      const newPieces = state.pieces.map(p => p.id === piece.id
        ? { ...p, troops: p.troops - deployed, composition: newComp }
        : p);
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
      if (!exempt && state[owner].gold < toll) {
        const ownedLands = state.tiles.filter(t => t.owner === owner && t.type === 'land');
        if (ownedLands.length > 0) {
          return {
            ...state,
            activeTileAction: action.tileId,
            turnPhase: 'forced_sell' as const,
            log: [...state.log, `통행세 ${toll}골드 부족! 보유 땅을 팔아야 합니다.`],
          };
        }
      }
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

    case 'CHOOSE_PASS': {
      return { ...state, activeTileAction: null, turnPhase: 'end_turn' };
    }

    case 'SELL_LAND': {
      const tile = state.tiles.find(t => t.id === action.tileId)!;
      const owner = state.currentTurn;
      const sellPrice = Math.floor(tile.landPrice * 0.6);
      return {
        ...state,
        [owner]: { ...state[owner], gold: state[owner].gold + sellPrice },
        tiles: state.tiles.map(t => t.id === action.tileId
          ? { ...t, owner: 'neutral' as const, garrison: {}, building: null, buildingLevel: 0 }
          : t),
        log: [...state.log, `${owner === 'player' ? '플레이어' : 'AI'} ${action.tileId}번 땅 매각 (+${sellPrice}골드)`],
      };
    }

    case 'CONFIRM_FORCED_SELL': {
      const tileId = state.activeTileAction!;
      const tile = state.tiles.find(t => t.id === tileId)!;
      const owner = state.currentTurn;
      const opponent = owner === 'player' ? 'ai' : 'player';
      const tollDouble = state[opponent].tollDoubleLaps > 0;
      const toll = getToll(tile, tollDouble);
      let newState = {
        ...state,
        [owner]: { ...state[owner], gold: state[owner].gold - toll },
        [opponent]: { ...state[opponent], gold: state[opponent].gold + toll },
        activeTileAction: null,
        turnPhase: 'end_turn' as const,
        log: [...state.log, `통행세 ${toll}골드 납부 완료`],
      };
      return checkBankruptcy(newState);
    }

    case 'COLLECT_TROOPS': {
      const tile = state.tiles.find(t => t.id === action.tileId)!;
      const piece = state.pieces.find(p => p.id === state.selectedPieceId)!;
      const owner = state.currentTurn;
      const maxTroops = CHARACTERS[piece.characterType].maxTroops + piece.equipment.reduce((a, e) => a + e.commandBonus, 0);
      const canCollect = Math.min(tile.troops, maxTroops - piece.troops);
      if (canCollect <= 0) return { ...state, activeTileAction: null, turnPhase: 'end_turn' };
      const collectComp = scaleComp(tile.garrison, canCollect);
      const remainComp = scaleComp(tile.garrison, tile.troops - canCollect);
      const mergedComp: TroopComp = { ...piece.composition };
      (Object.keys(collectComp) as TroopType[]).forEach(t => {
        mergedComp[t] = (mergedComp[t] ?? 0) + (collectComp[t] ?? 0);
      });
      return {
        ...state,
        pieces: state.pieces.map(p => p.id === piece.id
          ? { ...p, troops: p.troops + canCollect, composition: mergedComp }
          : p),
        tiles: state.tiles.map(t => t.id === action.tileId
          ? { ...t, troops: t.troops - canCollect, garrison: remainComp }
          : t),
        activeTileAction: null,
        turnPhase: 'end_turn' as const,
        log: [...state.log, `${owner === 'player' ? '플레이어' : 'AI'} ${action.tileId}번 땅 병력 ${canCollect}명 징집`],
      };
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
      const troopData = TROOP_DATA[action.troopType];
      const maxTroops = CHARACTERS[piece.characterType].maxTroops + piece.equipment.reduce((a, e) => a + e.commandBonus, 0);
      const canBuy = Math.min(action.amount, Math.floor(state[owner].gold / troopData.price), maxTroops - piece.troops);
      if (canBuy <= 0) return state;
      return {
        ...state,
        [owner]: { ...state[owner], gold: state[owner].gold - canBuy * troopData.price },
        pieces: state.pieces.map(p => p.id === piece.id
          ? { ...p, troops: p.troops + canBuy, composition: addToComp(p.composition, action.troopType, canBuy) }
          : p),
      };
    }

    case 'BUY_PIECE': {
      const owner = state.currentTurn;
      const cost = nextHireCost(state[owner].pieceCount);
      if (state[owner].gold < cost) return state;
      const newId = `${owner[0]}${state[owner].pieceCount}`;
      const startIdx = owner === 'player' ? PLAYER_START : AI_START;
      const newPiece = createPiece(newId, owner as 'player' | 'ai', action.characterType, startIdx);
      return {
        ...state,
        [owner]: { ...state[owner], gold: state[owner].gold - cost, pieceCount: state[owner].pieceCount + 1 },
        pieces: [...state.pieces, newPiece],
      };
    }

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
      return owner === 'player'
        ? { ...state, turnPhase: 'shop' }
        : { ...state, turnPhase: 'end_turn' };
    case 'start_e':
      return owner === 'ai'
        ? { ...state, turnPhase: 'shop' }
        : { ...state, turnPhase: 'end_turn' };

    case 'land': {
      if (tile.owner === null || tile.owner === 'neutral') {
        return { ...state, activeTileAction: tileId, turnPhase: 'tile_event' };
      }
      if (tile.owner === owner) {
        return { ...state, activeTileAction: tileId, turnPhase: 'build' };
      }
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

function applyEventCard(state: GameState, card: typeof state.activeEvent): GameState {
  if (!card) return state;
  const owner = state.currentTurn;
  const effect = card.effect;
  let newState: GameState = { ...state, activeEvent: null, turnPhase: 'end_turn' };

  switch (effect.kind) {
    case 'gold':
      if (effect.target === 'all') {
        newState = { ...newState, player: { ...newState.player, gold: newState.player.gold + effect.amount }, ai: { ...newState.ai, gold: newState.ai.gold + effect.amount } };
      } else {
        newState = { ...newState, [owner]: { ...newState[owner], gold: newState[owner].gold + effect.amount } };
      }
      break;
    case 'troops': {
      const activePiece = newState.pieces.filter(p => p.owner === owner)[0];
      if (activePiece) {
        const maxTroops = CHARACTERS[activePiece.characterType].maxTroops + activePiece.equipment.reduce((a, e) => a + e.commandBonus, 0);
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
