import { Card, EuchrePlayer, GameSpeed } from '@/app/lib/euchre/definitions';
import React, { CSSProperties, RefObject, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import Image from 'next/image';
import { CardState } from '../../../hooks/euchre/reducers/cardStateReducer';
import { DEFAULT_SPRING_VAL } from '../../../hooks/euchre/data/useCardTransform';

interface Props extends React.HtmlHTMLAttributes<HTMLImageElement> {
  card: Card;
  cardState: CardState;
  width: number;
  height: number;
  ref?: RefObject<HTMLDivElement>;

  /** True if the card should be played automatically */
  playCard?: boolean;
  player?: EuchrePlayer;
  deckRef?: RefObject<HTMLDivElement>;
  playerTableRef?: RefObject<HTMLDivElement>;
  gameSpeedMs?: GameSpeed;
  responsive?: boolean;

  /** */
  onCardClick?: (cardIndex: number) => void;

  /** */
  onCardPlayed?: (card: Card) => void;
}

const GameCard = ({
  id,
  ref,
  card,
  cardState,
  width,
  height,
  className,
  player,
  playCard,
  deckRef,
  playerTableRef,
  gameSpeedMs,
  responsive,
  onCardClick,
  onCardPlayed,
  ...rest
}: Props) => {
  const cardClicked = useRef(false);
  const stateUpdated = useRef(false);
  const sidePlayer = player && player.team === 2;
  const cssValues: CSSProperties = {};
  const duration: number = (gameSpeedMs ?? 1000) / 1000;
  const enableCardClickEvent = !playCard && player?.human && !cardClicked.current && !stateUpdated.current;
  const responsiveCardSizeCenter = 'lg:h-[125px] md:h-[115px] h-[95px]';
  const responsiveCardSizeSide = 'lg:w-[125px] md:w-[115px] w-[95px]';
  const initSprungValue = cardState.initSprungValue
    ? { ...cardState.initSprungValue, transition: { rotateY: { duration: 0 }, rotateX: { duration: 0 } } }
    : undefined;

  if (responsive) {
    cssValues.width = '100%';
    cssValues.height = '100%';
  } else {
    cssValues.width = width;
    cssValues.height = height;
    cssValues.maxHeight = height;
    cssValues.maxWidth = width;
  }

  const handleCardClick = async (index: number, player: EuchrePlayer) => {
    if (!cardClicked.current && onCardClick) {
      cardClicked.current = true;

      // when card is clicked, it activates the animation to play the card.
      // on the animation is complete, the callback handler calls the method that updates,
      // the state the card was played.
      onCardClick(index);
    }
  };

  useEffect(() => {
    if (player && playCard && !cardClicked.current) {
      handleCardClick(card.index, player);
    }
  });

  return (
    <motion.div
      className={clsx(
        'pointer-events-auto',
        sidePlayer ? responsiveCardSizeSide : responsiveCardSizeCenter,
        className
      )}
      title={cardState.cardFullName}
      id={id}
      ref={ref}
      initial={initSprungValue}
      whileHover={enableCardClickEvent ? { scale: 1.15 } : undefined}
      animate={cardState.sprungValue ? cardState.sprungValue : DEFAULT_SPRING_VAL}
      transition={{
        opacity: { duration: 1 },
        x: { duration: duration, stiffness: cardState.xStiffness, damping: cardState.xDamping },
        y: { duration: duration, stiffness: cardState.yStiffness, damping: cardState.yDamping },
        rotate: { duration: duration },
        rotateY: { duration: 0.3 },
        rotateX: { duration: 0.3 }
      }}
      onAnimationComplete={() => {
        if (!stateUpdated.current && player && cardClicked.current && onCardPlayed) {
          // fall into this block once animation is complete to update the state that the card was played.
          stateUpdated.current = true;
          onCardPlayed(card);
        }
      }}
    >
      <Image
        className={clsx(`absolute ${getShadowOffsetForPlayer(player?.playerNumber ?? 1)}`)}
        quality={50}
        width={width}
        height={height}
        src={sidePlayer ? '/card-shadow-side.png' : '/card-shadow.png'}
        alt={'card shadow'}
        style={cssValues}
      />
      <Image
        {...rest}
        className={clsx('relative top-0 left-0')}
        quality={100}
        width={width}
        height={height}
        src={cardState.src}
        alt={cardState.cardFullName}
        unoptimized={true}
        onClick={enableCardClickEvent ? () => handleCardClick(card.index, player) : undefined}
        style={cssValues}
      ></Image>
    </motion.div>
  );
};

export default GameCard;

const getShadowOffsetForPlayer = (playerNumber: number): string => {
  switch (playerNumber) {
    case 1:
      return 'top-3 left-3';
    case 2:
      return '-top-3 left-3';
    case 3:
      return 'top-2 -left-3';
    case 4:
      return 'top-2 -right-3';
  }

  return 'top-3 left-2';
};
