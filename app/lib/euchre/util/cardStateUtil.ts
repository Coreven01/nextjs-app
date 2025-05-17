import { v4 as uuidv4 } from 'uuid';
import { getCardFullName, getEncodedCardSvg } from './cardSvgDataUtil';
import { getRandomDamping, getRandomStiffness } from './cardTransformUtil';
import { CardSpringProps, CardSpringTarget, DEFAULT_SPRING_VAL } from '../definitions/transform-definitions';
import { Card, TableLocation } from '../definitions/definitions';
import { AnimationControls } from 'framer-motion';
import {
  CardBaseState,
  CardAnimationState,
  CardAnimationControls
} from '../definitions/game-state-definitions';

/** */
const runCardAnimations = async (animationControls: CardAnimationControls[]) => {
  const animations: Promise<void>[] = [];

  for (const cardAnimation of animationControls) {
    if (cardAnimation.animateValues.length > 0) {
      const temp = async (): Promise<void> => {
        for (const animateValue of cardAnimation.animateValues) {
          await cardAnimation.controls?.start(animateValue);
        }
      };

      animations.push(temp());
    }
  }

  await Promise.all(animations);
};

/** Create the intial card state values for beginning deal.
 *
 */
const createCardStatesFromGameDeck = (
  cards: Card[],
  controls: AnimationControls[],
  location: TableLocation,
  includeCardValue: boolean,
  initValues: CardSpringProps[],
  reverseIndex: boolean
) => {
  const cardStates: CardBaseState[] = [];
  const animationCardStates: CardAnimationState[] = [];
  const animationControls: CardAnimationControls[] = [];
  const cardCount = cards.length;
  let initZIndex: number = DEFAULT_SPRING_VAL.zIndex ?? 30;
  let zIndexMultiplier = 1;

  if (reverseIndex) {
    initZIndex += cardCount;
    zIndexMultiplier = -1;
  }

  for (const card of cards) {
    const control = controls[card.index];
    const propValue = initValues.at(card.index);
    const springValue = propValue?.initialValue
      ? { ...propValue?.initialValue, zIndex: initZIndex + card.index * zIndexMultiplier }
      : undefined;
    const animateValue = propValue?.animateValues ?? [];

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
  const animationControl: CardAnimationControls = {
    cardIndex: card.index,
    initSpringValue: initSpringValue,
    controls: control,
    animateValues: initAnimateValues ?? []
  };

  return animationControl;
};

export {
  runCardAnimations,
  createCardStatesFromGameDeck,
  createCardBaseState,
  createAnimationState,
  createAnimationControls
};
