import { useAnimation } from 'framer-motion';
import { useCallback, useMemo, useState } from 'react';
import {
  createAnimationControls,
  createCardStatesFromGameDeck
} from '../../../lib/euchre/util/cardStateUtil';
import { Card, TableLocation } from '../../../lib/euchre/definitions/definitions';
import { CardSpringTarget } from '../../../lib/euchre/definitions/transform-definitions';
import {
  CardAnimationControls,
  CardAnimationState,
  CardBaseState
} from '../../../lib/euchre/definitions/game-state-definitions';

const useDeckState = () => {
  const c0 = useAnimation();
  const c1 = useAnimation();
  const c2 = useAnimation();
  const c3 = useAnimation();
  const c4 = useAnimation();

  const c5 = useAnimation();
  const c6 = useAnimation();
  const c7 = useAnimation();
  const c8 = useAnimation();
  const c9 = useAnimation();

  const c10 = useAnimation();
  const c11 = useAnimation();
  const c12 = useAnimation();
  const c13 = useAnimation();
  const c14 = useAnimation();

  const c15 = useAnimation();
  const c16 = useAnimation();
  const c17 = useAnimation();
  const c18 = useAnimation();
  const c19 = useAnimation();

  const c20 = useAnimation();
  const c21 = useAnimation();
  const c22 = useAnimation();
  const c23 = useAnimation();

  const animationControlsArray = useMemo(
    () => [
      c0,
      c1,
      c2,
      c3,
      c4,
      c5,
      c6,
      c7,
      c8,
      c9,
      c10,
      c11,
      c12,
      c13,
      c14,
      c15,
      c16,
      c17,
      c18,
      c19,
      c20,
      c21,
      c22,
      c23
    ],
    [
      c0,
      c1,
      c10,
      c11,
      c12,
      c13,
      c14,
      c15,
      c16,
      c17,
      c18,
      c19,
      c2,
      c20,
      c21,
      c22,
      c23,
      c3,
      c4,
      c5,
      c6,
      c7,
      c8,
      c9
    ]
  );

  const [deckCardsAnimationControls, setDeckCardsAnimationControls] = useState<CardAnimationControls[]>([]);
  const [deckCardStates, setDeckCardStates] = useState<CardBaseState[]>([]);
  const [deckCardsAnimationStates, setDeckCardsAnimationStates] = useState<CardAnimationState[]>([]);

  const createStates = useCallback(
    (
      gameDeck: Card[],
      location: TableLocation,
      includeCardValue: boolean,
      initSpringValue?: CardSpringTarget,
      initAnimateValues?: CardSpringTarget[]
    ) => {
      const states = createCardStatesFromGameDeck(
        gameDeck,
        animationControlsArray,
        location,
        includeCardValue,
        initSpringValue,
        initAnimateValues
      );

      return states;
    },
    [animationControlsArray]
  );

  const recreateAnimationControls = useCallback(
    (gameDeck: Card[], initSpringValue?: CardSpringTarget, initAnimateValues?: CardSpringTarget[]) => {
      const states = gameDeck.map((c) => {
        const control = animationControlsArray[c.index];
        return createAnimationControls(c, control, initSpringValue, initAnimateValues);
      });

      return states;
    },
    [animationControlsArray]
  );

  return {
    deckCardsAnimationControls,
    setDeckCardsAnimationControls,
    deckCardStates,
    setDeckCardStates,
    deckCardsAnimationStates,
    setDeckCardsAnimationStates,
    createStates,
    recreateAnimationControls
  };
};

export default useDeckState;
