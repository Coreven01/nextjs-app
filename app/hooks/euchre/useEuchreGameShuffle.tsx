import { EuchreFlowActionType, EuchreGameFlow, EuchreGameFlowState } from './reducers/gameFlowReducer';
import { EuchreAnimationActionType, EuchreAnimateType } from './reducers/gameAnimationFlowReducer';
import { EuchreGameState } from './useEuchreGame';
import { useCallback, useEffect } from 'react';
import { createEvent } from '@/app/lib/euchre/util';
import { PlayerNotificationActionType } from './reducers/playerNotificationReducer';
import { EuchreGameInstance } from '@/app/lib/euchre/definitions';
import useGameSetupLogic from './logic/useGameSetupLogic';
import useGamePlayLogic from './logic/useGamePlayLogic';
import useGameStateLogic from './logic/useGameStateLogic';

const useEuchreGameShuffle = (state: EuchreGameState) => {
  const { isGameStateValidToContinue } = useGameStateLogic();
  const { shuffleAndDealHand } = useGameSetupLogic();
  const { getGameStateForNextHand } = useGamePlayLogic();

  //#region Shuffle and Deal for regular playthrough *************************************************************************

  /** Shuffle and deal cards for regular game play. Starts the bidding process to determine if the dealer should pick up the flipped card
   * or if a player will name suit. After deal logic is run, begin animation for dealing cards to players. */
  const beginShuffleAndDealHand = useCallback(() => {
    if (
      !isGameStateValidToContinue(
        state,
        EuchreGameFlow.BEGIN_SHUFFLE_CARDS,
        EuchreAnimateType.NONE,
        state.shouldCancel,
        state.onCancel
      )
    )
      return;

    state.dispatchStateChange(EuchreGameFlow.WAIT);

    let newGame: EuchreGameInstance = { ...state.euchreGame };
    if (!newGame.dealer) throw new Error('Dealer not found for shuffle and deal.');

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
    state.addEvent(
      createEvent(
        'i',
        state.euchreSettings,
        newGame.dealer,
        `Dealer flipped up ${newGame.trump.value}-${newGame.trump.suit} for bidding.`
      )
    );

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

  /**
   *
   */
  useEffect(() => {
    try {
      beginShuffleAndDealHand();
    } catch (e) {
      const error = e as Error;
      state.onError(
        error,
        EuchreGameFlow.BEGIN_SHUFFLE_CARDS,
        EuchreAnimationActionType.SET_NONE,
        'beginShuffleAndDealHand'
      );
    }
  }, [beginShuffleAndDealHand, state]);

  /** Animate cards being dealt by an effect in useCardState  */
  useEffect(() => {
    const beginAnimationForDealCards = async () => {
      if (
        !isGameStateValidToContinue(
          state,
          EuchreGameFlow.BEGIN_DEAL_CARDS,
          EuchreAnimateType.ANIMATE,
          state.shouldCancel,
          state.onCancel
        )
      )
        return;

      // this state is being updated by the event handler [handleShuffleAndDealComplete]
      // which gets executed by an effect in useCardState after the animation is complete for dealing cards.

      // wait a short period to make sure the state chage was picked up by the useCardState effect.
      await new Promise((resolve) => setTimeout(resolve, 150));
      state.dispatchStateChange(EuchreGameFlow.WAIT);
    };

    try {
      beginAnimationForDealCards();
    } catch (e) {
      const error = e as Error;
      state.onError(
        error,
        EuchreGameFlow.BEGIN_DEAL_CARDS,
        EuchreAnimationActionType.SET_ANIMATE,
        'beginAnimationForDealCards'
      );
    }
  }, [isGameStateValidToContinue, state]);

  /** Update game state once card animation is complete and begin the bidding game state. */
  const handleShuffleAndDealComplete = () => {
    state.dispatchStateChange(EuchreGameFlow.BEGIN_BID_FOR_TRUMP, EuchreAnimationActionType.SET_NONE);
  };

  //#endregion

  return { handleShuffleAndDealComplete };
};

export default useEuchreGameShuffle;
