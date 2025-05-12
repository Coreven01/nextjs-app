import { v4 as uuidv4 } from 'uuid';
import { getCardFullName, getEncodedCardSvg } from './cardSvgDataUtil';
import { getRandomDamping, getRandomRotation, getRandomStiffness } from './cardTransformUtil';
import { CardSpringTarget, DEFAULT_SPRING_VAL } from '../definitions/transform-definitions';
import { CardState } from '../../../hooks/euchre/reducers/cardStateReducer';
import { Card, TableLocation } from '../definitions/definitions';

/** Create the intial card state values for beginning deal.
 *
 */
const createCardStatesFromGameDeck = (
  cards: Card[],
  location: TableLocation,
  includeCardValue: boolean,
  initSpringValue: CardSpringTarget
) => {
  const newCardStates: CardState[] = [];
  const initZIndex: number = DEFAULT_SPRING_VAL.zIndex ?? 30;

  for (const card of cards) {
    const cardState: CardState = {
      renderKey: uuidv4(),
      cardIndex: card.index,
      src: includeCardValue ? getEncodedCardSvg(card, location) : undefined,
      cardFullName: includeCardValue ? getCardFullName(card) : 'Player Card',
      initSpringValue: { ...initSpringValue, zIndex: initZIndex + card.index },
      xDamping: getRandomDamping(),
      xStiffness: getRandomStiffness(),
      yDamping: getRandomDamping(),
      yStiffness: getRandomStiffness(),
      rotation: getRandomRotation(),
      enabled: false,
      location: location
    };

    newCardStates.push(cardState);
  }

  return newCardStates;
};

export { createCardStatesFromGameDeck };
