interface Props { winner: 'player' | 'ai'; onRestart: () => void; }
export default function GameOver({ winner, onRestart }: Props) {
  const isWin = winner === 'player';
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-6">
      <div className="text-7xl">{isWin ? '🏆' : '💀'}</div>
      <h1 className={`text-4xl font-bold ${isWin ? 'text-yellow-400' : 'text-red-400'}`}>
        {isWin ? '승리!' : '패배...'}
      </h1>
      <p className="text-gray-400">{isWin ? 'AI를 파산시켰습니다!' : '파산했습니다...'}</p>
      <button onClick={onRestart}
        className="px-10 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg text-lg">
        다시 시작
      </button>
    </div>
  );
}
