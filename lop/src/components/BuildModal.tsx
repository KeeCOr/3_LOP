import type { GameState } from '@/lib/gameTypes';
import type { GameAction } from '@/lib/gameReducer';
import { BUILDING_DATA } from '@/lib/gameData';
import { getBuildCost } from '@/lib/economyUtils';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }
export default function BuildModal({ state, dispatch }: Props) {
  const tileId = state.activeTileAction!;
  const tile = state.tiles.find(t => t.id === tileId)!;
  const gold = state.player.gold;
  const discount = state.player.buildDiscountLaps > 0;

  const buildingTypes = ['vault', 'barracks', 'fort'] as const;
  const icons = { vault: '🏦', barracks: '🏕️', fort: '🏰' };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 min-w-[340px] text-white">
        <h2 className="text-xl font-bold text-yellow-400 mb-4">🏗️ 건물 건설</h2>
        {discount && <div className="text-green-400 text-sm mb-3">✨ 건설 비용 50% 할인 중!</div>}
        <div className="flex flex-col gap-3 mb-4">
          {buildingTypes.map(type => {
            const data = BUILDING_DATA[type];
            const canBuild = tile.building === null || tile.building === type;
            const isMax = tile.building === type && tile.buildingLevel >= 3;
            const cost = getBuildCost(tile, type, discount);
            const level = tile.building === type ? tile.buildingLevel : 0;
            return (
              <button key={type}
                onClick={() => dispatch({ type: 'BUILD', tileId, buildingType: type })}
                disabled={!canBuild || isMax || gold < cost}
                className="flex items-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 rounded-lg transition-colors text-left">
                <span className="text-2xl">{icons[type]}</span>
                <div className="flex-1">
                  <div className="font-bold">{data.name[Math.max(0, level)]} {isMax && '(최대)'}</div>
                  <div className="text-xs text-gray-400">{data.description}</div>
                </div>
                <div className="text-yellow-400 font-bold">{isMax ? '-' : `${cost}골드`}</div>
              </button>
            );
          })}
        </div>
        <button onClick={() => dispatch({ type: 'SKIP_BUILD' })}
          className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">건설 안함</button>
      </div>
    </div>
  );
}
