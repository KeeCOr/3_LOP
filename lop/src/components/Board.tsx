'use client';
import type { GameState } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';
import { TILE_DEFINITIONS } from '@/lib/boardLayout';
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

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }

export default function Board({ state, dispatch }: Props) {
  const isPlayerTurn = state.currentTurn === 'player';
  const activeTileId = state.activeTileAction ?? state.activeDeployTileId ?? -1;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 flex flex-col gap-4">
      <HUD state={state} />

      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: 'repeat(4, 1fr)' }}>
        {TILE_DEFINITIONS.map(def => {
          const tile = state.tiles.find(t => t.id === def.index)!;
          return (
            <BoardTile key={def.index} tile={tile} pieces={state.pieces}
              isActive={def.index === activeTileId}
              onClick={() => {}} />
          );
        })}
      </div>

      <div className={`text-center font-bold ${isPlayerTurn ? 'text-blue-400' : 'text-red-400'}`}>
        {isPlayerTurn ? '🎮 플레이어 턴' : '🤖 AI 턴'} — {state.turnPhase}
      </div>

      {isPlayerTurn && state.turnPhase === 'roll' && <DiceRoller result={state.diceResult} onRoll={() => dispatch({ type: 'ROLL_DICE' })} />}
      {isPlayerTurn && state.turnPhase === 'select_piece' && <PieceSelector state={state} dispatch={dispatch} />}
      {isPlayerTurn && state.turnPhase === 'tile_event' && state.activeTileAction !== null && <TileActionModal state={state} dispatch={dispatch} />}
      {state.turnPhase === 'battle' && state.activeBattle && <BattleModal state={state} dispatch={dispatch} />}
      {state.turnPhase === 'deploy' && state.activeDeployTileId !== null && <DeployModal state={state} dispatch={dispatch} />}
      {isPlayerTurn && state.turnPhase === 'build' && <BuildModal state={state} dispatch={dispatch} />}
      {isPlayerTurn && state.turnPhase === 'shop' && <ShopModal state={state} dispatch={dispatch} />}
      {state.turnPhase === 'event_card' && state.activeEvent && <EventModal state={state} dispatch={dispatch} />}

      <div className="bg-gray-900 rounded p-3 max-h-32 overflow-y-auto text-xs text-gray-400">
        {[...state.log].reverse().slice(0, 10).map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
}
