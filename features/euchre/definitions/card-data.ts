import { CardValue } from './definitions';

const OFFSUIT_VALUES: Map<CardValue, number> = new Map([
  ['9', 10],
  ['10', 15],
  ['J', 20],
  ['Q', 25],
  ['K', 30],
  ['A', 90]
]);

const TRUMP_VALUES: Map<CardValue, number> = new Map([
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
  <defs>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="5" dy="5" stdDeviation="5" flood-color="rgba(0, 0, 0, 0.5)" />
    </filter>
  </defs>
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
// filter="url(#shadow)"
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

export type TextData = {
  x: number;
  y: number;
  fontsize: string;
  transform: string;
  style: string;
};

/** Map of svg values that should be used when rendering a card. Keyed on values where the first number is the column and second number is the row. */
const centerSvgVals = new Map<string, TextData>([
  ['s1-1', { x: 21, y: 42.2, fontsize: '34px', transform: '', style: '' }],
  ['s1-2', { x: 21, y: 71.2, fontsize: '34px', transform: '', style: '' }],
  ['s1-3', { x: 21, y: 84.2, fontsize: '34px', transform: '', style: '' }],
  ['s1-4', { x: -38, y: -82, fontsize: '34px', transform: 'scale(-1)', style: '' }],
  ['s1-5', { x: -38, y: -110, fontsize: '34px', transform: 'scale(-1)', style: '' }],
  ['s2-1', { x: 41, y: 42.2, fontsize: '34px', transform: '', style: '' }],
  ['s2-2', { x: 41, y: 59.2, fontsize: '34px', transform: '', style: '' }],
  ['s2-3', { x: 41, y: 86.7, fontsize: '34px', transform: '', style: '' }],
  ['s2-4', { x: -58, y: -93, fontsize: '34px', transform: 'scale(-1)', style: '' }],
  ['s2-5', { x: -58, y: -110, fontsize: '34px', transform: 'scale(-1)', style: '' }],
  ['s2-b', { x: 30, y: 95.5, fontsize: '48px', transform: '', style: '' }],
  ['s2-a', { x: 31, y: 99.5, fontsize: '72px', transform: '', style: '' }],
  ['s3-1', { x: 62, y: 42.2, fontsize: '34px', transform: '', style: '' }],
  ['s3-2', { x: 62, y: 71.2, fontsize: '34px', transform: '', style: '' }],
  ['s3-3', { x: 62, y: 84.2, fontsize: '34px', transform: '', style: '' }],
  ['s3-4', { x: -79, y: -82, fontsize: '34px', transform: 'scale(-1)', style: '' }],
  ['s3-5', { x: -79, y: -110, fontsize: '34px', transform: 'scale(-1)', style: '' }]
]);

const sideSvgVals = new Map<string, TextData>([
  [
    's1-1',
    {
      x: 21.1,
      y: -107.5,
      fontsize: '34px',
      transform: 'rotate(90)',
      style: ''
    }
  ],
  [
    's1-2',
    {
      x: 21.1,
      y: -78.5,
      fontsize: '34px',
      transform: 'rotate(90)',
      style: ''
    }
  ],
  [
    's1-3',
    {
      x: 21.1,
      y: -65.5,
      fontsize: '34px',
      transform: 'rotate(90)',
      style: ''
    }
  ],
  [
    's1-4',
    {
      x: -38.1,
      y: 67.8,
      fontsize: '34px',
      transform: 'rotate(-90)',
      style: 'display:inline'
    }
  ],
  [
    's1-5',
    {
      x: -38.1,
      y: 39.8,
      fontsize: '34px',
      transform: 'rotate(-90)',
      style: ''
    }
  ],
  [
    's2-1',
    {
      x: 41.1,
      y: -107.5,
      fontsize: '34px',
      transform: 'rotate(90)',
      style: ''
    }
  ],
  [
    's2-2',
    {
      x: 41.1,
      y: -90.5,
      fontsize: '34px',
      transform: 'rotate(90)',
      style: ''
    }
  ],
  [
    's2-3',
    {
      x: 41.1,
      y: -63,
      fontsize: '34px',
      transform: 'rotate(90)',
      style: ''
    }
  ],
  [
    's2-4',
    {
      x: -58.1,
      y: 56.8,
      fontsize: '34px',
      transform: 'rotate(-90)',
      style: ''
    }
  ],
  [
    's2-5',
    {
      x: -58.1,
      y: 39.8,
      fontsize: '34px',
      transform: 'rotate(-90)',
      style: ''
    }
  ],
  [
    's2-a',
    {
      x: 29.9,
      y: -50.2,
      fontsize: '72px',
      transform: 'rotate(90)',
      style: ''
    }
  ],
  [
    's2-b',
    {
      x: 32.9,
      y: -52.2,
      fontsize: '48px',
      transform: 'rotate(90)',
      style: ''
    }
  ],
  [
    's3-1',
    {
      x: 61.1,
      y: -107.5,
      fontsize: '34px',
      transform: 'rotate(90)',
      style: ''
    }
  ],
  [
    's3-2',
    {
      x: 61.1,
      y: -78.5,
      fontsize: '34px',
      transform: 'rotate(90)',
      style: ''
    }
  ],
  [
    's3-3',
    {
      x: 61.1,
      y: -65.5,
      fontsize: '34px',
      transform: 'rotate(90)',
      style: ''
    }
  ],
  [
    's3-4',
    {
      x: -78.1,
      y: 67.8,
      fontsize: '34px',
      transform: 'rotate(-90)',
      style: ''
    }
  ],
  [
    's3-5',
    {
      x: -78.1,
      y: 39.8,
      fontsize: '34px',
      transform: 'rotate(-90)',
      style: ''
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
  ['J', ['s2-b', 's1-1', 's3-5']],
  ['Q', ['s2-b', 's1-1', 's3-5']],
  ['K', ['s2-b', 's1-1', 's3-5']],
  ['A', ['s2-a']]
]);

const svgCenterCardValues: Map<string, TextData> = new Map([
  [
    's-b',
    {
      x: -96,
      y: -108,
      fontsize: '24px',
      transform: 'scale(-1)',
      style: ''
    }
  ],
  ['s-t', { x: 5, y: 44, fontsize: '24px', transform: '', style: 'display:inline' }],
  [
    'v-b',
    {
      x: -110,
      y: -112,
      fontsize: '20px',
      transform: 'scale(-0.865,-1.155)',
      style: 'display:inline;stroke-width:0.86509'
    }
  ],
  [
    'v-t',
    {
      x: 5,
      y: 20,
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
      x: -96,
      y: 45,
      fontsize: '24px',
      transform: 'rotate(-90)',
      style: 'display:inline'
    }
  ],
  [
    's-t',
    {
      x: 4.5,
      y: -105,
      fontsize: '24px',
      transform: 'rotate(90)',
      style: 'display:inline'
    }
  ],
  [
    'v-b',
    {
      x: -109.7,
      y: 19.3,
      fontsize: '20px',
      transform: 'matrix(0,-0.86540032,1.1555346,0,0,0)',
      style: 'display:inline;stroke-width:0.86469'
    }
  ],
  [
    'v-t',
    {
      x: 5.5,
      y: -110.3,
      fontsize: '20px',
      transform: 'matrix(0,0.86540032,-1.1555346,0,0,0)',
      style: 'display:inline;stroke-width:0.86469'
    }
  ]
]);

const svgCardColors = new Map<string, string>([
  ['R', '#DC4542'],
  ['B', '#000']
]);

export {
  OFFSUIT_VALUES,
  TRUMP_VALUES,
  baseCard,
  baseCardSide,
  cardSvgValues,
  svgSideCardValues,
  svgCenterCardValues,
  centerSvgVals,
  sideSvgVals,
  svgCardColors,
  getBaseCardSideColor,
  getBaseCardColor
};
