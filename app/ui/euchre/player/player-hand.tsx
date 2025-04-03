import { EuchreGameFlow, EuchreGameFlowState } from '@/app/hooks/euchre/gameFlowReducer';
import { getEncodedCardSvg } from '@/app/lib/euchre/card-data';
import { Card, EuchreGameInstance, EuchrePlayer, EuchreSettings } from '@/app/lib/euchre/definitions';
import { getPlayerAndCard } from '@/app/lib/euchre/game';
import { getCardsAvailableToPlay } from '@/app/lib/euchre/game-play-logic';
import GameCard from '../game/game-card';
import clsx from 'clsx';

type Props = {
  game: EuchreGameInstance;
  gameFlow: EuchreGameFlowState;
  gameSettings: EuchreSettings;
  player: EuchrePlayer;
  onCardClick: (card: Card) => void;
};

export default function PlayerHand({ game, gameFlow, gameSettings, player, onCardClick }: Props) {
  const displayCards: Card[] = player.displayCards;
  const shouldShowHandImages = gameFlow.shouldShowCardImagesForHand.find((c) => c.player === player)?.value;
  const shouldShowHandValues = gameFlow.shouldShowCardValuesForHand.find((c) => c.player === player)?.value;

  if (shouldShowHandImages && displayCards.length === 0 && player.placeholder.length === 0)
    throw Error('Unable to show hand. No cards dealt.');

  const images: React.ReactNode[] = [];
  const width = player.placeholder[0].getDisplayWidth(player.location);
  const height = player.placeholder[0].getDisplayHeight(player.location);
  const cardBackSvg = player.location === 'center' ? '/card-back.svg' : '/card-back-side.svg';
  let availableCards: Card[];

  if (
    gameSettings.enforceFollowSuit &&
    player.human &&
    gameFlow.gameFlow === EuchreGameFlow.AWAIT_USER_INPUT &&
    game.trump
  ) {
    const leadCard = game.currentTrick?.cardsPlayed.at(0)?.card ?? null;
    availableCards = getCardsAvailableToPlay(game.trump, leadCard, player.availableCards).map((c) => c.card);
  } else {
    availableCards = displayCards;
  }

  const handleCardClick = (srcElementId: string, player: EuchrePlayer) => {
    const cardInfo = getPlayerAndCard(srcElementId);
    const card = player.displayCards[cardInfo.index];
    onCardClick(card);
  };

  for (const card of displayCards) {
    const keyval = `${player.playerNumber}${card.index}`;
    const cardval = `card-${keyval}`;
    const hidden = !shouldShowHandImages || card.value === 'P' ? 'invisible' : '';
    const isAvailable: boolean = availableCards.includes(card);

    if (card.value === 'P' && player.playerNumber === 1 && shouldShowHandValues && hidden === '')
      console.log('double check player image values: hidden: ', hidden);

    images.push(
      <div className={clsx('z-10', hidden, getDivCssForPlayerLocation(player))} key={keyval}>
        <GameCard
          responsive={true}
          player={player}
          enableShadow={true}
          card={card}
          width={width}
          height={height}
          src={shouldShowHandValues ? getEncodedCardSvg(card, player.location, !isAvailable) : cardBackSvg}
          id={cardval}
          onClick={isAvailable ? () => handleCardClick(cardval, player) : () => null}
          className={`${getCardCssForPlayerLocation(gameFlow, player, card.index, isAvailable)}`}
        />
      </div>
    );
  }

  return <>{images}</>;
}

function getCardCssForPlayerLocation(
  gameFlow: EuchreGameFlowState,
  player: EuchrePlayer,
  index: number,
  isAvailable: boolean
): string {
  const initDeg: number = -10;
  const rotateVal: number = 5;
  const offsetStart: number = 60;
  const offset: number = 30;
  const shouldShowHandImages = gameFlow.shouldShowCardImagesForHand.find((c) => c.player === player)?.value;
  const activeClasses =
    shouldShowHandImages &&
    player.human &&
    gameFlow.gameFlow === EuchreGameFlow.AWAIT_USER_INPUT &&
    isAvailable
      ? 'cursor-pointer md:hover:scale-[1.15] md:hover:translate-y-0'
      : 'cursor-not-allowed';

  let retval = '';
  const baseClasses = `contain transition duration-300 ease-in-out ${activeClasses}`;
  switch (player.playerNumber) {
    case 1:
      retval = `${baseClasses} rotate-[${initDeg + rotateVal * index}deg]
      translate-x-[${offsetStart - offset * index}px] translate-y-[${[0, 4].includes(index) ? 25 : [1, 3].includes(index) ? 15 : 10}px]`;
      break;
    case 2:
      retval = `${baseClasses} rotate-[${-initDeg - rotateVal * index}deg]
    translate-x-[${offsetStart - offset * index}px] translate-y-[${[1, 3].includes(index) ? 10 : index === 2 ? 15 : 0}px] `;
      break;
    case 3:
      retval = `${baseClasses} rotate-[${initDeg + rotateVal * index}deg]
    translate-y-[${offsetStart - offset * index}px] translate-x-[${[1, 3].includes(index) ? 10 : index === 2 ? 15 : 0}px]`;
      break;
    case 4:
      retval = `${baseClasses} transition rotate-[${-initDeg + -rotateVal * index}deg]
    translate-y-[${offsetStart - offset * index}px] translate-x-[${[1, 3].includes(index) ? -10 : index === 2 ? -15 : 0}px]`;
      break;
  }

  return retval;
}

function getDivCssForPlayerLocation(player: EuchrePlayer): string {
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
}
