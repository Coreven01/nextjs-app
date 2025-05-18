import { v4 as uuidv4 } from 'uuid';
import { getCardFullName, getEncodedCardSvg } from './cardSvgDataUtil';
import { getRandomDamping, getRandomStiffness } from './play/cardTransformUtil';
import { CreateCardStatesContext, DEFAULT_SPRING_VAL } from '../definitions/transform-definitions';
import { Card, TableLocation } from '../definitions/definitions';
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
  cardStateContext: CreateCardStatesContext,
  location: TableLocation,
  includeCardValue: boolean,
  reverseIndex: boolean
) => {
  const { cards, controls, flipControls, initCardSpring, initFlipSprings } = cardStateContext;
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
    const flipControl = flipControls[card.index];
    const initProps = initCardSpring.find((s) => s.cardIndex === card.index);
    const springValue = initProps?.initialValue
      ? { ...initProps.initialValue, zIndex: initZIndex + card.index * zIndexMultiplier }
      : undefined;
    const animateValue = initProps?.animateValues ?? [];
    const initFlipProps = initFlipSprings.find((s) => s.cardIndex === card.index);

    cardStates.push(createCardBaseState(card, location, includeCardValue));
    animationCardStates.push(createAnimationState(card));
    animationControls.push({
      cardIndex: card.index,
      controls: control,
      flipControl,
      initSpringValue: springValue,
      animateValues: animateValue,
      initFlipSpring: initFlipProps?.initialValue,
      animateFlipSpring: initFlipProps?.animateValues
    });
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
// const createAnimationControls = (cardValues: CreateCardStateContext) => {
//   const {
//     card,
//     initAnimateValues,
//     initFlipAnimateValues,
//     initFlipValue,
//     initSpringValue,
//     control,
//     flipControl
//   } = cardValues;

//   const animationControl: CardAnimationControls = {
//     cardIndex: cardValues.card.index,
//     initSpringValue: cardValues.initSpringValue,
//     controls: cardValues.control,
//     animateValues: cardValues.initAnimateValues ?? [],
//     flipControl: cardValues.flipControl,
//     initFlipSpring: cardValues.initFlipValue,
//     animateFlipSpring: cardValues.initFlipAnimateValues
//   };

//   return animationControl;
// };

export { runCardAnimations, createCardStatesFromGameDeck, createCardBaseState, createAnimationState };
