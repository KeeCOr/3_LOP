import type { GameState } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';
import { CHARACTERS, TROOP_DATA } from '@/lib/gameData';
import { TILE_DEFINITIONS } from '@/lib/boardLayout';
import { FACTION_COLORS } from '@/lib/factionColors';
import type { TroopType } from '@/lib/gameTypes';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }

export default function PieceSelector({ state, dispatch }: Props) {
  const pieces = state.pieces.filter(p => p.owner === 'player');
  const fc = FACTION_COLORS['player'];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40">
      <div className={`bg-gray-900 rounded-2xl p-5 w-[320px] text-white border-t-2 ${fc.border} shadow-2xl`}>
        <div className="text-center mb-4">
          <div className={`text-lg font-black ${fc.textBright}`}>🎲 {state.diceResult}칸 이동</div>
          <div className="text-xs text-gray-400 mt-0.5">어느 말을 이동할까요?</div>
        </div>
        <div className="flex flex-col gap-2">
          {pieces.map(p => {
            const tileDef = TILE_DEFINITIONS.find(d => d.index === p.position);
            const compEntries = (Object.entries(p.composition) as [TroopType, number][]).filter(([, n]) => (n ?? 0) > 0);
            return (
              <button key={p.id}
                onClick={() => dispatch({ type: 'SELECT_PIECE', pieceId: p.id })}
                className={`flex items-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 border ${fc.border} rounded-xl transition-colors text-left`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${fc.badge} shrink-0`}>
                  {CHARACTERS[p.characterType].name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">{CHARACTERS[p.characterType].name}</div>
                  <div className="text-[10px] text-gray-400">{tileDef?.label ?? `${p.position}번`}</div>
                  <div className="flex gap-1.5 mt-0.5 flex-wrap">
                    {compEntries.map(([t, n]) => (
                      <span key={t} className="text-[10px] text-gray-300">{TROOP_DATA[t].emoji}{n}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-lg font-black ${fc.textBright}`}>{p.troops}</div>
                  <div className="text-[10px] text-gray-500">명</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
