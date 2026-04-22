'use client';
import { useState, useEffect, useRef } from 'react';

interface Props { result: number | null; onRoll: () => void; }

export default function DiceRoller({ result, onRoll }: Props) {
  const faces = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  const [rolling, setRolling] = useState(false);
  const [display, setDisplay] = useState<number | null>(result);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevResult = useRef<number | null>(result);

  useEffect(() => {
    if (result !== null && result !== prevResult.current) {
      prevResult.current = result;
      setRolling(true);
      let ticks = 0;
      intervalRef.current = setInterval(() => {
        setDisplay(Math.floor(Math.random() * 6) + 1);
        ticks++;
        if (ticks >= 14) {
          clearInterval(intervalRef.current!);
          setDisplay(result);
          setRolling(false);
        }
      }, 60);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [result]);

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-gray-900 rounded-lg">
      <div className={`text-7xl select-none transition-transform ${rolling ? 'animate-bounce' : ''}`}
        style={{ minHeight: '1.2em', textAlign: 'center' }}>
        {display !== null ? faces[display] : '🎲'}
      </div>
      {result !== null && !rolling && (
        <div className="text-yellow-400 font-bold text-lg">{result}칸 이동</div>
      )}
      <button
        onClick={() => { if (!rolling) onRoll(); }}
        disabled={rolling}
        className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold rounded-lg text-lg transition-colors">
        🎲 주사위 굴리기
      </button>
    </div>
  );
}
