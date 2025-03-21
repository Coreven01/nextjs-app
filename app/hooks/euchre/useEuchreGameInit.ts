'use client';

import {
  EuchreFlowActionType,
  EuchreGameFlow,
  EuchreGameFlowState,
  INIT_GAME_FLOW_STATE
} from './gameFlowReducer';
import { PlayerNotificationActionType } from './playerNotificationReducer';
import { EuchreActionType } from './gameAnimationFlowReducer';
import { EuchreGameState } from './useEuchreGame';
import { getGameStateForInitialDeal, initDeckForInitialDeal } from '@/app/lib/euchre/game-setup-logic';

export default function useEuchreGameInit(state: EuchreGameState) {
  /**
   *
   */
  const beginNewGame = () => {
    reset(true);
    createGame();
  };

  /**
   * Reset game and game state flow to defaults.
   * */
  const reset = (resetForBeginGame: boolean) => {
    if (resetForBeginGame) {
      state.dispatchGameFlow({
        type: EuchreFlowActionType.UPDATE_ALL,
        payload: {
          ...INIT_GAME_FLOW_STATE,
          shouldShowDeckImages: [],
          shouldShowHandImages: [],
          shouldShowHandValues: []
        }
      });

      state.dispatchGameAnimationFlow({
        type: EuchreActionType.SET_ANIMATE_NONE
      });
    } else {
      state.dispatchGameAnimationFlow({
        type: EuchreActionType.SET_ANIMATE_DEAL_CARDS_FOR_REGULAR_PLAY
      });
    }

    state.dispatchPlayerNotification({
      type: PlayerNotificationActionType.RESET,
      payload: undefined
    });

    state.setPromptValue([]);
    state.setBidResult(null);
    state.setPlayedCard(null);
  };

  /** Create a new euchre game and begin intitial deal. */
  const createGame = () => {
    const newGame = initDeckForInitialDeal(state.shouldCancel);
    const newGameFlowState: EuchreGameFlowState = getGameStateForInitialDeal(
      state.euchreGameFlow,
      state.euchreSettings,
      newGame
    );

    newGameFlowState.gameFlow = EuchreGameFlow.BEGIN_DEAL_FOR_DEALER;

    state.dispatchGameFlow({
      type: EuchreFlowActionType.UPDATE_ALL,
      payload: newGameFlowState
    });
    state.setEuchreGame(newGame);
    state.setShouldCancel(false);
  };

  return { reset, beginNewGame };
}
