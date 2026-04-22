import type { GameState } from './gameTypes';
import type { GameAction } from './gameReducer';
import { CHARACTERS } from './gameData';
import { getToll, getBuildCost } from './economyUtils';

export function getAiAction(state: GameState): GameAction {
  const difficulty = state.difficulty;
  const ai = state.ai;
  const aiPieces = state.pieces.filter(p => p.owner === 'ai');

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
          return Math.random() > 0.5 ? { type: 'CHOOSE_FIGHT', tileId } : { type: 'CHOOSE_BUY_LAND', tileId };
        }
        const cost = tile.landPrice || tile.troops * 80;
        if (piece.troops > tile.troops * 1.3) return { type: 'CHOOSE_FIGHT', tileId };
        if (ai.gold >= cost) return { type: 'CHOOSE_BUY_LAND', tileId };
        return { type: 'CHOOSE_FIGHT', tileId };
      }

      if (tile.owner === 'player') {
        if (difficulty === 'easy') return { type: 'CHOOSE_PAY_TOLL', tileId };
        const toll = getToll(tile);
        if (piece.troops > tile.troops * 1.5 && ai.gold > toll * 2) return { type: 'CHOOSE_FIGHT', tileId };
        return { type: 'CHOOSE_PAY_TOLL', tileId };
      }

      return { type: 'CHOOSE_PAY_TOLL', tileId };
    }

    case 'deploy': {
      const tileId = state.activeDeployTileId!;
      const piece = state.pieces.find(p => p.id === state.selectedPieceId)!;
      const deployAmount = Math.min(piece.troops, Math.max(1, Math.floor(piece.troops * 0.3)));
      return { type: 'DEPLOY_TROOPS', tileId, amount: deployAmount };
    }

    case 'build': {
      const tileId = state.activeTileAction!;
      const tile = state.tiles.find(t => t.id === tileId)!;
      if (difficulty === 'easy') return { type: 'SKIP_BUILD' };

      if (ai.gold < 300) return { type: 'SKIP_BUILD' };
      if (ai.gold < 600) {
        const cost = getBuildCost(tile, 'barracks');
        if (cost <= ai.gold) return { type: 'BUILD', tileId, buildingType: 'barracks' };
      } else {
        const preferVault = difficulty === 'hard' && ai.gold < 1000;
        const type = preferVault ? 'vault' : (tile.building ?? 'barracks');
        const cost = getBuildCost(tile, type as 'vault' | 'barracks' | 'fort');
        if (cost <= ai.gold) return { type: 'BUILD', tileId, buildingType: type as 'vault' | 'barracks' | 'fort' };
      }
      return { type: 'SKIP_BUILD' };
    }

    case 'shop': {
      const piece = state.pieces.find(p => p.id === state.selectedPieceId);
      if (piece && piece.troops < 5 && ai.gold >= 250) {
        const buyCount = Math.min(5, Math.floor(ai.gold / 50 / 2));
        if (buyCount > 0) return { type: 'BUY_TROOPS', pieceId: piece.id, amount: buyCount };
      }
      return { type: 'CLOSE_SHOP' };
    }

    case 'event_card':
      return { type: 'APPLY_EVENT_CARD' };

    default:
      return { type: 'END_TURN' };
  }
}
