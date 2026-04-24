'use client';
import type { GameState } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';
import { CHARACTERS } from '@/lib/gameData';
import { FACTION_COLORS } from '@/lib/factionColors';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }

export default function BattleModal({ state, dispatch }: Props) {
  const battle = state.activeBattle!;
  const piece = state.pieces.find(p => p.id === battle.attackerPieceId)!;
  const isPlayerTurn = state.currentTurn === 'player';
  const won = battle.result === 'attacker_wins';
  const totalRounds = battle.rounds.length;
  const atkLost = battle.rounds.reduce((s, r) => s + r.defenderDamage, 0);
  const defLost = battle.rounds.reduce((s, r) => s + r.attackerDamage, 0);
  const atkFc = FACTION_COLORS[piece.owner];
  const defTile = state.tiles.find(t => t.id === state.activeTileAction);
  const defFc = defTile?.owner && defTile.owner !== 'neutral' ? FACTION_COLORS[defTile.owner] : null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-5 w-[300px] text-white">
        <div className={`text-center text-xl font-bold mb-3 ${won ? 'text-green-400' : 'text-red-400'}`}>
          {won ? '🏆 전투 승리!' : '💀 전투 패배'}
        </div>

        <div className="grid grid-cols-3 gap-2 items-center mb-4">
          <div className={`text-center rounded-lg p-2 border ${atkFc.border} bg-gray-800`}>
            <div className={`text-xs ${atkFc.text}`}>{CHARACTERS[piece.characterType].name}</div>
            <div className={`text-2xl font-bold ${atkFc.textBright}`}>{battle.attackerTroops}</div>
            <div className="text-xs text-gray-500">잔존</div>
            {atkLost > 0 && <div className="text-xs text-red-400">−{atkLost}</div>}
          </div>
          <div className="text-center text-gray-500 text-sm">
            <div>{totalRounds}라운드</div>
            <div className="text-xl">⚔️</div>
          </div>
          <div className={`text-center rounded-lg p-2 border ${defFc ? defFc.border : 'border-gray-600'} bg-gray-800`}>
            <div className={`text-xs ${defFc ? defFc.text : 'text-gray-400'}`}>수비대</div>
            <div className={`text-2xl font-bold ${defFc ? defFc.textBright : 'text-gray-300'}`}>{battle.defenderTroops}</div>
            <div className="text-xs text-gray-500">잔존</div>
            {defLost > 0 && <div className="text-xs text-green-400">−{defLost}</div>}
          </div>
        </div>

        {isPlayerTurn && (
          <button onClick={() => dispatch({ type: 'BATTLE_FINISH' })}
            className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-bold text-sm">
            확인
          </button>
        )}
      </div>
    </div>
  );
}
