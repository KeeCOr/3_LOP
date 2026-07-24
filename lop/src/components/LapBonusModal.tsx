'use client';
import type { GameState, TroopType } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';
import { TROOP_DATA } from '@/lib/gameData';
import { TILE_DEFINITIONS } from '@/lib/boardLayout';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }

export default function LapBonusModal({ state, dispatch }: Props) {
  const bonus = state.lapBonusAnim!;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3">
      <div className="bg-gray-900 rounded-2xl text-white border border-yellow-500/40 shadow-xl w-full max-w-[320px] max-h-[calc(100vh-1.5rem)] overflow-y-auto">

        {/* Lap bonus summary */}
        <div className="p-5 text-center border-b border-gray-700">
          <div className="text-3xl mb-1">🏁</div>
          <h2 className="text-lg font-bold text-yellow-400 mb-3">출발점 통과!</h2>
          <div className="mb-2">
            <div className="bg-yellow-900/30 rounded-lg px-3 py-2 text-center">
              <div className="text-xs text-gray-400">골드</div>
              <div className="text-yellow-300 font-bold text-lg">+{bonus.gold} 💰</div>
            </div>
          </div>
          {bonus.tileProduction > 0 && (
            <div className="bg-green-900/20 rounded-lg px-3 py-2 border border-green-800/40">
              <div className="text-xs text-gray-400 mb-1.5">🏰 영토 병력 생산 <span className="text-green-300 font-bold">+{bonus.tileProduction}명</span></div>
              {bonus.tileDetails && bonus.tileDetails.length > 0 && (
                <div className="flex flex-col gap-0.5 mb-1.5">
                  {bonus.tileDetails.map(({ tileId, amount, troopType }) => {
                    const def = TILE_DEFINITIONS.find(d => d.index === tileId);
                    const td = TROOP_DATA[troopType];
                    return (
                      <div key={tileId} className="flex justify-between text-[11px]">
                        <span className="text-gray-400">{def?.label ?? `${tileId}번`}</span>
                        <span className="text-green-300 font-bold">{td.emoji}{td.name} +{amount}명</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 border-t border-green-900/40 pt-1">
                {(Object.entries(bonus.tileBreakdown) as [TroopType, number][]).filter(([, n]) => n > 0).map(([t, n]) => (
                  <span key={t} className="text-[11px] text-green-400">
                    {TROOP_DATA[t].emoji} {TROOP_DATA[t].name} +{n}명
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4">
          <button
            onClick={() => dispatch({ type: 'CLEAR_LAP_BONUS' })}
            className="w-full min-w-0 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg whitespace-normal break-words">
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
