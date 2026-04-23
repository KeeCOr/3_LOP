export type GamePhase = 'start' | 'board' | 'gameover';
export type TurnPhase =
  | 'roll'
  | 'select_piece'
  | 'tile_event'
  | 'battle'
  | 'deploy'
  | 'build'
  | 'shop'
  | 'event_card'
  | 'forced_sell'
  | 'end_turn';

export type TileType = 'start_p' | 'start_e' | 'land' | 'shop' | 'tax' | 'chance' | 'community';
export type Owner = 'player' | 'ai' | 'neutral' | null;
export type BuildingType = 'vault' | 'barracks' | 'fort';
export type CharacterType = 'general' | 'knight' | 'merchant' | 'scout';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type EquipmentType = 'sword' | 'armor' | 'banner' | 'boots';
export type PlayerType = 'player' | 'ai';

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
  equipment: Equipment[];
  startTileIndex: number;
}

export interface Tile {
  id: number;
  type: TileType;
  owner: Owner;
  troops: number;
  building: BuildingType | null;
  buildingLevel: number;
  landPrice: number;
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
  attackerTroops: number;
  defenderTroops: number;
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
  | { kind: 'dice_bonus'; amount: number };

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
}

export interface GameState {
  phase: GamePhase;
  turnPhase: TurnPhase;
  currentTurn: PlayerType;
  difficulty: Difficulty;
  player: PlayerState;
  ai: PlayerState;
  pieces: Piece[];
  tiles: Tile[];
  diceResult: number | null;
  selectedPieceId: string | null;
  activeBattle: BattleState | null;
  activeEvent: EventCard | null;
  activeTileAction: number | null;
  activeDeployTileId: number | null;
  winner: PlayerType | null;
  log: string[];
}
