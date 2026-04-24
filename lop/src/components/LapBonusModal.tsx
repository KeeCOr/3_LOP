'use client';
import type { GameState } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }

export default function LapBonusModal({ state, dispatch }: Props) {
  const bonus = state.lapBonusAnim!;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl p-7 text-white text-center border border-yellow-500/40 shadow-xl min-w-[260px]">
        <div className="text-3xl mb-2">🏁</div>
        <h2 className="text-xl font-bold text-yellow-400 mb-4">출발점 통과!</h2>
        <div className="space-y-2 mb-5">
          <div className="flex items-center justify-between bg-yellow-900/30 rounded-lg px-4 py-2">
            <span className="text-gray-300">골드 수입</span>
            <span className="text-yellow-300 font-bold text-lg">+{bonus.gold} 💰</span>
          </div>
          <div className="flex items-center justify-between bg-blue-900/30 rounded-lg px-4 py-2">
            <span className="text-gray-300">말 병력</span>
            <span className="text-blue-300 font-bold text-lg">+{bonus.troops} ⚔️</span>
          </div>
          {bonus.tileProduction > 0 && (
            <div className="flex items-center justify-between bg-green-900/30 rounded-lg px-4 py-2">
              <span className="text-gray-300">영토 생산</span>
              <span className="text-green-300 font-bold text-lg">+{bonus.tileProduction} 🏰</span>
            </div>
          )}
        </div>
        <button
          onClick={() => dispatch({ type: 'CLEAR_LAP_BONUS' })}
          className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg">
          확인
        </button>
      </div>
    </div>
  );
}
