interface Props { result: number | null; onRoll: () => void; }
export default function DiceRoller({ result, onRoll }: Props) {
  const faces = ['', '⚀','⚁','⚂','⚃','⚄','⚅'];
  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-gray-900 rounded-lg">
      {result && <div className="text-5xl">{faces[result]}</div>}
      <button onClick={onRoll}
        className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg text-lg transition-colors">
        🎲 주사위 굴리기
      </button>
    </div>
  );
}
