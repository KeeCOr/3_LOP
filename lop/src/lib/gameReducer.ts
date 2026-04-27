import type { GameState, Piece, Tile, CharacterType, Difficulty, TroopComp, TroopType, PlayerState, PlayerType, EventCard, BattleState } from './gameTypes';
import { LAND_INDICES, PLAYER_START, AI_START, nextPosition, didPassStart } from './boardLayout';
import { CHARACTERS, TROOP_DATA, LAP_TROOP_BONUS, LAP_GOLD_BONUS, LAP_LAND_PRODUCTION, TROOP_PRICE_SCALE, nextHireCost, CHANCE_CARDS } from './gameData';
import { getToll, getLapIncome, getLapTroops, calcTax, getBuildCost, getBuildingAttackBonus, getBuildingDefenseBonus } from './economyUtils';
import { runFullBattle, getBattleAttack, getBattleDefense, getGarrisonAttack, getGarrisonDefense, counterMultiplier } from './battleEngine';

const AI2_START = 4;
const AI3_START = 11;
const BATTLE_DEFEAT_GOLD_PER_TROOP = 15;
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

function dominantTroopType(comp: TroopComp): TroopType {
  const entries = Object.entries(comp) as [TroopType, number][];
  if (entries.length === 0) return 'swordsman';
  return entries.reduce((a, b) => ((b[1] ?? 0) > (a[1] ?? 0) ? b : a))[0];
}

function createPiece(id: string, owner: PlayerType, characterType: CharacterType, startIndex: number): Piece {
  return { id, owner, characterType, position: startIndex, troops: 10, composition: { swordsman: 10 }, equipment: [], startTileIndex: startIndex };
}

function makePS(id: PlayerType, isHuman: boolean, name: string, goldBonus = 0): PlayerState {
  return {
    id, gold: 1500 + goldBonus, hireCost: 0, pieceCount: 1, attackBoostActive: false,
    taxExemptTurns: 0, tollExemptTurns: 0, tollDoubleLaps: 0, buildDiscountLaps: 0,
    diceBonusTurns: 0, diceBonusAmount: 0, isHuman, name, cardSlot: [],
    troopBuyCount: 0, defenseBoostMultiplier: 1,
  };
}

// Tier 1 (cheap): 1,2 | Tier 2 (mid): 4,6,8 | Tier 3 (premium): 9,11,13
const TILE_TIER: Record<number, 1 | 2 | 3> = { 1: 1, 2: 1, 4: 2, 6: 2, 8: 2, 9: 3, 11: 3, 13: 3 };
const TIER_PRICE = { 1: 200, 2: 400, 3: 650 };
const TIER_BASE_TOLL = { 1: 40, 2: 80, 3: 130 };
const TIER_TROOP_RANGE: Record<1|2|3, [number,number]> = { 1: [3,6], 2: [5,9], 3: [7,12] };

const START_INITIAL_TROOPS = 12;
const START_BASE_TOLL = 200;

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
    const landPrice = tier ? TIER_PRICE[tier] : 0;
    const baseToll = isStartTile ? START_BASE_TOLL : (tier ? TIER_BASE_TOLL[tier] : 0);
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
    const garrison = troops > 0
      ? { spearman: Math.ceil(troops * 0.4), swordsman: Math.floor(troops * 0.6) }
      : {};
    return {
      id: i, type: tileType, owner: startOwner, troops, garrison,
      building: null, buildingLevel: 0, landPrice, baseToll,
    } as Tile;
  });
}

export function createInitialState(characterType: CharacterType, difficulty: Difficulty, playerCount: 2 | 3 | 4 = 2): GameState {
  const merchantBonus = characterType === 'merchant' ? 200 : 0;
  const pieces: Piece[] = [
    createPiece('p0', 'player', characterType, PLAYER_START),
    createPiece('e0', 'ai', 'general', AI_START),
  ];
  if (playerCount >= 3) pieces.push(createPiece('e1', 'ai2', 'knight', AI2_START));
  if (playerCount >= 4) pieces.push(createPiece('e2', 'ai3', 'merchant', AI3_START));

  return {
    phase: 'board',
    turnPhase: 'start_deploy',
    currentTurn: 'player',
    difficulty,
    playerCount,
    player: makePS('player', true, '플레이어', merchantBonus),
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
    pendingBattleTileId: null,
    mercenaryResult: null,
    lapCount: 0,
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
  | { type: 'BUILD'; tileId: number; buildingType: 'vault' | 'barracks' | 'fort' }
  | { type: 'SKIP_BUILD' }
  | { type: 'BUY_TROOPS'; pieceId: string; troopType: TroopType; amount: number }
  | { type: 'BUY_PIECE'; characterType: CharacterType }
  | { type: 'OPEN_SHOP' }
  | { type: 'CLOSE_SHOP' }
  | { type: 'APPLY_EVENT_CARD' }
  | { type: 'USE_EVENT_CARD'; cardId: string }
  | { type: 'CLEAR_LAP_BONUS' }
  | { type: 'BUY_MERCENARY' }
  | { type: 'CLOSE_MERCENARY' }
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
  const atkCounterMod = counterMultiplier(piece.composition, piece.troops, combinedGarrison, combinedDefTroops);
  const defCounterMod = counterMultiplier(combinedGarrison, combinedDefTroops, piece.composition, piece.troops);
  const defBoostMult = defenderOwner === 'player' ? state.player.defenseBoostMultiplier : 1;

  const setup: BattleState = {
    attackerPieceId: piece.id,
    defenderTileId: tile.id,
    defenderPieceId: defendingPiece?.id ?? null,
    attackerTroops: piece.troops,
    defenderTroops: combinedDefTroops,
    defenderTroopsFromPiece: defendingPiece?.troops ?? 0,
    attackerAttack: getBattleAttack(piece) * atkBoost * atkCounterMod,
    attackerDefense: getBattleDefense(piece),
    defenderAttack: getGarrisonAttack(combinedGarrison, combinedDefTroops, getBuildingAttackBonus(tile)) * defCounterMod,
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
      const d1 = Math.floor(Math.random() * 4) + 1;
      const d2 = Math.floor(Math.random() * 4) + 1;
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
      const dice = state.diceResult!;
      const charMoveBonus = CHARACTERS[piece.characterType].moveBonus;
      const equipMoveBonus = piece.equipment.reduce((acc, e) => acc + e.moveBonus, 0);
      const steps = dice + charMoveBonus + equipMoveBonus;
      const newPos = nextPosition(piece.position, steps);
      const owner = state.currentTurn;
      const passedStart = didPassStart(piece.position, steps, piece.startTileIndex);

      let newState: GameState = {
        ...state,
        pieces: state.pieces.map(p => p.id === piece.id ? { ...p, position: newPos } : p),
        selectedPieceId: piece.id,
        log: [...state.log, `${getPS(state, owner).name} ${piece.id} → ${newPos}번 칸`],
      };

      if (passedStart) {
        const lapIncome = state.tiles.filter(t => t.owner === owner).reduce((sum, t) => sum + getLapIncome(t), 0);
        const lapTroops = state.tiles.filter(t => t.owner === owner).reduce((sum, t) => sum + getLapTroops(t), 0);
        const maxTroops = CHARACTERS[piece.characterType].maxTroops;
        const ownerPS = getPS(newState, owner);
        newState = setPS(newState, owner, { gold: ownerPS.gold + LAP_GOLD_BONUS + lapIncome });

        // Piece troop bonus
        newState = {
          ...newState,
          pieces: newState.pieces.map(p => {
            if (p.id !== piece.id) return p;
            const bonus = Math.min(maxTroops - p.troops, LAP_TROOP_BONUS + lapTroops);
            return { ...p, troops: p.troops + bonus, composition: addToComp(p.composition, 'swordsman', bonus) };
          }),
        };

        // Per-land production (includes start tiles as premium land)
        let totalTileProduction = 0;
        newState = {
          ...newState,
          tiles: newState.tiles.map(t => {
            if (t.owner !== owner || (t.type !== 'land' && t.type !== 'start_p' && t.type !== 'start_e') || t.troops === 0) return t;
            const produce = LAP_LAND_PRODUCTION + getLapTroops(t);
            totalTileProduction += produce;
            const dominant = dominantTroopType(t.garrison);
            return { ...t, troops: t.troops + produce, garrison: addToComp(t.garrison, dominant, produce) };
          }),
          log: [...newState.log, `출발점 통과! 골드 +${LAP_GOLD_BONUS + lapIncome}, 병력 +${LAP_TROOP_BONUS + lapTroops}, 영토 병력 생산 +${totalTileProduction}`],
        };

        // Show lap bonus animation for player
        if (owner === 'player') {
          newState = { ...newState, lapBonusAnim: { gold: LAP_GOLD_BONUS + lapIncome, troops: LAP_TROOP_BONUS + lapTroops, tileProduction: totalTileProduction } };
        }
        // Increment global lap count (raises tolls)
        newState = { ...newState, lapCount: newState.lapCount + 1 };
      }

      // Auto-collect from own tiles passed through (not the landing tile)
      const prevPos = piece.position;
      let totalCollected = 0;
      let collectedComp: TroopComp = {};
      const passedTileIds: Set<number> = new Set();
      for (let i = 1; i < steps; i++) passedTileIds.add(nextPosition(prevPos, i));
      for (const tileId of passedTileIds) {
        const t = newState.tiles.find(tile => tile.id === tileId);
        if (t && t.owner === owner && t.troops > 0) {
          totalCollected += t.troops;
          collectedComp = mergeComp(collectedComp, t.garrison);
        }
      }
      if (totalCollected > 0) {
        const maxTr = CHARACTERS[piece.characterType].maxTroops;
        const canCollect = Math.min(totalCollected, maxTr - (newState.pieces.find(p => p.id === piece.id)?.troops ?? 0));
        if (canCollect > 0) {
          newState = {
            ...newState,
            pieces: newState.pieces.map(p => p.id === piece.id
              ? { ...p, troops: p.troops + canCollect, composition: mergeComp(p.composition, scaleComp(collectedComp, canCollect)) }
              : p
            ),
            tiles: newState.tiles.map(t =>
              passedTileIds.has(t.id) && t.owner === owner && t.troops > 0
                ? { ...t, troops: 0, garrison: {} }
                : t
            ),
            log: [...newState.log, `이동 중 영토 통과 → ${canCollect}명 자동 징집`],
          };
        }
      }

      return handleTileLanding(newState, newPos, piece.id);
    }

    case 'CHOOSE_FIGHT': {
      const tile = state.tiles.find(t => t.id === action.tileId)!;
      const owner = state.currentTurn;

      // If player's tile is being attacked by AI, give player a chance to use defense cards
      if (tile.owner === 'player' && owner !== 'player') {
        const defenseCards = state.player.cardSlot.filter(c =>
          c.effect.kind === 'defense_reinforce' || c.effect.kind === 'defense_boost'
        );
        if (defenseCards.length > 0) {
          return { ...state, pendingBattleTileId: action.tileId, turnPhase: 'defend_chance', activeTileAction: null };
        }
      }

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
      const MERC_COST = 200;
      if (ownerPS.gold < MERC_COST) return state;
      const troopTypes: TroopType[] = ['swordsman', 'archer', 'cavalry', 'spearman'];
      const troopType = troopTypes[Math.floor(Math.random() * troopTypes.length)];
      const amount = Math.floor(Math.random() * 6) + 3; // 3-8
      const piece = state.pieces.find(p => p.owner === owner && p.troops > 0)
        ?? state.pieces.find(p => p.owner === owner)!;
      const maxTroops = CHARACTERS[piece.characterType].maxTroops;
      const canAdd = Math.min(amount, maxTroops - piece.troops);
      if (canAdd <= 0) return { ...state, mercenaryResult: { troopType, amount: 0 } };
      const newComp = addToComp(piece.composition, troopType, canAdd);
      return setPS({
        ...state,
        pieces: state.pieces.map(p => p.id === piece.id
          ? { ...p, troops: p.troops + canAdd, composition: newComp }
          : p),
        mercenaryResult: { troopType, amount: canAdd },
        log: [...state.log, `${ownerPS.name} 용병 ${TROOP_DATA[troopType].name} ${canAdd}명 고용`],
      }, owner, { gold: ownerPS.gold - MERC_COST });
    }

    case 'CLOSE_MERCENARY': {
      return { ...state, turnPhase: 'end_turn', mercenaryResult: null };
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
        // Auto-produce base troops on capture regardless of deployment
        const baseGarrison: TroopComp = { swordsman: LAP_LAND_PRODUCTION };
        const tilesWithBase = stateAfterBattle.tiles.map(t =>
          t.id === battle.defenderTileId
            ? { ...t, owner, troops: LAP_LAND_PRODUCTION, garrison: baseGarrison }
            : t
        );
        return {
          ...stateAfterBattle,
          activeBattle: null,
          pieces: newPieces,
          tiles: tilesWithBase,
          activeDeployTileId: battle.defenderTileId,
          bonusRoll: capturedPiece,
          turnPhase: 'deploy' as const,
          log: [...stateAfterBattle.log, `${getPS(state, owner).name} 전투 승리! ${battle.defenderTileId}번 땅 점령 (기본 ${LAP_LAND_PRODUCTION}명 배치됨)${capturedPiece ? ' · 보너스 턴!' : ''}`],
        };
      } else {
        const attackerInitialTroops = battle.rounds.length > 0
          ? battle.rounds[0].attackerTroopsBefore
          : attackerPiece.troops;
        const penalty = Math.max(150, attackerInitialTroops * BATTLE_DEFEAT_GOLD_PER_TROOP);

        const initialDefTotal = battle.rounds.length > 0
          ? battle.rounds[0].defenderTroopsBefore
          : battle.defenderTroops;
        const defenderRemaining = battle.defenderTroops;

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

        let newState = setPS({
          ...stateAfterBattle,
          activeBattle: null,
          pieces: newPieces,
          tiles: newTiles,
          turnPhase: 'end_turn' as const,
          log: [...stateAfterBattle.log, `${getPS(state, owner).name} 전투 패배. 패배 비용 ${penalty}골드 지불`],
        }, owner, { gold: Math.max(0, getPS(state, owner).gold - penalty) });
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
        { ...state, tiles: newTiles, activeTileAction: null, activeDeployTileId: null, turnPhase: 'end_turn' as const, log: [...state.log, logMsg] },
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
        const ownedLands = state.tiles.filter(t => t.owner === owner && t.type === 'land');
        if (ownedLands.length > 0) {
          return {
            ...state,
            activeTileAction: action.tileId,
            turnPhase: 'forced_sell' as const,
            log: [...state.log, `통행세 ${toll}골드 부족! 보유 땅을 팔아야 합니다.`],
          };
        }
      }
      let newState = setPS(state, owner, {
        gold: ownerPS.gold - toll,
        tollExemptTurns: Math.max(0, ownerPS.tollExemptTurns - 1),
      });
      if (tileOwnerPS && tileOwner !== owner) {
        newState = setPS(newState, tileOwner as PlayerType, { gold: getPS(newState, tileOwner as PlayerType).gold + toll });
      }
      newState = { ...newState, activeTileAction: null, turnPhase: 'end_turn', log: [...newState.log, `통행세 ${toll}골드 납부`] };
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
            ? { ...t, owner: 'neutral' as const, garrison: {}, building: null, buildingLevel: 0 }
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
      newState = { ...newState, activeTileAction: null, turnPhase: 'end_turn', log: [...newState.log, `통행세 ${toll}골드 납부 완료`] };
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
      const discount = ownerPS.buildDiscountLaps > 0;
      const cost = getBuildCost(tile, action.buildingType, discount);
      if (ownerPS.gold < cost) return state;
      const newLevel = tile.building === action.buildingType ? tile.buildingLevel + 1 : 1;
      const newTiles = state.tiles.map(t => t.id === action.tileId ? { ...t, building: action.buildingType, buildingLevel: newLevel } : t);
      return setPS({ ...state, tiles: newTiles, turnPhase: 'end_turn' as const }, owner, { gold: ownerPS.gold - cost });
    }

    case 'SKIP_BUILD': {
      return { ...state, turnPhase: 'end_turn' };
    }

    case 'BUY_TROOPS': {
      const piece = state.pieces.find(p => p.id === action.pieceId)!;
      const owner = piece.owner;
      const ownerPS = getPS(state, owner);
      const troopData = TROOP_DATA[action.troopType];
      const merchantDiscount = piece.characterType === 'merchant' ? 0.9 : 1;
      const priceScale = 1 + ownerPS.troopBuyCount * TROOP_PRICE_SCALE;
      const unitCost = Math.ceil(troopData.price * merchantDiscount * priceScale);
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
      const discount = activePiece?.characterType === 'merchant' ? 0.9 : 1;
      const cost = Math.floor(baseCost * discount);
      if (ownerPS.gold < cost) return state;
      const newId = `${owner[0]}${ownerPS.pieceCount}`;
      const startIdx = owner === 'player' ? PLAYER_START : owner === 'ai' ? AI_START : owner === 'ai2' ? AI2_START : AI3_START;
      const newPiece = createPiece(newId, owner, action.characterType, startIdx);
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
      if (!state.activeEvent) return state;
      const newState = applyEventCardEffect(state, state.activeEvent);
      if (newState.turnPhase === 'shop' || newState.turnPhase === 'choose_move_tile') {
        return { ...newState, activeEvent: null };
      }
      return { ...newState, activeEvent: null, turnPhase: 'end_turn' };
    }

    case 'USE_EVENT_CARD': {
      const card = state.player.cardSlot.find(c => c.id === action.cardId);
      if (!card) return state;
      const newSlot = state.player.cardSlot.filter(c => c.id !== action.cardId);
      let withSlotUpdated = setPS(state, 'player', { cardSlot: newSlot });

      // Special handling during defend_chance: apply defense effect then start battle
      if (state.turnPhase === 'defend_chance' && state.pendingBattleTileId !== null) {
        const e = card.effect;
        if (e.kind === 'defense_reinforce') {
          const tileId = state.pendingBattleTileId;
          withSlotUpdated = {
            ...withSlotUpdated,
            tiles: withSlotUpdated.tiles.map(t => t.id === tileId
              ? { ...t, troops: t.troops + e.amount, garrison: addToComp(t.garrison, 'swordsman', e.amount) }
              : t),
            log: [...withSlotUpdated.log, `수비 지원군 ${e.amount}명 증원!`],
          };
        } else if (e.kind === 'defense_boost') {
          withSlotUpdated = setPS(withSlotUpdated, 'player', { defenseBoostMultiplier: e.multiplier });
          withSlotUpdated = { ...withSlotUpdated, log: [...withSlotUpdated.log, `수비력 ${e.multiplier}배 강화!`] };
        }
        return executeBattle(withSlotUpdated, state.pendingBattleTileId);
      }

      return applyEventCardEffect(withSlotUpdated, card);
    }

    case 'END_TURN': {
      if (state.bonusRoll) {
        // Stay on same player, grant extra roll
        return {
          ...state,
          turnPhase: 'roll',
          diceResult: null,
          dice1: null,
          dice2: null,
          bonusRoll: false,
          selectedPieceId: null,
          activeTileAction: null,
          log: [...state.log, `${getPS(state, state.currentTurn).name} 보너스 턴 획득!`],
        };
      }
      const activePlayers: PlayerType[] = ['player', 'ai'];
      if (state.playerCount >= 3) activePlayers.push('ai2');
      if (state.playerCount >= 4) activePlayers.push('ai3');
      const idx = activePlayers.indexOf(state.currentTurn);
      const next = activePlayers[(idx + 1) % activePlayers.length];
      return {
        ...state,
        currentTurn: next,
        turnPhase: 'roll',
        diceResult: null,
        dice1: null,
        dice2: null,
        bonusRoll: false,
        selectedPieceId: null,
        activeTileAction: null,
      };
    }

    default:
      return state;
  }
}

function handleTileLanding(state: GameState, tileId: number, _pieceId: string): GameState {
  const tile = state.tiles.find(t => t.id === tileId)!;
  const owner = state.currentTurn;

  if (tile.type === 'start_p' || tile.type === 'start_e') {
    if (tile.owner === owner) return { ...state, activeTileAction: tileId, turnPhase: 'shop' };
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
      if (owner === 'player') {
        const slotCard = { ...card, id: makeSlotId(card.id) };
        const playerPS = getPS(state, 'player');
        if (playerPS.cardSlot.length < 3) {
          return setPS(
            { ...state, turnPhase: 'end_turn', log: [...state.log, `찬스 카드 획득: ${card.text}`] },
            'player', { cardSlot: [...playerPS.cardSlot, slotCard] }
          );
        }
      }
      return { ...state, activeEvent: card, turnPhase: 'event_card' };
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
        newState = { ...newState, tiles: newState.tiles.map(t => t.id === target.id ? { ...t, owner: 'neutral', troops: neutralTroops, building: null, buildingLevel: 0 } : t) };
      }
      break;
    }
    case 'dice_bonus':
      newState = setPS(newState, owner, { diceBonusTurns: 1, diceBonusAmount: effect.amount });
      break;
    // defense cards applied outside this function (in USE_EVENT_CARD during defend_chance)
    case 'defense_reinforce':
    case 'defense_boost':
      break;
  }
  return newState;
}

function checkBankruptcy(state: GameState): GameState {
  if (state.player.gold <= 0) {
    return { ...state, phase: 'gameover', winner: 'ai' };
  }
  const allAisBroke = state.ai.gold <= 0
    && (!state.ai2 || state.ai2.gold <= 0)
    && (!state.ai3 || state.ai3.gold <= 0);
  if (allAisBroke) return { ...state, phase: 'gameover', winner: 'player' };
  return state;
}
