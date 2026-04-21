'use client';
import { useState } from 'react';
import type { GameState } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }
export default function DeployModal({ state, dispatch }: Props) {
  const tileId = state.activeDeployTileId!;
  const piece = state.pieces.find(p => p.id === state.selectedPieceId)!;
  const [amount, setAmount] = useState(Math.min(3, piece.troops));

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 min-w-[300px] text-white">
        <h2 className="text-xl font-bold text-green-400 mb-4">🏴 점령 성공! 병력 배치</h2>
        <div className="text-gray-300 mb-4">
          <div>남은 병력: {piece.troops}명</div>
          <div>배치할 수비대: <span className="text-yellow-400 font-bold">{amount}명</span></div>
        </div>
        <input type="range" min={1} max={piece.troops} value={amount}
          onChange={e => setAmount(Number(e.target.value))}
          className="w-full mb-4" />
        <button onClick={() => dispatch({ type: 'DEPLOY_TROOPS', tileId, amount })}
          className="w-full px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg font-bold">
          배치 확정
        </button>
      </div>
    </div>
  );
}
