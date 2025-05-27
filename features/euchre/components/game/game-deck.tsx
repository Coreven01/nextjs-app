import React, { forwardRef, PropsWithoutRef, RefObject, useEffect } from 'react';
import GameCard from './game-card';

import clsx from 'clsx';
import { AnimationControls, motion, TargetAndTransition } from 'framer-motion';
import DummyCard from '../common/dummy-card';
import { logConsole } from '../../util/util';
import { TableLocation, Card, RESPONSE_CARD_SIDE, RESPONSE_CARD_CENTER } from '../../definitions/definitions';
import { CardBaseState } from '../../definitions/game-state-definitions';
import { CardAnimationControls } from '../../definitions/transform-definitions';

interface Props {
  location: TableLocation;
  playerNumber: number;
  deck?: Card[];
  cardStates: CardBaseState[] | undefined;
  animationControls: CardAnimationControls[];
  deckCardRefs?: Map<number, RefObject<HTMLDivElement | null>>;
  initDeckState?: TargetAndTransition;
  controls?: AnimationControls;
  width: number;
  height: number;
  handId: string;
  showPosition: boolean;
  onFirstRender?: (ready: boolean) => void;
}

const GameDeck = forwardRef<HTMLDivElement, PropsWithoutRef<Props>>(
  (
    {
      deck,
      cardStates,
      animationControls,
      deckCardRefs,
      location,
      initDeckState,
      controls,
      width,
      height,
      handId,
      showPosition,
      onFirstRender
    }: Props,
    ref
  ) => {
    const sideLocation = location === 'left' || location === 'right';

    /** Notify parent component that component rendered and refs should be set. */
    useEffect(() => {
      const localOnFirstRender = onFirstRender;

      if (localOnFirstRender) localOnFirstRender(true);

      return () => {
        if (localOnFirstRender) localOnFirstRender(false);
      };
    }, [onFirstRender]);

    logConsole('*** [GAMEDECK] [RENDER]. handId: ', handId);

    return (
      <motion.div
        style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
        className={clsx(
          'absolute z-20 overflow-visible',
          { invisible: deck === undefined || cardStates === undefined },
          sideLocation ? RESPONSE_CARD_SIDE : RESPONSE_CARD_CENTER
        )}
        ref={ref}
        id="game-deck"
        initial={initDeckState}
        animate={controls}
      >
        <DummyCard visible={showPosition} responsive width={width} height={height} location={location} />
        {deck &&
          cardStates &&
          deckCardRefs &&
          deck.map((card) => {
            const cardState = cardStates[card.index];
            const cardRef = deckCardRefs.get(card.index);
            const animationControl = animationControls[card.index];

            return (
              <GameCard
                renderKey={cardState.renderKey}
                id={`game-deck-card-${card.index}`}
                key={`${card.index}`}
                ref={cardRef}
                location={location}
                className="absolute top-0"
                card={card}
                cardState={cardState}
                animationControls={animationControl}
                width={width}
                height={height}
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
