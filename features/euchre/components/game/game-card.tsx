import React, { CSSProperties, forwardRef, memo, PropsWithoutRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import Image from 'next/image';
import { getCardShadowSrc } from '../../util/game/cardDataUtil';
import { Card, TableLocation, RESPONSE_CARD_SIDE, RESPONSE_CARD_CENTER } from '../../definitions/definitions';
import { CardBaseState } from '../../definitions/game-state-definitions';
import { CardAnimationControls } from '../../definitions/transform-definitions';

interface Props extends React.HtmlHTMLAttributes<HTMLImageElement> {
  renderKey: string;
  card: Card;
  cardState: CardBaseState;
  animationControls: CardAnimationControls;
  width: number;
  height: number;
  location: TableLocation;
  responsive?: boolean;
  /** */
  onCardClick?: (cardIndex: number) => void;
}

const GameCard = memo(
  forwardRef<HTMLDivElement, PropsWithoutRef<Props>>(
    (
      {
        id,
        card,
        cardState,
        animationControls,
        width,
        height,
        className,
        location,
        responsive,
        onCardClick
      }: Props,
      ref
    ) => {
      const sideLocation = location === 'left' || location === 'right';
      const useHoverEffect: boolean = onCardClick !== undefined && cardState.enabled;
      const cssValues: CSSProperties = {};
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

      /** Handle card click event. */
      const handleCardClick = useCallback(() => {
        if (onCardClick) {
          onCardClick(card.index);
        }
      }, [card.index, onCardClick]);
      //#endregion

      return (
        <motion.div
          style={{ perspective: 1000 }}
          className={clsx('pointer-events-none overflow-visible', className)}
          title={cardState.cardFullName}
          id={id}
          ref={ref}
          initial={animationControls.initSpring}
          animate={animationControls.controls}
          draggable={false}
        >
          {' '}
          <motion.div
            initial={animationControls.initFlipSpring}
            animate={animationControls.flipControls}
            style={{ transformStyle: 'preserve-3d' }}
            className={clsx(sideLocation ? RESPONSE_CARD_SIDE : RESPONSE_CARD_CENTER)}
          >
            <Image
              className={clsx(`relative`, getShadowOffsetForPlayer(location))}
              quality={50}
              width={width}
              height={height}
              src={getCardShadowSrc(location)}
              alt={'Card Shadow'}
              style={{ ...cssValues, backfaceVisibility: 'visible' }}
              draggable={false}
            />
            <Image
              className={clsx(
                'absolute top-0 left-0 pointer-events-auto',
                { 'cursor-not-allowed': !useHoverEffect },
                {
                  'cursor-pointer hover:scale-110 hover:-translate-y-2 transition duration-300':
                    useHoverEffect
                }
              )}
              quality={100}
              width={width}
              height={height}
              src={cardState.src ?? cardBackSrc}
              alt={cardState.cardFullName}
              unoptimized={true}
              onClick={handleCardClick}
              style={{
                ...cssValues,
                backfaceVisibility: 'visible'
              }}
              draggable={false}
            />
            <Image
              className={clsx('absolute top-0 left-0')}
              quality={100}
              width={width}
              height={height}
              src={cardBackSrc}
              alt={'Card Back'}
              unoptimized={true}
              style={{
                ...cssValues,
                transform: sideLocation ? 'rotateX(180deg)' : 'rotateY(180deg)',
                backfaceVisibility: 'hidden'
              }}
              draggable={false}
            />
          </motion.div>
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
};

GameCard.displayName = 'GameCard';

export default GameCard;
