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
  const [showCollect, setShowCollect] = useState(false);
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
  const collectibleTiles = state.tiles.filter(t => t.owner === state.currentTurn && t.troops > 0);
  const canShowCollect = isPlayerTurn && collectibleTiles.length > 0 &&
    ['roll', 'select_piece', 'tile_event', 'build', 'deploy'].includes(state.turnPhase);
  const canOpenShop = isPlayerTurn && ['roll', 'select_piece', 'tile_event'].includes(state.turnPhase);

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
        <div className="fixed bottom-20 left-2 bg-gray-900 border border-gray-600 rounded-xl p-3 z-20 min-w-[190px] shadow-2xl"
          onClick={e => e.stopPropagation()}>
          <div className="text-xs font-bold text-yellow-400 mb-1.5">{infoTileDef.label}</div>
          {infoTile.type === 'land' && (
            <div className="flex flex-col gap-1 text-xs text-gray-300">
              <div>🏠 통행료: <span className="text-yellow-300 font-bold">{getToll(infoTile, false, state.lapCount)}골드</span></div>
              <div>⚔️ 주둔 병력: <span className="font-bold">{infoTile.troops}명</span></div>
              <div>🔄 한 바퀴 생산: <span className="text-green-300 font-bold">
                {LAP_LAND_PRODUCTION + getLapTroops(infoTile)}명
              </span></div>
              {getLapIncome(infoTile) > 0 && (
                <div>💰 한 바퀴 수입: <span className="text-yellow-300 font-bold">{getLapIncome(infoTile)}골드</span></div>
              )}
              {infoTile.building && (
                <div>🏗️ 건물: <span className="text-purple-300 font-bold">
                  {BUILDING_DATA[infoTile.building].name[infoTile.buildingLevel - 1]} Lv{infoTile.buildingLevel}
                </span></div>
              )}
            </div>
          )}
          {infoTile.type === 'chance' && (
            <div className="text-xs text-yellow-400">찬스 카드 칸</div>
          )}
          {(infoTile.type === 'start_p' || infoTile.type === 'start_e') && (
            <div className="text-xs text-gray-400">출발 / 기지 칸</div>
          )}
          <button className="mt-1.5 text-[10px] text-gray-500 hover:text-gray-400"
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

          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            {canOpenShop && (
              <button
                onClick={() => dispatch({ type: 'OPEN_SHOP' })}
                className="px-2 py-1 bg-purple-900/60 hover:bg-purple-800/80 border border-purple-700 rounded text-xs text-purple-300 font-bold">
                🏪 상점
              </button>
            )}
            {canShowCollect && !showCollect && (
              <button
                onClick={() => setShowCollect(true)}
                className="px-2 py-1 bg-green-900/60 hover:bg-green-800/80 border border-green-700 rounded text-xs text-green-300 font-bold">
                ⚔️ 징집
              </button>
            )}
          </div>
        </div>

        {/* Collect troops panel */}
        {showCollect && canShowCollect && (
          <div className="mt-1.5 bg-gray-900 border border-green-700 rounded-lg px-3 py-2 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-green-400 font-bold shrink-0">징집할 영토:</span>
            {collectibleTiles.map(t => {
              const def = TILE_DEFINITIONS.find(d => d.index === t.id);
              return (
                <button key={t.id}
                  onClick={() => {
                    dispatch({ type: 'COLLECT_TROOPS', tileId: t.id });
                    setShowCollect(false);
                  }}
                  className="px-2 py-1 bg-green-900/60 hover:bg-green-700/80 border border-green-600 rounded text-xs text-green-200">
                  {def?.label ?? `${t.id}번`} ({t.troops}명)
                </button>
              );
            })}
            <button onClick={() => setShowCollect(false)}
              className="ml-auto text-xs text-gray-500 hover:text-gray-400">취소</button>
          </div>
        )}
      </div>

      {/* Log */}
      <div className="flex-none h-10 px-3 pb-1 overflow-hidden">
        {[...state.log].reverse().slice(0, 3).map((l, i) => (
          <div key={i} className="text-[11px] text-gray-500 truncate">{l}</div>
        ))}
      </div>

      {/* Card slot — fixed horizontal strip at bottom */}
      {state.player.cardSlot.length > 0 && (
        <div className="fixed bottom-1 left-0 right-0 flex flex-row gap-1.5 justify-center items-end z-10 px-2 pointer-events-none">
          {state.player.cardSlot.map(card => (
            <button
              key={card.id}
              onClick={() => cardSlotUsable && dispatch({ type: 'USE_EVENT_CARD', cardId: card.id })}
              disabled={!cardSlotUsable}
              title={card.text}
              style={{ pointerEvents: 'auto' }}
              className={`flex flex-col items-center px-2 py-1.5 rounded-xl border-2 shadow-xl min-w-[68px] max-w-[90px] transition-all
                border-yellow-500 bg-yellow-950/95 text-yellow-300
                ${cardSlotUsable ? 'hover:scale-105 hover:-translate-y-1 hover:brightness-125 cursor-pointer' : 'opacity-40 cursor-not-allowed'}
              `}
            >
              <div className="text-sm font-black leading-none">{cardEffectLabel(card)}</div>
              <div className="text-[9px] text-yellow-500 mt-0.5 text-center leading-tight line-clamp-2 max-w-full">
                {card.text.length > 18 ? card.text.slice(0, 17) + '…' : card.text}
              </div>
            </button>
          ))}
        </div>
      )}

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
