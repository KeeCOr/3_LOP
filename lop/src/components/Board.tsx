'use client';
import { useState, useEffect, useRef } from 'react';
import type { GameState, Piece } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';
import { TILE_DEFINITIONS, TOTAL_TILES } from '@/lib/boardLayout';
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

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }

interface AnimState { pieceId: string; path: number[]; step: number; }

export default function Board({ state, dispatch }: Props) {
  const isPlayerTurn = state.currentTurn === 'player';
  const activeTileId = state.activeTileAction ?? state.activeDeployTileId ?? -1;
  const [anim, setAnim] = useState<AnimState | null>(null);
  const prevPiecesRef = useRef<Piece[]>(state.pieces);

  // Detect piece movement and start step animation
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

  // Advance animation one step at a time
  useEffect(() => {
    if (!anim) return;
    if (anim.step >= anim.path.length - 1) {
      const t = setTimeout(() => setAnim(null), 120);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setAnim(prev => prev ? { ...prev, step: prev.step + 1 } : null), 160);
    return () => clearTimeout(t);
  }, [anim]);

  // Override piece position during animation
  const displayPieces = anim
    ? state.pieces.map(p => p.id === anim.pieceId ? { ...p, position: anim.path[anim.step] } : p)
    : state.pieces;
  const movingTileId = anim ? anim.path[anim.step] : -1;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 flex flex-col gap-4">
      <HUD state={state} />

      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: 'repeat(4, 1fr)' }}>
        {TILE_DEFINITIONS.map(def => {
          const tile = state.tiles.find(t => t.id === def.index)!;
          return (
            <BoardTile key={def.index} tile={tile} pieces={displayPieces}
              isActive={def.index === activeTileId}
              isMoving={def.index === movingTileId}
              onClick={() => {}} />
          );
        })}
        {!anim && state.turnPhase === 'battle' && state.activeBattle && (
          <div style={{ gridRow: '2 / span 2', gridColumn: '2 / span 3' }}>
            <BattleModal state={state} dispatch={dispatch} />
          </div>
        )}
      </div>

      <div className={`text-center font-bold ${isPlayerTurn ? 'text-blue-400' : 'text-red-400'}`}>
        {isPlayerTurn ? '🎮 플레이어 턴' : '🤖 AI 턴'} — {anim ? '이동 중...' : state.turnPhase}
      </div>

      {isPlayerTurn && state.turnPhase === 'roll' && <DiceRoller result={state.diceResult} onRoll={() => dispatch({ type: 'ROLL_DICE' })} />}
      {isPlayerTurn && state.turnPhase === 'select_piece' && <PieceSelector state={state} dispatch={dispatch} />}
      {!anim && isPlayerTurn && state.turnPhase === 'tile_event' && state.activeTileAction !== null && <TileActionModal state={state} dispatch={dispatch} />}
      {!anim && state.turnPhase === 'deploy' && state.activeDeployTileId !== null && <DeployModal state={state} dispatch={dispatch} />}
      {!anim && isPlayerTurn && state.turnPhase === 'build' && <BuildModal state={state} dispatch={dispatch} />}
      {!anim && isPlayerTurn && state.turnPhase === 'shop' && <ShopModal state={state} dispatch={dispatch} />}
      {!anim && state.turnPhase === 'event_card' && state.activeEvent && <EventModal state={state} dispatch={dispatch} />}
      {state.turnPhase === 'forced_sell' && state.activeTileAction !== null && <ForcedSellModal state={state} dispatch={dispatch} />}

      <div className="bg-gray-900 rounded p-3 max-h-32 overflow-y-auto text-xs text-gray-400">
        {[...state.log].reverse().slice(0, 10).map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
}
