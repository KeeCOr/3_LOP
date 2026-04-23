'use client';
import { useState } from 'react';
import type { GameState, TroopType, TroopComp } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';
import { TROOP_DATA } from '@/lib/gameData';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }

export default function DeployModal({ state, dispatch }: Props) {
  const tileId = state.activeDeployTileId!;
  const piece = state.pieces.find(p => p.id === state.selectedPieceId)!;
  const types = (Object.keys(piece.composition) as TroopType[]).filter(t => (piece.composition[t] ?? 0) > 0);

  const initAmounts: Partial<Record<TroopType, number>> = {};
  types.forEach(t => { initAmounts[t] = Math.floor((piece.composition[t] ?? 0) * 0.3); });
  const [amounts, setAmounts] = useState<Partial<Record<TroopType, number>>>(initAmounts);

  const totalDeploy = Object.values(amounts).reduce((s, n) => s + (n ?? 0), 0);

  function set(t: TroopType, val: number) {
    setAmounts(prev => ({ ...prev, [t]: val }));
  }

  function handleConfirm() {
    const garrison: TroopComp = {};
    (Object.keys(amounts) as TroopType[]).forEach(t => {
      if ((amounts[t] ?? 0) > 0) garrison[t] = amounts[t];
    });
    dispatch({ type: 'DEPLOY_TROOPS', tileId, garrison });
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 min-w-[340px] text-white">
        <h2 className="text-xl font-bold text-green-400 mb-1">🏴 점령 성공! 수비대 배치</h2>
        <p className="text-xs text-gray-400 mb-4">종류별로 배치할 병력을 선택하세요. 나머지는 이동 부대가 유지합니다.</p>

        <div className="flex flex-col gap-3 mb-4">
          {types.map(t => {
            const td = TROOP_DATA[t];
            const max = piece.composition[t] ?? 0;
            const val = amounts[t] ?? 0;
            return (
              <div key={t} className="bg-gray-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{td.emoji}</span>
                    <div>
                      <div className="font-bold text-sm">{td.name}</div>
                      <div className="text-xs text-gray-400">보유 {max}명</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-400 font-bold text-lg">{val}명 배치</div>
                    <div className="text-xs text-gray-400">{max - val}명 유지</div>
                  </div>
                </div>
                <input type="range" min={0} max={max} value={val}
                  onChange={e => set(t, Number(e.target.value))}
                  className="w-full" />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>⚔️ 공격 ×{td.attack}</span>
                  <span>🛡️ 방어 ×{td.defense}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center text-sm text-gray-300 mb-3">
          총 배치: <span className="text-green-400 font-bold">{totalDeploy}명</span>
          {' '}/ 잔여: <span className="text-blue-400 font-bold">{piece.troops - totalDeploy}명</span>
        </div>

        <button
          onClick={handleConfirm}
          disabled={totalDeploy === 0}
          className="w-full py-2 bg-green-700 hover:bg-green-600 disabled:opacity-40 rounded-lg font-bold">
          {totalDeploy === 0 ? '배치 없이 지나가기' : `${totalDeploy}명 배치 확정`}
        </button>
        {totalDeploy === 0 && (
          <button onClick={handleConfirm} className="w-full mt-2 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm">
            점령만 하고 병력 배치 안 함
          </button>
        )}
      </div>
    </div>
  );
}
