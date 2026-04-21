import type { GameState } from '@/lib/gameTypes';
import { CHARACTERS } from '@/lib/gameData';

export default function HUD({ state }: { state: GameState }) {
  const playerPieces = state.pieces.filter(p => p.owner === 'player');
  const aiPieces = state.pieces.filter(p => p.owner === 'ai');
  const playerLands = state.tiles.filter(t => t.owner === 'player').length;
  const aiLands = state.tiles.filter(t => t.owner === 'ai').length;

  return (
    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-900 rounded-lg">
      <div className="text-blue-300">
        <div className="font-bold text-blue-400">👤 플레이어</div>
        <div>💰 {state.player.gold}골드</div>
        <div>🏠 영토 {playerLands}칸</div>
        {playerPieces.map(p => (
          <div key={p.id} className="text-sm text-gray-400">
            {CHARACTERS[p.characterType].name} ⚔️{p.troops}명
          </div>
        ))}
      </div>
      <div className="text-red-300 text-right">
        <div className="font-bold text-red-400">🤖 AI</div>
        <div>💰 {state.ai.gold}골드</div>
        <div>🏠 영토 {aiLands}칸</div>
        {aiPieces.map(p => (
          <div key={p.id} className="text-sm text-gray-400">
            {CHARACTERS[p.characterType].name} ⚔️{p.troops}명
          </div>
        ))}
      </div>
    </div>
  );
}
