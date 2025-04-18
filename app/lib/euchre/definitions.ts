const arrowUpSvg = `checked:bg-[url('/arrowup.svg')] bg-[url('/arrowup.svg')]`;
const arrowDownSvg = `checked:bg-[url('/arrowdown.svg')] bg-[url('/arrowdown.svg')]`;
const menuSvg =
  (true ? arrowDownSvg : arrowUpSvg) +
  ` bg-no-repeat bg-center bg-[length:1.75rem] bg-[rgba(25,115,25,0.9)]
dark:bg-[rgba(25,115,25,0.9)] border border-black appearance-none cursor-pointer border rounded w-8 h-8 checked:dark:bg-stone-500`;

export const RANDOM_FOR_DIFFICULTY = new Map<GameDifficulty, number>([
  ['novice', 0.7],
  ['intermediate', 0.35],
  ['expert', 0],
  ['tabletalk', 0]
]);

export type TeamColor = 'red' | 'blue' | 'orange' | 'yellow' | 'green' | 'white' | 'pink' | 'purple';
export type GameDifficulty = 'novice' | 'intermediate' | 'expert' | 'tabletalk';
export type CardBackColor = 'green' | 'blue' | 'red' | 'black';

export const TEAM_COLOR_MAP: Map<TeamColor, string> = new Map([
  ['red', 'bg-red-600'],
  ['blue', 'bg-blue-600'],
  ['orange', 'bg-orange-500'],
  ['yellow', 'bg-yellow-400'],
  ['green', 'bg-green-600'],
  ['white', 'bg-white'],
  ['pink', 'bg-pink-400'],
  ['purple', 'bg-purple-700']
]);

export const GAME_SPEED_MAP = new Map<string, GameSpeed>([
  ['Fast', 300],
  ['Moderate', 700],
  ['Slow', 2000]
]);

export const DIFFICULTY_MAP = new Map<string, GameDifficulty>([
  ['Novice', 'novice'],
  ['Intermediate', 'intermediate'],
  ['Expert', 'expert'],
  ['AI Table Talks', 'tabletalk']
]);

export enum PromptType {
  INTRO,
  BID,
  GAME_RESULT,
  HAND_RESULT,
  DISCARD
}
export type PromptValue = {
  type: PromptType;
};

export const MINIMUM_NOTIFICATION_SPEED = 1000;
export const AVAILABLE_GAME_SPEED: GameSpeed[] = [150, 300, 700, 1000, 2000, 3000, 4000];
export const AVAILABLE_SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
export const SPADE: string = '♠';
export const HEART: string = '♥';
export const DIAMOND: string = '♦';
export const CLUB: string = '♣';
export const LEFT_BOWER_VALUE = 250;
export type ResultHighlight = 'player1' | 'player2' | 'player3' | 'player4' | 'winner' | 'trump';
export type GameSpeed = 150 | 300 | 700 | 1000 | 2000 | 3000 | 4000;
export type Suit = '♠' | '♥' | '♦' | '♣';
export type CardValue =
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K'
  | 'A'
  | 'JK'
  | 'P';
export type CardColor = 'R' | 'B';

/** Initial game settings. */
export const DEFAULT_GAME_SETTINGS = {
  gameSpeed: 700 as GameSpeed,
  showHandResult: true,
  enforceFollowSuit: false,
  autoFollowSuit: false,
  difficulty: 'expert' as GameDifficulty,
  stickTheDealer: true,
  viewPlayerInfoDetail: true,
  debugShowHandsWhenPassed: false,
  debugShowPlayersHand: false,
  debugAllComputerPlayers: false,
  debugAlwaysPass: false,
  debugShowDebugEvents: false
};

/** Initial game settings. */
export const INIT_GAME_SETTINGS: EuchreSettings = {
  shouldAnimate: false,
  notificationSpeed: MINIMUM_NOTIFICATION_SPEED,
  teamOneColor: 'green',
  teamTwoColor: 'red',
  cardColor: 'black',
  playerName: 'Joe',
  ...DEFAULT_GAME_SETTINGS
};

export interface EuchreHandResult extends EuchrePlayersPassedResult {
  tricks: EuchreTrick[];
  points: number;
  maker: EuchrePlayer;
  teamWon: 1 | 2;
  loner: boolean;
  discard: Card | null;
  turnedDown: Card | null;
  defenders: EuchrePlayer[];
}

export interface EuchrePlayersPassedResult {
  dealer: EuchrePlayer;
  roundNumber: number;
  kitty: Card[];
  trump: Card;
  allPlayerCards: EuchreCard[];
}

export interface EuchreSettings {
  shouldAnimate: boolean;
  gameSpeed: GameSpeed;
  notificationSpeed: GameSpeed;
  showHandResult: boolean;
  teamOneColor: TeamColor;
  teamTwoColor: TeamColor;
  enforceFollowSuit: boolean;
  autoFollowSuit: boolean;
  debugShowPlayersHand: boolean;
  debugShowHandsWhenPassed: boolean;
  debugAlwaysPass: boolean;
  debugAllComputerPlayers: boolean;
  debugShowDebugEvents: boolean;
  difficulty: GameDifficulty;
  viewPlayerInfoDetail: boolean;
  cardColor: CardBackColor;
  stickTheDealer: boolean;
  playerName: string;
}

export interface BidResult {
  orderTrump: boolean;
  loner: boolean;
  calledSuit: Suit | null;
  handScore: number;
  cheatScore: number;
  discard: Card | null;
}

export interface EuchrePlayer {
  readonly name: string;
  readonly playerNumber: 1 | 2 | 3 | 4;
  readonly team: 1 | 2;

  hand: Card[];
  playedCards: Card[];
  human: boolean;
}

export interface Card {
  readonly suit: Suit;
  readonly value: CardValue;
  index: number;
}

export interface EuchreGameInstance {
  gameId: string;
  handId: string;
  player1: EuchrePlayer;
  player2: EuchrePlayer;
  player3: EuchrePlayer;
  player4: EuchrePlayer;

  deck: Card[];
  kitty: Card[];
  dealer: EuchrePlayer;
  maker: EuchrePlayer | null;
  loner: boolean;
  trump: Card;
  discard: Card | null;
  turnedDown: Card | null;
  cardDealCount: number[];
  gameResults: EuchreHandResult[];
  gamePlayers: EuchrePlayer[];
  dealPassedCount: number;

  currentRound: number;
  currentTrick: EuchreTrick;
  currentTricks: EuchreTrick[];
  currentPlayer: EuchrePlayer;
}

export interface EuchreTrick {
  taker: EuchrePlayer | null;
  cardsPlayed: EuchreCard[];
  playerSittingOut: EuchreCard | null;
  playerRenege: EuchrePlayer | null;
  round: number;
}

export interface EuchreCard {
  player: EuchrePlayer;
  card: Card;
}
