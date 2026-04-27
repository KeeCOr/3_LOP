'use client';
import { useState, useEffect, useRef } from 'react';

interface Props {
  result: number | null;
  dice1: number | null;
  dice2: number | null;
  bonusRoll?: boolean;
  waiting: boolean;
  onRoll: () => void;
  onAnimationComplete?: () => void;
}

const FACES = ['', '⚀', '⚁', '⚂', '⚃'];

function DieFace({ value, rolling }: { value: number | null; rolling: boolean }) {
  return (
    <div className={`text-7xl leading-none select-none transition-transform duration-100
      ${rolling ? 'scale-110' : 'scale-100'}`}>
      {value !== null ? FACES[Math.min(value, 4)] : '🎲'}
    </div>
  );
}

export default function DiceRoller({ result, dice1, dice2, bonusRoll, waiting, onRoll, onAnimationComplete }: Props) {
  const [rolling, setRolling] = useState(false);
  const [disp1, setDisp1] = useState<number | null>(dice1);
  const [disp2, setDisp2] = useState<number | null>(dice2);
  const [showOverlay, setShowOverlay] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevResult = useRef<number | null>(result);

  useEffect(() => {
    if (result !== null && result !== prevResult.current) {
      prevResult.current = result;
      setRolling(true);
      setShowOverlay(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      let ticks = 0;
      intervalRef.current = setInterval(() => {
        setDisp1(Math.floor(Math.random() * 4) + 1);
        setDisp2(Math.floor(Math.random() * 4) + 1);
        ticks++;
        if (ticks >= 16) {
          clearInterval(intervalRef.current!);
          setDisp1(dice1);
          setDisp2(dice2);
          setRolling(false);
          hideTimer.current = setTimeout(() => { setShowOverlay(false); onAnimationComplete?.(); }, 1400);
        }
      }, 55);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [result, dice1, dice2]);

  const isDoubles = dice1 !== null && dice2 !== null && dice1 === dice2;

  return (
    <>
      {/* Roll button — center overlay when waiting for player input */}
      {waiting && result === null && !rolling && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40">
          <div className="bg-gray-900 border-2 border-yellow-500 rounded-3xl px-12 py-8 flex flex-col items-center gap-4 shadow-2xl">
            {bonusRoll && (
              <div className="text-green-400 font-bold text-base animate-pulse">🎁 보너스 턴!</div>
            )}
            <div className="text-8xl leading-none select-none">🎲</div>
            <button
              onClick={() => { if (!rolling) onRoll(); }}
              className="px-10 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-xl text-2xl transition-colors shadow-lg">
              주사위 굴리기
            </button>
          </div>
        </div>
      )}

      {/* Center overlay — shown while rolling and briefly after result */}
      {showOverlay && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
          <div className={`flex flex-col items-center gap-4 px-10 py-8 rounded-3xl border-2 shadow-2xl
            ${isDoubles && !rolling ? 'border-yellow-400 bg-gray-950/95' : 'border-gray-600 bg-gray-950/90'}`}>

            <div className="flex items-center gap-6">
              <DieFace value={disp1} rolling={rolling} />
              <span className="text-3xl text-gray-500 font-bold">+</span>
              <DieFace value={disp2} rolling={rolling} />
            </div>

            {!rolling && result !== null && (
              <div className="text-center">
                <div className="text-4xl font-black text-yellow-300">{result}칸</div>
                {isDoubles && (
                  <div className="text-lg text-yellow-400 font-bold animate-pulse mt-1">🎯 더블! 보너스 턴!</div>
                )}
              </div>
            )}

            {rolling && (
              <div className="text-sm text-gray-400 animate-pulse">굴리는 중...</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
