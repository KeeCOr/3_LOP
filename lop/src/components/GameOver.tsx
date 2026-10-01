import type { PlayerType } from '@/lib/gameTypes';

interface Props { winner: PlayerType; onRestart: () => void; }
const battleResultBackground = "url('/generated/lop-battle-result-bg.png')";

export default function GameOver({ winner, onRestart }: Props) {
  const isWin = winner === 'player';
  const winnerName = winner === 'player' ? '플레이어' : winner === 'ai' ? 'AI 1' : winner === 'ai2' ? 'AI 2' : 'AI 3';
  return (
    <div
      className="min-h-screen bg-gray-950 bg-cover bg-center text-white flex flex-col items-center justify-center gap-6 px-5"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(2,7,12,0.52), rgba(2,7,12,0.88)), ${battleResultBackground}`,
      }}>
      <div className="w-full max-w-lg rounded-2xl border border-amber-700/70 bg-gray-950/82 p-8 text-center shadow-[0_18px_60px_rgba(0,0,0,0.62)] backdrop-blur-sm">
        <div className="text-7xl">{isWin ? '🏆' : '💀'}</div>
        <h1 className={`mt-3 text-4xl font-black ${isWin ? 'text-yellow-300' : 'text-red-300'}`}>
          {isWin ? '승리!' : '패배...'}
        </h1>
        <p className="mt-4 text-gray-300">
          {isWin ? 'AI를 파산시켰습니다!' : `${winnerName}에게 파산했습니다...`}
        </p>
        <button onClick={onRestart}
          className="mt-7 px-10 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg text-lg">
          다시 시작
        </button>
      </div>
    </div>
  );
}
