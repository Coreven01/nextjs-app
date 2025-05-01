import { TargetAndTransition, Transition } from 'framer-motion';
import { Card, GameSpeed, TableLocation } from '../../../lib/euchre/definitions/definitions';
import { RefObject, useCallback } from 'react';
import { CardState } from '../reducers/cardStateReducer';
import { EuchrePlayer } from '../../../lib/euchre/definitions/game-state-definitions';
import { InitDealResult } from '../../../lib/euchre/definitions/logic-definitions';

const CARD_HEIGHT_OFFSET = 10;
const CARD_WIDTH_OFFSET = 70; //percentage of width of the card used when fanning player hand.
const INIT_ROTATION = 180;
const INIT_OFFSET = 75;
const INIT_OPACITY = 0.5;
const INIT_Z_INDEX = 30;
const GAME_PLAY_VARIATION = 10;

const ROTATION_OFFSET = 6;
const DEFAULT_TRANSITION_VAL: Transition = { rotateY: { duration: 0 }, rotateX: { duration: 0 } };

export const DEFAULT_SPRING_VAL: CardSpringTarget = {
  x: 0,
  y: 0,
  rotate: 0,
  opacity: 1,
  rotateY: 0,
  rotateX: 0,
  zIndex: INIT_Z_INDEX,
  transformStyle: 'preserve-3d',
  transition: { duration: 0 }
};

export interface CardSpringTarget extends TargetAndTransition {
  x: number;
  y: number;
  rotate?: number | number[];
  opacity?: number;
  rotateY?: number | number[];
  rotateX?: number | number[];
  zIndex?: number;
}

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

export interface CardPosition {
  /** Index used to order the card for display. */
  ordinalIndex: number;

  /** Index associated with the index of the card in the player's hand. */
  cardIndex: number;

  location?: TableLocation;
}

export interface CardSpringProps extends CardPosition {
  springValue: CardSpringTarget;
}

/** Creates card transformation for dealing/positioning/playing cards. */
const useCardTransform = () => {
  //#region Randomize values used for card animation.
  const getRandomRotation = useCallback(() => {
    const min = 170;
    const max = 190;
    const range = max - min;

    return Math.floor(Math.random() * range + min);
  }, []);

  const getRandomStiffness = useCallback(() => {
    const min = 290;
    const max = 310;
    const range = max - min;

    return Math.floor(Math.random() * range + min);
  }, []);

  const getRandomDamping = useCallback(() => {
    const min = 14;
    const max = 20;
    const range = max - min;

    return Math.floor(Math.random() * range + min);
  }, []);

  //#endregion

  /** Get an element's original position. Used in order to transform the card again to a new position. */
  const getElementOriginalPosition = (
    sourceRef: HTMLElement,
    currentSpring?: CardSpringTarget
  ): ElementRect => {
    const sourceRect: DOMRect = sourceRef.getBoundingClientRect();
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
   * Moves an element using the source ref to the dest ref.
   * If relative ref is provided, then offset the move to the relative ref.
   * If direction is 'in', then move closer, if 'out' then move away.
   * If current spring is provided, then move from its original position.
   */
  const getSpringMoveElement = (
    sourceRef: HTMLElement,
    destinationRef: HTMLElement,
    relativeRef?: HTMLElement,
    currentSourceSpring?: CardSpringTarget,
    useOffsets?: boolean,
    direction?: 'in' | 'out',
    useVariation?: boolean
  ): CardSpringTarget => {
    const sourceRect: ElementRect = getElementOriginalPosition(sourceRef, currentSourceSpring);
    const destRect: ElementRect = getElementOriginalPosition(destinationRef);
    let offsets: CardSpringTarget = { x: 0, y: 0 };

    if (useOffsets && relativeRef) {
      const relativeRect: ElementRect = getElementOriginalPosition(relativeRef);
      offsets = getElementOffsetForLocation(sourceRect, destRect, relativeRect, direction ?? 'in');
    }

    return {
      ...DEFAULT_SPRING_VAL,
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

  /** */
  const getElementOffsetForLocation = (
    sourceRect: ElementRect,
    destRect: ElementRect,
    relativeRect: ElementRect,
    direction: 'in' | 'out'
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

    let xOffset: number = 0;
    let yOffset: number = 0;

    switch (destLocation) {
      case 'top':
        yOffset = longSide / 2;
        break;
      case 'bottom':
        yOffset = -longSide / 2;
        break;
      case 'left':
        xOffset = longSide / 2;
        break;
      case 'right':
        xOffset = -longSide / 2;
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
   *
   */
  const getSpringsForDealForDealer = (
    outerTableRefs: Map<number, RefObject<HTMLDivElement | null>>,
    cardRefs: Map<number, RefObject<HTMLDivElement | null>>,
    relativeRef: RefObject<HTMLDivElement | null>,
    rotation: EuchrePlayer[],
    cards: Card[],
    dealResult: InitDealResult
  ): CardSpringProps[] => {
    const retval: CardSpringProps[] = [];
    let counter = 0;

    if (!relativeRef?.current) throw new Error('Invalid relative ref when dealing for dealer');

    for (const card of cards) {
      const destinationPlayer = rotation[counter % 4];
      const cardRef = cardRefs.get(card.index);
      const outerTableRef = outerTableRefs.get(destinationPlayer.playerNumber);

      if (!cardRef?.current) throw new Error('Invalid card ref when dealing for dealer');
      if (!outerTableRef?.current) throw new Error('Invalid deck ref when dealing for dealer');

      const newSpringVal = getSpringMoveElement(
        cardRef.current,
        outerTableRef.current,
        relativeRef.current,
        undefined,
        true,
        'in',
        true
      );

      newSpringVal.rotate = Math.random() * 180 + 90;
      newSpringVal.rotateX = 0;
      newSpringVal.rotateY = 0;
      newSpringVal.opacity = 1;
      newSpringVal.scale = 1;
      newSpringVal.zIndex = INIT_Z_INDEX + card.index;

      retval.push({
        springValue: newSpringVal,
        cardIndex: card.index,
        ordinalIndex: card.index
      });

      if (counter === dealResult.cardIndex) break;
      counter++;
    }

    return retval;
  };

  // const getPlayer1SpringForDealForDealer = (
  //   cardRef: HTMLElement,
  //   tableRef: HTMLElement
  // ): CardSpringTarget => {
  //   const cardOriginalPosition = getElementOriginalPosition(cardRef);
  //   const tableRect = tableRef.getBoundingClientRect();
  //   const cardHeight = cardOriginalPosition.bottom - cardOriginalPosition.top;
  //   const tableCenter = tableRect.left + (tableRect.right - tableRect.left) / 2;

  //   return {
  //     ...DEFAULT_SPRING_VAL,
  //     x: tableCenter - cardOriginalPosition.centerX,
  //     y: -(cardOriginalPosition.top - tableRect.top) - cardHeight
  //   };
  // };

  // const getPlayer2SpringForDealForDealer = (
  //   cardRef: HTMLElement,
  //   tableRef: HTMLElement
  // ): CardSpringTarget => {
  //   const cardOriginalPosition = getElementOriginalPosition(cardRef);
  //   const tableRect = tableRef.getBoundingClientRect();
  //   const cardHeight = cardOriginalPosition.bottom - cardOriginalPosition.top;
  //   const tableCenter = tableRect.left + (tableRect.right - tableRect.left) / 2;

  //   return {
  //     ...DEFAULT_SPRING_VAL,
  //     x: tableCenter - cardOriginalPosition.centerX,
  //     y: tableRect.bottom - cardOriginalPosition.bottom + cardHeight
  //   };
  // };

  // const getPlayer3SpringForDealForDealer = (
  //   cardRef: HTMLElement,
  //   tableRef: HTMLElement
  // ): CardSpringTarget => {
  //   const cardOriginalPosition = getElementOriginalPosition(cardRef);
  //   const tableRect = tableRef.getBoundingClientRect();
  //   const cardWidth = cardOriginalPosition.right - cardOriginalPosition.left;
  //   const tableCenter = tableRect.top + (tableRect.bottom - tableRect.top) / 2;

  //   return {
  //     ...DEFAULT_SPRING_VAL,
  //     x: tableRect.right - cardOriginalPosition.right + cardWidth,
  //     y: tableCenter - cardOriginalPosition.centerY
  //   };
  // };

  // const getPlayer4SpringForDealForDealer = (
  //   cardRef: HTMLElement,
  //   tableRef: HTMLElement
  // ): CardSpringTarget => {
  //   const cardOriginalPosition = getElementOriginalPosition(cardRef);
  //   const tableRect = tableRef.getBoundingClientRect();
  //   const cardWidth = cardOriginalPosition.right - cardOriginalPosition.left;
  //   const tableCenter = tableRect.top + (tableRect.bottom - tableRect.top) / 2;

  //   return {
  //     ...DEFAULT_SPRING_VAL,
  //     x: -(cardOriginalPosition.left - tableRect.left) - cardWidth,
  //     y: tableCenter - cardOriginalPosition.centerY
  //   };
  // };
  //#endregion

  //#region  Spring for deal for regular play

  const getSpringForDeal = (
    cardRef: HTMLElement,
    destinationRef: HTMLElement,
    relativeRef: HTMLElement | undefined,
    card: Card,
    isCenterLocation: boolean
  ) => {
    const newSpringVal = getSpringMoveElement(
      cardRef,
      destinationRef,
      relativeRef,
      undefined,
      true,
      'in',
      true
    );

    newSpringVal.rotate = Math.random() * 180 + 90;
    newSpringVal.rotateX = isCenterLocation ? 0 : 180;
    newSpringVal.rotateY = isCenterLocation ? 180 : 0;
    newSpringVal.opacity = 1;
    newSpringVal.scale = 1;
    newSpringVal.zIndex = INIT_Z_INDEX + card.index;

    return newSpringVal;
  };
  /**
   *
   */
  const getSpringsForDealForRegularPlay = (
    outerTableRefs: Map<number, RefObject<HTMLDivElement | null>>,
    cardRefs: Map<number, RefObject<HTMLDivElement | null>>,
    centerTableRef: RefObject<HTMLDivElement | null>,
    playerRotation: EuchrePlayer[],
    cardDealCount: number[],
    cards: Card[],
    dealerLocation: TableLocation,
    trump: Card
  ): CardSpringProps[] => {
    const retval: CardSpringProps[] = [];
    const centerLocation = dealerLocation === 'top' || dealerLocation === 'bottom';
    if (!centerTableRef?.current) throw new Error('Invalid center table ref when dealing for regular play');

    let counter = 0;

    for (let i = 0; i < 8; i++) {
      let numberOfCards = 0;
      const destinationPlayer = playerRotation[i % 4];
      const firstRound: boolean = i < 4;
      const tableRef = outerTableRefs.get(destinationPlayer.playerNumber);

      if (!tableRef?.current) throw new Error('Invalid deck ref when dealing for regular play');

      if (firstRound) {
        numberOfCards = i % 2 ? cardDealCount[0] : cardDealCount[1];
      } else {
        numberOfCards = i % 2 ? cardDealCount[1] : cardDealCount[0];
      }

      for (let j = 0; j < numberOfCards; j++) {
        const card = cards[counter];
        const cardRef = cardRefs.get(counter);

        if (!cardRef?.current) throw new Error('Invalid card ref when dealing for regular play');

        const newSpringVal = getSpringForDeal(
          cardRef.current,
          tableRef.current,
          centerTableRef.current,
          card,
          centerLocation
        );
        retval.push({
          springValue: newSpringVal,
          cardIndex: card.index,
          ordinalIndex: card.index,
          location: destinationPlayer.location
        });

        counter++;
      }
    }

    const cardRef = cardRefs.get(trump.index);
    if (!cardRef?.current) throw new Error('Invalid card ref when dealing for regular play');

    const newSpringVal = getSpringForDeal(
      cardRef.current,
      centerTableRef.current,
      undefined,
      trump,
      centerLocation
    );
    retval.push({
      springValue: newSpringVal,
      cardIndex: trump.index,
      ordinalIndex: trump.index
    });

    return retval;
  };
  //#endregion

  //#region Spring for card played

  /** Create and return transition value for a card dealt or played. */
  const getTransitionForCardMoved = (
    cardState: CardState,
    duration: GameSpeed,
    initDelay?: number
  ): Transition => {
    const percentDurationForRotate = 0.7;
    const durationSec = duration / 1000;
    const delay = initDelay ?? 0;

    return {
      opacity: { duration: 0 },
      x: {
        duration: durationSec,
        stiffness: cardState.xStiffness,
        damping: cardState.xDamping,
        ease: 'easeOut',
        delay: delay
      },
      y: {
        duration: durationSec,
        stiffness: cardState.yStiffness,
        damping: cardState.yDamping,
        ease: 'easeOut',
        delay: delay
      },
      rotate: {
        duration: durationSec * percentDurationForRotate,
        delay: delay
      },
      rotateY: {
        duration: durationSec * (1 - percentDurationForRotate),
        delay: durationSec * percentDurationForRotate + delay
      },
      rotateX: {
        duration: durationSec * (1 - percentDurationForRotate),
        delay: durationSec * percentDurationForRotate + delay
      },
      scale: { duration: 0 },
      zIndex: { duration: 0 }
    };
  };

  const getSpringsForCardPlayed = (
    cardIndex: number,
    player: EuchrePlayer | undefined,
    cardRef: HTMLElement,
    tableRef: HTMLElement | undefined,
    rotation: number,
    currentValues: CardSpringProps[],
    cardWidthOffset: number
  ): CardSpringProps[] => {
    if (!tableRef || !cardRef || !player) {
      return currentValues;
    }

    const currentForCardPlayed = currentValues.find((v) => v.cardIndex === cardIndex);

    if (!currentForCardPlayed) throw new Error();

    const retval: CardSpringProps[] = [];
    let cardPlayedFunc: (
      cardRef: HTMLElement,
      tableRef: HTMLElement,
      currentSpring: CardSpringTarget
    ) => CardSpringTarget;
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

    const currentSpring = currentForCardPlayed.springValue;
    const newVal = cardPlayedFunc(cardRef, tableRef, currentSpring);

    newVal.rotate = rotation;
    newVal.rotateX = 0;
    newVal.rotateY = 0;
    newVal.opacity = 1;
    newVal.scale = 1;

    retval.push({
      ordinalIndex: -1,
      cardIndex: cardIndex,
      springValue: newVal
    });

    // group remaining cards.
    retval.push(
      ...groupHand(
        player.location,
        cardWidthOffset,
        currentValues.filter((c) => c.cardIndex !== cardIndex)
      )
    );
    return retval;
  };

  const getPlayer1SpringForCardPlayed = (
    cardRef: HTMLElement,
    tableRef: HTMLElement,
    currentSpring: CardSpringTarget
  ): CardSpringTarget => {
    const cardOriginalPosition = getElementOriginalPosition(cardRef, currentSpring);
    const tableRect = tableRef.getBoundingClientRect();
    const cardHeight = cardOriginalPosition.bottom - cardOriginalPosition.top;
    const tableCenter = tableRect.left + (tableRect.right - tableRect.left) / 2;

    return {
      ...currentSpring,
      x: tableCenter - cardOriginalPosition.centerX,
      y: -(cardOriginalPosition.top - tableRect.top) - cardHeight / 3
    };
  };

  const getPlayer2SpringForCardPlayed = (
    cardRef: HTMLElement,
    tableRef: HTMLElement,
    currentSpring: CardSpringTarget
  ): CardSpringTarget => {
    const cardOriginalPosition = getElementOriginalPosition(cardRef, currentSpring);
    const tableRect = tableRef.getBoundingClientRect();
    const cardHeight = cardOriginalPosition.bottom - cardOriginalPosition.top;
    const tableCenter = tableRect.left + (tableRect.right - tableRect.left) / 2;
    return {
      ...currentSpring,
      x: tableCenter - cardOriginalPosition.centerX,
      y: tableRect.bottom - cardOriginalPosition.bottom + cardHeight / 3
    };
  };

  const getPlayer3SpringForCardPlayed = (
    cardRef: HTMLElement,
    tableRef: HTMLElement,
    currentSpring: CardSpringTarget
  ): CardSpringTarget => {
    const cardOriginalPosition = getElementOriginalPosition(cardRef, currentSpring);
    const tableRect = tableRef.getBoundingClientRect();
    const cardWidth = cardOriginalPosition.right - cardOriginalPosition.left;
    const tableCenter = tableRect.top + (tableRect.bottom - tableRect.top) / 2;

    return {
      ...currentSpring,
      x: tableRect.right - cardOriginalPosition.right + cardWidth / 3,
      y: tableCenter - cardOriginalPosition.centerY
    };
  };

  const getPlayer4SpringForCardPlayed = (
    cardRef: HTMLElement,
    tableRef: HTMLElement,
    currentSpring: CardSpringTarget
  ): CardSpringTarget => {
    const cardOriginalPosition = getElementOriginalPosition(cardRef, currentSpring);
    const tableRect = tableRef.getBoundingClientRect();
    const cardWidth = cardOriginalPosition.right - cardOriginalPosition.left;
    const tableCenter = tableRect.top + (tableRect.bottom - tableRect.top) / 2;

    return {
      ...currentSpring,
      x: -(cardOriginalPosition.left - tableRect.left) - cardWidth / 3,
      y: tableCenter - cardOriginalPosition.centerY
    };
  };
  //#endregion

  //#region  Group player's cards

  const getCalculatedWidthOffset = (cardRef: HTMLElement) => {
    const cardRect = cardRef.getBoundingClientRect();
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

  /** */
  const groupHand = (
    location: TableLocation,
    cardWidthOffset: number,
    stateForAvailableCards: CardSpringProps[]
  ) => {
    const retval: CardSpringProps[] = [];

    switch (location) {
      case 'bottom':
        retval.push(...groupPlayer1RemainingCards(cardWidthOffset, stateForAvailableCards));
        break;
      case 'top':
        retval.push(...groupPlayer2RemainingCards(cardWidthOffset, stateForAvailableCards));
        break;
      case 'left':
        retval.push(...groupPlayer3RemainingCards(cardWidthOffset, stateForAvailableCards));
        break;
      case 'right':
        retval.push(...groupPlayer4RemainingCards(cardWidthOffset, stateForAvailableCards));
    }

    return retval;
  };

  const groupPlayer1RemainingCards = (
    cardWidthOffset: number,
    stateForAvailableCards: CardSpringProps[]
  ): CardSpringProps[] => {
    const retval: CardSpringProps[] = [];
    const values: CardOffsetValues = getHandOffsetValues(stateForAvailableCards.length, cardWidthOffset);
    let newIndex: number = 0;
    retval.push(
      ...stateForAvailableCards.map((currentState) => {
        if (!currentState.springValue) throw new Error();

        return {
          ordinalIndex: newIndex,
          cardIndex: currentState.cardIndex,
          springValue: {
            ...currentState.springValue,
            x: values.widthOffsetStart + values.widthOffset * newIndex,
            y: -values.heightOffsetIndices[newIndex] * values.heightOffset,
            rotate: values.rotationStart + values.rotationOffset * newIndex,
            opacity: 1,
            zIndex: INIT_Z_INDEX + newIndex++
          }
        };
      })
    );

    return retval;
  };

  const groupPlayer2RemainingCards = (cardWidthOffset: number, stateForAvailableCards: CardSpringProps[]) => {
    const retval: CardSpringProps[] = [];
    const values = getHandOffsetValues(stateForAvailableCards.length, cardWidthOffset);
    let newIndex: number = 0;
    retval.push(
      ...stateForAvailableCards.map((currentState) => {
        if (!currentState.springValue) throw new Error();

        return {
          ordinalIndex: newIndex,
          cardIndex: currentState.cardIndex,
          springValue: {
            ...currentState.springValue,
            x: values.widthOffsetStart + values.widthOffset * newIndex,
            y: values.heightOffsetIndices[newIndex] * values.heightOffset,
            opacity: 1,
            rotate: -(values.rotationStart + values.rotationOffset * newIndex),
            zIndex: INIT_Z_INDEX + newIndex++
          }
        };
      })
    );
    return retval;
  };

  const groupPlayer3RemainingCards = (cardWidthOffset: number, stateForAvailableCards: CardSpringProps[]) => {
    const retval: CardSpringProps[] = [];
    const values = getHandOffsetValues(stateForAvailableCards.length, cardWidthOffset);
    let newIndex: number = 0;
    retval.push(
      ...stateForAvailableCards.map((currentState) => {
        if (!currentState.springValue) throw new Error();

        return {
          ordinalIndex: newIndex,
          cardIndex: currentState.cardIndex,
          springValue: {
            ...currentState.springValue,
            x: values.heightOffsetIndices[newIndex] * values.heightOffset,
            y: values.widthOffsetStart + values.widthOffset * newIndex,
            opacity: 1,
            rotate: values.rotationStart + values.rotationOffset * newIndex,
            zIndex: INIT_Z_INDEX + newIndex++
          }
        };
      })
    );
    return retval;
  };

  const groupPlayer4RemainingCards = (cardWidthOffset: number, stateForAvailableCards: CardSpringProps[]) => {
    const retval: CardSpringProps[] = [];
    const values = getHandOffsetValues(stateForAvailableCards.length, cardWidthOffset);
    let newIndex: number = 0;
    retval.push(
      ...stateForAvailableCards.map((currentState) => {
        if (!currentState.springValue) throw new Error();

        return {
          ordinalIndex: newIndex,
          cardIndex: currentState.cardIndex,
          springValue: {
            ...currentState.springValue,
            x: -values.heightOffsetIndices[newIndex] * values.heightOffset,
            y: values.widthOffsetStart + values.widthOffset * newIndex,
            opacity: 1,
            rotate: -(values.rotationStart + values.rotationOffset * newIndex),
            zIndex: INIT_Z_INDEX + newIndex++
          }
        };
      })
    );
    return retval;
  };

  //#endregion

  //#region Send cards to player after trick taken

  const getDestinationOffset = (location: TableLocation): { x: number; y: number } => {
    const retval: { x: number; y: number } = { x: 0, y: 0 };

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

  const getSpringForTrickTaken = (
    destinationPlayerNumber: number,
    sourcePlayerNumber: number,
    cardRef: HTMLElement,
    destinationDeckRef: HTMLElement,
    currentValue: CardSpringTarget
  ): CardSpringTarget => {
    let cardPlayedFunc: (
      cardRef: HTMLElement,
      destinationDeckRef: HTMLElement,
      currentSprung: CardSpringTarget
    ) => CardSpringTarget;
    switch (sourcePlayerNumber) {
      case 1:
        cardPlayedFunc = getPlayer1SpringForTrickTaken;
        break;
      case 2:
        cardPlayedFunc = getPlayer2SpringForTrickTaken;
        break;
      case 3:
        cardPlayedFunc = getPlayer3SpringForTrickTaken;
        break;
      default:
        cardPlayedFunc = getPlayer4SpringForTrickTaken;
    }

    const retval = cardPlayedFunc(cardRef, destinationDeckRef, currentValue);
    const offSets = getDestinationOffset('bottom');
    retval.x += offSets.x;
    retval.y += offSets.y;
    return retval;
  };

  const getPlayer1SpringForTrickTaken = (
    cardRef: HTMLElement,
    destinationDeckRef: HTMLElement,
    currentSpring: CardSpringTarget
  ): CardSpringTarget => {
    const cardOriginalPosition = getElementOriginalPosition(cardRef, currentSpring);
    const destRect = destinationDeckRef.getBoundingClientRect();
    const cardHeight = cardOriginalPosition.bottom - cardOriginalPosition.top;
    const destCenter = destRect.left + (destRect.right - destRect.left) / 2;

    return {
      ...currentSpring,
      x: destCenter - cardOriginalPosition.centerX,
      y: -(cardOriginalPosition.top - destRect.top) - cardHeight / 3,
      rotate: -110
    };
  };

  const getPlayer2SpringForTrickTaken = (
    cardRef: HTMLElement,
    destinationDeckRef: HTMLElement,
    currentSpring: CardSpringTarget
  ): CardSpringTarget => {
    const cardOriginalPosition = getElementOriginalPosition(cardRef, currentSpring);
    const destRect = destinationDeckRef.getBoundingClientRect();
    const cardHeight = cardOriginalPosition.bottom - cardOriginalPosition.top;
    const destCenter = destRect.left + (destRect.right - destRect.left) / 2;

    return {
      ...currentSpring,
      x: destCenter - cardOriginalPosition.centerX,
      y: destRect.bottom - cardOriginalPosition.bottom + cardHeight / 3,
      rotate: -80
    };
  };

  const getPlayer3SpringForTrickTaken = (
    cardRef: HTMLElement,
    destinationDeckRef: HTMLElement,
    currentSpring: CardSpringTarget
  ): CardSpringTarget => {
    const cardOriginalPosition = getElementOriginalPosition(cardRef, currentSpring);
    const cardWidth = cardOriginalPosition.right - cardOriginalPosition.left;
    const destRect = destinationDeckRef.getBoundingClientRect();
    const destCenter = destRect.top + (destRect.bottom - destRect.top) / 2;

    return {
      ...currentSpring,
      x: destRect.right - cardOriginalPosition.right + cardWidth / 3,
      y: destCenter - cardOriginalPosition.centerY,
      rotate: 80
    };
  };

  const getPlayer4SpringForTrickTaken = (
    cardRef: HTMLElement,
    tableRef: HTMLElement,
    currentSpring: CardSpringTarget
  ): CardSpringTarget => {
    const cardOriginalPosition = getElementOriginalPosition(cardRef, currentSpring);
    const destRect = tableRef.getBoundingClientRect();
    const cardWidth = cardOriginalPosition.right - cardOriginalPosition.left;
    const destCenter = destRect.top + (destRect.bottom - destRect.top) / 2;

    return {
      ...currentSpring,
      x: -(cardOriginalPosition.left - destRect.right) - cardWidth / 3,
      y: destCenter - cardOriginalPosition.centerY,
      rotate: 110
    };
  };
  //#endregion

  //#region
  const getSpringsToMoveToPlayer = (
    cardRefs: Map<number, RefObject<HTMLDivElement | null>>,
    destinationDeckRef: HTMLElement,
    destinationLocation: TableLocation,
    cardStates: CardState[]
  ): CardSpringProps[] => {
    const retval: CardSpringProps[] = [];
    const offsets = getDestinationOffset(destinationLocation);

    for (const cardRefMap of cardRefs) {
      const cardRef = cardRefMap[1].current;
      const cardIndex = cardRefMap[0];
      const state: CardState = cardStates[cardIndex];

      if (!cardRef) throw new Error('Invalid card ref to move cards to player.');

      const newSpring = getSpringMoveElement(cardRef, destinationDeckRef, undefined, state.springValue);

      newSpring.x += offsets.x;
      newSpring.y += offsets.y;
      newSpring.rotate = Math.random() * 720 - 360;
      retval.push({
        springValue: newSpring,
        cardIndex: state.cardIndex,
        ordinalIndex: state.cardIndex
      });
    }
    return retval;
  };
  //#endregion

  const getSpringsForCardInit = useCallback((player: EuchrePlayer | undefined): CardSpringTarget => {
    switch (player?.playerNumber) {
      case 1:
        return getPlayer1StartForCard();
      case 2:
        return getPlayer2StartForCard();
      case 3:
        return getPlayer3StartForCard();
      case 4:
        return getPlayer4StartForCard();
    }

    return {
      ...DEFAULT_SPRING_VAL,
      opacity: 0,
      rotate: 0,
      transition: { rotateY: { duration: 0 }, rotateX: { duration: 0 } }
    };
  }, []);

  // const getPlayerAnimateCardForStart = (
  //   player: EuchrePlayer | undefined,
  //   cardIndex: number,
  //   cardWidthOffset: number
  // ): CardSpringTarget => {
  //   switch (player?.playerNumber) {
  //     case 1:
  //       return getPlayer1AnimateStartForCard(cardIndex, cardWidthOffset);
  //     case 2:
  //       return getPlayer2AnimateStartForCard(cardIndex, cardWidthOffset);
  //     case 3:
  //       return getPlayer3AnimateStartForCard(cardIndex, cardWidthOffset);
  //     case 4:
  //       return getPlayer4AnimateStartForCard(cardIndex, cardWidthOffset);
  //   }

  //   return {
  //     ...DEFAULT_SPRING_VAL
  //   };
  // };

  const getPlayer1StartForCard = (): CardSpringTarget => {
    return {
      x: 0,
      y: INIT_OFFSET,
      opacity: INIT_OPACITY,
      rotate: 0,
      rotateY: INIT_ROTATION,
      rotateX: 0,
      transition: { ...DEFAULT_TRANSITION_VAL },
      zIndex: INIT_Z_INDEX
    };
  };

  const getPlayer2StartForCard = (): CardSpringTarget => {
    return {
      x: 0,
      y: -INIT_OFFSET,
      opacity: INIT_OPACITY,
      rotate: 0,
      rotateY: INIT_ROTATION,
      rotateX: 0,
      transition: { ...DEFAULT_TRANSITION_VAL },
      zIndex: INIT_Z_INDEX
    };
  };

  const getPlayer3StartForCard = (): CardSpringTarget => {
    return {
      x: -INIT_OFFSET,
      y: 0,
      opacity: INIT_OPACITY,
      rotate: 0,
      rotateY: 0,
      rotateX: INIT_ROTATION,
      transition: { ...DEFAULT_TRANSITION_VAL },
      zIndex: INIT_Z_INDEX
    };
  };

  const getPlayer4StartForCard = (): CardSpringTarget => {
    return {
      x: INIT_OFFSET,
      y: 0,
      opacity: INIT_OPACITY,
      rotate: 0,
      rotateY: 0,
      rotateX: INIT_ROTATION,
      transition: { ...DEFAULT_TRANSITION_VAL },
      zIndex: INIT_Z_INDEX
    };
  };

  const getPlayer1AnimateStartForCard = (cardOrder: number, cardWidthOffset: number) => {
    const values = getHandOffsetValues(5, cardWidthOffset);

    return {
      ...DEFAULT_SPRING_VAL,
      x: values.widthOffsetStart + values.widthOffset * cardOrder,
      y: -values.heightOffsetIndices[cardOrder] * values.heightOffset,
      opacity: 1,
      rotate: values.rotationStart + values.rotationOffset * cardOrder
    };
  };

  const getPlayer2AnimateStartForCard = (cardOrder: number, cardWidthOffset: number) => {
    const values = getHandOffsetValues(5, cardWidthOffset);

    return {
      ...DEFAULT_SPRING_VAL,
      x: values.widthOffsetStart + values.widthOffset * cardOrder,
      y: values.heightOffsetIndices[cardOrder],
      opacity: 1,
      rotate: -(values.rotationStart + values.rotationOffset * cardOrder)
    };
  };

  const getPlayer3AnimateStartForCard = (cardOrder: number, cardWidthOffset: number) => {
    const values = getHandOffsetValues(5, cardWidthOffset);

    return {
      ...DEFAULT_SPRING_VAL,
      x: -values.heightOffsetIndices[cardOrder],
      y: values.widthOffsetStart + values.widthOffset * cardOrder,
      opacity: 1,
      rotate: values.rotationStart + values.rotationOffset * cardOrder
    };
  };

  const getPlayer4AnimateStartForCard = (cardOrder: number, cardWidthOffset: number) => {
    const values = getHandOffsetValues(5, cardWidthOffset);

    return {
      ...DEFAULT_SPRING_VAL,
      x: values.heightOffsetIndices[cardOrder],
      y: values.widthOffsetStart + values.widthOffset * cardOrder,
      opacity: 1,
      rotate: -(values.rotationStart + values.rotationOffset * cardOrder)
    };
  };

  return {
    getSpringsForCardPlayed,
    getRandomDamping,
    getRandomRotation,
    getRandomStiffness,
    groupHand,
    getSpringForTrickTaken,
    getTransitionForCardMoved,
    getSpringsForDealForDealer,
    getSpringsToMoveToPlayer,
    getSpringMoveElement,
    getCardOffsetForLocation: getElementOffsetForLocation,
    getSpringsForDealForRegularPlay,
    getElementOriginalPosition,
    getSpringsForCardInit,
    getCalculatedWidthOffset
  };
};

export default useCardTransform;
