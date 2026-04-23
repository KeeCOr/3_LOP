'use client';
import type { GameState } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';
import { getToll } from '@/lib/economyUtils';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }

export default function ForcedSellModal({ state, dispatch }: Props) {
  const owner = state.currentTurn;
  const opponent = owner === 'player' ? 'ai' : 'player';
  const tileId = state.activeTileAction!;
  const tile = state.tiles.find(t => t.id === tileId)!;
  const tollDouble = state[opponent].tollDoubleLaps > 0;
  const toll = getToll(tile, tollDouble);
  const gold = state[owner].gold;
  const ownedLands = state.tiles.filter(t => t.owner === owner && t.type === 'land');
  const canPay = gold >= toll;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 min-w-[360px] max-w-md text-white">
        <h2 className="text-xl font-bold text-red-400 mb-1">💸 통행세 부족!</h2>
        <p className="text-gray-300 text-sm mb-4">
          필요: <span className="text-red-300 font-bold">{toll}골드</span>
          {' '}/ 보유: <span className={`font-bold ${canPay ? 'text-green-300' : 'text-yellow-300'}`}>{gold}골드</span>
          {!canPay && <span className="text-gray-400"> (부족: {toll - gold}골드)</span>}
        </p>

        <div className="mb-4">
          <div className="text-sm font-bold text-gray-300 mb-2">보유 땅 (60% 가격으로 매각)</div>
          {ownedLands.length === 0 ? (
            <div className="text-gray-500 text-sm">매각 가능한 땅이 없습니다.</div>
          ) : (
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {ownedLands.map(t => {
                const sellPrice = Math.floor(t.landPrice * 0.6);
                return (
                  <div key={t.id} className="flex items-center justify-between bg-gray-800 rounded-lg p-2">
                    <div>
                      <span className="font-bold">{t.id}번 땅</span>
                      <span className="text-xs text-gray-400 ml-2">
                        {t.building ? `건물 Lv${t.buildingLevel}` : '건물 없음'} · 수비 {t.troops}명
                      </span>
                    </div>
                    <button
                      onClick={() => dispatch({ type: 'SELL_LAND', tileId: t.id })}
                      className="px-3 py-1 bg-orange-700 hover:bg-orange-600 rounded text-sm font-bold">
                      +{sellPrice}골드
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button
          onClick={() => dispatch({ type: 'CONFIRM_FORCED_SELL' })}
          disabled={!canPay && ownedLands.length > 0}
          className="w-full py-2 bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-bold">
          {canPay ? `통행세 ${toll}골드 납부` : '납부 불가 (파산 처리)'}
        </button>
        {!canPay && ownedLands.length === 0 && (
          <button
            onClick={() => dispatch({ type: 'CONFIRM_FORCED_SELL' })}
            className="w-full mt-2 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">
            파산 처리
          </button>
        )}
      </div>
    </div>
  );
}
