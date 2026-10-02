import type { GameState, PlayerState, PlayerType, CharacterType } from './gameTypes';
import type { GameAction } from './gameReducer';
import { CHARACTERS, TROOP_DATA, nextHireCost } from './gameData';
import { getToll, getBuildCost } from './economyUtils';

function getAiPS(state: GameState): PlayerState {
  const id = state.currentTurn;
  if (id === 'ai2') return state.ai2!;
  if (id === 'ai3') return state.ai3!;
  return state.ai;
}

function getOpponentPS(state: GameState, tileOwner: PlayerType): PlayerState {
  if (tileOwner === 'ai2') return state.ai2!;
  if (tileOwner === 'ai3') return state.ai3!;
  if (tileOwner === 'player') return state.player;
  return state.ai;
}

export function getAiAction(state: GameState): GameAction {
  const difficulty = state.difficulty;
  const ai = getAiPS(state);
  const aiPieces = state.pieces.filter(p => p.owner === state.currentTurn);

  // Clear lap bonus animation immediately for AI turns
  if (state.lapBonusAnim) return { type: 'CLEAR_LAP_BONUS' };

  switch (state.turnPhase) {
    case 'roll':
      return { type: 'ROLL_DICE' };

    case 'select_piece': {
      if (difficulty === 'easy') {
        const piece = aiPieces[Math.floor(Math.random() * aiPieces.length)];
        return { type: 'SELECT_PIECE', pieceId: piece.id };
      }
      const best = aiPieces.reduce((a, b) => a.troops > b.troops ? a : b);
      return { type: 'SELECT_PIECE', pieceId: best.id };
    }

    case 'tile_event': {
      const tileId = state.activeTileAction!;
      const tile = state.tiles.find(t => t.id === tileId)!;
      const piece = state.pieces.find(p => p.id === state.selectedPieceId)!;

      if (tile.owner === 'neutral' || tile.owner === null) {
        if (difficulty === 'easy') {
          if (Math.random() < 0.3) return { type: 'CHOOSE_PASS' };
          return Math.random() > 0.5 ? { type: 'CHOOSE_FIGHT', tileId } : { type: 'CHOOSE_BUY_LAND', tileId };
        }
        const cost = tile.landPrice || tile.troops * 80;
        if (ai.gold < cost && piece.troops <= tile.troops) return { type: 'CHOOSE_PASS' };
        if (piece.troops > tile.troops * 1.3) return { type: 'CHOOSE_FIGHT', tileId };
        if (ai.gold >= cost) return { type: 'CHOOSE_BUY_LAND', tileId };
        return { type: 'CHOOSE_PASS' };
      }

      if (tile.owner !== state.currentTurn) {
        if (difficulty === 'easy') return { type: 'CHOOSE_PAY_TOLL', tileId };
        const toll = getToll(tile, false, state.lapCount);
        // Fight when troop advantage AND toll is expensive relative to gold
        const tollBurden = toll / Math.max(1, ai.gold);
        if (piece.troops > tile.troops * 1.3 && tollBurden > 0.2) return { type: 'CHOOSE_FIGHT', tileId };
        if (piece.troops > tile.troops * 1.8) return { type: 'CHOOSE_FIGHT', tileId };
        return { type: 'CHOOSE_PAY_TOLL', tileId };
      }

      return { type: 'CHOOSE_PAY_TOLL', tileId };
    }

    case 'forced_sell': {
      const tileId = state.activeTileAction!;
      const tile = state.tiles.find(t => t.id === tileId)!;
      const tileOwner = tile.owner;
      const ownerPS = tileOwner && tileOwner !== 'neutral' ? getOpponentPS(state, tileOwner as PlayerType) : null;
      const tollDouble = ownerPS ? ownerPS.tollDoubleLaps > 0 : false;
      const toll = getToll(tile, tollDouble, state.lapCount);
      if (ai.gold < toll) {
        const ownedLands = state.tiles
          .filter(t => t.owner === state.currentTurn && t.type === 'land')
          .sort((a, b) => a.landPrice - b.landPrice);
        if (ownedLands.length > 0) return { type: 'SELL_LAND', tileId: ownedLands[0].id };
      }
      return { type: 'CONFIRM_FORCED_SELL' };
    }

    case 'deploy': {
      const tileId = state.activeDeployTileId!;
      const piece = state.pieces.find(p => p.id === state.selectedPieceId)!;
      const deployRatio = 0.3;
      const garrison: import('./gameTypes').TroopComp = {};
      let totalDeployed = 0;
      (Object.keys(piece.composition) as import('./gameTypes').TroopType[]).forEach(t => {
        const n = piece.composition[t] ?? 0;
        const d = Math.floor(n * deployRatio);
        if (d > 0) { garrison[t] = d; totalDeployed += d; }
      });
      if (totalDeployed === 0) {
        const firstType = (Object.keys(piece.composition) as import('./gameTypes').TroopType[]).find(t => (piece.composition[t] ?? 0) > 0);
        if (firstType) { garrison[firstType] = 1; }
      }
      return { type: 'DEPLOY_TROOPS', tileId, garrison };
    }

    case 'build': {
      const tileId = state.activeTileAction!;
      const tile = state.tiles.find(t => t.id === tileId)!;
      const piece = state.pieces.find(p => p.id === state.selectedPieceId)!;
      const maxTroops = CHARACTERS[piece.characterType].maxTroops;
      if (tile.troops > 0 && piece.troops < maxTroops * 0.7) {
        return { type: 'COLLECT_TROOPS', tileId };
      }
      if (difficulty === 'easy') return { type: 'SKIP_BUILD' };
      if (ai.gold < 300) return { type: 'SKIP_BUILD' };
      const preferredType: 'vault' | 'barracks' | 'fort' =
        ai.gold < 600 ? 'barracks' :
        (difficulty === 'hard' && ai.gold < 1000) ? 'vault' : 'barracks';
      const cost = getBuildCost(tile, preferredType);
      if (cost !== Infinity && cost <= ai.gold) return { type: 'BUILD', tileId, buildingType: preferredType };
      return { type: 'SKIP_BUILD' };
    }

    case 'shop': {
      const piece = state.pieces.find(p => p.id === state.selectedPieceId);
      // Hire a new piece on normal/hard if under piece cap and has surplus gold
      if (difficulty !== 'easy') {
        const maxPieces = difficulty === 'hard' ? 3 : 2;
        if (aiPieces.length < maxPieces) {
          const hireCost = nextHireCost(ai.pieceCount);
          if (ai.gold >= hireCost * 1.5) {
            const charTypes: CharacterType[] = ['general', 'pirate', 'warlock', 'agitator'];
            const charType = charTypes[Math.floor(Math.random() * charTypes.length)];
            return { type: 'BUY_PIECE', characterType: charType };
          }
        }
      }
      if (piece && piece.troops < 8 && ai.gold >= 200) {
        const troopType = difficulty === 'hard' ? 'spearman' : 'swordsman';
        const price = TROOP_DATA[troopType].price;
        const buyCount = Math.min(5, Math.floor(ai.gold / price / 2));
        if (buyCount > 0) return { type: 'BUY_TROOPS', pieceId: piece.id, troopType, amount: buyCount };
      }
      return { type: 'CLOSE_SHOP' };
    }

    case 'event_card':
      return { type: 'APPLY_EVENT_CARD' };

    case 'mercenary': {
      // If mercenary already hired (auto-joined piece), close modal
      if (state.mercenaryResult !== null) {
        return { type: 'CLOSE_MERCENARY' };
      }
      const piece = state.pieces.find(p => p.id === state.selectedPieceId)
        ?? state.pieces.find(p => p.owner === state.currentTurn);
      const MERC_COST = 400;
      if (piece && piece.troops < 8 && ai.gold >= MERC_COST * 2) {
        return { type: 'BUY_MERCENARY' };
      }
      return { type: 'CLOSE_MERCENARY' };
    }

    default:
      return { type: 'END_TURN' };
  }
}
