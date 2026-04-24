'use client';
import { useState } from 'react';
import type { GameState, TroopType } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';
import { CHARACTERS, TROOP_DATA, TROOP_PRICE_SCALE } from '@/lib/gameData';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }

export default function LapBonusModal({ state, dispatch }: Props) {
  const bonus = state.lapBonusAnim!;
  const [selectedTroop, setSelectedTroop] = useState<TroopType | null>(null);
  const [buyAmount, setBuyAmount] = useState(1);

  const activePiece = state.pieces.find(p => p.id === state.selectedPieceId)
    ?? state.pieces.find(p => p.owner === 'player')!;
  const maxTroops = CHARACTERS[activePiece.characterType].maxTroops;
  const gold = state.player.gold;
  const priceScale = 1 + state.player.troopBuyCount * TROOP_PRICE_SCALE;
  const isMerchant = activePiece.characterType === 'merchant';
  const discount = isMerchant ? 0.9 : 1;
  function unitCost(t: TroopType) { return Math.ceil(TROOP_DATA[t].price * discount * priceScale); }

  const troopTypes = Object.keys(TROOP_DATA) as TroopType[];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl text-white border border-yellow-500/40 shadow-xl w-[320px] overflow-hidden">

        {/* Lap bonus summary */}
        <div className="p-5 text-center border-b border-gray-700">
          <div className="text-3xl mb-1">🏁</div>
          <h2 className="text-lg font-bold text-yellow-400 mb-3">출발점 통과!</h2>
          <div className="flex gap-2">
            <div className="flex-1 bg-yellow-900/30 rounded-lg px-2 py-1.5 text-center">
              <div className="text-xs text-gray-400">골드</div>
              <div className="text-yellow-300 font-bold">+{bonus.gold} 💰</div>
            </div>
            <div className="flex-1 bg-blue-900/30 rounded-lg px-2 py-1.5 text-center">
              <div className="text-xs text-gray-400">병력</div>
              <div className="text-blue-300 font-bold">+{bonus.troops} ⚔️</div>
            </div>
            {bonus.tileProduction > 0 && (
              <div className="flex-1 bg-green-900/30 rounded-lg px-2 py-1.5 text-center">
                <div className="text-xs text-gray-400">영토</div>
                <div className="text-green-300 font-bold">+{bonus.tileProduction} 🏰</div>
              </div>
            )}
          </div>
        </div>

        {/* Troop shop */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold text-gray-400">🛒 1바퀴 특전 — 병사 고용</div>
            <div className="text-xs text-yellow-400">{gold}골드 보유</div>
          </div>
          <div className="text-xs text-gray-500 mb-2">{activePiece.troops} / {maxTroops}명</div>
          <div className="grid grid-cols-4 gap-1 mb-2">
            {troopTypes.map(t => {
              const td = TROOP_DATA[t];
              const isSelected = selectedTroop === t;
              return (
                <button key={t}
                  onClick={() => { setSelectedTroop(isSelected ? null : t); setBuyAmount(1); }}
                  className={`rounded-lg p-1.5 flex flex-col items-center gap-0.5 border transition-colors
                    ${isSelected ? 'border-blue-400 bg-blue-900/50' : 'border-gray-600 bg-gray-800 hover:border-gray-500'}`}>
                  <span className="text-lg">{td.emoji}</span>
                  <span className="text-[10px] font-bold leading-tight">{td.name}</span>
                  <span className="text-[10px] text-yellow-400">{unitCost(t)}g</span>
                </button>
              );
            })}
          </div>

          {selectedTroop && (() => {
            const td = TROOP_DATA[selectedTroop];
            const uc = unitCost(selectedTroop);
            const maxByGold = Math.floor(gold / uc);
            const maxByTroops = Math.max(0, maxTroops - activePiece.troops);
            const maxBuy = Math.min(maxByGold, maxByTroops);
            const safeAmount = Math.min(buyAmount, maxBuy);
            return (
              <div className="bg-gray-800 rounded-lg p-2 flex items-center gap-2">
                <span className="text-lg">{td.emoji}</span>
                <button onClick={() => setBuyAmount(a => Math.max(1, a - 1))}
                  className="w-7 h-7 rounded bg-gray-700 hover:bg-gray-600 font-bold">−</button>
                <div className="flex-1 text-center font-bold text-sm">{safeAmount}명</div>
                <button onClick={() => setBuyAmount(a => Math.min(maxBuy, a + 1))}
                  className="w-7 h-7 rounded bg-gray-700 hover:bg-gray-600 font-bold">+</button>
                <button
                  onClick={() => { dispatch({ type: 'BUY_TROOPS', pieceId: activePiece.id, troopType: selectedTroop, amount: safeAmount }); setSelectedTroop(null); setBuyAmount(1); }}
                  disabled={maxBuy <= 0}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded font-bold text-sm">
                  {uc * safeAmount}g
                </button>
              </div>
            );
          })()}
        </div>

        <div className="p-4">
          <button
            onClick={() => dispatch({ type: 'CLEAR_LAP_BONUS' })}
            className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg">
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
