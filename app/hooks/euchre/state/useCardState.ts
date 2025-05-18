import { useAnimation } from 'framer-motion';
import { useCallback, useMemo, useState } from 'react';
import { createCardStatesFromGameDeck } from '../../../lib/euchre/util/cardStateUtil';
import { Card, TableLocation } from '../../../lib/euchre/definitions/definitions';
import { CardSpringProps, CardSpringTarget } from '../../../lib/euchre/definitions/transform-definitions';
import {
  CardAnimationControls,
  CardAnimationState,
  CardAnimationStateContext,
  CardBaseState
} from '../../../lib/euchre/definitions/game-state-definitions';

const useCardState = () => {
  const c0 = useAnimation();
  const c1 = useAnimation();
  const c2 = useAnimation();
  const c3 = useAnimation();
  const c4 = useAnimation();

  const animationControlsArray = useMemo(() => [c0, c1, c2, c3, c4], [c0, c1, c2, c3, c4]);

  const [cardsAnimationControls, setCardsAnimationControls] = useState<CardAnimationControls[]>([]);
  const [cardStates, setCardStates] = useState<CardBaseState[]>([]);
  const [cardsAnimationStates, setCardsAnimationStates] = useState<CardAnimationState[]>([]);

  const stateContext: CardAnimationStateContext = {
    cardStates: cardStates,
    animationStates: cardsAnimationStates,
    animationControls: cardsAnimationControls
  };

  const createStates = useCallback(
    (cards: Card[], location: TableLocation, includeCardValue: boolean, initValues: CardSpringProps[]) => {
      const states = createCardStatesFromGameDeck(
        cards,
        animationControlsArray,
        location,
        includeCardValue,
        initValues,
        false
      );

      return states;
    },
    [animationControlsArray]
  );

  const recreateAnimationControls = useCallback(
    (cards: Card[], initSpringValue?: CardSpringTarget, initAnimateValues?: CardSpringTarget[]) => {
      const states = cards.map((c) => {
        const control = animationControlsArray[c.index];
        return createAnimationControls(c, control, initSpringValue, initAnimateValues);
      });

      return states;
    },
    [animationControlsArray]
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
