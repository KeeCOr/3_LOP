'use client';
import { useState, useEffect, useRef } from 'react';
import type { GameState, Piece } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';
import { TILE_DEFINITIONS, TOTAL_TILES } from '@/lib/boardLayout';
import { FACTION_COLORS } from '@/lib/factionColors';
import { CHARACTERS, TROOP_DATA } from '@/lib/gameData';
import { getToll } from '@/lib/economyUtils';
import { getTurnActionInfo } from '@/lib/turnActionInfo.mjs';
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
import StartDeployModal from './StartDeployModal';
import LapBonusModal from './LapBonusModal';
import PieceInfoModal from './PieceInfoModal';
import MercenaryModal from './MercenaryModal';
import StopAtTileModal from './StopAtTileModal';
import TileDetailPanel from './TileDetailPanel';
import TurnActionBar from './TurnActionBar';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }

interface AnimState { pieceId: string; path: number[]; step: number; }
interface GoldAnim { id: number; amount: number; }

const boardGameFrame = 'rounded-md border border-amber-700/70 bg-gradient-to-br from-[#16351f]/95 via-[#0d2532]/95 to-[#1c2212]/95 p-2 shadow-[inset_0_0_0_1px_rgba(255,240,180,0.12),0_14px_38px_rgba(0,0,0,0.48)]';
const boardCenterPanel = 'relative z-0 m-1 hidden min-h-0 flex-col justify-between rounded-md border border-amber-600/70 bg-[#06141d]/88 p-4 shadow-[inset_0_0_0_1px_rgba(255,244,190,0.14),0_0_26px_rgba(0,0,0,0.35)] backdrop-blur-sm lg:flex';
const boardMapBackground = "url('/generated/lop-board-map-bg.png')";

function getCurrentPlayerName(state: GameState): string {
  if (state.currentTurn === 'player') return '플레이어';
  if (state.currentTurn === 'ai') return state.ai.name;
  if (state.currentTurn === 'ai2') return state.ai2?.name ?? 'AI 2';
  return state.ai3?.name ?? 'AI 3';
}

function CenterTurnSummary({ state, isAnimating }: { state: GameState; isAnimating: boolean }) {
  const info = getTurnActionInfo(state, isAnimating);
  const fc = FACTION_COLORS[state.currentTurn];
  const currentPiece = state.selectedPieceId
    ? state.pieces.find(piece => piece.id === state.selectedPieceId)
    : null;
  const latestLog = state.log.length > 0 ? state.log[state.log.length - 1] : '게임을 시작했습니다.';

  return (
    <section
      style={{ gridRow: '2 / span 2', gridColumn: '2 / span 3' }}
      className={`${boardCenterPanel} ${fc.border}`}>
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className={`rounded-sm border px-2 py-1 text-[11px] font-black ${fc.border} ${fc.bg} ${fc.textBright}`}>
            {info.step}
          </span>
          <span className="text-[11px] font-bold text-amber-300/80">Lap {state.lapCount}</span>
        </div>
        <div className={`text-[11px] font-bold ${fc.text}`}>{getCurrentPlayerName(state)} 턴</div>
        <h3 className="mt-1 text-lg font-black leading-tight text-amber-50 [text-shadow:0_2px_0_rgba(0,0,0,0.6)]">{info.title}</h3>
        <p className="mt-1 line-clamp-2 text-xs leading-snug text-slate-200">{info.description}</p>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-sm border border-amber-900/60 bg-black/35 px-2 py-2">
          <div className="text-[10px] text-amber-500/80">주사위</div>
          <div className="font-black text-yellow-200">{state.diceResult ?? '-'}</div>
        </div>
        <div className="rounded-sm border border-amber-900/60 bg-black/35 px-2 py-2">
          <div className="text-[10px] text-amber-500/80">선택 말</div>
          <div className="truncate font-black text-white">{currentPiece ? `${currentPiece.troops}명` : '-'}</div>
        </div>
        <div className="rounded-sm border border-amber-900/60 bg-black/35 px-2 py-2">
          <div className="text-[10px] text-amber-500/80">보유 골드</div>
          <div className="font-black text-yellow-300">{state.player.gold}G</div>
        </div>
      </div>

      <div className="mt-3 truncate border-t border-amber-900/50 pt-2 text-[11px] text-slate-400">
        {latestLog}
      </div>
    </section>
  );
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
  const [pieceSelectorReady, setPieceSelectorReady] = useState(false);
  const [infoTileId, setInfoTileId] = useState<number | null>(null);
  const [selectedTileId, setSelectedTileId] = useState<number | null>(activeTileId >= 0 ? activeTileId : 0);
  const [aiNotif, setAiNotif] = useState<string | null>(null);
  const [turnBanner, setTurnBanner] = useState<string | null>(null);
const [moveNotif, setMoveNotif] = useState<{ name: string; char: string; dest: string; fc: typeof FACTION_COLORS['player'] } | null>(null);
  const [diceNotif, setDiceNotif] = useState<{ name: string; d1: number; d2: number; total: number; fc: typeof FACTION_COLORS['player'] } | null>(null);
  const prevLogLen = useRef(state.log.length);
  const prevTurn = useRef(state.currentTurn);
  const prevDiceResult = useRef<number | null>(state.diceResult);
  const aiNotifTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const turnBannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moveNotifTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const diceNotifTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isChoosingTile = state.turnPhase === 'choose_move_tile' && isPlayerTurn;
  const isForcedSelling = state.turnPhase === 'forced_sell' && isPlayerTurn;
  const isSelectingPiece = state.turnPhase === 'select_piece' && isPlayerTurn && pieceSelectorReady;

  // Forced sell info
  const forcedSellLandTile = isForcedSelling && state.activeTileAction !== null
    ? state.tiles.find(t => t.id === state.activeTileAction) : null;
  const forcedSellToll = forcedSellLandTile
    ? getToll(forcedSellLandTile, false, state.lapCount) : 0;
  const ownedSellableLands = isForcedSelling
    ? state.tiles.filter(t => t.owner === 'player' && t.type === 'land') : [];
  const canPayToll = state.player.gold >= forcedSellToll;
  const fc = FACTION_COLORS[state.currentTurn];

  // Piece movement animation + move notification
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
        // Movement notification
        const ownerName = piece.owner === 'player' ? '플레이어'
          : piece.owner === 'ai' ? state.ai.name
          : piece.owner === 'ai2' ? (state.ai2?.name ?? 'AI 2')
          : (state.ai3?.name ?? 'AI 3');
        const destDef = TILE_DEFINITIONS.find(d => d.index === piece.position);
        setMoveNotif({
          name: ownerName,
          char: CHARACTERS[piece.characterType].name,
          dest: destDef?.label ?? `${piece.position}번`,
          fc: FACTION_COLORS[piece.owner],
        });
        if (moveNotifTimer.current) clearTimeout(moveNotifTimer.current);
        moveNotifTimer.current = setTimeout(() => setMoveNotif(null), 2000);
        break;
      }
    }
    prevPiecesRef.current = state.pieces;
  }, [state.pieces]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset piece selector gate on new roll
  useEffect(() => {
    if (state.diceResult === null) setPieceSelectorReady(false);
  }, [state.diceResult]);

  // Dice notification for AI players only (player uses DiceRoller component)
  useEffect(() => {
    if (state.diceResult !== null && state.diceResult !== prevDiceResult.current && state.currentTurn !== 'player') {
      prevDiceResult.current = state.diceResult;
      const name = getCurrentPlayerName(state);
      setDiceNotif({
        name,
        d1: state.dice1 ?? 0,
        d2: state.dice2 ?? 0,
        total: state.diceResult,
        fc: FACTION_COLORS[state.currentTurn],
      });
      if (diceNotifTimer.current) clearTimeout(diceNotifTimer.current);
      diceNotifTimer.current = setTimeout(() => setDiceNotif(null), 2000);
    }
    if (state.diceResult === null) prevDiceResult.current = null;
  }, [state.diceResult]); // eslint-disable-line react-hooks/exhaustive-deps

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
      aiNotifTimer.current = setTimeout(() => setAiNotif(null), 2600);
    }
    prevLogLen.current = newLen;
  }, [state.log, isPlayerTurn]);

  // Card hint ??always shows currently usable cards (no auto-dismiss)
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

  // Detect move that is about to animate (useEffect sets anim AFTER render, so check here
  // to prevent modals flashing for one frame before the animation state is set)
  const pieceAboutToAnimate = state.pieces.some(piece => {
    const prev = prevPiecesRef.current.find(p => p.id === piece.id);
    if (!prev || !piece.troops) return false;
    const steps = (piece.position - prev.position + TOTAL_TILES) % TOTAL_TILES;
    return prev.position !== piece.position && steps > 0 && steps <= 12;
  });
  const isAnimating = anim !== null || pieceAboutToAnimate;


  const viewPiece = viewPieceId ? state.pieces.find(p => p.id === viewPieceId) : null;
  const selectedTile = state.tiles.find(t => t.id === (selectedTileId ?? activeTileId)) ?? null;

  useEffect(() => {
    if (activeTileId >= 0) setSelectedTileId(activeTileId);
  }, [activeTileId]);

  function handleTileClick(tileIdx: number) {
    setSelectedTileId(tileIdx);
    if (isChoosingTile) {
      dispatch({ type: 'CHOOSE_MOVE_TILE', tileId: tileIdx });
      return;
    }
    if (isForcedSelling) {
      const tile = state.tiles.find(t => t.id === tileIdx);
      if (tile && tile.owner === 'player' && tile.type === 'land') {
        dispatch({ type: 'SELL_LAND', tileId: tileIdx });
      }
      return;
    }
    // Toggle info popup for non-active tiles
    if (tileIdx !== activeTileId) {
      setInfoTileId(prev => prev === tileIdx ? null : tileIdx);
    }
  }
  return (
    <div className="h-screen bg-[#02070c] text-white flex flex-col overflow-hidden"
      onClick={() => setInfoTileId(null)}>
      {/* HUD */}
      <div className="flex-none">
        <HUD state={state} />
      </div>

      {/* Board + persistent tile panel */}
      <div className={`flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-2 px-2 py-2 bg-cover bg-center ${isChoosingTile || isForcedSelling ? 'cursor-crosshair' : ''}`}
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(2,7,12,0.72), rgba(2,7,12,0.88)), radial-gradient(circle at center, rgba(42,95,76,0.26), rgba(2,7,12,0.82) 72%), ${boardMapBackground}`,
        }}
        onClick={e => e.stopPropagation()}>
        <div className="flex min-h-0 flex-col">
          {(isChoosingTile || isForcedSelling) && (
            <div className={`text-xs font-bold text-center mb-1 animate-pulse ${isChoosingTile ? 'text-yellow-300' : 'text-red-300'}`}>
              {isChoosingTile ? '이동할 타일을 선택하세요' : '매각할 내 영토를 선택하세요 (60% 반환)'}
            </div>
          )}
          {state.dragonPending && !state.dragon && (
            <div className="text-xs font-bold text-center mb-1 text-orange-400 animate-pulse">
              드래곤 각성까지 {Math.max(0, state.dragonPending.summonAtLap - state.lapCount)} Lap
            </div>
          )}
          {state.dragon && state.dragon.troops > 0 && (
            <div className="text-xs font-bold text-center mb-1 text-red-400 animate-pulse">
              드래곤 출현 중 ({state.dragon.troops}명 / {state.dragon.position}번 타일)
            </div>
          )}
          <div className={`grid flex-1 min-h-0 gap-1.5 ${boardGameFrame}`}
            style={{
              gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
              gridTemplateRows: 'repeat(4, minmax(0, 1fr))',
            }}>
            <CenterTurnSummary state={state} isAnimating={isAnimating} />
            {TILE_DEFINITIONS.map(def => {
              const tile = state.tiles.find(t => t.id === def.index)!;
              const hasSelectablePiece = isSelectingPiece && displayPieces.some(piece =>
                piece.owner === 'player' && piece.troops > 0 && piece.position === def.index
              );
              const isActionCandidate =
                hasSelectablePiece ||
                (isChoosingTile && tile.type === 'land') ||
                (isForcedSelling && tile.owner === 'player' && tile.type === 'land');
              return (
                <BoardTile key={def.index} tile={tile} pieces={displayPieces}
                  isActive={isChoosingTile || isForcedSelling ? false : def.index === activeTileId}
                  isMoving={def.index === movingTileId}
                  isSelectable={isForcedSelling && tile.owner === 'player' && tile.type === 'land'}
                  isActionCandidate={isActionCandidate}
                  isDimmed={(isSelectingPiece || isChoosingTile || isForcedSelling) && !isActionCandidate}
                  isInfoOpen={infoTileId === def.index}
                  lapCount={state.lapCount}
                  dragon={state.dragon}
                  onClick={() => handleTileClick(def.index)}
                  onPieceClick={pid => setViewPieceId(pid)} />
              );
            })}
          </div>
        </div>
        <TileDetailPanel state={state} tile={selectedTile} />
      </div>

      <TurnActionBar state={state} isAnimating={isAnimating} />

      {/* Dice notification overlay ??all players */}
      {diceNotif && !turnBanner && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-35">
          <div className={`flex flex-col items-center gap-3 px-8 py-6 rounded-3xl border-2 shadow-2xl
            ${diceNotif.fc.border} bg-gray-950/95`}>
            <div className={`text-sm font-bold ${diceNotif.fc.text}`}>{diceNotif.name} 주사위</div>
            <div className="flex items-center gap-5">
              <span className="text-5xl leading-none">{['0','1','2','3'][Math.min(diceNotif.d1,3)]}</span>
              <span className="text-2xl text-gray-500">+</span>
              <span className="text-5xl leading-none">{['0','1','2','3'][Math.min(diceNotif.d2,3)]}</span>
            </div>
            <div className={`text-3xl font-black ${diceNotif.fc.textBright}`}>{diceNotif.total}칸</div>
            {diceNotif.d1 === diceNotif.d2 && (
              <div className="text-yellow-400 font-bold text-sm animate-pulse">더블! 보너스 턴</div>
            )}
          </div>
        </div>
      )}

      {/* Move notification overlay */}
      {moveNotif && !turnBanner && !diceNotif && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-30">
          <div className={`px-6 py-3 rounded-2xl border text-center shadow-2xl
            ${moveNotif.fc.border} bg-gray-950/90`}>
            <div className={`text-xs ${moveNotif.fc.text} mb-0.5`}>{moveNotif.name}</div>
            <div className={`text-base font-black ${moveNotif.fc.textBright}`}>
              {moveNotif.char} → {moveNotif.dest}
            </div>
          </div>
        </div>
      )}

      {/* Turn change banner ??top-center, doesn't cover board */}
      {turnBanner && (
        <div className="fixed top-0 inset-x-0 pointer-events-none flex justify-center pt-14 z-40">
          <div className={`px-8 py-2.5 rounded-b-2xl border-b-2 border-x-2 text-lg font-black text-center shadow-2xl
            ${fc.bg} ${fc.border} ${fc.textBright}`}
            style={{ animation: 'fadeInOut 1.8s ease-out forwards' }}>
            {turnBanner}
          </div>
        </div>
      )}

      {/* AI action notification ??fixed center, only when no other overlay */}
      {aiNotif && !turnBanner && !diceNotif && !moveNotif && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-25">
          <div className={`px-7 py-4 rounded-2xl border-2 text-center max-w-[320px] shadow-2xl ${fc.bg} ${fc.border}`}
            style={{ animation: 'fadeInOut 2.2s ease-out forwards' }}>
            <div className={`text-[11px] font-bold mb-1 opacity-70 ${fc.text}`}>{getCurrentPlayerName(state)}</div>
            <div className={`text-base font-black ${fc.textBright}`}>{aiNotif}</div>
          </div>
        </div>
      )}

      {/* AI mercenary result overlay */}
      {!isPlayerTurn && state.mercenaryResult && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-35">
          <div className={`px-8 py-5 rounded-2xl border-2 text-center shadow-2xl ${fc.border} bg-gray-950/95`}>
            <div className={`text-xs font-bold mb-2 ${fc.text}`}>{getCurrentPlayerName(state)} 용병 계약!</div>
            <div className="text-4xl mb-1">{TROOP_DATA[state.mercenaryResult.troopType].emoji}</div>
            <div className="text-xl font-black text-white">
              {TROOP_DATA[state.mercenaryResult.troopType].name} {state.mercenaryResult.amount}명
            </div>
            <div className="text-xs text-orange-400 mt-1">말에 합류 중...</div>
          </div>
        </div>
      )}

      {/* Gold float animation */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-20">
        {goldAnims.map(a => (
          <div key={a.id}
            className={`absolute text-lg font-bold ${a.amount > 0 ? 'text-yellow-300' : 'text-red-400'}`}
            style={{ animation: 'goldFloat 1.8s ease-out forwards' }}>
            {a.amount > 0 ? `+${a.amount}G` : `${a.amount}G`}
          </div>
        ))}
      </div>

      {/* Modals */}
      {isPlayerTurn && (
        <DiceRoller result={state.diceResult} dice1={state.dice1} dice2={state.dice2}
          bonusRoll={state.bonusRoll} waiting={state.turnPhase === 'roll'}
          onRoll={() => dispatch({ type: 'ROLL_DICE' })}
          onAnimationComplete={() => setPieceSelectorReady(true)} />
      )}
      {isPlayerTurn && state.turnPhase === 'select_piece' && pieceSelectorReady && (
        <PieceSelector state={state} dispatch={dispatch} />
      )}
      {!isAnimating && state.lapBonusAnim && <LapBonusModal state={state} dispatch={dispatch} />}
      {!isAnimating && !state.lapBonusAnim && state.pendingStopTiles && isPlayerTurn && (
        <StopAtTileModal state={state} dispatch={dispatch} />
      )}
      {state.turnPhase === 'start_deploy' && <StartDeployModal state={state} dispatch={dispatch} />}
      {!isAnimating && !state.lapBonusAnim && !state.pendingStopTiles && state.turnPhase === 'battle' && state.activeBattle && (
        <BattleModal state={state} dispatch={dispatch} />
      )}
      {!isAnimating && !state.lapBonusAnim && !state.pendingStopTiles && isPlayerTurn && state.turnPhase === 'tile_event' && state.activeTileAction !== null && (
        <TileActionModal state={state} dispatch={dispatch} />
      )}
      {!isAnimating && !state.lapBonusAnim && !state.pendingStopTiles && isPlayerTurn && state.turnPhase === 'deploy' && state.activeDeployTileId !== null && (
        <DeployModal state={state} dispatch={dispatch} />
      )}
      {!isAnimating && !state.lapBonusAnim && !state.pendingStopTiles && isPlayerTurn && state.turnPhase === 'build' && (
        <BuildModal state={state} dispatch={dispatch} />
      )}
      {!isAnimating && !state.lapBonusAnim && !state.pendingStopTiles && state.turnPhase === 'shop' && (
        <ShopModal state={state} dispatch={dispatch} />
      )}
      {!isAnimating && !state.lapBonusAnim && !state.pendingStopTiles && state.turnPhase === 'event_card' && state.activeEvent && (
        <EventModal state={state} dispatch={dispatch} />
      )}
      {/* Forced sell ??inline strip instead of modal */}
      {isForcedSelling && !isAnimating && !state.lapBonusAnim && !state.pendingStopTiles && (
        <div className="flex-none px-3 py-2 bg-red-950/80 border-t-2 border-red-700 flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <span className="text-red-300 font-bold text-sm">통행료 부족 </span>
            <span className="text-xs text-gray-300">필요 <b className="text-red-300">{forcedSellToll}G</b> / 보유 <b className="text-yellow-300">{state.player.gold}G</b></span>
            {!canPayToll && <span className="text-xs text-gray-500 ml-1">(부족 {forcedSellToll - state.player.gold}G)</span>}
          </div>
          {canPayToll && (
            <button onClick={() => dispatch({ type: 'CONFIRM_FORCED_SELL' })}
              className="px-3 py-1.5 bg-green-700 hover:bg-green-600 rounded-lg text-sm font-bold shrink-0">
              {forcedSellToll}G 납부
            </button>
          )}
          {!canPayToll && ownedSellableLands.length === 0 && (
            <button onClick={() => dispatch({ type: 'CONFIRM_FORCED_SELL' })}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-bold shrink-0">
              파산 처리
            </button>
          )}
        </div>
      )}
      {viewPiece && (
        <PieceInfoModal state={state} piece={viewPiece} onClose={() => setViewPieceId(null)} />
      )}
      {!isAnimating && !state.lapBonusAnim && isPlayerTurn && state.turnPhase === 'mercenary' && (
        <MercenaryModal state={state} dispatch={dispatch} />
      )}
      {state.tollPayAnim && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
          <div className="bg-red-900/80 border border-red-500 rounded-xl px-4 py-2 text-center">
            <div className="text-red-300 text-sm">통행료</div>
            <div className="text-white font-bold text-xl">{state.tollPayAnim.amount}G</div>
            <div className="text-gray-400 text-xs">→ {state.tollPayAnim.to}</div>
          </div>
        </div>
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
