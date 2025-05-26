import { ActionDispatch, Dispatch, RefObject, SetStateAction } from 'react';
import {
  BidResult,
  Card,
  CardBackColor,
  EuchreHandResult,
  GameDifficulty,
  GameSpeed,
  PromptType,
  TableLocation,
  TeamColor
} from './definitions';
import { InitDealResult } from './logic-definitions';
import { CardSpringTarget } from './transform-definitions';
import {
  EuchreGameFlow,
  EuchreGameFlowState,
  GameFlowAction
} from '../../../app/hooks/euchre/reducers/gameFlowReducer';
import {
  EuchreAnimationAction,
  EuchreAnimationActionType,
  EuchreAnimationState
} from '../../../app/hooks/euchre/reducers/gameAnimationFlowReducer';
import { EuchrePauseActionType, EuchrePauseState } from '../../../app/hooks/euchre/reducers/gamePauseReducer';
import {
  NotificationAction,
  NotificationState
} from '../../../app/hooks/euchre/reducers/playerNotificationReducer';
import { GameEventHandlers } from '../../../app/hooks/euchre/useEventLog';

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
  originalDealDeck: Card[];

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

  /** Value to stop executing while debugging. */
  euchreDebug: EuchreGameFlow | undefined;
}

export interface EuchreGameValues extends EuchreGameState {
  /** The card that was selected to be played either automatically or for the AI. */
  playedCard: Card | null;

  /** The result from the deal for initial deal. */
  initDealer: InitDealResult | null;

  /** The resulting information from the bidding processes used by AI. */
  bidResult: BidResult | null;
  playerNotification: NotificationState;

  /** A value to indicate which prompt is present during the game. The initial intent was the possibilty that more than one
   * prompt could be present.
   */
  promptValues: PromptType[];

  /** Boolean value to indicate that the user pressed the cancel button. */
  shouldCancel: boolean;
}

export interface ErrorHandlers {
  /** The method that should be called if the user attempted to cancel. */
  onCancel: () => void;

  onError: (e: Error, name: string) => void;

  onResetError: () => void;
  catchAsync: (
    func: () => Promise<void>,
    onError: (e: Error, name: string) => void,
    fnName: string
  ) => Promise<void>;
}

export interface EuchreGamePlayHandlers {
  reset: (resetForBeginGame: boolean) => void;
  onBeginNewGame: () => void;
  onBidSubmit: (result: BidResult) => void;
  onSettingsChange: (setting: EuchreSettings) => void;
  onCancelGame: () => void;
  onDiscardSubmit: (card: Card) => void;
  onCloseHandResults: () => void;
  onReplayHand: () => void;
  onCancelAndReset: () => void;
  onReplayGame: (replayGame: EuchreGameInstance) => void;
}

export interface EuchreDebugHandlers {
  onRunInitGame: () => void;
  onRunInitAndShuffleGame: () => void;
  onRunTrickNotification: () => void;
  onRunFullGame: () => void;
  onRunFullGameLoop: () => void;
  onClearDebugGame: () => void;
}

export interface EuchreAnimationHandlers {
  onBeginRegularDealComplete: () => void;
  onEndRegularDealComplete: () => void;
  onBeginDealForDealerComplete: () => void;
  onEndDealForDealerComplete: () => void;
  onTrickFinished: () => void;
  onCardPlayed: (cardPlayed: Card) => void;
  onCardPlayedComplete: () => void;
  onPassDealComplete: () => void;
  onTrumpOrderedComplete: () => void;
}

export interface EuchreGameSetters {
  // the following are methods/functions used to update state.
  setEuchreGame: (game: EuchreGameInstance) => void;
  setEuchreReplayGame: Dispatch<SetStateAction<EuchreGameInstance | null>>;
  setEuchreDebug: (value: EuchreGameFlow | undefined) => void;
  setPlayedCard: Dispatch<SetStateAction<Card | null>>;
  setInitialDealerResult: Dispatch<SetStateAction<InitDealResult | null>>;
  setBidResult: Dispatch<SetStateAction<BidResult | null>>;
  setShouldCancelGame: Dispatch<SetStateAction<boolean>>;

  addPromptValue: (value: PromptType) => void;
  removePromptValue: (value: PromptType) => void;
  replacePromptValues: (value: PromptType[]) => void;
  clearPromptValues: () => void;

  /** Set both the game flow, game animation, game pauses state if provided. */
  dispatchStateChange: (
    gameAction?: EuchreGameFlow,
    gameAnimationAction?: EuchreAnimationActionType,
    gameWait?: EuchrePauseActionType
  ) => void;
  dispatchPlayerNotification: ActionDispatch<[action: NotificationAction]>;
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
  shouldAnimateDeal: boolean;
  gameSpeed: GameSpeed;
  notificationSpeed: GameSpeed;
  showHandResult: boolean;
  teamOneColor: TeamColor;
  teamTwoColor: TeamColor;
  enforceFollowSuit: boolean;
  autoFollowSuit: boolean;
  debugEnableDebugMenu: boolean;
  debugShowPlayersHand: boolean;
  debugShowHandsWhenPassed: boolean;
  debugAlwaysPass: boolean;
  debugAllComputerPlayers: boolean;
  debugLogDebugEvents: boolean;
  debugShowPositionElements: boolean;
  difficulty: GameDifficulty;
  viewPlayerInfoDetail: boolean;
  cardColor: CardBackColor;
  stickTheDealer: boolean;
  playerName: string;
  gamePoints: number;
}

export interface HandState {
  handId: string;
  width: number;
  height: number;
  location: TableLocation;
  shouldShowCardValue?: boolean;
  player?: EuchrePlayer;
  responsive?: boolean;

  /** Used to identify which state is being updated, and to prevent the state from being updated more than once. */
  stateEffect?: EuchreGameFlow;
}

export interface GamePlayContext {
  state: EuchreGameState;
  eventHandlers: GameEventHandlers;
  errorHandlers: ErrorHandlers;
  animationHandlers: EuchreAnimationHandlers;
}

export interface DeckState {
  deck: Card[];
  cardRefs: Map<number, RefObject<HTMLDivElement | null>>;
  initSpringValue?: CardSpringTarget;

  /** Dealer location */
  location: TableLocation;
  playerNumber: number;
  handId: string;
  gameId: string;
  width: number;
  height: number;
}

export interface CardIndex {
  cardIndex: number;
}
export interface CardBaseState extends CardIndex {
  renderKey: string;
  src?: string;
  cardFullName: string;
  location?: TableLocation;
  enabled: boolean;
}

export const DeckStatePhases = {
  INIT: 'Init',
  DEAL_FOR_DEALER: 'DealForDealer',
  REGULAR_DEAL: 'RegularDeal'
} as const;

export type DeckStatePhase = (typeof DeckStatePhases)[keyof typeof DeckStatePhases];

export const DeckStateActions = {
  CREATE: 'Create',
  REINITIALIZE: 'Reinitialize',
  RESET: 'Reset',
  MOVE: 'Move',
  START_ANIMATE_BEGIN: 'StartAnimateBegin',
  END_ANIMATE_BEGIN: 'EndAnimateBegin',
  START_ANIMATE_END: 'StartAnimateEnd'
} as const;

export type DeckStateAction = (typeof DeckStateActions)[keyof typeof DeckStateActions];

export interface DealStateEffect {
  func?: () => Promise<void>;
  stateAction?: DeckStateAction;
  statePhase?: DeckStatePhase;
}

export interface InitDealHandlers {
  onDealerChanged: () => Promise<void>;
  onStateCreating: () => Promise<void>;
}

export interface DealForDealerHandlers {
  onMoveCardsIntoPosition: () => Promise<void>;
  onStartDealCards: () => Promise<void>;
  onEndDealCards: () => Promise<void>;
  onMoveCardsToPlayer: () => Promise<void>;
}

export interface RegularDealHandlers {
  onMoveCardsIntoPosition: () => Promise<void>;
  onStartDealCards: () => Promise<void>;
  onEndDealCards: () => Promise<void>;
}

export const HandStatePhases = {
  INIT: 'Init',
  GAME_PLAY: 'GamePlay'
} as const;

export type HandStatePhase = (typeof HandStatePhases)[keyof typeof HandStatePhases];

export const HandStateActions = {
  NO_ACTION: 'NoAction',
  CREATE_HAND: 'CreateHand',
  RESET: 'Reset',
  CREATE_CARD: 'CreateCard',
  REGROUP: 'Regroup',
  ANIMATE_REGROUP: 'AnimateRegroup',
  PASS_DEAL: 'PassDeal',
  DISCARD: 'Discard',
  RE_ORDER_HAND: 'ReOrderHand',
  ANIMATE_RE_ORDER_HAND: 'AnimateReOrderHand',
  TRICK_FINISHED: 'TrickFinished',
  BEGIN_TURN: 'BeginTurn',
  END_TURN: 'EndTurn',
  SITTING_OUT: 'SittingOut',
  PLAY_CARD: 'PlayCard',
  ANIMATE_PLAY_CARD: 'AnimatePlayCard'
} as const;

export type HandStateAction = (typeof HandStateActions)[keyof typeof HandStateActions];

export interface HandStateEffect {
  func?: () => Promise<void>;
  stateAction?: HandStateAction;
  statePhase?: HandStatePhase;
}

export interface InitHandHandlers {
  onResetHandState: () => Promise<void>;
  onCreateHandState: () => Promise<void>;
  onCreateCardState: () => Promise<void>;
  onRegroupCards: () => Promise<void>;
  onAnimateRegroupCards: () => Promise<void>;
}

export interface PlayHandHandlers {
  onPlayCard: () => Promise<void>;
  onAnimatePlayCard: () => Promise<void>;
  onPassDeal: () => Promise<void>;
  onDiscard: () => Promise<void>;
  onReorderHand: () => Promise<void>;
  onAnimateReorderHand: () => Promise<void>;
  onPlayerSittingOut: () => Promise<void>;
  onTrickFinished: () => Promise<void>;
  onBeginPlayerTurn: () => Promise<void>;
  onEndPlayerTurn: () => Promise<void>;
}
