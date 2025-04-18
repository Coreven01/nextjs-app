import { Card, EuchreGameInstance, PromptType } from '@/app/lib/euchre/definitions';
import { EuchreFlowActionType, EuchreGameFlow } from './reducers/gameFlowReducer';
import {
  getPlayerNotificationType,
  PlayerNotificationAction,
  PlayerNotificationActionType
} from './reducers/playerNotificationReducer';
import { EuchreAnimationActionType, EuchreAnimateType } from './reducers/gameAnimationFlowReducer';
import { EuchreErrorState, EuchreGameState } from './useEuchreGame';
import { useCallback, useEffect } from 'react';
import PlayerNotification from '@/app/ui/euchre/player/player-notification';
import { createEvent } from '@/app/lib/euchre/util';
import useGameStateLogic from './logic/useGameStateLogic';
import useGameBidLogic from './logic/useGameBidLogic';
import useGameData from './data/useGameData';
import usePlayerData from './data/usePlayerData';
import { v4 as uuidv4 } from 'uuid';

export default function useEuchreGameOrder(state: EuchreGameState, errorState: EuchreErrorState) {
  const { isGameStateValidToContinue } = useGameStateLogic();
  const { orderTrump, determineDiscard } = useGameBidLogic();
  const { incrementSpeed, playerSittingOut } = useGameData();
  const { discard, indexCards, playerEqual } = usePlayerData();

  //#region Order Trump *************************************************************************

  /** Player has ordered trump either by naming suit or telling the dealer to pick up the flipped card.
   */
  const beginOrderTrump = useCallback(() => {
    if (
      !isGameStateValidToContinue(
        state.euchreGame,
        state.euchreGameFlow,
        state.euchreAnimationFlow,
        EuchreGameFlow.BEGIN_ORDER_TRUMP,
        EuchreAnimateType.NONE,
        state.shouldCancel,
        state.onCancel
      )
    )
      return;

    state.dispatchGameFlow({ type: EuchreFlowActionType.SET_GAME_FLOW, gameFlow: EuchreGameFlow.WAIT });

    let newGame: EuchreGameInstance | null = state.euchreGame ? { ...state.euchreGame } : null;

    if (!newGame) throw new Error('Game not found for trump ordered.');
    if (!state.bidResult) throw new Error('Bid result not found.');
    state.addEvent(
      createEvent(
        'i',
        state.euchreSettings,
        newGame.currentPlayer ?? undefined,
        `Trump called. Loner: ${state.bidResult.loner}`
      )
    );

    newGame = orderTrump(newGame, state.bidResult);

    if (!newGame.dealer) throw Error('Dealer not found - Order Trump.');
    if (!newGame.maker) throw Error('Maker not found - Order Trump.');

    if (state.bidResult.loner) {
      const partnerSittingOut = newGame.gamePlayers.find(
        (p) => p.team === newGame.maker?.team && p !== newGame.maker
      );
      if (partnerSittingOut) {
        const playerSetting = state.euchreGameFlow.shouldShowCardImagesForHand.find(
          (i) => i.player === partnerSittingOut
        );

        if (playerSetting) playerSetting.value = false;
        state.dispatchGameFlow({
          type: EuchreFlowActionType.SET_STATE,
          state: { ...state.euchreGameFlow }
        });
      }
    }

    state.dispatchGameFlow({
      type: EuchreFlowActionType.SET_GAME_FLOW,
      gameFlow: EuchreGameFlow.BEGIN_ORDER_TRUMP
    });
    state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE });
    state.setEuchreGame(newGame);
  }, [isGameStateValidToContinue, orderTrump, state]);

  /**
   *
   */
  useEffect(() => {
    try {
      beginOrderTrump();
    } catch (e) {
      const error = e as Error;

      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_GAME_FLOW, gameFlow: EuchreGameFlow.ERROR });
      errorState.setErrorState({
        time: new Date(),
        id: uuidv4(),
        message: error ? error.message : 'Unknown error in beginOrderTrump',
        gameFlow: EuchreGameFlow.BEGIN_ORDER_TRUMP,
        animationType: EuchreAnimationActionType.SET_NONE
      });
    }
  }, [beginOrderTrump, errorState, state]);

  /**
   *
   */
  useEffect(() => {
    const beginAnimationOrderTrump = async () => {
      if (
        !isGameStateValidToContinue(
          state.euchreGame,
          state.euchreGameFlow,
          state.euchreAnimationFlow,
          EuchreGameFlow.BEGIN_ORDER_TRUMP,
          EuchreAnimateType.ANIMATE,
          state.shouldCancel,
          state.onCancel
        )
      )
        return;

      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_GAME_FLOW, gameFlow: EuchreGameFlow.WAIT });

      const game: EuchreGameInstance | null = state.euchreGame;

      if (!game?.dealer) throw new Error('Game dealer not found for animation trump ordered.');
      if (!state.bidResult) throw new Error('Bid result not found');
      if (!game.maker) throw Error('Maker not found - Order Trump.');

      const orderType = state.bidResult.calledSuit ? 'named' : 'order';
      const notification: PlayerNotificationAction = {
        type: getPlayerNotificationType(game.maker.playerNumber),
        payload: (
          <PlayerNotification
            dealer={game.dealer}
            player={game.maker}
            settings={state.euchreSettings}
            info={orderType}
            loner={state.bidResult.loner}
            namedSuit={state.bidResult.calledSuit}
          />
        )
      };

      state.dispatchPlayerNotification(notification);
      await new Promise((resolve) =>
        setTimeout(resolve, incrementSpeed(state.euchreSettings.notificationSpeed, 1))
      );

      state.dispatchPlayerNotification({
        type: PlayerNotificationActionType.UPDATE_CENTER,
        payload: undefined
      });

      state.dispatchGameFlow({
        type: EuchreFlowActionType.SET_GAME_FLOW,
        gameFlow: EuchreGameFlow.END_ORDER_TRUMP
      });
      state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_NONE });
    };

    try {
      beginAnimationOrderTrump();
    } catch (e) {
      const error = e as Error;

      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_GAME_FLOW, gameFlow: EuchreGameFlow.ERROR });
      errorState.setErrorState({
        time: new Date(),
        id: uuidv4(),
        message: error ? error.message : 'Unknown error in beginAnimationOrderTrump',
        gameFlow: EuchreGameFlow.BEGIN_ORDER_TRUMP,
        animationType: EuchreAnimationActionType.SET_ANIMATE
      });
    }
  }, [
    determineDiscard,
    discard,
    errorState,
    incrementSpeed,
    isGameStateValidToContinue,
    playerEqual,
    playerSittingOut,
    state
  ]);

  const endOrderTrump = useCallback(() => {
    if (
      !isGameStateValidToContinue(
        state.euchreGame,
        state.euchreGameFlow,
        state.euchreAnimationFlow,
        EuchreGameFlow.END_ORDER_TRUMP,
        EuchreAnimateType.NONE,
        state.shouldCancel,
        state.onCancel
      )
    )
      return;

    state.dispatchGameFlow({ type: EuchreFlowActionType.SET_GAME_FLOW, gameFlow: EuchreGameFlow.WAIT });

    const newGame: EuchreGameInstance | null = state.euchreGame ? { ...state.euchreGame } : null;

    if (!newGame?.dealer) throw new Error('Game dealer not found for animation trump ordered.');
    if (!state.bidResult) throw new Error('Bid result not found');
    if (!newGame.maker) throw Error('Maker not found - Order Trump.');

    let shouldDiscard = state.bidResult.calledSuit === null;
    const sittingOut = playerSittingOut(newGame);

    if (shouldDiscard && sittingOut && playerEqual(newGame.dealer, sittingOut)) {
      shouldDiscard = false;
    }

    if (newGame.dealer.human && shouldDiscard) {
      state.dispatchGameFlow({
        type: EuchreFlowActionType.SET_GAME_FLOW,
        gameFlow: EuchreGameFlow.AWAIT_PROMPT
      });
      state.setPromptValue([{ type: PromptType.DISCARD }]);
    } else {
      if (shouldDiscard) {
        newGame.discard = determineDiscard(newGame, newGame.dealer, state.euchreSettings.difficulty);
        newGame.dealer.hand = discard(newGame.dealer, newGame.discard, newGame.trump);

        state.addEvent(
          createEvent(
            'd',
            state.euchreSettings,
            newGame.dealer ?? undefined,
            `Dealer discarded: ${newGame.discard.value}-${newGame.discard.suit}`
          )
        );
      }

      state.dispatchGameFlow({
        type: EuchreFlowActionType.SET_GAME_FLOW,
        gameFlow: EuchreGameFlow.END_ORDER_TRUMP
      });
      state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE });
      state.setEuchreGame(newGame);
    }
  }, [determineDiscard, discard, isGameStateValidToContinue, playerEqual, playerSittingOut, state]);

  /**
   *
   */
  useEffect(() => {
    try {
      endOrderTrump();
    } catch (e) {
      const error = e as Error;

      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_GAME_FLOW, gameFlow: EuchreGameFlow.ERROR });
      errorState.setErrorState({
        time: new Date(),
        id: uuidv4(),
        message: error ? error.message : 'Unknown error in endOrderTrump',
        gameFlow: EuchreGameFlow.END_ORDER_TRUMP,
        animationType: EuchreAnimationActionType.SET_NONE
      });
    }
  }, [endOrderTrump, errorState, state]);

  /**
   *
   */
  useEffect(() => {
    const endAnimationOrderTrump = async () => {
      if (
        !isGameStateValidToContinue(
          state.euchreGame,
          state.euchreGameFlow,
          state.euchreAnimationFlow,
          EuchreGameFlow.END_ORDER_TRUMP,
          EuchreAnimateType.ANIMATE,
          state.shouldCancel,
          state.onCancel
        )
      )
        return;

      await new Promise((resolve) => setTimeout(resolve, state.euchreSettings.notificationSpeed));

      state.dispatchGameFlow({
        type: EuchreFlowActionType.SET_GAME_FLOW,
        gameFlow: EuchreGameFlow.BEGIN_PLAY_CARD
      });
      state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_NONE });
    };

    try {
      endAnimationOrderTrump();
    } catch (e) {
      const error = e as Error;

      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_GAME_FLOW, gameFlow: EuchreGameFlow.ERROR });
      errorState.setErrorState({
        time: new Date(),
        id: uuidv4(),
        message: error ? error.message : 'Unknown error in endAnimationOrderTrump',
        gameFlow: EuchreGameFlow.END_ORDER_TRUMP,
        animationType: EuchreAnimationActionType.SET_ANIMATE
      });
    }
  }, [
    determineDiscard,
    discard,
    errorState,
    incrementSpeed,
    isGameStateValidToContinue,
    playerEqual,
    playerSittingOut,
    state
  ]);

  /** Submit the resulting discard from user input after flip card has been picked up.
   *
   */
  const handleDiscardSubmit = useCallback(
    (card: Card) => {
      const newGame = state.euchreGame ? { ...state.euchreGame } : null;

      if (newGame?.trump && state.euchreGameFlow.gameFlow === EuchreGameFlow.AWAIT_PROMPT) {
        newGame.dealer.hand = discard(newGame.dealer, card, newGame.trump);
        newGame.dealer.hand = indexCards(newGame.dealer.hand);
        newGame.discard = card;

        state.addEvent(
          createEvent(
            'd',
            state.euchreSettings,
            newGame.dealer ?? undefined,
            `Dealer discarded: ${newGame.discard.value}-${newGame.discard.suit}`
          )
        );

        state.dispatchGameFlow({
          type: EuchreFlowActionType.SET_GAME_FLOW,
          gameFlow: EuchreGameFlow.END_ORDER_TRUMP
        });
        state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE });
        state.setPromptValue([]);
        state.setEuchreGame(newGame);
      }
    },
    [discard, indexCards, state]
  );

  //#endregion

  return { handleDiscardSubmit };
}
