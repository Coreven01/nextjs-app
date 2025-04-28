import {
  EuchreFlowActionType,
  EuchreGameFlow,
  EuchreGameFlowState,
  INIT_GAME_FLOW_STATE
} from './reducers/gameFlowReducer';
import { PlayerNotificationActionType } from './reducers/playerNotificationReducer';
import { EuchreAnimateType, EuchreAnimationActionType } from './reducers/gameAnimationFlowReducer';
import useGameSetupLogic from './logic/useGameSetupLogic';
import { useCallback, useEffect, useState } from 'react';
import useGameStateLogic from './logic/useGameStateLogic';
import useGameData from './data/useGameData';
import {
  EuchreGameSetters,
  EuchreGameValues,
  GameErrorHandlers
} from '../../lib/euchre/definitions/game-state-definitions';
import { GameEventHandlers } from './useEventLog';
import { PromptType } from '../../lib/euchre/definitions/definitions';
import { EuchrePauseActionType } from './reducers/gamePauseReducer';

/** Handles game initialization. */
export default function useEuchreGameInit(
  state: EuchreGameValues,
  setters: EuchreGameSetters,
  eventHandlers: GameEventHandlers,
  errorHandlers: GameErrorHandlers
) {
  const [showIntro, setShowIntro] = useState(true);
  const { initDeckForInitialDeal, getGameStateForInitialDeal, createDefaultEuchreGame } = useGameSetupLogic();
  const { isGameStateValidToContinue } = useGameStateLogic();
  const { notificationDelay } = useGameData();

  useEffect(() => {
    const animateIntro = async () => {
      if (
        !isGameStateValidToContinue(
          state,
          EuchreGameFlow.BEGIN_INTRO,
          EuchreAnimateType.ANIMATE,
          state.shouldCancel,
          errorHandlers.onCancel
        )
      )
        return;

      await notificationDelay(state.euchreSettings, 1);

      setters.dispatchStateChange(EuchreGameFlow.BEGIN_DEAL_FOR_DEALER, EuchreAnimationActionType.SET_NONE);
    };
    try {
      animateIntro();
    } catch (e) {}
  }, [errorHandlers.onCancel, isGameStateValidToContinue, notificationDelay, setters, state]);

  /**
   * Reset game and game state flow to defaults.
   * */
  const reset = useCallback(
    (resetForBeginGame: boolean) => {
      if (resetForBeginGame) {
        setters.dispatchGameFlow({
          type: EuchreFlowActionType.SET_STATE,
          state: {
            ...INIT_GAME_FLOW_STATE,
            shouldShowDeckImages: [],
            shouldShowCardImagesForHand: [],
            shouldShowCardValuesForHand: []
          }
        });

        setters.dispatchGameAnimationFlow({
          type: EuchreAnimationActionType.SET_NONE
        });
      } else {
        setters.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE });
      }

      if (showIntro) {
        setters.setPromptValue([{ type: PromptType.INTRO }]);
      } else {
        setters.setPromptValue([]);
      }

      setters.dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET, payload: undefined });
      setters.setBidResult(null);
      setters.setPlayedCard(null);
    },
    [setters, showIntro]
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

  const handleBeginGame = () => {
    createGame();
  };

  return { reset, handleBeginGame, cancelAndReset, createDefaultEuchreGame };
}
