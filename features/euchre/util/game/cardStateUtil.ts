import { v4 as uuidv4 } from 'uuid';
import { createCardAnimationState } from '../play/cardTransformUtil';
import { TableLocation, Card } from '../../definitions/definitions';
import { CardBaseState } from '../../definitions/game-state-definitions';
import {
  CardAnimationControls,
  CreateCardStatesContext,
  CardAnimationState,
  DEFAULT_SPRING_VAL,
  CardAnimationStateContext
} from '../../definitions/transform-definitions';
import { getEncodedCardSvg, getCardFullName } from './cardSvgDataUtil';

/** Run the animations for the given controls */
const runCardAnimations = async (animationControls: CardAnimationControls[]) => {
  const animations: Promise<void>[] = [];

  for (const cardAnimation of animationControls) {
    if (cardAnimation.animateSprings.length > 0) {
      const startAnimation = async (): Promise<void> => {
        for (const animateValue of cardAnimation.animateSprings) {
          await cardAnimation.controls?.start(animateValue);
        }
      };

      animations.push(startAnimation());
    }

    if (cardAnimation.animateFlipSprings && cardAnimation.animateFlipSprings.length > 0) {
      const startAnimation = async (): Promise<void> => {
        if (cardAnimation.animateFlipSprings)
          for (const animateValue of cardAnimation.animateFlipSprings) {
            await cardAnimation.flipControls?.start(animateValue);
          }
      };

      animations.push(startAnimation());
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
): CardAnimationStateContext => {
  const { cards, controls, flipControls, initCardSpring, initFlipSprings } = cardStateContext;
  const cardStates: CardBaseState[] = [];
  const animationStates: CardAnimationState[] = [];
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
    const springValue = initProps?.initialSpring
      ? { ...initProps.initialSpring, zIndex: initZIndex + card.index * zIndexMultiplier }
      : undefined;
    const animateValue = initProps?.animateSprings ?? [];
    const initFlipProps = initFlipSprings.find((s) => s.cardIndex === card.index);

    cardStates.push(createCardBaseState(card, location, includeCardValue));
    animationStates.push(createCardAnimationState(card.index));
    animationControls.push({
      cardIndex: card.index,
      controls: control,
      flipControls: flipControl,
      initSpring: springValue,
      animateSprings: animateValue,
      initFlipSpring: initFlipProps?.initialSpring,
      animateFlipSprings: initFlipProps?.animateSprings
    });
  }

  return { cardStates, animationStates, animationControls };
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

export { runCardAnimations, createCardStatesFromGameDeck, createCardBaseState };
