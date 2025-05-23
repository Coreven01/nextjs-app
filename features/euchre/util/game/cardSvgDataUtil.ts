import {
  baseCard,
  baseCardSide,
  cardSvgValues,
  centerSvgVals,
  getBaseCardColor,
  getBaseCardSideColor,
  sideSvgVals,
  svgCardColors,
  svgCenterCardValues,
  svgSideCardValues,
  TextData
} from '@/features/euchre/definitions/card-data';
import { getCardColor } from './cardDataUtil';
import { Card, TableLocation, Suit, CardValue } from '../../definitions/definitions';

/**
 * Get svg value to represent a game card.
 * @param card The card to render as an svg
 * @param location Orientation of the card by default. center = upright, side = rotated 90 deg.
 * @param addOpaqueOverlay Adds an opaque overlay to the card. Used to indicate that the card is not available.
 * @param color Default card color.
 * @param opacity Default card opacity.
 * @returns
 */
const getCardSvg = (
  card: Card,
  location: TableLocation,
  addOpaqueOverlay?: boolean,
  color?: string,
  opacity?: number
): string => {
  const centerLocation = location === 'top' || location === 'bottom';

  let retval = centerLocation ? baseCard : baseCardSide;

  const cardColor = color ?? '#ffffff';
  const cardOpacity = opacity ?? 1;
  const addCardOverlay = addOpaqueOverlay ?? false;

  const textValues = [];
  const imageKeys: string[] = cardSvgValues.get(card.value) ?? [];
  const imageColor: string = svgCardColors.get(getCardColor(card.suit)) ?? '#000';
  const cardValues = centerLocation ? svgCenterCardValues : svgSideCardValues;
  const baseCardRect = centerLocation
    ? getBaseCardColor(cardColor, cardOpacity)
    : getBaseCardSideColor(cardColor, cardOpacity);
  const overlayColor: string = '#333333';
  let baseCardOverlayRect = '';

  if (addCardOverlay)
    baseCardOverlayRect = centerLocation
      ? getBaseCardColor(overlayColor, 0.5)
      : getBaseCardSideColor(overlayColor, 0.5);

  for (const text of imageKeys) {
    const imageLocation = centerLocation ? centerSvgVals.get(text) : sideSvgVals.get(text);

    if (imageLocation) {
      const xml = getCardText(imageLocation, imageColor, text === 's2-b' ? card.value : card.suit);
      textValues.push(xml);
    }
  }

  for (const imageLocation of cardValues) {
    if (imageLocation) {
      const xml = getCardText(
        imageLocation[1],
        imageColor,
        imageLocation[0].charAt(0) === 's' ? card.suit : card.value
      );
      textValues.push(xml);
    }
  }

  retval += baseCardRect;

  for (const val of textValues) retval += val;

  retval += baseCardOverlayRect + '</svg>';

  return retval;
};

/** */
const getEncodedCardSvg = (
  card: Card,
  location: TableLocation,
  addOpaqueOverlay?: boolean,
  color?: string,
  opacity?: number
) => {
  const cardSvg = getCardSvg(card, location, addOpaqueOverlay, color, opacity);
  const dynamicSvg = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cardSvg)}`;

  return dynamicSvg;
};

/** Get text element for svg for a card value.
 *
 * @param text
 * @param color
 * @param displayValue
 * @returns
 */
function getCardText(text: TextData, color: string, displayValue: string): string {
  return `
           <text
              x="${text.x}"
              y="${text.y}"
              font-family="Helvetica ,Arial, sans-serif"
              font-size="${text.fontsize}"
              fill="${color}"
              id="${text}"
              transform="${text.transform}"
              style="${text.style}">${displayValue}</text>
           `;
}

function getCardClassColorFromSuit(suit: Suit) {
  return suit === '♠' || suit === '♣' ? 'text-black' : 'text-red-600';
}

function getSuitName(suit: Suit): string {
  switch (suit) {
    case '♠':
      return 'Spade';
    case '♣':
      return 'Club';
    case '♦':
      return 'Diamond';
    case '♥':
      return 'Heart';
  }
}

function getCardValueName(value: CardValue): string {
  switch (value) {
    case '2':
      return 'Two';
    case '3':
      return 'Three';
    case '4':
      return 'Four';
    case '5':
      return 'Five';
    case '6':
      return 'Six';
    case '7':
      return 'Seven';
    case '8':
      return 'Eight';
    case '9':
      return 'Nine';
    case '10':
      return 'Ten';
    case 'J':
      return 'Jack';
    case 'Q':
      return 'Queen';
    case 'K':
      return 'King';
    case 'A':
      return 'Ace';
  }

  return '';
}

const getCardFullName = (card: Card): string => {
  const cardName = getCardValueName(card.value);
  return `${cardName ? cardName + ' of ' : ''}${getSuitName(card.suit)}s`;
};

export { getEncodedCardSvg, getCardFullName, getSuitName, getCardClassColorFromSuit };
