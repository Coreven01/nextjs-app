'use client';

import { EuchreFlowActionType, EuchreGameFlow, EuchreGameFlowState } from './gameFlowReducer';
import { EuchreAnimationActionType, EuchreAnimateType } from './gameAnimationFlowReducer';
import { EuchreErrorState, EuchreGameState } from './useEuchreGame';
import { shuffleAndDealHand } from '@/app/lib/euchre/game-setup-logic';
import { useCallback, useEffect } from 'react';
import isGameStateValidToContinue from '@/app/lib/euchre/game-state-logic';
import { createEvent } from '@/app/lib/euchre/util';
import { PlayerNotificationActionType } from './playerNotificationReducer';
import { Card, EuchrePlayer } from '@/app/lib/euchre/definitions';
import EphemeralModal from '@/app/ui/euchre/ephemeral-modal';
import GameBorder from '@/app/ui/euchre/game/game-border';
import GameCard from '@/app/ui/euchre/game/game-card';
import { getCardFullName, getEncodedCardSvg } from '@/app/lib/euchre/card-data';
import { getGameStateForNextHand } from '@/app/lib/euchre/game-play-logic';
import clsx from 'clsx';

export default function useEuchreGameShuffle(state: EuchreGameState, errorState: EuchreErrorState) {
  const FLIPPED_CARD_ID = 'flipped-card';

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
        EuchreAnimateType.ANIMATE_NONE,
        state.shouldCancel,
        state.onCancel
      )
    )
      return;

    state.dispatchGameFlow({ type: EuchreFlowActionType.SET_WAIT });

    let newGame = state.euchreGame?.shallowCopy();
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

    // display trump card for bidding in the center of the table.
    state.dispatchPlayerNotification({
      type: PlayerNotificationActionType.UPDATE_CENTER,
      payload: getFaceUpCard(FLIPPED_CARD_ID, newGame.trump, newGame.player1, false)
    });

    const newGameState: EuchreGameFlowState = getGameStateForNextHand(
      state.euchreGameFlow,
      state.euchreSettings,
      newGame
    );
    newGameState.gameFlow = EuchreGameFlow.BEGIN_DEAL_CARDS;

    state.dispatchGameFlow({ type: EuchreFlowActionType.UPDATE_ALL, payload: newGameState });
    state.dispatchGameAnimationFlow({
      type: EuchreAnimationActionType.SET_ANIMATE_DEAL_CARDS_FOR_REGULAR_PLAY
    });
    state.setEuchreGame(newGame);
  }, [state]);

  useEffect(() => {
    try {
      beginShuffleAndDealHand();
    } catch (e) {
      const error = e as Error;

      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_ERROR });
      errorState.setErrorState({
        time: new Date(),
        id: '12',
        message: error ? error.message : 'unknown error',
        gameFlow: EuchreFlowActionType.SET_BEGIN_SHUFFLE_CARDS,
        animationType: EuchreAnimationActionType.SET_ANIMATE_NONE
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
          EuchreAnimateType.ANIMATE_DEAL_CARDS_FOR_REGULAR_PLAY,
          state.shouldCancel,
          state.onCancel
        )
      )
        return;

      if (!state.euchreGame) throw new Error();
      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_WAIT });
      //await animateDealCardsForHand(newGame);

      state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE_NONE });
      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_BID_FOR_TRUMP });
    };

    beginAnimationForDealCards();
  }, [state]);

  //#endregion

  return {};
}

/** */
const getFaceUpCard = (id: string, card: Card, player: EuchrePlayer, fadeOut: boolean) => {
  return (
    <EphemeralModal
      key={`${card.cardId}`}
      durationMs={150}
      delayMs={150}
      fadeType={fadeOut ? 'out' : 'in'}
      className={clsx(
        'md:h-full md:relative md:right-auto md:top-auto absolute -right-16 -top-8 h-8',
        { 'opacity-100': fadeOut },
        { 'opacity-0': !fadeOut }
      )}
    >
      <GameBorder innerClass="bg-stone-800 w-20 md:w-full" className="shadow-md shadow-black" size="small">
        <div className="p-2 bg-green-950 flex items-center justify-center">
          <GameCard
            responsive={true}
            id={id}
            player={player}
            card={card}
            enableShadow={true}
            width={card.getDisplayWidth('center')}
            height={card.getDisplayHeight('center')}
            src={getEncodedCardSvg(card, 'center')}
            title={getCardFullName(card)}
          ></GameCard>
        </div>
      </GameBorder>
    </EphemeralModal>
  );
};
