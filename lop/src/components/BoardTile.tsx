import type { Tile, Piece, TroopType, BuildingType, DragonState } from '@/lib/gameTypes';
import { TILE_DEFINITIONS } from '@/lib/boardLayout';
import { TROOP_DATA, BUILDING_DATA } from '@/lib/gameData';
import { FACTION_COLORS, FACTION_NAMES } from '@/lib/factionColors';
import { getToll, getLapIncome, getLapTroops } from '@/lib/economyUtils';
import type { PlayerType } from '@/lib/gameTypes';
import { CHAR_IMAGE } from '@/lib/charImages';


const BUILDING_LABEL: Record<BuildingType, string> = { vault: '🏦', barracks: '🏕️', fort: '🏰', toll_gate: '🛂' };
const BUILDING_IMG: Partial<Record<BuildingType, string[]>> = {
  vault:    ['./buildings/vault_1.png',    './buildings/vault_2.png',    './buildings/vault_3.png'],
  barracks: ['./buildings/barracks_1.png', './buildings/barracks_2.png', './buildings/barracks_3.png'],
  fort:     ['./buildings/fort_1.png',     './buildings/fort_2.png',     './buildings/fort_3.png'],
};

const CAPTURABLE_TYPES = new Set(['land']);
const HOME_TYPES = new Set(['start_p', 'start_e']);

function ownerBgStyle(owner: Tile['owner']): string {
  if (!owner || owner === 'neutral') return 'bg-gray-950';
  return `${FACTION_COLORS[owner as PlayerType].bgSolid}/20`;
}

function ownerBorderStyle(owner: Tile['owner']): string {
  if (!owner || owner === 'neutral') return owner === 'neutral' ? 'border-gray-600' : 'border-gray-800';
  return FACTION_COLORS[owner as PlayerType].border;
}

function homeStyle(owner: Tile['owner']): string {
  if (!owner || owner === 'neutral') return 'border-gray-400 bg-gray-800/70';
  const fc = FACTION_COLORS[owner as PlayerType];
  return `${fc.border} ${fc.bgSolid}/50`;
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
  isSelectable?: boolean;
  isActionCandidate?: boolean;
  isDimmed?: boolean;
  isInfoOpen?: boolean;
  lapCount?: number;
  dragon?: DragonState | null;
  onClick?: () => void;
  onPieceClick?: (pieceId: string) => void;
}

export default function BoardTile({ tile, pieces, isActive, isMoving, isSelectable, isActionCandidate, isDimmed, isInfoOpen, lapCount = 0, dragon, onClick, onPieceClick }: Props) {
  const def = TILE_DEFINITIONS.find(d => d.index === tile.id)!;
  const piecesHere = pieces.filter(p => p.position === tile.id);
  const isLand = CAPTURABLE_TYPES.has(tile.type);
  const isHome = HOME_TYPES.has(tile.type);
  const currentToll = (isLand || isHome) ? getToll(tile, false, lapCount) : 0;

  const garrisonEntries = (Object.entries(tile.garrison) as [TroopType, number][])
    .filter(([, n]) => (n ?? 0) > 0);

  // Popup position — always point toward board interior (empty center)
  let popupPos: string;
  if (def.gridRow === 2 || def.gridRow === 3) {
    popupPos = def.gridCol === 1
      ? 'left-full top-0 ml-1'   // left column → pop right
      : 'right-full top-0 mr-1'; // right column → pop left
  } else {
    const vert = def.gridRow === 1 ? 'top-full mt-1' : 'bottom-full mb-1';
    const horiz = def.gridCol >= 4 ? 'right-0' : 'left-0';
    popupPos = `${vert} ${horiz}`;
  }

  const isOwnedLand = isLand && tile.owner && tile.owner !== 'neutral' && tile.owner !== null;

  return (
    <div
      onClick={onClick}
      style={{ gridRow: def.gridRow, gridColumn: def.gridCol, zIndex: piecesHere.length > 0 ? 10 : undefined }}
      className={`relative cursor-pointer transition-opacity ${isDimmed ? 'opacity-45' : 'opacity-100'}`}>

      {/* Main tile — Monopoly-style layout */}
      <div className={`h-full flex flex-col rounded-lg overflow-hidden transition-all
        ${isHome
          ? `border-4 ${homeStyle(tile.owner)}`
          : isLand
          ? `border-2 ${ownerBorderStyle(tile.owner)} ${ownerBgStyle(tile.owner)}`
          : 'border-2 border-gray-700 bg-gray-900/60'}
        ${isActive     ? 'ring-2 ring-yellow-400 brightness-125 scale-[1.03]' : ''}
        ${isMoving     ? 'ring-2 ring-white brightness-150 scale-[1.03]' : ''}
        ${isSelectable ? 'ring-2 ring-green-400 brightness-125 animate-pulse' : ''}
        ${isActionCandidate ? 'ring-2 ring-cyan-300 brightness-125 shadow-[0_0_18px_rgba(103,232,249,0.28)]' : ''}
        ${!isActive && !isMoving && !isSelectable && !isActionCandidate ? 'hover:brightness-110' : ''}`}>

        {isActionCandidate && (
          <div className="absolute left-1 top-1 z-20 rounded bg-cyan-400 px-1.5 py-0.5 text-[9px] font-black leading-none text-gray-950 shadow">
            선택
          </div>
        )}

        {/* TOP STRIP — Monopoly owner color band (land only) */}
        {isLand && (
          <div className={`flex-none flex items-center justify-center py-1
            ${isOwnedLand
              ? FACTION_COLORS[tile.owner as PlayerType].badge
              : 'bg-gray-700/60'}`}>
            {isOwnedLand ? (
              <span className="text-[9px] font-black text-white/90 tracking-tight uppercase">
                {FACTION_NAMES[tile.owner as PlayerType]}
              </span>
            ) : (
              <span className="text-[9px] text-gray-400 font-semibold">미점령</span>
            )}
          </div>
        )}

        {/* Home tile header */}
        {isHome && (
          <div className="text-[11px] font-black text-yellow-400 leading-none text-center pt-1">★ 출발</div>
        )}

        {/* CENTER — tile name only (details in popup) */}
        <div className="flex-1 flex flex-col items-center justify-center p-0.5 min-h-0">

          {/* Buildings — images above tile name */}
          {(Object.entries(tile.buildings ?? {}) as [BuildingType, number][])
            .filter(([, lv]) => lv > 0).length > 0 && (
            <div className="flex gap-[2px] justify-center mb-0.5">
              {(Object.entries(tile.buildings ?? {}) as [BuildingType, number][])
                .filter(([, lv]) => lv > 0)
                .map(([type, lv]) => {
                  const imgs = BUILDING_IMG[type];
                  return imgs ? (
                    <img key={type} src={imgs[lv - 1]} alt={type}
                      className="w-6 h-6 object-contain drop-shadow" />
                  ) : (
                    <span key={type} className="text-[12px] leading-none">{BUILDING_LABEL[type]}</span>
                  );
                })}
            </div>
          )}

          <div className={`text-[11px] text-center leading-tight
            ${isHome ? 'font-bold text-white' : isLand ? 'text-gray-200 font-medium' : 'text-gray-400'}`}>
            {def.label}
          </div>

          {/* Troop count + composition */}
          {tile.troops > 0 && (
            <div className="flex flex-col items-center gap-[1px] mt-0.5">
              <div className={`text-[11px] font-bold leading-none ${troopTextStyle(tile.owner)}`}>
                {tile.troops}명
              </div>
              <div className="flex flex-wrap justify-center gap-x-[3px]">
                {(Object.entries(tile.garrison) as [TroopType, number][])
                  .filter(([, n]) => (n ?? 0) > 0)
                  .map(([t, n]) => (
                    <span key={t} className="text-[9px] text-gray-300 leading-none">
                      {TROOP_DATA[t].emoji}{n}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM STRIP — Monopoly style: toll (owned) or purchase price (unowned) */}
        {isLand && (
          <div className="flex-none bg-black/50 flex flex-col items-center justify-center py-1.5">
            {isOwnedLand ? (
              <>
                <span className="text-[8px] text-orange-300/70 leading-none uppercase tracking-wide">통행세</span>
                <span className="text-[11px] text-orange-400 font-black leading-none">{currentToll}g</span>
              </>
            ) : (
              <>
                <span className="text-[8px] text-gray-400/70 leading-none uppercase tracking-wide">구매가</span>
                <span className="text-[11px] text-gray-200 font-black leading-none">{tile.landPrice}g</span>
              </>
            )}
          </div>
        )}

      </div>

      {/* Pieces — outside overflow-hidden, standing at tile bottom */}
      {piecesHere.length > 0 && (
        <div className="absolute bottom-6 right-0.5 flex flex-col-reverse gap-0.5 z-10 pointer-events-none">
          {piecesHere.map(p => (
            <div key={p.id}
              onClick={e => { e.stopPropagation(); onPieceClick?.(p.id); }}
              title={`${p.id}: ${p.troops}명`}
              className={`relative w-14 h-[72px] pointer-events-auto
                ${isMoving ? 'scale-110' : ''}
                ${onPieceClick ? 'cursor-pointer hover:brightness-125' : ''}`}>
              <img src={CHAR_IMAGE[p.characterType]} alt={p.characterType}
                className="w-full h-full object-contain drop-shadow-lg" />
              <div className={`absolute bottom-0 left-0 right-0 rounded-sm py-[1px] ${FACTION_COLORS[p.owner].badge}`}
                style={{ textShadow: '0 0 2px #000' }}>
                <div className="text-[9px] font-black text-center leading-none">{p.troops}명</div>
                <div className="flex flex-wrap justify-center gap-x-[2px] leading-none">
                  {(Object.entries(p.composition) as [TroopType, number][])
                    .filter(([, n]) => (n ?? 0) > 0)
                    .map(([t, n]) => (
                      <span key={t} className="text-[7px]">{TROOP_DATA[t].emoji}{n}</span>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dragon badge */}
      {dragon && dragon.position === tile.id && dragon.troops > 0 && (
        <div className="absolute top-0.5 left-0.5 z-20 flex flex-col items-center bg-red-950/90 border border-red-600 rounded-lg px-1 py-0.5 pointer-events-none">
          <span className="text-[14px] leading-none">🐉</span>
          <span className="text-[8px] font-black text-red-300 leading-none">{dragon.troops}명</span>
        </div>
      )}

      {/* Info popup — positioned outside overflow-hidden parent */}
      {isInfoOpen && (
        <div className={`absolute ${popupPos} z-50 w-[175px] bg-gray-950 border border-gray-600 rounded-xl p-2.5 shadow-2xl text-white pointer-events-none`}>
          <div className="text-xs font-bold text-yellow-400 mb-1.5">{def.label}</div>

          {(isLand || isHome) && (() => {
            const lapTroopsVal = getLapTroops(tile);
            const lapIncomeVal = getLapIncome(tile);
            const totalLapProd = tile.baseLapProduction + lapTroopsVal;
            const buildingEntries = (Object.entries(tile.buildings ?? {}) as [BuildingType, number][]).filter(([, lv]) => lv > 0);
            return (
              <div className="flex flex-col gap-1 text-xs">
                {/* Toll */}
                <div className="flex justify-between">
                  <span className="text-gray-400">🏷️ 통행세</span>
                  <span className="text-orange-300 font-bold">{currentToll}골드</span>
                </div>
                {/* Buy price (neutral only) */}
                {(tile.owner === 'neutral' || tile.owner === null) && tile.landPrice > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">💰 구매가</span>
                    <span className="text-white font-bold">{tile.landPrice}골드</span>
                  </div>
                )}
                {/* Owner */}
                {tile.owner && tile.owner !== 'neutral' && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">👑 소유</span>
                    <span className={`font-bold ${FACTION_COLORS[tile.owner as PlayerType].text}`}>
                      {tile.owner === 'player' ? '플레이어' : tile.owner.toUpperCase()}
                    </span>
                  </div>
                )}
                {/* Troops */}
                <div className="flex justify-between">
                  <span className="text-gray-400">⚔️ 주둔</span>
                  <span className="text-white font-bold">{tile.troops}명</span>
                </div>
                {/* Garrison composition */}
                {garrisonEntries.length > 0 && (
                  <div className="flex flex-wrap gap-x-1.5 pl-1">
                    {garrisonEntries.map(([t, n]) => (
                      <span key={t} className="text-gray-300 text-[10px]">
                        {TROOP_DATA[t].emoji}{TROOP_DATA[t].name} {n}
                      </span>
                    ))}
                  </div>
                )}
                {/* Buildings */}
                {buildingEntries.length > 0 && (
                  <div className="border-t border-gray-700 pt-1 mt-0.5">
                    <div className="text-gray-400 mb-0.5">🏗️ 건물</div>
                    <div className="flex flex-wrap gap-x-2">
                      {buildingEntries.map(([type, lv]) => (
                        <span key={type} className="text-purple-300 font-bold text-[10px]">
                          {BUILDING_LABEL[type]} {BUILDING_DATA[type].name[lv - 1]} Lv{lv}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {/* Lap production */}
                {tile.troops > 0 && (
                  <div className="border-t border-gray-700 pt-1 mt-0.5">
                    <div className="flex justify-between">
                      <span className="text-gray-400">🔄 랩 생산</span>
                      <span className="text-green-300 font-bold">+{totalLapProd}명</span>
                    </div>
                  </div>
                )}
                {/* Lap income */}
                {lapIncomeVal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">💰 랩 수입</span>
                    <span className="text-yellow-300 font-bold">+{lapIncomeVal}골드</span>
                  </div>
                )}
              </div>
            );
          })()}

          {tile.type === 'chance' && (
            <div className="text-xs text-yellow-400">🎲 랜덤 카드 드로우</div>
          )}
          {tile.type === 'mercenary' && (
            <div className="text-xs text-orange-400">⚔️ 용병소<br/>400골드 · 랜덤 2~8명</div>
          )}
        </div>
      )}
    </div>
  );
}
