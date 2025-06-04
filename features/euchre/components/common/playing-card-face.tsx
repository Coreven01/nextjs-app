import React, { memo } from 'react';
import { CardValue, Suit } from '../../definitions/definitions';
import { getCardColor, getDisplayHeight, getDisplayWidth } from '../../util/game/cardDataUtil';

const svgCardColors = new Map<string, string>([
  ['R', '#DC4542'],
  ['B', '#000']
]);

export type CardRenderData = {
  x: number;
  y: number;
  reverse?: boolean;
};

/** Map of svg values that should be used when rendering a card. Keyed on values where the first number is the column and second number is the row. */
const centerSvgVals = new Map<string, CardRenderData>([
  ['s1-1', { x: 35, y: 30 }],
  ['s1-2', { x: 35, y: 60 }],
  ['s1-3', { x: 35, y: 76 }],
  ['s1-4', { x: 35, y: 90, reverse: true }],
  ['s1-5', { x: 35, y: 120, reverse: true }],

  ['s2-1', { x: 55, y: 35 }],
  ['s2-2', { x: 55, y: 46 }],
  ['s2-3', { x: 55, y: 52 }],
  ['s2-4', { x: 55, y: 76 }],
  ['s2-5', { x: 55, y: 98, reverse: true }],
  ['s2-6', { x: 55, y: 105, reverse: true }],
  ['s2-7', { x: 55, y: 115, reverse: true }],
  ['s2-b', { x: 55, y: 80 }],
  ['s2-a', { x: 55, y: 80 }],

  ['s3-1', { x: 74, y: 30 }],
  ['s3-2', { x: 75, y: 60 }],
  ['s3-3', { x: 74, y: 76 }],
  ['s3-4', { x: 74, y: 90, reverse: true }],
  ['s3-5', { x: 74, y: 120, reverse: true }]
]);

/** Map of locations which should be displayed on a card. Keyed on card value. */
const cardSvgValues: Map<CardValue, string[]> = new Map([
  ['2', ['s2-1', 's2-7']],
  ['3', ['s2-1', 's2-7', 's2-4']],
  ['4', ['s1-1', 's3-1', 's1-5', 's3-5']],
  ['5', ['s1-1', 's3-1', 's1-5', 's3-5', 's2-4']],
  ['6', ['s1-1', 's3-1', 's1-5', 's3-5', 's1-3', 's3-3']],
  ['7', ['s1-1', 's3-1', 's1-5', 's3-5', 's1-3', 's3-3', 's2-3']],
  ['8', ['s1-1', 's3-1', 's1-5', 's3-5', 's1-3', 's3-3', 's2-3', 's2-5']],
  ['9', ['s1-1', 's3-1', 's1-2', 's3-2', 's1-4', 's1-5', 's2-4', 's3-4', 's3-5']],
  ['10', ['s1-1', 's3-1', 's1-2', 's3-2', 's1-4', 's1-5', 's2-2', 's3-4', 's3-5', 's2-6']],
  ['J', ['s2-b', 's1-1', 's3-5']],
  ['Q', ['s2-b', 's1-1', 's3-5']],
  ['K', ['s2-b', 's1-1', 's3-5']],
  ['A', ['s2-a']]
]);

interface Props extends React.HtmlHTMLAttributes<SVGElement> {
  suit: Suit;
  value: CardValue;
  addOverlay: boolean | undefined;
  rotate?: boolean;
}

const PlayingCardFace = memo(
  ({ suit, value, addOverlay, rotate, style, className, onClick }: Props) => {
    const width = getDisplayWidth('top');
    const height = getDisplayHeight('top');
    const cornerRankSize = 24;
    const cornerSuitSize = 22;
    const suitFontSize = 36;
    const faceFontSize = 42;
    const aceFontSize = 80;

    const isFaceCard = ['J', 'Q', 'K'].includes(value);
    const tenScale = 0.65;
    const faceScale = 0.75;

    let valueScale = value === '10' ? tenScale : 1;
    valueScale = ['Q', 'K', 'A'].includes(value) ? faceScale : valueScale;

    const imageKeys: string[] = cardSvgValues.get(value) ?? [];
    let imageColor: string = svgCardColors.get(getCardColor(suit)) ?? '#000';
    imageColor = addOverlay ? '#555' : imageColor;

    const renderWidth = rotate ? height : width;
    const renderHeight = rotate ? width : height;
    const rotationTransform = `translate(${height},${0}) rotate(90)`;

    return (
      <svg
        viewBox={`0 0 ${renderWidth} ${renderHeight}`}
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        style={style}
        onClick={onClick}
      >
        <g transform={rotate ? rotationTransform : ''}>
          {/* Card Background */}
          <rect
            x="1"
            y="1"
            width={width - 2}
            height={height - 2}
            rx="7"
            fill="white"
            stroke="black"
            strokeWidth="2"
          />

          {/* Card Overlay */}
          {addOverlay && <rect x="1" y="1" width={width - 2} height={height - 2} rx="7" fill="#00000066" />}

          {isFaceCard && (
            <rect x="21" y="13" width="66" height="125" fill="#22222211" stroke="darkblue" strokeWidth="1" />
          )}

          {/* Top-left corner rank and suit */}
          <text
            x={5}
            y={24}
            fontFamily="Arial"
            fontSize={cornerRankSize}
            fill={imageColor}
            transform={`scale(${valueScale},1)`}
          >
            {value}
          </text>

          <text
            x={12}
            y={34}
            fontFamily="Arial"
            fontSize={cornerSuitSize}
            fill={imageColor}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {suit}
          </text>

          {/* Bottom-right corner rank and suit */}
          <g transform={`translate(${103},${126}) scale(-1,-1)`}>
            <text
              fontFamily="Arial"
              fontSize={cornerRankSize}
              fill={imageColor}
              transform={`scale(${valueScale},1)`}
            >
              {value}
            </text>
          </g>
          <g transform={`translate(${95},${116}) scale(-1,-1)`}>
            <text
              fontFamily="Arial"
              fontSize={cornerSuitSize}
              fill={imageColor}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {suit}
            </text>
          </g>

          {imageKeys.map((val, i) => {
            const keyval = centerSvgVals.get(val);
            let fontsize = suitFontSize;
            let displayValue: string = suit;
            if (!keyval) return <div key={i}>Invalid card svg</div>;
            if (keyval.reverse) return;

            fontsize = val === 's2-b' ? faceFontSize : fontsize;
            fontsize = val === 's2-a' ? aceFontSize : fontsize;
            displayValue = val === 's2-b' ? value : suit;

            return (
              <text
                key={i}
                x={keyval.x}
                y={keyval.y}
                fontFamily="Arial"
                fontSize={fontsize}
                fill={imageColor}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {displayValue}
              </text>
            );
          })}

          {imageKeys.map((val, i) => {
            const keyval = centerSvgVals.get(val);

            if (!keyval) return <div key={i}>Invalid card svg</div>;
            if (!keyval.reverse) return;

            return (
              <g key={i} transform={`translate(${keyval.x},${keyval.y}) scale(-1,-1)`}>
                <text
                  x={0}
                  y={0}
                  fontFamily="Arial"
                  fontSize={suitFontSize}
                  fill={imageColor}
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {suit}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.suit === nextProps.suit &&
      prevProps.value === nextProps.value &&
      prevProps.addOverlay === nextProps.addOverlay &&
      prevProps.onClick === nextProps.onClick
    );
  }
);

PlayingCardFace.displayName = 'PlayingCardFace';

export default PlayingCardFace;
