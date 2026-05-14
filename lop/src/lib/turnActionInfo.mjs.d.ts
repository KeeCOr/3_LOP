import type { GameState } from './gameTypes';

export interface TurnActionInfo {
  step: string;
  title: string;
  description: string;
  tone: 'ready' | 'waiting' | 'danger';
}

export function getTurnActionInfo(state: Pick<GameState, 'turnPhase'>, isAnimating?: boolean): TurnActionInfo;
