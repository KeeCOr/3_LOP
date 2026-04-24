import type { GameState, TroopType } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';
import { getToll, getLapTroops } from '@/lib/economyUtils';
import { TROOP_DATA, LAP_LAND_PRODUCTION } from '@/lib/gameData';
import { FACTION_COLORS } from '@/lib/factionColors';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }

export default function TileActionModal({ state, dispatch }: Props) {
  const tileId = state.activeTileAction!;
  const tile = state.tiles.find(t => t.id === tileId)!;
  const piece = state.pieces.find(p => p.id === state.selectedPieceId)!;
  const toll = getToll(tile, false, state.lapCount);
  const landCost = tile.landPrice || tile.troops * 80;
  const isNeutral = tile.owner === 'neutral' || tile.owner === null;
  const isEnemy = !isNeutral && tile.owner !== state.currentTurn;
  const isStartTile = tile.type === 'start_p' || tile.type === 'start_e';

  const garrisonEntries = (Object.entries(tile.garrison) as [TroopType, number][]).filter(([, n]) => (n ?? 0) > 0);
  const ownerFc = !isNeutral && tile.owner && tile.owner !== 'neutral'
    ? FACTION_COLORS[tile.owner]
    : null;
  const lapProd = LAP_LAND_PRODUCTION + getLapTroops(tile);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className={`bg-gray-900 rounded-xl p-5 min-w-[300px] text-white border-t-2 ${ownerFc ? ownerFc.border : 'border-gray-700'}`}>
        <h2 className={`text-lg font-bold mb-3 ${ownerFc ? ownerFc.text : 'text-yellow-400'}`}>
          {isNeutral ? '🌾 중립 영토' : isStartTile ? '🏰 기본 영토' : '⚔️ 적 영토'}
        </h2>

        {/* Tile value info */}
        <div className="bg-gray-800 rounded-lg p-3 mb-3 flex gap-3 text-xs">
          <div className="flex-1 text-center">
            <div className="text-gray-400 mb-0.5">통행세</div>
            <div className="text-orange-300 font-bold">{toll}골드</div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-gray-400 mb-0.5">랩 생산</div>
            <div className="text-green-300 font-bold">{lapProd}명</div>
          </div>
          {!isNeutral && !isStartTile && tile.building && (
            <div className="flex-1 text-center">
              <div className="text-gray-400 mb-0.5">건물</div>
              <div className="text-purple-300 font-bold">
                {tile.building === 'vault' ? '🏦' : tile.building === 'barracks' ? '🏕️' : '🏰'} Lv{tile.buildingLevel}
              </div>
            </div>
          )}
        </div>

        {/* Garrison composition */}
        {garrisonEntries.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-3 mb-3">
            <div className="text-xs text-gray-400 mb-1.5">수비 병력 <span className="text-white font-bold">{tile.troops}명</span></div>
            <div className="flex flex-wrap gap-2">
              {garrisonEntries.map(([t, n]) => (
                <div key={t} className="flex items-center gap-1">
                  <span className="text-base">{TROOP_DATA[t].emoji}</span>
                  <span className="text-sm font-bold">{n}</span>
                  <span className="text-xs text-gray-400">{TROOP_DATA[t].name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-gray-300 mb-3 text-sm">
          {isNeutral && !isStartTile && <div>구매 비용: <span className="text-yellow-300 font-bold">{landCost}골드</span> (보유: {state.player.gold}골드)</div>}
          {isEnemy && <div>통행세 납부: <span className="text-orange-300 font-bold">{toll}골드</span></div>}
        </div>

        <div className="flex flex-col gap-2">
          <button onClick={() => dispatch({ type: 'CHOOSE_FIGHT', tileId })}
            disabled={piece.troops === 0}
            className="px-4 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-40 rounded-lg font-bold">
            ⚔️ 전투 (내 병력: {piece.troops}명)
          </button>
          {isNeutral && !isStartTile && (
            <button onClick={() => dispatch({ type: 'CHOOSE_BUY_LAND', tileId })}
              disabled={state.player.gold < landCost}
              className="px-4 py-2 bg-yellow-700 hover:bg-yellow-600 disabled:opacity-40 rounded-lg font-bold">
              💰 골드로 구매 ({landCost}골드)
            </button>
          )}
          {isEnemy && (
            <button onClick={() => dispatch({ type: 'CHOOSE_PAY_TOLL', tileId })}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold">
              🚶 통행세 납부 ({toll}골드)
            </button>
          )}
          {(isNeutral || isStartTile) && (
            <button onClick={() => dispatch({ type: 'CHOOSE_PASS' })}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold">
              🚶 그냥 지나가기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
