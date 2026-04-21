'use client';
import { useState } from 'react';
import type { GameState } from '@/lib/gameTypes';
import type { CharacterType } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';
import { EQUIPMENT, CHARACTERS, TROOP_PRICE, nextHireCost } from '@/lib/gameData';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }
export default function ShopModal({ state, dispatch }: Props) {
  const [buyTroopAmount, setBuyTroopAmount] = useState(5);
  const gold = state.player.gold;
  const activePiece = state.pieces.find(p => p.id === state.selectedPieceId) ?? state.pieces.find(p => p.owner === 'player')!;
  const hireCost = nextHireCost(state.player.pieceCount);
  const chars = Object.keys(CHARACTERS) as CharacterType[];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 min-w-[360px] text-white max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-yellow-400 mb-4">🛒 상점 (보유: {gold}골드)</h2>

        <div className="mb-4">
          <div className="font-bold text-gray-300 mb-2">⚔️ 병력 구매 (1명 = {TROOP_PRICE}골드)</div>
          <div className="flex items-center gap-3">
            <input type="range" min={1} max={20} value={buyTroopAmount}
              onChange={e => setBuyTroopAmount(Number(e.target.value))} className="flex-1" />
            <span>{buyTroopAmount}명 = {buyTroopAmount * TROOP_PRICE}골드</span>
          </div>
          <button onClick={() => dispatch({ type: 'BUY_TROOPS', pieceId: activePiece.id, amount: buyTroopAmount })}
            disabled={gold < TROOP_PRICE}
            className="mt-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 rounded-lg w-full">구매</button>
        </div>

        <div className="mb-4">
          <div className="font-bold text-gray-300 mb-2">🗡️ 장비</div>
          {EQUIPMENT.map(eq => {
            const owned = activePiece.equipment.some(e => e.id === eq.id);
            const slotFull = activePiece.equipment.length >= 3;
            return (
              <div key={eq.id} className="flex items-center justify-between py-2 border-b border-gray-700">
                <span>{eq.name} {owned && '✓'}</span>
                <button onClick={() => dispatch({ type: 'BUY_EQUIPMENT', pieceId: activePiece.id, equipmentId: eq.id })}
                  disabled={owned || slotFull || gold < eq.price}
                  className="px-3 py-1 bg-yellow-700 hover:bg-yellow-600 disabled:opacity-40 rounded text-sm">
                  {eq.price}골드
                </button>
              </div>
            );
          })}
        </div>

        <div className="mb-4">
          <div className="font-bold text-gray-300 mb-2">🧑‍✈️ 말 고용 ({hireCost}골드)</div>
          <div className="grid grid-cols-2 gap-2">
            {chars.map(c => (
              <button key={c} onClick={() => dispatch({ type: 'BUY_PIECE', characterType: c })}
                disabled={gold < hireCost}
                className="px-3 py-2 bg-purple-800 hover:bg-purple-700 disabled:opacity-40 rounded text-sm">
                {CHARACTERS[c].name}
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => dispatch({ type: 'CLOSE_SHOP' })}
          className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">닫기</button>
      </div>
    </div>
  );
}
