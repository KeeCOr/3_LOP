'use client';
import type { GameState } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';
import { TILE_DEFINITIONS } from '@/lib/boardLayout';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }

export default function StopAtTileModal({ state, dispatch }: Props) {
  const tiles = state.pendingStopTiles!;
  const destination = state.pieces.find(p => p.id === state.selectedPieceId)?.position;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-5 w-[300px] text-white border-t-2 border-blue-500">
        <h3 className="text-base font-bold text-blue-400 mb-1">🏰 내 영토를 지나쳤습니다</h3>
        <p className="text-xs text-gray-400 mb-3">이동 경로에 내 영토가 있습니다. 멈출까요?</p>

        <div className="flex flex-col gap-2 mb-3">
          {tiles.map(({ tileId }) => {
            const def = TILE_DEFINITIONS.find(d => d.index === tileId);
            const tileState = state.tiles.find(t => t.id === tileId);
            return (
              <button
                key={tileId}
                onClick={() => dispatch({ type: 'STOP_AT_TILE', tileId })}
                className="flex items-center justify-between px-3 py-2 bg-blue-900/60 hover:bg-blue-800/80 border border-blue-700 rounded-lg text-left">
                <div>
                  <div className="font-bold text-sm">{def?.label ?? `${tileId}번 땅`}</div>
                  {(tileState?.troops ?? 0) > 0 && (
                    <div className="text-xs text-green-300">주둔 {tileState!.troops}명</div>
                  )}
                </div>
                <span className="text-blue-300 font-bold text-sm">멈추기 →</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => dispatch({ type: 'CONTINUE_MOVE' })}
          className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">
          🚶 {destination !== undefined ? `${destination}번 칸으로 계속` : '계속 진행'}
        </button>
      </div>
    </div>
  );
}
