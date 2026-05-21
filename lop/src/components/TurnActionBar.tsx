import type { GameState, PlayerType } from '@/lib/gameTypes';
import { FACTION_COLORS } from '@/lib/factionColors';
import { getTurnActionInfo } from '@/lib/turnActionInfo.mjs';

const PLAYER_LABEL: Record<PlayerType, string> = {
  player: '플레이어',
  ai: 'AI 1',
  ai2: 'AI 2',
  ai3: 'AI 3',
};

const phaseFlowStep = 'min-w-0 rounded-md border px-3 py-2 shadow-[inset_0_0_0_1px_rgba(255,244,190,0.12)]';

function playerName(state: GameState): string {
  if (state.currentTurn === 'player') return state.player.name || PLAYER_LABEL.player;
  if (state.currentTurn === 'ai') return state.ai.name || PLAYER_LABEL.ai;
  if (state.currentTurn === 'ai2') return state.ai2?.name || PLAYER_LABEL.ai2;
  return state.ai3?.name || PLAYER_LABEL.ai3;
}

function toneClass(tone: 'ready' | 'waiting' | 'danger'): string {
  if (tone === 'danger') return 'border-red-600 bg-red-950/70 text-red-100';
  if (tone === 'waiting') return 'border-sky-700 bg-sky-950/55 text-sky-100';
  return 'border-yellow-600 bg-yellow-950/55 text-yellow-100';
}

export default function TurnActionBar({ state, isAnimating }: { state: GameState; isAnimating: boolean }) {
  const info = getTurnActionInfo(state, isAnimating);
  const fc = FACTION_COLORS[state.currentTurn];
  const phaseIndex = state.turnPhase === 'roll' ? 0
    : state.turnPhase === 'select_piece' || state.turnPhase === 'choose_move_tile' ? 1
    : 2;
  const phases = [
    { no: '1', title: '주사위', caption: state.diceResult !== null ? `${state.diceResult}칸` : '이동 거리' },
    { no: '2', title: '이동', caption: state.selectedPieceId ? '말 선택됨' : '말 선택' },
    { no: '3', title: '행동', caption: info.title },
  ];

  return (
    <aside className={`flex-none border-t border-amber-800/65 px-3 py-2 bg-[#06111a] ${toneClass(info.tone)}`}>
      <div className="mx-auto grid max-w-[1500px] gap-2 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid grid-cols-3 gap-2">
          {phases.map((phase, index) => (
            <div key={phase.no}
              className={`${phaseFlowStep} ${index === phaseIndex
                ? 'border-amber-300 bg-amber-900/45 text-amber-50 shadow-[0_0_22px_rgba(251,191,36,0.20)]'
                : index < phaseIndex
                  ? 'border-sky-700/70 bg-sky-950/45 text-sky-100'
                  : 'border-slate-700 bg-slate-900/70 text-slate-400'}`}>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full border border-current text-sm font-black">{phase.no}</span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-black">{phase.title}</div>
                  <div className="truncate text-[11px] opacity-80">{phase.caption}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="min-w-0 rounded-md border border-amber-900/50 bg-black/25 px-3 py-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className={`text-[11px] font-bold ${fc.text}`}>{playerName(state)} 턴</span>
            <h2 className="text-sm font-black leading-tight text-white">{info.title}</h2>
            {state.diceResult !== null && (
              <span className="rounded bg-black/30 px-1.5 py-0.5 text-[11px] font-bold text-yellow-200">
                주사위 {state.diceResult}
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-gray-200">{info.description}</p>
        </div>
      </div>
    </aside>
  );
}
