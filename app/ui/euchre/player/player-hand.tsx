import { RefObject, useEffect, useRef } from 'react';
import GameCard from '../game/game-card';
import clsx from 'clsx';
import useCardState from '../../../hooks/euchre/state/useCardState';
import {
  ErrorHandlers,
  EuchreGameState,
  EuchrePlayer
} from '../../../lib/euchre/definitions/game-state-definitions';
import { Card, TableLocation } from '../../../lib/euchre/definitions/definitions';
import useCardData from '../../../hooks/euchre/data/useCardData';
import { GameEventHandlers } from '../../../hooks/euchre/useEventLog';

type Props = {
  state: EuchreGameState;
  eventHandlers: GameEventHandlers;
  errorHandlers: ErrorHandlers;
  player: EuchrePlayer;
  playedCard: Card | null;
  playerCenterTableRef: RefObject<HTMLDivElement | null> | undefined;
  playerDeckRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>;
  directCenterHRef: RefObject<HTMLDivElement | null>;
  directCenterVRef: RefObject<HTMLDivElement | null>;
  onCardPlayed: (card: Card) => void;
  onTrickComplete: (card: Card) => void;
  onPassDeal: (card: Card) => void;
  onDealComplete: (playerNumber: number) => void;
};

const PlayerHand = ({
  state,
  eventHandlers,
  errorHandlers,
  player,
  playedCard,
  playerCenterTableRef,
  playerDeckRefs,
  directCenterHRef,
  directCenterVRef,
  onCardPlayed,
  onTrickComplete,
  onPassDeal,
  onDealComplete
}: Props) => {
  //#region Hooks
  // used to keep the card visible after it's been played for the current trick.
  const {
    initCardStateCreated,
    cardRefs,
    handState,
    cardStates,
    onAnimationComplete,
    getCardsToDisplay,
    handlePlayCardAnimation
  } = useCardState(
    state,
    eventHandlers,
    errorHandlers,
    player,
    directCenterHRef,
    directCenterVRef,
    playerDeckRefs,
    onTrickComplete,
    onPassDeal,
    onCardPlayed,
    onDealComplete
  );
  /** Map of trick ID to the associated card (index) that was played for that trick.*/
  const cardIndicesPlayed = useRef<Map<string, number>>(new Map<string, number>());
  const { getCardClassForPlayerLocation } = useCardData();
  const isCardClickHandled = useRef(false);

  /** Animate the card being played. Once animation for the card is complete, the state should be updated that the player
   * played a card.
   */
  useEffect(() => {
    if (playedCard && !cardIndicesPlayed.current.has(state.euchreGame.currentTrick.trickId)) {
      cardIndicesPlayed.current.set(state.euchreGame.currentTrick.trickId, playedCard.index);
      console.log('[useEffect] [handlePlayCardAnimation], auto played card: ', playedCard);

      const tableRef = playerCenterTableRef?.current;

      if (!tableRef) throw new Error('Table ref reference not found for player hand - play card animation.');

      handlePlayCardAnimation(playedCard.index, tableRef);
    }
  }, [handlePlayCardAnimation, playedCard, playerCenterTableRef, state.euchreGame.currentTrick.trickId]);
  //#endregion

  const gameCards: React.ReactNode[] = [];
  const playerCurrentHand: Card[] = getCardsToDisplay();
  const location = player.location;

  const handleCardClick = (cardIndex: number) => {
    console.log(
      '[handleCardClick] - player-hand.tsx - player: ',
      player.name,
      ' trick ids played: ',
      cardIndicesPlayed.current
    );

    if (
      !isCardClickHandled.current &&
      !cardIndicesPlayed.current.has(state.euchreGame.currentTrick.trickId)
    ) {
      isCardClickHandled.current = true;
      cardIndicesPlayed.current.set(state.euchreGame.currentTrick.trickId, cardIndex);

      const delay = state.euchreSettings.gameSpeed;
      const tableRef = playerCenterTableRef?.current;

      if (!tableRef) throw new Error('[handleCardClick] -Table ref reference not found for player hand.');

      // release lock that the next card should be handled.
      setTimeout(() => {
        isCardClickHandled.current = false;
      }, delay);

      handlePlayCardAnimation(cardIndex, tableRef);
    }
  };

  if (player.human)
    console.log('*** [PLAYERHAND] [RENDER] player: ', player.name, ' player hand: ', playerCurrentHand);

  return (
    <>
      {gameCards}
      {initCardStateCreated &&
        handState &&
        playerCurrentHand.map((card) => {
          const keyval = `${player.playerNumber}-${card.index}`;
          const cardState = cardStates.find((s) => s.cardIndex === card.index);
          const cardRef = cardRefs.get(card.index);

          if (!cardState) throw new Error('[PLAYERHAND] [RENDER] -Invalid card state.');
          if (!cardRef) throw new Error('[PLAYERHAND] [RENDER] - Invalid card ref.');

          return (
            <GameCard
              key={keyval}
              className={clsx('absolute', getCardClassForPlayerLocation(player.location))}
              location={location}
              card={card}
              cardState={cardState}
              runAnimationCompleteEffect={cardState.runEffectForState}
              ref={cardRef}
              width={handState.width}
              height={handState.height}
              responsive={true}
              onCardClick={cardState.enabled ? handleCardClick : undefined}
              onAnimationComplete={onAnimationComplete.current}
            />
          );
        })}
    </>
  );
};

export default PlayerHand;
