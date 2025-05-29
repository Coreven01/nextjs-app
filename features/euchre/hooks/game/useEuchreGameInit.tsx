import {
  EuchreFlowActionType,
  EuchreGameFlow,
  EuchreGameFlowState,
  INIT_GAME_FLOW_STATE
} from '../../state/reducers/gameFlowReducer';
import { NotificationAction, NotificationActionType } from '../../state/reducers/playerNotificationReducer';
import { EuchreAnimationActionType } from '../../state/reducers/gameAnimationFlowReducer';
import { useCallback, useEffect } from 'react';
import {
  ErrorHandlers,
  EuchreGameInstance,
  EuchreGameSetters,
  EuchreGameValues,
  EuchreSettings
} from '../../definitions/game-state-definitions';
import { GameEventHandlers } from '../common/useEventLog';

import { EuchrePauseActionType } from '../../state/reducers/gamePauseReducer';
import useGameInitState from '../../../../app/hooks/euchre/phases/useGameInitState';
import { notificationDelay } from '../../util/game/gameDataUtil';
import {
  createDefaultEuchreGame,
  createGameForInitialDeal,
  getGameStateForInitialDeal
} from '../../util/game/gameSetupLogicUtil';
import { addIntroEvent } from '../../util/game/events/gameInitEventsUtil';
import { PromptType } from '../../definitions/definitions';
import { createGameForReplay } from '../../util/game/gameDebugUtil';
import CenterInfo from '../../components/common/center-info';

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

      const notification: NotificationAction = {
        type: NotificationActionType.CENTER,
        payload: (
          <CenterInfo settings={euchreSettings} delayMs={2000}>
            Have Fun!
          </CenterInfo>
        )
      };

      await notificationDelay(euchreSettings);
      setters.dispatchPlayerNotification(notification);

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
    const newGame: EuchreGameInstance = createGameForInitialDeal(euchreSettings);
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

  /** */
  const setStateForReplay = (replayGame: EuchreGameInstance, autoPlay: boolean) => {
    const newSettings: EuchreSettings = { ...euchreSettings, debugAllComputerPlayers: autoPlay };
    const newReplayGame = { ...replayGame };
    const debugPrompt = promptValues.filter((p) => p === PromptType.DEBUG);
    const newGame: EuchreGameInstance = createGameForReplay(replayGame, newSettings);
    const newGameFlowState: EuchreGameFlowState = getGameStateForInitialDeal(
      euchreGameFlow,
      newSettings,
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
    setters.setEuchreReplayGame(newReplayGame);
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

  return { reset, handleBeginGame, cancelAndReset, createDefaultEuchreGame, setStateForReplay };
}
