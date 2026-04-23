'use client';
import { useState } from 'react';
import type { GameState, Equipment } from '@/lib/gameTypes';
import type { CharacterType } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';
import { EQUIPMENT, CHARACTERS, TROOP_PRICE, nextHireCost } from '@/lib/gameData';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }

function EffectTag({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${color}`}>
      {label} {value}
    </span>
  );
}

function EquipmentEffects({ eq }: { eq: Equipment }) {
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {eq.attackBonus > 1 && (
        <EffectTag label="⚔️ 공격" value={`×${eq.attackBonus.toFixed(1)}`} color="bg-red-900 text-red-200" />
      )}
      {eq.defenseBonus > 1 && (
        <EffectTag label="🛡️ 방어" value={`×${eq.defenseBonus.toFixed(1)}`} color="bg-blue-900 text-blue-200" />
      )}
      {eq.commandBonus > 0 && (
        <EffectTag label="👥 최대병력" value={`+${eq.commandBonus}`} color="bg-green-900 text-green-200" />
      )}
      {eq.moveBonus > 0 && (
        <EffectTag label="👢 이동" value={`+${eq.moveBonus}`} color="bg-yellow-900 text-yellow-200" />
      )}
    </div>
  );
}

export default function ShopModal({ state, dispatch }: Props) {
  const [buyTroopAmount, setBuyTroopAmount] = useState(5);
  const gold = state.player.gold;
  const activePiece = state.pieces.find(p => p.id === state.selectedPieceId) ?? state.pieces.find(p => p.owner === 'player')!;
  const hireCost = nextHireCost(state.player.pieceCount);
  const chars = Object.keys(CHARACTERS) as CharacterType[];
  const charData = CHARACTERS[activePiece.characterType];
  const totalAttack = charData.attack * activePiece.equipment.reduce((a, e) => a * e.attackBonus, 1);
  const totalDefense = charData.defense * activePiece.equipment.reduce((a, e) => a * e.defenseBonus, 1);
  const totalMaxTroops = charData.maxTroops + activePiece.equipment.reduce((a, e) => a + e.commandBonus, 0);
  const totalMove = charData.moveBonus + activePiece.equipment.reduce((a, e) => a + e.moveBonus, 0);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 min-w-[380px] text-white max-h-[85vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-yellow-400 mb-3">🛒 상점 (보유: {gold}골드)</h2>

        {/* Current piece stats */}
        <div className="bg-gray-800 rounded-lg p-3 mb-4 text-sm">
          <div className="font-bold text-gray-300 mb-2">📊 {charData.name} 현재 능력치</div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="text-red-300 text-xs">⚔️ 공격</div>
              <div className="font-bold text-white">{totalAttack.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-blue-300 text-xs">🛡️ 방어</div>
              <div className="font-bold text-white">{totalDefense.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-green-300 text-xs">👥 최대</div>
              <div className="font-bold text-white">{totalMaxTroops}</div>
            </div>
            <div>
              <div className="text-yellow-300 text-xs">👢 이동</div>
              <div className="font-bold text-white">+{totalMove}</div>
            </div>
          </div>
          {activePiece.equipment.length > 0 && (
            <div className="mt-2 text-xs text-gray-400">
              장착 중: {activePiece.equipment.map(e => e.name).join(', ')}
            </div>
          )}
        </div>

        {/* Troop purchase */}
        <div className="mb-4">
          <div className="font-bold text-gray-300 mb-2">⚔️ 병력 구매 (1명 = {TROOP_PRICE}골드)</div>
          <div className="text-xs text-gray-400 mb-2">
            현재 {activePiece.troops}명 / 최대 {totalMaxTroops}명
          </div>
          <div className="flex items-center gap-3">
            <input type="range" min={1} max={20} value={buyTroopAmount}
              onChange={e => setBuyTroopAmount(Number(e.target.value))} className="flex-1" />
            <span className="text-sm">{buyTroopAmount}명 = {buyTroopAmount * TROOP_PRICE}골드</span>
          </div>
          <button onClick={() => dispatch({ type: 'BUY_TROOPS', pieceId: activePiece.id, amount: buyTroopAmount })}
            disabled={gold < TROOP_PRICE}
            className="mt-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 rounded-lg w-full">구매</button>
        </div>

        {/* Equipment */}
        <div className="mb-4">
          <div className="font-bold text-gray-300 mb-2">🗡️ 장비 (슬롯 {activePiece.equipment.length}/3)</div>
          <div className="flex flex-col gap-2">
            {EQUIPMENT.map(eq => {
              const owned = activePiece.equipment.some(e => e.id === eq.id);
              const slotFull = activePiece.equipment.length >= 3;
              const canBuy = !owned && !slotFull && gold >= eq.price;
              return (
                <div key={eq.id}
                  className={`rounded-lg p-3 border ${owned ? 'border-green-600 bg-green-950' : 'border-gray-700 bg-gray-800'}`}>
                  <div className="flex items-center justify-between">
                    <div className="font-bold">
                      {owned && <span className="text-green-400 mr-1">✓</span>}
                      {eq.name}
                    </div>
                    <button
                      onClick={() => dispatch({ type: 'BUY_EQUIPMENT', pieceId: activePiece.id, equipmentId: eq.id })}
                      disabled={!canBuy}
                      className="px-3 py-1 bg-yellow-700 hover:bg-yellow-600 disabled:opacity-40 rounded text-sm font-bold">
                      {owned ? '장착됨' : `${eq.price}골드`}
                    </button>
                  </div>
                  <EquipmentEffects eq={eq} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Hire piece */}
        <div className="mb-4">
          <div className="font-bold text-gray-300 mb-2">🧑‍✈️ 말 고용 ({hireCost}골드)</div>
          <div className="grid grid-cols-2 gap-2">
            {chars.map(c => {
              const cd = CHARACTERS[c];
              return (
                <button key={c} onClick={() => dispatch({ type: 'BUY_PIECE', characterType: c })}
                  disabled={gold < hireCost}
                  className="px-3 py-2 bg-purple-800 hover:bg-purple-700 disabled:opacity-40 rounded text-sm text-left">
                  <div className="font-bold">{cd.name}</div>
                  <div className="text-xs text-purple-300">{cd.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        <button onClick={() => dispatch({ type: 'CLOSE_SHOP' })}
          className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">닫기</button>
      </div>
    </div>
  );
}
