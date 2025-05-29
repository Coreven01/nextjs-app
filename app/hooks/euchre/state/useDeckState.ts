import { useCallback, useState } from 'react';
import { createCardStatesFromGameDeck } from '../../../../features/euchre/util/game/cardStateUtil';

import useDeckAnimationControls from '../../../../features/euchre/state/useDeckAnimationControls';
import { Card, TableLocation } from '../../../../features/euchre/definitions/definitions';
import { CardBaseState } from '../../../../features/euchre/definitions/game-state-definitions';
import {
  CardAnimationControls,
  CardAnimationState,
  CardAnimationStateContext,
  CardSpringProps,
  FlipSpringProps,
  CreateCardStatesContext
} from '../../../../features/euchre/definitions/transform-definitions';

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

  /** Create card states based on initial values passed in.*/
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
