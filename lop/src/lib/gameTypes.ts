export type TroopType = 'swordsman' | 'archer' | 'cavalry' | 'spearman';
export type TroopComp = Partial<Record<TroopType, number>>;

export type GamePhase = 'start' | 'board' | 'gameover';
export type TurnPhase =
  | 'start_deploy'
  | 'roll'
  | 'select_piece'
  | 'tile_event'
  | 'battle'
  | 'deploy'
  | 'build'
  | 'shop'
  | 'event_card'
  | 'forced_sell'
  | 'end_turn'
  | 'defend_chance'
  | 'choose_move_tile'
  | 'mercenary';

export type TileType = 'start_p' | 'start_e' | 'land' | 'chance' | 'mercenary';
export type PlayerType = 'player' | 'ai' | 'ai2' | 'ai3';
export type Owner = PlayerType | 'neutral' | null;
export type BuildingType = 'vault' | 'barracks' | 'fort';
export type CharacterType = 'general' | 'knight' | 'merchant' | 'scout';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type EquipmentType = 'sword' | 'armor' | 'banner' | 'boots';

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  attackBonus: number;
  defenseBonus: number;
  commandBonus: number;
  moveBonus: number;
  price: number;
}

export interface Piece {
  id: string;
  owner: PlayerType;
  characterType: CharacterType;
  position: number;
  troops: number;
  composition: TroopComp;
  equipment: Equipment[];
  startTileIndex: number;
}

export interface Tile {
  id: number;
  type: TileType;
  owner: Owner;
  troops: number;
  garrison: TroopComp;
  building: BuildingType | null;
  buildingLevel: number;
  landPrice: number;
  baseToll: number;
}

export interface BattleRound {
  attackerTroopsBefore: number;
  defenderTroopsBefore: number;
  attackerDamage: number;
  defenderDamage: number;
  log: string;
}

export interface BattleState {
  attackerPieceId: string;
  defenderTileId: number;
  defenderPieceId: string | null;
  attackerTroops: number;
  defenderTroops: number;
  defenderTroopsFromPiece: number;
  attackerAttack: number;
  attackerDefense: number;
  defenderAttack: number;
  defenderDefense: number;
  rounds: BattleRound[];
  result: 'ongoing' | 'attacker_wins' | 'defender_wins';
}

export type CardEffectType =
  | { kind: 'gold'; amount: number; target: 'self' | 'all' }
  | { kind: 'troops'; amount: number }
  | { kind: 'attack_boost'; multiplier: number }
  | { kind: 'move_to_shop' }
  | { kind: 'tax_exempt' }
  | { kind: 'toll_exempt' }
  | { kind: 'toll_double'; laps: number }
  | { kind: 'build_discount'; laps: number }
  | { kind: 'reset_land' }
  | { kind: 'dice_bonus'; amount: number }
  | { kind: 'move_to_tile' }
  | { kind: 'troop_boost'; costPerTroop: number; maxAmount: number }
  | { kind: 'defense_reinforce'; amount: number }
  | { kind: 'defense_boost'; multiplier: number };

export interface EventCard {
  id: string;
  type: 'chance' | 'community';
  text: string;
  effect: CardEffectType;
}

export interface PlayerState {
  id: PlayerType;
  gold: number;
  hireCost: number;
  pieceCount: number;
  attackBoostActive: boolean;
  taxExemptTurns: number;
  tollExemptTurns: number;
  tollDoubleLaps: number;
  buildDiscountLaps: number;
  diceBonusTurns: number;
  diceBonusAmount: number;
  isHuman: boolean;
  name: string;
  cardSlot: EventCard[];
  troopBuyCount: number;
  defenseBoostMultiplier: number;
}

export interface GameState {
  phase: GamePhase;
  turnPhase: TurnPhase;
  currentTurn: PlayerType;
  difficulty: Difficulty;
  playerCount: 2 | 3 | 4;
  player: PlayerState;
  ai: PlayerState;
  ai2: PlayerState | null;
  ai3: PlayerState | null;
  pieces: Piece[];
  tiles: Tile[];
  diceResult: number | null;
  dice1: number | null;
  dice2: number | null;
  bonusRoll: boolean;
  selectedPieceId: string | null;
  activeBattle: BattleState | null;
  activeEvent: EventCard | null;
  activeTileAction: number | null;
  activeDeployTileId: number | null;
  winner: PlayerType | null;
  log: string[];
  lapBonusAnim: { gold: number; troops: number; tileProduction: number } | null;
  pendingBattleTileId: number | null;
  mercenaryResult: { troopType: TroopType; amount: number } | null;
  lapCount: number;
}
