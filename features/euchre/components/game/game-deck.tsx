import React, { forwardRef, PropsWithoutRef, RefObject, useEffect } from 'react';
import GameCard from './game-card';
import clsx from 'clsx';
import { AnimationControls, motion } from 'framer-motion';
import DummyCard from '../common/dummy-card';
import { RESPONSE_CARD_SIDE, RESPONSE_CARD_CENTER } from '../../definitions/definitions';
import { CardBaseState, DeckState } from '../../definitions/game-state-definitions';
import { CardAnimationControls } from '../../definitions/transform-definitions';

interface Props {
  deckState: DeckState;
  cardStates: CardBaseState[] | undefined;
  animationControls: CardAnimationControls[];
  deckCardRefs?: Map<number, RefObject<HTMLDivElement | null>>;
  controls?: AnimationControls;
  showPosition: boolean;
  onFirstRender?: (ready: boolean) => void;
}

const GameDeck = forwardRef<HTMLDivElement, PropsWithoutRef<Props>>(
  (
    { deckState, cardStates, animationControls, deckCardRefs, controls, showPosition, onFirstRender }: Props,
    ref
  ) => {
    const sideLocation = deckState.location === 'left' || deckState.location === 'right';

    /** Notify parent component that component rendered and refs should be set. */
    useEffect(() => {
      const localOnFirstRender = onFirstRender;

      if (localOnFirstRender) localOnFirstRender(true);

      return () => {
        if (localOnFirstRender) localOnFirstRender(false);
      };
    }, [onFirstRender]);

    return (
      <motion.div
        style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
        className={clsx(
          'absolute z-20 overflow-visible',
          { invisible: cardStates === undefined },
          sideLocation ? RESPONSE_CARD_SIDE : RESPONSE_CARD_CENTER
        )}
        ref={ref}
        id="game-deck"
        initial={deckState.initSpringValue}
        animate={controls}
      >
        <DummyCard
          visible={showPosition}
          responsive
          width={deckState.width}
          height={deckState.height}
          location={deckState.location}
        />
        {cardStates &&
          deckCardRefs &&
          deckState.deck.map((card) => {
            const cardState = cardStates[card.index];
            const cardRef = deckCardRefs.get(card.index);
            const animationControl = animationControls[card.index];

            return (
              <GameCard
                renderKey={cardState.renderKey}
                id={`game-deck-card-${card.index}`}
                key={`${card.index}`}
                ref={cardRef}
                location={deckState.location}
                className="absolute top-0"
                card={card}
                cardState={cardState}
                animationControls={animationControl}
                width={deckState.width}
                height={deckState.height}
                responsive={true}
              />
            );
          })}
      </motion.div>
    );
  }
);

GameDeck.displayName = 'GameDeck';

export default GameDeck;
