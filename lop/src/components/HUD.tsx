import type { GameState, PlayerType } from '@/lib/gameTypes';
import { CHARACTERS } from '@/lib/gameData';
import { FACTION_COLORS } from '@/lib/factionColors';

export default function HUD({ state }: { state: GameState }) {
  const activePlayers: PlayerType[] = ['player', 'ai'];
  if (state.playerCount >= 3) activePlayers.push('ai2');
  if (state.playerCount >= 4) activePlayers.push('ai3');

  function getPS(id: PlayerType) {
    if (id === 'player') return state.player;
    if (id === 'ai') return state.ai;
    if (id === 'ai2') return state.ai2!;
    return state.ai3!;
  }

  return (
    <div className="flex border-b-2 border-gray-800 bg-gray-950">
      {activePlayers.map(id => {
        const ps = getPS(id);
        const pieces = state.pieces.filter(p => p.owner === id && p.troops > 0);
        const lands = state.tiles.filter(t => t.owner === id).length;
        const fc = FACTION_COLORS[id];
        const isCurrent = state.currentTurn === id;

        return (
          <div key={id}
            className={`flex-1 px-2 py-1.5 border-r border-gray-800 last:border-r-0 transition-all duration-300
              ${isCurrent
                ? `${fc.bg} border-t-4 ${fc.border} brightness-125`
                : 'border-t-4 border-transparent opacity-50'}`}>
            {/* Name row */}
            <div className="flex items-center gap-1 mb-0.5">
              {isCurrent
                ? <span className={`text-xs font-black ${fc.textBright} animate-pulse`}>▶</span>
                : <span className="text-xs text-transparent">▶</span>}
              <span className={`text-xs font-bold ${isCurrent ? fc.textBright : fc.text}`}>
                {ps.name}
              </span>
              {isCurrent && (
                <span className={`ml-auto text-[9px] px-1 rounded font-bold ${fc.badge} text-white`}>
                  턴
                </span>
              )}
            </div>
            {/* Stats row */}
            <div className="flex items-center gap-2 text-xs">
              <span className={`font-bold ${isCurrent ? 'text-yellow-300' : 'text-yellow-600'}`}>
                💰{ps.gold}
              </span>
              <span className={isCurrent ? 'text-gray-300' : 'text-gray-600'}>🏠{lands}</span>
              {pieces.map(p => (
                <span key={p.id} className={isCurrent ? fc.textBright : 'text-gray-600'}>
                  {CHARACTERS[p.characterType].name[0]}⚔️{p.troops}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
