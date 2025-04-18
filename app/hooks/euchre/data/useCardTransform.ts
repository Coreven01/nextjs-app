import { TargetAndTransition, Transition } from 'framer-motion';
import { EuchrePlayer } from '../../../lib/euchre/definitions';
import { EuchreGameFlow, EuchreGameFlowState } from '../reducers/gameFlowReducer';
import { useCallback } from 'react';

const CARD_HEIGHT_OFFSET = 10;
const CARD_WIDTH_OFFSET = 70; //percentage of width of the card used when fanning player hand.
const INIT_ROTATION = 180;
const INIT_OFFSET = 75;
const INIT_OPACITY = 0.75;
const INIT_Z_INDEX = 30;

const ROTATION_OFFSET = 6;
const DEFAULT_TRANSITION_VAL: Transition = { rotateY: { duration: 0 }, rotateX: { duration: 0 } };
export const DEFAULT_SPRING_VAL: CardSprungTarget = {
  x: 0,
  y: 0,
  rotate: 0,
  opacity: 1,
  rotateY: 0,
  rotateX: 0,
  zIndex: INIT_Z_INDEX,
  transformStyle: 'preserve-3d',
  transition: { ...DEFAULT_TRANSITION_VAL }
};

export interface CardSprungTarget extends TargetAndTransition {
  x: number;
  y: number;
  rotate: number;
  opacity: number;
  rotateY: number;
  rotateX: number;
  zIndex: number;
}

type CardOffsetValues = {
  widthOffsetStart: number;
  widthOffset: number;
  heightOffsetIndices: number[];
  heightOffset: number;
  rotationStart: number;
  rotationOffset: number;
};

export interface CardPosition {
  /** Index used to order the card for display. */
  ordinalIndex: number;

  /** Index associated with the index of the card in the player's hand. */
  cardIndex: number;
}

export interface CardSprungProps extends CardPosition {
  sprungValue: CardSprungTarget;
}

const useCardTransform = () => {
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

  const getSpringsForCardPlayed = (
    cardIndex: number,
    player: EuchrePlayer | undefined,
    cardRef: HTMLElement,
    tableRef: HTMLElement | undefined,
    rotation: number,
    currentValues: CardSprungProps[],
    cardWidthOffset: number
  ): CardSprungProps[] => {
    if (!tableRef || !cardRef || !player) {
      return currentValues;
    }

    const currentForCardPlayed = currentValues.find((v) => v.cardIndex === cardIndex);

    if (!currentForCardPlayed) throw new Error();

    const retval: CardSprungProps[] = [];
    let cardPlayedFunc: (
      cardRef: HTMLElement,
      tableRef: HTMLElement,
      rotation: number,
      currentSprung: CardSprungTarget
    ) => CardSprungTarget;
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

    const newVal = cardPlayedFunc(cardRef, tableRef, rotation, currentForCardPlayed.sprungValue);
    newVal.rotateX = 0;
    newVal.rotateY = 0;
    newVal.opacity = 1;

    retval.push({
      ordinalIndex: -1,
      cardIndex: cardIndex,
      sprungValue: newVal
    });

    // group remaining cards.
    retval.push(
      ...groupHand(
        player,
        cardWidthOffset,
        currentValues.filter((c) => c.cardIndex !== cardIndex)
      )
    );
    return retval;
  };

  /** */
  const groupHand = (
    player: EuchrePlayer | undefined,
    cardWidthOffset: number,
    stateForAvailableCards: CardSprungProps[]
  ) => {
    const retval: CardSprungProps[] = [];

    switch (player?.playerNumber) {
      case 1:
        retval.push(...groupPlayer1RemainingCards(cardWidthOffset, stateForAvailableCards));
        break;
      case 2:
        retval.push(...groupPlayer2RemainingCards(cardWidthOffset, stateForAvailableCards));
        break;
      case 3:
        retval.push(...groupPlayer3RemainingCards(cardWidthOffset, stateForAvailableCards));
        break;
      case 4:
        retval.push(...groupPlayer4RemainingCards(cardWidthOffset, stateForAvailableCards));
    }

    return retval;
  };

  const groupPlayer1RemainingCards = (
    cardWidthOffset: number,
    stateForAvailableCards: CardSprungProps[]
  ): CardSprungProps[] => {
    const retval: CardSprungProps[] = [];
    const values: CardOffsetValues = getHandOffsetValues(stateForAvailableCards.length, cardWidthOffset);
    let newIndex: number = 0;
    retval.push(
      ...stateForAvailableCards.map((currentState) => {
        if (!currentState.sprungValue) throw new Error();

        return {
          ordinalIndex: newIndex,
          cardIndex: currentState.cardIndex,
          sprungValue: {
            ...currentState.sprungValue,
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

  const groupPlayer2RemainingCards = (cardWidthOffset: number, stateForAvailableCards: CardSprungProps[]) => {
    const retval: CardSprungProps[] = [];
    const values = getHandOffsetValues(stateForAvailableCards.length, cardWidthOffset);
    let newIndex: number = 0;
    retval.push(
      ...stateForAvailableCards.map((currentState) => {
        if (!currentState.sprungValue) throw new Error();

        return {
          ordinalIndex: newIndex,
          cardIndex: currentState.cardIndex,
          sprungValue: {
            ...currentState.sprungValue,
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

  const groupPlayer3RemainingCards = (cardWidthOffset: number, stateForAvailableCards: CardSprungProps[]) => {
    const retval: CardSprungProps[] = [];
    const values = getHandOffsetValues(stateForAvailableCards.length, cardWidthOffset);
    let newIndex: number = 0;
    retval.push(
      ...stateForAvailableCards.map((currentState) => {
        if (!currentState.sprungValue) throw new Error();

        return {
          ordinalIndex: newIndex,
          cardIndex: currentState.cardIndex,
          sprungValue: {
            ...currentState.sprungValue,
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

  const groupPlayer4RemainingCards = (cardWidthOffset: number, stateForAvailableCards: CardSprungProps[]) => {
    const retval: CardSprungProps[] = [];
    const values = getHandOffsetValues(stateForAvailableCards.length, cardWidthOffset);
    let newIndex: number = 0;
    retval.push(
      ...stateForAvailableCards.map((currentState) => {
        if (!currentState.sprungValue) throw new Error();

        return {
          ordinalIndex: newIndex,
          cardIndex: currentState.cardIndex,
          sprungValue: {
            ...currentState.sprungValue,
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

  const getSpringsForCardInit = useCallback((player: EuchrePlayer | undefined): CardSprungTarget => {
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

    return { ...DEFAULT_SPRING_VAL, opacity: 0, rotate: 0 };
  }, []);

  const getPlayerAnimateCardForStart = (
    player: EuchrePlayer | undefined,
    cardIndex: number,
    cardWidthOffset: number
  ): CardSprungTarget => {
    switch (player?.playerNumber) {
      case 1:
        return getPlayer1AnimateStartForCard(cardIndex, cardWidthOffset);
      case 2:
        return getPlayer2AnimateStartForCard(cardIndex, cardWidthOffset);
      case 3:
        return getPlayer3AnimateStartForCard(cardIndex, cardWidthOffset);
      case 4:
        return getPlayer4AnimateStartForCard(cardIndex, cardWidthOffset);
    }

    return {
      ...DEFAULT_SPRING_VAL
    };
  };

  const getPlayer1StartForCard = (): CardSprungTarget => {
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

  const getPlayer2StartForCard = (): CardSprungTarget => {
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

  const getPlayer3StartForCard = (): CardSprungTarget => {
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

  const getPlayer4StartForCard = (): CardSprungTarget => {
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

  const getPlayer1SpringForCardPlayed = (
    cardRef: HTMLElement,
    tableRef: HTMLElement,
    rotation: number,
    currentSprung: CardSprungTarget
  ): CardSprungTarget => {
    const cardRect = cardRef.getBoundingClientRect();
    const tableRect = tableRef.getBoundingClientRect();
    const cardHeight = cardRect.bottom - cardRect.top;
    const currentX = parseInt(currentSprung.x.toString());
    const currentY = parseInt(currentSprung.y.toString());
    const orgLeft = cardRect.left - currentX;
    const orgRight = cardRect.right - currentX;
    const orgTop = cardRect.top - currentY;
    const cardCenter = orgLeft + (orgRight - orgLeft) / 2;
    const tableCenter = tableRect.left + (tableRect.right - tableRect.left) / 2;

    return {
      ...currentSprung,
      x: tableCenter - cardCenter,
      y: -(orgTop - tableRect.top) - cardHeight / 3,
      rotate: rotation
    };
  };

  const getPlayer2SpringForCardPlayed = (
    cardRef: HTMLElement,
    tableRef: HTMLElement,
    rotation: number,
    currentSprung: CardSprungTarget | undefined
  ): CardSprungTarget => {
    const cardRect = cardRef.getBoundingClientRect();
    const tableRect = tableRef.getBoundingClientRect();
    const cardHeight = cardRect.bottom - cardRect.top;
    const currentX = parseInt((currentSprung?.x ?? 0).toString());
    const currentY = parseInt((currentSprung?.y ?? 0).toString());
    const orgLeft = cardRect.left - currentX;
    const orgRight = cardRect.right - currentX;
    const orgBottom = cardRect.bottom - currentY;
    const cardCenter = orgLeft + (orgRight - orgLeft) / 2;
    const tableCenter = tableRect.left + (tableRect.right - tableRect.left) / 2;

    return {
      ...(currentSprung ?? DEFAULT_SPRING_VAL),
      x: tableCenter - cardCenter,
      y: tableRect.bottom - orgBottom + cardHeight / 3,
      rotate: rotation
    };
  };

  const getPlayer3SpringForCardPlayed = (
    cardRef: HTMLElement,
    tableRef: HTMLElement,
    rotation: number,
    currentSprung: CardSprungTarget | undefined
  ): CardSprungTarget => {
    const cardRect = cardRef.getBoundingClientRect();
    const tableRect = tableRef.getBoundingClientRect();
    const cardWidth = cardRect.right - cardRect.left;
    const currentX = parseInt((currentSprung?.x ?? 0).toString());
    const currentY = parseInt((currentSprung?.y ?? 0).toString());
    const orgRight = cardRect.right - currentX;
    const orgTop = cardRect.top - currentY;
    const orgBottom = cardRect.bottom - currentY;
    const cardCenter = orgTop + (orgBottom - orgTop) / 2;
    const tableCenter = tableRect.top + (tableRect.bottom - tableRect.top) / 2;

    return {
      ...(currentSprung ?? DEFAULT_SPRING_VAL),
      x: tableRect.right - orgRight + cardWidth / 3,
      y: tableCenter - cardCenter,
      rotate: rotation
    };
  };

  const getPlayer4SpringForCardPlayed = (
    cardRef: HTMLElement,
    tableRef: HTMLElement,
    rotation: number,
    currentSprung: CardSprungTarget | undefined
  ): CardSprungTarget => {
    const cardRect = cardRef.getBoundingClientRect();
    const tableRect = tableRef.getBoundingClientRect();
    const cardWidth = cardRect.right - cardRect.left;
    const currentX = parseInt((currentSprung?.x ?? 0).toString());
    const currentY = parseInt((currentSprung?.y ?? 0).toString());
    const orgLeft = cardRect.left - currentX;
    const orgTop = cardRect.top - currentY;
    const orgBottom = cardRect.bottom - currentY;
    const cardCenter = orgTop + (orgBottom - orgTop) / 2;
    const tableCenter = tableRect.top + (tableRect.bottom - tableRect.top) / 2;

    return {
      ...(currentSprung ?? DEFAULT_SPRING_VAL),
      x: -(orgLeft - tableRect.right) - cardWidth / 3,
      y: tableCenter - cardCenter,
      rotate: rotation
    };
  };

  const getCardCssForPlayerLocation = (
    cardIndex: number,
    player: EuchrePlayer | undefined,
    gameFlow: EuchreGameFlowState,
    isAvailable: boolean
  ): string => {
    if (!player) return '';

    const initDeg: number = -10;
    const rotateVal: number = 5;
    const offsetStart: number = 60;
    const offset: number = 30;
    const shouldShowHandImages = gameFlow.shouldShowCardImagesForHand.find((c) => c.player === player)?.value;
    const activeClasses =
      shouldShowHandImages &&
      player.human &&
      gameFlow.gameFlow === EuchreGameFlow.AWAIT_AI_INPUT &&
      isAvailable
        ? 'cursor-pointer md:hover:scale-[1.15] md:hover:translate-y-0'
        : 'cursor-not-allowed';

    let retval = '';
    const baseClasses = `contain transition duration-300 ease-in-out ${activeClasses}`;
    switch (player.playerNumber) {
      case 1:
        retval = `${baseClasses} rotate-[${initDeg + rotateVal * cardIndex}deg]
        translate-x-[${offsetStart - offset * cardIndex}px] translate-y-[${[0, 4].includes(cardIndex) ? 25 : [1, 3].includes(cardIndex) ? 15 : 10}px]`;
        break;
      case 2:
        retval = `${baseClasses} rotate-[${-initDeg - rotateVal * cardIndex}deg]
      translate-x-[${offsetStart - offset * cardIndex}px] translate-y-[${[1, 3].includes(cardIndex) ? 10 : cardIndex === 2 ? 15 : 0}px] `;
        break;
      case 3:
        retval = `${baseClasses} rotate-[${initDeg + rotateVal * cardIndex}deg]
      translate-y-[${offsetStart - offset * cardIndex}px] translate-x-[${[1, 3].includes(cardIndex) ? 10 : cardIndex === 2 ? 15 : 0}px]`;
        break;
      case 4:
        retval = `${baseClasses} transition rotate-[${-initDeg + -rotateVal * cardIndex}deg]
      translate-y-[${offsetStart - offset * cardIndex}px] translate-x-[${[1, 3].includes(cardIndex) ? -10 : cardIndex === 2 ? -15 : 0}px]`;
        break;
    }

    //retval = `${activeClasses}`;
    return retval;
  };

  return {
    getSpringsForCardPlayed,
    getRandomDamping,
    getRandomRotation,
    getRandomStiffness,
    getSpringsForCardInit,
    getCalculatedWidthOffset,
    groupHand
  };
};

export default useCardTransform;
