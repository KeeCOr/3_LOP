'use client';
import { useState } from 'react';
import type { CharacterType, Difficulty } from '@/lib/gameTypes';
import { CHARACTERS } from '@/lib/gameData';

interface Props { onStart: (char: CharacterType, diff: Difficulty) => void; }

const CHARACTER_TYPES = Object.keys(CHARACTERS) as CharacterType[];

export default function StartScreen({ onStart }: Props) {
  const [diff, setDiff] = useState<Difficulty>('normal');

  function handleStart() {
    const randomChar = CHARACTER_TYPES[Math.floor(Math.random() * CHARACTER_TYPES.length)];
    onStart(randomChar, diff);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-4xl font-bold text-yellow-400">⚔️ Lord of Poly</h1>

      <div>
        <h2 className="text-lg font-semibold text-gray-300 mb-3 text-center">난이도</h2>
        <div className="flex gap-3">
          {(['easy','normal','hard'] as Difficulty[]).map(d => (
            <button key={d} onClick={() => setDiff(d)}
              className={`px-6 py-2 rounded-lg border-2 transition-all ${diff === d ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
              {d === 'easy' ? '쉬움' : d === 'normal' ? '보통' : '어려움'}
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleStart}
        className="mt-4 px-12 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg text-lg transition-colors">
        게임 시작
      </button>
    </div>
  );
}
