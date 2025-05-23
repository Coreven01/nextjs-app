import {
  EuchreFlowActionType,
  EuchreGameFlow,
  EuchreGameFlowState,
  INIT_GAME_FLOW_STATE
} from '../reducers/gameFlowReducer';
import { NotificationActionType } from '../reducers/playerNotificationReducer';
import { EuchreAnimationActionType } from '../reducers/gameAnimationFlowReducer';
import { useCallback, useEffect } from 'react';
import {
  ErrorHandlers,
  EuchreAnimationHandlers,
  EuchreError,
  EuchreGameInstance,
  EuchreGamePlayHandlers,
  EuchreGameSetters,
  EuchreGameValues,
  EuchreSettings,
  GamePlayContext
} from '../../../../features/euchre/definitions/game-state-definitions';
import { GameEventHandlers } from '../useEventLog';

import { EuchrePauseActionType } from '../reducers/gamePauseReducer';
import useGameInitState from '../phases/useGameInitState';
import { notificationDelay } from '../../../../features/euchre/util/game/gameDataUtil';
import {
  createDefaultEuchreGame,
  createEuchreGame,
  createGameForInitialDeal,
  getGameStateForInitialDeal
} from '../../../../features/euchre/util/game/gameSetupLogicUtil';
import { addIntroEvent } from '../../../../features/euchre/util/game/gameInitEventsUtil';
import { PromptType } from '../../../../features/euchre/definitions/definitions';

/** Handles game initialization. */
export default function useEuchreGameInit(
  state: EuchreGameValues,
  setters: EuchreGameSetters,
  eventHandlers: GameEventHandlers,
  errorHandlers: ErrorHandlers
) {
  const { shouldBeginIntro, continueToBeginDealCardsForDealer } = useGameInitState(
    state,
    setters,
    errorHandlers
  );

  const { euchreSettings, euchreGameFlow, promptValues } = state;

  /** Show an introduction to the game when the board loads. */
  useEffect(() => {
    const animateIntro = async () => {
      if (!shouldBeginIntro) return;

      setters.dispatchPause();
      addIntroEvent(state, eventHandlers);
      await notificationDelay(euchreSettings);

      continueToBeginDealCardsForDealer();
    };

    errorHandlers.catchAsync(animateIntro, errorHandlers.onError, 'animateIntro');
  }, [
    continueToBeginDealCardsForDealer,
    errorHandlers,
    euchreSettings,
    eventHandlers,
    setters,
    shouldBeginIntro,
    state
  ]);

  /**
   * Reset game and game state flow to defaults.
   * */
  const reset = useCallback(
    (resetForBeginGame: boolean) => {
      if (resetForBeginGame) {
        setters.dispatchGameFlow({
          type: EuchreFlowActionType.SET_STATE,
          state: { ...INIT_GAME_FLOW_STATE }
        });
      }

      setters.dispatchStateChange(
        undefined,
        EuchreAnimationActionType.SET_NONE,
        EuchrePauseActionType.SET_GENERAL
      );

      setters.replacePromptValues([PromptType.INTRO]);
      setters.dispatchPlayerNotification({ type: NotificationActionType.RESET });
      setters.setBidResult(null);
      setters.setPlayedCard(null);
      setters.setInitialDealerResult(null);
    },
    [setters]
  );

  /** Create a new euchre game and begin intitial deal.
   *
   */
  const createGame = () => {
    const newGame: EuchreGameInstance = createGameForInitialDeal(euchreSettings, false);
    const newGameFlowState: EuchreGameFlowState = getGameStateForInitialDeal(
      euchreGameFlow,
      euchreSettings,
      newGame.gamePlayers
    );

    setters.dispatchGameFlow({
      type: EuchreFlowActionType.SET_STATE,
      state: newGameFlowState
    });
    setters.dispatchStateChange(
      undefined,
      EuchreAnimationActionType.SET_ANIMATE,
      EuchrePauseActionType.SET_NONE
    );

    const debugPrompt = promptValues.filter((p) => p === PromptType.DEBUG);
    setters.replacePromptValues([...debugPrompt]);
    setters.setEuchreGame(newGame);
    setters.setShouldCancelGame(false);
  };

  const createGameForReplay = () => {
    if (!state.euchreReplayGame) throw new Error('Replay game not found.');

    const debugPrompt = promptValues.filter((p) => p === PromptType.DEBUG);
    const newGame: EuchreGameInstance = createEuchreGame(euchreSettings);
    newGame.deck = state.euchreReplayGame.originalDealDeck;
    const newGameFlowState: EuchreGameFlowState = getGameStateForInitialDeal(
      euchreGameFlow,
      euchreSettings,
      newGame.gamePlayers
    );

    newGameFlowState.gameFlow = EuchreGameFlow.BEGIN_DEAL_FOR_DEALER;

    setters.dispatchGameFlow({
      type: EuchreFlowActionType.SET_STATE,
      state: newGameFlowState
    });

    setters.dispatchStateChange(
      undefined,
      EuchreAnimationActionType.SET_NONE,
      EuchrePauseActionType.SET_NONE
    );

    setters.replacePromptValues([...debugPrompt]);
    setters.setEuchreGame(newGame);
    setters.setShouldCancelGame(false);
  };

  /** Cancel the current state and set the current game to null. */
  const cancelAndReset = useCallback(() => {
    setters.setShouldCancelGame(true);
    reset(true);
    setters.setEuchreGame(createDefaultEuchreGame());
  }, [reset, setters]);

  /** */
  const handleBeginGame = () => {
    createGame();
  };

  return { reset, handleBeginGame, cancelAndReset, createDefaultEuchreGame, createGameForReplay };
}
