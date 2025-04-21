import { EuchreGameFlow, EuchreGameFlowState } from '@/app/hooks/euchre/reducers/gameFlowReducer';
import { Card, EuchreGameInstance, EuchrePlayer, EuchreSettings } from '@/app/lib/euchre/definitions';
import { RefObject, useEffect, useRef } from 'react';
import GameCard from '../game/game-card';
import clsx from 'clsx';
import DummyCard from '../dummy-card';
import useCardState from '../../../hooks/useCardState';
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
  deckRef,
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
    cardPlayedForTrickRef,
    cardRefs,
    handState,
    cardStates,
    getCardsAvailableIfFollowSuit,
    getCardsToDisplay,
    handlePlayCardAnimation,
    cardEqual,
    playerEqual,
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
  const cardIndicesPlayed = useRef<number[]>([]);

  useEffect(() => {
    if (playedCard && !cardIndicesPlayed.current.includes(playedCard.index)) {
      cardIndicesPlayed.current.push(playedCard.index);
      console.log('[useEffect] [handlePlayCardAnimation], played card: ', playedCard);
      handlePlayCardAnimation(playedCard.index, playerTableRef.current);
    }
  }, [handlePlayCardAnimation, playedCard, playerTableRef]);

  //#endregion

  const cardClickEnabled =
    playerEqual(game.currentPlayer, player) && gameFlow.gameFlow === EuchreGameFlow.AWAIT_USER_INPUT;
  const gameCards: React.ReactNode[] = [];
  const cardsAvailableForFollowSuit: Card[] = getCardsAvailableIfFollowSuit();
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
      ></DummyCard>
    );
  }

  const handleCardClick = (cardIndex: number) => {
    console.log('[handleCardClick] [handler]- player-hand.tsx');
    if (!cardIndicesPlayed.current.includes(cardIndex)) {
      cardIndicesPlayed.current.push(cardIndex);
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
          const isAvailableToBePlayedForFollowSuit: boolean = cardsAvailableForFollowSuit.includes(card);
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
              onCardClick={
                cardClickEnabled && isAvailableToBePlayedForFollowSuit ? handleCardClick : undefined
              }
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
      retval = `${includePosition ? 'left-[35%]' : ''}`;
      break;
    case 2:
      retval = `${includePosition ? 'left-[30%]' : ''}`;
      break;
    case 3:
      retval = ``;
      break;
    case 4:
      retval = ``;
      break;
  }

  return retval;
};
