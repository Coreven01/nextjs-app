import { EuchreGameFlow, EuchreGameFlowState } from '@/app/hooks/euchre/reducers/gameFlowReducer';
import { Card, EuchreGameInstance, EuchrePlayer, EuchreSettings } from '@/app/lib/euchre/definitions';
import { RefObject } from 'react';
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
  onCardClick: (card: Card) => void;
  onBeginComplete: () => void;
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
  onCardClick,
  onBeginComplete
}: Props) => {
  //#region Hooks
  // used to keep the card visible after it's been played for the current trick.
  const {
    cardsDealtRef,
    cardsPlayedRef,
    cardRefs,
    handState,
    cardStates,
    getCardsAvailableIfFollowSuit,
    getCardsToDisplay,
    playCard,
    cardEqual,
    playerEqual,
    playerLocation,
    getDisplayWidth,
    getDisplayHeight
  } = useCardState(game, gameFlow, gameSettings, gameAnimation, player, onBeginComplete);

  const cardClickEnabled =
    playerEqual(game.currentPlayer, player) && gameFlow.gameFlow === EuchreGameFlow.AWAIT_USER_INPUT;

  //#endregion

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

  /** Sets the animation for the card to be played. On the callback when the animation is finished is when the state is updated with
   * the card that was played.
   */
  const handleCardClick = (cardIndex: number) => {
    const currentState = cardStates.find((c) => c.cardIndex === cardIndex);
    const cardRef = cardRefs.current.get(cardIndex);

    if (!currentState || !cardRef?.current) throw new Error('Invalid card state - handle card click');

    playCard(cardIndex, cardRef.current, playerTableRef.current, currentState.rotation ?? 0);
    console.log('card played: ', cardIndex, ' player: ', player.name);
  };

  return (
    <>
      {gameCards}
      {cardsDealtRef.current &&
        handState &&
        playerCurrentHand.map((card) => {
          const keyval = `${game.dealPassedCount}-${game.currentRound}-${player.playerNumber}-${card.index}`;
          const isAvailableToBePlayedForFollowSuit: boolean = cardsAvailableForFollowSuit.includes(card);
          const shouldAutoPlayCard: boolean =
            (playedCard !== null && cardEqual(card, playedCard)) ||
            cardsPlayedRef.current.find((c) => cardEqual(c, card)) !== undefined;
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
              playCard={shouldAutoPlayCard}
              onCardClick={isAvailableToBePlayedForFollowSuit ? handleCardClick : undefined}
              onCardPlayed={onCardClick}
              ref={cardRef}
              width={handState.width}
              height={handState.height}
              responsive={true}
              enableCardClickEvent={cardClickEnabled}
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
