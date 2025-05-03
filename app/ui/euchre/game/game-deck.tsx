import {
  Card,
  RESPONSE_CARD_CENTER,
  RESPONSE_CARD_SIDE,
  TableLocation
} from '@/app/lib/euchre/definitions/definitions';
import React, { forwardRef, PropsWithoutRef, RefObject, useEffect } from 'react';
import GameCard from './game-card';
import { CardState } from '../../../hooks/euchre/reducers/cardStateReducer';
import clsx from 'clsx';
import { EuchreGameFlow } from '../../../hooks/euchre/reducers/gameFlowReducer';
import { AnimationControls, motion, TargetAndTransition } from 'framer-motion';
import DummyCard from '../common/dummy-card';

interface Props {
  location: TableLocation;
  playerNumber: number;
  deck?: Card[];
  cardStates?: CardState[];
  deckCardRefs?: Map<number, RefObject<HTMLDivElement | null>>;
  dealType?: EuchreGameFlow;
  initDeckState?: TargetAndTransition;
  controls?: AnimationControls;
  width: number;
  height: number;
  handId: string;
  onAnimationComplete?: () => void;
  onFirstRender?: (ready: boolean) => void;
}

const GameDeck = forwardRef<HTMLDivElement, PropsWithoutRef<Props>>(
  (
    {
      deck,
      cardStates,
      deckCardRefs,
      location,
      dealType,
      initDeckState,
      controls,
      width,
      height,
      handId,
      onAnimationComplete,
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
    });

    console.log('**** [GameDeck] render. handId: ', handId, ' card states: ', cardStates);

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
        <DummyCard responsive width={width} height={height} location={location} />
        {deck &&
          cardStates &&
          deckCardRefs &&
          deck.map((card) => {
            const cardState = cardStates[card.index];
            const cardRef = deckCardRefs.get(card.index);
            return (
              <GameCard
                id={`game-deck-card-${card.index}`}
                key={`${card.index}`}
                ref={cardRef}
                location={location}
                className="absolute top-0"
                card={card}
                cardState={cardState}
                width={width}
                height={height}
                responsive={true}
                runAnimationCompleteEffect={dealType}
                onAnimationComplete={onAnimationComplete}
              />
            );
          })}
      </motion.div>
    );
  }
);

GameDeck.displayName = 'GameDeck';

export default GameDeck;
