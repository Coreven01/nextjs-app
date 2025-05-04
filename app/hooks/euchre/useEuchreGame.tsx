import { useCallback, useMemo, useState } from 'react';
import { EuchreGameFlow, EuchreFlowActionType } from './reducers/gameFlowReducer';
import { EuchreAnimationActionType } from './reducers/gameAnimationFlowReducer';
import { GameEventHandlers, useEventLog } from './useEventLog';
import useEuchreGameInit from './useEuchreGameInit';
import useEuchreGameInitDeal from './useEuchreGameInitDeal';
import useEuchreGameShuffle from './useEuchreGameShuffle';
import useEuchreGameBid from './useEuchreGameBid';
import useEuchreGameOrder from './useEuchreGameOrder';
import useEuchreGamePlay from './useEuchreGamePlay';
import useGameData from './data/useGameData';
import useGamePlayLogic from './logic/useGamePlayLogic';
import { v4 as uuidv4 } from 'uuid';
import { EuchrePauseActionType } from './reducers/gamePauseReducer';
import {
  EuchreAnimationHandlers,
  EuchreError,
  EuchreGamePlayHandlers,
  EuchreGameInstance,
  EuchreSettings,
  ErrorHandlers
} from '../../lib/euchre/definitions/game-state-definitions';
import useEuchreGameState from './state/useEuchreGameState';

export default function useEuchreGame() {
  //#region Hooks to store game state *************************************************************************

  const { state, stateValues, setters, handleSaveSettings } = useEuchreGameState();
  const { events, addEvent, clearEvents, createEvent } = useEventLog();
  const [errorState, setErrorState] = useState<EuchreError | null>(null);
  const { reverseLastHandPlayed } = useGameData();
  const { getGameStateForNextHand } = useGamePlayLogic();

  const handleCancelGame = useCallback(() => {
    if (stateValues.shouldCancel) return;

    setters.dispatchStateChange(undefined, undefined, EuchrePauseActionType.SET_CANCEL);
    setters.setShouldCancelGame(true);
  }, [setters, stateValues.shouldCancel]);

  const handleError = useCallback(
    (e: Error | undefined, func: string) => {
      const error = e as Error;

      setters.dispatchStateChange(undefined, undefined, EuchrePauseActionType.SET_ERROR);
      setErrorState({
        time: new Date(),
        id: uuidv4(),
        message: error ? error.message : undefined,
        func: func
      });
    },
    [setters]
  );

  const eventHandlers: GameEventHandlers = useMemo(
    () => ({
      addEvent,
      clearEvents,
      createEvent
    }),
    [addEvent, clearEvents, createEvent]
  );

  const handleAsync = useCallback(
    (fn: () => Promise<void>, onError: (e: Error, name: string) => void, fnName: string) => {
      fn().catch((e) => {
        const err = e as Error;
        onError(err, fnName);
      });
    },
    []
  );

  const errorHandlers: ErrorHandlers = useMemo(
    () => ({
      onCancel: handleCancelGame,
      onError: handleError,
      catchAsync: handleAsync
    }),
    [handleAsync, handleCancelGame, handleError]
  );

  //#region Game play hooks
  const { reset, handleBeginGame, cancelAndReset } = useEuchreGameInit(
    stateValues,
    setters,
    eventHandlers,
    errorHandlers
  );

  const { handleBeginDealForDealerComplete, handleEndDealForDealerComplete } = useEuchreGameInitDeal(
    stateValues,
    setters,
    eventHandlers,
    errorHandlers
  );

  const { handleBeginRegularDealComplete, handleEndRegularDealComplete } = useEuchreGameShuffle(
    stateValues,
    setters,
    eventHandlers,
    errorHandlers
  );

  const { handleBidSubmit, handlePassDealComplete } = useEuchreGameBid(
    stateValues,
    setters,
    eventHandlers,
    errorHandlers
  );
  const { handleDiscardSubmit } = useEuchreGameOrder(stateValues, setters, eventHandlers, errorHandlers);
  const { handleCardPlayed, handleCloseHandResults, handleTrickFinished } = useEuchreGamePlay(
    stateValues,
    setters,
    eventHandlers,
    errorHandlers
  );
  //#endregion

  //#region Other Handlers *************************************************************************

  const handleBeginNewGame = useCallback(() => {
    setters.setEuchreReplayGame(null);
    handleBeginGame();
  }, [handleBeginGame, setters]);

  /** */
  const handleSettingsChange = useCallback(
    (settings: EuchreSettings) => {
      handleSaveSettings(settings);
    },
    [handleSaveSettings]
  );

  const handleCancelAndReset = useCallback(() => {
    cancelAndReset();
  }, [cancelAndReset]);

  /** Reverse game state to play the hand again. Used for testing/debugging */
  const handleReplayHand = useCallback(() => {
    setters.setPromptValue([]);
    const newGame = reverseLastHandPlayed(state.euchreGame);
    const newGameFlow = getGameStateForNextHand(state.euchreGameFlow, state.euchreSettings, newGame);
    newGameFlow.gameFlow = EuchreGameFlow.BEGIN_DEAL_CARDS;
    setters.dispatchGameFlow({ type: EuchreFlowActionType.SET_STATE, state: newGameFlow });
    setters.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE });
    setters.setEuchreGame(newGame);
  }, [
    getGameStateForNextHand,
    reverseLastHandPlayed,
    setters,
    state.euchreGame,
    state.euchreGameFlow,
    state.euchreSettings
  ]);

  const handleReplayGame = useCallback(
    (gameToReplay: EuchreGameInstance) => {
      setters.setEuchreReplayGame(gameToReplay);
      handleBeginGame();
    },
    [handleBeginGame, setters]
  );

  const handleAttemptToRecover = useCallback(() => {
    if (errorState) {
      setters.dispatchStateChange(undefined, undefined, EuchrePauseActionType.SET_NONE);
      setErrorState(null);
    }
  }, [errorState, setters]);

  const gameHandlers: EuchreGamePlayHandlers = useMemo(
    () => ({
      reset,
      handleBeginNewGame,
      handleBidSubmit,
      handleSettingsChange,
      handleCancelGame,
      handleDiscardSubmit,
      handleCloseHandResults,
      handleReplayHand,
      handleCancelAndReset,
      handleReplayGame,
      handleAttemptToRecover
    }),
    [
      handleAttemptToRecover,
      handleBeginNewGame,
      handleBidSubmit,
      handleCancelAndReset,
      handleCancelGame,
      handleCloseHandResults,
      handleDiscardSubmit,
      handleReplayGame,
      handleReplayHand,
      handleSettingsChange,
      reset
    ]
  );

  const animationHandlers: EuchreAnimationHandlers = useMemo(
    () => ({
      handleBeginRegularDealComplete,
      handleEndRegularDealComplete,
      handleTrickFinished,
      handleBeginDealForDealerComplete,
      handleEndDealForDealerComplete,
      handleCardPlayed,
      handlePassDealComplete
    }),
    [
      handleBeginDealForDealerComplete,
      handleBeginRegularDealComplete,
      handleCardPlayed,
      handleEndDealForDealerComplete,
      handleEndRegularDealComplete,
      handleTrickFinished,
      handlePassDealComplete
    ]
  );

  //#endregion

  return {
    stateValues,
    eventHandlers,
    errorHandlers,
    gameHandlers,
    events,
    errorState,
    animationHandlers
  };
}
