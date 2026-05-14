import type { GameState, PlayerType } from '@/lib/gameTypes';
import { FACTION_COLORS } from '@/lib/factionColors';
import { getTurnActionInfo } from '@/lib/turnActionInfo.mjs';

const PLAYER_LABEL: Record<PlayerType, string> = {
  player: '플레이어',
  ai: 'AI 1',
  ai2: 'AI 2',
  ai3: 'AI 3',
};

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

  return (
    <aside className={`flex-none border-t px-3 py-2 ${toneClass(info.tone)}`}>
      <div className="mx-auto flex max-w-[1500px] items-center gap-3">
        <div className={`flex h-11 w-11 flex-none items-center justify-center rounded border ${fc.border} ${fc.bg}`}>
          <span className={`text-xs font-black ${fc.textBright}`}>{info.step}</span>
        </div>

        <div className="min-w-0 flex-1">
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

        <div className="hidden flex-none text-right text-[11px] text-gray-400 sm:block">
          <div>Lap {state.lapCount}</div>
          <div>{state.log.length > 0 ? state.log[state.log.length - 1] : '게임을 시작했습니다.'}</div>
        </div>
      </div>
    </aside>
  );
}
