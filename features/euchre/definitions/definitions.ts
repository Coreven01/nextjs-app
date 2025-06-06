import { EuchreCard, EuchreSettings, EuchreTrick } from './game-state-definitions';

// const arrowUpSvg = `checked:bg-[url('/arrowup.svg')] bg-[url('/arrowup.svg')]`;
// const arrowDownSvg = `checked:bg-[url('/arrowdown.svg')] bg-[url('/arrowdown.svg')]`;
// const menuSvg =
//   (true ? arrowDownSvg : arrowUpSvg) +
//   ` bg-no-repeat bg-center bg-[length:1.75rem] bg-[rgba(25,115,25,0.9)]
// dark:bg-[rgba(25,115,25,0.9)] border border-black appearance-none cursor-pointer border rounded w-8 h-8 checked:dark:bg-stone-500`;

export const DEBUG_ENABLED = true;
export const RANDOM_FOR_DIFFICULTY = new Map<GameDifficulty, number>([
  ['novice', 0.7],
  ['intermediate', 0.35],
  ['expert', 0],
  ['tabletalk', 0]
]);

export type TableLocation = 'left' | 'top' | 'right' | 'bottom';
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
  ['Fast', 400],
  ['Moderate', 700],
  ['Slow', 1200],
  ['Very Slow', 2000]
]);

export const NOTIFICATION_SPEED_MAP = new Map<string, GameSpeed>([
  ['Fast', 700],
  ['Moderate', 1200],
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
  DISCARD,
  DEBUG
}

export const RESPONSE_CARD_CENTER = 'lg:h-[125px] md:h-[115px] sm:h-[95px] h-[85px]';
export const RESPONSE_CARD_SIDE = 'lg:w-[125px] md:w-[115px] sm:w-[95px] w-[85px]';
export const MINIMUM_NOTIFICATION_SPEED: GameSpeed = 700;
export const AVAILABLE_GAME_SPEED: GameSpeed[] = [300, 400, 700, 1200, 2000, 3000, 4000, 5000];
export const AVAILABLE_SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
export const SPADE: string = '♠';
export const HEART: string = '♥';
export const DIAMOND: string = '♦';
export const CLUB: string = '♣';
export const LEFT_BOWER_VALUE = 250;
export type ResultHighlight = 'player1' | 'player2' | 'player3' | 'player4' | 'winner' | 'trump';
export type GameSpeed = 300 | 400 | 700 | 1200 | 2000 | 3000 | 4000 | 5000;
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
  notificationSpeed: MINIMUM_NOTIFICATION_SPEED,
  showHandResult: true,
  enforceFollowSuit: false,
  autoFollowSuit: false,
  difficulty: 'expert' as GameDifficulty,
  stickTheDealer: true,
  gamePoints: 10,
  viewPlayerInfoDetail: true,
  debugShowHandsWhenPassed: false,
  debugShowPlayersHand: false,
  debugAllComputerPlayers: false,
  debugAlwaysPass: false,
  debugLogDebugEvents: false,
  debugEnableDebugMenu: false,
  debugShowPositionElements: false
};

/** Initial game settings. */
export const INIT_GAME_SETTINGS: EuchreSettings = {
  shouldAnimateDeal: true,
  teamOneColor: 'green',
  teamTwoColor: 'red',
  cardColor: 'black',
  playerName: 'Joe',
  ...DEFAULT_GAME_SETTINGS
};

export interface EuchreHandResult extends EuchrePlayersPassedResult {
  tricks: EuchreTrick[];
  points: number;
  makerPlayerNumber: number;
  teamWon: 1 | 2;
  loner: boolean;
  discard: Card | null;
  turnedDown: Card | null;
}

export interface EuchrePlayersPassedResult {
  dealerPlayerNumber: number;
  roundNumber: number;
  kitty: Card[];
  trump: Card;
  allPlayerCards: EuchreCard[];
}

export interface BidResult {
  orderTrump: boolean;
  loner: boolean;
  calledSuit: Suit | null;
  handScore: number;
  cheatScore: number;
  discard: Card | null;
}

export interface Card {
  readonly suit: Suit;
  readonly value: CardValue;
  index: number;
}

export interface EuchreTeamOverview {
  score: number;
  lonerCount: number;
  euchredCount: number;
  tricksWonCount: number;
}

export interface EuchrePlayerOverview {
  trumpOrderedCount: number;
  tricksWonCount: number;
  acesLeadCount: number;
  lonerCount: number;
  fourSuitedCount: number;
  threeSuitedCount: number;
  twoSuitedCount: number;
  singleSuitedCount: number;
}
