import type { PlayerType } from './gameTypes';

export interface FactionColor {
  border: string;
  bg: string;
  bgSolid: string;
  text: string;
  textBright: string;
  ring: string;
  badge: string;
}

export const FACTION_COLORS: Record<PlayerType, FactionColor> = {
  player: {
    border:    'border-blue-500',
    bg:        'bg-blue-900/40',
    bgSolid:   'bg-blue-900',
    text:      'text-blue-300',
    textBright:'text-blue-200',
    ring:      'ring-blue-500',
    badge:     'bg-blue-600',
  },
  ai: {
    border:    'border-red-500',
    bg:        'bg-red-900/40',
    bgSolid:   'bg-red-900',
    text:      'text-red-300',
    textBright:'text-red-200',
    ring:      'ring-red-500',
    badge:     'bg-red-600',
  },
  ai2: {
    border:    'border-emerald-500',
    bg:        'bg-emerald-900/40',
    bgSolid:   'bg-emerald-900',
    text:      'text-emerald-300',
    textBright:'text-emerald-200',
    ring:      'ring-emerald-500',
    badge:     'bg-emerald-600',
  },
  ai3: {
    border:    'border-purple-500',
    bg:        'bg-purple-900/40',
    bgSolid:   'bg-purple-900',
    text:      'text-purple-300',
    textBright:'text-purple-200',
    ring:      'ring-purple-500',
    badge:     'bg-purple-600',
  },
};

export const FACTION_NAMES: Record<PlayerType, string> = {
  player: '플레이어',
  ai:     'AI 1',
  ai2:    'AI 2',
  ai3:    'AI 3',
};
