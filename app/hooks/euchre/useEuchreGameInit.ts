import {
  EuchreFlowActionType,
  EuchreGameFlow,
  EuchreGameFlowState,
  INIT_GAME_FLOW_STATE
} from './reducers/gameFlowReducer';
import { PlayerNotificationActionType } from './reducers/playerNotificationReducer';
import { EuchreAnimateType, EuchreAnimationActionType } from './reducers/gameAnimationFlowReducer';
import { EuchreGameState } from './useEuchreGame';
import useGameSetupLogic from './logic/useGameSetupLogic';
import { useCallback, useEffect, useState } from 'react';
import useGameStateLogic from './logic/useGameStateLogic';
import useGameData from './data/useGameData';
import { PromptType } from '../../lib/euchre/definitions';

/** Handles game initialization. */
export default function useEuchreGameInit(state: EuchreGameState) {
  const { initDeckForInitialDeal, getGameStateForInitialDeal, createDefaultEuchreGame } = useGameSetupLogic();
  const { isGameStateValidToContinue } = useGameStateLogic();
  const { notificationDelay } = useGameData();
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const animateIntro = async () => {
      if (
        !isGameStateValidToContinue(
          state,
          EuchreGameFlow.BEGIN_INTRO,
          EuchreAnimateType.ANIMATE,
          state.shouldCancel,
          state.onCancel
        )
      )
        return;

      await notificationDelay(state.euchreSettings);

      state.dispatchStateChange(EuchreGameFlow.BEGIN_DEAL_FOR_DEALER, EuchreAnimationActionType.SET_NONE);
    };
    try {
      animateIntro();
    } catch (e) {}
  }, [isGameStateValidToContinue, notificationDelay, state]);

  /**
   * Reset game and game state flow to defaults.
   * */
  const reset = useCallback(
    (resetForBeginGame: boolean) => {
      if (resetForBeginGame) {
        state.dispatchGameFlow({
          type: EuchreFlowActionType.SET_STATE,
          state: {
            ...INIT_GAME_FLOW_STATE,
            shouldShowDeckImages: [],
            shouldShowCardImagesForHand: [],
            shouldShowCardValuesForHand: []
          }
        });

        state.dispatchGameAnimationFlow({
          type: EuchreAnimationActionType.SET_NONE
        });
      } else {
        state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE });
      }

      if (showIntro) {
        state.setPromptValue([{ type: PromptType.INTRO }]);
      } else {
        state.setPromptValue([]);
      }

      state.dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET, payload: undefined });
      state.setBidResult(null);
      state.setPlayedCard(null);
    },
    [showIntro, state]
  );

  /** Create a new euchre game and begin intitial deal.
   *
   */
  const createGame = () => {
    const newGame = initDeckForInitialDeal(state.euchreSettings, state.shouldCancel);
    const newGameFlowState: EuchreGameFlowState = getGameStateForInitialDeal(
      state.euchreGameFlow,
      state.euchreSettings,
      newGame
    );

    state.dispatchGameFlow({
      type: EuchreFlowActionType.SET_STATE,
      state: newGameFlowState
    });
    state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE });

    state.setPromptValue([]);
    state.setEuchreGame(newGame);
    state.setShouldCancel(false);
  };

  /** Cancel the current state and set the current game to null. */
  const cancelAndReset = useCallback(() => {
    state.setShouldCancel(true);
    reset(true);
    state.setEuchreGame(createDefaultEuchreGame());
  }, [createDefaultEuchreGame, reset, state]);

  const handleBeginGame = () => {
    createGame();
  };

  return { reset, handleBeginGame, cancelAndReset, createDefaultEuchreGame };
}
