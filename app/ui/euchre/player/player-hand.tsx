import { EuchreGameFlow, EuchreGameFlowState } from '@/app/hooks/euchre/gameFlowReducer';
import { Card, EuchreGameInstance, EuchrePlayer, EuchreSettings } from '@/app/lib/euchre/definitions';
import GameCard from '../game/game-card';
import clsx from 'clsx';
import useCardData from '@/app/hooks/euchre/data/useCardData';
import usePlayerData from '@/app/hooks/euchre/data/usePlayerData';
import useGameData from '@/app/hooks/euchre/data/useGameData';
import useGamePlayLogic from '@/app/hooks/euchre/logic/useGamePlayLogic';
import useCardSvgData from '@/app/hooks/euchre/data/useCardSvgData';

type Props = {
  game: EuchreGameInstance;
  gameFlow: EuchreGameFlowState;
  gameSettings: EuchreSettings;
  player: EuchrePlayer;
  onCardClick: (card: Card) => void;
};

const PlayerHand = ({ game, gameFlow, gameSettings, player, onCardClick }: Props) => {
  const { getDisplayWidth, getDisplayHeight } = useCardData();
  const { playerLocation } = usePlayerData();
  const { getCardsAvailableToPlay } = useGameData();
  const { getPlayerAndCard } = useGamePlayLogic();
  const { getEncodedCardSvg } = useCardSvgData();

  const displayCards: Card[] = player.hand;
  const shouldShowHandImages = gameFlow.shouldShowCardImagesForHand.find((c) => c.player === player)?.value;
  const shouldShowHandValues = gameFlow.shouldShowCardValuesForHand.find((c) => c.player === player)?.value;

  if (shouldShowHandImages && displayCards.length === 0 && player.placeholder.length === 0)
    throw Error('Unable to show hand. No cards dealt.');

  const images: React.ReactNode[] = [];
  const location = playerLocation(player);
  const width = getDisplayWidth(location);
  const height = getDisplayHeight(location);
  const cardBackSvg = location === 'center' ? '/card-back.svg' : '/card-back-side.svg';
  let availableCards: Card[];

  if (
    gameSettings.enforceFollowSuit &&
    player.human &&
    gameFlow.gameFlow === EuchreGameFlow.AWAIT_USER_INPUT &&
    game.trump
  ) {
    const leadCard = game.currentTrick?.cardsPlayed.at(0)?.card ?? null;
    availableCards = getCardsAvailableToPlay(game.trump, leadCard, player.hand).map((c) => c.card);
  } else {
    availableCards = displayCards;
  }

  const handleCardClick = (srcElementId: string, player: EuchrePlayer) => {
    const cardInfo = getPlayerAndCard(srcElementId);
    const card = player.hand[cardInfo.index];
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
          src={shouldShowHandValues ? getEncodedCardSvg(card, location, !isAvailable) : cardBackSvg}
          id={cardval}
          onClick={isAvailable ? () => handleCardClick(cardval, player) : () => null}
          className={`${getCardCssForPlayerLocation(gameFlow, player, card.index, isAvailable)}`}
        />
      </div>
    );
  }

  return <>{images}</>;
};

export default PlayerHand;

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
