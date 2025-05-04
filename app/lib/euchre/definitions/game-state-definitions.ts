import { ActionDispatch, Dispatch, SetStateAction } from 'react';
import {
  EuchreAnimationAction,
  EuchreAnimationActionType,
  EuchreAnimationState
} from '../../../hooks/euchre/reducers/gameAnimationFlowReducer';
import {
  EuchreGameFlow,
  EuchreGameFlowState,
  GameFlowAction
} from '../../../hooks/euchre/reducers/gameFlowReducer';
import {
  BidResult,
  Card,
  CardBackColor,
  EuchreHandResult,
  GameDifficulty,
  GameSpeed,
  PromptValue,
  TableLocation,
  TeamColor
} from './definitions';
import {
  PlayerNotificationAction,
  PlayerNotificationState
} from '../../../hooks/euchre/reducers/playerNotificationReducer';
import { EuchrePauseActionType, EuchrePauseState } from '../../../hooks/euchre/reducers/gamePauseReducer';
import { InitDealResult } from './logic-definitions';

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
  handResults: EuchreHandResult[];
  gamePlayers: EuchrePlayer[];
  dealPassedCount: number;

  currentRound: number;
  currentTrick: EuchreTrick;
  currentTricks: EuchreTrick[];
  currentPlayer: EuchrePlayer;
}

export interface EuchrePlayer {
  readonly name: string;
  readonly playerNumber: 1 | 2 | 3 | 4;
  readonly team: 1 | 2;
  readonly location: TableLocation;

  hand: Card[];
  playedCards: Card[];
  human: boolean;
}

export interface EuchreTrick {
  trickId: string;
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

export interface EuchreGameState {
  /** Instance of information regarding the current euchre game being played. */
  euchreGame: EuchreGameInstance;

  /** Instance of a game that should be attempted to be replayed. The intent is to re-deal the same cards to the
   * same players with the same trump card turned up. The player will have a chance to make a different decision during
   * play that may change the outcome.
   */
  euchreReplayGame: EuchreGameInstance | null;

  /** Game state used to indicate how the game is to proceed. Used when determine what to do next during game play.
   */
  euchreGameFlow: EuchreGameFlowState;

  /** Game state used to indicate when to animate notifications
   */
  euchreAnimationFlow: EuchreAnimationState;

  /** Settings/preferences that can be set by the user such as difficulty and game speed. */
  euchreSettings: EuchreSettings;

  /** Sets the reason why the game is paused, and shouldn't continue to proceed with the game flow until the wait type is handled. */
  euchrePauseState: EuchrePauseState;
}

export interface EuchreGameValues extends EuchreGameState {
  /** The card that was selected to be played either automatically or for the AI. */
  playedCard: Card | null;

  /** The result from the deal for initial deal. */
  initDealer: InitDealResult | null;

  /** The resulting information from the bidding processes used by AI. */
  bidResult: BidResult | null;
  playerNotification: PlayerNotificationState;

  /** A value to indicate which prompt is present during the game. The initial intent was the possibilty that more than one
   * prompt could be present.
   */
  promptValue: PromptValue[];

  /** Boolean value to indicate that the user pressed the cancel button. */
  shouldCancel: boolean;
}

export interface ErrorHandlers {
  /** The method that should be called if the user attempted to cancel. */
  onCancel: () => void;

  onError: (e: Error, name: string) => void;

  catchAsync: (func: () => Promise<void>, onError: (e: Error, name: string) => void, fnName: string) => void;
}

export interface EuchreGamePlayHandlers {
  reset: (resetForBeginGame: boolean) => void;
  handleBeginNewGame: () => void;
  handleBidSubmit: (result: BidResult) => void;
  handleSettingsChange: (setting: EuchreSettings) => void;
  handleCancelGame: () => void;
  handleDiscardSubmit: (card: Card) => void;
  handleCloseHandResults: () => void;
  handleReplayHand: () => void;
  handleCancelAndReset: () => void;
  handleReplayGame: (replayGame: EuchreGameInstance) => void;
  handleAttemptToRecover: () => void;
}

export interface EuchreAnimationHandlers {
  handleBeginRegularDealComplete: () => void;
  handleEndRegularDealComplete: () => void;
  handleBeginDealForDealerComplete: () => void;
  handleEndDealForDealerComplete: () => void;
  handleTrickFinished: () => void;
  handleCardPlayed: (cardPlayed: Card) => void;
  handlePassDealComplete: () => void;
}

export interface EuchreGameSetters {
  // the following are methods/functions used to update state.
  setEuchreGame: Dispatch<SetStateAction<EuchreGameInstance>>;
  setEuchreReplayGame: Dispatch<SetStateAction<EuchreGameInstance | null>>;
  setPromptValue: Dispatch<SetStateAction<PromptValue[]>>;
  setPlayedCard: Dispatch<SetStateAction<Card | null>>;
  setInitialDealerResult: Dispatch<SetStateAction<InitDealResult | null>>;
  setBidResult: Dispatch<SetStateAction<BidResult | null>>;
  setShouldCancelGame: Dispatch<SetStateAction<boolean>>;

  /** Set both the game flow, game animation, game pauses state if provided. */
  dispatchStateChange: (
    gameAction?: EuchreGameFlow,
    gameAnimationAction?: EuchreAnimationActionType,
    gameWait?: EuchrePauseActionType
  ) => void;
  dispatchPlayerNotification: ActionDispatch<[action: PlayerNotificationAction]>;
  dispatchGameFlow: ActionDispatch<[action: GameFlowAction]>;
  dispatchGameAnimationFlow: ActionDispatch<[action: EuchreAnimationAction]>;
  dispatchPause: () => void;
}

export interface EuchreError {
  time: Date;
  id: string;
  message: string | undefined;
  func: string;
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
