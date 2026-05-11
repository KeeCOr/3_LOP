import type { GameState, PlayerType, PlayerState } from '@/lib/gameTypes';
import { CHARACTERS } from '@/lib/gameData';
import { FACTION_COLORS } from '@/lib/factionColors';
import { CHAR_IMAGE } from '@/lib/charImages';

function getActiveEffects(ps: PlayerState): { label: string; color: string }[] {
  const fx: { label: string; color: string }[] = [];
  if (ps.attackBoostActive)       fx.push({ label: '⚔️ 공격↑',          color: 'bg-red-800 text-red-200' });
  if (ps.freeBuildNext)           fx.push({ label: '🎁 무료건설',         color: 'bg-yellow-800 text-yellow-200' });
  if (ps.taxExemptTurns > 0)      fx.push({ label: `🧾 세금면제×${ps.taxExemptTurns}`,  color: 'bg-green-800 text-green-200' });
  if (ps.tollExemptTurns > 0)     fx.push({ label: `🚫 통행료면제×${ps.tollExemptTurns}`, color: 'bg-blue-800 text-blue-200' });
  if (ps.tollDoubleLaps > 0)      fx.push({ label: `💰 통행료2배×${ps.tollDoubleLaps}`,  color: 'bg-orange-800 text-orange-200' });
  if (ps.buildDiscountLaps > 0)   fx.push({ label: `🔨 건설할인×${ps.buildDiscountLaps}`, color: 'bg-purple-800 text-purple-200' });
  if (ps.diceBonusTurns > 0)      fx.push({ label: `🎲 주사위+${ps.diceBonusAmount}×${ps.diceBonusTurns}`, color: 'bg-cyan-800 text-cyan-200' });
  if (ps.defenseBoostMultiplier > 1) fx.push({ label: '🛡️ 방어↑',        color: 'bg-indigo-800 text-indigo-200' });
  return fx;
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
    <div className="flex border-b-2 border-gray-800 bg-gray-950">
      {activePlayers.map(id => {
        const ps = getPS(id);
        const pieces = state.pieces.filter(p => p.owner === id && p.troops > 0);
        const lands = state.tiles.filter(t => t.owner === id).length;
        const fc = FACTION_COLORS[id];
        const isCurrent = state.currentTurn === id;

        return (
          <div key={id}
            className={`flex-1 px-2 py-1 border-r border-gray-800 last:border-r-0 transition-all duration-300
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
                <span key={p.id} className={`flex items-center gap-0.5 ${isCurrent ? fc.textBright : 'text-gray-600'}`}>
                  <img src={CHAR_IMAGE[p.characterType]} alt={p.characterType}
                    className="w-5 h-6 object-contain flex-none" />
                  ⚔️{p.troops}
                </span>
              ))}
            </div>
            {/* Active effect badges */}
            {getActiveEffects(ps).length > 0 && (
              <div className="flex flex-wrap gap-[3px] mt-0.5">
                {getActiveEffects(ps).map(fx => (
                  <span key={fx.label} className={`text-[9px] font-bold px-1 py-[1px] rounded ${fx.color}`}>
                    {fx.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
