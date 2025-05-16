import { v4 as uuidv4 } from 'uuid';
import { getCardFullName, getEncodedCardSvg } from './cardSvgDataUtil';
import { getRandomDamping, getRandomStiffness } from './cardTransformUtil';
import { CardSpringTarget, DEFAULT_SPRING_VAL } from '../definitions/transform-definitions';
import { Card, TableLocation } from '../definitions/definitions';
import { AnimationControls } from 'framer-motion';
import {
  CardBaseState,
  CardAnimationState,
  CardAnimationControls
} from '../definitions/game-state-definitions';

/** Create the intial card state values for beginning deal.
 *
 */
const createCardStatesFromGameDeck = (
  cards: Card[],
  controls: AnimationControls[],
  location: TableLocation,
  includeCardValue: boolean,
  initSpringValue?: CardSpringTarget,
  initAnimateValues?: CardSpringTarget[]
) => {
  const cardStates: CardBaseState[] = [];
  const animationCardStates: CardAnimationState[] = [];
  const animationControls: CardAnimationControls[] = [];
  const initZIndex: number = DEFAULT_SPRING_VAL.zIndex ?? 30;

  for (const card of cards) {
    const control = controls[card.index];
    const springValue = initSpringValue ? { ...initSpringValue, zIndex: initZIndex + card.index } : undefined;
    const animateValue = initAnimateValues ?? [];

    cardStates.push(createCardBaseState(card, location, includeCardValue));
    animationCardStates.push(createAnimationState(card));
    animationControls.push(createAnimationControls(card, control, springValue, animateValue));
  }

  return { cardStates, animationCardStates, animationControls };
};

/** Create the intial card state values for beginning deal.
 *
 */
const createCardBaseState = (card: Card, location: TableLocation, includeCardValue: boolean) => {
  const cardState: CardBaseState = {
    renderKey: uuidv4(),
    cardIndex: card.index,
    src: includeCardValue ? getEncodedCardSvg(card, location) : undefined,
    cardFullName: includeCardValue ? getCardFullName(card) : 'Player Card',
    enabled: false,
    location: location
  };

  return cardState;
};

/** Create the intial card state values for beginning deal.
 *
 */
const createAnimationState = (card: Card) => {
  const animationState: CardAnimationState = {
    cardIndex: card.index,
    xDamping: getRandomDamping(),
    xStiffness: getRandomStiffness(),
    yDamping: getRandomDamping(),
    yStiffness: getRandomStiffness()
  };

  return animationState;
};

/** Create the intial card state values for beginning deal.
 *
 */
const createAnimationControls = (
  card: Card,
  control: AnimationControls,
  initSpringValue?: CardSpringTarget,
  initAnimateValues?: CardSpringTarget[]
) => {
  const initZIndex: number = DEFAULT_SPRING_VAL.zIndex ?? 30;
  const springValue = initSpringValue ? { ...initSpringValue, zIndex: initZIndex + card.index } : undefined;
  const animateValue = initAnimateValues ?? [];

  const animationControl: CardAnimationControls = {
    cardIndex: card.index,
    initSpringValue: springValue,
    controls: control,
    animateValues: animateValue
  };

  return animationControl;
};

export { createCardStatesFromGameDeck, createCardBaseState, createAnimationState, createAnimationControls };
