import type { GameState, PlayerState, PlayerType } from '@/lib/gameTypes';
import { FACTION_COLORS } from '@/lib/factionColors';
import { CHAR_IMAGE } from '@/lib/charImages';

const hudStatCard = 'min-w-0 rounded-md border border-amber-600/65 bg-[#071824]/90 px-3 py-2 shadow-[inset_0_0_0_1px_rgba(255,230,156,0.12),0_8px_22px_rgba(0,0,0,0.35)]';
const hudStatCardActive = 'border-amber-400 bg-[#0b2434] shadow-[inset_0_0_0_1px_rgba(255,238,174,0.28),0_0_22px_rgba(245,158,11,0.18)]';
const hudCrownBar = 'rounded-md border border-amber-600/70 bg-gradient-to-b from-[#123047] to-[#06121c] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]';

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
    <header className="border-b border-amber-800/60 bg-[#02070c] px-2 py-2 shadow-[0_8px_28px_rgba(0,0,0,0.42)]">
      <div className="mx-auto grid max-w-[1500px] grid-cols-[150px_minmax(0,1fr)] gap-2 lg:grid-cols-[190px_minmax(0,1fr)]">
        <div className={`${hudCrownBar} flex items-center justify-center px-3`}>
          <div className="text-center">
            <div className="text-3xl font-black tracking-wide text-amber-200 [text-shadow:0_2px_0_#2a1605,0_0_16px_rgba(251,191,36,0.45)] lg:text-4xl">LOP</div>
            <div className="hidden text-[10px] font-bold uppercase tracking-[0.18em] text-amber-500/80 lg:block">Land of Power</div>
          </div>
        </div>

        <div className="grid gap-1.5"
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
              className={`${hudStatCard} transition-all
                ${isCurrent ? `${hudStatCardActive} ${fc.border}` : 'opacity-75'}`}>
              <div className="flex items-center gap-2">
                {leadPiece && (
                  <img src={CHAR_IMAGE[leadPiece.characterType]} alt={leadPiece.characterType}
                    className="h-11 w-9 flex-none object-contain drop-shadow-[0_4px_7px_rgba(0,0,0,0.55)]" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className={`truncate text-sm font-black ${isCurrent ? fc.textBright : fc.text}`}>{ps.name}</span>
                    {isCurrent && <span className="rounded-sm bg-amber-300 px-1.5 text-[9px] font-black text-slate-950">TURN</span>}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
                    <span className="font-black text-amber-200">● {ps.gold}G</span>
                    <span className="text-sky-100/90">영토 {lands}</span>
                    <span className="text-stone-100/90">병력 {troops}</span>
                    {activeEffectCount(ps) > 0 && (
                      <span className="rounded-sm bg-cyan-950 px-1 font-bold text-cyan-200">효과 {activeEffectCount(ps)}</span>
                    )}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
        </div>
      </div>
    </header>
  );
}
