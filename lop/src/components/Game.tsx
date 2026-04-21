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

  function handleStart(char: CharacterType, diff: Difficulty) {
    const initial = createInitialState(char, diff);
    setGameState(initial);
  }

  if (!gameState) return <StartScreen onStart={handleStart} />;
  return <GameWithState key={gameState.player.gold + gameState.difficulty} initialState={gameState} onRestart={() => setGameState(null)} />;
}

function GameWithState({ initialState, onRestart }: { initialState: ReturnType<typeof createInitialState>; onRestart: () => void }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (state.phase !== 'board' || state.currentTurn !== 'ai') return;
    if (state.turnPhase === 'end_turn') { dispatch({ type: 'END_TURN' }); return; }
    aiTimerRef.current = setTimeout(() => dispatch(getAiAction(state)), 800);
    return () => { if (aiTimerRef.current) clearTimeout(aiTimerRef.current); };
  }, [state]);

  if (state.phase === 'gameover') return <GameOver winner={state.winner!} onRestart={onRestart} />;
  return <Board state={state} dispatch={dispatch} />;
}
