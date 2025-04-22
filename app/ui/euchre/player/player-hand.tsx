import { EuchreGameFlow, EuchreGameFlowState } from '@/app/hooks/euchre/reducers/gameFlowReducer';
import { Card, EuchreGameInstance, EuchrePlayer, EuchreSettings } from '@/app/lib/euchre/definitions';
import { RefObject, useEffect, useRef } from 'react';
import GameCard from '../game/game-card';
import clsx from 'clsx';
import DummyCard from '../dummy-card';
import useCardState from '../../../hooks/euchre/useCardState';
import { EuchreAnimationState } from '../../../hooks/euchre/reducers/gameAnimationFlowReducer';

type Props = {
  game: EuchreGameInstance;
  gameFlow: EuchreGameFlowState;
  gameSettings: EuchreSettings;
  gameAnimation: EuchreAnimationState;
  player: EuchrePlayer;
  playedCard: Card | null;
  deckRef: RefObject<HTMLDivElement>;
  playerTableRef: RefObject<HTMLDivElement>;
  playersDeckRef: Map<number, RefObject<HTMLDivElement>>;
  onInitDeal: () => void;
  onRegularDeal: () => void;
  onCardPlayed: (card: Card) => void;
  onTrickComplete: (card: Card) => void;
  onPassDeal: () => void;
};

const PlayerHand = ({
  game,
  gameFlow,
  gameSettings,
  gameAnimation,
  player,
  playedCard,
  playerTableRef,
  playersDeckRef,
  onCardPlayed,
  onInitDeal,
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
    getCardsToDisplay,
    handlePlayCardAnimation,
    playerLocation,
    getDisplayWidth,
    getDisplayHeight
  } = useCardState(
    game,
    gameFlow,
    gameSettings,
    gameAnimation,
    player,
    playersDeckRef,
    onInitDeal,
    onRegularDeal,
    onTrickComplete,
    onPassDeal,
    onCardPlayed
  );
  const cardIndicesPlayed = useRef<Map<string, number>>(new Map<string, number>());

  /** Animate the card being played. Once animation for the card is complete, the state should be updated that the player
   * played a card.
   */
  useEffect(() => {
    if (playedCard && !cardIndicesPlayed.current.has(game.currentTrick.trickId)) {
      cardIndicesPlayed.current.set(game.currentTrick.trickId, playedCard.index);
      console.log('[useEffect] [handlePlayCardAnimation], played card: ', playedCard);
      handlePlayCardAnimation(playedCard.index, playerTableRef.current);
    }
  }, [game.currentTrick.trickId, handlePlayCardAnimation, playedCard, playerTableRef]);
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
        className={getCardClassForPlayerLocation(player, false)}
        key={`dummy-${i}`}
        width={width}
        height={height}
        responsive={true}
        team={player.team}
      ></DummyCard>
    );
  }

  const handleCardClick = (cardIndex: number) => {
    console.log('[handleCardClick] [handler]- player-hand.tsx');
    if (!cardIndicesPlayed.current.has(game.currentTrick.trickId)) {
      cardIndicesPlayed.current.set(game.currentTrick.trickId, cardIndex);
      handlePlayCardAnimation(cardIndex, playerTableRef.current);
    }
  };

  return (
    <>
      {gameCards}
      {cardsDealtRef.current &&
        handState &&
        playerCurrentHand.map((card) => {
          const keyval = `${card.index}`;
          const cardState = cardStates.find((s) => s.cardIndex === card.index);
          const cardRef = cardRefs.current.get(card.index);

          if (!cardState) throw new Error('Invalid card state - render player hand');
          if (!cardRef) throw new Error('Invalid card ref - render player hand');

          return (
            <GameCard
              key={keyval}
              className={clsx('absolute', getCardClassForPlayerLocation(player, true))}
              card={card}
              cardState={cardState}
              player={player}
              runAnimationCompleteEffect={cardState.runEffectForState}
              ref={cardRef}
              width={handState.width}
              height={handState.height}
              responsive={true}
              onCardClick={cardState.enabled ? handleCardClick : undefined}
              onAnimationComplete={handState.onCardPlayedComplete}
            />
          );
        })}
    </>
  );
};

export default PlayerHand;

const getCardClassForPlayerLocation = (player: EuchrePlayer, includePosition: boolean): string => {
  let retval = '';

  switch (player.playerNumber) {
    case 1:
      retval = `${includePosition ? 'left-[35%] lg:top-auto top-4' : ''}`;
      break;
    case 2:
      retval = `${includePosition ? 'lg:left-[30%] lg:top-auto -top-12 left-[45%]' : ''}`;
      break;
    case 3:
      retval = `${includePosition ? 'lg:left-auto lg:top-auto top-[35%] -left-12' : ''}`;
      break;
    case 4:
      retval = `${includePosition ? 'lg:right-auto lg:top-auto top-[35%] -right-12' : ''}`;
      break;
  }

  return retval;
};
