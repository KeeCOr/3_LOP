import type { Tile, Piece } from '@/lib/gameTypes';
import { TILE_DEFINITIONS } from '@/lib/boardLayout';

const TILE_ICONS: Record<string, string> = {
  start_p: '🏠', start_e: '🏯', land: '🌾', shop: '🛒', tax: '💰', chance: '🎲', community: '📜'
};
const OWNER_COLORS: Record<string, string> = {
  player: 'border-blue-500 bg-blue-950', ai: 'border-red-500 bg-red-950',
  neutral: 'border-gray-600 bg-gray-900', null: 'border-gray-700 bg-gray-900'
};

interface Props {
  tile: Tile;
  pieces: Piece[];
  isActive: boolean;
  isMoving?: boolean;
  onClick?: () => void;
}

export default function BoardTile({ tile, pieces, isActive, isMoving, onClick }: Props) {
  const def = TILE_DEFINITIONS.find(d => d.index === tile.id)!;
  const piecesHere = pieces.filter(p => p.position === tile.id);
  const ownerColor = OWNER_COLORS[tile.owner ?? 'null'];

  return (
    <div onClick={onClick}
      style={{ gridRow: def.gridRow, gridColumn: def.gridCol }}
      className={`relative flex flex-col items-center justify-center p-1 rounded-lg border-2 min-h-[80px] min-w-[80px] cursor-pointer transition-all
        ${ownerColor}
        ${isActive ? 'ring-2 ring-yellow-400 scale-105' : ''}
        ${isMoving ? 'ring-2 ring-white scale-105 brightness-150' : ''}
        ${!isActive && !isMoving ? 'hover:brightness-110' : ''}`}>
      <div className="text-xl">{TILE_ICONS[tile.type]}</div>
      <div className="text-xs text-gray-300 text-center leading-tight">{def.label}</div>
      {tile.troops > 0 && (
        <div className={`text-xs font-bold mt-1 ${tile.owner === 'player' ? 'text-blue-300' : tile.owner === 'ai' ? 'text-red-300' : 'text-gray-400'}`}>
          ⚔️{tile.troops}
        </div>
      )}
      {tile.building && (
        <div className="text-xs text-yellow-400">
          {tile.building === 'vault' ? '🏦' : tile.building === 'barracks' ? '🏕️' : '🏰'}Lv{tile.buildingLevel}
        </div>
      )}
      <div className="flex gap-1 flex-wrap justify-center mt-1">
        {piecesHere.map(p => (
          <div key={p.id} className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold transition-transform
            ${p.owner === 'player' ? 'bg-blue-500' : 'bg-red-500'}
            ${isMoving ? 'scale-125' : ''}`}>
            {p.troops}
          </div>
        ))}
      </div>
    </div>
  );
}
