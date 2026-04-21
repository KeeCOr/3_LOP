import type { GameState } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }
export default function EventModal({ state, dispatch }: Props) {
  const card = state.activeEvent!;
  const icon = card.type === 'chance' ? '🎲' : '📜';
  const color = card.type === 'chance' ? 'text-yellow-400' : 'text-green-400';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 min-w-[300px] text-white text-center">
        <div className="text-5xl mb-3">{icon}</div>
        <h2 className={`text-xl font-bold ${color} mb-4`}>
          {card.type === 'chance' ? '찬스 카드' : '커뮤니티 카드'}
        </h2>
        <p className="text-gray-200 text-lg mb-6">{card.text}</p>
        {state.currentTurn === 'player' && (
          <button onClick={() => dispatch({ type: 'APPLY_EVENT_CARD' })}
            className="px-8 py-3 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-bold">
            확인
          </button>
        )}
      </div>
    </div>
  );
}
