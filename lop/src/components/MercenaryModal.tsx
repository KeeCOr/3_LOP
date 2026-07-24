'use client';
import type { GameState } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';
import { TROOP_DATA } from '@/lib/gameData';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }

const MERC_COST = 400;

export default function MercenaryModal({ state, dispatch }: Props) {
  const isPlayerTurn = state.currentTurn === 'player';
  const gold = state.player.gold;
  const result = state.mercenaryResult;
  const canBuy = isPlayerTurn && gold >= MERC_COST && result === null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3">
      <div className="bg-gray-900 rounded-xl p-5 w-full max-w-[300px] max-h-[calc(100vh-1.5rem)] overflow-y-auto text-white border-t-2 border-orange-500">
        <div className="text-center mb-4">
          <div className="text-3xl mb-1">⚔️</div>
          <h2 className="text-lg font-bold text-orange-400">용병소</h2>
          {!result && (
            <p className="text-xs text-gray-400 mt-1">
              {MERC_COST}골드 · 랜덤 병력 2~8명 · 계약 즉시 말에 합류
            </p>
          )}
        </div>

        {/* After buying — show result */}
        {result && (
          <>
            <div className="bg-orange-900/40 border border-orange-700 rounded-lg p-3 mb-4 text-center">
              <div className="text-xs text-orange-300 mb-1">계약 완료! 말에 합류했습니다.</div>
              <div className="text-xl font-bold">
                {TROOP_DATA[result.troopType].emoji} {TROOP_DATA[result.troopType].name} {result.amount}명
              </div>
            </div>
            <button
              onClick={() => dispatch({ type: 'CLOSE_MERCENARY' })}
              className="w-full min-w-0 py-2.5 bg-orange-700 hover:bg-orange-600 rounded-lg font-bold text-sm whitespace-normal break-words">
              확인
            </button>
          </>
        )}

        {/* Before buying */}
        {!result && (
          <>
            <div className="text-xs text-gray-400 text-center mb-3">
              보유 골드: <span className="text-yellow-300 font-bold">{gold}</span>
            </div>
            <div className="flex flex-col gap-2">
              {isPlayerTurn && (
                <button
                  onClick={() => dispatch({ type: 'BUY_MERCENARY' })}
                  disabled={!canBuy}
                  className="w-full min-w-0 py-2.5 bg-orange-700 hover:bg-orange-600 disabled:opacity-40 rounded-lg font-bold text-sm whitespace-normal break-words">
                  🎲 용병 계약 ({MERC_COST}골드)
                </button>
              )}
              <button
                onClick={() => dispatch({ type: 'CLOSE_MERCENARY' })}
                className="w-full min-w-0 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm whitespace-normal break-words">
                떠나기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
