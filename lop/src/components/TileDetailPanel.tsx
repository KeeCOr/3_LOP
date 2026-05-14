import type { BuildingType, GameState, PlayerType, Tile, TroopType } from '@/lib/gameTypes';
import { BUILDING_DATA, TROOP_DATA } from '@/lib/gameData';
import { TILE_DEFINITIONS } from '@/lib/boardLayout';
import { FACTION_COLORS, FACTION_NAMES } from '@/lib/factionColors';
import { getLapIncome, getLapTroops, getToll } from '@/lib/economyUtils';

const BUILDING_ORDER: BuildingType[] = ['vault', 'barracks', 'fort', 'toll_gate'];

function ownerLabel(owner: Tile['owner']): string {
  if (!owner || owner === 'neutral') return '중립';
  if (owner === 'player') return '플레이어';
  return FACTION_NAMES[owner as PlayerType] ?? owner.toUpperCase();
}

function InfoRow({ label, value, tone = 'text-white' }: { label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-gray-500">{label}</span>
      <span className={`text-right font-bold ${tone}`}>{value}</span>
    </div>
  );
}

export default function TileDetailPanel({ state, tile }: { state: GameState; tile: Tile | null }) {
  if (!tile) {
    return (
      <aside className="flex min-h-[160px] flex-col justify-center rounded border border-gray-800 bg-gray-950/85 p-4 text-sm text-gray-400 lg:h-full">
        <div className="text-base font-black text-white">타일 정보</div>
        <p className="mt-2 text-xs leading-relaxed">보드의 타일을 선택하면 소유, 통행료, 병력, 건물 정보를 여기에서 계속 확인할 수 있습니다.</p>
      </aside>
    );
  }

  const def = TILE_DEFINITIONS.find(d => d.index === tile.id);
  const isLandLike = tile.type === 'land' || tile.type === 'start_p' || tile.type === 'start_e';
  const isOwned = tile.owner && tile.owner !== 'neutral';
  const ownerColor = isOwned ? FACTION_COLORS[tile.owner as PlayerType] : null;
  const toll = isLandLike ? getToll(tile, false, state.lapCount) : 0;
  const lapTroops = getLapTroops(tile);
  const lapIncome = getLapIncome(tile);
  const garrison = (Object.entries(tile.garrison) as [TroopType, number][])
    .filter(([, amount]) => amount > 0);
  const buildings = BUILDING_ORDER
    .map(type => [type, tile.buildings?.[type] ?? 0] as [BuildingType, number])
    .filter(([, level]) => level > 0);

  return (
    <aside className="rounded border border-gray-800 bg-gray-950/90 p-3 shadow-2xl lg:h-full lg:overflow-y-auto">
      <div className="flex items-start justify-between gap-2 border-b border-gray-800 pb-2">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500">선택 타일</div>
          <h2 className="truncate text-lg font-black text-white">{def?.label ?? `타일 ${tile.id}`}</h2>
        </div>
        <span className={`rounded px-2 py-1 text-[11px] font-black ${ownerColor ? ownerColor.badge : 'bg-gray-800 text-gray-300'}`}>
          {ownerLabel(tile.owner)}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {isLandLike && (
          <>
            <InfoRow label={isOwned ? '통행료' : '구매가'} value={`${isOwned ? toll : tile.landPrice}G`} tone={isOwned ? 'text-orange-300' : 'text-yellow-300'} />
            <InfoRow label="기본 생산" value={`+${tile.baseLapProduction + lapTroops}명`} tone="text-green-300" />
            {lapIncome > 0 && <InfoRow label="회차 수입" value={`+${lapIncome}G`} tone="text-yellow-300" />}
          </>
        )}
        {!isLandLike && tile.type === 'chance' && <InfoRow label="효과" value="이벤트 카드" tone="text-cyan-300" />}
        {!isLandLike && tile.type === 'mercenary' && <InfoRow label="효과" value="용병 계약" tone="text-orange-300" />}
        <InfoRow label="주둔 병력" value={`${tile.troops}명`} />
      </div>

      <section className="mt-4 border-t border-gray-800 pt-3">
        <h3 className="text-[11px] font-black uppercase tracking-wide text-gray-500">병력 구성</h3>
        {garrison.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {garrison.map(([type, amount]) => (
              <span key={type} className="rounded bg-gray-900 px-2 py-1 text-[11px] font-bold text-gray-200">
                {TROOP_DATA[type].emoji} {TROOP_DATA[type].name} {amount}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-gray-500">주둔 병력이 없습니다.</p>
        )}
      </section>

      <section className="mt-4 border-t border-gray-800 pt-3">
        <h3 className="text-[11px] font-black uppercase tracking-wide text-gray-500">건물</h3>
        {buildings.length > 0 ? (
          <div className="mt-2 space-y-1.5">
            {buildings.map(([type, level]) => (
              <div key={type} className="rounded bg-gray-900 px-2 py-1.5">
                <div className="flex justify-between gap-2 text-xs">
                  <span className="font-bold text-purple-200">{BUILDING_DATA[type].name[level - 1]}</span>
                  <span className="text-gray-400">Lv.{level}</span>
                </div>
                <p className="mt-0.5 text-[11px] text-gray-500">{BUILDING_DATA[type].description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-gray-500">아직 건물이 없습니다.</p>
        )}
      </section>

      <section className="mt-4 rounded border border-gray-800 bg-black/20 p-2">
        <div className="text-[11px] font-black text-yellow-300">추천 확인</div>
        <p className="mt-1 text-xs leading-relaxed text-gray-300">
          {tile.owner === 'player'
            ? '내 영토입니다. 병력 배치와 건설 상태를 확인하세요.'
            : tile.owner && tile.owner !== 'neutral'
              ? '상대 영토입니다. 통행료와 주둔 병력을 먼저 확인하세요.'
              : tile.type === 'land'
                ? '중립 영토입니다. 구매가와 방어 병력을 비교하세요.'
                : '특수 타일입니다. 도착 시 열리는 선택지를 확인하세요.'}
        </p>
      </section>
    </aside>
  );
}
