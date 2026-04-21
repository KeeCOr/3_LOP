import type { GameState } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';
import { CHARACTERS } from '@/lib/gameData';
import { TILE_DEFINITIONS } from '@/lib/boardLayout';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }
export default function PieceSelector({ state, dispatch }: Props) {
  const pieces = state.pieces.filter(p => p.owner === 'player');
  return (
    <div className="p-4 bg-gray-900 rounded-lg">
      <div className="text-yellow-400 font-bold mb-3">이동할 말 선택 (주사위: {state.diceResult})</div>
      <div className="flex flex-wrap gap-3">
        {pieces.map(p => {
          const tileDef = TILE_DEFINITIONS.find(d => d.index === p.position);
          return (
            <button key={p.id} onClick={() => dispatch({ type: 'SELECT_PIECE', pieceId: p.id })}
              className="px-4 py-2 bg-blue-800 hover:bg-blue-700 rounded-lg text-sm transition-colors">
              <div className="font-bold">{CHARACTERS[p.characterType].name}</div>
              <div className="text-gray-300">⚔️{p.troops}명 | 현재 {tileDef?.label ?? p.position}칸</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
