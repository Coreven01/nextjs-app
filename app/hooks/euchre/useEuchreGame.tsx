import { ActionDispatch, Dispatch, SetStateAction, useCallback, useMemo, useReducer, useState } from 'react';
import {
  initialPlayerNotification,
  PlayerNotificationAction,
  PlayerNotificationActionType,
  playerNotificationReducer,
  PlayerNotificationState
} from './reducers/playerNotificationReducer';
import {
  EuchreGameFlow,
  EuchreFlowActionType,
  EuchreGameFlowState,
  gameFlowStateReducer,
  INIT_GAME_FLOW_STATE,
  GameFlowAction
} from './reducers/gameFlowReducer';
import {
  EuchreAnimationActionType,
  gameAnimationFlowReducer,
  initialGameAnimationState,
  EuchreAnimationState,
  EuchreAnimationAction
} from './reducers/gameAnimationFlowReducer';
import {
  BidResult,
  Card,
  EuchreGameInstance,
  EuchreSettings,
  INIT_GAME_SETTINGS,
  PromptType,
  PromptValue
} from '@/app/lib/euchre/definitions';
import { GameEvent, useEventLog } from './useEventLog';
import useEuchreGameInit from './useEuchreGameInit';
import useEuchreGameInitDeal from './useEuchreGameInitDeal';
import useEuchreGameShuffle from './useEuchreGameShuffle';
import useEuchreGameBid from './useEuchreGameBid';
import useEuchreGameOrder from './useEuchreGameOrder';
import useEuchreGamePlay from './useEuchreGamePlay';
import useGameData from './data/useGameData';
import useGamePlayLogic from './logic/useGamePlayLogic';
import useGameSetupLogic from './logic/useGameSetupLogic';
import { v4 as uuidv4 } from 'uuid';

export interface EuchreGameBase {
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

  /** Game state used to indicate when to pause/delay for player notification, or for animation.
   */
  euchreAnimationFlow: EuchreAnimationState;

  /** Settings/preferences that can be set by the user such as difficulty and game speed. */
  euchreSettings: EuchreSettings;
}

export interface EuchreGameState extends EuchreGameBase {
  /** The card that was selected to be played either automatically or for the AI. */
  playedCard: Card | null;

  /** The resulting information from the bidding processes used by AI. */
  bidResult: BidResult | null;
  playerNotification: PlayerNotificationState;

  /** A value to indicate which prompt is present during the game. The initial intent was the possibilty that more than one
   * prompt could be present.
   */
  prompValue: PromptValue[];

  /** Boolean value to indicate that the user pressed the cancel button. */
  shouldCancel: boolean;

  // the following are methods/functions used to update state.
  setEuchreGame: Dispatch<SetStateAction<EuchreGameInstance>>;
  setEuchreSettings: Dispatch<SetStateAction<EuchreSettings>>;
  setPromptValue: Dispatch<SetStateAction<PromptValue[]>>;
  setPlayedCard: Dispatch<SetStateAction<Card | null>>;
  setBidResult: Dispatch<SetStateAction<BidResult | null>>;
  setShouldCancel: Dispatch<SetStateAction<boolean>>;

  /** Set both the game flow and game animation state if provided. */
  dispatchStateChange: (gameAction?: EuchreGameFlow, gameAnimationAction?: EuchreAnimationActionType) => void;
  dispatchPlayerNotification: ActionDispatch<[action: PlayerNotificationAction]>;
  dispatchGameFlow: ActionDispatch<[action: GameFlowAction]>;
  dispatchGameAnimationFlow: ActionDispatch<[action: EuchreAnimationAction]>;

  /** The method that should be called if the user attempted to cancel the game. */
  onCancel: () => void;

  onError: (
    e: Error,
    gameFlow: EuchreGameFlow,
    animationType: EuchreAnimationActionType,
    func: string
  ) => void;

  /** Add an event. Used for debugging or for reference to see what happened during game play. */
  addEvent: (e: GameEvent) => void;
}

export interface EuchreError {
  time: Date;
  id: string;
  message: string | undefined;
  gameFlow: EuchreGameFlow;
  animationType: EuchreAnimationActionType;
  func: string;
}

const getInitPlayerName = () => {
  const names = ['Joe', 'Jim', 'Jack', 'Jane', 'Joan', 'Jean'];
  const index = Math.round(Math.random() * (names.length - 1));

  return names[index];
};

export default function useEuchreGame() {
  //#region Hooks to control game flow *************************************************************************
  const { createDefaultEuchreGame } = useGameSetupLogic();
  const [promptValue, setPromptValue] = useState<PromptValue[]>([{ type: PromptType.INTRO }]);
  const [shouldCancelGame, setCancelGame] = useState(false);
  const [euchreReplayGame, setEuchreReplayGame] = useState<EuchreGameInstance | null>(null);
  const [euchreGame, setEuchreGame] = useState<EuchreGameInstance>(createDefaultEuchreGame());
  const [euchreSettings, setEuchreSettings] = useState<EuchreSettings>({
    ...INIT_GAME_SETTINGS,
    playerName: getInitPlayerName()
  });
  const [errorState, setErrorState] = useState<EuchreError | null>(null);
  const [playedCard, setPlayedCard] = useState<Card | null>(null);
  const [bidResult, setBidResult] = useState<BidResult | null>(null);
  const { events, addEvent, clearEvents } = useEventLog();

  const [playerNotification, dispatchPlayerNotification] = useReducer(
    playerNotificationReducer,
    initialPlayerNotification
  );

  const [gameFlow, dispatchGameFlow] = useReducer(gameFlowStateReducer, { ...INIT_GAME_FLOW_STATE });
  const [gameAnimationFlow, dispatchGameAnimationFlow] = useReducer(
    gameAnimationFlowReducer,
    initialGameAnimationState
  );

  const handleCancelGame = useCallback(() => {
    if (shouldCancelGame) return;

    dispatchGameFlow({ type: EuchreFlowActionType.SET_GAME_FLOW, gameFlow: EuchreGameFlow.BEGIN_INIT_DEAL });
    dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_NONE });
    dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });
    setCancelGame(true);
  }, [shouldCancelGame]);

  const dispatchStateChange = (
    gameAction?: EuchreGameFlow,
    gameAnimationAction?: EuchreAnimationActionType
  ) => {
    if (gameAction) dispatchGameFlow({ type: EuchreFlowActionType.SET_GAME_FLOW, gameFlow: gameAction });
    if (gameAnimationAction) dispatchGameAnimationFlow({ type: gameAnimationAction });
  };

  const handleError = useCallback(
    (
      e: Error | undefined,
      gameFlow: EuchreGameFlow,
      animationType: EuchreAnimationActionType,
      func: string
    ) => {
      const error = e as Error;

      dispatchStateChange(EuchreGameFlow.ERROR);
      setErrorState({
        time: new Date(),
        id: uuidv4(),
        message: error ? error.message : undefined,
        gameFlow: gameFlow,
        animationType: animationType,
        func: func
      });
    },
    []
  );

  const gameState: EuchreGameState = useMemo(() => {
    return {
      euchreGame: euchreGame,
      euchreReplayGame: euchreReplayGame,
      euchreGameFlow: gameFlow,
      euchreSettings: euchreSettings,
      playerNotification: playerNotification,
      euchreAnimationFlow: gameAnimationFlow,
      prompValue: promptValue,
      playedCard: playedCard,
      bidResult: bidResult,
      shouldCancel: shouldCancelGame,
      setEuchreGame: setEuchreGame,
      setEuchreSettings: setEuchreSettings,
      setPromptValue: setPromptValue,
      setPlayedCard: setPlayedCard,
      setBidResult: setBidResult,
      setShouldCancel: setCancelGame,
      dispatchStateChange: dispatchStateChange,
      dispatchPlayerNotification: dispatchPlayerNotification,
      dispatchGameFlow: dispatchGameFlow,
      dispatchGameAnimationFlow: dispatchGameAnimationFlow,
      onCancel: handleCancelGame,
      onError: handleError,
      addEvent: addEvent
    };
  }, [
    addEvent,
    bidResult,
    euchreGame,
    euchreReplayGame,
    euchreSettings,
    gameAnimationFlow,
    gameFlow,
    handleCancelGame,
    handleError,
    playedCard,
    playerNotification,
    promptValue,
    shouldCancelGame
  ]);

  const { reverseLastHandPlayed } = useGameData();
  const { getGameStateForNextHand } = useGamePlayLogic();
  const { reset, handleBeginGame, cancelAndReset } = useEuchreGameInit(gameState);
  const {} = useEuchreGameInitDeal(gameState);
  const { handleShuffleAndDealComplete } = useEuchreGameShuffle(gameState);
  const { handleBidSubmit } = useEuchreGameBid(gameState);
  const { handleDiscardSubmit } = useEuchreGameOrder(gameState);
  const { handleCardPlayed, handleCloseHandResults, handleTrickFinished } = useEuchreGamePlay(gameState);

  //#region Other Handlers *************************************************************************

  const handleStartGame = () => {
    reset(true);
  };

  const handleBeginNewGame = () => {
    setEuchreReplayGame(null);
    handleBeginGame();
  };

  /** */
  const handleSettingsChange = (settings: EuchreSettings) => {
    setEuchreSettings(settings);
  };

  const handleCancelAndReset = useCallback(() => {
    cancelAndReset();
  }, [cancelAndReset]);

  /** Reverse game state to play the hand again. Used for testing/debugging */
  const handleReplayHand = () => {
    setPromptValue([]);
    const newGame = reverseLastHandPlayed(euchreGame);
    const newGameFlow = getGameStateForNextHand(gameFlow, euchreSettings, newGame);
    newGameFlow.gameFlow = EuchreGameFlow.BEGIN_DEAL_CARDS;
    dispatchGameFlow({ type: EuchreFlowActionType.SET_STATE, state: newGameFlow });
    dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE });
    setEuchreGame(newGame);
  };

  const handleReplayGame = (gameToReplay: EuchreGameInstance) => {
    setEuchreReplayGame(gameToReplay);
    handleBeginGame();
  };

  const handleAttemptToRecover = () => {
    if (errorState) {
      dispatchGameFlow({ type: EuchreFlowActionType.SET_GAME_FLOW, gameFlow: errorState.gameFlow });
      dispatchGameAnimationFlow({ type: errorState.animationType });
      setErrorState(null);
    }
  };

  //#endregion

  return {
    euchreGame,
    gameFlow,
    gameAnimationFlow,
    playerNotification,
    promptValue,
    euchreSettings,
    events,
    errorState,
    playedCard,
    reset,
    clearEvents,
    handleStartGame,
    handleBeginNewGame,
    handleBidSubmit,
    handleSettingsChange,
    handleCancelGame,
    handleDiscardSubmit,
    handleCloseHandResults,
    handleCardPlayed,
    handleReplayHand,
    handleCancelAndReset,
    handleReplayGame,
    handleAttemptToRecover,
    handleShuffleAndDealComplete,
    handleTrickFinished
  };
}
