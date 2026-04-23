import type { GameState } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';
import { getToll } from '@/lib/economyUtils';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }
export default function TileActionModal({ state, dispatch }: Props) {
  const tileId = state.activeTileAction!;
  const tile = state.tiles.find(t => t.id === tileId)!;
  const piece = state.pieces.find(p => p.id === state.selectedPieceId)!;
  const toll = getToll(tile);
  const landCost = tile.landPrice || tile.troops * 80;
  const isNeutral = tile.owner === 'neutral' || tile.owner === null;
  const isEnemy = tile.owner === 'ai';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 min-w-[300px] text-white">
        <h2 className="text-xl font-bold text-yellow-400 mb-4">
          {isNeutral ? '🌾 중립 영토' : '⚔️ 적 영토'} ({tileId}번 칸)
        </h2>
        <div className="text-gray-300 mb-4">
          <div>수비 병력: {tile.troops}명</div>
          {isNeutral && <div>구매 비용: {landCost}골드 (보유: {state.player.gold}골드)</div>}
          {isEnemy && <div>통행세: {toll}골드</div>}
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={() => dispatch({ type: 'CHOOSE_FIGHT', tileId })}
            disabled={piece.troops === 0}
            className="px-4 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-40 rounded-lg font-bold">
            ⚔️ 전투 (내 병력: {piece.troops}명)
          </button>
          {isNeutral && (
            <button onClick={() => dispatch({ type: 'CHOOSE_BUY_LAND', tileId })}
              disabled={state.player.gold < landCost}
              className="px-4 py-2 bg-yellow-700 hover:bg-yellow-600 disabled:opacity-40 rounded-lg font-bold">
              💰 골드로 구매 ({landCost}골드)
            </button>
          )}
          {isNeutral && (
            <button onClick={() => dispatch({ type: 'CHOOSE_PASS' })}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold">
              🚶 그냥 지나가기
            </button>
          )}
          {isEnemy && (
            <button onClick={() => dispatch({ type: 'CHOOSE_PAY_TOLL', tileId })}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold">
              🚶 통행세 납부 ({toll}골드)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
