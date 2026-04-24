import type { Tile, Piece, TroopType, CharacterType } from '@/lib/gameTypes';
import { TILE_DEFINITIONS } from '@/lib/boardLayout';
import { TROOP_DATA } from '@/lib/gameData';
import { FACTION_COLORS } from '@/lib/factionColors';
import type { PlayerType } from '@/lib/gameTypes';

const CHAR_INITIAL: Record<CharacterType, string> = {
  general: '장', knight: '기', merchant: '상', scout: '척',
};

const TILE_ICONS: Record<string, string> = {
  start_p: '🏠', start_e: '🏯', land: '🌾', chance: '🎲', mercenary: '⚔️',
};

const CAPTURABLE_TYPES = new Set(['land']);

const NEUTRAL_BG = 'border-gray-600 bg-gray-900';
const NULL_BG    = 'border-gray-800 bg-gray-950';

function ownerStyle(owner: Tile['owner']): string {
  if (!owner || owner === 'neutral') return owner === 'neutral' ? NEUTRAL_BG : NULL_BG;
  return `${FACTION_COLORS[owner as PlayerType].border} ${FACTION_COLORS[owner as PlayerType].bgSolid}/30`;
}

function pieceStyle(owner: PlayerType): string {
  return FACTION_COLORS[owner].badge;
}

function troopTextStyle(owner: Tile['owner']): string {
  if (!owner || owner === 'neutral') return 'text-gray-400';
  return FACTION_COLORS[owner as PlayerType].text;
}

interface Props {
  tile: Tile;
  pieces: Piece[];
  isActive: boolean;
  isMoving?: boolean;
  onClick?: () => void;
  onPieceClick?: (pieceId: string) => void;
}

export default function BoardTile({ tile, pieces, isActive, isMoving, onClick, onPieceClick }: Props) {
  const def = TILE_DEFINITIONS.find(d => d.index === tile.id)!;
  const piecesHere = pieces.filter(p => p.position === tile.id);
  const isLand = CAPTURABLE_TYPES.has(tile.type);

  const garrisonEntries = (Object.entries(tile.garrison) as [TroopType, number][])
    .filter(([, n]) => (n ?? 0) > 0);

  return (
    <div onClick={onClick}
      style={{ gridRow: def.gridRow, gridColumn: def.gridCol }}
      className={`relative flex flex-col items-center justify-center p-1 rounded-lg border-2 overflow-hidden cursor-pointer transition-all
        ${isLand ? ownerStyle(tile.owner) : 'border-gray-700 bg-gray-900/60'}
        ${isActive  ? 'ring-2 ring-yellow-400 brightness-125 scale-[1.03]' : ''}
        ${isMoving  ? 'ring-2 ring-white brightness-150 scale-[1.03]' : ''}
        ${!isActive && !isMoving ? 'hover:brightness-110' : ''}`}>

      {/* Non-capturable overlay indicator */}
      {!isLand && (
        <div className="absolute top-0.5 right-0.5 text-[8px] text-gray-600 leading-none">🔒</div>
      )}

      {/* Tile type icon + label */}
      <div className="text-lg leading-none">{TILE_ICONS[tile.type] ?? '❓'}</div>
      <div className={`text-[10px] text-center leading-tight ${isLand ? 'text-gray-400' : 'text-gray-500'}`}>
        {def.label}
      </div>

      {/* Toll display for land tiles */}
      {isLand && tile.baseToll > 0 && (
        <div className="text-[9px] text-orange-400/80 leading-none">🏷️{tile.baseToll}g</div>
      )}

      {/* Troop count */}
      {tile.troops > 0 && (
        <div className={`text-[10px] font-bold ${troopTextStyle(tile.owner)}`}>
          ⚔️{tile.troops}
        </div>
      )}

      {/* Garrison composition (compact) */}
      {garrisonEntries.length > 0 && (
        <div className="flex gap-0.5 flex-wrap justify-center">
          {garrisonEntries.map(([t, n]) => (
            <span key={t} className="text-[9px] text-gray-500">
              {TROOP_DATA[t].emoji}{n}
            </span>
          ))}
        </div>
      )}

      {/* Building — visually separated */}
      {tile.building && (
        <div className="flex items-center gap-0.5 mt-0.5 px-1 py-0.5 bg-yellow-900/40 rounded border border-yellow-700/50">
          <span className="text-[11px]">
            {tile.building === 'vault' ? '🏦' : tile.building === 'barracks' ? '🏕️' : '🏰'}
          </span>
          <span className="text-[9px] text-yellow-400 font-bold">Lv{tile.buildingLevel}</span>
        </div>
      )}

      {/* Pieces */}
      {piecesHere.length > 0 && (
        <div className="flex gap-0.5 flex-wrap justify-center mt-0.5">
          {piecesHere.map(p => (
            <div key={p.id}
              onClick={e => { e.stopPropagation(); onPieceClick?.(p.id); }}
              title={`${p.id}: ${p.troops}명`}
              className={`w-9 h-9 rounded-full flex flex-col items-center justify-center font-bold leading-none
                ${pieceStyle(p.owner)}
                ${isMoving ? 'scale-110' : ''}
                ${onPieceClick ? 'cursor-pointer hover:brightness-125' : ''}`}>
              <span className="text-[11px] font-black">{CHAR_INITIAL[p.characterType]}</span>
              <span className="text-[10px]">{p.troops}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
