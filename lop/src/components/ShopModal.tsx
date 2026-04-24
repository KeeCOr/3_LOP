'use client';
import { useState } from 'react';
import type { GameState, TroopType } from '@/lib/gameTypes';
import type { CharacterType } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';
import { CHARACTERS, TROOP_DATA, nextHireCost, TROOP_PRICE_SCALE } from '@/lib/gameData';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }

const TROOP_TYPES = Object.keys(TROOP_DATA) as TroopType[];

export default function ShopModal({ state, dispatch }: Props) {
  const [selectedTroop, setSelectedTroop] = useState<TroopType | null>(null);
  const [buyAmount, setBuyAmount] = useState(1);

  const gold = state.player.gold;
  const activePiece = state.pieces.find(p => p.id === state.selectedPieceId) ?? state.pieces.find(p => p.owner === 'player')!;
  const charData = CHARACTERS[activePiece.characterType];
  const maxTroops = charData.maxTroops;
  const ismerchant = activePiece.characterType === 'merchant';
  const discount = ismerchant ? 0.9 : 1;
  const hireCost = Math.floor(nextHireCost(state.player.pieceCount) * discount);
  const chars = Object.keys(CHARACTERS) as CharacterType[];
  const priceScale = 1 + state.player.troopBuyCount * TROOP_PRICE_SCALE;

  function unitCost(t: TroopType) { return Math.ceil(TROOP_DATA[t].price * discount * priceScale); }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl w-[340px] text-white overflow-hidden flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800 flex-none">
          <div>
            <div className="font-bold text-sm">{charData.name}</div>
            <div className="text-xs text-purple-400">✦ {charData.skill.name}: {charData.skill.desc}</div>
          </div>
          <div className="text-right">
            <div className="text-yellow-400 font-bold">{gold}골드</div>
            <div className="text-xs text-gray-400">{activePiece.troops} / {maxTroops}명</div>
          </div>
        </div>

        {/* Current composition */}
        <div className="px-4 py-1.5 bg-gray-800/40 border-t border-gray-700 flex gap-3 text-xs text-gray-300 flex-none">
          {(Object.entries(activePiece.composition) as [TroopType, number][])
            .filter(([, n]) => (n ?? 0) > 0)
            .map(([t, n]) => <span key={t}>{TROOP_DATA[t].emoji} {n}</span>)}
          {activePiece.troops === 0 && <span className="text-gray-500">병력 없음</span>}
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Troops section */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">병사 고용</div>
            {state.player.troopBuyCount > 0 && (
              <div className="text-xs text-orange-400">가격 +{Math.round(state.player.troopBuyCount * TROOP_PRICE_SCALE * 100)}%</div>
            )}
          </div>
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {TROOP_TYPES.map(t => {
                const td = TROOP_DATA[t];
                const isSelected = selectedTroop === t;
                return (
                  <button key={t}
                    onClick={() => { setSelectedTroop(isSelected ? null : t); setBuyAmount(1); }}
                    className={`rounded-lg p-2 flex flex-col items-center gap-0.5 border transition-colors
                      ${isSelected ? 'border-blue-400 bg-blue-900/50' : 'border-gray-600 bg-gray-800 hover:border-gray-500'}`}>
                    <span className="text-xl">{td.emoji}</span>
                    <span className="text-xs font-bold">{td.name}</span>
                    <span className="text-xs text-yellow-400">{unitCost(t)}g</span>
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
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm">
                      <span className="font-bold">{td.emoji} {td.name}</span>
                      <span className="text-xs text-green-400 ml-2">
                        ▶ {td.counters.map(c => TROOP_DATA[c].name).join('·')}에 강함
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{maxBuy}명 가능</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setBuyAmount(a => Math.max(1, a - 1))}
                      className="w-8 h-8 rounded bg-gray-700 hover:bg-gray-600 font-bold text-lg">−</button>
                    <div className="flex-1 text-center font-bold">{safeAmount}명</div>
                    <button onClick={() => setBuyAmount(a => Math.min(maxBuy, a + 1))}
                      className="w-8 h-8 rounded bg-gray-700 hover:bg-gray-600 font-bold text-lg">+</button>
                    <button
                      onClick={() => dispatch({ type: 'BUY_TROOPS', pieceId: activePiece.id, troopType: selectedTroop, amount: safeAmount })}
                      disabled={maxBuy <= 0}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded font-bold text-sm min-w-[64px]">
                      {uc * safeAmount}g
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Hire piece section */}
          <div className="px-4 pb-4 border-t border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">말 고용</div>
              <div className="text-xs text-yellow-400">{hireCost}골드{ismerchant && ' (10% 할인)'}</div>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {chars.map(c => {
                const cd = CHARACTERS[c];
                return (
                  <button key={c}
                    onClick={() => dispatch({ type: 'BUY_PIECE', characterType: c })}
                    disabled={gold < hireCost}
                    className="rounded-lg p-2 bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700/50 disabled:opacity-40 text-center">
                    <div className="text-xs font-bold">{cd.name}</div>
                    <div className="text-xs text-purple-300 truncate">{cd.skill.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-4 pb-4 flex-none border-t border-gray-700 pt-3">
          <button onClick={() => dispatch({ type: 'CLOSE_SHOP' })}
            className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-bold">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
