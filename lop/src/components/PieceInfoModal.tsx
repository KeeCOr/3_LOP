'use client';
import type { GameState, Piece, TroopType } from '@/lib/gameTypes';
import { CHARACTERS, TROOP_DATA } from '@/lib/gameData';

interface Props { state: GameState; piece: Piece; onClose: () => void; }

const OWNER_LABELS: Record<string, string> = {
  player: '플레이어', ai: 'AI 1', ai2: 'AI 2', ai3: 'AI 3',
};
const OWNER_COLORS: Record<string, string> = {
  player: 'text-blue-400', ai: 'text-red-400', ai2: 'text-green-400', ai3: 'text-purple-400',
};

export default function PieceInfoModal({ piece, onClose }: Props) {
  const charData = CHARACTERS[piece.characterType];
  const ownerLabel = OWNER_LABELS[piece.owner] ?? piece.owner;
  const ownerColor = OWNER_COLORS[piece.owner] ?? 'text-gray-400';
  const compEntries = (Object.entries(piece.composition) as [TroopType, number][]).filter(([, n]) => (n ?? 0) > 0);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 rounded-xl p-5 min-w-[260px] text-white border border-gray-700" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className={`font-bold ${ownerColor}`}>{ownerLabel}</div>
            <div className="text-sm text-gray-300">{charData.name} — {piece.id}</div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-lg">✕</button>
        </div>

        <div className="text-xs text-purple-300 mb-3">✦ {charData.skill.name}: {charData.skill.desc}</div>

        <div className="bg-gray-800 rounded-lg p-3 mb-3">
          <div className="text-xs text-gray-400 mb-1.5">병력 구성</div>
          {compEntries.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {compEntries.map(([t, n]) => (
                <div key={t} className="flex items-center gap-1">
                  <span className="text-lg">{TROOP_DATA[t].emoji}</span>
                  <span className="font-bold">{n}</span>
                  <span className="text-xs text-gray-400">{TROOP_DATA[t].name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm">병력 없음</div>
          )}
          <div className="text-xs text-gray-500 mt-1">합계: {piece.troops}명 / {charData.maxTroops}명</div>
        </div>

        <div className="text-xs text-gray-500">현재 위치: {piece.position}번 칸</div>
      </div>
    </div>
  );
}
