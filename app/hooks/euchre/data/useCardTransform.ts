import { Target } from 'framer-motion';
import { EuchrePlayer } from '../../../lib/euchre/definitions';
import { RefObject } from 'react';
import { EuchreGameFlow, EuchreGameFlowState } from '../gameFlowReducer';

const useCardTransform = () => {
  const getRandomRotation = () => {
    const min = 170;
    const max = 190;
    const range = max - min;

    return Math.floor(Math.random() * range + min);
  };

  const getRandomStiffness = () => {
    const min = 290;
    const max = 310;
    const range = max - min;

    return Math.floor(Math.random() * range + min);
  };

  const getRandomDamping = () => {
    const min = 12;
    const max = 17;
    const range = max - min;

    return Math.floor(Math.random() * range + min);
  };

  const getSpringsForCardPlayed = (
    player: EuchrePlayer,
    cardRef: RefObject<HTMLDivElement>,
    tableRef: RefObject<HTMLDivElement> | undefined,
    rotation: number
  ): Target => {
    if (!tableRef?.current || !cardRef.current) {
      return {
        x: 0,
        y: 0,
        opacity: 1,
        rotate: rotation
      };
    }

    switch (player.playerNumber) {
      case 1:
        return getPlayer1SpringForCardPlayed(cardRef, tableRef, rotation);
      case 2:
        return getPlayer2SpringForCardPlayed(cardRef, tableRef, rotation);
      case 3:
        return getPlayer3SpringForCardPlayed(cardRef, tableRef, rotation);
      case 4:
        return getPlayer4SpringForCardPlayed(cardRef, tableRef, rotation);
    }
  };

  const getPlayerStartForCard = (player: EuchrePlayer | undefined): Target => {
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
      x: 0,
      y: 0,
      opacity: 0,
      rotate: 0
    };
  };

  const getPlayerAnimateCardForStart = (player: EuchrePlayer | undefined, index: number): Target => {
    switch (player?.playerNumber) {
      case 1:
        return getPlayer1AnimateStartForCard(index);
      case 2:
        return getPlayer2AnimateStartForCard(index);
      case 3:
        return getPlayer3AnimateStartForCard(index);
      case 4:
        return getPlayer4AnimateStartForCard(index);
    }

    return {
      x: 0,
      y: 0,
      opacity: 0,
      rotate: 0
    };
  };

  const getPlayer1StartForCard = () => {
    return {
      x: 0,
      y: 50,
      opacity: 0,
      rotate: 0
    };
  };

  const getPlayer2StartForCard = () => {
    return {
      x: 0,
      y: -50,
      opacity: 0,
      rotate: 0
    };
  };

  const getPlayer3StartForCard = () => {
    return {
      x: -50,
      y: 0,
      opacity: 0,
      rotate: 0
    };
  };

  const getPlayer4StartForCard = () => {
    return {
      x: 50,
      y: 0,
      opacity: 0.1,
      rotate: 0
    };
  };

  const getPlayer1AnimateStartForCard = (index: number) => {
    return {
      x: 0,
      y: 50,
      opacity: 0,
      rotate: 0
    };
  };

  const getPlayer2AnimateStartForCard = (index: number) => {
    return {
      x: 0,
      y: -50,
      opacity: 0,
      rotate: 0
    };
  };

  const getPlayer3AnimateStartForCard = (index: number) => {
    return {
      x: -50,
      y: 0,
      opacity: 0,
      rotate: 0
    };
  };

  const getPlayer4AnimateStartForCard = (index: number) => {
    return {
      x: 50,
      y: 0,
      opacity: 0.1,
      rotate: 0
    };
  };

  const getPlayer1SpringForCardPlayed = (
    cardRef: RefObject<HTMLDivElement>,
    tableRef: RefObject<HTMLDivElement>,
    rotation: number
  ): Target => {
    const cardTop = cardRef.current.getBoundingClientRect().top;
    const tableTop = tableRef.current.getBoundingClientRect().top;
    const cardCenter =
      cardRef.current.getBoundingClientRect().left +
      (cardRef.current.getBoundingClientRect().right - cardRef.current.getBoundingClientRect().left) / 2;

    const tableCenter =
      tableRef.current.getBoundingClientRect().left +
      (tableRef.current.getBoundingClientRect().right - tableRef.current.getBoundingClientRect().left) / 2;

    let xVal = 0;
    if (tableCenter > cardCenter) {
      xVal = tableCenter - cardCenter;
    } else {
      xVal = -(cardCenter - tableCenter);
    }
    return {
      x: xVal,
      y: -(cardTop - tableTop),
      opacity: 1,
      rotate: rotation
    };
  };

  const getPlayer2SpringForCardPlayed = (
    cardRef: RefObject<HTMLDivElement>,
    tableRef: RefObject<HTMLDivElement>,
    rotation: number
  ): Target => {
    const cardBottom = cardRef.current.getBoundingClientRect().bottom;
    const tableBottom = tableRef.current.getBoundingClientRect().bottom;
    const cardCenter =
      cardRef.current.getBoundingClientRect().left +
      (cardRef.current.getBoundingClientRect().right - cardRef.current.getBoundingClientRect().left) / 2;

    const tableCenter =
      tableRef.current.getBoundingClientRect().left +
      (tableRef.current.getBoundingClientRect().right - tableRef.current.getBoundingClientRect().left) / 2;

    let xVal = 0;
    if (tableCenter > cardCenter) {
      xVal = tableCenter - cardCenter;
    } else {
      xVal = -(cardCenter - tableCenter);
    }

    return {
      x: xVal,
      y: tableBottom - cardBottom,
      opacity: 1,
      rotate: rotation
    };
  };
  const getPlayer3SpringForCardPlayed = (
    cardRef: RefObject<HTMLDivElement>,
    tableRef: RefObject<HTMLDivElement>,
    rotation: number
  ): Target => {
    const cardRight = cardRef.current.getBoundingClientRect().right;
    const tableRight = tableRef.current.getBoundingClientRect().right;
    const cardCenter =
      cardRef.current.getBoundingClientRect().top +
      (cardRef.current.getBoundingClientRect().bottom - cardRef.current.getBoundingClientRect().top) / 2;

    const tableCenter =
      tableRef.current.getBoundingClientRect().top +
      (tableRef.current.getBoundingClientRect().bottom - tableRef.current.getBoundingClientRect().top) / 2;

    let yVal = 0;
    if (tableCenter > cardCenter) {
      yVal = tableCenter - cardCenter;
    } else {
      yVal = -(cardCenter - tableCenter);
    }

    return {
      x: tableRight - cardRight,
      y: yVal,
      opacity: 1,
      rotate: rotation
    };
  };
  const getPlayer4SpringForCardPlayed = (
    cardRef: RefObject<HTMLDivElement>,
    tableRef: RefObject<HTMLDivElement>,
    rotation: number
  ): Target => {
    const cardLeft = cardRef.current.getBoundingClientRect().left;
    const tableLeft = tableRef.current.getBoundingClientRect().left;
    const cardCenter =
      cardRef.current.getBoundingClientRect().top +
      (cardRef.current.getBoundingClientRect().bottom - cardRef.current.getBoundingClientRect().top) / 2;

    const tableCenter =
      tableRef.current.getBoundingClientRect().top +
      (tableRef.current.getBoundingClientRect().bottom - tableRef.current.getBoundingClientRect().top) / 2;

    let yVal = 0;
    if (tableCenter > cardCenter) {
      yVal = tableCenter - cardCenter;
    } else {
      yVal = -(cardCenter - tableCenter);
    }

    return {
      x: -(cardLeft - tableLeft),
      y: yVal,
      opacity: 1,
      rotate: rotation
    };
  };

  const getCardCssForPlayerLocation = (
    gameFlow: EuchreGameFlowState,
    player: EuchrePlayer,
    index: number,
    isAvailable: boolean
  ): string => {
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
        retval = `${baseClasses} rotate-[${initDeg + rotateVal * index}deg]
        translate-x-[${offsetStart - offset * index}px] translate-y-[${[0, 4].includes(index) ? 25 : [1, 3].includes(index) ? 15 : 10}px]`;
        break;
      case 2:
        retval = `${baseClasses} rotate-[${-initDeg - rotateVal * index}deg]
      translate-x-[${offsetStart - offset * index}px] translate-y-[${[1, 3].includes(index) ? 10 : index === 2 ? 15 : 0}px] `;
        break;
      case 3:
        retval = `${baseClasses} rotate-[${initDeg + rotateVal * index}deg]
      translate-y-[${offsetStart - offset * index}px] translate-x-[${[1, 3].includes(index) ? 10 : index === 2 ? 15 : 0}px]`;
        break;
      case 4:
        retval = `${baseClasses} transition rotate-[${-initDeg + -rotateVal * index}deg]
      translate-y-[${offsetStart - offset * index}px] translate-x-[${[1, 3].includes(index) ? -10 : index === 2 ? -15 : 0}px]`;
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
    getPlayerStartForCard,
    getPlayerAnimateCardForStart
  };
};

export default useCardTransform;
