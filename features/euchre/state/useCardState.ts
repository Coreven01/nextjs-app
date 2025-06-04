import { useCallback, useState } from 'react';
import { createCardStatesFromGameDeck } from '../util/game/cardStateUtil';
import useCardAnimationControls from './useCardAnimationControls';
import {
  CardAnimationControls,
  CardAnimationState,
  CardAnimationStateContext,
  CardSpringProps,
  CreateCardStatesContext,
  DispatchCardAnimation,
  FlipSpringProps
} from '../definitions/transform-definitions';
import { CardBaseState } from '../definitions/game-state-definitions';
import { Card, TableLocation } from '../definitions/definitions';

const useCardState = () => {
  const animationControls = useCardAnimationControls();
  const flipAnimiationControls = useCardAnimationControls();

  const [cardAnimationControls, setCardAnimationControls] = useState<CardAnimationControls[]>([]);
  const [cardStates, setCardStates] = useState<CardBaseState[]>([]);
  const [cardAnimationStates, setCardAnimationStates] = useState<CardAnimationState[]>([]);

  const stateContext: CardAnimationStateContext = {
    cardStates: cardStates,
    animationStates: cardAnimationStates,
    animationControls: cardAnimationControls
  };

  const createStates = useCallback(
    (
      cards: Card[],
      location: TableLocation,
      includeCardValue: boolean,
      initValues: CardSpringProps[],
      initFlipValues: FlipSpringProps[],
      reverseIndex: boolean
    ): CardAnimationStateContext => {
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
    (
      gameDeck: Card[],
      cardSpringProps: CardSpringProps,
      flipSpringProps: FlipSpringProps
    ): CardAnimationControls[] => {
      const states = gameDeck.map((c) => {
        const control = animationControls[c.index];
        const flipControl = flipAnimiationControls[c.index];

        return {
          cardIndex: c.index,
          controls: control,
          flipControl,
          initSpringValue: cardSpringProps.initialSpring,
          animateSprings: cardSpringProps.animateSprings,
          initFlipSpring: flipSpringProps.initialSpring,
          animateFlipSpring: flipSpringProps.animateSprings
        };
      });

      return states;
    },
    [animationControls, flipAnimiationControls]
  );

  const dispatchAnimationState: DispatchCardAnimation = {
    setCardStates,
    setCardAnimationStates,
    setCardAnimationControls
  };

  return {
    stateContext,
    dispatchAnimationState,
    createStates,
    recreateAnimationControls
  };
};

export default useCardState;
