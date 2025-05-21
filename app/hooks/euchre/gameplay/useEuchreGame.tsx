import { useCallback, useMemo, useState } from 'react';
import { EuchreGameFlow, EuchreFlowActionType } from '../reducers/gameFlowReducer';
import { EuchreAnimationActionType } from '../reducers/gameAnimationFlowReducer';
import { GameEventHandlers, useEventLog } from '../useEventLog';
import useEuchreGameInit from './useEuchreGameInit';
import useEuchreGameInitDeal from './useEuchreGameInitDeal';
import useEuchreGameShuffle from './useEuchreGameShuffle';
import useEuchreGameBid from './useEuchreGameBid';
import useEuchreGameOrder from './useEuchreGameOrder';
import useEuchreGamePlay from './useEuchreGamePlay';
import { v4 as uuidv4 } from 'uuid';
import { EuchrePauseActionType } from '../reducers/gamePauseReducer';
import {
  EuchreAnimationHandlers,
  EuchreError,
  EuchreGamePlayHandlers,
  EuchreGameInstance,
  EuchreSettings,
  ErrorHandlers,
  GamePlayContext
} from '../../../lib/euchre/definitions/game-state-definitions';
import useEuchreGameState from '../state/useEuchreGameState';
import { PromptType } from '../../../lib/euchre/definitions/definitions';
import { reverseLastHandPlayed } from '../../../lib/euchre/util/gameDataUtil';
import { getGameStateForNextHand } from '../../../lib/euchre/util/gamePlayLogicUtil';

/** Main euchre game hook that aggregates logic from different states of the game. */
export default function useEuchreGame() {
  //#region Hooks to store game state *************************************************************************

  const { state, stateValues, setters, handleSaveSettings } = useEuchreGameState();
  const { events, addEvent, clearEvents, createEvent } = useEventLog();
  const [errorState, setErrorState] = useState<EuchreError | null>(null);

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

  const handleAttemptToRecover = useCallback(() => {
    if (errorState) {
      setters.dispatchStateChange(undefined, undefined, EuchrePauseActionType.SET_NONE);
      setErrorState(null);
    }
  }, [errorState, setters]);

  const handleAsync = useCallback(
    async (fn: () => Promise<void>, onError: (e: Error, name: string) => void, fnName: string) => {
      await fn().catch((e) => {
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
      onResetError: handleAttemptToRecover,
      catchAsync: handleAsync
    }),
    [handleAsync, handleAttemptToRecover, handleCancelGame, handleError]
  );

  //#region Game play hooks
  const { reset, handleBeginGame, cancelAndReset, createGameForReplay } = useEuchreGameInit(
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
  const { handleCardPlayed, handleCardPlayedComplete, handleCloseHandResults, handleTrickFinished } =
    useEuchreGamePlay(stateValues, setters, eventHandlers, errorHandlers);
  //#endregion

  //#region Other Handlers *************************************************************************

  const handleBeginNewGame = useCallback(() => {
    setters.setEuchreReplayGame(null);
    setters.removePromptValue(PromptType.INTRO);
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
    setters.removePromptValue(PromptType.HAND_RESULT);
    const newGame = reverseLastHandPlayed(state.euchreGame);
    const newGameFlow = getGameStateForNextHand(
      state.euchreGameFlow,
      state.euchreSettings,
      newGame.gamePlayers
    );
    newGameFlow.gameFlow = state.euchreSettings.shouldAnimateDeal
      ? EuchreGameFlow.BEGIN_DEAL_CARDS
      : EuchreGameFlow.END_DEAL_CARDS;
    setters.dispatchGameFlow({ type: EuchreFlowActionType.SET_STATE, state: newGameFlow });
    setters.dispatchStateChange(
      undefined,
      EuchreAnimationActionType.SET_ANIMATE,
      EuchrePauseActionType.SET_NONE
    );
    setters.setEuchreGame(newGame);
  }, [setters, state.euchreGame, state.euchreGameFlow, state.euchreSettings]);

  const handleReplayGame = useCallback(
    (gameToReplay: EuchreGameInstance) => {
      setters.setEuchreReplayGame(gameToReplay);
      createGameForReplay();
    },
    [createGameForReplay, setters]
  );

  const gameHandlers: EuchreGamePlayHandlers = useMemo(
    () => ({
      reset: reset,
      onBeginNewGame: handleBeginNewGame,
      onBidSubmit: handleBidSubmit,
      onSettingsChange: handleSettingsChange,
      onCancelGame: handleCancelGame,
      onDiscardSubmit: handleDiscardSubmit,
      onCloseHandResults: handleCloseHandResults,
      onReplayGame: handleReplayGame,
      onCancelAndReset: handleCancelAndReset,
      onReplayHand: handleReplayHand
    }),
    [
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
      onBeginRegularDealComplete: handleBeginRegularDealComplete,
      onEndRegularDealComplete: handleEndRegularDealComplete,
      onTrickFinished: handleTrickFinished,
      onBeginDealForDealerComplete: handleBeginDealForDealerComplete,
      onEndDealForDealerComplete: handleEndDealForDealerComplete,
      onCardPlayed: handleCardPlayed,
      onPassDealComplete: handlePassDealComplete,
      onCardPlayedComplete: handleCardPlayedComplete
    }),
    [
      handleBeginRegularDealComplete,
      handleEndRegularDealComplete,
      handleTrickFinished,
      handleBeginDealForDealerComplete,
      handleEndDealForDealerComplete,
      handleCardPlayed,
      handlePassDealComplete,
      handleCardPlayedComplete
    ]
  );

  const gameContext: GamePlayContext = useMemo(
    () => ({
      state: state,
      animationHandlers: animationHandlers,
      errorHandlers: errorHandlers,
      eventHandlers: eventHandlers
    }),
    [animationHandlers, errorHandlers, eventHandlers, state]
  );

  //#endregion

  return {
    gameContext,
    stateValues,
    setters,
    gameHandlers,
    events,
    errorState
  };
}
