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
import useDeckAnimationControls from './useDeckAnimationControls';

/** State values used to animate dealing cards to players. */
const useDeckState = () => {
  const animationControls = useDeckAnimationControls();
  const flipAnimiationControls = useDeckAnimationControls();

  const [deckCardsAnimationControls, setDeckCardsAnimationControls] = useState<CardAnimationControls[]>([]);
  const [deckCardStates, setDeckCardStates] = useState<CardBaseState[]>([]);
  const [deckCardsAnimationStates, setDeckCardsAnimationStates] = useState<CardAnimationState[]>([]);

  const stateContext: CardAnimationStateContext = {
    cardStates: deckCardStates,
    animationStates: deckCardsAnimationStates,
    animationControls: deckCardsAnimationControls
  };

  const createStates = useCallback(
    (
      gameDeck: Card[],
      location: TableLocation,
      includeCardValue: boolean,
      initValues: CardSpringProps[],
      initFlipValues: FlipSpringProps[],
      reverseIndex: boolean
    ) => {
      const cardContext: CreateCardStatesContext = {
        cards: gameDeck,
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
          initSpringValue: cardSpringProps.initialSpring,
          animateValues: cardSpringProps.animateSprings,
          initFlipSpring: flipSpringProps.initialSpring,
          animateFlipSpring: flipSpringProps.animateSprings
        };
      });

      return states;
    },
    [animationControls, flipAnimiationControls]
  );

  return {
    stateContext,
    setDeckCardsAnimationControls,
    setDeckCardStates,
    setDeckCardsAnimationStates,
    createStates,
    recreateAnimationControls
  };
};

export default useDeckState;
