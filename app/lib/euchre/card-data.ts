import { Card, CardValue, Suit } from './definitions';
import { createPlaceholderCards } from './game';

const offsuitValues: Map<CardValue, number> = new Map([
  ['9', 10],
  ['10', 15],
  ['J', 20],
  ['Q', 25],
  ['K', 30],
  ['A', 90]
]);

const trumpValues: Map<CardValue, number> = new Map([
  ['9', 100],
  ['10', 110],
  ['Q', 120],
  ['K', 130],
  ['A', 150],
  ['J', 300]
]);

const baseCard: string = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg
   width="100"
   height="150"
   version="1.1"
   id="svg4"
   xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
   xmlns="http://www.w3.org/2000/svg"
   xmlns:svg="http://www.w3.org/2000/svg">
  <defs
     id="defs4" />
    `;

const getBaseCardColor = (color: string, opacity: number): string => {
  return `<rect
      width="97.771812"
      height="147.51994"
      rx="7"
      fill="${color}"
      fill-opacity="${opacity}"
      stroke="#000000"
      stroke-width="1.96118"
      id="rect1"
      x="1.2400337"
      y="1.3659784" />`;
};

const baseCardSide: string = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg
   width="150"
   height="100"
   version="1.1"
   id="svg4"
   xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
   xmlns="http://www.w3.org/2000/svg"
   xmlns:svg="http://www.w3.org/2000/svg">
  <defs
     id="defs4" />`;

const getBaseCardSideColor = (color: string, opacity: number): string => {
  return `<rect
     width="97.771812"
     height="147.51994"
     rx="7"
     fill="${color}"
     fill-opacity="${opacity}"
     stroke="#000000"
     stroke-width="1.96118"
     id="rect1"
     x="1.3030159"
     y="-148.4451"
     transform="rotate(90)" />`;
};

type TextData = {
  x: number;
  y: number;
  fontsize: string;
  transform: string;
  style: string;
};

/** Map of svg values that should be used when rendering a card. Keyed on values where the first number is the column and second number is the row. */
const centerSvgVals = new Map<string, TextData>([
  ['s1-1', { x: 21.09375, y: 42.234375, fontsize: '32px', transform: '', style: 'display:inline' }],
  ['s1-2', { x: 21.09375, y: 71.234375, fontsize: '32px', transform: '', style: 'display:inline' }],
  ['s1-3', { x: 21.09375, y: 84.234375, fontsize: '32px', transform: '', style: 'display:inline' }],
  ['s1-4', { x: -38.09375, y: -82, fontsize: '32px', transform: 'scale(-1)', style: 'display:inline' }],
  ['s1-5', { x: -38.09375, y: -110, fontsize: '32px', transform: 'scale(-1)', style: 'display:inline' }],
  ['s2-1', { x: 43.09375, y: 42.234375, fontsize: '32px', transform: '', style: 'display:inline' }],
  ['s2-2', { x: 43.09375, y: 59.234375, fontsize: '32px', transform: '', style: 'display:inline' }],
  ['s2-3', { x: 43.118938, y: 86.798607, fontsize: '32px', transform: '', style: 'display:inline' }],
  ['s2-4', { x: -60.09375, y: -93, fontsize: '32px', transform: 'scale(-1)', style: 'display:inline' }],
  ['s2-5', { x: -60.09375, y: -110, fontsize: '32px', transform: 'scale(-1)', style: 'display:inline' }],
  ['s2-b', { x: 30.931087, y: 99.539062, fontsize: '72px', transform: '', style: 'display:inline' }],
  ['s3-1', { x: 65.09375, y: 42.234375, fontsize: '32px', transform: '', style: 'display:inline' }],
  ['s3-2', { x: 65.09375, y: 71.234375, fontsize: '32px', transform: '', style: 'display:inline' }],
  ['s3-3', { x: 65.09375, y: 84.234375, fontsize: '32px', transform: '', style: 'display:inline' }],
  ['s3-4', { x: -82.09375, y: -82, fontsize: '32px', transform: 'scale(-1)', style: 'display:inline' }],
  ['s3-5', { x: -82.09375, y: -110, fontsize: '32px', transform: 'scale(-1)', style: 'display:inline' }]
]);

const sideSvgVals = new Map<string, TextData>([
  [
    's1-1',
    {
      x: 21.156734,
      y: -107.57671,
      fontsize: '32px',
      transform: 'rotate(90)',
      style: 'display:inline'
    }
  ],
  [
    's1-2',
    {
      x: 21.156734,
      y: -78.576706,
      fontsize: '32px',
      transform: 'rotate(90)',
      style: 'display:inline'
    }
  ],
  [
    's1-3',
    {
      x: 21.156734,
      y: -65.576706,
      fontsize: '32px',
      transform: 'rotate(90)',
      style: 'display:inline'
    }
  ],
  [
    's1-4',
    {
      x: -38.156734,
      y: 67.811081,
      fontsize: '32px',
      transform: 'rotate(-90)',
      style: 'display:inline'
    }
  ],
  [
    's1-5',
    {
      x: -38.156734,
      y: 39.811085,
      fontsize: '32px',
      transform: 'rotate(-90)',
      style: 'display:inline'
    }
  ],
  [
    's2-1',
    {
      x: 43.156731,
      y: -107.57671,
      fontsize: '32px',
      transform: 'rotate(90)',
      style: 'display:inline'
    }
  ],
  [
    's2-2',
    {
      x: 43.156731,
      y: -90.576714,
      fontsize: '32px',
      transform: 'rotate(90)',
      style: 'display:inline'
    }
  ],
  [
    's2-3',
    {
      x: 43.181923,
      y: -63.012474,
      fontsize: '32px',
      transform: 'rotate(90)',
      style: 'display:inline'
    }
  ],
  [
    's2-4',
    {
      x: -60.156731,
      y: 56.811081,
      fontsize: '32px',
      transform: 'rotate(-90)',
      style: 'display:inline'
    }
  ],
  [
    's2-5',
    {
      x: -60.156731,
      y: 39.811085,
      fontsize: '32px',
      transform: 'rotate(-90)',
      style: 'display:inline'
    }
  ],
  [
    's2-b',
    {
      x: 35.994072,
      y: -50.272022,
      fontsize: '72px',
      transform: 'rotate(90)',
      style: 'display:inline'
    }
  ],
  [
    's3-1',
    {
      x: 65.156731,
      y: -107.57671,
      fontsize: '32px',
      transform: 'rotate(90)',
      style: 'display:inline'
    }
  ],
  [
    's3-2',
    {
      x: 65.156731,
      y: -78.576706,
      fontsize: '32px',
      transform: 'rotate(90)',
      style: 'display:inline'
    }
  ],
  [
    's3-3',
    {
      x: 65.156731,
      y: -65.576706,
      fontsize: '32px',
      transform: 'rotate(90)',
      style: 'display:inline'
    }
  ],
  [
    's3-4',
    {
      x: -82.156731,
      y: 67.811081,
      fontsize: '32px',
      transform: 'rotate(-90)',
      style: 'display:inline'
    }
  ],
  [
    's3-5',
    {
      x: -82.156731,
      y: 39.811085,
      fontsize: '32px',
      transform: 'rotate(-90)',
      style: 'display:inline'
    }
  ]
]);

/** Map of locations which should be displayed on a card. Keyed on card value. */
const cardSvgValues: Map<CardValue, string[]> = new Map([
  ['2', ['s2-1', 's2-5']],
  ['3', ['s2-1', 's2-5', 's2-3']],
  ['4', ['s1-1', 's3-1', 's1-5', 's3-5']],
  ['5', ['s1-1', 's3-1', 's1-5', 's3-5', 's2-3']],
  ['6', ['s1-1', 's3-1', 's1-5', 's3-5', 's1-3', 's3-3']],
  ['7', ['s1-1', 's3-1', 's1-5', 's3-5', 's1-3', 's3-3', 's2-2']],
  ['8', ['s1-1', 's3-1', 's1-5', 's3-5', 's1-3', 's3-3', 's2-2', 's2-4']],
  ['9', ['s1-1', 's3-1', 's1-2', 's3-2', 's1-4', 's1-5', 's2-3', 's3-4', 's3-5']],
  ['10', ['s1-1', 's3-1', 's1-2', 's3-2', 's1-4', 's1-5', 's2-2', 's3-4', 's3-5', 's2-4']],
  ['J', ['s2-b']],
  ['Q', ['s2-b']],
  ['K', ['s2-b']],
  ['A', ['s2-b']]
]);

const svgCenterCardValues: Map<string, TextData> = new Map([
  [
    's-b',
    {
      x: -95,
      y: -116,
      fontsize: '18px',
      transform: 'scale(-1)',
      style: 'display:inline'
    }
  ],
  ['s-t', { x: 5, y: 33.939663, fontsize: '18px', transform: '', style: 'display:inline' }],
  [
    'v-b',
    {
      x: -109.70619,
      y: -112.38538,
      fontsize: '20px',
      transform: 'scale(-0.865,-1.155)',
      style: 'display:inline;stroke-width:0.86509'
    }
  ],
  [
    'v-t',
    {
      x: 5.433156,
      y: 18.29949,
      fontsize: '20px',
      transform: 'scale(0.865,1.155)',
      style: 'display:inline;stroke-width:0.86509'
    }
  ]
]);

const svgSideCardValues: Map<string, TextData> = new Map([
  [
    's-b',
    {
      x: -93.524651,
      y: 31.100758,
      fontsize: '14px',
      transform: 'rotate(-90)',
      style: 'display:inline'
    }
  ],
  [
    's-t',
    {
      x: 6.3657999,
      y: -115.87142,
      fontsize: '14px',
      transform: 'rotate(90)',
      style: 'display:inline'
    }
  ],
  [
    'v-b',
    {
      x: -109.72823,
      y: 17.313169,
      fontsize: '19.9907px',
      transform: 'matrix(0,-0.86540032,1.1555346,0,0,0)',
      style: 'display:inline;stroke-width:0.86469'
    }
  ],
  [
    'v-t',
    {
      x: 5.5034223,
      y: -111.35554,
      fontsize: '19.9907px',
      transform: 'matrix(0,0.86540032,-1.1555346,0,0,0)',
      style: 'display:inline;stroke-width:0.86469'
    }
  ]
]);

const svgCardColors = new Map<string, string>([
  ['R', '#EF4444'],
  ['B', '#000']
]);

/**
 * Get svg value to represent a game card.
 * @param card The card to render as an svg
 * @param location Orientation of the card by default. center = upright, side = rotated 90 deg.
 * @param addOpaqueOverlay Adds an opaque overlay to the card. Used to indicate that the card is not available.
 * @param color Default card color.
 * @param opacity Default card opacity.
 * @returns
 */
function getCardSvg(
  card: Card,
  location: 'center' | 'side',
  addOpaqueOverlay?: boolean,
  color?: string,
  opacity?: number
): string {
  let retval = location === 'center' ? baseCard : baseCardSide;

  const cardColor = color ?? '#ffffff';
  const cardOpacity = opacity ?? 1;
  const addCardOverlay = addOpaqueOverlay ?? false;

  const textValues = [];
  const imageKeys: string[] = cardSvgValues.get(card.value) ?? [];
  const imageColor: string = svgCardColors.get(card.color) ?? '#000';
  const cardValues = location === 'center' ? svgCenterCardValues : svgSideCardValues;
  const baseCardRect =
    location === 'center'
      ? getBaseCardColor(cardColor, cardOpacity)
      : getBaseCardSideColor(cardColor, cardOpacity);
  const overlayColor: string = '#333333';
  let baseCardOverlayRect = '';

  if (addCardOverlay)
    baseCardOverlayRect =
      location === 'center' ? getBaseCardColor(overlayColor, 0.4) : getBaseCardSideColor(overlayColor, 0.5);

  for (const text of imageKeys) {
    const imageLocation = location === 'center' ? centerSvgVals.get(text) : sideSvgVals.get(text);

    if (imageLocation) {
      const xml = getCardText(imageLocation, imageColor, card.suit);
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
}

/** */
function getEncodedCardSvg(
  card: Card,
  location: 'center' | 'side',
  addOpaqueOverlay?: boolean,
  color?: string,
  opacity?: number
) {
  const cardSvg = getCardSvg(card, location, addOpaqueOverlay, color, opacity);
  const dynamicSvg = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cardSvg)}`;

  return dynamicSvg;
}

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
            font-family="Arial"
            font-size="${text.fontsize}"
            fill="${color}"
            id="${text}"
            transform="${text.transform}"
            style="${text.style}">${displayValue}</text>
         `;
}

function getCardClassColorFromSuit(suit: Suit) {
  return suit === '♠' || suit === '♣' ? 'text-black' : 'text-red-900';
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

  return '';
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

function getCardFullName(card: Card): string {
  return `${getCardValueName(card.value)} of ${getSuitName(card.suit)}s`;
}

function orderPlayerHand(cards: Card[]): Card[] {
  switch (cards.length) {
    case 5:
      return cards.map((c) => {
        return c;
      });
    case 4:
      return [...cards, ...createPlaceholderCards(1)].slice(0, 5).map((c) => {
        return c;
      });
    case 3:
      return [...createPlaceholderCards(1), ...cards, ...createPlaceholderCards(1)].slice(0, 5).map((c) => {
        return c;
      });
    case 2:
      return [...createPlaceholderCards(1), ...cards, ...createPlaceholderCards(2)].slice(0, 5).map((c) => {
        return c;
      });
    case 1:
      return [...createPlaceholderCards(2), ...cards, ...createPlaceholderCards(2)].slice(0, 5).map((c) => {
        return c;
      });
  }

  return createPlaceholderCards(5).map((c) => {
    return c;
  });
}

export {
  getEncodedCardSvg,
  getCardClassColorFromSuit,
  getSuitName,
  getCardFullName,
  orderPlayerHand,
  offsuitValues,
  trumpValues
};
