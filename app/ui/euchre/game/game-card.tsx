import { Card, EuchrePlayer, GameSpeed } from '@/app/lib/euchre/definitions';
import React, { CSSProperties, forwardRef, PropsWithoutRef, useCallback, useRef } from 'react';
import { motion, TargetAndTransition } from 'framer-motion';
import clsx from 'clsx';
import Image from 'next/image';
import { CardState } from '../../../hooks/euchre/reducers/cardStateReducer';
import { DEFAULT_SPRING_VAL } from '../../../hooks/euchre/data/useCardTransform';
import { EuchreGameFlow } from '../../../hooks/euchre/reducers/gameFlowReducer';

interface Props extends React.HtmlHTMLAttributes<HTMLImageElement> {
  card: Card;
  cardState: CardState;
  width: number;
  height: number;

  /** If set, effect should run for this effect if it hasn't been executed yet. */
  runAnimationCompleteEffect?: EuchreGameFlow;
  player?: EuchrePlayer;
  gameSpeedMs?: GameSpeed;
  responsive?: boolean;

  /** */
  onCardClick?: (cardIndex: number) => void;

  /** */
  onAnimationComplete?: (card: Card) => void;
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
      runAnimationCompleteEffect,
      gameSpeedMs,
      responsive,
      onCardClick,
      onAnimationComplete,
      ...rest
    }: Props,
    ref
  ) => {
    const actionsRun = useRef<EuchreGameFlow[]>([]);
    const sidePlayer = player && player.team === 2;
    const duration: number = (gameSpeedMs ?? 1000) / 1000;
    const responsiveCardSizeCenter = 'lg:h-[125px] md:h-[115px] h-[95px]';
    const responsiveCardSizeSide = 'lg:w-[125px] md:w-[115px] w-[95px]';
    const cssValues: CSSProperties = {};
    const initSpringValue = cardState.initSprungValue
      ? { ...cardState.initSprungValue, transition: { rotateY: { duration: 0 }, rotateX: { duration: 0 } } }
      : undefined;
    const hoverEffect: TargetAndTransition | undefined =
      onCardClick !== undefined ? { scale: 1.15, transition: { scale: { duration: 0.25 } } } : undefined;

    if (responsive) {
      cssValues.width = '100%';
      cssValues.height = '100%';
    } else {
      cssValues.width = width;
      cssValues.height = height;
      cssValues.maxHeight = height;
      cssValues.maxWidth = width;
    }

    const handleAnimationComplete = () => {
      const shouldRunEffect =
        runAnimationCompleteEffect &&
        onAnimationComplete &&
        cardState.runEffectForState === runAnimationCompleteEffect &&
        !actionsRun.current.find((e) => e === runAnimationCompleteEffect);

      if (shouldRunEffect) {
        // fall into this block once animation is complete to update game state.
        actionsRun.current.push(runAnimationCompleteEffect);
        console.log(
          '[handleAnimationComplete] - game-card.tsx for card: ',
          card,
          ' play card: ',
          runAnimationCompleteEffect
        );
        onAnimationComplete(card);
      }
    };

    const handleCardClick = useCallback(() => {
      if (onCardClick) {
        console.log('[handleCardClick] - game-card.tsx', ' card index: ', card.index);
        if (runAnimationCompleteEffect) actionsRun.current.push(runAnimationCompleteEffect);
        // when card is clicked, it activates the animation to play the card.
        // on the animation is complete, the callback handler calls the method that updates,
        // the state the card was played.
        onCardClick(card.index);
      }
    }, [card.index, onCardClick, runAnimationCompleteEffect]);

    return (
      <motion.div
        className={clsx(
          'pointer-events-none',
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
        onAnimationComplete={handleAnimationComplete}
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
          className={clsx('relative top-0 left-0 pointer-events-auto')}
          quality={100}
          width={width}
          height={height}
          src={cardState.src}
          alt={cardState.cardFullName}
          unoptimized={true}
          onClick={handleCardClick}
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
