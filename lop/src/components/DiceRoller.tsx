'use client';
import { useState, useEffect, useRef } from 'react';

interface Props {
  result: number | null;
  dice1: number | null;
  dice2: number | null;
  bonusRoll?: boolean;
  onRoll: () => void;
}

const FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

function DieFace({ value, rolling, big }: { value: number | null; rolling: boolean; big: boolean }) {
  return (
    <div className={`transition-all duration-150 select-none leading-none text-center
      ${rolling ? 'animate-spin' : ''}
      ${big ? 'text-4xl scale-110 text-yellow-300' : 'text-2xl text-white'}`}
      style={{ minWidth: '2rem' }}>
      {value !== null ? FACES[Math.min(value, 4)] : '🎲'}
    </div>
  );
}

export default function DiceRoller({ result, dice1, dice2, bonusRoll, onRoll }: Props) {
  const [rolling, setRolling] = useState(false);
  const [disp1, setDisp1] = useState<number | null>(dice1);
  const [disp2, setDisp2] = useState<number | null>(dice2);
  const [showBig, setShowBig] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevResult = useRef<number | null>(result);

  useEffect(() => {
    if (result !== null && result !== prevResult.current) {
      prevResult.current = result;
      setRolling(true);
      setShowBig(false);
      let ticks = 0;
      intervalRef.current = setInterval(() => {
        setDisp1(Math.floor(Math.random() * 4) + 1);
        setDisp2(Math.floor(Math.random() * 4) + 1);
        ticks++;
        if (ticks >= 14) {
          clearInterval(intervalRef.current!);
          setDisp1(dice1);
          setDisp2(dice2);
          setRolling(false);
          setShowBig(true);
          setTimeout(() => setShowBig(false), 900);
        }
      }, 55);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [result, dice1, dice2]);

  const isDoubles = dice1 !== null && dice2 !== null && dice1 === dice2;

  return (
    <div className="flex items-center gap-2">
      {/* Two dice */}
      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${isDoubles && !rolling ? 'border-yellow-400 bg-yellow-900/30' : 'border-gray-700 bg-gray-900/30'}`}>
        <DieFace value={disp1} rolling={rolling} big={showBig} />
        <span className="text-gray-600 text-xs">+</span>
        <DieFace value={disp2} rolling={rolling} big={showBig} />
      </div>

      {/* Result + doubles badge */}
      <div className="w-16 text-center">
        {result !== null && !rolling && (
          <div className={`font-bold transition-all duration-200 ${showBig ? 'text-xl text-yellow-300' : 'text-sm text-yellow-400'}`}>
            {result}칸
          </div>
        )}
        {isDoubles && !rolling && (
          <div className="text-[10px] text-yellow-300 font-bold animate-pulse">🎯 더블!</div>
        )}
        {bonusRoll && !rolling && result === null && (
          <div className="text-[10px] text-green-300 font-bold animate-pulse">🎁 보너스!</div>
        )}
      </div>

      {/* Roll button */}
      <button
        onClick={() => { if (!rolling) onRoll(); }}
        disabled={rolling || result !== null}
        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold rounded-lg text-sm transition-colors">
        🎲 굴리기
      </button>
    </div>
  );
}
