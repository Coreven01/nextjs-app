'use client';

import { EuchreFlowActionType, EuchreGameFlow, EuchreGameFlowState } from './gameFlowReducer';
import { EuchreActionType, EuchreAnimateType } from './gameAnimationFlowReducer';
import { EuchreGameState } from './useEuchreGame';
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

export default function useEuchreGameShuffle(state: EuchreGameState) {
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

    state.addEvent(
      createEvent('i', state.euchreSettings, undefined, 'Begin shuffle and deal for regular play')
    );

    let newGame = state.euchreGame?.shallowCopy();
    if (!newGame) throw new Error();

    const shuffleResult = shuffleAndDealHand(newGame, state.euchreSettings, state.shouldCancel);

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
    state.dispatchGameAnimationFlow({ type: EuchreActionType.SET_ANIMATE_DEAL_CARDS_FOR_REGULAR_PLAY });
    //setAnimationTransformation([...animationTransformation, ...shuffleResult.transformations]);
    state.setEuchreGame(newGame);
  }, [state]);

  useEffect(() => {
    beginShuffleAndDealHand();
  }, [beginShuffleAndDealHand]);

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

      state.dispatchGameAnimationFlow({ type: EuchreActionType.SET_ANIMATE_NONE });
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
      key={`${card.generateElementId()}-${Math.floor(Math.random() * 1000)}`}
      durationMs={150}
      delayMs={150}
      fadeType={fadeOut ? 'out' : 'in'}
      className={`hidden ${fadeOut ? 'opacity-100' : 'opacity-0'}`}
    >
      <GameBorder innerClass="p-2 bg-stone-800" className="shadow-md shadow-black">
        <GameCard
          id={id}
          player={player}
          card={card}
          enableShadow={true}
          width={card.getDisplayWidth('center')}
          height={card.getDisplayHeight('center')}
          src={getEncodedCardSvg(card, 'center')}
          title={getCardFullName(card)}
        ></GameCard>
      </GameBorder>
    </EphemeralModal>
  );
};
