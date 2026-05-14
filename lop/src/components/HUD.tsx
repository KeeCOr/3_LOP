import type { GameState, PlayerState, PlayerType } from '@/lib/gameTypes';
import { FACTION_COLORS } from '@/lib/factionColors';
import { CHAR_IMAGE } from '@/lib/charImages';

function activeEffectCount(ps: PlayerState): number {
  return [
    ps.attackBoostActive,
    ps.freeBuildNext,
    ps.taxExemptTurns > 0,
    ps.tollExemptTurns > 0,
    ps.tollDoubleLaps > 0,
    ps.buildDiscountLaps > 0,
    ps.diceBonusTurns > 0,
    ps.defenseBoostMultiplier > 1,
  ].filter(Boolean).length;
}

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
    <header className="border-b border-gray-800 bg-gray-950/95 px-2 py-1.5">
      <div className="mx-auto grid max-w-[1500px] gap-1.5"
        style={{ gridTemplateColumns: `repeat(${activePlayers.length}, minmax(0, 1fr))` }}>
        {activePlayers.map(id => {
          const ps = getPS(id);
          const pieces = state.pieces.filter(p => p.owner === id && p.troops > 0);
          const lands = state.tiles.filter(t => t.owner === id).length;
          const troops = pieces.reduce((sum, p) => sum + p.troops, 0);
          const fc = FACTION_COLORS[id];
          const isCurrent = state.currentTurn === id;
          const leadPiece = pieces[0];

          return (
            <section key={id}
              className={`min-w-0 rounded border px-2 py-1 transition-all
                ${isCurrent ? `${fc.border} ${fc.bg} shadow-sm` : 'border-gray-800 bg-gray-900/45 opacity-70'}`}>
              <div className="flex items-center gap-2">
                {leadPiece && (
                  <img src={CHAR_IMAGE[leadPiece.characterType]} alt={leadPiece.characterType}
                    className="h-9 w-8 flex-none object-contain" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className={`truncate text-xs font-black ${isCurrent ? fc.textBright : fc.text}`}>{ps.name}</span>
                    {isCurrent && <span className="rounded bg-yellow-400 px-1 text-[9px] font-black text-black">TURN</span>}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
                    <span className="font-bold text-yellow-300">{ps.gold}G</span>
                    <span className="text-gray-300">땅 {lands}</span>
                    <span className="text-gray-300">병력 {troops}</span>
                    {activeEffectCount(ps) > 0 && (
                      <span className="rounded bg-cyan-950 px-1 font-bold text-cyan-200">효과 {activeEffectCount(ps)}</span>
                    )}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </header>
  );
}
