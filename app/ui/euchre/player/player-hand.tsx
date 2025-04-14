import { EuchreGameFlow, EuchreGameFlowState } from '@/app/hooks/euchre/gameFlowReducer';
import { Card, EuchreGameInstance, EuchrePlayer, EuchreSettings } from '@/app/lib/euchre/definitions';
import GameCard from '../game/game-card';
import clsx from 'clsx';
import useCardData from '@/app/hooks/euchre/data/useCardData';
import usePlayerData from '@/app/hooks/euchre/data/usePlayerData';
import useGameData from '@/app/hooks/euchre/data/useGameData';
import useCardSvgData from '@/app/hooks/euchre/data/useCardSvgData';
import { RefObject, useRef } from 'react';

type Props = {
  game: EuchreGameInstance;
  gameFlow: EuchreGameFlowState;
  gameSettings: EuchreSettings;
  player: EuchrePlayer;
  playedCard: Card | null;
  deckRef: RefObject<HTMLDivElement>;
  playerTableRef: RefObject<HTMLDivElement>;
  onCardClick: (card: Card) => void;
};

const PlayerHand = ({
  game,
  gameFlow,
  gameSettings,
  player,
  playedCard,
  deckRef,
  playerTableRef,
  onCardClick
}: Props) => {
  //#region Hooks
  const { getDisplayWidth, getDisplayHeight, createPlaceholderCards, cardEqual } = useCardData();
  const { playerLocation, playerEqual, availableCardsToPlay } = usePlayerData();
  const { getCardsAvailableToPlay, isHandFinished } = useGameData();
  const { getEncodedCardSvg } = useCardSvgData();
  const cardsPlayedRef = useRef<Card[]>([]);
  //#endregion

  const showCardImage = gameFlow.shouldShowCardImagesForHand.find((c) =>
    playerEqual(c.player, player)
  )?.value;

  const showCardValue = gameFlow.shouldShowCardValuesForHand.find((c) =>
    playerEqual(c.player, player)
  )?.value;

  const gameCards: React.ReactNode[] = [];
  const location = playerLocation(player);
  const width = getDisplayWidth(location);
  const height = getDisplayHeight(location);
  const cardBackSvgSrc = location === 'center' ? '/card-back.svg' : '/card-back-side.svg';
  const cardsAvailableForFollowSuit: Card[] = [];
  const displayHand: Card[] = [];
  const placementCards: Card[] = createPlaceholderCards(5);
  const playerCurrentHand: Card[] = availableCardsToPlay(player);
  const trickFinished = isHandFinished(game);

  if (!trickFinished) {
    for (const card of placementCards) {
      // in order to keep the display for the player area consistent, this will render 5 cards even if
      // a card has been played. unavailable cards will be hidden.
      let playerCard: Card | undefined = playerCurrentHand.find((c) => c.index === card.index);
      if (!playerCard) {
        playerCard = game.currentTrick.cardsPlayed.find(
          (c) => c.card.index === card.index && playerEqual(c.player, player)
        )?.card;
      }

      displayHand.push(playerCard ?? card);
    }
  } else {
    displayHand.push(...placementCards);
  }

  if (
    gameSettings.enforceFollowSuit &&
    player.human &&
    gameFlow.gameFlow === EuchreGameFlow.AWAIT_USER_INPUT &&
    game.trump
  ) {
    // only enable cards that are available for follow suit, if enabled by settings.
    const leadCard = game.currentTrick.cardsPlayed.at(0)?.card ?? null;
    cardsAvailableForFollowSuit.push(
      ...getCardsAvailableToPlay(game.trump, leadCard, player.hand).map((c) => c.card)
    );
  } else {
    // enable all cards to be played that have yet to be played for the current hand.
    cardsAvailableForFollowSuit.push(...displayHand);
  }

  const handleCardClick = (index: number, player: EuchrePlayer) => {
    const card = player.hand[index];
    cardsPlayedRef.current.push(card);
    onCardClick(card);
  };

  for (const card of displayHand) {
    const keyval = `${game.currentRound}-${player.playerNumber}-${card.index}`;
    const hidden = !showCardImage || card.value === 'P' ? 'invisible' : '';
    const isAvailableToBePlayed: boolean = cardsAvailableForFollowSuit.includes(card);
    const playCard: boolean =
      (playedCard !== null && cardEqual(card, playedCard)) ||
      cardsPlayedRef.current.find((c) => cardEqual(c, card)) !== undefined;

    gameCards.push(
      <div className={clsx('z-20', hidden, getDivCssForPlayerLocation(player))} key={keyval}>
        <GameCard
          responsive={true}
          player={player}
          enableShadow={true}
          card={card}
          width={width}
          height={height}
          index={card.index}
          playCard={playCard}
          availableCardIndices={playerCurrentHand.map((c) => c.index)}
          src={
            playCard || showCardValue
              ? getEncodedCardSvg(card, location, !isAvailableToBePlayed)
              : cardBackSvgSrc
          }
          onCardClick={isAvailableToBePlayed ? handleCardClick : undefined}
          deckRef={deckRef}
          playerTableRef={playerTableRef}
          gameSpeedMs={gameSettings.gameSpeed}
        />
      </div>
    );
  }

  return <>{gameCards}</>;
};

export default PlayerHand;

const getDivCssForPlayerLocation = (player: EuchrePlayer): string => {
  let retval = '';

  switch (player.playerNumber) {
    case 1:
      retval = `max-w-20 md:max-h-full md:max-w-full md:relative`;
      break;
    case 2:
      retval = `max-w-16 md:max-h-full md:max-w-full md:relative`;
      break;
    case 3:
      retval = `max-w-24 md:max-w-full md:relative`;
      break;
    case 4:
      retval = `max-w-24 md:max-w-full md:relative`;
      break;
  }

  return retval;
};
