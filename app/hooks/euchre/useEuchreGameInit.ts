import { EuchreFlowActionType, EuchreGameFlowState, INIT_GAME_FLOW_STATE } from './reducers/gameFlowReducer';
import { PlayerNotificationActionType } from './reducers/playerNotificationReducer';
import { EuchreAnimationActionType } from './reducers/gameAnimationFlowReducer';
import useGameSetupLogic from './logic/useGameSetupLogic';
import { useCallback, useEffect, useState } from 'react';
import useGameData from './data/useGameData';
import {
  EuchreGameInstance,
  EuchreGameSetters,
  EuchreGameValues,
  ErrorHandlers
} from '../../lib/euchre/definitions/game-state-definitions';
import { GameEventHandlers } from './useEventLog';
import { PromptType } from '../../lib/euchre/definitions/definitions';
import { EuchrePauseActionType } from './reducers/gamePauseReducer';
import useGameInitState from './phases/useGameInitState';
import useGameEventsInit from './events/useGameEventsInit';

/** Handles game initialization. */
export default function useEuchreGameInit(
  state: EuchreGameValues,
  setters: EuchreGameSetters,
  eventHandlers: GameEventHandlers,
  errorHandlers: ErrorHandlers
) {
  const { addIntroEvent } = useGameEventsInit(state, eventHandlers);
  const { shouldBeginIntro, continueToBeginDealCardsForDealer } = useGameInitState(
    state,
    setters,
    errorHandlers
  );
  const [showIntro, setShowIntro] = useState(true);
  const { createGameForInitialDeal, getGameStateForInitialDeal, createDefaultEuchreGame } =
    useGameSetupLogic();
  const { notificationDelay } = useGameData();

  /** Show an introduction to the game when the board loads. */
  useEffect(() => {
    const animateIntro = async () => {
      if (!shouldBeginIntro) return;

      setters.dispatchPause();
      addIntroEvent();
      await notificationDelay(state.euchreSettings, 1);

      continueToBeginDealCardsForDealer();
    };

    try {
      animateIntro();
    } catch (e) {}
  }, [
    addIntroEvent,
    continueToBeginDealCardsForDealer,
    notificationDelay,
    setters,
    shouldBeginIntro,
    state.euchreSettings
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
        EuchrePauseActionType.SET_NONE
      );

      if (showIntro) {
        setters.setPromptValue([{ type: PromptType.INTRO }]);
      } else {
        setters.setPromptValue([]);
      }

      setters.dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });
      setters.setBidResult(null);
      setters.setPlayedCard(null);
    },
    [setters, showIntro]
  );

  /** Create a new euchre game and begin intitial deal.
   *
   */
  const createGame = () => {
    const newGame: EuchreGameInstance = createGameForInitialDeal(state.euchreSettings, false);
    const newGameFlowState: EuchreGameFlowState = getGameStateForInitialDeal(
      state.euchreGameFlow,
      state.euchreSettings,
      newGame
    );

    setters.dispatchGameFlow({
      type: EuchreFlowActionType.SET_STATE,
      state: newGameFlowState
    });
    setters.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE });

    setters.setPromptValue([]);
    setters.setEuchreGame(newGame);
    setters.setShouldCancelGame(false);
  };

  /** Cancel the current state and set the current game to null. */
  const cancelAndReset = useCallback(() => {
    setters.setShouldCancelGame(true);
    reset(true);
    setters.setEuchreGame(createDefaultEuchreGame());
  }, [createDefaultEuchreGame, reset, setters]);

  /** */
  const handleBeginGame = () => {
    createGame();
  };

  return { reset, handleBeginGame, cancelAndReset, createDefaultEuchreGame };
}
