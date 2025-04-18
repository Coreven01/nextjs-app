import { Card, EuchrePlayer, GameSpeed } from '@/app/lib/euchre/definitions';
import React, { CSSProperties, forwardRef, PropsWithoutRef, useCallback, useEffect, useRef } from 'react';
import { motion, TargetAndTransition } from 'framer-motion';
import clsx from 'clsx';
import Image from 'next/image';
import { CardState } from '../../../hooks/euchre/reducers/cardStateReducer';
import { DEFAULT_SPRING_VAL } from '../../../hooks/euchre/data/useCardTransform';

interface Props extends React.HtmlHTMLAttributes<HTMLImageElement> {
  card: Card;
  cardState: CardState;
  width: number;
  height: number;

  /** True if the card should be played automatically */
  playCard?: boolean;
  player?: EuchrePlayer;
  gameSpeedMs?: GameSpeed;
  responsive?: boolean;
  enableCardClickEvent?: boolean;

  /** */
  onCardClick?: (cardIndex: number) => void;

  /** */
  onCardPlayed?: (card: Card) => void;
}

const GameCard = forwardRef<HTMLDivElement, PropsWithoutRef<Props>>(
  (
    {
      id,
      card,
      cardState,
      width,
      height,
      className,
      player,
      playCard,
      gameSpeedMs,
      responsive,
      enableCardClickEvent,
      onCardClick,
      onCardPlayed,
      ...rest
    }: Props,
    ref
  ) => {
    const cardClicked = useRef(false);
    const stateUpdated = useRef(false);
    const sidePlayer = player && player.team === 2;
    const cssValues: CSSProperties = {};
    const duration: number = (gameSpeedMs ?? 1000) / 1000;
    const responsiveCardSizeCenter = 'lg:h-[125px] md:h-[115px] h-[95px]';
    const responsiveCardSizeSide = 'lg:w-[125px] md:w-[115px] w-[95px]';
    const initSpringValue = cardState.initSprungValue
      ? { ...cardState.initSprungValue, transition: { rotateY: { duration: 0 }, rotateX: { duration: 0 } } }
      : undefined;
    const hoverEffect: TargetAndTransition | undefined = enableCardClickEvent
      ? { scale: 1.15, transition: { scale: { duration: 0.25 } } }
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

    const handleCardClick = useCallback(
      (index: number) => {
        if (onCardClick) {
          cardClicked.current = true;
          // when card is clicked, it activates the animation to play the card.
          // on the animation is complete, the callback handler calls the method that updates,
          // the state the card was played.
          onCardClick(index);
        }
      },
      [onCardClick]
    );

    useEffect(() => {
      if (player && playCard && !cardClicked.current) {
        cardClicked.current = true;
        handleCardClick(card.index);
      }
    }, [card.index, handleCardClick, playCard, player]);

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
        initial={initSpringValue}
        whileHover={hoverEffect}
        animate={cardState.springValue ? cardState.springValue : DEFAULT_SPRING_VAL}
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
          onClick={enableCardClickEvent ? () => handleCardClick(card.index) : undefined}
          style={cssValues}
        ></Image>
      </motion.div>
    );
  }
);

GameCard.displayName = 'GameCard';

export default GameCard;

const getShadowOffsetForPlayer = (playerNumber: number): string => {
  switch (playerNumber) {
    case 1:
      return 'top-2 left-2';
    case 2:
      return '-top-2 left-2';
    case 3:
      return 'top-2 -left-2';
    case 4:
      return 'top-2 -right-2';
  }

  return 'top-2 left-2';
};
