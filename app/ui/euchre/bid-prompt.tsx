'use client';

import { getEncodedCardSvg } from '@/app/lib/euchre/card-data';
import { BidResult, Card, Suit } from '@/app/lib/euchre/data';
import Image from 'next/image';
import { RefObject, useRef } from 'react';

type Props = {
  flipCard: Card;
  firstRound: boolean;
  onBidSubmit: (result: BidResult) => void;
};

export function BidPrompt({ flipCard, firstRound, onBidSubmit }: Props) {
  const bidSelection = useRef<HTMLDivElement | null>(null);
  const lonerSelection = useRef<HTMLInputElement | null>(null);

  const handleBidSubmit = (trumpOrdered: boolean) => {
    let suit: Suit | null = null;
    const isLoner = lonerSelection.current?.checked ?? false;
    const suitSelection = bidSelection.current?.querySelectorAll('input[type="radio"]:checked');

    if (trumpOrdered && suitSelection?.length) {
      suit = (suitSelection[0] as HTMLInputElement)?.value as Suit;
    }

    const result: BidResult = {
      orderTrump: trumpOrdered,
      loner: isLoner,
      calledSuit: firstRound ? null : suit
    };

    onBidSubmit(result);
  };

  return (
    <div className="absolute left-0 top-0 h-full w-full bg-neutral-800 bg-opacity-20 flex items-center justify-center">
      <div className="min-h-32 min-w-32 border border-white rounded bg-green-700 p-2">
        <div className="grid grid-rows-[165px,35px,35px] grid-cols-[100px,100px] gap-1">
          {firstRound ? (
            <Image
              className={`contain row-span-1 col-span-1`}
              quality={100}
              width={flipCard.getDisplayWidth('center')}
              height={flipCard.getDisplayHeight('center')}
              src={getEncodedCardSvg(flipCard, 'center')}
              alt="Game Card"
            />
          ) : (
            <></>
          )}
          <SuitSelection ref={bidSelection} firstRound={firstRound} trumpSuit={flipCard?.suit} />
          <div className={firstRound ? 'col-span-2' : 'col-span-3'}>
            <label>Go Alone: </label>
            <input ref={lonerSelection} type="checkbox" />
          </div>
          <button onClick={() => handleBidSubmit(true)} className="border border-white rounded">
            Order Up
          </button>
          <button onClick={() => handleBidSubmit(false)} className="border border-white rounded">
            Pass
          </button>
        </div>
      </div>
    </div>
  );
}

interface SelectionProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  trumpSuit: Suit | undefined;
  firstRound: boolean;
  ref: RefObject<HTMLDivElement | null>;
}

function SuitSelection({ trumpSuit, firstRound, ref, ...rest }: SelectionProps) {
  const suits: Suit[] = ['♠', '♥', '♦', '♣'];

  const buttonSvg =
    'checked:bg-none bg-none bg-[rgba(150,150,150,0.3)] focus:outline-none focus:ring-2 focus:ring-red-500';
  const retval: React.ReactNode[] = [];

  for (const suit of suits) {
    retval.push(
      <div key={suit} className="flex relative items-center justify-center">
        <div className="absolute pointer-events-none text-red-800 text-2xl">{suit}</div>
        <input
          disabled={firstRound && trumpSuit !== suit}
          defaultChecked={suit === trumpSuit}
          type="radio"
          name="suit"
          value={suit}
          className={`appearance-none cursor-pointer border rounded w-24 h-8 ${buttonSvg} checked:dark:bg-yellow-500`}
        />
      </div>
    );
  }
  return (
    <div
      ref={ref}
      {...rest}
      className={`flex flex-col gap-2 ${firstRound ? 'col-span-1' : 'col-span-2'}`}
    >
      {retval}
    </div>
  );
}
