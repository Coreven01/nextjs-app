import { EuchreGameFlow, GameFlowState } from '@/app/hooks/euchre/gameFlowReducer';
import { getEncodedCardSvg } from '@/app/lib/euchre/card-data';
import { Card, EuchreGameInstance, EuchrePlayer, EuchreSettings } from '@/app/lib/euchre/definitions';
import { getPlayerAndCard } from '@/app/lib/euchre/game';
import { getCardsAvailableToPlay } from '@/app/lib/euchre/game-play-logic';
import Image from 'next/image';
import GameCard from '../game/game-card';

type Props = {
  game: EuchreGameInstance;
  gameFlow: GameFlowState;
  gameSettings: EuchreSettings;
  player: EuchrePlayer;
  onCardClick: (card: Card) => void;
};

export default function PlayerHand({ game, gameFlow, gameSettings, player, onCardClick }: Props) {
  const displayCards: Card[] = player.displayCards;
  const shouldShowHandImages = gameFlow.shouldShowHandImages.find((c) => c.player === player)?.value;
  const shouldShowHandValues = gameFlow.shouldShowHandValues.find((c) => c.player === player)?.value;

  if (shouldShowHandImages && displayCards.length === 0 && player.placeholder.length === 0)
    throw Error('Unable to show hand. No cards dealt.');

  const images: React.ReactNode[] = [];
  const width = player.placeholder[0].getDisplayWidth(player.location);
  const height = player.placeholder[0].getDisplayHeight(player.location);
  const cardBackSvg = player.location === 'center' ? '/card-back.svg' : '/card-back-side.svg';
  let availableCards: Card[];

  if (!gameSettings.allowRenege && player.human && gameFlow.gameFlow === EuchreGameFlow.AWAIT_USER_INPUT) {
    const leadCard = game.currentTrick?.cardsPlayed.at(0)?.card ?? null;
    availableCards = getCardsAvailableToPlay(game, leadCard, player.availableCards).map((c) => c.card);
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

    images.push(
      <div className={`relative ${hidden}`} key={keyval}>
        <GameCard
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
  gameFlow: GameFlowState,
  player: EuchrePlayer,
  index: number,
  isAvailable: boolean
): string {
  const initDeg: number = -10;
  const rotateVal: number = 5;
  const offsetStart: number = 60;
  const offset: number = 30;
  const shouldShowHandImages = gameFlow.shouldShowHandImages.find((c) => c.player === player)?.value;
  const activeClasses =
    shouldShowHandImages &&
    player.human &&
    gameFlow.gameFlow === EuchreGameFlow.AWAIT_USER_INPUT &&
    isAvailable
      ? 'cursor-pointer hover:scale-[1.15] hover:-translate-y-4'
      : 'cursor-not-allowed';

  let retval = '';
  const baseClasses = `contain relative transition duration-300 ease-in-out ${activeClasses}`;
  switch (player.playerNumber) {
    case 1:
      retval = `${baseClasses} rotate-[${initDeg + rotateVal * index}deg]
    translate-x-[${offsetStart - offset * index}px] translate-y-[${[1, 3].includes(index) ? -10 : index === 2 ? -15 : 0}px]`;
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
