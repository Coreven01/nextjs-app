import { useCallback, useMemo, useState } from 'react';
import { EuchreFlowActionType } from '../../state/reducers/gameFlowReducer';
import { EuchreAnimationActionType } from '../../state/reducers/gameAnimationFlowReducer';
import { GameEventHandlers, useEventLog } from '../common/useEventLog';
import useEuchreGameInit from './useEuchreGameInit';
import useEuchreGameInitDeal from './useEuchreGameInitDeal';
import useEuchreGameOrder from './useEuchreGameOrder';
import { v4 as uuidv4 } from 'uuid';
import { EuchrePauseActionType } from '../../state/reducers/gamePauseReducer';
import { getGameStateForNextHand } from '../../util/game/gamePlayLogicUtil';
import useEuchreGameState from '../../../../app/hooks/euchre/state/useEuchreGameState';
import {
  ErrorHandlers,
  EuchreAnimationHandlers,
  EuchreError,
  EuchreGameInstance,
  EuchreGamePlayHandlers,
  EuchreSettings,
  GamePlayContext
} from '../../definitions/game-state-definitions';
import { PromptType } from '../../definitions/definitions';
import useEuchreGameBid from './useEuchreGameBid';
import useEuchreGameShuffle from './useEuchreGameShuffle';
import useEuchreGamePlay from './useEuchreGamePlay';

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
  const { reset, handleBeginGame, cancelAndReset, setStateForReplay } = useEuchreGameInit(
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
  const { handleDiscardSubmit, handleTrumpOrderedComplete } = useEuchreGameOrder(
    stateValues,
    setters,
    eventHandlers,
    errorHandlers
  );
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
    setters.setShouldReplayHand(true);
    setters.removePromptValue(PromptType.HAND_RESULT);

    setters.dispatchGameFlow({
      type: EuchreFlowActionType.SET_STATE,
      state: getGameStateForNextHand(state.euchreGameFlow, state.euchreSettings, state.euchreGame.gamePlayers)
    });

    setters.dispatchStateChange(
      undefined,
      EuchreAnimationActionType.SET_NONE,
      EuchrePauseActionType.SET_NONE
    );
  }, [setters, state.euchreGame, state.euchreGameFlow, state.euchreSettings]);

  const handleReplayGame = useCallback(
    (gameToReplay: EuchreGameInstance, autoPlay: boolean) => {
      const newSettings: EuchreSettings = { ...state.euchreSettings, debugAllComputerPlayers: autoPlay };
      setStateForReplay(gameToReplay, autoPlay);
      handleSaveSettings(newSettings);
    },
    [handleSaveSettings, setStateForReplay, state.euchreSettings]
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
      onCardPlayedComplete: handleCardPlayedComplete,
      onTrumpOrderedComplete: handleTrumpOrderedComplete
    }),
    [
      handleBeginRegularDealComplete,
      handleEndRegularDealComplete,
      handleTrickFinished,
      handleBeginDealForDealerComplete,
      handleEndDealForDealerComplete,
      handleCardPlayed,
      handlePassDealComplete,
      handleCardPlayedComplete,
      handleTrumpOrderedComplete
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
