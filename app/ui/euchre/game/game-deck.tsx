import useCardData from '@/app/hooks/euchre/data/useCardData';
import { Card, RESPONSE_CARD_CENTER, RESPONSE_CARD_SIDE } from '@/app/lib/euchre/definitions/definitions';
import React, { RefObject } from 'react';
import GameCard from './game-card';
import { CardState } from '../../../hooks/euchre/reducers/cardStateReducer';
import clsx from 'clsx';
import { EuchreGameFlow } from '../../../hooks/euchre/reducers/gameFlowReducer';
import { motion, TargetAndTransition } from 'framer-motion';

interface Props {
  deck: Card[];
  cardStates: CardState[];
  cardRefs: Map<number, RefObject<HTMLDivElement | null>>;
  location: 'center' | 'side';
  playerNumber: number;
  dealType: EuchreGameFlow;
  initDeckState: TargetAndTransition;
  initAnimationState: TargetAndTransition;
  onDealComplete: () => void;
}

const GameDeck = ({
  deck,
  cardStates,
  cardRefs,
  location,
  dealType,
  initDeckState,
  initAnimationState,
  onDealComplete
}: Props) => {
  const { getDisplayWidth, getDisplayHeight } = useCardData();
  const width = getDisplayWidth(location);
  const height = getDisplayHeight(location);

  return (
    <motion.div
      className={clsx(
        'absolute min-w-[100px] z-30',
        location === 'center' ? RESPONSE_CARD_CENTER : RESPONSE_CARD_SIDE
      )}
      id="game-deck"
      initial={initDeckState}
      animate={initAnimationState}
    >
      {deck.map((card) => {
        const cardState = cardStates[card.index];
        const cardRef = cardRefs.get(card.index);
        return (
          <GameCard
            id={`game-deck-card-${card.index}`}
            ref={cardRef}
            className="absolute top-0"
            key={card.index}
            card={card}
            cardState={cardState}
            width={width}
            height={height}
            responsive={true}
            onAnimationComplete={onDealComplete}
            runAnimationCompleteEffect={dealType}
          />
        );
      })}
    </motion.div>
  );
};

export default GameDeck;
