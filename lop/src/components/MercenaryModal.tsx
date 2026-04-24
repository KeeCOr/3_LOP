import type { GameState } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';
import { TROOP_DATA, CHARACTERS } from '@/lib/gameData';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }

const MERC_COST = 200;

export default function MercenaryModal({ state, dispatch }: Props) {
  const isPlayerTurn = state.currentTurn === 'player';
  const gold = state.player.gold;
  const activePiece = state.pieces.find(p => p.owner === 'player' && p.troops > 0)
    ?? state.pieces.find(p => p.owner === 'player')!;
  const maxTroops = activePiece ? CHARACTERS[activePiece.characterType].maxTroops : 0;
  const isFull = activePiece ? activePiece.troops >= maxTroops : true;
  const canBuy = isPlayerTurn && gold >= MERC_COST && !isFull;
  const result = state.mercenaryResult;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-5 w-[300px] text-white border-t-2 border-orange-500">
        <div className="text-center mb-4">
          <div className="text-3xl mb-1">⚔️</div>
          <h2 className="text-lg font-bold text-orange-400">용병소</h2>
          <p className="text-xs text-gray-400 mt-1">
            {MERC_COST}골드로 랜덤 병력 3~8명 고용
          </p>
        </div>

        {/* Last result */}
        {result && result.amount > 0 && (
          <div className="bg-orange-900/40 border border-orange-700 rounded-lg p-3 mb-3 text-center">
            <div className="text-sm text-orange-300 font-bold">
              {TROOP_DATA[result.troopType].emoji} {TROOP_DATA[result.troopType].name} {result.amount}명 고용!
            </div>
          </div>
        )}
        {result && result.amount === 0 && (
          <div className="bg-gray-800 rounded-lg p-3 mb-3 text-center text-xs text-gray-500">
            병력 한도 초과 — 고용 불가
          </div>
        )}

        {/* Piece info */}
        {activePiece && (
          <div className="text-xs text-gray-400 text-center mb-3">
            현재 병력: {activePiece.troops} / {maxTroops}명 · 보유 골드: <span className="text-yellow-300">{gold}</span>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {isPlayerTurn && (
            <button
              onClick={() => dispatch({ type: 'BUY_MERCENARY' })}
              disabled={!canBuy}
              className="w-full py-2 bg-orange-700 hover:bg-orange-600 disabled:opacity-40 rounded-lg font-bold text-sm">
              🎲 용병 고용 ({MERC_COST}골드)
            </button>
          )}
          <button
            onClick={() => dispatch({ type: 'CLOSE_MERCENARY' })}
            className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">
            떠나기
          </button>
        </div>
      </div>
    </div>
  );
}
