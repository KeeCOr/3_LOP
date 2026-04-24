'use client';
import type { GameState, TroopType, EventCard } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';
import { TROOP_DATA } from '@/lib/gameData';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }

function cardLabel(card: EventCard): string {
  const e = card.effect;
  if (e.kind === 'defense_reinforce') return `🛡️ 병력 ${e.amount}명 증원`;
  if (e.kind === 'defense_boost') return `🔰 수비력 ${e.multiplier}배`;
  return card.text;
}

export default function DefendChanceModal({ state, dispatch }: Props) {
  const tileId = state.pendingBattleTileId!;
  const tile = state.tiles.find(t => t.id === tileId)!;
  const garrisonEntries = (Object.entries(tile.garrison) as [TroopType, number][]).filter(([, n]) => (n ?? 0) > 0);

  const defenseCards = state.player.cardSlot.filter(c =>
    c.effect.kind === 'defense_reinforce' || c.effect.kind === 'defense_boost'
  );

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 min-w-[320px] text-white border border-red-800/60">
        <h2 className="text-xl font-bold text-red-400 mb-1">⚔️ 적이 공격합니다!</h2>
        <p className="text-sm text-gray-400 mb-3">{tileId}번 영토가 공격받고 있습니다</p>

        {/* Garrison info */}
        <div className="bg-gray-800 rounded-lg p-3 mb-4">
          <div className="text-xs text-gray-400 mb-1.5">현재 수비 병력</div>
          {garrisonEntries.length > 0 ? (
            <div className="flex gap-3">
              {garrisonEntries.map(([t, n]) => (
                <div key={t} className="flex items-center gap-1">
                  <span>{TROOP_DATA[t].emoji}</span>
                  <span className="font-bold">{n}</span>
                  <span className="text-xs text-gray-400">{TROOP_DATA[t].name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm">수비 병력 없음</div>
          )}
          <div className="text-xs text-gray-500 mt-1">합계: {tile.troops}명</div>
        </div>

        {/* Defense cards */}
        {defenseCards.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-gray-400 mb-2">사용 가능한 방어 카드</div>
            <div className="flex flex-col gap-2">
              {defenseCards.map(card => (
                <button key={card.id}
                  onClick={() => dispatch({ type: 'USE_EVENT_CARD', cardId: card.id })}
                  className="px-4 py-2 bg-blue-800 hover:bg-blue-700 rounded-lg font-bold text-sm text-left border border-blue-600">
                  {cardLabel(card)}
                  <div className="text-xs text-blue-300 font-normal mt-0.5">{card.text}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <button onClick={() => dispatch({ type: 'SKIP_DEFEND' })}
          className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold">
          전투 진행
        </button>
      </div>
    </div>
  );
}
