'use client';
import { useState } from 'react';
import type { GameState, Equipment, TroopType } from '@/lib/gameTypes';
import type { CharacterType } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';
import { EQUIPMENT, CHARACTERS, TROOP_DATA, nextHireCost } from '@/lib/gameData';

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
      {eq.attackBonus > 1 && <EffectTag label="⚔️ 공격" value={`×${eq.attackBonus.toFixed(1)}`} color="bg-red-900 text-red-200" />}
      {eq.defenseBonus > 1 && <EffectTag label="🛡️ 방어" value={`×${eq.defenseBonus.toFixed(1)}`} color="bg-blue-900 text-blue-200" />}
      {eq.commandBonus > 0 && <EffectTag label="👥 최대병력" value={`+${eq.commandBonus}`} color="bg-green-900 text-green-200" />}
      {eq.moveBonus > 0 && <EffectTag label="👢 이동" value={`+${eq.moveBonus}`} color="bg-yellow-900 text-yellow-200" />}
    </div>
  );
}

const TROOP_TYPES = Object.keys(TROOP_DATA) as TroopType[];

export default function ShopModal({ state, dispatch }: Props) {
  const [buyAmounts, setBuyAmounts] = useState<Partial<Record<TroopType, number>>>({ infantry: 3 });
  const gold = state.player.gold;
  const activePiece = state.pieces.find(p => p.id === state.selectedPieceId) ?? state.pieces.find(p => p.owner === 'player')!;
  const hireCost = nextHireCost(state.player.pieceCount);
  const chars = Object.keys(CHARACTERS) as CharacterType[];
  const charData = CHARACTERS[activePiece.characterType];
  const totalMaxTroops = charData.maxTroops + activePiece.equipment.reduce((a, e) => a + e.commandBonus, 0);
  const totalAttackMod = activePiece.equipment.reduce((a, e) => a * e.attackBonus, 1);
  const totalDefenseMod = activePiece.equipment.reduce((a, e) => a * e.defenseBonus, 1);
  const totalMove = charData.moveBonus + activePiece.equipment.reduce((a, e) => a + e.moveBonus, 0);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 min-w-[400px] text-white max-h-[85vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-yellow-400 mb-3">🛒 상점 (보유: {gold}골드)</h2>

        {/* Current piece stats */}
        <div className="bg-gray-800 rounded-lg p-3 mb-4 text-sm">
          <div className="font-bold text-gray-300 mb-2">📊 {charData.name} 능력치</div>
          <div className="grid grid-cols-4 gap-2 text-center text-xs mb-2">
            <div><div className="text-red-300">⚔️ 공격</div><div className="font-bold">{(charData.attack * totalAttackMod).toFixed(2)}</div></div>
            <div><div className="text-blue-300">🛡️ 방어</div><div className="font-bold">{(charData.defense * totalDefenseMod).toFixed(2)}</div></div>
            <div><div className="text-green-300">👥 최대</div><div className="font-bold">{totalMaxTroops}</div></div>
            <div><div className="text-yellow-300">👢 이동</div><div className="font-bold">+{totalMove}</div></div>
          </div>
          <div className="text-xs text-gray-400">
            현재 병력: {activePiece.troops}명
            {Object.entries(activePiece.composition).filter(([,n]) => (n ?? 0) > 0).map(([t, n]) =>
              ` ${TROOP_DATA[t as TroopType].emoji}${TROOP_DATA[t as TroopType].name} ${n}`
            ).join(' /')}
          </div>
        </div>

        {/* Troop purchase by type */}
        <div className="mb-4">
          <div className="font-bold text-gray-300 mb-2">⚔️ 병사 고용</div>
          <div className="grid grid-cols-2 gap-2">
            {TROOP_TYPES.map(t => {
              const td = TROOP_DATA[t];
              const amount = buyAmounts[t] ?? 1;
              const cost = amount * td.price;
              const canAfford = gold >= td.price;
              return (
                <div key={t} className="bg-gray-800 rounded-lg p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{td.emoji}</span>
                    <div className="flex-1">
                      <div className="font-bold text-sm">{td.name}</div>
                      <div className="text-xs text-gray-400">{td.desc}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <span className="bg-red-900/50 text-red-200 rounded px-1">⚔️ ×{td.attack}</span>
                    <span className="bg-blue-900/50 text-blue-200 rounded px-1">🛡️ ×{td.defense}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="range" min={1} max={20} value={amount}
                      onChange={e => setBuyAmounts(prev => ({ ...prev, [t]: Number(e.target.value) }))}
                      className="flex-1 h-1" />
                    <span className="text-xs text-gray-300 w-8 text-right">{amount}명</span>
                  </div>
                  <button
                    onClick={() => dispatch({ type: 'BUY_TROOPS', pieceId: activePiece.id, troopType: t, amount })}
                    disabled={!canAfford}
                    className="w-full py-1.5 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 rounded text-sm font-bold">
                    {cost}골드
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Equipment */}
        <div className="mb-4">
          <div className="font-bold text-gray-300 mb-2">🗡️ 장비 (슬롯 {activePiece.equipment.length}/3)</div>
          <div className="flex flex-col gap-2">
            {EQUIPMENT.map(eq => {
              const owned = activePiece.equipment.some(e => e.id === eq.id);
              const canBuy = !owned && activePiece.equipment.length < 3 && gold >= eq.price;
              return (
                <div key={eq.id} className={`rounded-lg p-3 border ${owned ? 'border-green-600 bg-green-950' : 'border-gray-700 bg-gray-800'}`}>
                  <div className="flex items-center justify-between">
                    <div className="font-bold">{owned && <span className="text-green-400 mr-1">✓</span>}{eq.name}</div>
                    <button onClick={() => dispatch({ type: 'BUY_EQUIPMENT', pieceId: activePiece.id, equipmentId: eq.id })}
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
