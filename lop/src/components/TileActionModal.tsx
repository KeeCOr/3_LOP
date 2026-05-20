import type { GameState, TroopType, BuildingType } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';
import { getToll, getLapTroops } from '@/lib/economyUtils';
import { TROOP_DATA, LAP_LAND_PRODUCTION } from '@/lib/gameData';
import { FACTION_COLORS } from '@/lib/factionColors';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }

function getBattleOutlook(attacker: number, defender: number) {
  const diff = attacker - defender;
  if (defender <= 0) {
    return { label: '무혈 점령', detail: '수비 병력이 없어 바로 유리합니다.', className: 'border-green-600 bg-green-950/45 text-green-200' };
  }
  if (diff >= 8) {
    return { label: '우세', detail: '병력 차이가 커서 공격 성공 가능성이 높습니다.', className: 'border-green-600 bg-green-950/45 text-green-200' };
  }
  if (diff >= -4) {
    return { label: '접전', detail: '승패가 흔들릴 수 있어 후속 배치를 염두에 두세요.', className: 'border-yellow-600 bg-yellow-950/45 text-yellow-100' };
  }
  return { label: '위험', detail: '수비 병력이 우세합니다. 통행이나 증원을 고려하세요.', className: 'border-red-600 bg-red-950/45 text-red-100' };
}

function getTollRisk(gold: number, toll: number) {
  const balance = gold - toll;
  if (balance < 0) {
    return { label: '부족', detail: `${Math.abs(balance)}골드 부족`, className: 'border-red-600 bg-red-950/45 text-red-100' };
  }
  if (balance <= 300) {
    return { label: '주의', detail: `납부 후 ${balance}골드`, className: 'border-yellow-600 bg-yellow-950/45 text-yellow-100' };
  }
  return { label: '여유', detail: `납부 후 ${balance}골드`, className: 'border-sky-600 bg-sky-950/45 text-sky-100' };
}

export default function TileActionModal({ state, dispatch }: Props) {
  const tileId = state.activeTileAction!;
  const tile = state.tiles.find(t => t.id === tileId)!;
  const piece = state.pieces.find(p => p.id === state.selectedPieceId)!;
  const toll = getToll(tile, false, state.lapCount);
  const landCost = tile.landPrice || tile.troops * 80;
  const isNeutral = tile.owner === 'neutral' || tile.owner === null;
  const isEnemy = !isNeutral && tile.owner !== state.currentTurn;
  const isStartTile = tile.type === 'start_p' || tile.type === 'start_e';

  const garrisonEntries = (Object.entries(tile.garrison) as [TroopType, number][]).filter(([, n]) => (n ?? 0) > 0);
  const ownerFc = !isNeutral && tile.owner && tile.owner !== 'neutral'
    ? FACTION_COLORS[tile.owner]
    : null;
  const lapProd = LAP_LAND_PRODUCTION + getLapTroops(tile);
  const battleOutlook = getBattleOutlook(piece.troops, tile.troops);
  const tollRisk = getTollRisk(state.player.gold, toll);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className={`bg-gray-900 rounded-xl p-5 min-w-[320px] max-w-[420px] text-white border-t-2 shadow-2xl ${ownerFc ? ownerFc.border : 'border-gray-700'}`}>
        <h2 className={`text-lg font-bold mb-3 ${ownerFc ? ownerFc.text : 'text-yellow-400'}`}>
          {isNeutral ? '🌾 중립 영토' : isStartTile ? '🏰 기본 영토' : '⚔️ 적 영토'}
        </h2>

        {/* Tile value info */}
        <div className="bg-gray-800 rounded-lg p-3 mb-3 flex gap-3 text-xs">
          <div className="flex-1 text-center">
            <div className="text-gray-400 mb-0.5">통행세</div>
            <div className="text-orange-300 font-bold">{toll}골드</div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-gray-400 mb-0.5">랩 생산</div>
            <div className="text-green-300 font-bold">{lapProd}명</div>
          </div>
          {!isNeutral && !isStartTile && Object.keys(tile.buildings ?? {}).length > 0 && (
            <div className="flex-1 text-center">
              <div className="text-gray-400 mb-0.5">건물</div>
              <div className="flex gap-1 justify-center flex-wrap">
                {(Object.entries(tile.buildings ?? {}) as [BuildingType, number][])
                  .filter(([, lv]) => lv > 0)
                  .map(([type, lv]) => (
                    <span key={type} className="text-purple-300 font-bold text-xs">
                      {type === 'vault' ? '🏦' : type === 'barracks' ? '🏕️' : type === 'toll_gate' ? '🛂' : '🏰'}Lv{lv}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Garrison composition */}
        {garrisonEntries.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-3 mb-3">
            <div className="text-xs text-gray-400 mb-1.5">수비 병력 <span className="text-white font-bold">{tile.troops}명</span></div>
            <div className="flex flex-wrap gap-2">
              {garrisonEntries.map(([t, n]) => (
                <div key={t} className="flex items-center gap-1">
                  <span className="text-base">{TROOP_DATA[t].emoji}</span>
                  <span className="text-sm font-bold">{n}</span>
                  <span className="text-xs text-gray-400">{TROOP_DATA[t].name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Decision preview */}
        <div className="grid grid-cols-1 gap-2 mb-3">
          <div className={`rounded-lg border px-3 py-2 ${battleOutlook.className}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-gray-300">전투 예상</span>
              <span className="text-sm font-black">{battleOutlook.label}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span>내 병력 <b className="text-white">{piece.troops}명</b></span>
              <span className="text-gray-400">vs</span>
              <span>수비 <b className="text-white">{tile.troops}명</b></span>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-gray-300">{battleOutlook.detail}</p>
          </div>

          {isEnemy && (
            <div className={`rounded-lg border px-3 py-2 ${tollRisk.className}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-gray-300">통행세 위험</span>
                <span className="text-sm font-black">{tollRisk.label}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs">
                <span>통행세 <b className="text-white">{toll}골드</b></span>
                <span>보유 <b className="text-white">{state.player.gold}골드</b></span>
              </div>
              <p className="mt-1 text-[11px] leading-snug text-gray-300">{tollRisk.detail}</p>
            </div>
          )}

          {isNeutral && !isStartTile && (
            <div className={`rounded-lg border px-3 py-2 ${state.player.gold >= landCost ? 'border-yellow-600 bg-yellow-950/35 text-yellow-100' : 'border-red-600 bg-red-950/45 text-red-100'}`}>
              <div className="flex items-center justify-between text-xs">
                <span>구매 비용 <b className="text-white">{landCost}골드</b></span>
                <span>보유 <b className="text-white">{state.player.gold}골드</b></span>
              </div>
              <p className="mt-1 text-[11px] leading-snug text-gray-300">
                구매하면 바로 병력 배치 단계로 이어집니다.
              </p>
            </div>
          )}
        </div>

        <div className="text-gray-300 mb-3 text-sm">
          {isNeutral && !isStartTile && <div>구매 비용: <span className="text-yellow-300 font-bold">{landCost}골드</span> (보유: {state.player.gold}골드)</div>}
          {isEnemy && <div>통행세 납부: <span className="text-orange-300 font-bold">{toll}골드</span></div>}
        </div>

        <div className="flex flex-col gap-2">
          <button onClick={() => dispatch({ type: 'CHOOSE_FIGHT', tileId })}
            disabled={piece.troops === 0}
            className="px-4 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-40 rounded-lg font-bold">
            ⚔️ 전투 시작 · {battleOutlook.label} ({piece.troops}명 vs {tile.troops}명)
          </button>
          {isNeutral && !isStartTile && (
            <button onClick={() => dispatch({ type: 'CHOOSE_BUY_LAND', tileId })}
              disabled={state.player.gold < landCost}
              className="px-4 py-2 bg-yellow-700 hover:bg-yellow-600 disabled:opacity-40 rounded-lg font-bold">
              💰 골드로 구매 ({landCost}골드)
            </button>
          )}
          {isEnemy && (
            <button onClick={() => dispatch({ type: 'CHOOSE_PAY_TOLL', tileId })}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold">
              🚶 통행세 납부 · {tollRisk.label} ({toll}골드)
            </button>
          )}
          {(isNeutral || isStartTile) && (
            <button onClick={() => dispatch({ type: 'CHOOSE_PASS' })}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold">
              🚶 그냥 지나가기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
