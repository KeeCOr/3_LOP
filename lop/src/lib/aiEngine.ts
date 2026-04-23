import type { GameState } from './gameTypes';
import type { GameAction } from './gameReducer';
import { CHARACTERS, TROOP_DATA } from './gameData';
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
          if (Math.random() < 0.3) return { type: 'CHOOSE_PASS' };
          return Math.random() > 0.5 ? { type: 'CHOOSE_FIGHT', tileId } : { type: 'CHOOSE_BUY_LAND', tileId };
        }
        const cost = tile.landPrice || tile.troops * 80;
        if (ai.gold < cost && piece.troops <= tile.troops) return { type: 'CHOOSE_PASS' };
        if (piece.troops > tile.troops * 1.3) return { type: 'CHOOSE_FIGHT', tileId };
        if (ai.gold >= cost) return { type: 'CHOOSE_BUY_LAND', tileId };
        return { type: 'CHOOSE_PASS' };
      }

      if (tile.owner === 'player') {
        if (difficulty === 'easy') return { type: 'CHOOSE_PAY_TOLL', tileId };
        const toll = getToll(tile);
        if (piece.troops > tile.troops * 1.5 && ai.gold > toll * 2) return { type: 'CHOOSE_FIGHT', tileId };
        return { type: 'CHOOSE_PAY_TOLL', tileId };
      }

      return { type: 'CHOOSE_PAY_TOLL', tileId };
    }

    case 'forced_sell': {
      const tileId = state.activeTileAction!;
      const tile = state.tiles.find(t => t.id === tileId)!;
      const opponent = state.currentTurn === 'ai' ? 'player' : 'ai';
      const tollDouble = state[opponent].tollDoubleLaps > 0;
      const toll = getToll(tile, tollDouble);
      if (ai.gold < toll) {
        const ownedLands = state.tiles
          .filter(t => t.owner === 'ai' && t.type === 'land')
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
      if (piece && piece.troops < 8 && ai.gold >= 200) {
        const troopType = difficulty === 'hard' ? 'spearman' : 'infantry';
        const price = TROOP_DATA[troopType].price;
        const buyCount = Math.min(5, Math.floor(ai.gold / price / 2));
        if (buyCount > 0) return { type: 'BUY_TROOPS', pieceId: piece.id, troopType, amount: buyCount };
      }
      return { type: 'CLOSE_SHOP' };
    }

    case 'event_card':
      return { type: 'APPLY_EVENT_CARD' };

    default:
      return { type: 'END_TURN' };
  }
}
