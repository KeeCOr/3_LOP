'use client';
import { useState, useEffect, useRef } from 'react';
import type { GameState, Piece, EventCard } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';
import { TILE_DEFINITIONS, TOTAL_TILES } from '@/lib/boardLayout';
import { FACTION_COLORS } from '@/lib/factionColors';
import { getToll, getLapIncome, getLapTroops } from '@/lib/economyUtils';
import { BUILDING_DATA, LAP_LAND_PRODUCTION, TROOP_DATA } from '@/lib/gameData';
import BoardTile from './BoardTile';
import HUD from './HUD';
import DiceRoller from './DiceRoller';
import PieceSelector from './PieceSelector';
import TileActionModal from './TileActionModal';
import BattleModal from './BattleModal';
import DeployModal from './DeployModal';
import BuildModal from './BuildModal';
import ShopModal from './ShopModal';
import EventModal from './EventModal';
import ForcedSellModal from './ForcedSellModal';
import StartDeployModal from './StartDeployModal';
import DefendChanceModal from './DefendChanceModal';
import LapBonusModal from './LapBonusModal';
import PieceInfoModal from './PieceInfoModal';
import MercenaryModal from './MercenaryModal';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }

interface AnimState { pieceId: string; path: number[]; step: number; }
interface GoldAnim { id: number; amount: number; }

function getCurrentPlayerName(state: GameState): string {
  if (state.currentTurn === 'player') return '플레이어';
  if (state.currentTurn === 'ai') return state.ai.name;
  if (state.currentTurn === 'ai2') return state.ai2?.name ?? 'AI 2';
  return state.ai3?.name ?? 'AI 3';
}

function cardEffectLabel(card: EventCard): string {
  const e = card.effect;
  if (e.kind === 'gold') return e.amount > 0 ? `💰+${e.amount}` : `💸${e.amount}`;
  if (e.kind === 'troops') return `🗡️+${e.amount}`;
  if (e.kind === 'attack_boost') return `⚔️×${e.multiplier}`;
  if (e.kind === 'move_to_shop') return `🏪상점`;
  if (e.kind === 'move_to_tile') return `🗺️이동`;
  if (e.kind === 'tax_exempt') return `🛡️면세`;
  if (e.kind === 'toll_exempt') return `🛡️통행`;
  if (e.kind === 'toll_double') return `💸통행×2`;
  if (e.kind === 'build_discount') return `🏗️할인`;
  if (e.kind === 'reset_land') return `🔄초기화`;
  if (e.kind === 'dice_bonus') return `🎲+${e.amount}`;
  if (e.kind === 'troop_boost') return `⚔️+${e.maxAmount}명`;
  if (e.kind === 'defense_reinforce') return `🛡️+${e.amount}`;
  if (e.kind === 'defense_boost') return `🔰×${e.multiplier}`;
  return '?';
}

let _goldAnimId = 0;

export default function Board({ state, dispatch }: Props) {
  const isPlayerTurn = state.currentTurn === 'player';
  const activeTileId = state.activeTileAction ?? state.activeDeployTileId ?? -1;
  const [anim, setAnim] = useState<AnimState | null>(null);
  const prevPiecesRef = useRef<Piece[]>(state.pieces);
  const [goldAnims, setGoldAnims] = useState<GoldAnim[]>([]);
  const prevGoldRef = useRef<number>(state.player.gold);
  const [viewPieceId, setViewPieceId] = useState<string | null>(null);
  const [infoTileId, setInfoTileId] = useState<number | null>(null);
  const [aiNotif, setAiNotif] = useState<string | null>(null);
  const [turnBanner, setTurnBanner] = useState<string | null>(null);
  const prevLogLen = useRef(state.log.length);
  const prevTurn = useRef(state.currentTurn);
  const aiNotifTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const turnBannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isChoosingTile = state.turnPhase === 'choose_move_tile' && isPlayerTurn;
  const fc = FACTION_COLORS[state.currentTurn];

  // Piece movement animation
  useEffect(() => {
    for (const piece of state.pieces) {
      const prev = prevPiecesRef.current.find(p => p.id === piece.id);
      if (prev && prev.position !== piece.position && piece.troops > 0) {
        const steps = (piece.position - prev.position + TOTAL_TILES) % TOTAL_TILES;
        if (steps > 0 && steps <= 12) {
          const path: number[] = [];
          for (let i = 1; i <= steps; i++) path.push((prev.position + i) % TOTAL_TILES);
          setAnim({ pieceId: piece.id, path, step: 0 });
        }
        break;
      }
    }
    prevPiecesRef.current = state.pieces;
  }, [state.pieces]);

  useEffect(() => {
    if (!anim) return;
    if (anim.step >= anim.path.length - 1) {
      const t = setTimeout(() => setAnim(null), 120);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setAnim(prev => prev ? { ...prev, step: prev.step + 1 } : null), 160);
    return () => clearTimeout(t);
  }, [anim]);

  // Gold float animation
  useEffect(() => {
    const diff = state.player.gold - prevGoldRef.current;
    if (diff !== 0) {
      const id = ++_goldAnimId;
      setGoldAnims(prev => [...prev, { id, amount: diff }]);
      setTimeout(() => setGoldAnims(prev => prev.filter(a => a.id !== id)), 1800);
    }
    prevGoldRef.current = state.player.gold;
  }, [state.player.gold]);

  // AI action notification
  useEffect(() => {
    const newLen = state.log.length;
    if (newLen > prevLogLen.current && !isPlayerTurn) {
      const latest = state.log[newLen - 1];
      setAiNotif(latest);
      if (aiNotifTimer.current) clearTimeout(aiNotifTimer.current);
      aiNotifTimer.current = setTimeout(() => setAiNotif(null), 2200);
    }
    prevLogLen.current = newLen;
  }, [state.log, isPlayerTurn]);

  // Turn change banner
  useEffect(() => {
    if (state.currentTurn !== prevTurn.current) {
      prevTurn.current = state.currentTurn;
      const name = getCurrentPlayerName(state);
      setTurnBanner(`${name}의 턴`);
      if (turnBannerTimer.current) clearTimeout(turnBannerTimer.current);
      turnBannerTimer.current = setTimeout(() => setTurnBanner(null), 1800);
    }
  }, [state.currentTurn]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayPieces = anim
    ? state.pieces.map(p => p.id === anim.pieceId ? { ...p, position: anim.path[anim.step] } : p)
    : state.pieces;
  const movingTileId = anim ? anim.path[anim.step] : -1;

  const cardSlotUsable = isPlayerTurn && !['battle', 'start_deploy', 'event_card', 'shop', 'choose_move_tile', 'end_turn'].includes(state.turnPhase);

  const viewPiece = viewPieceId ? state.pieces.find(p => p.id === viewPieceId) : null;

  // Tile info data
  const infoTile = infoTileId !== null ? state.tiles.find(t => t.id === infoTileId) : null;
  const infoTileDef = infoTileId !== null ? TILE_DEFINITIONS.find(d => d.index === infoTileId) : null;

  function handleTileClick(tileIdx: number) {
    if (isChoosingTile) {
      dispatch({ type: 'CHOOSE_MOVE_TILE', tileId: tileIdx });
      return;
    }
    // Toggle info popup for non-active tiles
    if (tileIdx !== activeTileId) {
      setInfoTileId(prev => prev === tileIdx ? null : tileIdx);
    }
  }

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col overflow-hidden"
      onClick={() => setInfoTileId(null)}>
      {/* HUD */}
      <div className="flex-none">
        <HUD state={state} />
      </div>

      {/* Board grid */}
      <div className={`flex-1 min-h-0 px-2 py-1.5 ${isChoosingTile ? 'cursor-crosshair' : ''}`}
        onClick={e => e.stopPropagation()}>
        {isChoosingTile && (
          <div className="text-center text-yellow-300 text-xs font-bold mb-1 animate-pulse">
            🗺️ 이동할 칸을 선택하세요
          </div>
        )}
        <div className="h-full grid gap-1"
          style={{ gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: 'repeat(4, 1fr)' }}>
          {TILE_DEFINITIONS.map(def => {
            const tile = state.tiles.find(t => t.id === def.index)!;
            return (
              <BoardTile key={def.index} tile={tile} pieces={displayPieces}
                isActive={isChoosingTile ? false : def.index === activeTileId}
                isMoving={def.index === movingTileId}
                onClick={() => handleTileClick(def.index)}
                onPieceClick={pid => setViewPieceId(pid)} />
            );
          })}
        </div>
      </div>

      {/* Turn change banner — fixed center overlay */}
      {turnBanner && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-30">
          <div className={`px-8 py-3 rounded-2xl border-2 text-lg font-black text-center shadow-2xl
            ${fc.bg} ${fc.border} ${fc.textBright}`}
            style={{ animation: 'fadeInOut 1.8s ease-out forwards' }}>
            {turnBanner}
          </div>
        </div>
      )}

      {/* AI action notification — fixed center */}
      {aiNotif && !turnBanner && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-25">
          <div className={`px-4 py-2 rounded-xl border text-sm font-bold text-center max-w-[280px] shadow-2xl
            ${fc.bg} ${fc.border} ${fc.text}`}
            style={{ animation: 'fadeInOut 2.2s ease-out forwards' }}>
            {aiNotif}
          </div>
        </div>
      )}

      {/* Tile info popup — fixed bottom-left */}
      {infoTile && infoTileDef && (
        <div className="fixed bottom-20 left-2 bg-gray-900 border border-gray-600 rounded-xl p-3 z-20 min-w-[210px] shadow-2xl"
          onClick={e => e.stopPropagation()}>
          <div className="text-xs font-bold text-yellow-400 mb-2">{infoTileDef.label}</div>
          {infoTile.type === 'land' && (() => {
            const garrisonEntries = (Object.entries(infoTile.garrison) as [import('@/lib/gameTypes').TroopType, number][]).filter(([, n]) => (n ?? 0) > 0);
            const lapTroops = getLapTroops(infoTile);
            const totalLapProd = LAP_LAND_PRODUCTION + lapTroops;
            return (
              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">🏠 통행료</span>
                  <span className="text-yellow-300 font-bold">{getToll(infoTile, false, state.lapCount)}골드</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">🏷️ 구매가</span>
                  <span className="text-white font-bold">{infoTile.landPrice}골드</span>
                </div>
                <div className="border-t border-gray-700 pt-1.5 mt-0.5">
                  <div className="text-gray-400 mb-1">⚔️ 주둔 병력 <span className="text-white font-bold">{infoTile.troops}명</span></div>
                  {garrisonEntries.length > 0 ? (
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 pl-1">
                      {garrisonEntries.map(([t, n]) => (
                        <span key={t} className="text-gray-300">
                          {TROOP_DATA[t].emoji}{TROOP_DATA[t].name} {n}명
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-600 pl-1">없음</div>
                  )}
                </div>
                <div className="border-t border-gray-700 pt-1.5">
                  <div className="text-gray-400 mb-1">🔄 한 바퀴 생산 <span className="text-green-300 font-bold">{totalLapProd}명</span></div>
                  <div className="flex flex-wrap gap-x-2 pl-1">
                    <span className="text-gray-300">{TROOP_DATA.swordsman.emoji}{TROOP_DATA.swordsman.name} {LAP_LAND_PRODUCTION}명</span>
                    {lapTroops > 0 && <span className="text-gray-300">{TROOP_DATA.spearman.emoji}{TROOP_DATA.spearman.name} {lapTroops}명</span>}
                  </div>
                </div>
                {getLapIncome(infoTile) > 0 && (
                  <div className="flex justify-between border-t border-gray-700 pt-1.5">
                    <span className="text-gray-400">💰 한 바퀴 수입</span>
                    <span className="text-yellow-300 font-bold">{getLapIncome(infoTile)}골드</span>
                  </div>
                )}
                {infoTile.building && (
                  <div className="flex justify-between border-t border-gray-700 pt-1.5">
                    <span className="text-gray-400">🏗️ 건물</span>
                    <span className="text-purple-300 font-bold">
                      {BUILDING_DATA[infoTile.building].name[infoTile.buildingLevel - 1]} Lv{infoTile.buildingLevel}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}
          {infoTile.type === 'chance' && (
            <div className="text-xs text-yellow-400">🎲 찬스 카드 칸</div>
          )}
          {infoTile.type === 'mercenary' && (
            <div className="text-xs text-orange-400">⚔️ 용병소 — 200골드로 랜덤 병력 고용</div>
          )}
          {(infoTile.type === 'start_p' || infoTile.type === 'start_e') && (
            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">🏠 통행세</span>
                <span className="text-orange-300 font-bold">{getToll(infoTile, false, state.lapCount)}골드</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">⚔️ 주둔 병력</span>
                <span className="text-white font-bold">{infoTile.troops}명</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">🔄 랩 생산</span>
                <span className="text-green-300 font-bold">{LAP_LAND_PRODUCTION + getLapTroops(infoTile)}명</span>
              </div>
            </div>
          )}
          <button className="mt-2 text-[10px] text-gray-500 hover:text-gray-400"
            onClick={() => setInfoTileId(null)}>✕ 닫기</button>
        </div>
      )}

      {/* Controls bar */}
      <div className="flex-none px-3 py-2 border-t border-gray-800 relative">
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
          {goldAnims.map(a => (
            <div key={a.id}
              className={`absolute text-lg font-bold ${a.amount > 0 ? 'text-yellow-300' : 'text-red-400'}`}
              style={{ animation: 'goldFloat 1.8s ease-out forwards' }}>
              {a.amount > 0 ? `+${a.amount}💰` : `${a.amount}💰`}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap min-h-[2.5rem]">
          <div className={`text-xs font-bold shrink-0 ${fc.text}`}>
            {isPlayerTurn ? '🎮' : '🤖'} {getCurrentPlayerName(state)} 턴{anim ? ' — 이동 중...' : ''}
            {state.bonusRoll && isPlayerTurn && <span className="text-green-300 ml-1">🎁보너스</span>}
          </div>

          {isPlayerTurn && state.turnPhase === 'roll' && (
            <DiceRoller
              result={state.diceResult}
              dice1={state.dice1}
              dice2={state.dice2}
              bonusRoll={state.bonusRoll}
              onRoll={() => dispatch({ type: 'ROLL_DICE' })}
            />
          )}
          {isPlayerTurn && state.turnPhase === 'select_piece' && (
            <PieceSelector state={state} dispatch={dispatch} />
          )}
          {!isPlayerTurn && (state.turnPhase === 'roll' || state.turnPhase === 'select_piece') && (
            <div className="text-sm text-gray-500">AI가 생각 중...</div>
          )}
          {!isPlayerTurn && state.turnPhase === 'deploy' && (
            <div className="text-sm text-gray-500">배치 중...</div>
          )}
        </div>
      </div>

      {/* Log */}
      <div className="flex-none h-10 px-3 pb-1 overflow-hidden">
        {[...state.log].reverse().slice(0, 3).map((l, i) => (
          <div key={i} className="text-[11px] text-gray-500 truncate">{l}</div>
        ))}
      </div>

      {/* Card area — fixed right panel */}
      <div className="fixed right-1 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-10 pointer-events-none" style={{ maxHeight: '70vh' }}>
        {state.player.cardSlot.length > 0 && (
          <>
            <div className="text-[9px] text-gray-500 text-center font-bold">보유 카드</div>
            {state.player.cardSlot.map(card => (
              <button
                key={card.id}
                onClick={() => cardSlotUsable && dispatch({ type: 'USE_EVENT_CARD', cardId: card.id })}
                disabled={!cardSlotUsable}
                title={card.text}
                style={{ pointerEvents: 'auto' }}
                className={`flex flex-col items-center px-2 py-2 rounded-xl border-2 shadow-xl w-[72px] transition-all
                  border-yellow-500 bg-yellow-950/95 text-yellow-300
                  ${cardSlotUsable ? 'hover:scale-105 hover:brightness-125 cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                `}
              >
                <div className="text-base font-black leading-none mb-0.5">{cardEffectLabel(card)}</div>
                <div className="text-[8px] text-yellow-600 text-center leading-tight w-full">
                  {card.text.length > 14 ? card.text.slice(0, 13) + '…' : card.text}
                </div>
              </button>
            ))}
          </>
        )}
        {state.player.cardSlot.length === 0 && (
          <div className="flex flex-col items-center gap-1 opacity-25">
            <div className="text-[9px] text-gray-500 text-center font-bold">보유 카드</div>
            <div className="w-[72px] h-[52px] rounded-xl border-2 border-dashed border-gray-700 flex items-center justify-center text-gray-600 text-xs">없음</div>
          </div>
        )}
      </div>

      {/* Modals */}
      {state.lapBonusAnim && <LapBonusModal state={state} dispatch={dispatch} />}
      {state.turnPhase === 'defend_chance' && state.pendingBattleTileId !== null && (
        <DefendChanceModal state={state} dispatch={dispatch} />
      )}
      {state.turnPhase === 'start_deploy' && <StartDeployModal state={state} dispatch={dispatch} />}
      {!anim && state.turnPhase === 'battle' && state.activeBattle && (
        <BattleModal state={state} dispatch={dispatch} />
      )}
      {!anim && isPlayerTurn && state.turnPhase === 'tile_event' && state.activeTileAction !== null && (
        <TileActionModal state={state} dispatch={dispatch} />
      )}
      {!anim && isPlayerTurn && state.turnPhase === 'deploy' && state.activeDeployTileId !== null && (
        <DeployModal state={state} dispatch={dispatch} />
      )}
      {!anim && isPlayerTurn && state.turnPhase === 'build' && (
        <BuildModal state={state} dispatch={dispatch} />
      )}
      {!anim && (isPlayerTurn || !isPlayerTurn) && state.turnPhase === 'shop' && (
        <ShopModal state={state} dispatch={dispatch} />
      )}
      {!anim && state.turnPhase === 'event_card' && state.activeEvent && (
        <EventModal state={state} dispatch={dispatch} />
      )}
      {isPlayerTurn && state.turnPhase === 'forced_sell' && state.activeTileAction !== null && (
        <ForcedSellModal state={state} dispatch={dispatch} />
      )}
      {viewPiece && (
        <PieceInfoModal state={state} piece={viewPiece} onClose={() => setViewPieceId(null)} />
      )}
      {isPlayerTurn && state.turnPhase === 'mercenary' && (
        <MercenaryModal state={state} dispatch={dispatch} />
      )}

      <style>{`
        @keyframes goldFloat {
          0%   { opacity: 1; transform: translateY(0) scale(1); }
          60%  { opacity: 1; transform: translateY(-28px) scale(1.15); }
          100% { opacity: 0; transform: translateY(-48px) scale(0.9); }
        }
        @keyframes fadeInOut {
          0%   { opacity: 0; transform: scale(0.8); }
          15%  { opacity: 1; transform: scale(1); }
          70%  { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.9); }
        }
      `}</style>
    </div>
  );
}
