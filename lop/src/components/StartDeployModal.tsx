'use client';
import { useState } from 'react';
import type { GameState } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';
import { CHARACTERS, TROOP_DATA } from '@/lib/gameData';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }

export default function StartDeployModal({ state, dispatch }: Props) {
  const piece = state.pieces.find(p => p.owner === 'player')!;
  const charData = CHARACTERS[piece.characterType];
  const maxDeploy = piece.troops - 1;
  const [deployAmount, setDeployAmount] = useState(Math.floor(piece.troops * 0.3));

  const takeAmount = piece.troops - deployAmount;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 w-[320px] text-white">
        <h2 className="text-lg font-bold text-yellow-400 mb-1">⚔️ 출발 전 병력 배치</h2>
        <p className="text-xs text-gray-400 mb-1">출발지에 수비대를 남길 수 있습니다.</p>
        <div className="text-xs text-purple-400 mb-4">✦ {charData.name} — {charData.skill.name}: {charData.skill.desc}</div>

        <div className="flex justify-between text-center mb-3">
          <div className="flex-1">
            <div className="text-2xl font-bold text-blue-400">{takeAmount}</div>
            <div className="text-xs text-gray-400">데리고 감</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {Object.entries(TROOP_DATA).filter(([t]) => (Math.round((piece.composition[t as keyof typeof piece.composition] ?? 0) * takeAmount / piece.troops)) > 0)
                .map(([t]) => `${TROOP_DATA[t as keyof typeof TROOP_DATA].emoji}${Math.round((piece.composition[t as keyof typeof piece.composition] ?? 0) * takeAmount / piece.troops)}`).join(' ')}
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center text-gray-600 text-xl">⇌</div>
          <div className="flex-1">
            <div className="text-2xl font-bold text-green-400">{deployAmount}</div>
            <div className="text-xs text-gray-400">수비대</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {deployAmount > 0
                ? Object.entries(TROOP_DATA).filter(([t]) => (Math.round((piece.composition[t as keyof typeof piece.composition] ?? 0) * deployAmount / piece.troops)) > 0)
                    .map(([t]) => `${TROOP_DATA[t as keyof typeof TROOP_DATA].emoji}${Math.round((piece.composition[t as keyof typeof piece.composition] ?? 0) * deployAmount / piece.troops)}`).join(' ')
                : '없음'}
            </div>
          </div>
        </div>

        <input type="range" min={0} max={maxDeploy} value={deployAmount}
          onChange={e => setDeployAmount(Number(e.target.value))}
          className="w-full mb-4" />

        <button
          onClick={() => dispatch({ type: 'START_DEPLOY', deployAmount })}
          className="w-full py-2.5 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-bold text-sm">
          출발! ({takeAmount}명 동행 / {deployAmount}명 수비)
        </button>
      </div>
    </div>
  );
}
