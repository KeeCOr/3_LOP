'use client';
import { useState } from 'react';
import type { GameState } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';
import { TROOP_DATA } from '@/lib/gameData';
import { TILE_DEFINITIONS } from '@/lib/boardLayout';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }

const MERC_COST = 400;

const BUILDING_ICONS: Record<string, string> = { vault: '🏦', barracks: '🏕️', fort: '🏰' };

export default function MercenaryModal({ state, dispatch }: Props) {
  const isPlayerTurn = state.currentTurn === 'player';
  const gold = state.player.gold;
  const result = state.mercenaryResult;
  const canBuy = isPlayerTurn && gold >= MERC_COST && result === null;
  const [showTileSelect, setShowTileSelect] = useState(false);

  const ownedTiles = state.tiles.filter(t =>
    t.owner === 'player' && (t.type === 'land' || t.type === 'start_p')
  );

  // Tile selection screen
  if (result && showTileSelect) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-xl p-5 w-[300px] text-white border-t-2 border-orange-500">
          <h3 className="text-base font-bold text-green-400 mb-1">🏰 배치할 영토 선택</h3>
          <p className="text-xs text-gray-400 mb-3">
            {TROOP_DATA[result.troopType].emoji} {TROOP_DATA[result.troopType].name} {result.amount}명을 배치할 영토
          </p>
          <div className="flex flex-col gap-1.5 mb-3 max-h-[220px] overflow-y-auto">
            {ownedTiles.map(t => {
              const def = TILE_DEFINITIONS.find(d => d.index === t.id);
              const buildingIcons = Object.entries(t.buildings ?? {})
                .filter(([, lv]) => (lv ?? 0) > 0)
                .map(([type]) => BUILDING_ICONS[type] ?? '')
                .join('');
              return (
                <button key={t.id}
                  onClick={() => dispatch({ type: 'DEPLOY_MERCENARY_TO_TILE', tileId: t.id })}
                  className="flex items-center justify-between px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm">
                  <span className="font-bold">{def?.label ?? `${t.id}번 땅`} {buildingIcons}</span>
                  <span className="text-gray-400 text-xs">⚔️{t.troops}명</span>
                </button>
              );
            })}
            {ownedTiles.length === 0 && (
              <div className="text-xs text-gray-500 text-center py-4">보유 영토 없음</div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowTileSelect(false)}
              className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">
              뒤로
            </button>
            <button onClick={() => dispatch({ type: 'TAKE_MERCENARY_TO_PIECE' })}
              className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm font-bold">
              ⚔️ 말에 합류
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-5 w-[300px] text-white border-t-2 border-orange-500">
        <div className="text-center mb-4">
          <div className="text-3xl mb-1">⚔️</div>
          <h2 className="text-lg font-bold text-orange-400">용병소</h2>
          {!result && (
            <p className="text-xs text-gray-400 mt-1">
              {MERC_COST}골드 · 랜덤 병력 2~4명 · 1회 계약
            </p>
          )}
        </div>

        {/* After buying — choose where to deploy */}
        {result && (
          <>
            <div className="bg-orange-900/40 border border-orange-700 rounded-lg p-3 mb-4 text-center">
              <div className="text-xs text-orange-300 mb-1">계약 완료!</div>
              <div className="text-xl font-bold">
                {TROOP_DATA[result.troopType].emoji} {TROOP_DATA[result.troopType].name} {result.amount}명
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center mb-3">어디에 배치할까요?</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => dispatch({ type: 'TAKE_MERCENARY_TO_PIECE' })}
                className="w-full py-2.5 bg-blue-700 hover:bg-blue-600 rounded-lg font-bold text-sm">
                ⚔️ 말에 합류
              </button>
              <button
                onClick={() => setShowTileSelect(true)}
                disabled={ownedTiles.length === 0}
                className="w-full py-2.5 bg-green-700 hover:bg-green-600 disabled:opacity-40 rounded-lg font-bold text-sm">
                🏰 영토에 배치
              </button>
            </div>
          </>
        )}

        {/* Before buying */}
        {!result && (
          <>
            <div className="text-xs text-gray-400 text-center mb-3">
              보유 골드: <span className="text-yellow-300 font-bold">{gold}</span>
            </div>
            <div className="flex flex-col gap-2">
              {isPlayerTurn && (
                <button
                  onClick={() => dispatch({ type: 'BUY_MERCENARY' })}
                  disabled={!canBuy}
                  className="w-full py-2.5 bg-orange-700 hover:bg-orange-600 disabled:opacity-40 rounded-lg font-bold text-sm">
                  🎲 용병 계약 ({MERC_COST}골드)
                </button>
              )}
              <button
                onClick={() => dispatch({ type: 'CLOSE_MERCENARY' })}
                className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">
                떠나기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
