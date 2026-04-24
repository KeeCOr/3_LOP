import type { GameState } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';
import { CHARACTERS } from '@/lib/gameData';
import { TILE_DEFINITIONS } from '@/lib/boardLayout';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }

export default function PieceSelector({ state, dispatch }: Props) {
  const pieces = state.pieces.filter(p => p.owner === 'player');
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-yellow-400 text-xs font-bold shrink-0">
        말 선택 ({state.diceResult}칸 이동):
      </span>
      {pieces.map(p => {
        const tileDef = TILE_DEFINITIONS.find(d => d.index === p.position);
        return (
          <button key={p.id} onClick={() => dispatch({ type: 'SELECT_PIECE', pieceId: p.id })}
            className="px-3 py-1.5 bg-blue-800 hover:bg-blue-700 border border-blue-600 rounded-lg text-xs transition-colors">
            <span className="font-bold">{CHARACTERS[p.characterType].name}</span>
            <span className="text-blue-300 ml-1.5">⚔️{p.troops} · {tileDef?.label ?? `${p.position}칸`}</span>
          </button>
        );
      })}
    </div>
  );
}
