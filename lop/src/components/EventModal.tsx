import { useEffect } from 'react';
import type { CSSProperties } from 'react';
import type { EventCard, GameState } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';
import { getEventResultInfo } from '@/lib/eventResultInfo.mjs';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }

const eventCardBackdrop: CSSProperties = {
  background:
    'linear-gradient(135deg, rgba(245, 158, 11, 0.24), rgba(15, 23, 42, 0.92) 42%, rgba(22, 78, 99, 0.34)), radial-gradient(circle at 28% 18%, rgba(253, 224, 71, 0.28), transparent 26%), radial-gradient(circle at 76% 78%, rgba(14, 165, 233, 0.2), transparent 30%)',
};

const cardSceneFrame: CSSProperties = {
  background:
    'linear-gradient(180deg, rgba(254, 243, 199, 0.18), rgba(120, 53, 15, 0.08)), repeating-linear-gradient(45deg, rgba(251, 191, 36, 0.18) 0 2px, transparent 2px 9px)',
};

export default function EventModal({ state, dispatch }: Props) {
  const card = state.activeEvent!;
  const needsAction = card.effect.kind === 'move_to_tile' || card.effect.kind === 'move_to_shop';
  const resultInfo = getEventResultInfo(card.effect);

  useEffect(() => {
    if (needsAction) return;
    const timer = setTimeout(() => dispatch({ type: 'APPLY_EVENT_CARD' }), 2000);
    return () => clearTimeout(timer);
  }, [needsAction, dispatch]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div
        className="relative w-full max-w-[380px] overflow-hidden rounded-2xl border border-amber-300/55 p-5 text-white text-center shadow-2xl shadow-black/40"
        style={eventCardBackdrop}
        data-event-card-visual="chance-card"
      >
        <div className="pointer-events-none absolute inset-3 rounded-xl border border-amber-100/20" />
        <div className="relative mb-4 rounded-xl border border-amber-200/35 px-4 py-5 shadow-inner shadow-black/30" style={cardSceneFrame}>
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-amber-200/45 bg-black/30 text-4xl shadow-lg shadow-amber-900/30">
            ?
          </div>
          <h2 className="text-xl font-bold text-amber-200 drop-shadow">운명 카드</h2>
        </div>
        <p className="relative mb-3 text-lg leading-snug text-amber-50">{card.text}</p>
        <div
          className="relative mb-6 rounded-lg border border-amber-100/20 bg-black/25 px-3 py-2 text-left text-sm leading-5 text-amber-100"
          data-event-result-explanation="true"
        >
          <div className="mb-1 flex items-center justify-between gap-3"><span className="font-bold text-amber-200">변화 영역</span><span>{resultInfo.area}</span></div>
          <div className="mb-1"><b className="text-amber-200">즉시 변화</b><span className="ml-2">{resultInfo.change}</span></div>
          <div><b className="text-amber-200">다음 판단</b><span className="ml-2">{resultInfo.next}</span></div>
        </div>
        {state.currentTurn === 'player' && (
          <button
            onClick={() => dispatch({ type: 'APPLY_EVENT_CARD' })}
            className="relative min-h-11 rounded-lg bg-amber-500 px-8 py-3 font-bold text-black shadow-lg shadow-amber-950/30 hover:bg-amber-400"
          >
            결과 확인
          </button>
        )}
      </div>
    </div>
  );
}
