import {
  EuchreFlowActionType,
  EuchreGameFlow,
  EuchreGameFlowState,
  INIT_GAME_FLOW_STATE
} from './reducers/gameFlowReducer';
import { PlayerNotificationActionType } from './reducers/playerNotificationReducer';
import { EuchreAnimationActionType } from './reducers/gameAnimationFlowReducer';
import { EuchreGameState } from './useEuchreGame';
import { PromptType } from '@/app/lib/euchre/definitions';
import useGameSetupLogic from './logic/useGameSetupLogic';
import { useCallback, useState } from 'react';

/** Handles game initialization. */
export default function useEuchreGameInit(state: EuchreGameState) {
  const { initDeckForInitialDeal, getGameStateForInitialDeal, createDefaultEuchreGame } = useGameSetupLogic();
  const [showIntro, setShowIntro] = useState(true);

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

      state.dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET, payload: undefined });

      if (showIntro) {
        state.setPromptValue([{ type: PromptType.INTRO }]);
      } else {
        state.setPromptValue([]);
      }

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

    newGameFlowState.gameFlow = EuchreGameFlow.BEGIN_DEAL_FOR_DEALER;

    state.dispatchGameFlow({
      type: EuchreFlowActionType.SET_STATE,
      state: newGameFlowState
    });
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
