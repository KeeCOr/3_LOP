import type { GameState, Piece, Tile, CharacterType, Difficulty, TroopComp, TroopType, PlayerState, PlayerType, EventCard, BattleState, DragonState, BuildingType } from './gameTypes';
import { LAND_INDICES, PLAYER_START, AI_START, nextPosition, didPassStart } from './boardLayout';
import { CHARACTERS, TROOP_DATA, LAP_TROOP_BONUS, LAP_GOLD_BONUS, TROOP_PRICE_SCALE, nextHireCost, CHANCE_CARDS } from './gameData';
import { getToll, getLapIncome, getLapTroops, calcTax, getBuildCost, getBuildingAttackBonus, getBuildingDefenseBonus } from './economyUtils';
import { runFullBattle, getBattleAttack, getBattleDefense, getGarrisonAttack, getGarrisonDefense } from './battleEngine';

const AI2_START = 4;
const AI3_START = 11;
const EMPTY_LAND_INITIAL_TROOPS = 3;

let _slotIdCounter = 0;
function makeSlotId(cardId: string) { return `${cardId}_${++_slotIdCounter}`; }

function getPS(state: GameState, id: PlayerType): PlayerState {
  if (id === 'player') return state.player;
  if (id === 'ai') return state.ai;
  if (id === 'ai2') return state.ai2!;
  return state.ai3!;
}

function setPS(state: GameState, id: PlayerType, updates: Partial<PlayerState>): GameState {
  const updated = { ...getPS(state, id), ...updates };
  if (id === 'player') return { ...state, player: updated };
  if (id === 'ai') return { ...state, ai: updated };
  if (id === 'ai2') return { ...state, ai2: updated };
  return { ...state, ai3: updated };
}

function totalComp(comp: TroopComp): number {
  return Object.values(comp).reduce((s, n) => s + (n ?? 0), 0);
}

function scaleComp(comp: TroopComp, newTotal: number): TroopComp {
  const old = totalComp(comp);
  if (old === 0 || newTotal === 0) return {};
  const ratio = newTotal / old;
  const result: TroopComp = {};
  let assigned = 0;
  const entries = Object.entries(comp) as [TroopType, number][];
  entries.forEach(([t, n], i) => {
    if (i === entries.length - 1) {
      result[t] = Math.max(0, newTotal - assigned);
    } else {
      const scaled = Math.round((n ?? 0) * ratio);
      result[t] = scaled;
      assigned += scaled;
    }
  });
  return result;
}

function mergeComp(a: TroopComp, b: TroopComp): TroopComp {
  const result: TroopComp = { ...a };
  (Object.keys(b) as TroopType[]).forEach(t => {
    result[t] = (result[t] ?? 0) + (b[t] ?? 0);
  });
  return result;
}

function addToComp(comp: TroopComp, type: TroopType, amount: number): TroopComp {
  return { ...comp, [type]: (comp[type] ?? 0) + amount };
}

function removeFromComp(comp: TroopComp, n: number): TroopComp {
  const result = { ...comp };
  let remaining = n;
  for (const t of (['swordsman', 'archer', 'cavalry', 'spearman'] as TroopType[])) {
    const cur = result[t] ?? 0;
    if (cur <= 0) continue;
    const remove = Math.min(cur, remaining);
    result[t] = cur - remove;
    remaining -= remove;
    if (remaining <= 0) break;
  }
  return result;
}

const TROOP_TYPES: TroopType[] = ['swordsman', 'archer', 'cavalry', 'spearman'];
function randomTroopType(): TroopType {
  return TROOP_TYPES[Math.floor(Math.random() * TROOP_TYPES.length)];
}

function randomGarrison(troops: number, numTypes = 1): TroopComp {
  if (troops === 0) return {};
  const shuffled = [...TROOP_TYPES].sort(() => Math.random() - 0.5);
  if (numTypes === 1 || troops < 2) {
    return { [shuffled[0]]: troops } as TroopComp;
  }
  const first = Math.max(1, Math.floor(troops * (0.5 + Math.random() * 0.3)));
  return { [shuffled[0]]: first, [shuffled[1]]: troops - first } as TroopComp;
}

function dominantTroopType(comp: TroopComp): TroopType {
  const entries = Object.entries(comp) as [TroopType, number][];
  if (entries.length === 0) return 'swordsman';
  return entries.reduce((a, b) => ((b[1] ?? 0) > (a[1] ?? 0) ? b : a))[0];
}

function createPiece(id: string, owner: PlayerType, characterType: CharacterType, startIndex: number): Piece {
  return { id, owner, characterType, position: startIndex, troops: 20, composition: { swordsman: 15, archer: 5 }, startTileIndex: startIndex };
}

function makePS(id: PlayerType, isHuman: boolean, name: string, goldBonus = 0): PlayerState {
  return {
    id, gold: 1500 + goldBonus, hireCost: 0, pieceCount: 1, attackBoostActive: false,
    taxExemptTurns: 0, tollExemptTurns: 0, tollDoubleLaps: 0, buildDiscountLaps: 0, freeBuildNext: false,
    diceBonusTurns: 0, diceBonusAmount: 0, isHuman, name,
    troopBuyCount: 0, defenseBoostMultiplier: 1,
  };
}

// Tier 1 (cheap): 1,2 | Tier 2 (mid): 4,6,8 | Tier 3 (premium): 9,11,13
const TILE_TIER: Record<number, 1 | 2 | 3> = { 1: 1, 2: 1, 4: 2, 6: 2, 8: 2, 9: 3, 11: 3, 13: 3 };
const TIER_TROOP_RANGE: Record<1|2|3, [number,number]> = { 1: [3,3], 2: [3,5], 3: [5,7] };
const TIER_LAP_PROD_RANGE: Record<1|2|3, [number,number]> = { 1: [1,2], 2: [2,4], 3: [3,6] };
// Tier 1: always 1 type, Tier 2: randomly 1 or 2 types, Tier 3: always 2 types
const TIER_TYPES_COUNT: Record<1|2|3, () => number> = { 1: () => 1, 2: () => (Math.random() < 0.5 ? 1 : 2), 3: () => 2 };
const CAPTURE_BASE_TROOPS = 5;

const START_INITIAL_TROOPS = 12;
const START_BASE_TOLL = 350;

function createInitialTiles(playerCount: 2 | 3 | 4 = 2): Tile[] {
  return Array.from({ length: 14 }, (_, i) => {
    const isAi2Start = playerCount >= 3 && i === AI2_START;
    const isAi3Start = playerCount >= 4 && i === AI3_START;
    const isStartTile = i === PLAYER_START || i === AI_START || isAi2Start || isAi3Start;
    const tier = TILE_TIER[i];
    const range = tier ? TIER_TROOP_RANGE[tier] : null;
    const hasTroops = !!range && !isAi2Start && !isAi3Start;
    const troops = isStartTile ? START_INITIAL_TROOPS
      : hasTroops ? Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0] : 0;
    const lapProdRange = tier ? TIER_LAP_PROD_RANGE[tier] : null;
    const baseLapProduction = isStartTile ? 2
      : lapProdRange ? Math.floor(Math.random() * (lapProdRange[1] - lapProdRange[0] + 1)) + lapProdRange[0]
      : 0;
    const landPrice = tier ? baseLapProduction * 180 : 0;
    const baseToll = isStartTile ? START_BASE_TOLL : (tier ? baseLapProduction * 80 : 0);
    const tileType: import('./gameTypes').TileType =
      LAND_INDICES.includes(i) ? 'land' :
      i === 0 ? 'start_p' :
      i === 7 ? 'start_e' :
      (i === 3 || i === 10) ? 'mercenary' : 'chance';
    const startOwner: PlayerType | 'neutral' | null =
      i === PLAYER_START ? 'player' :
      i === AI_START ? 'ai' :
      isAi2Start ? 'ai2' :
      isAi3Start ? 'ai3' :
      (troops > 0 ? 'neutral' : null);
    const garrison = tier ? randomGarrison(troops, TIER_TYPES_COUNT[tier]()) : randomGarrison(troops);
    return {
      id: i, type: tileType, owner: startOwner, troops, garrison,
      buildings: {}, landPrice, baseToll, baseLapProduction,
    } as Tile;
  });
}

export function createInitialState(characterType: CharacterType, difficulty: Difficulty, playerCount: 2 | 3 | 4 = 2): GameState {
  const pieces: Piece[] = [
    createPiece('p0', 'player', characterType, PLAYER_START),
    createPiece('e0', 'ai', 'general', AI_START),
  ];
  if (playerCount >= 3) pieces.push(createPiece('e1', 'ai2', 'pirate', AI2_START));
  if (playerCount >= 4) pieces.push(createPiece('e2', 'ai3', 'warlock', AI3_START));

  return {
    phase: 'board',
    turnPhase: 'start_deploy',
    currentTurn: 'player',
    difficulty,
    playerCount,
    player: makePS('player', true, '플레이어'),
    ai: makePS('ai', false, 'AI 1'),
    ai2: playerCount >= 3 ? makePS('ai2', false, 'AI 2') : null,
    ai3: playerCount >= 4 ? makePS('ai3', false, 'AI 3') : null,
    pieces,
    tiles: createInitialTiles(playerCount),
    diceResult: null,
    dice1: null,
    dice2: null,
    bonusRoll: false,
    selectedPieceId: null,
    activeBattle: null,
    activeEvent: null,
    activeTileAction: null,
    activeDeployTileId: null,
    winner: null,
    log: [],
    lapBonusAnim: null,
    passCollectQueue: null,
    tollPayAnim: null,
    pendingBattleTileId: null,
    mercenaryResult: null,
    lapCount: 0,
    dragon: null,
    dragonPending: null,
    pendingStopTiles: null,
  };
}

export type GameAction =
  | { type: 'START_DEPLOY'; deployAmount: number }
  | { type: 'ROLL_DICE' }
  | { type: 'SELECT_PIECE'; pieceId: string }
  | { type: 'CHOOSE_FIGHT'; tileId: number }
  | { type: 'SKIP_DEFEND' }
  | { type: 'CHOOSE_MOVE_TILE'; tileId: number }
  | { type: 'CHOOSE_BUY_LAND'; tileId: number }
  | { type: 'CHOOSE_PAY_TOLL'; tileId: number }
  | { type: 'CHOOSE_PASS' }
  | { type: 'SELL_LAND'; tileId: number }
  | { type: 'CONFIRM_FORCED_SELL' }
  | { type: 'COLLECT_TROOPS'; tileId: number; amount?: number }
  | { type: 'BATTLE_FINISH' }
  | { type: 'DEPLOY_TROOPS'; tileId: number; garrison: TroopComp }
  | { type: 'BUILD'; tileId: number; buildingType: BuildingType }
  | { type: 'SKIP_BUILD' }
  | { type: 'BUY_TROOPS'; pieceId: string; troopType: TroopType; amount: number; tileId?: number }
  | { type: 'BUY_PIECE'; characterType: CharacterType }
  | { type: 'OPEN_SHOP' }
  | { type: 'CLOSE_SHOP' }
  | { type: 'APPLY_EVENT_CARD' }
  | { type: 'CLEAR_LAP_BONUS' }
  | { type: 'BUY_MERCENARY' }
  | { type: 'CLOSE_MERCENARY' }
  | { type: 'CONFIRM_PASS_COLLECT'; amount?: number }
  | { type: 'SKIP_PASS_COLLECT' }
  | { type: 'STOP_AT_TILE'; tileId: number }
  | { type: 'CONTINUE_MOVE' }
  | { type: 'END_TURN' };

// Extracted battle setup helper
function executeBattle(state: GameState, tileId: number): GameState {
  const piece = state.pieces.find(p => p.id === state.selectedPieceId)!;
  const tile = state.tiles.find(t => t.id === tileId)!;
  const owner = state.currentTurn;
  const defenderOwnerRaw = tile.owner;
  const defenderOwner = (defenderOwnerRaw && defenderOwnerRaw !== 'neutral') ? defenderOwnerRaw as PlayerType : null;

  const defendingPiece = defenderOwner
    ? state.pieces.find(p => p.owner === defenderOwner && p.position === tile.id && p.troops > 0 && p.id !== piece.id)
    : undefined;

  const combinedDefTroops = tile.troops + (defendingPiece?.troops ?? 0);
  const combinedGarrison = defendingPiece ? mergeComp(tile.garrison, defendingPiece.composition) : tile.garrison;

  const atkBoost = getPS(state, owner).attackBoostActive ? 1.5 : 1;
  const defBoostMult = defenderOwner === 'player' ? state.player.defenseBoostMultiplier : 1;

  const setup: BattleState = {
    attackerPieceId: piece.id,
    defenderTileId: tile.id,
    defenderPieceId: defendingPiece?.id ?? null,
    attackerTroops: piece.troops,
    defenderTroops: combinedDefTroops,
    defenderTroopsFromPiece: defendingPiece?.troops ?? 0,
    attackerAttack: getBattleAttack(piece, 1, !!defendingPiece) * atkBoost,
    attackerDefense: getBattleDefense(piece),
    defenderAttack: getGarrisonAttack(combinedGarrison, combinedDefTroops, getBuildingAttackBonus(tile)),
    defenderDefense: getGarrisonDefense(combinedGarrison, combinedDefTroops, getBuildingDefenseBonus(tile)) * defBoostMult,
    rounds: [],
    result: 'ongoing' as const,
  };
  const finished = runFullBattle(setup);
  const logExtra = defendingPiece ? ` (합산 방어 ${combinedDefTroops}명)` : '';
  return setPS({
    ...state,
    activeBattle: finished,
    turnPhase: 'battle',
    activeTileAction: null,
    pendingBattleTileId: null,
    log: [...state.log, `전투 시작!${logExtra}`],
  }, owner, { attackBoostActive: false });
}

const DRAGON_ATK = 1.8;
const DRAGON_DEF = 1.2;

function executeDragonBattle(state: GameState): GameState {
  const piece = state.pieces.find(p => p.id === state.selectedPieceId)!;
  const dragon = state.dragon!;
  const owner = state.currentTurn;
  const atkBoost = getPS(state, owner).attackBoostActive ? 1.5 : 1;
  const setup: BattleState = {
    attackerPieceId: piece.id,
    defenderTileId: dragon.position,
    defenderPieceId: null,
    attackerTroops: piece.troops,
    defenderTroops: dragon.troops,
    defenderTroopsFromPiece: 0,
    attackerAttack: getBattleAttack(piece, 1, true) * atkBoost,
    attackerDefense: getBattleDefense(piece),
    defenderAttack: DRAGON_ATK,
    defenderDefense: DRAGON_DEF,
    rounds: [],
    result: 'ongoing' as const,
    isDragonBattle: true,
  };
  const finished = runFullBattle(setup);
  return setPS({
    ...state,
    activeBattle: finished,
    turnPhase: 'battle',
    log: [...state.log, `🐉 드래곤 전투 시작! (드래곤 ${dragon.troops}명)`],
  }, owner, { attackBoostActive: false });
}

function resolvePieceMove(
  state: GameState,
  pieceId: string,
  newPos: number,
  steps: number,
  canAskStop: boolean,
): GameState {
  const piece = state.pieces.find(p => p.id === pieceId);
  if (!piece) return state;
  const owner = state.currentTurn;

  const passedTileIds: Set<number> = new Set();
  for (let i = 1; i < steps; i++) passedTileIds.add(nextPosition(piece.position, i));
  const ownedPassedIds: number[] = [];
  for (const tileId of passedTileIds) {
    const tile = state.tiles.find(t => t.id === tileId);
    if (tile?.owner === owner) ownedPassedIds.push(tileId);
  }

  if (canAskStop && owner === 'player' && ownedPassedIds.length > 0) {
    return {
      ...state,
      selectedPieceId: piece.id,
      pendingStopTiles: ownedPassedIds.map(id => ({ tileId: id, finalTileId: newPos, steps })),
      turnPhase: 'choose_stop',
    };
  }

  const passedStart = didPassStart(piece.position, steps, piece.startTileIndex);
  let newState: GameState = {
    ...state,
    pieces: state.pieces.map(p => p.id === piece.id ? { ...p, position: newPos } : p),
    selectedPieceId: piece.id,
    pendingStopTiles: null,
    log: [...state.log, `${getPS(state, owner).name} ${piece.id} → ${newPos}번 칸`],
  };

  if (passedStart) {
    const lapIncome = state.tiles.filter(t => t.owner === owner).reduce((sum, t) => sum + getLapIncome(t), 0);
    const ownerPS = getPS(newState, owner);
    newState = setPS(newState, owner, { gold: ownerPS.gold + LAP_GOLD_BONUS + lapIncome });

    let totalTileProduction = 0;
    const tileBreakdown: TroopComp = {};
    const tileDetails: Array<{ tileId: number; amount: number; troopType: TroopType }> = [];
    newState = {
      ...newState,
      tiles: newState.tiles.map(t => {
        if (t.owner !== owner || (t.type !== 'land' && t.type !== 'start_p' && t.type !== 'start_e') || t.troops === 0) return t;
        const produce = t.baseLapProduction + getLapTroops(t);
        totalTileProduction += produce;
        const dominant = dominantTroopType(t.garrison);
        tileBreakdown[dominant] = (tileBreakdown[dominant] ?? 0) + produce;
        tileDetails.push({ tileId: t.id, amount: produce, troopType: dominant });
        return { ...t, troops: t.troops + produce, garrison: addToComp(t.garrison, dominant, produce) };
      }),
      log: [...newState.log, `출발점 통과! 골드 +${LAP_GOLD_BONUS + lapIncome}, 영토 병력 생산 +${totalTileProduction}`],
    };

    const lapPiece = newState.pieces.find(p => p.id === piece.id)!;
    switch (lapPiece.characterType) {
      case 'agitator': {
        const t = randomTroopType();
        newState = {
          ...newState,
          pieces: newState.pieces.map(p => p.id === lapPiece.id
            ? { ...p, troops: p.troops + 2, composition: addToComp(p.composition, t, 2) }
            : p),
          log: [...newState.log, `선동가 스킬: ${TROOP_DATA[t].name} 2명 합류`],
        };
        break;
      }
      case 'warlock': {
        const enemies = newState.pieces.filter(p => p.owner !== owner && p.troops > 0);
        if (enemies.length > 0) {
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          const kill = Math.min(2, target.troops);
          newState = {
            ...newState,
            pieces: newState.pieces.map(p => p.id === target.id
              ? { ...p, troops: p.troops - kill, composition: removeFromComp(p.composition, kill) }
              : p),
            log: [...newState.log, `흑마술사 스킬: ${getPS(newState, target.owner).name} 병력 ${kill}명 저주`],
          };
        }
        break;
      }
      case 'smuggler': {
        const ps2 = getPS(newState, owner);
        newState = setPS({ ...newState, log: [...newState.log, '밀수꾼 스킬: 골드 +200'] }, owner, { gold: ps2.gold + 200 });
        break;
      }
      case 'cleric': {
        const ownedTiles = newState.tiles.filter(t => t.owner === owner && (t.type === 'land' || t.type === 'start_p' || t.type === 'start_e'));
        if (ownedTiles.length > 0) {
          const blessLog: string[] = [];
          let updatedTiles = [...newState.tiles];
          for (let i = 0; i < 3; i++) {
            const target = ownedTiles[Math.floor(Math.random() * ownedTiles.length)];
            const t = randomTroopType();
            updatedTiles = updatedTiles.map(tile => tile.id === target.id
              ? { ...tile, troops: tile.troops + 1, garrison: addToComp(tile.garrison, t, 1) }
              : tile);
            blessLog.push(`${target.id}번→${TROOP_DATA[t].name}`);
          }
          newState = { ...newState, tiles: updatedTiles, log: [...newState.log, `종교인 스킬: 영토에 병사 3명 분배 (${blessLog.join(', ')})`] };
        }
        break;
      }
      default:
        break;
    }

    if (owner === 'player') {
      newState = { ...newState, lapBonusAnim: { gold: LAP_GOLD_BONUS + lapIncome, troops: 0, tileProduction: totalTileProduction, tileBreakdown, tileDetails } };
    }
    newState = { ...newState, lapCount: newState.lapCount + 1 };

    if (newState.dragonPending && newState.lapCount >= newState.dragonPending.summonAtLap && !newState.dragon) {
      const spawnTile = newState.tiles
        .filter(t => t.owner && t.owner !== 'neutral' && t.type === 'land' && t.owner !== owner)
        .sort((a, b) => b.landPrice - a.landPrice)[0]
        ?? newState.tiles.filter(t => t.type === 'land').sort((a, b) => b.landPrice - a.landPrice)[0];
      if (spawnTile) {
        newState = {
          ...newState,
          dragon: { position: spawnTile.id, troops: 30 },
          dragonPending: null,
          log: [...newState.log, `🐉 드래곤이 ${spawnTile.id}번 땅에 출현했다!`],
        };
      }
    }
  }

  const passQueue: Array<{ tileId: number; troops: number; garrison: TroopComp }> = [];
  for (const tileId of passedTileIds) {
    const tile = newState.tiles.find(t => t.id === tileId);
    if (tile && tile.owner === owner && tile.troops > 0) {
      passQueue.push({ tileId, troops: tile.troops, garrison: { ...tile.garrison } });
    }
  }
  if (owner !== 'player' && passQueue.length > 0) {
    const totalCollected = passQueue.reduce((sum, q) => sum + q.troops, 0);
    const maxTroops = CHARACTERS[piece.characterType].maxTroops;
    const currentTroops = newState.pieces.find(p => p.id === piece.id)?.troops ?? 0;
    const canCollect = Math.min(totalCollected, maxTroops - currentTroops);
    if (canCollect > 0) {
      let collectedComp: TroopComp = {};
      for (const q of passQueue) collectedComp = mergeComp(collectedComp, q.garrison);
      newState = {
        ...newState,
        pieces: newState.pieces.map(p => p.id === piece.id
          ? { ...p, troops: p.troops + canCollect, composition: mergeComp(p.composition, scaleComp(collectedComp, canCollect)) }
          : p),
        tiles: newState.tiles.map(t =>
          passedTileIds.has(t.id) && t.owner === owner && t.troops > 0
            ? { ...t, troops: 0, garrison: {} }
            : t),
        log: [...newState.log, `이동 중 영토 통과 → ${canCollect}명 자동 징집`],
      };
    }
  }

  if (state.diceResult === 0 && piece.characterType === 'swindler') {
    const ps2 = getPS(newState, owner);
    newState = setPS({ ...newState, log: [...newState.log, '사기꾼 스킬: 주사위 0! 골드 +200'] }, owner, { gold: ps2.gold + 200 });
  }

  return handleTileLanding(newState, newPos, piece.id);
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {

    case 'START_DEPLOY': {
      const playerPiece = state.pieces.find(p => p.owner === 'player')!;
      const deployAmount = Math.min(action.deployAmount, playerPiece.troops - 1);
      let newPieces = state.pieces;
      let newTiles = state.tiles;

      if (deployAmount > 0) {
        const deployComp = scaleComp(playerPiece.composition, deployAmount);
        const remainComp = scaleComp(playerPiece.composition, playerPiece.troops - deployAmount);
        newPieces = newPieces.map(p => p.id === playerPiece.id
          ? { ...p, troops: playerPiece.troops - deployAmount, composition: remainComp } : p);
        newTiles = newTiles.map(t => t.id === playerPiece.startTileIndex
          ? { ...t, troops: deployAmount, garrison: deployComp } : t);
      }

      const aiOwners: PlayerType[] = ['ai', 'ai2', 'ai3'].filter(o =>
        newPieces.some(p => p.owner === o)
      ) as PlayerType[];

      for (const aiOwner of aiOwners) {
        const aiPiece = newPieces.find(p => p.owner === aiOwner);
        if (!aiPiece) continue;
        const aiDeploy = Math.floor(aiPiece.troops * 0.3);
        if (aiDeploy > 0) {
          const aiDeployComp = scaleComp(aiPiece.composition, aiDeploy);
          const aiRemainComp = scaleComp(aiPiece.composition, aiPiece.troops - aiDeploy);
          newPieces = newPieces.map(p => p.id === aiPiece.id
            ? { ...p, troops: aiPiece.troops - aiDeploy, composition: aiRemainComp } : p);
          newTiles = newTiles.map(t => t.id === aiPiece.startTileIndex
            ? { ...t, troops: aiDeploy, garrison: aiDeployComp } : t);
        }
      }

      return { ...state, pieces: newPieces, tiles: newTiles, turnPhase: 'roll' };
    }

    case 'ROLL_DICE': {
      const owner = state.currentTurn;
      const ownerPS = getPS(state, owner);
      const bonus = ownerPS.diceBonusTurns > 0 ? ownerPS.diceBonusAmount : 0;
      const d1 = Math.floor(Math.random() * 4); // 0-3 (d4)
      const d2 = Math.floor(Math.random() * 4); // 0-3 (d4)
      const isDoubles = d1 === d2;
      const dice = d1 + d2 + bonus;
      return setPS({
        ...state,
        diceResult: dice,
        dice1: d1,
        dice2: d2,
        bonusRoll: isDoubles,
        turnPhase: 'select_piece',
      }, owner, { diceBonusTurns: Math.max(0, ownerPS.diceBonusTurns - 1) });
    }

    case 'SELECT_PIECE': {
      const piece = state.pieces.find(p => p.id === action.pieceId);
      if (!piece) return state;
      const steps = state.diceResult!;
      const newPos = nextPosition(piece.position, steps);
      return resolvePieceMove(state, action.pieceId, newPos, steps, true);
    }

    case 'CHOOSE_FIGHT': {
      const tile = state.tiles.find(t => t.id === action.tileId)!;
      const owner = state.currentTurn;

      return executeBattle(state, action.tileId);
    }

    case 'SKIP_DEFEND': {
      if (state.pendingBattleTileId === null) return state;
      return executeBattle(state, state.pendingBattleTileId);
    }

    case 'CHOOSE_MOVE_TILE': {
      const piece = state.pieces.find(p => p.owner === 'player' && p.id === state.selectedPieceId)
        ?? state.pieces.find(p => p.owner === 'player');
      if (!piece) return state;
      const newPieces = state.pieces.map(p => p.id === piece.id ? { ...p, position: action.tileId } : p);
      return handleTileLanding({ ...state, pieces: newPieces }, action.tileId, piece.id);
    }

    case 'CLEAR_LAP_BONUS': {
      return { ...state, lapBonusAnim: null };
    }

    case 'BUY_MERCENARY': {
      const owner = state.currentTurn;
      const ownerPS = getPS(state, owner);
      const MERC_COST = 400;
      if (ownerPS.gold < MERC_COST || state.mercenaryResult !== null) return state;
      const troopPool: TroopType[] = ['swordsman', 'archer', 'cavalry', 'spearman', 'swordsman', 'archer', 'cavalry', 'spearman', 'assassin', 'berserker'];
      const troopType = troopPool[Math.floor(Math.random() * troopPool.length)];
      const r = Math.random();
      const amount = Math.floor(r * r * r * r * 7) + 2;
      // Auto-join the piece immediately
      const piece = state.pieces.find(p => p.owner === owner && p.id === state.selectedPieceId)
        ?? state.pieces.find(p => p.owner === owner && p.troops > 0)
        ?? state.pieces.find(p => p.owner === owner)!;
      return setPS({
        ...state,
        pieces: state.pieces.map(p => p.id === piece.id
          ? { ...p, troops: p.troops + amount, composition: addToComp(p.composition, troopType, amount) }
          : p),
        mercenaryResult: { troopType, amount },
        log: [...state.log, `${ownerPS.name} 용병 ${TROOP_DATA[troopType].name} ${amount}명 계약 → 말에 합류`],
      }, owner, { gold: ownerPS.gold - MERC_COST });
    }

    case 'CLOSE_MERCENARY': {
      return { ...state, turnPhase: 'end_turn', mercenaryResult: null };
    }

    case 'CONFIRM_PASS_COLLECT': {
      const queue = state.passCollectQueue!;
      const piece = state.pieces.find(p => p.id === state.selectedPieceId)!;
      const maxTr = CHARACTERS[piece.characterType].maxTroops;
      const totalAvailable = queue.reduce((sum, q) => sum + q.troops, 0);
      const maxCollect = Math.min(totalAvailable, maxTr - piece.troops);
      const canCollect = Math.min(action.amount ?? maxCollect, maxCollect);
      let newState = { ...state, passCollectQueue: null };
      if (canCollect > 0) {
        // Take from tiles in order until canCollect is reached
        let remaining = canCollect;
        const tileChanges = new Map<number, number>();
        let collectedComp: TroopComp = {};
        for (const q of queue) {
          if (remaining <= 0) break;
          const take = Math.min(q.troops, remaining);
          tileChanges.set(q.tileId, take);
          collectedComp = mergeComp(collectedComp, scaleComp(q.garrison, take));
          remaining -= take;
        }
        newState = {
          ...newState,
          pieces: newState.pieces.map(p => p.id === piece.id
            ? { ...p, troops: p.troops + canCollect, composition: mergeComp(p.composition, collectedComp) }
            : p),
          tiles: newState.tiles.map(t => {
            const taken = tileChanges.get(t.id);
            if (taken === undefined) return t;
            const newTroops = t.troops - taken;
            return { ...t, troops: newTroops, garrison: newTroops === 0 ? {} : scaleComp(t.garrison, newTroops) };
          }),
          log: [...newState.log, `이동 중 영토 통과 → ${canCollect}명 징집`],
        };
      }
      return newState;
    }

    case 'SKIP_PASS_COLLECT':
      return { ...state, passCollectQueue: null };

    case 'STOP_AT_TILE': {
      const piece = state.pieces.find(p => p.id === state.selectedPieceId)!;
      const stepsToStop = (action.tileId - piece.position + state.tiles.length) % state.tiles.length;
      return resolvePieceMove({ ...state, pendingStopTiles: null }, piece.id, action.tileId, stepsToStop, false);
    }

    case 'CONTINUE_MOVE': {
      const piece = state.pieces.find(p => p.id === state.selectedPieceId)!;
      const pendingStop = state.pendingStopTiles?.[0];
      if (!pendingStop) return state;
      return resolvePieceMove({ ...state, pendingStopTiles: null }, piece.id, pendingStop.finalTileId, pendingStop.steps, false);
    }

    case 'BATTLE_FINISH': {
      const battle = state.activeBattle!;
      const owner = state.currentTurn;
      const attackerPiece = state.pieces.find(p => p.id === battle.attackerPieceId)!;
      const defenderTile = state.tiles.find(t => t.id === battle.defenderTileId)!;
      const defendingPiece = battle.defenderPieceId
        ? state.pieces.find(p => p.id === battle.defenderPieceId)
        : undefined;

      // Reset defense boost after battle
      let stateAfterBattle = setPS(state, 'player', { defenseBoostMultiplier: 1 });

      // Dragon battle aftermath
      if (battle.isDragonBattle) {
        const dragon = state.dragon!;
        if (battle.result === 'attacker_wins') {
          const scaledComp = scaleComp(attackerPiece.composition, battle.attackerTroops);
          const rewardGold = 800;
          const rewardType = randomTroopType();
          const rewardTroops = 5;
          let victoryState: GameState = {
            ...stateAfterBattle,
            activeBattle: null,
            dragon: null,
            pieces: stateAfterBattle.pieces.map(p => p.id === attackerPiece.id
              ? { ...p, troops: battle.attackerTroops + rewardTroops, composition: addToComp(scaledComp, rewardType, rewardTroops) }
              : p),
            turnPhase: 'end_turn' as const,
            log: [...stateAfterBattle.log, `🐉 드래곤 처치! 보상: 골드 +${rewardGold}, ${TROOP_DATA[rewardType].name} ${rewardTroops}명`],
          };
          victoryState = setPS(victoryState, owner, { gold: getPS(victoryState, owner).gold + rewardGold });
          return victoryState;
        } else {
          // Dragon wins — attacker retreats, dragon troops updated
          const newPieces = stateAfterBattle.pieces.map(p => p.id === attackerPiece.id
            ? { ...p, troops: 0, composition: {}, position: attackerPiece.startTileIndex }
            : p);
          return {
            ...stateAfterBattle,
            activeBattle: null,
            dragon: { ...dragon, troops: battle.defenderTroops },
            pieces: newPieces,
            turnPhase: 'end_turn' as const,
            log: [...stateAfterBattle.log, `🐉 드래곤에게 패배! 병력이 전멸했다.`],
          };
        }
      }

      if (battle.result === 'attacker_wins') {
        const scaledComp = scaleComp(attackerPiece.composition, battle.attackerTroops);
        let newPieces = stateAfterBattle.pieces.map(p => p.id === attackerPiece.id
          ? { ...p, troops: battle.attackerTroops, composition: scaledComp }
          : p);
        if (defendingPiece) {
          newPieces = newPieces.map(p => p.id === defendingPiece.id
            ? { ...p, troops: 0, composition: {}, position: defendingPiece.startTileIndex }
            : p);
        }
        const capturedPiece = !!defendingPiece && battle.defenderTroopsFromPiece > 0;
        // Auto-deploy base troops on capture, player can add more in deploy phase
        const baseGarrison: TroopComp = { swordsman: CAPTURE_BASE_TROOPS };
        const tilesWithBase = stateAfterBattle.tiles.map(t =>
          t.id === battle.defenderTileId
            ? { ...t, owner, troops: CAPTURE_BASE_TROOPS, garrison: baseGarrison }
            : t
        );
        let victoryState: GameState = {
          ...stateAfterBattle,
          activeBattle: null,
          pieces: newPieces,
          tiles: tilesWithBase,
          activeDeployTileId: battle.defenderTileId,
          bonusRoll: state.bonusRoll || capturedPiece,
          turnPhase: 'deploy' as const,
          log: [...stateAfterBattle.log, `${getPS(state, owner).name} 전투 승리! ${battle.defenderTileId}번 땅 점령 (기본 ${CAPTURE_BASE_TROOPS}명 배치)${capturedPiece ? ' · 보너스 턴!' : ''}`],
        };
        // Character battle victory skills
        if (attackerPiece.characterType === 'general') {
          const t = randomTroopType();
          victoryState = { ...victoryState,
            pieces: victoryState.pieces.map(p => p.id === attackerPiece.id
              ? { ...p, troops: p.troops + 1, composition: addToComp(p.composition, t, 1) } : p),
            log: [...victoryState.log, `장군 스킬: 전리품 ${TROOP_DATA[t].name} 1명 획득`] };
        } else if (attackerPiece.characterType === 'pirate') {
          const ps2 = getPS(victoryState, owner);
          victoryState = setPS({ ...victoryState, log: [...victoryState.log, `해적 스킬: 약탈 골드 +100`] }, owner, { gold: ps2.gold + 100 });
        }
        return victoryState;
      } else {
        const initialDefTotal = battle.rounds.length > 0
          ? battle.rounds[0].defenderTroopsBefore
          : battle.defenderTroops;
        const defenderRemaining = battle.defenderTroops;

        // Battle defeat = pay toll to tile owner (war reparations)
        const defTileOwner = defenderTile.owner && defenderTile.owner !== 'neutral' ? defenderTile.owner as PlayerType : null;
        const defTileOwnerPS = defTileOwner ? getPS(stateAfterBattle, defTileOwner) : null;
        const tollDouble = defTileOwnerPS ? defTileOwnerPS.tollDoubleLaps > 0 : false;
        const penalty = getToll(defenderTile, tollDouble, state.lapCount);

        let newTiles = stateAfterBattle.tiles;
        let newPieces = stateAfterBattle.pieces.map(p => p.id === attackerPiece.id
          ? { ...p, troops: 0, composition: {}, position: attackerPiece.startTileIndex }
          : p);

        if (defendingPiece && battle.defenderTroopsFromPiece > 0 && initialDefTotal > 0) {
          const pieceShare = Math.round(defenderRemaining * (battle.defenderTroopsFromPiece / initialDefTotal));
          const tileShare = defenderRemaining - pieceShare;
          newPieces = newPieces.map(p => p.id === defendingPiece.id
            ? { ...p, troops: Math.max(0, pieceShare), composition: scaleComp(p.composition, Math.max(0, pieceShare)) }
            : p);
          newTiles = newTiles.map(t => t.id === battle.defenderTileId
            ? { ...t, troops: Math.max(0, tileShare), garrison: scaleComp(t.garrison, Math.max(0, tileShare)) }
            : t);
        } else {
          newTiles = newTiles.map(t => t.id === battle.defenderTileId
            ? { ...t, troops: defenderRemaining, garrison: scaleComp(defenderTile.garrison, defenderRemaining) }
            : t);
        }

        const attackerGoldBefore = getPS(stateAfterBattle, owner).gold;
        const actualPaid = Math.min(penalty, attackerGoldBefore);
        let newState = setPS({
          ...stateAfterBattle,
          activeBattle: null,
          pieces: newPieces,
          tiles: newTiles,
          turnPhase: 'end_turn' as const,
          log: [...stateAfterBattle.log, `${getPS(state, owner).name} 전투 패배. 통행세 ${actualPaid}골드 납부`],
        }, owner, { gold: Math.max(0, attackerGoldBefore - penalty) });

        // Give toll to tile owner
        if (defTileOwner && defTileOwner !== owner) {
          newState = setPS(newState, defTileOwner, { gold: getPS(newState, defTileOwner).gold + actualPaid });
        }
        return checkBankruptcy(newState);
      }
    }

    case 'DEPLOY_TROOPS': {
      const piece = state.pieces.find(p => p.id === state.selectedPieceId)!;
      const owner = state.currentTurn;
      const deployed = totalComp(action.garrison);
      const existingTile = state.tiles.find(t => t.id === action.tileId)!;
      // Skip deploy but tile already owned via auto-produce — just end turn
      if (deployed <= 0) return { ...state, activeDeployTileId: null, turnPhase: 'end_turn' };
      const subtracted: TroopComp = {};
      (Object.keys(action.garrison) as TroopType[]).forEach(t => {
        subtracted[t] = (piece.composition[t] ?? 0) - (action.garrison[t] ?? 0);
      });
      const newComp: TroopComp = { ...piece.composition, ...subtracted };
      // Merge deployed troops with existing base garrison (auto-produced on capture)
      const mergedGarrison = mergeComp(existingTile.garrison, action.garrison);
      const totalTroops = existingTile.troops + deployed;
      const newTiles = state.tiles.map(t => t.id === action.tileId
        ? { ...t, owner, troops: totalTroops, garrison: mergedGarrison }
        : t
      );
      const newPieces = state.pieces.map(p => p.id === piece.id
        ? { ...p, troops: p.troops - deployed, composition: newComp }
        : p);
      return { ...state, tiles: newTiles, pieces: newPieces, activeDeployTileId: null, turnPhase: 'end_turn' };
    }

    case 'CHOOSE_BUY_LAND': {
      const tile = state.tiles.find(t => t.id === action.tileId)!;
      const owner = state.currentTurn;
      const cost = tile.landPrice || tile.troops * 80;
      if (getPS(state, owner).gold < cost) return state;
      const isEmpty = tile.troops === 0;
      const newTroops = isEmpty ? EMPTY_LAND_INITIAL_TROOPS : tile.troops;
      const newGarrison = isEmpty ? { swordsman: EMPTY_LAND_INITIAL_TROOPS } : tile.garrison;
      const newTiles = state.tiles.map(t => t.id === action.tileId
        ? { ...t, owner, troops: newTroops, garrison: newGarrison }
        : t);
      const logMsg = isEmpty ? `${action.tileId}번 땅 구매 (기본 병력 ${EMPTY_LAND_INITIAL_TROOPS}명 배치)` : `${action.tileId}번 땅 구매`;
      return setPS(
        { ...state, tiles: newTiles, activeTileAction: null, activeDeployTileId: action.tileId, turnPhase: 'deploy' as const, log: [...state.log, logMsg] },
        owner, { gold: getPS(state, owner).gold - cost }
      );
    }

    case 'CHOOSE_PAY_TOLL': {
      const tile = state.tiles.find(t => t.id === action.tileId)!;
      const owner = state.currentTurn;
      const tileOwner = tile.owner;
      const ownerPS = getPS(state, owner);
      const tileOwnerPS = tileOwner && tileOwner !== 'neutral' ? getPS(state, tileOwner as PlayerType) : null;
      const exempt = ownerPS.tollExemptTurns > 0;
      const tollDouble = tileOwnerPS ? tileOwnerPS.tollDoubleLaps > 0 : false;
      const toll = exempt ? 0 : getToll(tile, tollDouble, state.lapCount);
      if (!exempt && ownerPS.gold < toll) {
        return {
          ...state,
          activeTileAction: action.tileId,
          turnPhase: 'forced_sell' as const,
          log: [...state.log, `통행세 ${toll}골드 부족! 보유 땅을 팔아야 합니다.`],
        };
      }
      const toName = tileOwnerPS ? tileOwnerPS.name : null;
      let newState = setPS(state, owner, {
        gold: ownerPS.gold - toll,
        tollExemptTurns: Math.max(0, ownerPS.tollExemptTurns - 1),
      });
      if (tileOwnerPS && tileOwner !== owner) {
        newState = setPS(newState, tileOwner as PlayerType, { gold: getPS(newState, tileOwner as PlayerType).gold + toll });
      }
      newState = {
        ...newState,
        activeTileAction: null,
        turnPhase: 'end_turn',
        tollPayAnim: toName && toll > 0 ? { amount: toll, to: toName } : null,
        log: [...newState.log, `통행세 ${toll}골드 납부`],
      };
      return checkBankruptcy(newState);
    }

    case 'CHOOSE_PASS': {
      return { ...state, activeTileAction: null, turnPhase: 'end_turn' };
    }

    case 'SELL_LAND': {
      const tile = state.tiles.find(t => t.id === action.tileId)!;
      const owner = state.currentTurn;
      const sellPrice = Math.floor(tile.landPrice * 0.6);
      return setPS(
        {
          ...state,
          tiles: state.tiles.map(t => t.id === action.tileId
            ? { ...t, owner: 'neutral' as const, garrison: {}, buildings: {} }
            : t),
          log: [...state.log, `${getPS(state, owner).name} ${action.tileId}번 땅 매각 (+${sellPrice}골드)`],
        },
        owner, { gold: getPS(state, owner).gold + sellPrice }
      );
    }

    case 'CONFIRM_FORCED_SELL': {
      const tileId = state.activeTileAction!;
      const tile = state.tiles.find(t => t.id === tileId)!;
      const owner = state.currentTurn;
      const tileOwner = tile.owner;
      const tileOwnerPS = tileOwner && tileOwner !== 'neutral' ? getPS(state, tileOwner as PlayerType) : null;
      const tollDouble = tileOwnerPS ? tileOwnerPS.tollDoubleLaps > 0 : false;
      const toll = getToll(tile, tollDouble, state.lapCount);
      let newState = setPS(state, owner, { gold: getPS(state, owner).gold - toll });
      if (tileOwnerPS && tileOwner !== owner) {
        newState = setPS(newState, tileOwner as PlayerType, { gold: getPS(newState, tileOwner as PlayerType).gold + toll });
      }
      const toNameForced = tileOwnerPS ? tileOwnerPS.name : null;
      newState = {
        ...newState,
        activeTileAction: null,
        turnPhase: 'end_turn',
        tollPayAnim: toNameForced && toll > 0 ? { amount: toll, to: toNameForced } : null,
        log: [...newState.log, `통행세 ${toll}골드 납부 완료`],
      };
      return checkBankruptcy(newState);
    }

    case 'COLLECT_TROOPS': {
      const tile = state.tiles.find(t => t.id === action.tileId)!;
      const owner = state.currentTurn;
      const piece = state.pieces.find(p => p.id === state.selectedPieceId && p.owner === owner)
        ?? state.pieces.find(p => p.owner === owner && p.troops > 0)!;
      const maxTroops = CHARACTERS[piece.characterType].maxTroops;
      const canCollect = Math.min(action.amount ?? tile.troops, tile.troops, maxTroops - piece.troops);
      const nextPhase = state.turnPhase === 'build' ? 'end_turn' as const : state.turnPhase;
      if (canCollect <= 0) return { ...state, activeTileAction: null, turnPhase: nextPhase };
      const collectComp = scaleComp(tile.garrison, canCollect);
      const remainComp = scaleComp(tile.garrison, tile.troops - canCollect);
      const mergedComp: TroopComp = { ...piece.composition };
      (Object.keys(collectComp) as TroopType[]).forEach(t => {
        mergedComp[t] = (mergedComp[t] ?? 0) + (collectComp[t] ?? 0);
      });
      return {
        ...state,
        pieces: state.pieces.map(p => p.id === piece.id
          ? { ...p, troops: p.troops + canCollect, composition: mergedComp }
          : p),
        tiles: state.tiles.map(t => t.id === action.tileId
          ? { ...t, troops: t.troops - canCollect, garrison: remainComp }
          : t),
        activeTileAction: null,
        turnPhase: nextPhase,
        log: [...state.log, `${getPS(state, owner).name} ${action.tileId}번 땅 병력 ${canCollect}명 징집`],
      };
    }

    case 'BUILD': {
      const tile = state.tiles.find(t => t.id === action.tileId)!;
      const owner = state.currentTurn;
      const ownerPS = getPS(state, owner);
      const isFree = ownerPS.freeBuildNext;
      const discount = ownerPS.buildDiscountLaps > 0;
      const cost = isFree ? 0 : getBuildCost(tile, action.buildingType, discount);
      if (ownerPS.gold < cost) return state;
      const newLevel = (tile.buildings?.[action.buildingType] ?? 0) + 1;
      const newTiles = state.tiles.map(t => t.id === action.tileId
        ? { ...t, buildings: { ...t.buildings, [action.buildingType]: newLevel } }
        : t);
      return setPS({ ...state, tiles: newTiles, turnPhase: 'end_turn' as const }, owner, { gold: ownerPS.gold - cost, freeBuildNext: false });
    }

    case 'SKIP_BUILD': {
      return { ...state, turnPhase: 'end_turn' };
    }

    case 'BUY_TROOPS': {
      const piece = state.pieces.find(p => p.id === action.pieceId)!;
      const owner = piece.owner;
      const ownerPS = getPS(state, owner);
      const troopData = TROOP_DATA[action.troopType];
      const priceScale = 1 + ownerPS.troopBuyCount * TROOP_PRICE_SCALE;
      const unitCost = Math.ceil(troopData.price * priceScale);
      if (action.tileId !== undefined) {
        // Deploy directly to tile garrison
        const canBuy = Math.min(action.amount, Math.floor(ownerPS.gold / unitCost));
        if (canBuy <= 0) return state;
        return setPS(
          {
            ...state,
            tiles: state.tiles.map(t => t.id === action.tileId
              ? { ...t, troops: t.troops + canBuy, garrison: addToComp(t.garrison, action.troopType, canBuy) }
              : t),
          },
          owner, { gold: ownerPS.gold - canBuy * unitCost, troopBuyCount: ownerPS.troopBuyCount + 1 }
        );
      }
      const maxTroops = CHARACTERS[piece.characterType].maxTroops;
      const canBuy = Math.min(action.amount, Math.floor(ownerPS.gold / unitCost), maxTroops - piece.troops);
      if (canBuy <= 0) return state;
      return setPS(
        {
          ...state,
          pieces: state.pieces.map(p => p.id === piece.id
            ? { ...p, troops: p.troops + canBuy, composition: addToComp(p.composition, action.troopType, canBuy) }
            : p),
        },
        owner, { gold: ownerPS.gold - canBuy * unitCost, troopBuyCount: ownerPS.troopBuyCount + 1 }
      );
    }

    case 'BUY_PIECE': {
      const owner = state.currentTurn;
      const ownerPS = getPS(state, owner);
      const baseCost = nextHireCost(ownerPS.pieceCount);
      const activePiece = state.pieces.find(p => p.id === state.selectedPieceId && p.owner === owner);
      const cost = Math.floor(baseCost);
      if (ownerPS.gold < cost) return state;
      const newId = `${owner[0]}${ownerPS.pieceCount}`;
      const startIdx = owner === 'player' ? PLAYER_START : owner === 'ai' ? AI_START : owner === 'ai2' ? AI2_START : AI3_START;
      const spawnPos = activePiece ? activePiece.position : startIdx;
      const newPiece = { ...createPiece(newId, owner, action.characterType, startIdx), position: spawnPos, troops: 3, composition: { swordsman: 3 } };
      return setPS(
        { ...state, pieces: [...state.pieces, newPiece] },
        owner, { gold: ownerPS.gold - cost, pieceCount: ownerPS.pieceCount + 1 }
      );
    }

    case 'OPEN_SHOP': {
      if (!['roll', 'select_piece', 'tile_event'].includes(state.turnPhase)) return state;
      return { ...state, turnPhase: 'shop' };
    }

    case 'CLOSE_SHOP': {
      // If shop was opened manually (no tile action), return to roll; else end turn
      const returnPhase = state.activeTileAction === null ? 'roll' as const : 'end_turn' as const;
      return { ...state, turnPhase: returnPhase };
    }

    case 'APPLY_EVENT_CARD': {
      // Effect already applied when card was drawn; just clear and end turn
      // (move_to_tile / move_to_shop are the only exceptions — handled in case 'chance')
      if (!state.activeEvent) return state;
      const e = state.activeEvent.effect;
      if (e.kind === 'move_to_tile') return { ...state, activeEvent: null, turnPhase: 'choose_move_tile' };
      if (e.kind === 'move_to_shop') return { ...state, activeEvent: null, turnPhase: 'shop' };
      return { ...state, activeEvent: null, turnPhase: 'end_turn' };
    }

    case 'END_TURN': {
      // Dragon autonomous movement (once per turn)
      let endState = state;
      if (endState.dragon && endState.dragon.troops > 0) {
        const dragonRoll = Math.floor(Math.random() * 3) + 1; // 1-3 steps
        const newDragonPos = nextPosition(endState.dragon.position, dragonRoll);
        let dragon: DragonState = { ...endState.dragon, position: newDragonPos };
        const dragonTile = endState.tiles.find(t => t.id === newDragonPos)!;
        let newTiles = endState.tiles;
        let dragonLog = `🐉 드래곤이 ${newDragonPos}번 칸으로 이동`;

        if (dragonTile.troops > 0) {
          // Dragon vs garrison — one round of combat
          const garrisonDef = getGarrisonDefense(dragonTile.garrison, dragonTile.troops, getBuildingDefenseBonus(dragonTile));
          const garrisonAtk = getGarrisonAttack(dragonTile.garrison, dragonTile.troops, getBuildingAttackBonus(dragonTile));
          const dragonDmg = Math.max(1, Math.ceil(dragon.troops * DRAGON_ATK * 0.35 / garrisonDef));
          const garrisonDmg = Math.max(1, Math.ceil(dragonTile.troops * garrisonAtk * 0.35 / DRAGON_DEF));
          const newDragonTroops = Math.max(0, dragon.troops - garrisonDmg);
          const newGarrisonTroops = Math.max(0, dragonTile.troops - dragonDmg);
          dragon = { ...dragon, troops: newDragonTroops };
          newTiles = newTiles.map(t => t.id === newDragonPos
            ? { ...t, troops: newGarrisonTroops, garrison: newGarrisonTroops === 0 ? {} : scaleComp(t.garrison, newGarrisonTroops) }
            : t);
          dragonLog += ` — 수비대 침공! 드래곤 -${garrisonDmg}명, 수비대 -${dragonDmg}명`;
        }

        endState = { ...endState, tiles: newTiles, log: [...endState.log, dragonLog] };
        if (dragon.troops <= 0) {
          endState = { ...endState, dragon: null, log: [...endState.log, `🐉 드래곤이 쓰러졌다!`] };
        } else {
          endState = { ...endState, dragon };
        }
      }

      if (endState.bonusRoll) {
        return {
          ...endState,
          turnPhase: 'roll',
          diceResult: null,
          dice1: null,
          dice2: null,
          bonusRoll: false,
          selectedPieceId: null,
          activeTileAction: null,
          lapBonusAnim: null,
          passCollectQueue: null,
          pendingStopTiles: null,
          tollPayAnim: null,
          log: [...endState.log, `${getPS(endState, endState.currentTurn).name} 보너스 턴 획득!`],
        };
      }
      const activePlayers: PlayerType[] = ['player', 'ai'];
      if (endState.playerCount >= 3) activePlayers.push('ai2');
      if (endState.playerCount >= 4) activePlayers.push('ai3');
      const idx = activePlayers.indexOf(endState.currentTurn);
      const next = activePlayers[(idx + 1) % activePlayers.length];
      return {
        ...endState,
        currentTurn: next,
        turnPhase: 'roll',
        diceResult: null,
        dice1: null,
        dice2: null,
        bonusRoll: false,
        selectedPieceId: null,
        activeTileAction: null,
        lapBonusAnim: null,
        passCollectQueue: null,
        pendingStopTiles: null,
        tollPayAnim: null,
      };
    }

    default:
      return state;
  }
}

function handleTileLanding(state: GameState, tileId: number, _pieceId: string): GameState {
  const tile = state.tiles.find(t => t.id === tileId)!;
  const owner = state.currentTurn;

  // Dragon encounter — takes priority over normal tile logic
  if (state.dragon && state.dragon.position === tileId && state.dragon.troops > 0) {
    return executeDragonBattle(state);
  }

  if (tile.type === 'start_p' || tile.type === 'start_e') {
    if (tile.owner === owner) return { ...state, activeTileAction: tileId, turnPhase: 'build' };
    if (tile.troops > 0 || (tile.owner && tile.owner !== 'neutral')) {
      return { ...state, activeTileAction: tileId, turnPhase: 'tile_event' };
    }
    return { ...state, turnPhase: 'end_turn' };
  }

  switch (tile.type) {
    case 'land': {
      if (tile.owner === null || tile.owner === 'neutral') {
        return { ...state, activeTileAction: tileId, turnPhase: 'tile_event' };
      }
      if (tile.owner === owner) {
        return { ...state, activeTileAction: tileId, activeDeployTileId: tileId, turnPhase: 'build' };
      }
      return { ...state, activeTileAction: tileId, turnPhase: 'tile_event' };
    }

    case 'mercenary':
      return { ...state, turnPhase: 'mercenary' };

    case 'chance': {
      const card = CHANCE_CARDS[Math.floor(Math.random() * CHANCE_CARDS.length)];
      const e = card.effect;
      // move_to_tile / move_to_shop: apply on confirm so the player can see the card first
      if (e.kind === 'move_to_tile' || e.kind === 'move_to_shop') {
        return { ...state, activeEvent: card, turnPhase: 'event_card',
          log: [...state.log, `찬스 카드: ${card.text}`] };
      }
      // All other cards: apply immediately, show result in EventModal
      const applied = applyEventCardEffect(
        { ...state, log: [...state.log, `찬스 카드: ${card.text}`] }, card
      );
      if (owner !== 'player') return { ...applied, turnPhase: 'end_turn' };
      return { ...applied, activeEvent: card, turnPhase: 'event_card' };
    }

    default:
      return { ...state, turnPhase: 'end_turn' };
  }
}

function applyEventCardEffect(state: GameState, card: EventCard): GameState {
  const owner = state.currentTurn;
  const effect = card.effect;
  let newState: GameState = state;

  switch (effect.kind) {
    case 'gold':
      if (effect.target === 'all') {
        const allPlayers: PlayerType[] = ['player', 'ai'];
        if (newState.ai2) allPlayers.push('ai2');
        if (newState.ai3) allPlayers.push('ai3');
        for (const pid of allPlayers) {
          newState = setPS(newState, pid, { gold: getPS(newState, pid).gold + effect.amount });
        }
      } else {
        newState = setPS(newState, owner, { gold: getPS(newState, owner).gold + effect.amount });
      }
      break;
    case 'troops': {
      const activePiece = newState.pieces.filter(p => p.owner === owner)[0];
      if (activePiece) {
        const maxTroops = CHARACTERS[activePiece.characterType].maxTroops;
        newState = { ...newState, pieces: newState.pieces.map(p => p.id === activePiece.id ? { ...p, troops: Math.min(maxTroops, p.troops + effect.amount) } : p) };
      }
      break;
    }
    case 'attack_boost':
      newState = setPS(newState, owner, { attackBoostActive: true });
      break;
    case 'move_to_shop': {
      // Shop is no longer a board tile; open shop directly without moving
      newState = { ...newState, turnPhase: 'shop' };
      break;
    }
    case 'move_to_tile': {
      newState = { ...newState, turnPhase: 'choose_move_tile' };
      break;
    }
    case 'troop_boost': {
      const activePiece = newState.pieces.find(p => p.owner === owner && p.id === newState.selectedPieceId)
        ?? newState.pieces.find(p => p.owner === owner);
      if (activePiece) {
        const maxTroops = CHARACTERS[activePiece.characterType].maxTroops;
        const ownerPS = getPS(newState, owner);
        const canAfford = Math.floor(ownerPS.gold / effect.costPerTroop);
        const canFit = maxTroops - activePiece.troops;
        const amount = Math.min(effect.maxAmount, canAfford, canFit);
        if (amount > 0) {
          const cost = amount * effect.costPerTroop;
          newState = setPS(newState, owner, { gold: ownerPS.gold - cost });
          newState = { ...newState, pieces: newState.pieces.map(p => p.id === activePiece.id
            ? { ...p, troops: p.troops + amount, composition: addToComp(p.composition, 'swordsman', amount) }
            : p) };
          newState = { ...newState, log: [...newState.log, `용병 ${amount}명 고용 (${cost}골드)`] };
        }
      }
      break;
    }
    case 'tax_exempt':
      newState = setPS(newState, owner, { taxExemptTurns: 1 });
      break;
    case 'toll_exempt':
      newState = setPS(newState, owner, { tollExemptTurns: 1 });
      break;
    case 'toll_double':
      newState = setPS(newState, owner, { tollDoubleLaps: effect.laps });
      break;
    case 'build_discount':
      newState = setPS(newState, owner, { buildDiscountLaps: effect.laps });
      break;
    case 'reset_land': {
      const ownedLands = newState.tiles.filter(t => t.owner !== null && t.owner !== 'neutral' && t.type === 'land');
      if (ownedLands.length > 0) {
        const target = ownedLands[Math.floor(Math.random() * ownedLands.length)];
        const neutralTroops = Math.floor(Math.random() * 6) + 3;
        newState = { ...newState, tiles: newState.tiles.map(t => t.id === target.id ? { ...t, owner: 'neutral', troops: neutralTroops, buildings: {} } : t) };
      }
      break;
    }
    case 'dice_bonus':
      newState = setPS(newState, owner, { diceBonusTurns: 1, diceBonusAmount: effect.amount });
      break;
    case 'defense_reinforce': {
      // Add troops directly to the owner's first piece
      const activePiece = newState.pieces.find(p => p.owner === owner);
      if (activePiece) {
        const maxTroops = CHARACTERS[activePiece.characterType].maxTroops;
        newState = { ...newState, pieces: newState.pieces.map(p => p.id === activePiece.id
          ? { ...p, troops: Math.min(maxTroops, p.troops + effect.amount) } : p) };
        newState = { ...newState, log: [...newState.log, `지원군 ${effect.amount}명 합류!`] };
      }
      break;
    }
    case 'defense_boost':
      newState = setPS(newState, owner, { defenseBoostMultiplier: effect.multiplier });
      newState = { ...newState, log: [...newState.log, `수비력 ${effect.multiplier}배 강화 (다음 전투 적용)!`] };
      break;
    case 'garrison_reinforce': {
      const ownedTiles = newState.tiles.filter(t => t.owner === owner && (t.type === 'land' || t.type === 'start_p' || t.type === 'start_e'));
      if (ownedTiles.length > 0) {
        let updatedTiles = [...newState.tiles];
        for (let i = 0; i < effect.amount; i++) {
          const tgt = ownedTiles[Math.floor(Math.random() * ownedTiles.length)];
          const t = randomTroopType();
          updatedTiles = updatedTiles.map(tile => tile.id === tgt.id
            ? { ...tile, troops: tile.troops + 1, garrison: addToComp(tile.garrison, t, 1) } : tile);
        }
        newState = { ...newState, tiles: updatedTiles, log: [...newState.log, `증원군 ${effect.amount}명이 영토에 배치됨!`] };
      }
      break;
    }
    case 'free_build':
      newState = setPS(newState, owner, { freeBuildNext: true });
      newState = { ...newState, log: [...newState.log, `다음 건물 1채 무료 건설 가능!`] };
      break;
    case 'dragon_summon':
      if (!newState.dragon && !newState.dragonPending) {
        newState = { ...newState,
          dragonPending: { summonAtLap: newState.lapCount + 5 },
          log: [...newState.log, `🐉 드래곤의 각성! ${newState.lapCount + 5}바퀴 후 드래곤이 출현한다...`] };
      }
      break;
  }
  return newState;
}

function eliminatePlayer(state: GameState, id: PlayerType): GameState {
  // All lands owned by this player become neutral (troops reset to base, garrison cleared)
  const newTiles = state.tiles.map(t =>
    t.owner === id ? { ...t, owner: 'neutral' as const, garrison: {}, buildings: {} } : t
  );
  // All pieces return to start with 0 troops
  const newPieces = state.pieces.map(p =>
    p.owner === id ? { ...p, troops: 0, composition: {}, position: p.startTileIndex } : p
  );
  return { ...state, tiles: newTiles, pieces: newPieces };
}

function checkBankruptcy(state: GameState): GameState {
  if (state.player.gold < 0) {
    return { ...state, phase: 'gameover', winner: 'ai' };
  }
  // Eliminate individual AIs when they go broke
  let s = state;
  for (const id of ['ai', 'ai2', 'ai3'] as PlayerType[]) {
    const ps = id === 'ai' ? s.ai : id === 'ai2' ? s.ai2 : s.ai3;
    if (ps && ps.gold <= 0) {
      s = eliminatePlayer(s, id);
    }
  }
  const allAisBroke = s.ai.gold <= 0
    && (!s.ai2 || s.ai2.gold <= 0)
    && (!s.ai3 || s.ai3.gold <= 0);
  if (allAisBroke) return { ...s, phase: 'gameover', winner: 'player' };
  return s;
}
