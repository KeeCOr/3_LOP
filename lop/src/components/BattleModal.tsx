'use client';
import type { GameState } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';
import { CHARACTERS } from '@/lib/gameData';
import { FACTION_COLORS } from '@/lib/factionColors';
import { TILE_DEFINITIONS } from '@/lib/boardLayout';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }

export default function BattleModal({ state, dispatch }: Props) {
  const battle = state.activeBattle!;
  const piece = state.pieces.find(p => p.id === battle.attackerPieceId)!;
  const isPlayerTurn = state.currentTurn === 'player';
  const won = battle.result === 'attacker_wins';
  const atkFc = FACTION_COLORS[piece.owner];
  const defTile = state.tiles.find(t => t.id === (state.activeTileAction ?? state.activeBattle?.defenderTileId));
  const defFc = defTile?.owner && defTile.owner !== 'neutral' ? FACTION_COLORS[defTile.owner] : null;
  const tileDef = TILE_DEFINITIONS.find(d => d.index === battle.defenderTileId);

  const totalAtkLost = battle.rounds.reduce((s, r) => s + r.defenderDamage, 0);
  const totalDefLost = battle.rounds.reduce((s, r) => s + r.attackerDamage, 0);

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl w-[340px] text-white overflow-hidden">

        {/* Header */}
        <div className={`px-4 py-3 text-center font-black text-lg ${won ? 'bg-green-900/60 text-green-300' : 'bg-red-900/60 text-red-300'}`}>
          {won ? '🏆 전투 승리!' : '💀 전투 패배'} — {tileDef?.label ?? `${battle.defenderTileId}번`}
        </div>

        {/* Score */}
        <div className="grid grid-cols-3 gap-2 items-center px-4 py-3 bg-gray-800/60">
          <div className={`text-center rounded-lg p-2 border ${atkFc.border}`}>
            <div className={`text-[10px] ${atkFc.text} mb-0.5`}>{CHARACTERS[piece.characterType].name} (공격)</div>
            <div className={`text-2xl font-black ${atkFc.textBright}`}>{battle.attackerTroops}</div>
            <div className="text-[10px] text-gray-400">잔존</div>
            {totalAtkLost > 0 && <div className="text-[10px] text-red-400">−{totalAtkLost}</div>}
          </div>
          <div className="text-center">
            <div className="text-2xl">⚔️</div>
            <div className="text-xs text-gray-500">{battle.rounds.length}라운드</div>
          </div>
          <div className={`text-center rounded-lg p-2 border ${defFc ? defFc.border : 'border-gray-600'}`}>
            <div className={`text-[10px] ${defFc ? defFc.text : 'text-gray-400'} mb-0.5`}>수비대</div>
            <div className={`text-2xl font-black ${defFc ? defFc.textBright : 'text-gray-300'}`}>{battle.defenderTroops}</div>
            <div className="text-[10px] text-gray-400">잔존</div>
            {totalDefLost > 0 && <div className="text-[10px] text-green-400">−{totalDefLost}</div>}
          </div>
        </div>

        {/* Round log */}
        <div className="px-4 py-2 max-h-[160px] overflow-y-auto">
          <div className="text-[10px] text-gray-500 font-bold mb-1.5 uppercase tracking-wide">전투 과정</div>
          {battle.rounds.map((r, i) => (
            <div key={i} className="flex items-center gap-1.5 py-1 border-b border-gray-800 last:border-0">
              <span className="text-[10px] text-gray-600 w-12 shrink-0">라운드 {i + 1}</span>
              <div className="flex-1 flex items-center gap-1 text-[10px]">
                <span className={`font-bold ${atkFc.text}`}>{r.attackerTroopsBefore}명</span>
                <span className="text-gray-600">→</span>
                {r.defenderDamage > 0
                  ? <span className="text-red-400">−{r.defenderDamage}</span>
                  : <span className="text-gray-600">피해없음</span>}
                <span className="text-gray-700 mx-1">|</span>
                <span className={`font-bold ${defFc ? defFc.text : 'text-gray-300'}`}>{r.defenderTroopsBefore}명</span>
                <span className="text-gray-600">→</span>
                {r.attackerDamage > 0
                  ? <span className="text-green-400">−{r.attackerDamage}</span>
                  : <span className="text-gray-600">피해없음</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 pb-4 pt-2">
          {isPlayerTurn && (
            <button onClick={() => dispatch({ type: 'BATTLE_FINISH' })}
              className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-bold text-sm">
              확인
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
