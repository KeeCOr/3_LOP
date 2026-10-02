'use client';
import { useState } from 'react';
import type { GameState, TroopComp, TroopType } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';
import { TROOP_DATA } from '@/lib/gameData';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }

export default function DeployModal({ state, dispatch }: Props) {
  const tileId = state.activeDeployTileId!;
  const tile = state.tiles.find(t => t.id === tileId)!;
  const piece = state.pieces.find(p => p.id === state.selectedPieceId)!;
  const types = (Object.keys(piece.composition) as TroopType[]).filter(t => (piece.composition[t] ?? 0) > 0);

  const initAmounts: Partial<Record<TroopType, number>> = {};
  types.forEach(t => { initAmounts[t] = Math.floor((piece.composition[t] ?? 0) * 0.3); });
  const [amounts, setAmounts] = useState<Partial<Record<TroopType, number>>>(initAmounts);

  const totalDeploy = Object.values(amounts).reduce((sum, amount) => sum + (amount ?? 0), 0);
  const finalGarrison = tile.troops + totalDeploy;
  const remainingOnPiece = piece.troops - totalDeploy;

  function setAmount(type: TroopType, value: number) {
    setAmounts(prev => ({ ...prev, [type]: value }));
  }

  function handleConfirm() {
    const garrison: TroopComp = {};
    (Object.keys(amounts) as TroopType[]).forEach(type => {
      if ((amounts[type] ?? 0) > 0) garrison[type] = amounts[type];
    });
    dispatch({ type: 'DEPLOY_TROOPS', tileId, garrison });
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3">
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-[440px] max-h-[calc(100vh-1.5rem)] overflow-y-auto text-white">
        <h2 className="text-xl font-bold text-green-400 mb-1">영토 확보! 병력 배치</h2>
        <div className="bg-green-900/30 border border-green-700/50 rounded-lg px-3 py-2 mb-3 text-xs text-green-300">
          구매 또는 점령으로 이미 배치된 병력은 아래의 <b>현재 주둔</b>에 포함되어 있습니다. 추가 병력은 선택 사항입니다.
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4 text-center text-xs">
          <div className="rounded-lg bg-gray-800 px-3 py-2">
            <div className="text-gray-400">현재 주둔</div>
            <div className="mt-1 text-lg font-black text-green-300">{tile.troops}명</div>
          </div>
          <div className="rounded-lg bg-gray-800 px-3 py-2">
            <div className="text-gray-400">추가 배치</div>
            <div className="mt-1 text-lg font-black text-yellow-300">+{totalDeploy}명</div>
          </div>
          <div className="rounded-lg bg-gray-800 px-3 py-2">
            <div className="text-gray-400">배치 후 주둔</div>
            <div className="mt-1 text-lg font-black text-white">{finalGarrison}명</div>
          </div>
          <div className="rounded-lg bg-gray-800 px-3 py-2">
            <div className="text-gray-400">말에 남음</div>
            <div className="mt-1 text-lg font-black text-blue-300">{remainingOnPiece}명</div>
          </div>
        </div>

        <div className="flex flex-col gap-3 mb-4">
          {types.map(type => {
            const troop = TROOP_DATA[type];
            const max = piece.composition[type] ?? 0;
            const value = amounts[type] ?? 0;

            return (
              <div key={type} className="bg-gray-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{troop.emoji}</span>
                    <div>
                      <div className="font-bold text-sm">{troop.name}</div>
                      <div className="text-xs text-gray-400">보유 {max}명</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-400 font-bold text-lg">{value}명 배치</div>
                    <div className="text-xs text-gray-400">{max - value}명 유지</div>
                  </div>
                </div>
                <input type="range" min={0} max={max} value={value}
                  onChange={e => setAmount(type, Number(e.target.value))}
                  className="w-full" />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>공격 x{troop.attack}</span>
                  <span>방어 x{troop.defense}</span>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleConfirm}
          className="w-full min-w-0 py-2 bg-green-700 hover:bg-green-600 rounded-lg font-bold whitespace-normal break-words">
          {totalDeploy === 0 ? '기본 병력만 두고 지나가기' : `총 ${finalGarrison}명으로 주둔 확정`}
        </button>
      </div>
    </div>
  );
}
