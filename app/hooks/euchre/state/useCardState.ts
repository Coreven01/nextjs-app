import { useCallback, useState } from 'react';
import { createCardStatesFromGameDeck } from '../../../lib/euchre/util/cardStateUtil';
import { Card, TableLocation } from '../../../lib/euchre/definitions/definitions';
import {
  CardAnimationControls,
  CardAnimationState,
  CardAnimationStateContext,
  CardSpringProps,
  CreateCardStatesContext,
  FlipSpringProps
} from '../../../lib/euchre/definitions/transform-definitions';
import { CardBaseState } from '../../../lib/euchre/definitions/game-state-definitions';
import useCardAnimationControls from './useCardAnimationControls';

const useCardState = () => {
  const animationControls = useCardAnimationControls();
  const flipAnimiationControls = useCardAnimationControls();

  const [cardsAnimationControls, setCardsAnimationControls] = useState<CardAnimationControls[]>([]);
  const [cardStates, setCardStates] = useState<CardBaseState[]>([]);
  const [cardsAnimationStates, setCardsAnimationStates] = useState<CardAnimationState[]>([]);

  const stateContext: CardAnimationStateContext = {
    cardStates: cardStates,
    animationStates: cardsAnimationStates,
    animationControls: cardsAnimationControls
  };

  const createStates = useCallback(
    (
      cards: Card[],
      location: TableLocation,
      includeCardValue: boolean,
      initValues: CardSpringProps[],
      initFlipValues: FlipSpringProps[],
      reverseIndex: boolean
    ) => {
      const cardContext: CreateCardStatesContext = {
        cards: cards,
        controls: animationControls,
        flipControls: flipAnimiationControls,
        initCardSpring: initValues,
        initFlipSprings: initFlipValues
      };

      const states = createCardStatesFromGameDeck(cardContext, location, includeCardValue, reverseIndex);

      return states;
    },
    [animationControls, flipAnimiationControls]
  );

  const recreateAnimationControls = useCallback(
    (gameDeck: Card[], cardSpringProps: CardSpringProps, flipSpringProps: FlipSpringProps) => {
      const states = gameDeck.map((c) => {
        const control = animationControls[c.index];
        const flipControl = flipAnimiationControls[c.index];

        return {
          cardIndex: c.index,
          controls: control,
          flipControl,
          initSpringValue: cardSpringProps.initialValue,
          animateValues: cardSpringProps.animateValues,
          initFlipSpring: flipSpringProps.initialValue,
          animateFlipSpring: flipSpringProps.animateValues
        };
      });

      return states;
    },
    [animationControls, flipAnimiationControls]
  );

  return {
    stateContext,
    setCardsAnimationControls,
    setCardStates,
    setCardsAnimationStates,
    createStates,
    recreateAnimationControls
  };
};

export default useCardState;
