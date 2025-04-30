import { Card, RESPONSE_CARD_CENTER, RESPONSE_CARD_SIDE } from '@/app/lib/euchre/definitions/definitions';
import React, { forwardRef, PropsWithoutRef, RefObject } from 'react';
import GameCard from './game-card';
import { CardState } from '../../../hooks/euchre/reducers/cardStateReducer';
import clsx from 'clsx';
import { EuchreGameFlow } from '../../../hooks/euchre/reducers/gameFlowReducer';
import { AnimationControls, motion, TargetAndTransition } from 'framer-motion';

interface Props {
  location: 'center' | 'side';
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
      onAnimationComplete
    }: Props,
    ref
  ) => {
    console.log('**** [GameDeck] render. handId: ', handId);
    return (
      <motion.div
        className={clsx(
          'absolute min-w-[100px] z-30',
          { invisible: deck === undefined || cardStates === undefined },
          location === 'center' ? RESPONSE_CARD_CENTER : RESPONSE_CARD_SIDE
        )}
        ref={ref}
        id="game-deck"
        initial={initDeckState}
        animate={controls}
      >
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
