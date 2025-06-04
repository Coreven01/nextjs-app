'use client';

import GameCard from '../game/game-card';
import clsx from 'clsx';
import { getCardFullName } from '../../util/game/cardSvgDataUtil';
import { getDisplayHeight, getDisplayWidth } from '../../util/game/cardDataUtil';
import {
  Card,
  CardValue,
  RESPONSE_CARD_CENTER,
  RESPONSE_CARD_SIDE,
  Suit,
  TableLocation
} from '../../definitions/definitions';
import { CardAnimationControls } from '../../definitions/transform-definitions';
import Draggable from 'react-draggable';
import { CSSProperties, forwardRef, memo, PropsWithoutRef, RefObject, useRef } from 'react';
import PlayingCardFace from './playing-card-face';
import PlayingCardBack from './playing-card-back';
import { motion } from 'framer-motion';
// import { CardBaseState } from '../../definitions/game-state-definitions';
// import Image from 'next/image';
import PlayingCardShadow from './playing-card-shadow';

interface Props {
  rotate: boolean;
}
export default function RenderCards({ rotate }: Props) {
  const draggableRef: RefObject<HTMLDivElement> = useRef(null) as unknown as React.RefObject<HTMLDivElement>;
  const draggableRef2: RefObject<HTMLDivElement> = useRef(null) as unknown as React.RefObject<HTMLDivElement>;

  const cardValues: CardValue[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const suits: Suit[] = ['♠', '♥', '♦', '♣'];
  const tempCard: Card = { suit: '♠', value: '2', index: 0 };
  const control: CardAnimationControls = { cardIndex: 0, animateSprings: [], controls: undefined };

  return (
    <div className="bg-white p-2 overflow-auto">
      <Draggable
        grid={[2, 2]}
        defaultPosition={{ x: 5, y: 5 }}
        defaultClassName={clsx('absolute')}
        handle="h2"
        nodeRef={draggableRef}
      >
        <div
          ref={draggableRef}
          className="w-full border border-black bg-black bg-opacity-5"
          style={{ zIndex: 1000 }}
        >
          <h2 className="w-full text-center text-3xl cursor-move">Move</h2>
        </div>
      </Draggable>
      <Draggable
        grid={[2, 2]}
        defaultPosition={{ x: 5, y: 5 }}
        defaultClassName={clsx('absolute')}
        handle="h2"
        nodeRef={draggableRef2}
      >
        <div
          ref={draggableRef2}
          className="w-8 h-full border border-black bg-black bg-opacity-5"
          style={{ zIndex: 1000 }}
        >
          <h2 className="h-full text-center text-3xl cursor-move">M</h2>
        </div>
      </Draggable>

      {suits.map((suit, i) => {
        return (
          <div key={i} className="flex gap-5">
            {cardValues.map((v, i) => {
              return (
                <div key={i}>
                  <GameCard2 location="bottom" suit={suit} value={v} responsive rotate />
                </div>
              );
            })}
          </div>
        );
      })}
      {/* <div className="flex gap-5">
        <PlayingCardBack />
        <PlayingCardBack rotate />
      </div> */}

      <div className={clsx('flex justify-center mb-2 gap-5')}>
        <GameCard
          id="back-card-1"
          animationControls={control}
          renderKey="1"
          cardState={{
            renderKey: '1',
            cardFullName: getCardFullName(tempCard),
            cardIndex: 1,
            enabled: false
          }}
          card={tempCard}
          width={getDisplayWidth('top')}
          height={getDisplayHeight('top')}
          location="top"
        ></GameCard>
        <GameCard
          id="back-card-2"
          animationControls={control}
          renderKey="1"
          cardState={{
            renderKey: '1',
            cardFullName: getCardFullName(tempCard),
            cardIndex: 0,
            enabled: false
          }}
          card={tempCard}
          width={getDisplayWidth('left')}
          height={getDisplayHeight('left')}
          location="left"
        ></GameCard>
      </div>
      {suits.map((s) => {
        return (
          <div
            className={clsx(
              'flex justify-center m-2',
              { 'gap-[75px] h-[150px]': rotate },
              { 'gap-1': !rotate }
            )}
            key={s}
          >
            {cardValues.map((c) => {
              const card: Card = { suit: s, value: c, index: 0 };
              const h = getDisplayHeight('top');
              const w = getDisplayWidth('top');

              return (
                <div key={`${s}${c}`} className="m-3">
                  <GameCard
                    className={clsx({ 'rotate-90': rotate })}
                    animationControls={control}
                    renderKey="1"
                    id={`${s}${c}`}
                    cardState={{
                      cardFullName: getCardFullName(tempCard),
                      cardIndex: 0,
                      enabled: false,
                      renderKey: '1'
                    }}
                    card={tempCard}
                    width={w}
                    height={h}
                    location="top"
                  ></GameCard>
                </div>
              );
            })}
          </div>
        );
      })}

      {suits.map((s) => {
        return (
          <div
            className={clsx(
              'flex justify-center mb-2',
              { 'gap-[25px] h-[150px]': rotate },
              { 'gap-1': !rotate }
            )}
            key={s}
          >
            {cardValues.map((c) => {
              const card: Card = { suit: s, value: c, index: 0 };
              const h = getDisplayHeight('left');
              const w = getDisplayWidth('left');
              return (
                <GameCard
                  className={clsx({ '-rotate-90': rotate })}
                  animationControls={control}
                  key={`${s}${c}`}
                  id={`${s}${c}`}
                  renderKey="1"
                  cardState={{
                    cardFullName: getCardFullName(tempCard),
                    cardIndex: 0,
                    renderKey: '1',
                    enabled: false
                  }}
                  card={tempCard}
                  width={w}
                  height={h}
                  location="left"
                ></GameCard>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

interface Props2 extends React.HtmlHTMLAttributes<HTMLImageElement> {
  suit: Suit;
  value: CardValue;
  location: TableLocation;
  rotate?: boolean;
  responsive?: boolean;
}

const GameCard2 = memo(
  forwardRef<HTMLDivElement, PropsWithoutRef<Props2>>(
    ({ suit, value, location, rotate, responsive }: Props2, ref) => {
      const cssValues: CSSProperties = { backfaceVisibility: 'visible' };
      const sideLocation = location === 'left' || location === 'right';

      if (responsive) {
        cssValues.width = '100%';
        cssValues.height = '100%';
      } else {
        cssValues.width = 107;
        cssValues.height = 150;
        cssValues.maxHeight = 150;
        cssValues.maxWidth = 107;
      }

      //#region Handlers

      //#endregion

      return (
        <motion.div
          style={{ perspective: 1000 }}
          className={clsx('pointer-events-none overflow-visible select-none')}
          draggable={false}
        >
          <motion.div
            style={{ transformStyle: 'preserve-3d' }}
            className={clsx(rotate ? RESPONSE_CARD_SIDE : RESPONSE_CARD_CENTER)}
          >
            <PlayingCardShadow location={location} style={cssValues} rotate={rotate} />
            <PlayingCardFace
              addOverlay={false}
              rotate={rotate}
              suit={suit}
              value={value}
              style={cssValues}
              className={clsx(
                'absolute top-0 left-0 pointer-events-auto',
                { 'cursor-not-allowed': !true },
                {
                  'cursor-pointer hover:scale-110 hover:-translate-y-2 transition duration-300': true
                }
              )}
            />
            <PlayingCardBack
              rotate={rotate}
              className="absolute top-0 left-0 pointer-events-auto"
              style={{
                ...cssValues,
                backfaceVisibility: 'hidden',
                transform: sideLocation ? 'rotateX(180deg)' : 'rotateY(180deg)'
              }}
            />
          </motion.div>
        </motion.div>
      );
    }
  ),
  (prevProps, nextProps) => {
    return prevProps === nextProps;
  }
);

GameCard2.displayName = 'GameCard2';
