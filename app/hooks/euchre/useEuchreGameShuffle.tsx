import { EuchreFlowActionType, EuchreGameFlow, EuchreGameFlowState } from './reducers/gameFlowReducer';
import { EuchreAnimationActionType, EuchreAnimateType } from './reducers/gameAnimationFlowReducer';
import { EuchreErrorState, EuchreGameState } from './useEuchreGame';
import { useCallback, useEffect } from 'react';
import { createEvent } from '@/app/lib/euchre/util';
import { PlayerNotificationActionType } from './reducers/playerNotificationReducer';
import { EuchreGameInstance } from '@/app/lib/euchre/definitions';
import useGameSetupLogic from './logic/useGameSetupLogic';
import useGamePlayLogic from './logic/useGamePlayLogic';
import useGameStateLogic from './logic/useGameStateLogic';
import { v4 as uuidv4 } from 'uuid';

const useEuchreGameShuffle = (state: EuchreGameState, errorState: EuchreErrorState) => {
  const { isGameStateValidToContinue } = useGameStateLogic();
  const { shuffleAndDealHand } = useGameSetupLogic();
  const { getGameStateForNextHand } = useGamePlayLogic();

  //#region Shuffle and Deal for regular playthrough *************************************************************************

  /** Shuffle and deal cards for regular game play. Starts the bidding process to determine if the dealer should pick up the flipped card
   * or if a player will name suit. After deal logic is run, begin animation for dealing cards to players. */
  const beginShuffleAndDealHand = useCallback(() => {
    if (
      !isGameStateValidToContinue(
        state.euchreGame,
        state.euchreGameFlow,
        state.euchreAnimationFlow,
        EuchreGameFlow.BEGIN_SHUFFLE_CARDS,
        EuchreAnimateType.NONE,
        state.shouldCancel,
        state.onCancel
      )
    )
      return;

    state.dispatchGameFlow({ type: EuchreFlowActionType.SET_GAME_FLOW, gameFlow: EuchreGameFlow.WAIT });

    let newGame: EuchreGameInstance | null = state.euchreGame ? { ...state.euchreGame } : null;
    if (!newGame?.dealer) throw new Error('Dealer not found for shuffle and deal.');

    state.addEvent(
      createEvent('v', state.euchreSettings, newGame.dealer, 'Begin shuffle and deal for regular play.')
    );

    const shuffleResult = shuffleAndDealHand(
      newGame,
      state.euchreSettings,
      state.euchreReplayGame,
      state.shouldCancel
    );

    newGame = shuffleResult.game;

    if (!newGame?.trump) throw Error('Trump not found after shuffle and deal for regular play.');

    state.dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });

    const newGameState: EuchreGameFlowState = getGameStateForNextHand(
      state.euchreGameFlow,
      state.euchreSettings,
      newGame
    );
    newGameState.gameFlow = EuchreGameFlow.BEGIN_DEAL_CARDS;

    state.dispatchGameFlow({ type: EuchreFlowActionType.SET_STATE, state: newGameState });
    state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE });
    state.setEuchreGame(newGame);
  }, [getGameStateForNextHand, isGameStateValidToContinue, shuffleAndDealHand, state]);

  useEffect(() => {
    try {
      beginShuffleAndDealHand();
    } catch (e) {
      const error = e as Error;

      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_GAME_FLOW, gameFlow: EuchreGameFlow.ERROR });
      errorState.setErrorState({
        time: new Date(),
        id: uuidv4(),
        message: error ? error.message : 'Unknown error in beginShuffleAndDealHand',
        gameFlow: EuchreGameFlow.BEGIN_SHUFFLE_CARDS,
        animationType: EuchreAnimationActionType.SET_NONE
      });
    }
  }, [beginShuffleAndDealHand, errorState, state]);

  /**  */
  useEffect(() => {
    const beginAnimationForDealCards = async () => {
      if (
        !isGameStateValidToContinue(
          state.euchreGame,
          state.euchreGameFlow,
          state.euchreAnimationFlow,
          EuchreGameFlow.BEGIN_DEAL_CARDS,
          EuchreAnimateType.ANIMATE,
          state.shouldCancel,
          state.onCancel
        )
      )
        return;

      if (!state.euchreGame) throw new Error();
      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_GAME_FLOW, gameFlow: EuchreGameFlow.WAIT });
    };

    try {
      beginAnimationForDealCards();
    } catch (e) {
      const error = e as Error;

      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_GAME_FLOW, gameFlow: EuchreGameFlow.ERROR });
      errorState.setErrorState({
        time: new Date(),
        id: uuidv4(),
        message: error ? error.message : 'Unknown error in beginAnimationForDealCards',
        gameFlow: EuchreGameFlow.BEGIN_DEAL_CARDS,
        animationType: EuchreAnimationActionType.SET_ANIMATE
      });
    }
  }, [errorState, isGameStateValidToContinue, state]);

  const handleShuffleAndDealComplete = () => {
    state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_NONE });
    state.dispatchGameFlow({
      type: EuchreFlowActionType.SET_GAME_FLOW,
      gameFlow: EuchreGameFlow.BEGIN_BID_FOR_TRUMP
    });
  };
  //#endregion

  return { handleShuffleAndDealComplete };
};

export default useEuchreGameShuffle;
