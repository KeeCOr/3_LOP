'use client';
import { useReducer, useState, useEffect, useRef } from 'react';
import type { CharacterType, Difficulty } from '@/lib/gameTypes';
import { gameReducer, createInitialState } from '@/lib/gameReducer';
import { getAiAction } from '@/lib/aiEngine';
import StartScreen from './StartScreen';
import Board from './Board';
import GameOver from './GameOver';

export default function Game() {
  const [gameState, setGameState] = useState<ReturnType<typeof createInitialState> | null>(null);

  function handleStart(char: CharacterType, diff: Difficulty, playerCount: 2 | 3 | 4) {
    const initial = createInitialState(char, diff, playerCount);
    setGameState(initial);
  }

  if (!gameState) return <StartScreen onStart={handleStart} />;
  return <GameWithState key={gameState.player.gold + gameState.difficulty} initialState={gameState} onRestart={() => setGameState(null)} />;
}

function GameWithState({ initialState, onRestart }: { initialState: ReturnType<typeof createInitialState>; onRestart: () => void }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (state.phase !== 'board') return;
    if (state.turnPhase === 'end_turn') {
      const delay = state.currentTurn === 'player' ? 800 : 200;
      aiTimerRef.current = setTimeout(() => dispatch({ type: 'END_TURN' }), delay);
      return () => { if (aiTimerRef.current) clearTimeout(aiTimerRef.current); };
    }
    if (state.currentTurn === 'player') return;
    if (state.turnPhase === 'battle') {
      aiTimerRef.current = setTimeout(() => dispatch({ type: 'BATTLE_FINISH' }), 800);
      return () => { if (aiTimerRef.current) clearTimeout(aiTimerRef.current); };
    }
    aiTimerRef.current = setTimeout(() => dispatch(getAiAction(state)), 800);
    return () => { if (aiTimerRef.current) clearTimeout(aiTimerRef.current); };
  }, [state]);

  if (state.phase === 'gameover') return <GameOver winner={state.winner!} onRestart={onRestart} />;
  return <Board state={state} dispatch={dispatch} />;
}
