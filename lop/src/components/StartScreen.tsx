'use client';
import { useState } from 'react';
import type { CharacterType, Difficulty } from '@/lib/gameTypes';
import { CHARACTERS } from '@/lib/gameData';

const VERSION = '0.2.0';

interface Props { onStart: (char: CharacterType, diff: Difficulty, playerCount: 2 | 3 | 4) => void; }

const CHARACTER_TYPES = Object.keys(CHARACTERS) as CharacterType[];

const CHAR_EMOJI: Record<CharacterType, string> = {
  general:  '⚔️',
  knight:   '🐴',
  merchant: '💰',
  scout:    '🦅',
};

// Delays for each spin step (ms). 11 steps so we naturally land on finalIdx.
const SPIN_DELAYS = [65, 70, 85, 105, 135, 175, 215, 265, 320, 390, 440];
const N = CHARACTER_TYPES.length; // 4

export default function StartScreen({ onStart }: Props) {
  const [screen, setScreen] = useState<'objectives' | 'setup' | 'selecting'>('objectives');
  const [diff, setDiff] = useState<Difficulty>('normal');
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(2);
  const [spinIdx, setSpinIdx] = useState(0);
  const [finalChar, setFinalChar] = useState<CharacterType | null>(null);
  const [revealed, setRevealed] = useState(false);

  function handleStart() {
    const randomChar = CHARACTER_TYPES[Math.floor(Math.random() * CHARACTER_TYPES.length)];
    const finalIdx = CHARACTER_TYPES.indexOf(randomChar);
    // startIdx chosen so the sequence naturally ends on finalIdx
    // (startIdx + SPIN_DELAYS.length) % N === finalIdx
    const startIdx = (finalIdx - SPIN_DELAYS.length % N + N * 100) % N;

    setFinalChar(randomChar);
    setRevealed(false);
    setSpinIdx(startIdx);
    setScreen('selecting');

    let cumDelay = 0;
    for (let i = 0; i < SPIN_DELAYS.length; i++) {
      cumDelay += SPIN_DELAYS[i];
      const nextIdx = (startIdx + i + 1) % N;
      const d = cumDelay;
      setTimeout(() => setSpinIdx(nextIdx), d);
    }
    setTimeout(() => setRevealed(true), cumDelay + 180);
    setTimeout(() => onStart(randomChar, diff, playerCount), cumDelay + 1700);
  }

  /* ── 캐릭터 선택 연출 ── */
  if (screen === 'selecting') {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-7 p-8">
        <h1 className="text-3xl font-bold text-yellow-400">⚔️ Lord of Poly</h1>
        <div className="text-xs text-gray-600">v{VERSION}</div>

        <p className={`text-base font-bold transition-colors duration-300 ${revealed ? 'text-yellow-300' : 'text-gray-400'}`}>
          {revealed ? '✨ 캐릭터 선택 완료!' : '🎲 캐릭터를 선택하는 중...'}
        </p>

        <div className="grid grid-cols-2 gap-3">
          {CHARACTER_TYPES.map((c, i) => {
            const cd = CHARACTERS[c];
            const isActive = !revealed && spinIdx === i;
            const isFinal = revealed && finalChar === c;

            return (
              <div key={c}
                className={`w-38 rounded-xl border-2 p-4 text-center select-none
                  transition-all duration-150
                  ${isFinal
                    ? 'border-yellow-400 bg-yellow-900/30 scale-110 shadow-lg shadow-yellow-500/30'
                    : isActive
                      ? 'border-blue-400 bg-blue-900/30 scale-105'
                      : revealed
                        ? 'border-gray-800 bg-gray-900/30 opacity-25 scale-95'
                        : 'border-gray-700 bg-gray-900 opacity-45'
                  }`}
                style={{ width: '9rem' }}>
                <div className={`text-4xl mb-1 transition-all duration-150 ${isActive || isFinal ? '' : 'grayscale'}`}>
                  {CHAR_EMOJI[c]}
                </div>
                <div className={`font-bold text-sm ${isFinal ? 'text-yellow-300' : isActive ? 'text-blue-300' : 'text-gray-500'}`}>
                  {cd.name}
                </div>
                <div className={`text-xs mt-0.5 ${isFinal ? 'text-purple-300' : 'text-gray-600'}`}>
                  {cd.skill.name}
                </div>
              </div>
            );
          })}
        </div>

        {revealed && finalChar && (
          <div className="bg-gray-800 border border-yellow-500/40 rounded-xl px-7 py-4 text-center">
            <div className="text-xl font-bold text-yellow-400 mb-1">
              {CHAR_EMOJI[finalChar]} {CHARACTERS[finalChar].name}
            </div>
            <div className="text-sm text-purple-300">
              ✦ {CHARACTERS[finalChar].skill.name}: {CHARACTERS[finalChar].skill.desc}
            </div>
            <div className="text-xs text-gray-500 mt-2 animate-pulse">잠시 후 게임이 시작됩니다...</div>
          </div>
        )}
      </div>
    );
  }

  /* ── 설정 화면 ── */
  if (screen === 'setup') {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-6 p-8">
        <div>
          <h1 className="text-4xl font-bold text-yellow-400 text-center">⚔️ Lord of Poly</h1>
          <div className="text-xs text-gray-600 text-center mt-0.5">v{VERSION}</div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 w-full max-w-sm border border-gray-700 space-y-5">
          <div>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">인원 수</h2>
            <div className="grid grid-cols-3 gap-2">
              {([2, 3, 4] as const).map(n => (
                <button key={n} onClick={() => setPlayerCount(n)}
                  className={`py-2 rounded-lg border-2 font-bold transition-all ${playerCount === n ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                  {n}명
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-1.5 text-center">
              플레이어 1명 + AI {playerCount - 1}명
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">난이도</h2>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'normal', 'hard'] as Difficulty[]).map(d => (
                <button key={d} onClick={() => setDiff(d)}
                  className={`py-2 rounded-lg border-2 font-bold transition-all ${diff === d ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                  {d === 'easy' ? '쉬움' : d === 'normal' ? '보통' : '어려움'}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-gray-500 text-center border-t border-gray-700 pt-3">
            캐릭터는 게임 시작 시 랜덤으로 결정됩니다
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setScreen('objectives')}
            className="px-6 py-2 border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 rounded-lg text-sm transition-colors">
            ← 목표 보기
          </button>
          <button onClick={handleStart}
            className="px-12 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg text-lg transition-colors">
            게임 시작
          </button>
        </div>
      </div>
    );
  }

  /* ── 목표 화면 ── */
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-6 p-8">
      <div>
        <h1 className="text-4xl font-bold text-yellow-400 text-center">⚔️ Lord of Poly</h1>
        <div className="text-xs text-gray-600 text-center mt-0.5">v{VERSION}</div>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-gray-700">
        <h2 className="text-lg font-bold text-yellow-300 mb-4 text-center">🏆 게임 목표</h2>
        <div className="space-y-3 text-sm text-gray-300">
          <div className="flex gap-3">
            <span className="text-2xl flex-none">🌍</span>
            <div>
              <div className="font-bold text-white">영토 정복</div>
              <div>땅을 사거나 전투로 빼앗아 영토를 넓히세요. 건물을 지어 수비와 수입을 높이세요.</div>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-2xl flex-none">💰</span>
            <div>
              <div className="font-bold text-white">경제 지배</div>
              <div>상대가 통행세를 낼 때 골드를 벌고, 한 바퀴 돌면 영토에서 수입과 병력이 보충됩니다.</div>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-2xl flex-none">⚔️</span>
            <div>
              <div className="font-bold text-white">군사 전략</div>
              <div>병사마다 상성이 있습니다. 검사↔창병↔기마병의 상성을 활용해 전투를 유리하게 이끄세요.</div>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-2xl flex-none">💀</span>
            <div>
              <div className="font-bold text-white">승리 조건</div>
              <div>상대의 골드를 0으로 만들거나, 영토를 모두 빼앗아 항복하게 하면 승리!</div>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-gray-700">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">병사 상성</div>
          <div className="grid grid-cols-2 gap-1.5 text-xs text-gray-400">
            <div>⚔️ 검사 → 창병에 강함</div>
            <div>🏹 궁수 → 검사·창병에 강함</div>
            <div>🐴 기마병 → 검사·궁수에 강함</div>
            <div>🔱 창병 → 기마병에 강함</div>
          </div>
        </div>
      </div>

      <button onClick={() => setScreen('setup')}
        className="px-12 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg text-lg transition-colors">
        게임 설정 →
      </button>
    </div>
  );
}
