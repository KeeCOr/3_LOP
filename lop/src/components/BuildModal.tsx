'use client';
import { useState } from 'react';
import type { GameState, TroopType, TroopComp } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';
import { BUILDING_DATA, TROOP_DATA, TROOP_PRICE_SCALE } from '@/lib/gameData';
import { getBuildCost } from '@/lib/economyUtils';
import { CHARACTERS } from '@/lib/gameData';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }

export default function BuildModal({ state, dispatch }: Props) {
  const tileId = state.activeTileAction!;
  const tile = state.tiles.find(t => t.id === tileId)!;
  const gold = state.player.gold;
  const discount = state.player.buildDiscountLaps > 0;
  const isOwnTile = state.activeDeployTileId === tileId;
  const piece = state.pieces.find(p => p.id === state.selectedPieceId);

  // Deploy state
  const [showDeploy, setShowDeploy] = useState(false);
  const [showCollect, setShowCollect] = useState(false);
  const pieceMaxTroops = piece ? CHARACTERS[piece.characterType].maxTroops : 0;
  const maxCollect = piece ? Math.min(tile?.troops ?? 0, pieceMaxTroops - piece.troops) : 0;
  const [collectAmt, setCollectAmt] = useState(0);
  const types = piece
    ? (Object.keys(piece.composition) as TroopType[]).filter(t => (piece.composition[t] ?? 0) > 0)
    : [];
  const initAmounts: Partial<Record<TroopType, number>> = {};
  types.forEach(t => { initAmounts[t] = Math.floor((piece!.composition[t] ?? 0) * 0.3); });
  const [deployAmounts, setDeployAmounts] = useState<Partial<Record<TroopType, number>>>(initAmounts);
  const totalDeploy = Object.values(deployAmounts).reduce((s, n) => s + (n ?? 0), 0);

  // Troop production state
  const [selectedTroop, setSelectedTroop] = useState<TroopType | null>(null);
  const [buyAmt, setBuyAmt] = useState(1);
  const priceScale = 1 + state.player.troopBuyCount * TROOP_PRICE_SCALE;
  const maxTroops = piece ? CHARACTERS[piece.characterType].maxTroops : 0;
  const troopTypes = Object.keys(TROOP_DATA) as TroopType[];
  function unitCost(t: TroopType) { return Math.ceil(TROOP_DATA[t].price * priceScale); }

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
          <button onClick={handleDeployConfirm} disabled={totalDeploy === 0}
            className="w-full py-2 bg-green-700 hover:bg-green-600 disabled:opacity-40 rounded-lg font-bold mb-2">
            {totalDeploy === 0 ? '배치 없이 돌아가기' : `${totalDeploy}명 배치 확정`}
          </button>
          {totalDeploy === 0 && (
            <button onClick={() => setShowDeploy(false)}
              className="w-full py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm">뒤로</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-5 min-w-[340px] text-white relative overflow-hidden">
        <h2 className="text-xl font-bold text-yellow-400 mb-3">🏗️ 내 영토</h2>
        {discount && <div className="text-green-400 text-sm mb-2">✨ 건설 비용 50% 할인 중!</div>}

        {/* Own tile actions */}
        {isOwnTile && piece && (
          <div className="flex gap-2 mb-3">
            {types.length > 0 && (
              <button onClick={() => setShowDeploy(true)}
                className="flex-1 py-2 bg-blue-800 hover:bg-blue-700 border border-blue-600 rounded-lg font-bold text-blue-200 text-sm">
                🏴 배치
              </button>
            )}
            {tile.troops > 0 && (
              <button onClick={() => { setShowCollect(true); setCollectAmt(Math.min(tile.troops, maxCollect)); }}
                className="flex-1 py-2 bg-green-800 hover:bg-green-700 border border-green-600 rounded-lg font-bold text-green-200 text-sm">
                ⚔️ 징집 ({tile.troops}명)
              </button>
            )}
          </div>
        )}

        {/* Troop production (unit shop) */}
        {isOwnTile && piece && (
          <div className="mb-3 bg-gray-800/60 rounded-lg p-3 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-gray-400">🛒 유닛 생산</div>
              <div className="text-xs text-yellow-400">{gold}골드 · {piece.troops}/{maxTroops}명</div>
            </div>
            <div className="grid grid-cols-4 gap-1 mb-2">
              {troopTypes.map(t => {
                const td = TROOP_DATA[t];
                const isSel = selectedTroop === t;
                return (
                  <button key={t}
                    onClick={() => { setSelectedTroop(isSel ? null : t); setBuyAmt(1); }}
                    className={`rounded p-1.5 flex flex-col items-center gap-0.5 border text-center transition-colors
                      ${isSel ? 'border-blue-400 bg-blue-900/50' : 'border-gray-600 bg-gray-800 hover:border-gray-500'}`}>
                    <span className="text-base">{td.emoji}</span>
                    <span className="text-[9px] font-bold leading-tight">{td.name}</span>
                    <span className="text-[9px] text-yellow-400">{unitCost(t)}g</span>
                  </button>
                );
              })}
            </div>
            {selectedTroop && (() => {
              const uc = unitCost(selectedTroop);
              const maxByGold = Math.floor(gold / uc);
              const maxByTroops = Math.max(0, maxTroops - (piece?.troops ?? 0));
              const maxBuy = Math.min(maxByGold, maxByTroops);
              const safe = Math.min(buyAmt, maxBuy);
              return (
                <div className="flex items-center gap-1.5 bg-gray-700 rounded p-2">
                  <button onClick={() => setBuyAmt(a => Math.max(1, a - 1))} className="w-7 h-7 rounded bg-gray-600 hover:bg-gray-500 font-bold text-sm">−</button>
                  <div className="flex-1 text-center font-bold text-sm">{safe}명</div>
                  <button onClick={() => setBuyAmt(a => Math.min(maxBuy, a + 1))} className="w-7 h-7 rounded bg-gray-600 hover:bg-gray-500 font-bold text-sm">+</button>
                  <button
                    onClick={() => { dispatch({ type: 'BUY_TROOPS', pieceId: piece.id, troopType: selectedTroop, amount: safe }); setSelectedTroop(null); setBuyAmt(1); }}
                    disabled={maxBuy <= 0}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded font-bold text-sm">
                    {uc * safe}g
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* Buildings */}
        <div className="flex flex-col gap-2 mb-3">
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
                className="flex items-center gap-3 px-3 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 rounded-lg transition-colors text-left">
                <span className="text-xl">{icons[type]}</span>
                <div className="flex-1">
                  <div className="font-bold text-sm">{data.name[Math.max(0, level)]} {isMax && '(최대)'}</div>
                  <div className="text-xs text-gray-400">{data.description}</div>
                </div>
                <div className="text-yellow-400 font-bold text-sm">{isMax ? '-' : `${cost}골드`}</div>
              </button>
            );
          })}
        </div>

        <button onClick={() => dispatch({ type: 'SKIP_BUILD' })}
          className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">그냥 지나가기</button>
      </div>

      {/* Collect slider overlay */}
      {showCollect && (
        <div className="absolute inset-0 bg-gray-900/95 rounded-xl p-5 flex flex-col justify-center">
          <h3 className="text-base font-bold text-green-400 mb-1">⚔️ 병력 징집</h3>
          <p className="text-xs text-gray-400 mb-3">영토에서 몇 명을 데려갈까요?</p>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>영토 주둔: {tile.troops}명</span>
            <span>말 수용: {piece?.troops ?? 0}/{pieceMaxTroops}명</span>
          </div>
          <div className="text-center text-2xl font-black text-green-300 mb-2">{collectAmt}명 징집</div>
          <input type="range" min={0} max={maxCollect} value={collectAmt}
            onChange={e => setCollectAmt(Number(e.target.value))}
            className="w-full mb-3" />
          <div className="text-xs text-gray-500 text-center mb-3">
            징집 후 영토: {tile.troops - collectAmt}명 | 말: {(piece?.troops ?? 0) + collectAmt}명
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCollect(false)}
              className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">취소</button>
            <button
              onClick={() => { dispatch({ type: 'COLLECT_TROOPS', tileId, amount: collectAmt }); setShowCollect(false); }}
              disabled={collectAmt === 0}
              className="flex-1 py-2 bg-green-700 hover:bg-green-600 disabled:opacity-40 rounded-lg font-bold text-sm">
              {collectAmt === 0 ? '징집 안 함' : `${collectAmt}명 징집`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
