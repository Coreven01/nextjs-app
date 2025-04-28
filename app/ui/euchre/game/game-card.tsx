import { Card, RESPONSE_CARD_CENTER, RESPONSE_CARD_SIDE } from '@/app/lib/euchre/definitions/definitions';
import React, { CSSProperties, forwardRef, PropsWithoutRef, useCallback, useRef } from 'react';
import { motion, TargetAndTransition } from 'framer-motion';
import clsx from 'clsx';
import Image from 'next/image';
import { CardState } from '../../../hooks/euchre/reducers/cardStateReducer';
import { EuchreGameFlow } from '../../../hooks/euchre/reducers/gameFlowReducer';
import { logConsole } from '../../../lib/euchre/util';
import { EuchrePlayer } from '../../../lib/euchre/definitions/game-state-definitions';

interface Props extends React.HtmlHTMLAttributes<HTMLImageElement> {
  card: Card;
  cardState: CardState;
  width: number;
  height: number;

  /** If set, effect should run for this effect if it hasn't been executed yet. */
  runAnimationCompleteEffect?: EuchreGameFlow;
  player?: EuchrePlayer;
  responsive?: boolean;
  hideBackFace?: boolean;
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
      responsive,
      hideBackFace = true,
      onCardClick,
      onAnimationComplete,
      ...rest
    }: Props,
    ref
  ) => {
    const actionsRun = useRef<EuchreGameFlow[]>([]);
    const sidePlayer = player && player.team === 2;
    const cssValues: CSSProperties = { backfaceVisibility: hideBackFace ? 'hidden' : 'visible' };
    const hoverEffect: TargetAndTransition | undefined =
      onCardClick !== undefined
        ? {
            scale: [null, 1.1, 1.2],
            transition: {
              duration: 0.5,
              times: [0, 0.6, 1],
              ease: ['easeInOut', 'easeOut']
            }
          }
        : undefined;
    const cardBackSrc = sidePlayer ? '/card-back-side.svg' : '/card-back.svg';
    const cardShadowSrc = sidePlayer ? '/card-shadow-side.png' : '/card-shadow.png';

    if (responsive) {
      cssValues.width = '100%';
      cssValues.height = '100%';
    } else {
      cssValues.width = width;
      cssValues.height = height;
      cssValues.maxHeight = height;
      cssValues.maxWidth = width;
    }

    const handleAnimationComplete = useCallback(() => {
      const shouldRunEffect =
        runAnimationCompleteEffect &&
        onAnimationComplete &&
        cardState.runEffectForState === runAnimationCompleteEffect &&
        !actionsRun.current.find((e) => e === runAnimationCompleteEffect);

      if (shouldRunEffect) {
        // fall into this block once animation is complete to update game state.
        actionsRun.current.push(runAnimationCompleteEffect);
        logConsole(
          '[handleAnimationComplete] - game-card.tsx for card: ',
          card,
          ' play card effect: ',
          runAnimationCompleteEffect,
          ' player: ',
          player?.name,
          ' card state: ',
          cardState,
          ' actions run: ',
          actionsRun.current
        );

        onAnimationComplete(card);
      }
    }, [card, cardState, onAnimationComplete, player?.name, runAnimationCompleteEffect]);

    const handleCardClick = useCallback(() => {
      if (onCardClick) {
        logConsole('[handleCardClick] - game-card.tsx', ' card index: ', card.index);
        if (runAnimationCompleteEffect) actionsRun.current.push(runAnimationCompleteEffect);
        // when card is clicked, it activates the animation to play the card.
        // on the animation is complete, the callback handler calls the method that updates,
        // the state the card was played.
        onCardClick(card.index);
      }
    }, [card.index, onCardClick, runAnimationCompleteEffect]);

    return (
      <motion.div
        style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
        className={clsx(
          'pointer-events-none',
          sidePlayer ? RESPONSE_CARD_SIDE : RESPONSE_CARD_CENTER,
          className
        )}
        title={cardState.cardFullName}
        id={id}
        ref={ref}
        initial={cardState.initSpringValue}
        whileHover={hoverEffect}
        animate={cardState.springValue}
        onAnimationComplete={handleAnimationComplete}
        draggable={false}
      >
        <Image
          className={clsx(`relative`, getShadowOffsetForPlayer(player?.playerNumber ?? 1))}
          quality={50}
          width={width}
          height={height}
          src={cardShadowSrc}
          alt={'card shadow'}
          style={{ ...cssValues, backfaceVisibility: 'visible' }}
          draggable={false}
        />
        <Image
          className={clsx(
            'absolute top-0 left-0 pointer-events-auto',
            { 'cursor-not-allowed': hoverEffect === undefined },
            { 'cursor-pointer': hoverEffect !== undefined }
          )}
          quality={100}
          width={width}
          height={height}
          src={cardState.src ?? cardBackSrc}
          alt={cardState.cardFullName}
          unoptimized={true}
          onClick={handleCardClick}
          style={cssValues}
          draggable={false}
        />
        <Image
          className={clsx('absolute top-0 left-0')}
          quality={100}
          width={width}
          height={height}
          src={cardBackSrc}
          alt={'Card back'}
          unoptimized={true}
          style={{
            ...cssValues,
            transform: sidePlayer ? 'rotateX(180deg)' : 'rotateY(180deg)'
          }}
          draggable={false}
        />
      </motion.div>
    );
  }
);

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

GameCard.displayName = 'GameCard';

export default GameCard;
