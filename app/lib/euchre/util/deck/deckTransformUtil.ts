import { RefObject } from 'react';
import {
  getDestinationOffset,
  getDurationSeconds,
  getElementOffset,
  getElementOriginalPosition,
  getSpringMoveElement,
  getSpringsForDealForDealer,
  getSpringsForDealForRegularPlay,
  getSpringsToMoveToPlayer,
  getSpringToMoveToPlayer,
  getTransitionForCardDeal,
  getTransitionForCardFlipped,
  getTransitionForCardMoved
} from '../play/cardTransformUtil';
import { GameSpeed, TableLocation } from '../../definitions/definitions';
import { v4 as uuidv4 } from 'uuid';
import {
  AnimationSpringsResult,
  CardAnimationState,
  CardAnimationStateContext,
  CardSpringProps
} from '../../definitions/transform-definitions';
import { CardBaseState, EuchreGameInstance, EuchrePlayer } from '../../definitions/game-state-definitions';
import { getPlayerRotation } from '../playerDataUtil';
import { getCardFullName, getEncodedCardSvg } from '../cardSvgDataUtil';
import { InitDealResult } from '../../definitions/logic-definitions';

/** Move cards from their current location to the destination location of the card state. This is usually the player's
 * area. Used to move cards after they have been dealt from the game table to the player, as if the player picked them up.
 */
const getCardStatesMoveToPlayer = (
  animationContext: CardAnimationStateContext,
  playerDeckRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>,
  deckCardRefs: Map<number, RefObject<HTMLDivElement | null>>,
  gameSpeed: GameSpeed
) => {
  const { cardStates, animationControls, animationStates } = animationContext;
  const newCardStates = [...cardStates];
  const springsToMove: CardSpringProps[] = [];
  const duration = getDurationSeconds(gameSpeed);
  const maxDelay = duration / 4;
  const fadeOutDurationPercent = 0.3;

  for (const cardState of newCardStates) {
    if (cardState.location) {
      const destinationElement = playerDeckRefs.get(cardState.location)?.current;
      const cardElement = deckCardRefs.get(cardState.cardIndex)?.current;
      const offsets = getDestinationOffset(cardState.location);
      const animationState = animationStates.find((s) => s.cardIndex === cardState.cardIndex);
      const animationControl = animationControls.find((s) => s.cardIndex === cardState.cardIndex);
      const lastSpring = animationControl?.animateValues.at(-1);
      const initialDelay = 0.1 + Math.random() * maxDelay;

      if (destinationElement && cardElement && animationState && animationControl) {
        const spring = getSpringToMoveToPlayer(
          {
            sourceElement: cardElement,
            destinationElement: destinationElement,
            relativeElement: undefined,
            currentSpring: lastSpring
          },
          cardState,
          animationState,
          animationControl,
          true
        ).animateValues[0];

        spring.x += offsets.x;
        spring.y += offsets.y;
        spring.opacity = 0;
        spring.rotate = (lastSpring?.rotate ?? 0) + (135 - Math.round(Math.random() * 270));

        spring.transition = getTransitionForCardMoved(animationState, gameSpeed, 1, initialDelay);
        spring.transition = {
          ...spring.transition,
          opacity: {
            duration: duration * fadeOutDurationPercent,
            delay: duration * (1 - fadeOutDurationPercent)
          }
        };
        cardState.renderKey = uuidv4();

        springsToMove.push({
          ordinalIndex: cardState.cardIndex,
          cardIndex: cardState.cardIndex,
          animateValues: [spring],
          initialValue: undefined
        });

        //       const delayBetweenMove = duration / variationDivisor;
        // const delayVariationDuration = delayBetweenMove * Math.round(Math.random() * variationDivisor);
        // const fadeOutDurationPercent = 0.3;
        // const fadeOutDelay = (duration + delayVariationDuration) * (1 - fadeOutDurationPercent);

        // transition = getTransitionForCardMoved(animationState, speed, 0.95, delayVariationDuration);
        // transition = {
        //   ...transition,
        //   opacity: { duration: duration * fadeOutDurationPercent, delay: fadeOutDelay }
        // };
        // newSpring.transition = transition;
      }
    }
  }

  return { newCardStates, springsToMove };
};

/** Move the deck element from its absolute original postion to the dealer's side of the table. Animate the deck
 * being moved into view and ready to deal the cards.
 */
const getSpringInitialMoveForDeal = (
  destinationElement: HTMLElement,
  relativeCenterElement: HTMLElement,
  gameDeckElement: HTMLElement,
  gameSpeed: GameSpeed
) => {
  const duration = getDurationSeconds(gameSpeed);
  const srcRect = getElementOriginalPosition(gameDeckElement);
  const destRect = getElementOriginalPosition(destinationElement);
  const relativeRect = getElementOriginalPosition(relativeCenterElement);
  const moveToElementSpring = getSpringMoveElement({ sourceElement: gameDeckElement, destinationElement });

  const distance = Math.max(srcRect.height, srcRect.width) / 2;
  const offsets = getElementOffset(srcRect, destRect, relativeRect, 'out', distance);

  // initial move from its absolute postion to the dealer's player location.
  // the deck position should be positioned absolute in the game area (top left),
  const initMoveToDealer = {
    ...moveToElementSpring,
    opacity: 0,
    x: moveToElementSpring.x + offsets.x,
    y: moveToElementSpring.y + offsets.y
  };

  // slide the cards into view after moving the deck.
  const moveIntoView = {
    ...initMoveToDealer,
    opacity: 1,
    x: initMoveToDealer.x - offsets.x * 1.2,
    y: initMoveToDealer.y - offsets.y * 1.2,
    transition: { opacity: { duration: duration }, x: { duration: duration }, y: { duration: duration } }
  };

  return { initMoveToDealer, moveIntoView };
};

const getStatesAnimateDealForDealer = (
  cardStates: CardBaseState[],
  animationStates: CardAnimationState[],
  game: EuchreGameInstance,
  gameSpeed: GameSpeed,
  directCenterH: HTMLElement,
  directCenterV: HTMLElement,
  outerTableRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>,
  deckCardRefs: Map<number, RefObject<HTMLDivElement | null>>,
  initDealResult: InitDealResult
) => {
  const rotation: EuchrePlayer[] = getPlayerRotation(game.gamePlayers, game.dealer);
  const duration: number = getDurationSeconds(gameSpeed);
  const delayBetweenMove: number = duration / 6;
  const newState: CardBaseState[] = [...cardStates];

  const springsForDeal: AnimationSpringsResult = getSpringsForDealForDealer(
    outerTableRefs,
    deckCardRefs,
    directCenterH,
    directCenterV,
    rotation,
    game.deck,
    initDealResult
  );

  const springCount = springsForDeal.cardSprings.length;
  for (let i = 0; i < springCount; i++) {
    const updatedSpring = springsForDeal.cardSprings[i];
    const updatedFlipSpring = springsForDeal.flipSprings[i];

    const cardState = newState.find((s) => s.cardIndex === updatedSpring.cardIndex);
    const animationState = animationStates.find((s) => s.cardIndex === updatedSpring.cardIndex);
    const card = game.deck.find((s) => s.index === updatedSpring.cardIndex);
    const percentDurationForRotate = 0.66 + Math.random() * 0.1;

    if (cardState?.location && card && animationState) {
      const transition = getTransitionForCardDeal(
        animationState,
        gameSpeed,
        percentDurationForRotate,
        delayBetweenMove * cardState.cardIndex
      );

      const flipTransition = getTransitionForCardFlipped(
        gameSpeed,
        percentDurationForRotate,
        delayBetweenMove * cardState.cardIndex
      );

      updatedSpring.animateValues[0].transition = transition;
      updatedFlipSpring.animateValues[0].transition = flipTransition;
      cardState.src = getEncodedCardSvg(card, cardState.location);
      cardState.cardFullName = getCardFullName(card);
      cardState.renderKey = uuidv4();
    }
  }

  return { newState, springsForDeal };
};

/** */
const getCardsStatesRegularDeal = (
  state: CardAnimationStateContext,
  game: EuchreGameInstance,
  gameSpeed: GameSpeed,
  horizontalElement: HTMLElement,
  verticalElement: HTMLElement,
  outerTableRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>,
  deckCardRefs: Map<number, RefObject<HTMLDivElement | null>>
) => {
  const rotation: EuchrePlayer[] = getPlayerRotation(game.gamePlayers, game.dealer);
  const duration: number = getDurationSeconds(gameSpeed);
  const delayBetweenMove: number = duration / 6;
  const newStates = [...state.cardStates];
  const percentDurationForRotate = 0.66 + Math.random() * 0.1;
  const springsForDeal: AnimationSpringsResult = getSpringsForDealForRegularPlay(
    outerTableRefs,
    deckCardRefs,
    horizontalElement,
    verticalElement,
    rotation,
    game.cardDealCount,
    game.deck,
    game.dealer.location,
    game.trump
  );

  for (const cardState of newStates) {
    const updatedSpring = springsForDeal.cardSprings.find((s) => s.cardIndex === cardState.cardIndex);
    const updatedFlipSpring = springsForDeal.flipSprings.find((s) => s.cardIndex === cardState.cardIndex);

    const card = game.deck.at(cardState.cardIndex);
    const cardIsTrump = cardState.cardIndex === game.trump.index;
    const animationState = state.animationStates.find((s) => s.cardIndex === cardState.cardIndex);

    if (updatedSpring && updatedFlipSpring && card && animationState) {
      const transition = getTransitionForCardDeal(
        animationState,
        gameSpeed,
        percentDurationForRotate,
        delayBetweenMove * cardState.cardIndex
      );

      const flipTransition = getTransitionForCardFlipped(
        gameSpeed,
        percentDurationForRotate,
        delayBetweenMove * cardState.cardIndex
      );

      updatedSpring.animateValues[0].transition = transition;
      updatedFlipSpring.animateValues[0].transition = flipTransition;

      cardState.location = updatedSpring.location;
      cardState.renderKey = uuidv4();
    } else if (!cardIsTrump) {
      cardState.location = game.dealer.location;
    }
  }

  return { newStates, springsForDeal };
};

/** Move all cards to the destination player after all cards have been dealt */
const getStatesMoveAllCardsToPlayer = (
  stateContext: CardAnimationStateContext,
  destinationLocation: TableLocation,
  destinationElement: HTMLElement,
  deckCardRefs: Map<number, RefObject<HTMLDivElement | null>>,
  gameSpeed: GameSpeed
) => {
  const springsToMove = getSpringsToMoveToPlayer(
    stateContext,
    deckCardRefs,
    destinationElement,
    destinationLocation,
    true,
    gameSpeed
  );

  const newCardStates = [...stateContext.cardStates];
  for (const cardState of newCardStates) {
    cardState.renderKey = uuidv4();
    cardState.location = destinationLocation;
  }

  return { newCardStates, springsToMove };
};

// const getCardStatesForTrickTaken = (
//   cardPlayed: Card,
//   cardStates: CardBaseState[],
//   cardAnimations: CardAnimationControls[],
//   destinationLocation: TableLocation,
//   destinationElement: HTMLElement,
//   sourceElement: HTMLElement,
//   gameSpeed: GameSpeed
// ) => {
//   const newCardStates = [...cardStates];

//newCardState.forEach((s) => (s.runEffectForState = undefined));
// const stateToUpdate = newCardStates.find((c) => c.cardIndex === cardPlayed.index);

// if (!stateToUpdate) throw new Error('Card state not found for trick taken.');

// const newSpring = getSpringToMoveToPlayer(
//   sourceElement,
//   destinationElement,
//   destinationLocation,
//   stateToUpdate,
//   false,
//   gameSpeed
// ).animateValues;

// const duration = gameSpeed / 100;
// const transition: Transition = {
//   x: { duration: duration },
//   y: { duration: duration },
//   rotate: { duration: duration }
// };

// stateToUpdate.useInitValue = false;
// stateToUpdate.renderKey = uuidv4();
// stateToUpdate.springValue = {
//   x: newSpring.x,
//   y: newSpring.y,
//   rotate: newSpring.rotate
// };

// stateToUpdate.transition = transition;
// stateToUpdate.runEffectForState = EuchreGameFlow.TRICK_FINISHED;

//   return newCardStates;
// };

export {
  getCardStatesMoveToPlayer,
  getSpringInitialMoveForDeal,
  getStatesAnimateDealForDealer,
  getCardsStatesRegularDeal,
  getStatesMoveAllCardsToPlayer
  //getCardStatesForTrickTaken
};
