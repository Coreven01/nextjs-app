import {
  Card,
  RESPONSE_CARD_CENTER,
  RESPONSE_CARD_SIDE,
  TableLocation
} from '@/app/lib/euchre/definitions/definitions';
import React, { CSSProperties, forwardRef, memo, PropsWithoutRef, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import Image from 'next/image';
import { CardState } from '../../../hooks/euchre/reducers/cardStateReducer';
import { EuchreGameFlow } from '../../../hooks/euchre/reducers/gameFlowReducer';
import { logConsole } from '../../../lib/euchre/util/util';
import { getCardShadowSrc } from '../../../lib/euchre/util/cardDataUtil';

interface Props extends React.HtmlHTMLAttributes<HTMLImageElement> {
  renderKey: string;
  card: Card;
  cardState: CardState;
  width: number;
  height: number;

  /** If set, effect should run for this effect if it hasn't been executed yet. */
  runAnimationCompleteEffect?: EuchreGameFlow;
  location: TableLocation;
  responsive?: boolean;
  hideBackFace?: boolean;
  /** */
  onCardClick?: (cardIndex: number) => void;

  /** */
  onAnimationComplete?: (card: Card) => void;
}

const GameCard = memo(
  forwardRef<HTMLDivElement, PropsWithoutRef<Props>>(
    (
      {
        renderKey,
        id,
        card,
        cardState,
        width,
        height,
        className,
        location,
        runAnimationCompleteEffect,
        responsive,
        hideBackFace = true,
        onCardClick,
        onAnimationComplete
      }: Props,
      ref
    ) => {
      /** Used to prevent the same animation event handler from running more than once for a particular action. */
      const actionsRun = useRef<EuchreGameFlow[]>([]);
      const sideLocation = location === 'left' || location === 'right';
      const useHoverEffect: boolean = onCardClick !== undefined && cardState.enabled;
      const cssValues: CSSProperties = { backfaceVisibility: hideBackFace ? 'hidden' : 'visible' };
      const cardBackSrc = sideLocation ? '/card-back-side.svg' : '/card-back.svg';
      if (responsive) {
        cssValues.width = '100%';
        cssValues.height = '100%';
      } else {
        cssValues.width = width;
        cssValues.height = height;
        cssValues.maxHeight = height;
        cssValues.maxWidth = width;
      }

      //#region Handlers
      /** Handle the animation complete event if an event handler was passed in and the
       * specific type of effect wasn't already handled.
       */
      const handleAnimationComplete = useCallback(() => {
        logConsole('*** [GAMECARD] [handleAnimationComplete] - card:', card);

        const shouldRunEffect =
          runAnimationCompleteEffect &&
          onAnimationComplete &&
          cardState.runEffectForState === runAnimationCompleteEffect &&
          !actionsRun.current.find((e) => e === runAnimationCompleteEffect);

        if (shouldRunEffect) {
          // fall into this block once animation is complete to update game state (onAnimationComplete).
          actionsRun.current.push(runAnimationCompleteEffect);
          onAnimationComplete(card);
        }
      }, [card, cardState.runEffectForState, onAnimationComplete, runAnimationCompleteEffect]);

      /** Handle card click event. */
      const handleCardClick = useCallback(() => {
        logConsole('*** [GAMECARD] [handleCardClick]');

        if (onCardClick) {
          if (runAnimationCompleteEffect) actionsRun.current.push(runAnimationCompleteEffect);
          // when card is clicked, it activates the animation to play the card.
          // on the animation is complete, the callback handler calls the method that updates,
          // the state the card was played.
          onCardClick(card.index);
        }
      }, [card.index, onCardClick, runAnimationCompleteEffect]);
      //#endregion

      if (cardState.enabled) logConsole('*** [GAMECARD] [RENDER] key: ', renderKey);

      return (
        <motion.div
          style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
          className={clsx(
            'pointer-events-none overflow-visible',
            sideLocation ? RESPONSE_CARD_SIDE : RESPONSE_CARD_CENTER,
            className
          )}
          title={cardState.cardFullName}
          id={id}
          ref={ref}
          initial={cardState.initSpringValue}
          animate={cardState.springValue}
          onAnimationComplete={handleAnimationComplete}
          draggable={false}
        >
          <Image
            className={clsx(`relative`, getShadowOffsetForPlayer(location))}
            quality={50}
            width={width}
            height={height}
            src={getCardShadowSrc(location)}
            alt={'card shadow'}
            style={{ ...cssValues, backfaceVisibility: 'visible' }}
            draggable={false}
          />
          <Image
            className={clsx(
              'absolute top-0 left-0 pointer-events-auto',
              { 'cursor-not-allowed': !useHoverEffect },
              {
                'cursor-pointer hover:scale-110 hover:-translate-y-2 transition duration-300': useHoverEffect
              }
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
              transform: sideLocation ? 'rotateX(180deg)' : 'rotateY(180deg)'
            }}
            draggable={false}
          />
        </motion.div>
      );
    }
  ),
  (prevProps, nextProps) => {
    return prevProps.renderKey === nextProps.renderKey;
  }
);

const getShadowOffsetForPlayer = (sideLocation: TableLocation): string => {
  switch (sideLocation) {
    case 'bottom':
      return 'top-2 left-2';
    case 'top':
      return '-top-2 left-2';
    case 'left':
      return 'top-2 -left-2';
    case 'right':
      return 'top-2 -right-2';
  }

  return 'top-2 left-2';
};

GameCard.displayName = 'GameCard';

export default GameCard;
