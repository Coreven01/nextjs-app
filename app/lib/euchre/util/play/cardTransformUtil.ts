import { Transition } from 'framer-motion';
import {
  AnimationSpringsResult,
  CardAnimationControls,
  CardAnimationState,
  CardAnimationStateContext,
  CardSpringProps,
  CardSpringTarget,
  DEFAULT_SPRING_VAL,
  INIT_Z_INDEX,
  SpringContext
} from '../../definitions/transform-definitions';
import { Card, GameSpeed, TableLocation } from '../../definitions/definitions';
import { RefObject } from 'react';
import { CardBaseState, EuchrePlayer } from '../../definitions/game-state-definitions';
import { InitDealResult } from '../../definitions/logic-definitions';
import { logConsole } from '../util';

const CARD_HEIGHT_OFFSET = 10;
const CARD_WIDTH_OFFSET = 70; //percentage of width of the card used when fanning player hand.
const INIT_ROTATION = 180;
const INIT_OFFSET = 75;
const INIT_OPACITY = 0.1;
const GAME_PLAY_VARIATION = 10;
const ROTATION_OFFSET = 6;

interface CardOffsetValues {
  widthOffsetStart: number;
  widthOffset: number;
  heightOffsetIndices: number[];
  heightOffset: number;
  rotationStart: number;
  rotationOffset: number;
}

interface ElementRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
  height: number;
  width: number;
}

//#region Randomize values used for card animation.
const getRandomRotation = () => {
  const min = 160;
  const max = 200;
  const range = max - min;

  return Math.floor(Math.random() * range + min);
};

const getRandomStiffness = () => {
  const min = 280;
  const max = 320;
  const range = max - min;

  return Math.floor(Math.random() * range + min);
};

const getRandomDamping = () => {
  const min = 13;
  const max = 21;
  const range = max - min;

  return Math.floor(Math.random() * range + min);
};

//#endregion

/** Get an element's original position. Used in order to transform the card again to a new position. */
const getElementOriginalPosition = (
  sourceElement: HTMLElement,
  currentSpring?: CardSpringTarget
): ElementRect => {
  const sourceRect: DOMRect = sourceElement.getBoundingClientRect();
  const currentX = currentSpring?.x ?? 0;
  const currentY = currentSpring?.y ?? 0;
  const orgLeft = sourceRect.left - currentX;
  const orgRight = sourceRect.right - currentX;
  const orgTop = sourceRect.top - currentY;
  const orgBottom = sourceRect.bottom - currentY;

  const retval: ElementRect = {
    left: orgLeft,
    right: orgRight,
    top: orgTop,
    bottom: orgBottom,
    centerX: orgLeft + sourceRect.width / 2,
    centerY: orgTop + sourceRect.height / 2,
    width: sourceRect.width,
    height: sourceRect.height
  };

  return retval;
};

/**
 * Moves an element using the source element to the dest element.
 * If relative element is provided, then offset the move to the relative element.
 * If direction is 'in', then move closer, if 'out' then move away.
 * If current spring is provided, then move from its original position.
 */
const getSpringMoveElement = (
  springContext: SpringContext,
  useOffsets?: boolean,
  direction?: 'in' | 'out',
  useVariation?: boolean
): CardSpringTarget => {
  const { sourceElement, destinationElement, relativeElement, currentSpring } = springContext;

  const sourceRect: ElementRect = getElementOriginalPosition(sourceElement, currentSpring);
  const destRect: ElementRect = getElementOriginalPosition(destinationElement);

  let offsets: CardSpringTarget = { x: 0, y: 0 };

  if (useOffsets && relativeElement) {
    const relativeRect: ElementRect = getElementOriginalPosition(relativeElement);
    offsets = getElementOffset(sourceRect, destRect, relativeRect, direction ?? 'in');
  }

  return {
    x:
      destRect.centerX -
      sourceRect.centerX +
      offsets.x +
      (useVariation ? Math.random() * GAME_PLAY_VARIATION - GAME_PLAY_VARIATION / 2 : 0),
    y:
      destRect.centerY -
      sourceRect.centerY +
      offsets.y +
      (useVariation ? Math.random() * GAME_PLAY_VARIATION - GAME_PLAY_VARIATION / 2 : 0)
  };
};

/** Moves an element an offset closer/further from the relative element.
 */
const getElementOffset = (
  sourceRect: ElementRect,
  destRect: ElementRect,
  relativeRect: ElementRect,
  direction: 'in' | 'out',
  distance?: number
): CardSpringTarget => {
  const longSide: number = Math.max(sourceRect.width, sourceRect.height);
  let destLocation: TableLocation;

  if (destRect.bottom < relativeRect.top) {
    destLocation = 'top';
  } else if (destRect.right < relativeRect.left) {
    destLocation = 'left';
  } else if (destRect.left > relativeRect.right) destLocation = 'right';
  else {
    destLocation = 'bottom';
  }

  const offsetDistance = distance ?? longSide / 2;

  return getOffsetValuesForLocation(destLocation, offsetDistance, direction);
};

const getOffsetValuesForLocation = (
  destinationLocation: TableLocation,
  offsetDistance: number,
  direction: 'in' | 'out'
) => {
  let xOffset: number = 0;
  let yOffset: number = 0;

  switch (destinationLocation) {
    case 'top':
      yOffset = offsetDistance;
      break;
    case 'bottom':
      yOffset = -offsetDistance;
      break;
    case 'left':
      xOffset = offsetDistance;
      break;
    case 'right':
      xOffset = -offsetDistance;
      break;
  }

  if (direction === 'out') {
    xOffset *= -1;
    yOffset *= -1;
  }

  return {
    x: xOffset,
    y: yOffset
  };
};
//#region Spring for deal

/**
 * Get animation values for dealing cards for initial deal for dealer.
 */
const getSpringsForDealForDealer = (
  outerTableRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>,
  cardRefs: Map<number, RefObject<HTMLDivElement | null>>,
  relativeHorizontalElement: HTMLElement,
  relativeVerticalElement: HTMLElement,
  rotation: EuchrePlayer[],
  cards: Card[],
  dealResult: InitDealResult
): AnimationSpringsResult => {
  const retval: AnimationSpringsResult = {
    cardSprings: [],
    flipSprings: []
  };

  let counter = 0;

  for (const card of cards) {
    const destinationPlayer = rotation[counter % 4];
    const cardElement = cardRefs.get(card.index)?.current;
    const outerTableElement = outerTableRefs.get(destinationPlayer.location)?.current;

    if (!cardElement) throw new Error('Invalid card element when dealing for dealer');
    if (!outerTableElement) throw new Error('Invalid table element when dealing for dealer');

    const relativeRef =
      destinationPlayer.location === 'top' || destinationPlayer.location === 'bottom'
        ? relativeHorizontalElement
        : relativeVerticalElement;

    const newSpringVal = getSpringMoveElement(
      {
        sourceElement: cardElement,
        destinationElement: outerTableElement,
        relativeElement: relativeRef
      },
      true,
      'in',
      true
    );

    newSpringVal.rotate = 90 + Math.round(Math.random() * 180);
    newSpringVal.opacity = 1;
    newSpringVal.scale = 1;
    newSpringVal.zIndex = INIT_Z_INDEX + card.index;

    retval.cardSprings.push({
      animateSprings: [newSpringVal],
      cardIndex: card.index,
      ordinalIndex: card.index,
      initialSpring: undefined
    });

    retval.flipSprings.push({
      cardIndex: card.index,
      ordinalIndex: card.index,
      initialSpring: undefined,
      animateSprings: [{ rotateX: 0, rotateY: 0 }]
    });

    // only create animation springs until the index for the deal result is reached.
    if (counter === dealResult.cardIndex) break;
    counter++;
  }

  return retval;
};

//#endregion

//#region  Spring for deal for regular play

/** */
const getSpringForDeal = (
  cardElement: HTMLElement,
  destinationElement: HTMLElement,
  relativeElement: HTMLElement | undefined,
  card: Card
): CardSpringTarget => {
  const newSpringVal = getSpringMoveElement(
    {
      sourceElement: cardElement,
      destinationElement: destinationElement,
      relativeElement: relativeElement
    },
    true,
    'in',
    true
  );

  newSpringVal.rotate = Math.random() * 180 + 90;
  newSpringVal.opacity = 1;
  newSpringVal.scale = 1;
  newSpringVal.zIndex = INIT_Z_INDEX + card.index;

  return newSpringVal;
};

/**
 * Get animation values for dealing cards for regular play.
 * Typically cards aren't dealt one by one, but dealt in groups, and rotated between players.
 * All players should have 5 cards after 2 rounds of dealing.
 * The next card to be dealt after each player receives 5 cards will be the flipped up card for
 * bidding for trump.
 */
const getSpringsForDealForRegularPlay = (
  outerTableRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>,
  cardRefs: Map<number, RefObject<HTMLDivElement | null>>,
  relativeHorizontalElement: HTMLElement,
  relativeVerticalElement: HTMLElement,
  playerRotation: EuchrePlayer[],
  cardDealCount: number[],
  cards: Card[],
  dealerLocation: TableLocation,
  trump: Card
): CardSpringProps[] => {
  const retval: CardSpringProps[] = [];
  const centerLocation = dealerLocation === 'top' || dealerLocation === 'bottom';
  let counter = 0;

  // each player is dealt cards twice, so rotation value will be 0 to 7.
  for (let i = 0; i < 8; i++) {
    let numberOfCards = 0;
    const destinationPlayer = playerRotation[i % 4];
    const firstRound: boolean = i < 4;
    const outerTableElement = outerTableRefs.get(destinationPlayer.location)?.current;
    const relativeElement =
      destinationPlayer.location === 'top' || destinationPlayer.location === 'bottom'
        ? relativeHorizontalElement
        : relativeVerticalElement;

    if (!outerTableElement) throw new Error('Invalid outer table element when dealing for regular play.');

    if (firstRound) {
      numberOfCards = i % 2 ? cardDealCount[0] : cardDealCount[1];
    } else {
      numberOfCards = i % 2 ? cardDealCount[1] : cardDealCount[0];
    }

    for (let j = 0; j < numberOfCards; j++) {
      const card = cards[counter];
      const cardElement = cardRefs.get(counter)?.current;

      if (!cardElement) throw new Error('Invalid card element when dealing for regular play.');

      const newSpringVal = getSpringForDeal(cardElement, outerTableElement, relativeElement, card);

      retval.push({
        animateSprings: [newSpringVal],
        cardIndex: card.index,
        ordinalIndex: card.index,
        location: destinationPlayer.location,
        initialSpring: undefined
      });

      counter++;
    }
  }

  const cardElement = cardRefs.get(trump.index)?.current;
  if (!cardElement) throw new Error('Invalid card ref when dealing for regular play');

  const newSpringVal = getSpringForDeal(cardElement, relativeHorizontalElement, undefined, trump);

  newSpringVal.rotate = centerLocation ? 360 : 270;
  retval.push({
    animateSprings: [newSpringVal],
    cardIndex: trump.index,
    ordinalIndex: trump.index,
    initialSpring: undefined
  });

  return retval;
};

//#endregion

//#region Spring for card played

const getBaseTransitionForCardMoved = (duration: GameSpeed): Transition => {
  const durationSec = getDurationSeconds(duration);

  return {
    x: {
      duration: durationSec,
      ease: 'easeOut'
    },
    y: {
      duration: durationSec,
      ease: 'easeOut'
    },
    rotate: {
      duration: durationSec
    }
  };
};

/** Create and return transition value for a card dealt. */
const getTransitionForCardDeal = (
  animationState: CardAnimationState,
  duration: GameSpeed,
  percentDurationForRotate?: number,
  initDelay?: number
): Transition => {
  const percentDelayForRotate: number = 0.04;
  const percentDurationValue: number = percentDurationForRotate ?? 0.7;

  const durationSec = getDurationSeconds(duration);
  const delay = initDelay ?? 0;
  const percentDelayForRotateValue = durationSec * percentDelayForRotate;
  const rotationDuration = durationSec * percentDurationValue;

  return {
    opacity: { duration: 0 },
    x: {
      duration: durationSec,
      stiffness: animationState.xStiffness,
      damping: animationState.xDamping,
      ease: 'easeOut',
      delay: delay
    },
    y: {
      duration: durationSec,
      stiffness: animationState.yStiffness,
      damping: animationState.yDamping,
      ease: 'easeOut',
      delay: delay
    },
    rotate: {
      duration: rotationDuration,
      delay: delay + percentDelayForRotateValue
    },
    scale: { duration: 0 }
  };
};

/** Create and return transition value for a card dealt or played. */
const getTransitionForCardMoved = (
  animationState: CardAnimationState,
  duration: GameSpeed,
  percentDurationForRotate?: number,
  initDelaySeconds?: number
): Transition => {
  const durationSec = getDurationSeconds(duration);
  const delay = initDelaySeconds ?? 0;
  const percentDurationValue: number = percentDurationForRotate ?? 0.7;

  return {
    opacity: { duration: 0 },
    x: {
      duration: durationSec,
      stiffness: animationState.xStiffness,
      damping: animationState.xDamping,
      ease: 'easeOut',
      delay: delay
    },
    y: {
      duration: durationSec,
      stiffness: animationState.yStiffness,
      damping: animationState.yDamping,
      ease: 'easeOut',
      delay: delay
    },
    rotate: {
      duration: durationSec * percentDurationValue,
      delay: delay
    },
    scale: { duration: 0 }
  };
};

const getTransitionForCardFlipped = (
  duration: GameSpeed,
  percentDurationForDelay?: number,
  initDelaySeconds?: number
) => {
  const percentDurationValue: number = percentDurationForDelay ?? 0.7;
  const durationSec = getDurationSeconds(duration);
  const delay = initDelaySeconds ?? 0;

  return {
    rotateY: {
      duration: durationSec * (1 - percentDurationValue),
      delay: durationSec * percentDurationValue + delay
    },
    rotateX: {
      duration: durationSec * (1 - percentDurationValue),
      delay: durationSec * percentDurationValue + delay
    }
  };
};

const getSpringsForCardPlayed = (
  cardIndex: number,
  player: EuchrePlayer,
  cardElement: HTMLElement,
  tableElement: HTMLElement,
  currentValues: CardSpringProps[],
  animationState: CardAnimationState,
  gameSpeed: GameSpeed
): AnimationSpringsResult => {
  const currentForCardPlayed = currentValues.find((v) => v.cardIndex === cardIndex);
  if (!currentForCardPlayed) throw new Error('Invalid card prop for card played.');

  const retval: AnimationSpringsResult = { cardSprings: [], flipSprings: [] };
  const currentSpring = currentForCardPlayed.animateSprings.at(-1);
  const cardOriginalPosition = getElementOriginalPosition(cardElement, currentSpring);
  const tableRect = tableElement.getBoundingClientRect();

  let cardPlayedFunc: (cardOriginalPosition: ElementRect, tableRect: DOMRect) => CardSpringTarget;
  switch (player.playerNumber) {
    case 1:
      cardPlayedFunc = getPlayer1SpringForCardPlayed;
      break;
    case 2:
      cardPlayedFunc = getPlayer2SpringForCardPlayed;
      break;
    case 3:
      cardPlayedFunc = getPlayer3SpringForCardPlayed;
      break;
    default:
      cardPlayedFunc = getPlayer4SpringForCardPlayed;
  }

  const moveSpring = cardPlayedFunc(cardOriginalPosition, tableRect);

  moveSpring.rotate = getRandomRotation();
  moveSpring.opacity = 1;
  moveSpring.scale = 1;
  moveSpring.transition = getTransitionForCardMoved(animationState, gameSpeed, 0.8);

  const cardMovedSpring = {
    ordinalIndex: -1,
    cardIndex: cardIndex,
    animateSprings: [moveSpring],
    initialSpring: undefined
  };

  const cardFlippedSpring = {
    ordinalIndex: -1,
    cardIndex: cardIndex,
    animateSprings: [{ rotateX: 0, rotateY: 0, transition: getTransitionForCardFlipped(gameSpeed, 0.8) }],
    initialSpring: undefined
  };

  retval.cardSprings.push(cardMovedSpring);
  retval.flipSprings.push(cardFlippedSpring);

  return retval;
};

const getPlayer1SpringForCardPlayed = (
  cardOriginalPosition: ElementRect,
  tableRect: DOMRect
): CardSpringTarget => {
  const cardHeight = cardOriginalPosition.bottom - cardOriginalPosition.top;
  const tableCenter = tableRect.left + (tableRect.right - tableRect.left) / 2;

  return {
    x: tableCenter - cardOriginalPosition.centerX,
    y: -(cardOriginalPosition.top - tableRect.top) - cardHeight / 3
  };
};

const getPlayer2SpringForCardPlayed = (
  cardOriginalPosition: ElementRect,
  tableRect: DOMRect
): CardSpringTarget => {
  const cardHeight = cardOriginalPosition.bottom - cardOriginalPosition.top;
  const tableCenter = tableRect.left + (tableRect.right - tableRect.left) / 2;
  return {
    x: tableCenter - cardOriginalPosition.centerX,
    y: tableRect.bottom - cardOriginalPosition.bottom + cardHeight / 3
  };
};

const getPlayer3SpringForCardPlayed = (
  cardOriginalPosition: ElementRect,
  tableRect: DOMRect
): CardSpringTarget => {
  const cardWidth = cardOriginalPosition.right - cardOriginalPosition.left;
  const tableCenter = tableRect.top + (tableRect.bottom - tableRect.top) / 2;

  return {
    x: tableRect.right - cardOriginalPosition.right + cardWidth / 2,
    y: tableCenter - cardOriginalPosition.centerY
  };
};

const getPlayer4SpringForCardPlayed = (
  cardOriginalPosition: ElementRect,
  tableRect: DOMRect
): CardSpringTarget => {
  const cardWidth = cardOriginalPosition.right - cardOriginalPosition.left;
  const tableCenter = tableRect.top + (tableRect.bottom - tableRect.top) / 2;

  return {
    x: -(cardOriginalPosition.left - tableRect.left) - cardWidth / 2,
    y: tableCenter - cardOriginalPosition.centerY
  };
};
//#endregion

//#region  Group player's cards

const getCalculatedWidthOffset = (cardElement: HTMLElement) => {
  const cardRect = cardElement.getBoundingClientRect();
  const cardShortLength = Math.min(cardRect.width, cardRect.height);
  const cardWidthOffset = cardShortLength * (CARD_WIDTH_OFFSET / 100);

  return cardWidthOffset;
};

const getHandOffsetValues = (numberOfCards: number, cardWidthOffset: number): CardOffsetValues => {
  if (numberOfCards <= 1) {
    return {
      widthOffsetStart: 0,
      widthOffset: 0,
      heightOffsetIndices: [0],
      heightOffset: 0,
      rotationStart: 0,
      rotationOffset: 0
    };
  }

  const numberOfCardsPerSide = Math.floor(numberOfCards / 2);
  const oddNumberOfCards = numberOfCards % 2 === 1;
  const widthStart = oddNumberOfCards
    ? -(numberOfCardsPerSide * cardWidthOffset)
    : -(numberOfCardsPerSide * cardWidthOffset - cardWidthOffset / 2);
  const rotationStart = oddNumberOfCards
    ? -(numberOfCardsPerSide * ROTATION_OFFSET)
    : -(numberOfCardsPerSide * ROTATION_OFFSET - ROTATION_OFFSET / 2);
  let heightIndices: number[];

  switch (numberOfCards) {
    case 5:
      heightIndices = [0, 1, 1.5, 1, 0];
      break;
    case 4:
      heightIndices = [0, 1, 1, 0];
      break;
    case 3:
      heightIndices = [0, 0.5, 0];
      break;
    case 2:
      heightIndices = [0, 0];
      break;
    default:
      heightIndices = [0];
  }

  return {
    widthOffsetStart: widthStart,
    widthOffset: cardWidthOffset,
    heightOffsetIndices: heightIndices,
    heightOffset: CARD_HEIGHT_OFFSET,
    rotationStart: rotationStart,
    rotationOffset: ROTATION_OFFSET
  };
};

const getSpringsGroupHand = (
  location: TableLocation,
  cardWidthOffset: number,
  stateForAvailableCards: CardSpringProps[]
) => {
  const retval: CardSpringProps[] = [];
  const values: CardOffsetValues = getHandOffsetValues(stateForAvailableCards.length, cardWidthOffset);
  retval.push(
    ...stateForAvailableCards.map((currentState, index) => {
      const springForLocation = getSpringsGroupHandForLocation(location, values, index);

      return {
        ordinalIndex: index,
        cardIndex: currentState.cardIndex,
        animateSprings: [
          {
            x: springForLocation.x,
            y: springForLocation.y,
            rotate: springForLocation.rotate,
            opacity: 1,
            zIndex: INIT_Z_INDEX + index
          }
        ],
        initialSpring: undefined
      };
    })
  );

  return retval;
};

const getSpringsGroupHandForLocation = (
  location: TableLocation,
  values: CardOffsetValues,
  index: number
): CardSpringTarget => {
  switch (location) {
    case 'bottom':
      return {
        x: values.widthOffsetStart + values.widthOffset * index,
        y: -values.heightOffsetIndices[index] * values.heightOffset,
        rotate: values.rotationStart + values.rotationOffset * index
      };
    case 'top':
      return {
        x: values.widthOffsetStart + values.widthOffset * index,
        y: values.heightOffsetIndices[index] * values.heightOffset,
        rotate: -(values.rotationStart + values.rotationOffset * index)
      };
    case 'left':
      return {
        x: values.heightOffsetIndices[index] * values.heightOffset,
        y: values.widthOffsetStart + values.widthOffset * index,
        rotate: values.rotationStart + values.rotationOffset * index
      };
    case 'right':
      return {
        x: -values.heightOffsetIndices[index] * values.heightOffset,
        y: values.widthOffsetStart + values.widthOffset * index,
        rotate: -(values.rotationStart + values.rotationOffset * index)
      };
  }
};

/** */
const groupHand = (
  location: TableLocation,
  cardWidthOffset: number,
  stateForAvailableCards: CardSpringProps[],
  animationStates: CardAnimationState[],
  duration: GameSpeed
) => {
  const retval: CardSpringProps[] = [];
  const values: CardOffsetValues = getHandOffsetValues(stateForAvailableCards.length, cardWidthOffset);

  retval.push(
    ...stateForAvailableCards.map((currentState, index) => {
      const animationState = animationStates[currentState.cardIndex];
      const locationOffsets = getGroupHandOffsets(location, values, index);
      const transition = getTransitionForCardMoved(animationState, duration);
      return {
        ordinalIndex: index,
        cardIndex: currentState.cardIndex,
        animateSprings: [
          {
            x: locationOffsets.x,
            y: locationOffsets.y,
            rotate: values.rotationStart + values.rotationOffset * index,
            opacity: 1,
            zIndex: INIT_Z_INDEX + index,
            transition: transition
          }
        ],
        initialSpring: undefined
      };
    })
  );

  return retval;
};

const getGroupHandOffsets = (
  location: TableLocation,
  values: CardOffsetValues,
  index: number
): { x: number; y: number } => {
  switch (location) {
    case 'bottom':
      return {
        x: values.widthOffsetStart + values.widthOffset * index,
        y: -values.heightOffsetIndices[index] * values.heightOffset
      };
    case 'top':
      return {
        x: values.widthOffsetStart + values.widthOffset * index,
        y: values.heightOffsetIndices[index] * values.heightOffset
      };
    case 'left':
      return {
        x: values.heightOffsetIndices[index] * values.heightOffset,
        y: values.widthOffsetStart + values.widthOffset * index
      };
    case 'right':
      return {
        x: -values.heightOffsetIndices[index] * values.heightOffset,
        y: values.widthOffsetStart + values.widthOffset * index
      };
  }
};

// const groupPlayer1RemainingCards = (
//   cardWidthOffset: number,
//   stateForAvailableCards: CardSpringProps[]
// ): CardSpringProps[] => {
//   const retval: CardSpringProps[] = [];
//   const values: CardOffsetValues = getHandOffsetValues(stateForAvailableCards.length, cardWidthOffset);
//   let newIndex: number = 0;
//   retval.push(
//     ...stateForAvailableCards.map((currentState) => {
//       return {
//         ordinalIndex: newIndex,
//         cardIndex: currentState.cardIndex,
//         animateValues: [
//           {
//             x: values.widthOffsetStart + values.widthOffset * newIndex,
//             y: -values.heightOffsetIndices[newIndex] * values.heightOffset,
//             rotate: values.rotationStart + values.rotationOffset * newIndex,
//             opacity: 1,
//             zIndex: INIT_Z_INDEX + newIndex++
//           }
//         ],
//         initialValue: undefined
//       };
//     })
//   );

//   return retval;
// };

// const groupPlayer2RemainingCards = (cardWidthOffset: number, stateForAvailableCards: CardSpringProps[]) => {
//   const retval: CardSpringProps[] = [];
//   const values = getHandOffsetValues(stateForAvailableCards.length, cardWidthOffset);
//   let newIndex: number = 0;
//   retval.push(
//     ...stateForAvailableCards.map((currentState) => {
//       if (!currentState.animateValues.at(0)) throw new Error();

//       return {
//         ordinalIndex: newIndex,
//         cardIndex: currentState.cardIndex,
//         animateValues: [
//           {
//             x: values.widthOffsetStart + values.widthOffset * newIndex,
//             y: values.heightOffsetIndices[newIndex] * values.heightOffset,
//             opacity: 1,
//             rotate: -(values.rotationStart + values.rotationOffset * newIndex),
//             zIndex: INIT_Z_INDEX + newIndex++
//           }
//         ],
//         initialValue: undefined
//       };
//     })
//   );
//   return retval;
// };

// const groupPlayer3RemainingCards = (cardWidthOffset: number, stateForAvailableCards: CardSpringProps[]) => {
//   const retval: CardSpringProps[] = [];
//   const values = getHandOffsetValues(stateForAvailableCards.length, cardWidthOffset);
//   let newIndex: number = 0;
//   retval.push(
//     ...stateForAvailableCards.map((currentState) => {
//       if (!currentState.animateValues.at(0)) throw new Error();

//       return {
//         ordinalIndex: newIndex,
//         cardIndex: currentState.cardIndex,
//         animateValues: [
//           {
//             x: values.heightOffsetIndices[newIndex] * values.heightOffset,
//             y: values.widthOffsetStart + values.widthOffset * newIndex,
//             opacity: 1,
//             rotate: values.rotationStart + values.rotationOffset * newIndex,
//             zIndex: INIT_Z_INDEX + newIndex++
//           }
//         ],
//         initialValue: undefined
//       };
//     })
//   );
//   return retval;
// };

// const groupPlayer4RemainingCards = (cardWidthOffset: number, stateForAvailableCards: CardSpringProps[]) => {
//   const retval: CardSpringProps[] = [];
//   const values = getHandOffsetValues(stateForAvailableCards.length, cardWidthOffset);
//   let newIndex: number = 0;
//   retval.push(
//     ...stateForAvailableCards.map((currentState) => {
//       if (!currentState.animateValues.at(0)) throw new Error();

//       return {
//         ordinalIndex: newIndex,
//         cardIndex: currentState.cardIndex,
//         animateValues: [
//           {
//             x: -values.heightOffsetIndices[newIndex] * values.heightOffset,
//             y: values.widthOffsetStart + values.widthOffset * newIndex,
//             opacity: 1,
//             rotate: -(values.rotationStart + values.rotationOffset * newIndex),
//             zIndex: INIT_Z_INDEX + newIndex++
//           }
//         ],
//         initialValue: undefined
//       };
//     })
//   );
//   return retval;
// };

//#endregion

//#region Send cards to player after trick taken

/** */
const getDestinationOffset = (location?: TableLocation): { x: number; y: number } => {
  const retval: { x: number; y: number } = { x: 0, y: 0 };

  if (!location) return retval;

  switch (location) {
    case 'bottom':
      retval.y += 100;
      break;
    case 'top':
      retval.y -= 100;
      break;
    case 'left':
      retval.x -= 100;
      break;
    default:
      retval.x += 100;
  }

  return retval;
};

/** After cards have been dealt, move cards to outside the bound of the game area, as if the
 * player picked them up.
 */
const moveCardsToPlayerArea = (
  cardStates: CardBaseState[],
  playerDeckRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>,
  cardRefs: Map<number, RefObject<HTMLDivElement | null>>,
  gameSpeed: GameSpeed
): CardBaseState[] => {
  const newState = [...cardStates];

  for (const cardState of newState) {
    if (cardState.location) {
      const destRef = playerDeckRefs.get(cardState.location);
      const cardRef = cardRefs.get(cardState.cardIndex);
      const offsets = getDestinationOffset(cardState.location);

      if (destRef?.current && cardRef?.current) {
        const spring = getSpringMoveElement(
          { sourceElement: cardRef.current, destinationElement: destRef.current, relativeElement: undefined }
          //cardState.springValue
        );

        spring.x += offsets.x;
        spring.y += offsets.y;

        // cardState.transition = getTransitionForCardMoved(cardState, gameSpeed);
        // cardState.springValue = spring;
      }
    }
  }

  return newState;
};

//#endregion

//#region

/** Get animation springs to move all card elements to the dealer's side of the table. */
const getSpringsToMoveToPlayer = (
  stateContext: CardAnimationStateContext,
  cardRefs: Map<number, RefObject<HTMLDivElement | null>>,
  destinationElement: HTMLElement,
  destinationLocation: TableLocation,
  useTransition: boolean,
  gameSpeed?: GameSpeed
): CardSpringProps[] => {
  const { cardStates, animationControls, animationStates } = stateContext;
  const cardValues = [...cardRefs.entries()];
  const retval: CardSpringProps[] = [];

  for (const [cardIndex, cardRef] of cardValues) {
    const cardState: CardBaseState = cardStates[cardIndex];
    const cardControl: CardAnimationControls = animationControls[cardIndex];
    const animationState: CardAnimationState = animationStates[cardIndex];

    if (!cardRef.current) throw new Error('Invalid card ref to move cards to player.');

    retval.push(
      getSpringToMoveToPlayer(
        {
          sourceElement: cardRef.current,
          destinationElement,
          destinationLocation,
          gameSpeed
        },
        cardState.cardIndex,
        animationState,
        cardControl,
        useTransition
      )
    );
  }
  return retval;
};

/** */
const getSpringToMoveToPlayer = (
  springContext: SpringContext,
  cardIndex: number,
  animationState: CardAnimationState,
  cardAnimation: CardAnimationControls,
  useTransition: boolean,
  delayVariation?: 'low' | 'med' | 'high'
): CardSpringProps => {
  const tempSpringContect = { ...springContext };
  const offsets = getDestinationOffset(tempSpringContect.destinationLocation);
  const lastAnimation = cardAnimation.animateSprings.at(-1);
  tempSpringContect.currentSpring = lastAnimation;
  const newSpring = getSpringMoveElement(tempSpringContect, false, 'out', false);
  let transition: Transition | undefined = undefined;

  newSpring.x += offsets.x;
  newSpring.y += offsets.y;
  newSpring.rotate = (lastAnimation?.rotate ?? 0) + 90 + Math.round(Math.random() * 180);
  newSpring.opacity = 0;

  if (useTransition) {
    const variation = delayVariation ?? 'med';
    const speed = tempSpringContect.gameSpeed ?? 1200;
    const duration = getDurationSeconds(speed);
    let variationDivisor = 6;

    switch (variation) {
      case 'low':
        variationDivisor = 3;
        break;
      case 'high':
        variationDivisor = 9;
        break;
    }

    const delayBetweenMove = duration / variationDivisor;
    const delayVariationDuration = delayBetweenMove * Math.round(Math.random() * variationDivisor);
    const fadeOutDurationPercent = 0.3;
    const fadeOutDelay = (duration + delayVariationDuration) * (1 - fadeOutDurationPercent);

    transition = getTransitionForCardMoved(animationState, speed, 0.95, delayVariationDuration);
    transition = {
      ...transition,
      opacity: { duration: duration * fadeOutDurationPercent, delay: fadeOutDelay }
    };
    newSpring.transition = transition;
  }

  return {
    animateSprings: [newSpring],
    cardIndex: cardIndex,
    ordinalIndex: cardIndex,
    initialSpring: undefined
  };

  // return {
  //   springValue: newSpring,
  //   transition: transition,
  //   cardIndex: cardState.cardIndex,
  //   ordinalIndex: cardState.cardIndex
  // };
};

//#endregion

const getSpringsPlayerHandInitDeal = (cards: Card[], location: TableLocation): AnimationSpringsResult => {
  const retval: AnimationSpringsResult = { cardSprings: [], flipSprings: [] };
  const centerLocation: boolean = location === 'top' || location === 'bottom';
  const initSpringValue: CardSpringTarget | undefined = {
    ...DEFAULT_SPRING_VAL,
    opacity: 0
  };

  for (const card of cards) {
    const initPosition: CardSpringProps = {
      ordinalIndex: card.index,
      cardIndex: card.index,
      initialSpring: initSpringValue,
      animateSprings: []
    };

    retval.cardSprings.push(initPosition);
    retval.flipSprings.push({
      ordinalIndex: card.index,
      cardIndex: card.index,
      initialSpring: { rotateY: centerLocation ? 180 : 0, rotateX: centerLocation ? 0 : 180 },
      animateSprings: []
    });
  }

  return retval;
};

const getSpringsForBeginNewHand = (
  cards: Card[],
  location: TableLocation,
  gameSpeed: GameSpeed,
  cardElements: HTMLElement[],
  destinationElement: HTMLElement,
  relativeElement: HTMLElement,
  calculatedWidth: number,
  currentProps: CardSpringProps[]
) => {
  const retval: CardSpringProps[] = [];
  const duration = getDurationSeconds(gameSpeed);
  const regroupSprings: CardSpringProps[] = getSpringsGroupHand(location, calculatedWidth, currentProps);
  const moveIntoView: CardSpringTarget | undefined = {
    ...DEFAULT_SPRING_VAL
  };

  for (const card of cards) {
    const cardElement = cardElements[card.index];
    const regroupSpring = regroupSprings.find((v) => v.cardIndex === card.index)?.animateSprings ?? [];

    // Move to a position just off-screen relative to the player's area.
    const initialMoveOffScreen = getSpringMoveElement(
      { sourceElement: cardElement, destinationElement, relativeElement },
      true,
      'out'
    );

    initialMoveOffScreen.opacity = 0;
    initialMoveOffScreen.transition = { duration: 0.01 };
    moveIntoView.transition = { delay: Math.random() * duration, duration: duration };
    regroupSpring.forEach((v) => (v.transition = { delay: Math.random() * 0.25, duration: duration }));

    logConsole('[BEGIN HAND MOVE] new hand initial moves : ', initialMoveOffScreen, moveIntoView);
    const moveSpringsForNewDeal: CardSpringProps = {
      ordinalIndex: card.index,
      cardIndex: card.index,
      initialSpring: undefined,
      animateSprings: [initialMoveOffScreen, moveIntoView, ...regroupSpring]
    };

    retval.push(moveSpringsForNewDeal);
  }

  return retval;
};

const getSpringsForCardInit = (location: TableLocation | undefined, initOffset: number): CardSpringTarget => {
  switch (location) {
    case 'bottom':
      return getBottomStartLocation(initOffset);
    case 'top':
      return getTopStartLocation(initOffset);
    case 'left':
      return getLeftStartLocation(initOffset);
    case 'right':
      return getRightStartLocation(initOffset);
  }

  return {
    ...DEFAULT_SPRING_VAL,
    opacity: 0,
    rotate: 0
  };
};

const getBottomStartLocation = (initOffset: number): CardSpringTarget => {
  return {
    x: 0,
    y: initOffset,
    opacity: INIT_OPACITY,
    rotate: 0,
    zIndex: INIT_Z_INDEX
  };
};

const getTopStartLocation = (initOffset: number): CardSpringTarget => {
  return {
    x: 0,
    y: -initOffset,
    opacity: INIT_OPACITY,
    rotate: 0,
    zIndex: INIT_Z_INDEX
  };
};

const getLeftStartLocation = (initOffset: number): CardSpringTarget => {
  return {
    x: -initOffset,
    y: 0,
    opacity: INIT_OPACITY,
    rotate: 0,
    zIndex: INIT_Z_INDEX
  };
};

const getRightStartLocation = (initOffset: number): CardSpringTarget => {
  return {
    x: initOffset,
    y: 0,
    opacity: INIT_OPACITY,
    rotate: 0,
    zIndex: INIT_Z_INDEX
  };
};

const getDurationSeconds = (speed: GameSpeed) => {
  return speed / 1000;
};

export {
  getDurationSeconds,
  getSpringsForCardPlayed,
  getRandomDamping,
  getRandomRotation,
  getRandomStiffness,
  groupHand,
  moveCardsToPlayerArea,
  getTransitionForCardMoved,
  getSpringsForDealForDealer,
  getSpringsToMoveToPlayer,
  getSpringToMoveToPlayer,
  getSpringMoveElement,
  getElementOffset,
  getSpringsForDealForRegularPlay,
  getElementOriginalPosition,
  getSpringsForCardInit,
  getCalculatedWidthOffset,
  getDestinationOffset,
  getBaseTransitionForCardMoved,
  getSpringsPlayerHandInitDeal,
  getSpringsForBeginNewHand,
  getSpringsGroupHand,
  getTransitionForCardDeal,
  getTransitionForCardFlipped
};

// const getSpringsForTrickTaken = (
//   springContext: SpringContext,
//   cardIndex: number,
//   cardAnimations: CardSpringProps[],
//   destinationLocation: TableLocation,
//   destinationElement: HTMLElement,
//   sourceElement: HTMLElement,
//   gameSpeed: GameSpeed
// ) => {
//   // const newCardStates = [...cardStates];

//   // newCardState.forEach((s) => (s.runEffectForState = undefined));
//   // const stateToUpdate = newCardStates.find((c) => c.cardIndex === cardPlayed.index);

//   if (!stateToUpdate) throw new Error('Card state not found for trick taken.');

//   const newSpring = getSpringToMoveToPlayer(
//     sourceElement,
//     destinationElement,
//     destinationLocation,
//     stateToUpdate,
//     false,
//     gameSpeed
//   ).animateValues;

//   const duration = gameSpeed / 100;
//   const transition: Transition = {
//     x: { duration: duration },
//     y: { duration: duration },
//     rotate: { duration: duration }
//   };

//   stateToUpdate.useInitValue = false;
//   stateToUpdate.renderKey = uuidv4();
//   stateToUpdate.springValue = {
//     x: newSpring.x,
//     y: newSpring.y,
//     rotate: newSpring.rotate
//   };

//   stateToUpdate.transition = transition;
//   stateToUpdate.runEffectForState = EuchreGameFlow.TRICK_FINISHED;

//   return newCardStates;
// };
