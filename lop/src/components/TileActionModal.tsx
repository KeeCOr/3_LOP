import type { GameState, TroopType } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';
import { getToll } from '@/lib/economyUtils';
import { TROOP_DATA } from '@/lib/gameData';
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
  const ownerFc = !isNeutral && !isStartTile && tile.owner && tile.owner !== 'neutral'
    ? FACTION_COLORS[tile.owner]
    : null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className={`bg-gray-900 rounded-xl p-6 min-w-[300px] text-white border-t-2 ${ownerFc ? ownerFc.border : 'border-gray-700'}`}>
        <h2 className={`text-xl font-bold mb-3 ${ownerFc ? ownerFc.text : 'text-yellow-400'}`}>
          {isNeutral ? '🌾 중립 영토' : isStartTile ? '🏰 기본 영토' : '⚔️ 적 영토'} ({tileId}번 칸)
        </h2>

        {/* Garrison composition */}
        {garrisonEntries.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-3 mb-3">
            <div className="text-xs text-gray-400 mb-1.5">수비 병력 구성</div>
            <div className="flex gap-3">
              {garrisonEntries.map(([t, n]) => (
                <div key={t} className="flex items-center gap-1">
                  <span className="text-base">{TROOP_DATA[t].emoji}</span>
                  <span className="text-sm font-bold text-white">{n}</span>
                  <span className="text-xs text-gray-400">{TROOP_DATA[t].name}</span>
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-1">합계: {tile.troops}명</div>
          </div>
        )}

        <div className="text-gray-300 mb-4 text-sm">
          {isNeutral && !isStartTile && <div>구매 비용: {landCost}골드 (보유: {state.player.gold}골드)</div>}
          {isEnemy && <div>통행세: {toll}골드</div>}
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
