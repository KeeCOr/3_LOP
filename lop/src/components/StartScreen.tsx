'use client';
import { useState } from 'react';
import type { CharacterType, Difficulty } from '@/lib/gameTypes';
import { CHARACTERS } from '@/lib/gameData';
import { CHAR_IMAGE } from '@/lib/charImages';

const VERSION = '0.4.17';
const startHeroBackground = "url('/generated/lop-start-hero-bg.png')";

interface Props { onStart: (char: CharacterType, diff: Difficulty, playerCount: 2 | 3 | 4) => void; }

const CHARACTER_TYPES = Object.keys(CHARACTERS) as CharacterType[];
const SPIN_DELAYS = [65, 70, 85, 105, 135, 175, 215, 265, 320, 390, 440];

const CHARACTER_LABEL: Record<CharacterType, { name: string; role: string; hint: string }> = {
  pirate: { name: '해적', role: '전투 보상형', hint: '초반에는 중립 영토 전투를 자주 걸어 골드 보상을 확보하세요.' },
  agitator: { name: '선동가', role: '병력 보급형', hint: '여러 말을 굴리며 병력을 분산시키면 회차 보급 효율이 좋아집니다.' },
  smuggler: { name: '밀수꾼', role: '골드 성장형', hint: '초반 구매를 빠르게 진행해 통행료 수익 기반을 만드세요.' },
  swindler: { name: '사기꾼', role: '주사위 변수형', hint: '낮은 주사위도 이득으로 바뀌니 위험한 타일 앞에서 과감히 굴려볼 만합니다.' },
  warlock: { name: '흑마술사', role: '견제형', hint: '상대 병력이 쌓이는 영토를 견제하면서 안전한 내 땅을 늘리세요.' },
  cleric: { name: '종교가', role: '영토 강화형', hint: '점령지를 넓힌 뒤 회차마다 병력을 받는 구조를 노리세요.' },
  general: { name: '장군', role: '대규모 병력형', hint: '최대 병력이 높으니 핵심 말 하나를 강하게 키워 돌파하세요.' },
};

export default function StartScreen({ onStart }: Props) {
  const [screen, setScreen] = useState<'goal' | 'setup' | 'reveal'>('goal');
  const [diff, setDiff] = useState<Difficulty>('normal');
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(2);
  const [spinIdx, setSpinIdx] = useState(0);
  const [finalChar, setFinalChar] = useState<CharacterType | null>(null);
  const [revealed, setRevealed] = useState(false);

  function beginReveal() {
    const randomChar = CHARACTER_TYPES[Math.floor(Math.random() * CHARACTER_TYPES.length)];
    const finalIdx = CHARACTER_TYPES.indexOf(randomChar);
    const startIdx = (finalIdx - SPIN_DELAYS.length % CHARACTER_TYPES.length + CHARACTER_TYPES.length * 100) % CHARACTER_TYPES.length;

    setFinalChar(randomChar);
    setRevealed(false);
    setSpinIdx(startIdx);
    setScreen('reveal');

    let delay = 0;
    for (let i = 0; i < SPIN_DELAYS.length; i++) {
      delay += SPIN_DELAYS[i];
      const nextIdx = (startIdx + i + 1) % CHARACTER_TYPES.length;
      setTimeout(() => setSpinIdx(nextIdx), delay);
    }
    setTimeout(() => setRevealed(true), delay + 160);
    setTimeout(() => onStart(randomChar, diff, playerCount), delay + 1900);
  }

  return (
    <main
      className="min-h-screen bg-[#05070d] bg-cover bg-center text-white"
      style={{
        backgroundImage: `linear-gradient(90deg, rgba(3,7,13,0.94) 0%, rgba(5,7,13,0.78) 45%, rgba(5,7,13,0.45) 100%), radial-gradient(circle at top, rgba(255,202,40,0.12), transparent 38%), ${startHeroBackground}`,
      }}>
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-6">
        <header className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.22em] text-yellow-400">Land of Power</div>
            <h1 className="mt-1 text-3xl font-black text-white">LOP</h1>
          </div>
          <div className="text-xs font-bold text-gray-500">v{VERSION}</div>
        </header>

        {screen === 'goal' && (
          <section className="grid flex-1 items-center gap-6 py-8 lg:grid-cols-[1fr_360px]">
            <div>
              <h2 className="max-w-2xl text-4xl font-black leading-tight text-yellow-300">
                짧고 빠른 영토 쟁탈 보드게임
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-300">
                주사위를 굴려 말을 이동하고, 영토를 점령하고, 건물을 세워 통행료와 회차 생산을 키우세요.
                상대의 골드를 고갈시키거나 영토 기반을 무너뜨리면 승리합니다.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  ['1', '굴리기', '주사위 결과로 이동 거리를 정합니다.'],
                  ['2', '점령하기', '전투나 구매로 영토를 확보합니다.'],
                  ['3', '키우기', '병력과 건물로 수익 구조를 만듭니다.'],
                ].map(([num, title, body]) => (
                  <div key={num} className="rounded-md border border-amber-700/45 bg-gray-950/72 p-4 shadow-[inset_0_0_0_1px_rgba(255,244,190,0.08)] backdrop-blur-sm">
                    <div className="text-xs font-black text-yellow-400">{num}</div>
                    <div className="mt-1 font-black text-white">{title}</div>
                    <p className="mt-2 text-xs leading-5 text-gray-400">{body}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-md border border-yellow-600/70 bg-gray-950/82 p-5 shadow-2xl backdrop-blur-sm">
              <h3 className="text-lg font-black text-yellow-300">승리 조건</h3>
              <ul className="mt-4 space-y-3 text-sm text-gray-300">
                <li><b className="text-white">경제 승리:</b> 상대 골드를 0 이하로 압박</li>
                <li><b className="text-white">영토 승리:</b> 주요 영토와 생산 기반 장악</li>
                <li><b className="text-white">전투 승리:</b> 병력 우위로 위험 타일 돌파</li>
              </ul>
              <button onClick={() => setScreen('setup')}
                className="mt-6 w-full rounded bg-yellow-400 px-5 py-3 font-black text-black hover:bg-yellow-300">
                설정으로 이동
              </button>
            </div>
          </section>
        )}

        {screen === 'setup' && (
          <section className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-8">
            <h2 className="text-2xl font-black text-yellow-300">게임 설정</h2>
            <div className="mt-5 rounded-md border border-amber-700/50 bg-gray-950/82 p-5 shadow-2xl backdrop-blur-sm">
              <div>
                <div className="text-xs font-black uppercase tracking-wide text-gray-500">참가 인원</div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {([2, 3, 4] as const).map(n => (
                    <button key={n} onClick={() => setPlayerCount(n)}
                      className={`rounded border px-3 py-3 text-sm font-black ${playerCount === n ? 'border-yellow-400 bg-yellow-400 text-black' : 'border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500'}`}>
                      {n}명
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">플레이어 1명과 AI {playerCount - 1}명이 대결합니다.</p>
              </div>

              <div className="mt-6">
                <div className="text-xs font-black uppercase tracking-wide text-gray-500">난이도</div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {([
                    ['easy', '쉬움', '여유로운 경제'],
                    ['normal', '보통', '표준 압박'],
                    ['hard', '어려움', '강한 AI'],
                  ] as [Difficulty, string, string][]).map(([value, label, desc]) => (
                    <button key={value} onClick={() => setDiff(value)}
                      className={`rounded border px-3 py-3 text-left ${diff === value ? 'border-yellow-400 bg-yellow-400 text-black' : 'border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500'}`}>
                      <div className="text-sm font-black">{label}</div>
                      <div className="mt-0.5 text-[11px] opacity-70">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button onClick={() => setScreen('goal')}
                className="flex-1 rounded border border-gray-700 px-5 py-3 text-sm font-bold text-gray-300 hover:border-gray-500">
                목표 다시 보기
              </button>
              <button onClick={beginReveal}
                className="flex-[2] rounded bg-yellow-400 px-5 py-3 font-black text-black hover:bg-yellow-300">
                캐릭터 뽑고 시작
              </button>
            </div>
          </section>
        )}

        {screen === 'reveal' && (
          <section className="flex flex-1 flex-col items-center justify-center py-8">
            <h2 className="text-xl font-black text-yellow-300">{revealed ? '캐릭터 확정' : '캐릭터 선택 중...'}</h2>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {CHARACTER_TYPES.map((type, index) => {
                const isActive = !revealed && spinIdx === index;
                const isFinal = revealed && finalChar === type;
                const label = CHARACTER_LABEL[type];

                return (
                  <div key={type}
                    className={`w-36 rounded border p-3 text-center transition-all
                      ${isFinal ? 'scale-110 border-yellow-400 bg-yellow-900/40 shadow-lg shadow-yellow-500/20' : isActive ? 'scale-105 border-sky-400 bg-sky-900/30' : 'border-gray-800 bg-gray-950/70 opacity-60'}`}>
                    <img src={CHAR_IMAGE[type]} alt={label.name} className="mx-auto h-24 w-20 object-contain" />
                    <div className={`mt-2 text-sm font-black ${isFinal ? 'text-yellow-300' : 'text-white'}`}>{label.name}</div>
                    <div className="mt-0.5 text-xs text-gray-400">{label.role}</div>
                  </div>
                );
              })}
            </div>

            {revealed && finalChar && (
              <div className="mt-8 max-w-lg rounded border border-yellow-500/60 bg-gray-950/90 p-5 text-center">
                <div className="text-2xl font-black text-yellow-300">{CHARACTER_LABEL[finalChar].name}</div>
                <div className="mt-1 text-sm font-bold text-sky-300">{CHARACTER_LABEL[finalChar].role}</div>
                <p className="mt-3 text-sm leading-6 text-gray-300">{CHARACTER_LABEL[finalChar].hint}</p>
                <div className="mt-4 text-xs font-bold text-gray-500">잠시 후 게임이 시작됩니다.</div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
