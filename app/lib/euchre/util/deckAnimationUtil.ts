import { RefObject } from 'react';
import { CardState } from '../../../hooks/euchre/reducers/cardStateReducer';
import {
  getDestinationOffset,
  getElementOffsetForLocation,
  getElementOriginalPosition,
  getSpringMoveElement,
  getSpringsForDealForDealer,
  getSpringsForDealForRegularPlay,
  getSpringsToMoveToPlayer,
  getTransitionForCardMoved
} from './cardTransformUtil';
import { GameSpeed, TableLocation } from '../definitions/definitions';
import { v4 as uuidv4 } from 'uuid';
import { EuchreGameFlow } from '../../../hooks/euchre/reducers/gameFlowReducer';
import { CardSpringProps } from '../definitions/transform-definitions';
import { EuchreGameInstance, EuchrePlayer, EuchreSettings } from '../definitions/game-state-definitions';
import { getPlayerRotation } from './playerDataUtil';
import { getCardFullName, getEncodedCardSvg } from './cardSvgDataUtil';
import { InitDealResult } from '../definitions/logic-definitions';

const getCardStatesMoveToPlayer = (
  cardState: CardState[],
  playerDeckRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>,
  deckCardRefs: Map<number, RefObject<HTMLDivElement | null>>,
  gameSpeed: GameSpeed
) => {
  const newCardState = [...cardState];
  for (const cardState of newCardState) {
    if (cardState.location) {
      const destRef = playerDeckRefs.get(cardState.location);
      const cardRef = deckCardRefs.get(cardState.cardIndex);
      const offsets = getDestinationOffset(cardState.location);

      if (destRef?.current && cardRef?.current) {
        const spring = getSpringMoveElement(
          cardRef.current,
          destRef.current,
          undefined,
          cardState.springValue
        );

        spring.x += offsets.x;
        spring.y += offsets.y;

        spring.transition = getTransitionForCardMoved(cardState, gameSpeed);
        cardState.springValue = spring;
        cardState.renderKey = uuidv4();
      }
    }
  }

  return newCardState;
};

const getCardStatesInitialDealForDealer = (
  destinationElement: HTMLElement,
  relativeCenterElement: HTMLElement,
  gameDeckElement: HTMLElement,
  gameSpeed: GameSpeed
) => {
  const duration = gameSpeed / 1000;
  const srcRect = getElementOriginalPosition(gameDeckElement);
  const destRect = getElementOriginalPosition(destinationElement);
  const relativeRect = getElementOriginalPosition(relativeCenterElement);

  const moveToElementSpring = getSpringMoveElement(gameDeckElement, destinationElement);
  const offsets = getElementOffsetForLocation(srcRect, destRect, relativeRect, 'out');

  // initial move from its absolute postion to the dealer's player location.
  const initMoveToDealer = {
    ...moveToElementSpring,
    opacity: 0,
    x: moveToElementSpring.x + offsets.x,
    y: moveToElementSpring.y + offsets.y,
    transition: { opacity: { duration: 0 }, x: { duration: 0 }, y: { duration: 0 } }
  };

  // slide the cards into view after moving the deck.
  const moveIntoView = {
    ...initMoveToDealer,
    opacity: 1,
    x: initMoveToDealer.x - offsets.x,
    y: initMoveToDealer.y - offsets.y,
    transition: { opacity: { duration: duration }, x: { duration: duration }, y: { duration: duration } }
  };

  return { initMoveToDealer, moveIntoView };
};

const getCardStatesDealForDealer = (
  cardState: CardState[],
  game: EuchreGameInstance,
  settings: EuchreSettings,
  directCenterH: HTMLElement,
  directCenterV: HTMLElement,
  outerTableRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>,
  deckCardRefs: Map<number, RefObject<HTMLDivElement | null>>,
  initDealResult: InitDealResult
) => {
  const rotation: EuchrePlayer[] = getPlayerRotation(game.gamePlayers, game.dealer);
  const duration: number = settings.gameSpeed / 1000;
  const delayBetweenDeal: number = duration / 3;
  const newState = [...cardState];
  const springsForDeal: CardSpringProps[] = getSpringsForDealForDealer(
    outerTableRefs,
    deckCardRefs,
    directCenterH,
    directCenterV,
    rotation,
    game.deck,
    initDealResult
  );

  for (const updatedSpring of springsForDeal) {
    const cardState = newState.at(updatedSpring.cardIndex);
    const card = game.deck.at(updatedSpring.cardIndex);

    if (cardState?.location && card) {
      updatedSpring.springValue.transition = getTransitionForCardMoved(
        cardState,
        settings.gameSpeed,
        delayBetweenDeal * cardState.cardIndex
      );
      cardState.runEffectForState = EuchreGameFlow.BEGIN_DEAL_FOR_DEALER;
      cardState.springValue = updatedSpring.springValue;
      cardState.src = getEncodedCardSvg(card, cardState.location);
      cardState.cardFullName = getCardFullName(card);
      cardState.renderKey = uuidv4();
    }
  }

  return newState;
};

const getCardsStatesRegularDeal = (
  cardState: CardState[],
  game: EuchreGameInstance,
  settings: EuchreSettings,
  directCenterH: HTMLElement,
  directCenterV: HTMLElement,
  outerTableRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>,
  deckCardRefs: Map<number, RefObject<HTMLDivElement | null>>
) => {
  const rotation: EuchrePlayer[] = getPlayerRotation(game.gamePlayers, game.dealer);
  const duration: number = settings.gameSpeed / 1000;
  const delayBetweenDeal: number = duration / 5;
  const newState = [...cardState];
  const springsForDeal: CardSpringProps[] = getSpringsForDealForRegularPlay(
    outerTableRefs,
    deckCardRefs,
    directCenterH,
    directCenterV,
    rotation,
    game.cardDealCount,
    game.deck,
    game.dealer.location,
    game.trump
  );

  for (const cardState of newState) {
    const spring = springsForDeal.at(cardState.cardIndex);
    const card = game.deck.at(cardState.cardIndex);
    const cardIsTrump = cardState.cardIndex === game.trump.index;
    if (spring && card) {
      spring.springValue.transition = getTransitionForCardMoved(
        cardState,
        settings.gameSpeed,
        delayBetweenDeal * cardState.cardIndex
      );
      cardState.runEffectForState = EuchreGameFlow.BEGIN_DEAL_CARDS;
      cardState.springValue = spring.springValue;
      cardState.location = spring.location;
      cardState.renderKey = uuidv4();
    } else if (!cardIsTrump) {
      cardState.location = game.dealer.location;
    }
  }

  return newState;
};

/** Move all cards to the destination player after all cards have been dealt */
const getCardStatesMoveAllCardsToPlayer = (
  cardState: CardState[],
  destinationLocation: TableLocation,
  destinationElement: HTMLElement,
  deckCardRefs: Map<number, RefObject<HTMLDivElement | null>>,
  gameSpeed: GameSpeed
) => {
  const newState = [...cardState];

  const springsToMove = getSpringsToMoveToPlayer(
    deckCardRefs,
    destinationElement,
    destinationLocation,
    newState,
    true,
    gameSpeed
  );

  for (const cardState of newState) {
    const spring = springsToMove.at(cardState.cardIndex);

    if (spring) {
      cardState.runEffectForState = EuchreGameFlow.END_DEAL_FOR_DEALER;
      cardState.springValue = spring.springValue;
    }

    cardState.renderKey = uuidv4();
    cardState.location = destinationLocation;
  }

  return newState;
};

export {
  getCardStatesMoveToPlayer,
  getCardStatesInitialDealForDealer,
  getCardStatesDealForDealer,
  getCardsStatesRegularDeal,
  getCardStatesMoveAllCardsToPlayer
};
