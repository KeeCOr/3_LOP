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
    <div className={`bg-gray-900 rounded-xl p-3 h-full w-full text-white flex flex-col transition-all ${animating ? 'scale-95 opacity-80' : 'scale-100 opacity-100'}`}>
      <h2 className="text-lg font-bold text-center text-yellow-400 mb-2">⚔️ 전투!</h2>

      <div className="grid grid-cols-3 gap-2 items-center mb-2">
        <div className="text-center">
          <div className="text-blue-400 font-bold text-xs">{CHARACTERS[piece.characterType].name}</div>
          <div className="text-2xl font-bold text-blue-300">{battle.attackerTroops}</div>
          <div className="text-xs text-gray-400">공격</div>
          <div className="mt-1 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${atkPct}%` }} />
          </div>
        </div>

        <div className="text-center text-xl font-bold text-gray-400">VS</div>

        <div className="text-center">
          <div className="text-red-400 font-bold text-xs">수비대</div>
          <div className="text-2xl font-bold text-red-300">{battle.defenderTroops}</div>
          <div className="text-xs text-gray-400">수비</div>
          <div className="mt-1 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${defPct}%` }} />
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-2 flex-1 overflow-y-auto mb-2 text-xs text-gray-300">
        {battle.rounds.length === 0 && <div className="text-gray-500">전투 시작...</div>}
        {[...battle.rounds].reverse().map((r, i) => <div key={i}>{r.log}</div>)}
      </div>

      {battle.result !== 'ongoing' && (
        <div className={`text-center text-base font-bold mb-2 ${battle.result === 'attacker_wins' ? 'text-green-400' : 'text-red-400'}`}>
          {battle.result === 'attacker_wins' ? '🏆 승리!' : '💀 패배...'}
        </div>
      )}

      {isPlayerTurn && (
        <button onClick={runNextRound}
          className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-bold text-sm transition-colors">
          {battle.result === 'ongoing' ? '▶ 다음 라운드' : '확인'}
        </button>
      )}
    </div>
  );
}
