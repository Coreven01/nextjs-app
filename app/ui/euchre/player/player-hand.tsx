import { GameFlowState } from '@/app/hooks/euchre/gameFlowReducer';
import { getEncodedCardSvg } from '@/app/lib/euchre/card-data';
import { Card, EuchrePlayer } from '@/app/lib/euchre/definitions';
import { getPlayerAndCard } from '@/app/lib/euchre/game';
import Image from 'next/image';

type Props = {
  gameFlow: GameFlowState;
  player: EuchrePlayer;
  onCardClick: (card: Card) => void;
};

export default function PlayerHand({ gameFlow, player, onCardClick }: Props) {
  const displayCards: Card[] = player.displayCards;
  const shouldShowHandImages = gameFlow.shouldShowHandImages.find(
    (c) => c.player === player
  )?.value;
  const shouldShowHandValues = gameFlow.shouldShowHandValues.find(
    (c) => c.player === player
  )?.value;

  if (shouldShowHandImages && displayCards.length === 0 && player.placeholder.length === 0)
    throw Error('Unable to show hand. No cards dealt.');

  const images: React.ReactNode[] = [];
  const width = player.placeholder[0].getDisplayWidth(player.location);
  const height = player.placeholder[0].getDisplayHeight(player.location);
  const cardBackSvg = player.location === 'center' ? '/card-back.svg' : '/card-back-side.svg';

  const handleCardClick = (srcElementId: string, player: EuchrePlayer) => {
    const cardInfo = getPlayerAndCard(srcElementId);
    const card = player.displayCards[cardInfo.index];
    onCardClick(card);
  };

  for (const card of displayCards) {
    const keyval = `${player.playerNumber}${card.index}`;
    const cardval = `card-${keyval}`;
    const hidden = !shouldShowHandImages || card.value === 'P' ? 'invisible' : '';

    images.push(
      <div className={`relative ${hidden}`} key={keyval}>
        <Image
          id={cardval}
          onClick={() => handleCardClick(cardval, player)}
          className={getCardCssForPlayerLocation(gameFlow, player, card.index)}
          quality={100}
          width={width}
          height={height}
          src={shouldShowHandValues ? getEncodedCardSvg(card, player.location) : cardBackSvg}
          alt="Game Card"
        />
      </div>
    );
  }

  return <>{images}</>;
}

function getCardCssForPlayerLocation(
  gameFlow: GameFlowState,
  player: EuchrePlayer,
  index: number
): string {
  const initDeg: number = -10;
  const rotateVal: number = 5;
  const offsetStart: number = 60;
  const offset: number = 30;
  const shouldShowHandImages = gameFlow.shouldShowHandImages.find(
    (c) => c.player === player
  )?.value;
  const activeClasses =
    shouldShowHandImages && player.human
      ? 'cursor-pointer shadow-sm hover:scale-[1.15] hover:shadow-md hover:shadow-yellow-300 hover:z-10'
      : '';

  let retval = '';

  switch (player.playerNumber) {
    case 1:
      retval = `contain relative transition rotate-[${initDeg + rotateVal * index}deg]
  translate-x-[${offsetStart - offset * index}px] translate-y-[${[1, 3].includes(index) ? -10 : index === 2 ? -15 : 0}px] 
  duration-300 ease-in-out ${activeClasses}`;
      break;
    case 2:
      retval = `contain relative transition rotate-[${-initDeg - rotateVal * index}deg]
  translate-x-[${offsetStart - offset * index}px] translate-y-[${[1, 3].includes(index) ? 10 : index === 2 ? 15 : 0}px] 
   duration-300 ease-in-out ${activeClasses}`;
      break;
    case 3:
      retval = `contain relative transition rotate-[${initDeg + rotateVal * index}deg]
    translate-y-[${offsetStart - offset * index}px] translate-x-[${[1, 3].includes(index) ? 10 : index === 2 ? 15 : 0}px] 
      duration-300 ease-in-out ${activeClasses}`;
      break;
    case 4:
      retval = `contain relative transition rotate-[${-initDeg + -rotateVal * index}deg]
  translate-y-[${offsetStart - offset * index}px] translate-x-[${[1, 3].includes(index) ? -10 : index === 2 ? -15 : 0}px]
   duration-300 ease-in-out ${activeClasses}`;
      break;
  }

  return retval;
}
