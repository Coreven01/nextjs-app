import { RefObject, useEffect, useRef } from 'react';
import GameCard from '../game/game-card';
import clsx from 'clsx';
import DummyCard from '../common/dummy-card';
import useCardState from '../../../hooks/euchre/useCardState';
import { EuchreGameState, EuchrePlayer } from '../../../lib/euchre/definitions/game-state-definitions';
import { Card } from '../../../lib/euchre/definitions/definitions';
import useCardData from '../../../hooks/euchre/data/useCardData';

type Props = {
  state: EuchreGameState;
  player: EuchrePlayer;
  playedCard: Card | null;
  playerCenterTableRef: RefObject<HTMLDivElement | null> | undefined;
  playersDeckRef: Map<number, RefObject<HTMLDivElement | null>>;
  onRegularDeal: () => void;
  onCardPlayed: (card: Card) => void;
  onTrickComplete: (card: Card) => void;
  onPassDeal: () => void;
};

const PlayerHand = ({
  state,
  player,
  playedCard,
  playerCenterTableRef,
  playersDeckRef,
  onCardPlayed,
  onRegularDeal,
  onTrickComplete,
  onPassDeal
}: Props) => {
  //#region Hooks
  // used to keep the card visible after it's been played for the current trick.
  const {
    cardsDealtRef,
    cardRefs,
    handState,
    cardStates,
    onCardPlayedComplete,
    getCardsToDisplay,
    handlePlayCardAnimation,
    playerLocation,
    getDisplayWidth,
    getDisplayHeight
  } = useCardState(state, player, playersDeckRef, onRegularDeal, onTrickComplete, onPassDeal, onCardPlayed);
  const cardIndicesPlayed = useRef<Map<string, number>>(new Map<string, number>());
  const { getCardClassForPlayerLocation } = useCardData();

  /** Animate the card being played. Once animation for the card is complete, the state should be updated that the player
   * played a card.
   */
  useEffect(() => {
    if (playedCard && !cardIndicesPlayed.current.has(state.euchreGame.currentTrick.trickId)) {
      cardIndicesPlayed.current.set(state.euchreGame.currentTrick.trickId, playedCard.index);
      console.log('[useEffect] [handlePlayCardAnimation], played card: ', playedCard);

      const tableRef = playerCenterTableRef?.current;

      if (!tableRef) throw new Error('Table ref reference not found for player hand - play card animation.');

      handlePlayCardAnimation(playedCard.index, tableRef);
    }
  }, [handlePlayCardAnimation, playedCard, playerCenterTableRef, state.euchreGame.currentTrick.trickId]);
  //#endregion

  const gameCards: React.ReactNode[] = [];
  const playerCurrentHand: Card[] = getCardsToDisplay();
  const location = playerLocation(player);
  const width: number = handState?.width ?? getDisplayWidth(location);
  const height: number = handState?.height ?? getDisplayHeight(location);

  for (let i = 0; i < 5; i++) {
    // used to make sure the player area always has 5 cards placed to make sure elements flow correctly.
    gameCards.push(
      <DummyCard
        className={getCardClassForPlayerLocation(player.playerNumber, false)}
        key={`dummy-${i}`}
        width={width}
        height={height}
        responsive={true}
        location={location}
      ></DummyCard>
    );
  }

  const handleCardClick = (cardIndex: number) => {
    console.log('[handleCardClick] - player-hand.tsx - player: ', player.name);
    if (!cardIndicesPlayed.current.has(state.euchreGame.currentTrick.trickId)) {
      cardIndicesPlayed.current.set(state.euchreGame.currentTrick.trickId, cardIndex);

      const tableRef = playerCenterTableRef?.current;

      if (!tableRef) throw new Error('Table ref reference not found for player hand - handle card click.');

      handlePlayCardAnimation(cardIndex, tableRef);
    }
  };

  return (
    <>
      {gameCards}
      {cardsDealtRef.current &&
        handState &&
        playerCurrentHand.map((card) => {
          const keyval = `${player.playerNumber}-${card.index}`;
          const cardState = cardStates.find((s) => s.cardIndex === card.index);
          const cardRef = cardRefs.get(card.index);

          if (!cardState) throw new Error('Invalid card state - render player hand');
          if (!cardRef) throw new Error('Invalid card ref - render player hand');

          return (
            <GameCard
              key={keyval}
              className={clsx('absolute', getCardClassForPlayerLocation(player.playerNumber, true))}
              card={card}
              cardState={cardState}
              player={player}
              runAnimationCompleteEffect={cardState.runEffectForState}
              ref={cardRef}
              width={handState.width}
              height={handState.height}
              responsive={true}
              onCardClick={cardState.enabled ? handleCardClick : undefined}
              onAnimationComplete={onCardPlayedComplete.current}
            />
          );
        })}
    </>
  );
};

export default PlayerHand;
