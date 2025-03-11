'use client';

import {
  getCardClassColorFromSuit,
  getCardFullName,
  getEncodedCardSvg,
  getSuitName
} from '@/app/lib/euchre/card-data';
import { BidResult, EuchreGameInstance, Suit } from '@/app/lib/euchre/definitions';
import clsx from 'clsx';
import Image from 'next/image';
import { useState } from 'react';
import { GamePrompt } from './game-prompt';

type Props = {
  firstRound: boolean;
  game: EuchreGameInstance;
  onBidSubmit: (result: BidResult) => void;
};

export function BidPrompt({ firstRound, game, onBidSubmit }: Props) {
  if (!game?.trump) throw new Error('Trump not found for bid prompt.');

  const [bidSelection, setBidSelection] = useState<string | null>(null);
  const [lonerSelection, setLonerSelection] = useState<boolean | null>(false);
  const submitEnabled = firstRound || bidSelection !== null;

  const handleBidSubmit = (playerPassed: boolean) => {
    const result: BidResult = {
      orderTrump: false,
      loner: false,
      calledSuit: null
    };

    if (playerPassed) {
      onBidSubmit(result);
      return;
    }

    const isLoner = lonerSelection ?? false;
    const suitSelection = bidSelection ?? '';

    if (!firstRound && !suitSelection?.length) return;

    result.orderTrump = true;
    result.loner = isLoner;
    result.calledSuit = firstRound ? null : (suitSelection as Suit);

    onBidSubmit(result);
  };

  const handleSuitSelectionChange = (value: string) => {
    setBidSelection(value);
  };

  return (
    <GamePrompt className={`bg-stone-900`}>
      <div className="p-2">
        <div className="grid grid-rows-[30px,175px,30px,30px] grid-cols-[120px,100px] gap-1">
          <div className="col-span-2 bg-green-950 text-center rounded border border-white">
            Dealer: {game.dealer?.name}
          </div>
          {firstRound ? (
            <div className="p-2 bg-green-950 flex items-center justify-center rounded border border-white">
              <Image
                className={`contain row-span-1 col-span-1`}
                quality={100}
                width={game.trump.getDisplayWidth('center')}
                height={game.trump.getDisplayHeight('center')}
                src={getEncodedCardSvg(game.trump, 'center')}
                alt="Game Card"
                title={getCardFullName(game.trump)}
              />
            </div>
          ) : (
            <></>
          )}
          <SuitSelection
            className="bg-green-950 border border-white rounded p-2 justify-center"
            firstRound={firstRound}
            trumpSuit={game.trump.suit}
            onSelectionChange={handleSuitSelectionChange}
          />
          <div
            className={`${firstRound ? 'col-span-2' : 'col-span-3'} bg-green-950 text-center rounded border border-white`}
          >
            <label htmlFor="checkAlone">Go Alone: </label>
            <input
              id="checkAlone"
              type="checkbox"
              onChange={(e) => setLonerSelection(e.target.checked)}
            />
          </div>
          <button
            onClick={() => handleBidSubmit(false)}
            className="border border-white rounded hover:bg-amber-100 hover:text-black disabled:hover:bg-inherit disabled:cursor-not-allowed disabled:text-gray-500"
            disabled={!submitEnabled}
          >
            {firstRound
              ? game.dealer === game.currentPlayer
                ? 'Pick Up'
                : 'Order Up'
              : 'Name Suit'}
          </button>
          <button
            onClick={() => handleBidSubmit(true)}
            className="border border-white rounded hover:bg-amber-100 hover:text-black"
          >
            Pass
          </button>
        </div>
      </div>
    </GamePrompt>
  );
}

interface SelectionProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  trumpSuit: Suit | undefined;
  firstRound: boolean;
  onSelectionChange: (value: string) => void;
}

function SuitSelection({
  trumpSuit,
  firstRound,
  onSelectionChange,
  className,
  ...rest
}: SelectionProps) {
  const suits: Suit[] = ['♠', '♣', '♥', '♦'];

  const buttonSvg =
    'checked:bg-none bg-none bg-[rgba(150,150,150,0.3)] focus:outline-none focus:ring-2 focus:ring-red-500';
  const retval: React.ReactNode[] = [];

  for (const suit of suits) {
    if (!firstRound && trumpSuit === suit) continue;

    const suitDisabled: boolean = firstRound && trumpSuit !== suit;

    retval.push(
      <div key={suit} className="flex relative items-center justify-center">
        <div
          className={`absolute pointer-events-none ${getCardClassColorFromSuit(suit)} text-3xl font-bold`}
        >
          {suit}
        </div>
        <input
          onChange={(e) => onSelectionChange(e.target.value)}
          disabled={suitDisabled}
          defaultChecked={firstRound && suit === trumpSuit}
          type="radio"
          name="suit"
          value={suit}
          title={getSuitName(suit)}
          className={`appearance-none ${!firstRound && !suitDisabled ? 'cursor-pointer hover:bg-amber-100' : ''} ${buttonSvg} border 
          rounded w-full h-8 inset-shadow-sm shadow-xl checked:bg-red-200 hover:checked:bg-red-200 focus:bg-amber-300 text-white 
          focus:active:bg-red-200 disabled:cursor-not-allowed`}
        />
      </div>
    );
  }
  return (
    <div
      {...rest}
      className={clsx(`flex flex-col gap-2 ${firstRound ? 'col-span-1' : 'col-span-2'}`, className)}
    >
      {retval}
    </div>
  );
}
