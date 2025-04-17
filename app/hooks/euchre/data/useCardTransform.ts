import { Target } from 'framer-motion';
import { EuchrePlayer } from '../../../lib/euchre/definitions';
import { EuchreGameFlow, EuchreGameFlowState } from '../reducers/gameFlowReducer';
import { useCallback } from 'react';

const CARD_HEIGHT_OFFSET = 10;
const CARD_WIDTH_OFFSET = 70;
const ROTATION_OFFSET = 6;
export const DEFAULT_SPRUNG_VAL: CardSprungTarget = {
  x: 0,
  y: 0,
  rotate: 0,
  opacity: 1,
  rotateY: 0,
  rotateX: 0,
  transformStyle: 'preserve-3d'
};

export interface CardSprungTarget extends Target {
  x: number;
  y: number;
  rotate: number;
  opacity: number;
  rotateY: number;
  rotateX: number;
}

type CardOffsetValues = {
  widthOffsetStart: number;
  widthOffset: number;
  heightOffsetIndices: number[];
  heightOffset: number;
  rotationStart: number;
  rotationOffset: number;
};

export type CardSprungProps = {
  cardIndex: number;
  sprungValue: CardSprungTarget;
};

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
    availableIndices: number[]
  ): CardSprungProps[] => {
    if (!tableRef || !cardRef || !player) {
      return currentValues;
    }

    const currentValue = currentValues.find((v) => v.cardIndex === cardIndex);
    const retval: CardSprungProps[] = [];
    let func: (
      cardRef: HTMLElement,
      tableRef: HTMLElement,
      rotation: number,
      currentSprung: CardSprungTarget | undefined
    ) => CardSprungTarget;
    switch (player.playerNumber) {
      case 1:
        func = getPlayer1SpringForCardPlayed;
        break;
      case 2:
        func = getPlayer2SpringForCardPlayed;

        break;
      case 3:
        func = getPlayer3SpringForCardPlayed;
        break;
      default:
        func = getPlayer4SpringForCardPlayed;
    }

    const newVal = func(cardRef, tableRef, rotation, currentValue?.sprungValue);
    newVal.rotateX = 0;
    newVal.rotateY = 0;
    newVal.opacity = 1;

    retval.push({
      cardIndex: cardIndex,
      sprungValue: newVal
    });

    retval.push(...groupHand(player, availableIndices, cardRef, currentValues));
    return retval;
  };

  const groupHand = (
    player: EuchrePlayer | undefined,
    availableIndices: number[],
    cardRef: HTMLElement,
    currentState: CardSprungProps[]
  ) => {
    const retval: CardSprungProps[] = [];

    switch (player?.playerNumber) {
      case 1:
        retval.push(...groupPlayer1RemainingCards(availableIndices, cardRef, currentState));
        break;
      case 2:
        retval.push(...groupPlayer2RemainingCards(availableIndices, cardRef, currentState));
        break;
      case 3:
        retval.push(...groupPlayer3RemainingCards(availableIndices, cardRef, currentState));
        break;
      case 4:
        retval.push(...groupPlayer4RemainingCards(availableIndices, cardRef, currentState));
    }

    return retval;
  };

  const groupPlayer1RemainingCards = (
    availableIndices: number[],
    cardRef: HTMLElement,
    currentState: CardSprungProps[]
  ): CardSprungProps[] => {
    const retval: CardSprungProps[] = [];
    const values = getHandOffsetValues(availableIndices.length, cardRef);
    retval.push(
      ...availableIndices.map((value, index) => {
        const previousValue: CardSprungTarget | undefined = currentState.find(
          (s) => s.cardIndex === value
        )?.sprungValue;

        if (!previousValue) throw new Error();

        return {
          cardIndex: value,
          sprungValue: {
            ...previousValue,
            x: values.widthOffsetStart + values.widthOffset * index,
            y: -values.heightOffsetIndices[index] * values.heightOffset,
            rotate: values.rotationStart + values.rotationOffset * index,
            opacity: 1
          }
        };
      })
    );

    return retval;
  };

  const groupPlayer2RemainingCards = (
    availableIndices: number[],
    cardRef: HTMLElement,
    currentState: CardSprungProps[]
  ) => {
    const retval: CardSprungProps[] = [];
    const values = getHandOffsetValues(availableIndices.length, cardRef);

    retval.push(
      ...availableIndices.map((value, index) => {
        const previousValue: CardSprungTarget | undefined = currentState.find(
          (s) => s.cardIndex === value
        )?.sprungValue;

        if (!previousValue) throw new Error();

        return {
          cardIndex: value,
          sprungValue: {
            ...previousValue,
            x: values.widthOffsetStart + values.widthOffset * index,
            y: values.heightOffsetIndices[index] * values.heightOffset,
            opacity: 1,
            rotate: -(values.rotationStart + values.rotationOffset * index)
          }
        };
      })
    );
    return retval;
  };

  const groupPlayer3RemainingCards = (
    availableIndices: number[],
    cardRef: HTMLElement,
    currentState: CardSprungProps[]
  ) => {
    const retval: CardSprungProps[] = [];
    const values = getHandOffsetValues(availableIndices.length, cardRef);

    retval.push(
      ...availableIndices.map((value, index) => {
        const previousValue: CardSprungTarget | undefined = currentState.find(
          (s) => s.cardIndex === value
        )?.sprungValue;

        if (!previousValue) throw new Error();

        return {
          cardIndex: value,
          sprungValue: {
            ...previousValue,
            x: values.heightOffsetIndices[index] * values.heightOffset,
            y: values.widthOffsetStart + values.widthOffset * index,
            opacity: 1,
            rotate: values.rotationStart + values.rotationOffset * index
          }
        };
      })
    );
    return retval;
  };

  const groupPlayer4RemainingCards = (
    availableIndices: number[],
    cardRef: HTMLElement,
    currentState: CardSprungProps[]
  ) => {
    const retval: CardSprungProps[] = [];
    const values = getHandOffsetValues(availableIndices.length, cardRef);

    retval.push(
      ...availableIndices.map((value, index) => {
        const previousValue: CardSprungTarget | undefined = currentState.find(
          (s) => s.cardIndex === value
        )?.sprungValue;

        if (!previousValue) throw new Error();

        return {
          cardIndex: value,
          sprungValue: {
            ...previousValue,
            x: -values.heightOffsetIndices[index] * values.heightOffset,
            y: values.widthOffsetStart + values.widthOffset * index,
            opacity: 1,
            rotate: -(values.rotationStart + values.rotationOffset * index)
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

    return { ...DEFAULT_SPRUNG_VAL, opacity: 0, rotate: 0 };
  }, []);

  const getPlayerAnimateCardForStart = (
    player: EuchrePlayer | undefined,
    cardIndex: number,
    cardRef: HTMLElement
  ): CardSprungTarget => {
    switch (player?.playerNumber) {
      case 1:
        return getPlayer1AnimateStartForCard(cardIndex, cardRef);
      case 2:
        return getPlayer2AnimateStartForCard(cardIndex, cardRef);
      case 3:
        return getPlayer3AnimateStartForCard(cardIndex, cardRef);
      case 4:
        return getPlayer4AnimateStartForCard(cardIndex, cardRef);
    }

    return {
      ...DEFAULT_SPRUNG_VAL
    };
  };

  const getPlayer1StartForCard = (): CardSprungTarget => {
    return {
      x: 0,
      y: 75,
      opacity: 0.8,
      rotate: 0,
      rotateY: 180,
      rotateX: 0
    };
  };

  const getPlayer2StartForCard = (): CardSprungTarget => {
    return {
      x: 0,
      y: -75,
      opacity: 0.8,
      rotate: 0,
      rotateY: 180,
      rotateX: 0
    };
  };

  const getPlayer3StartForCard = (): CardSprungTarget => {
    return {
      x: -75,
      y: 0,
      opacity: 0.8,
      rotate: 0,
      rotateY: 0,
      rotateX: 180
    };
  };

  const getPlayer4StartForCard = (): CardSprungTarget => {
    return {
      x: 75,
      y: 0,
      opacity: 0.8,
      rotate: 0,
      rotateY: 0,
      rotateX: 180
    };
  };

  const getHandOffsetValues = (numberOfCards: number, cardRef: HTMLElement): CardOffsetValues => {
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
      ? -(numberOfCardsPerSide * CARD_WIDTH_OFFSET)
      : -(numberOfCardsPerSide * CARD_WIDTH_OFFSET - CARD_WIDTH_OFFSET / 2);
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
        heightIndices = [0, 1, 0];
        break;
      case 2:
        heightIndices = [0, 0];
        break;
      default:
        heightIndices = [0];
    }

    return {
      widthOffsetStart: widthStart,
      widthOffset: CARD_WIDTH_OFFSET,
      heightOffsetIndices: heightIndices,
      heightOffset: CARD_HEIGHT_OFFSET,
      rotationStart: rotationStart,
      rotationOffset: ROTATION_OFFSET
    };
  };

  const getPlayer1AnimateStartForCard = (cardOrder: number, cardRef: HTMLElement) => {
    const values = getHandOffsetValues(5, cardRef);

    return {
      ...DEFAULT_SPRUNG_VAL,
      x: values.widthOffsetStart + values.widthOffset * cardOrder,
      y: -values.heightOffsetIndices[cardOrder] * values.heightOffset,
      opacity: 1,
      rotate: values.rotationStart + values.rotationOffset * cardOrder
    };
  };

  const getPlayer2AnimateStartForCard = (cardOrder: number, cardRef: HTMLElement) => {
    const values = getHandOffsetValues(5, cardRef);

    return {
      ...DEFAULT_SPRUNG_VAL,
      x: values.widthOffsetStart + values.widthOffset * cardOrder,
      y: values.heightOffsetIndices[cardOrder],
      opacity: 1,
      rotate: -(values.rotationStart + values.rotationOffset * cardOrder)
    };
  };

  const getPlayer3AnimateStartForCard = (cardOrder: number, cardRef: HTMLElement) => {
    const values = getHandOffsetValues(5, cardRef);

    return {
      ...DEFAULT_SPRUNG_VAL,
      x: -values.heightOffsetIndices[cardOrder],
      y: values.widthOffsetStart + values.widthOffset * cardOrder,
      opacity: 1,
      rotate: values.rotationStart + values.rotationOffset * cardOrder
    };
  };

  const getPlayer4AnimateStartForCard = (cardOrder: number, cardRef: HTMLElement) => {
    const values = getHandOffsetValues(5, cardRef);

    return {
      ...DEFAULT_SPRUNG_VAL,
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
    currentSprung: CardSprungTarget | undefined
  ): CardSprungTarget => {
    const cardRect = cardRef.getBoundingClientRect();
    const tableRect = tableRef.getBoundingClientRect();
    const cardHeight = cardRect.bottom - cardRect.top;
    const currentX = parseInt((currentSprung?.x ?? 0).toString());
    const currentY = parseInt((currentSprung?.y ?? 0).toString());
    const orgLeft = cardRect.left - currentX;
    const orgRight = cardRect.right - currentX;
    const orgTop = cardRect.top - currentY;
    const cardCenter = orgLeft + (orgRight - orgLeft) / 2;
    const tableCenter = tableRect.left + (tableRect.right - tableRect.left) / 2;

    return {
      ...(currentSprung ?? DEFAULT_SPRUNG_VAL),
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
      ...(currentSprung ?? DEFAULT_SPRUNG_VAL),
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
      ...(currentSprung ?? DEFAULT_SPRUNG_VAL),
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
      ...(currentSprung ?? DEFAULT_SPRUNG_VAL),
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
      gameFlow.gameFlow === EuchreGameFlow.AWAIT_PLAY_CARD &&
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
    groupHand
  };
};

export default useCardTransform;
