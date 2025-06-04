import React, { CSSProperties, forwardRef, memo, PropsWithoutRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Card, TableLocation, RESPONSE_CARD_SIDE, RESPONSE_CARD_CENTER } from '../../definitions/definitions';
import { CardBaseState } from '../../definitions/game-state-definitions';
import { CardAnimationControls, ZTransition } from '../../definitions/transform-definitions';
import PlayingCardShadow from '../common/playing-card-shadow';
import PlayingCardFace from '../common/playing-card-face';
import PlayingCardBack from '../common/playing-card-back';

interface Props extends React.HtmlHTMLAttributes<HTMLImageElement> {
  renderKey: string;
  card: Card;
  cardState: CardBaseState;
  animationControls: CardAnimationControls;
  width: number;
  height: number;
  location: TableLocation;
  responsive?: boolean;
  zTransition?: ZTransition;

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
        zTransition,
        onCardClick
      }: Props,
      ref
    ) => {
      const rotate = location === 'left' || location === 'right';
      const useHoverEffect: boolean = onCardClick !== undefined && cardState.enabled;
      const cssValues: CSSProperties = { backfaceVisibility: 'visible' };
      const cssContainerValues: CSSProperties = { perspective: 1000 };
      const displayCard: Card = cardState.valueVisible ? card : { suit: '♠', value: 'P', index: card.index };

      if (responsive) {
        cssValues.width = '100%';
        cssValues.height = '100%';
      } else {
        cssValues.width = width;
        cssValues.height = height;
        cssValues.maxHeight = height;
        cssValues.maxWidth = width;
      }

      if (zTransition?.startZ) cssContainerValues.zIndex = zTransition.startZ;
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
          style={cssContainerValues}
          className={clsx('pointer-events-none overflow-visible select-none', className)}
          title={cardState.cardFullName}
          id={id}
          ref={ref}
          initial={animationControls.initSpring}
          animate={animationControls.controls}
          draggable={false}
        >
          <motion.div
            initial={animationControls.initFlipSpring}
            animate={animationControls.flipControls}
            style={{ transformStyle: 'preserve-3d' }}
            className={clsx(rotate ? RESPONSE_CARD_SIDE : RESPONSE_CARD_CENTER)}
          >
            <PlayingCardShadow location={location} style={cssValues} rotate={rotate} />
            <PlayingCardFace
              rotate={rotate}
              suit={displayCard.suit}
              value={displayCard.value}
              addOverlay={cardState.cardOverlay}
              style={cssValues}
              onClick={handleCardClick}
              className={clsx(
                'absolute top-0 left-0 pointer-events-auto',
                { 'cursor-not-allowed': !useHoverEffect },
                {
                  'cursor-pointer hover:scale-110 hover:-translate-y-2 transition duration-300':
                    useHoverEffect
                }
              )}
            />
            <PlayingCardBack
              rotate={rotate}
              className="absolute top-0 left-0 pointer-events-auto"
              style={{
                ...cssValues,
                backfaceVisibility: 'hidden',
                transform: rotate ? 'rotateX(180deg)' : 'rotateY(180deg)'
              }}
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

GameCard.displayName = 'GameCard';

export default GameCard;
