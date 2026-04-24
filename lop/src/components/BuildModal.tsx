'use client';
import { useState } from 'react';
import type { GameState, TroopType, TroopComp } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';
import { BUILDING_DATA, TROOP_DATA } from '@/lib/gameData';
import { getBuildCost } from '@/lib/economyUtils';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }
export default function BuildModal({ state, dispatch }: Props) {
  const tileId = state.activeTileAction!;
  const tile = state.tiles.find(t => t.id === tileId)!;
  const gold = state.player.gold;
  const discount = state.player.buildDiscountLaps > 0;
  const isOwnTile = state.activeDeployTileId === tileId;
  const piece = state.pieces.find(p => p.id === state.selectedPieceId);

  const [showDeploy, setShowDeploy] = useState(false);
  const types = piece
    ? (Object.keys(piece.composition) as TroopType[]).filter(t => (piece.composition[t] ?? 0) > 0)
    : [];
  const initAmounts: Partial<Record<TroopType, number>> = {};
  types.forEach(t => { initAmounts[t] = Math.floor((piece!.composition[t] ?? 0) * 0.3); });
  const [deployAmounts, setDeployAmounts] = useState<Partial<Record<TroopType, number>>>(initAmounts);
  const totalDeploy = Object.values(deployAmounts).reduce((s, n) => s + (n ?? 0), 0);

  function handleDeployConfirm() {
    const garrison: TroopComp = {};
    (Object.keys(deployAmounts) as TroopType[]).forEach(t => {
      if ((deployAmounts[t] ?? 0) > 0) garrison[t] = deployAmounts[t];
    });
    dispatch({ type: 'DEPLOY_TROOPS', tileId, garrison });
  }

  const buildingTypes = ['vault', 'barracks', 'fort'] as const;
  const icons = { vault: '🏦', barracks: '🏕️', fort: '🏰' };

  if (showDeploy && piece) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-xl p-6 min-w-[340px] text-white">
          <h2 className="text-xl font-bold text-green-400 mb-1">🏴 병력 배치</h2>
          <p className="text-xs text-gray-400 mb-4">내 영토에 병력을 배치합니다.</p>
          <div className="flex flex-col gap-3 mb-4">
            {types.map(t => {
              const td = TROOP_DATA[t];
              const max = piece.composition[t] ?? 0;
              const val = deployAmounts[t] ?? 0;
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
                    onChange={e => setDeployAmounts(prev => ({ ...prev, [t]: Number(e.target.value) }))}
                    className="w-full" />
                </div>
              );
            })}
          </div>
          <div className="text-center text-sm text-gray-300 mb-3">
            총 배치: <span className="text-green-400 font-bold">{totalDeploy}명</span>
            {' '}/ 잔여: <span className="text-blue-400 font-bold">{piece.troops - totalDeploy}명</span>
          </div>
          <button
            onClick={handleDeployConfirm}
            disabled={totalDeploy === 0}
            className="w-full py-2 bg-green-700 hover:bg-green-600 disabled:opacity-40 rounded-lg font-bold mb-2">
            {totalDeploy === 0 ? '배치 없이 돌아가기' : `${totalDeploy}명 배치 확정`}
          </button>
          {totalDeploy === 0 && (
            <button onClick={() => setShowDeploy(false)}
              className="w-full py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm">
              뒤로
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 min-w-[340px] text-white">
        <h2 className="text-xl font-bold text-yellow-400 mb-4">🏗️ 건물 건설</h2>
        {discount && <div className="text-green-400 text-sm mb-3">✨ 건설 비용 50% 할인 중!</div>}

        {/* Deploy button for own tile */}
        {isOwnTile && piece && types.length > 0 && (
          <button onClick={() => setShowDeploy(true)}
            className="w-full py-2 mb-3 bg-blue-800 hover:bg-blue-700 border border-blue-600 rounded-lg font-bold text-blue-200 text-sm">
            🏴 병력 배치하기 ({piece.troops}명 보유)
          </button>
        )}

        <div className="flex flex-col gap-3 mb-4">
          {buildingTypes.map(type => {
            const data = BUILDING_DATA[type];
            const canBuild = tile.building === null || tile.building === type;
            const isMax = tile.building === type && tile.buildingLevel >= 3;
            const cost = getBuildCost(tile, type, discount);
            const level = tile.building === type ? tile.buildingLevel : 0;
            return (
              <button key={type}
                onClick={() => dispatch({ type: 'BUILD', tileId, buildingType: type })}
                disabled={!canBuild || isMax || gold < cost}
                className="flex items-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 rounded-lg transition-colors text-left">
                <span className="text-2xl">{icons[type]}</span>
                <div className="flex-1">
                  <div className="font-bold">{data.name[Math.max(0, level)]} {isMax && '(최대)'}</div>
                  <div className="text-xs text-gray-400">{data.description}</div>
                </div>
                <div className="text-yellow-400 font-bold">{isMax ? '-' : `${cost}골드`}</div>
              </button>
            );
          })}
        </div>
        {tile.troops > 0 && (
          <button onClick={() => dispatch({ type: 'COLLECT_TROOPS', tileId })}
            className="w-full py-2 bg-green-700 hover:bg-green-600 rounded-lg font-bold mb-2">
            ⚔️ 병력 징집 ({tile.troops}명 수령)
          </button>
        )}
        <button onClick={() => dispatch({ type: 'SKIP_BUILD' })}
          className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">그냥 지나가기</button>
      </div>
    </div>
  );
}
