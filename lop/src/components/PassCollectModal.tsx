'use client';
import { useState } from 'react';
import type { GameState, TroopType } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';
import { TROOP_DATA, CHARACTERS } from '@/lib/gameData';
import { TILE_DEFINITIONS } from '@/lib/boardLayout';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }

export default function PassCollectModal({ state, dispatch }: Props) {
  const queue = state.passCollectQueue!;
  const piece = state.pieces.find(p => p.id === state.selectedPieceId)
    ?? state.pieces.find(p => p.owner === 'player')!;
  const maxTroops = CHARACTERS[piece.characterType].maxTroops;
  const currentTroops = piece.troops;
  const totalAvailable = queue.reduce((sum, q) => sum + q.troops, 0);
  const maxCollect = Math.min(totalAvailable, maxTroops - currentTroops);
  const [collectAmt, setCollectAmt] = useState(maxCollect);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3">
      <div className="bg-gray-900 rounded-xl p-5 w-full max-w-[300px] max-h-[calc(100vh-1.5rem)] overflow-y-auto text-white border-t-2 border-blue-500">
        <h3 className="text-base font-bold text-blue-400 mb-1">🏰 영토 통과</h3>
        <p className="text-xs text-gray-400 mb-3">이동 경로에 주둔 병력이 있는 영토를 지나쳤습니다.</p>
        <div className="flex flex-col gap-1.5 mb-3 max-h-[160px] overflow-y-auto">
          {queue.map(q => {
            const def = TILE_DEFINITIONS.find(d => d.index === q.tileId);
            const garrison = (Object.entries(q.garrison) as [TroopType, number][]).filter(([, n]) => (n ?? 0) > 0);
            return (
              <div key={q.tileId} className="bg-gray-800 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">{def?.label ?? `${q.tileId}번 땅`}</span>
                  <span className="text-green-300 font-bold text-xs">⚔️ {q.troops}명</span>
                </div>
                <div className="flex gap-2 mt-0.5">
                  {garrison.map(([t, n]) => (
                    <span key={t} className="text-[10px] text-gray-400">{TROOP_DATA[t].emoji}{n}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {maxCollect > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>말 {currentTroops}/{maxTroops}명</span>
              <span>징집 가능 최대 {maxCollect}명</span>
            </div>
            <div className="text-center text-xl font-black text-green-300 mb-1">{collectAmt}명 징집</div>
            <input type="range" min={0} max={maxCollect} value={collectAmt}
              onChange={e => setCollectAmt(Number(e.target.value))}
              className="w-full" />
            <div className="text-xs text-gray-500 text-center mt-1">
              징집 후 말: {currentTroops + collectAmt}명
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => dispatch({ type: 'SKIP_PASS_COLLECT' })}
            className="min-w-[120px] flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm whitespace-normal break-words">
            🚶 지나가기
          </button>
          <button
            onClick={() => dispatch({ type: 'CONFIRM_PASS_COLLECT', amount: collectAmt })}
            disabled={maxCollect === 0 || collectAmt === 0}
            className="min-w-[120px] flex-1 py-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 rounded-lg text-sm font-bold whitespace-normal break-words">
            ⚔️ 징집 ({collectAmt}명)
          </button>
        </div>
      </div>
    </div>
  );
}
