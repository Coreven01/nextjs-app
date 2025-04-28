import useCardData from '@/app/hooks/euchre/data/useCardData';
import { Card, RESPONSE_CARD_CENTER } from '@/app/lib/euchre/definitions/definitions';
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
  playerNumber,
  dealType,
  initDeckState,
  initAnimationState,
  onDealComplete
}: Props) => {
  const { getCardClassForPlayerLocation } = useCardData();
  const { getDisplayWidth, getDisplayHeight } = useCardData();
  const width = getDisplayWidth(location);
  const height = getDisplayHeight(location);
  console.log('init deck state', initDeckState);
  return (
    <motion.div
      className={clsx(
        'absolute min-w-[100px] z-30',
        getCardClassForPlayerLocation(playerNumber, true),
        RESPONSE_CARD_CENTER
      )}
      id="game-deck"
      initial={initDeckState}
      animate={initAnimationState}
    >
      {/* <DummyCard width={width} height={height} responsive={true} location={location}></DummyCard> */}
      {deck.map((card) => {
        const cardState = cardStates[card.index];
        const cardRef = cardRefs.get(card.index);
        return (
          <GameCard
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
