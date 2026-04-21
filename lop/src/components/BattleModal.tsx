'use client';
import { useState, useEffect } from 'react';
import type { GameState, BattleState } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';
import { runBattleRound } from '@/lib/battleEngine';
import { CHARACTERS } from '@/lib/gameData';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }

export default function BattleModal({ state, dispatch }: Props) {
  const [battle, setBattle] = useState<BattleState>(state.activeBattle!);
  const [animating, setAnimating] = useState(false);
  const isPlayerTurn = state.currentTurn === 'player';
  const piece = state.pieces.find(p => p.id === battle.attackerPieceId)!;

  const initialAtkTroops = state.activeBattle!.attackerTroops;
  const initialDefTroops = state.activeBattle!.defenderTroops;

  function runNextRound() {
    if (battle.result !== 'ongoing') { dispatch({ type: 'BATTLE_FINISH' }); return; }
    setAnimating(true);
    setTimeout(() => {
      setBattle(prev => runBattleRound(prev));
      setAnimating(false);
    }, 400);
  }

  useEffect(() => {
    if (!isPlayerTurn && battle.result === 'ongoing') {
      const t = setTimeout(runNextRound, 600);
      return () => clearTimeout(t);
    }
    if (!isPlayerTurn && battle.result !== 'ongoing') {
      const t = setTimeout(() => dispatch({ type: 'BATTLE_FINISH' }), 1000);
      return () => clearTimeout(t);
    }
  }, [isPlayerTurn, battle, dispatch]);

  const atkPct = Math.round((battle.attackerTroops / initialAtkTroops) * 100);
  const defPct = Math.round((battle.defenderTroops / initialDefTroops) * 100);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className={`bg-gray-900 rounded-xl p-6 w-full max-w-lg text-white transition-all ${animating ? 'scale-95' : 'scale-100'}`}>
        <h2 className="text-2xl font-bold text-center text-yellow-400 mb-6">⚔️ 전투!</h2>

        <div className="grid grid-cols-3 gap-4 items-center mb-6">
          <div className="text-center">
            <div className="text-blue-400 font-bold">{CHARACTERS[piece.characterType].name}</div>
            <div className="text-3xl font-bold text-blue-300">{battle.attackerTroops}</div>
            <div className="text-xs text-gray-400">공격측 병력</div>
            <div className="mt-2 h-3 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${atkPct}%` }} />
            </div>
          </div>

          <div className="text-center text-3xl">VS</div>

          <div className="text-center">
            <div className="text-red-400 font-bold">수비대</div>
            <div className="text-3xl font-bold text-red-300">{battle.defenderTroops}</div>
            <div className="text-xs text-gray-400">수비측 병력</div>
            <div className="mt-2 h-3 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${defPct}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-3 max-h-32 overflow-y-auto mb-4 text-sm text-gray-300">
          {battle.rounds.length === 0 && <div className="text-gray-500">전투 시작...</div>}
          {[...battle.rounds].reverse().map((r, i) => <div key={i}>{r.log}</div>)}
        </div>

        {battle.result !== 'ongoing' && (
          <div className={`text-center text-xl font-bold mb-4 ${battle.result === 'attacker_wins' ? 'text-green-400' : 'text-red-400'}`}>
            {battle.result === 'attacker_wins' ? '🏆 승리!' : '💀 패배...'}
          </div>
        )}

        {isPlayerTurn && (
          <button onClick={runNextRound}
            className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-bold transition-colors">
            {battle.result === 'ongoing' ? '▶ 다음 라운드' : '확인'}
          </button>
        )}
      </div>
    </div>
  );
}
