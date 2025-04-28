import { useCallback, useMemo, useReducer, useState } from 'react';
import { INIT_PLAYER_NOTIFICATION, playerNotificationReducer } from './reducers/playerNotificationReducer';
import {
  EuchreGameFlow,
  EuchreFlowActionType,
  gameFlowStateReducer,
  INIT_GAME_FLOW_STATE
} from './reducers/gameFlowReducer';
import {
  EuchreAnimationActionType,
  gameAnimationFlowReducer,
  INIT_GAME_ANIMATION_STATE
} from './reducers/gameAnimationFlowReducer';
import {
  BidResult,
  Card,
  INIT_GAME_SETTINGS,
  PromptType,
  PromptValue
} from '@/app/lib/euchre/definitions/definitions';
import { GameEventHandlers, useEventLog } from './useEventLog';
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
import {
  EuchrePauseActionType,
  gamePauseFlowReducer,
  INIT_GAME_WAIT as INIT_PAUSE_STATE
} from './reducers/gamePauseReducer';
import {
  EuchreError,
  EuchreGameHandlers,
  EuchreGameInstance,
  EuchreGameSetters,
  EuchreGameState,
  EuchreGameValues,
  EuchreSettings,
  GameErrorHandlers
} from '../../lib/euchre/definitions/game-state-definitions';
import { InitDealResult } from '../../lib/euchre/definitions/logic-definitions';

const getInitPlayerName = () => {
  const names = ['Joe', 'Jim', 'Jack', 'Jane', 'Joan', 'Jean'];
  const index = Math.round(Math.random() * (names.length - 1));

  return names[index];
};

export default function useEuchreGame() {
  //#region Hooks to store game state *************************************************************************
  const { createDefaultEuchreGame } = useGameSetupLogic();
  const [promptValue, setPromptValue] = useState<PromptValue[]>([{ type: PromptType.INTRO }]);
  const [shouldCancelGame, setShouldCancelGame] = useState(false);
  const [euchreReplayGame, setEuchreReplayGame] = useState<EuchreGameInstance | null>(null);
  const [euchreGame, setEuchreGame] = useState<EuchreGameInstance>(createDefaultEuchreGame());
  const [euchreSettings, setEuchreSettings] = useState<EuchreSettings>({
    ...INIT_GAME_SETTINGS,
    playerName: getInitPlayerName()
  });
  const [errorState, setErrorState] = useState<EuchreError | null>(null);
  const [playedCard, setPlayedCard] = useState<Card | null>(null);
  const [dealResult, setDealResult] = useState<InitDealResult | null>(null);
  const [bidResult, setBidResult] = useState<BidResult | null>(null);
  const { events, addEvent, clearEvents, createEvent } = useEventLog();
  const [playerNotification, dispatchPlayerNotification] = useReducer(playerNotificationReducer, {
    ...INIT_PLAYER_NOTIFICATION
  });
  const [gameFlow, dispatchGameFlow] = useReducer(gameFlowStateReducer, { ...INIT_GAME_FLOW_STATE });
  const [gameAnimationFlow, dispatchGameAnimationFlow] = useReducer(gameAnimationFlowReducer, {
    ...INIT_GAME_ANIMATION_STATE
  });
  const [euchrePauseState, dispatchPauseState] = useReducer(gamePauseFlowReducer, {
    ...INIT_PAUSE_STATE
  });

  const dispatchStateChange = (
    gameAction?: EuchreGameFlow,
    gameAnimationAction?: EuchreAnimationActionType,
    gameWait?: EuchrePauseActionType
  ) => {
    if (gameAction) dispatchGameFlow({ type: EuchreFlowActionType.SET_GAME_FLOW, gameFlow: gameAction });
    if (gameAnimationAction) dispatchGameAnimationFlow({ type: gameAnimationAction });
    if (gameWait) dispatchPauseState({ type: gameWait });
  };

  const handleCancelGame = useCallback(() => {
    if (shouldCancelGame) return;

    dispatchStateChange(undefined, undefined, EuchrePauseActionType.SET_CANCEL);
    setShouldCancelGame(true);
  }, [shouldCancelGame]);

  const setters: EuchreGameSetters = {
    setEuchreGame: setEuchreGame,
    setEuchreSettings: setEuchreSettings,
    setPromptValue: setPromptValue,
    setPlayedCard: setPlayedCard,
    setBidResult: setBidResult,
    setInitialDealerResult: setDealResult,
    setShouldCancelGame: setShouldCancelGame,
    dispatchStateChange: dispatchStateChange,
    dispatchPlayerNotification: dispatchPlayerNotification,
    dispatchGameFlow: dispatchGameFlow,
    dispatchGameAnimationFlow: dispatchGameAnimationFlow
  };

  const state: EuchreGameState = useMemo(() => {
    return {
      euchreGame: euchreGame,
      euchreReplayGame: euchreReplayGame,
      euchreGameFlow: gameFlow,
      euchreSettings: euchreSettings,
      euchrePauseState: euchrePauseState,
      euchreAnimationFlow: gameAnimationFlow
    };
  }, [euchreGame, euchrePauseState, euchreReplayGame, euchreSettings, gameAnimationFlow, gameFlow]);

  const stateValues: EuchreGameValues = {
    euchreGame: state.euchreGame,
    euchreReplayGame: state.euchreReplayGame,
    euchreGameFlow: state.euchreGameFlow,
    euchreSettings: state.euchreSettings,
    euchrePauseState: state.euchrePauseState,
    playerNotification: playerNotification,
    euchreAnimationFlow: state.euchreAnimationFlow,
    promptValue: promptValue,
    playedCard: playedCard,
    bidResult: bidResult,
    initDealer: dealResult,
    shouldCancel: shouldCancelGame
  };

  const handleError = useCallback((e: Error | undefined, func: string) => {
    const error = e as Error;

    dispatchStateChange(undefined, undefined, EuchrePauseActionType.SET_ERROR);
    setErrorState({
      time: new Date(),
      id: uuidv4(),
      message: error ? error.message : undefined,
      func: func
    });
  }, []);

  const eventHandlers: GameEventHandlers = useMemo(
    () => ({
      addEvent,
      clearEvents,
      createEvent
    }),
    [addEvent, clearEvents, createEvent]
  );

  const errorHandlers: GameErrorHandlers = {
    onCancel: handleCancelGame,
    onError: handleError
  };

  const { reverseLastHandPlayed } = useGameData();
  const { getGameStateForNextHand } = useGamePlayLogic();
  const { reset, handleBeginGame, cancelAndReset } = useEuchreGameInit(
    stateValues,
    setters,
    eventHandlers,
    errorHandlers
  );

  useEuchreGameInitDeal(stateValues, setters, eventHandlers, errorHandlers);
  const { handleBeginDealComplete, handleEndDealComplete } = useEuchreGameShuffle(
    stateValues,
    setters,
    eventHandlers,
    errorHandlers
  );

  const { handleBidSubmit } = useEuchreGameBid(stateValues, setters, eventHandlers, errorHandlers);
  const { handleDiscardSubmit } = useEuchreGameOrder(stateValues, setters, eventHandlers, errorHandlers);
  const { handleCardPlayed, handleCloseHandResults, handleTrickFinished } = useEuchreGamePlay(
    stateValues,
    setters,
    eventHandlers,
    errorHandlers
  );

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
      dispatchStateChange(undefined, undefined, EuchrePauseActionType.SET_NONE);
      setErrorState(null);
    }
  };

  const gameEvents: EuchreGameHandlers = {
    reset,
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
    handleBeginDealComplete,
    handleEndDealComplete,
    handleTrickFinished
  };

  //#endregion

  return {
    stateValues,
    eventHandlers,
    errorHandlers,
    gameEvents,
    events,
    errorState
  };
}
