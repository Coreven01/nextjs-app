'use client';

import {
  getCardClassColorFromSuit,
  getCardFullName,
  getEncodedCardSvg,
  getSuitName
} from '@/app/lib/euchre/card-data';
import { BidResult, EuchreGameInstance, EuchreSettings, Suit } from '@/app/lib/euchre/definitions';
import clsx from 'clsx';
import Image from 'next/image';
import { useState } from 'react';
import PromptSelection from './prompt-selection';
import GamePrompt from '../game/game-prompt';
import PlayerColor from '../player/player-team-color';

type Props = {
  firstRound: boolean;
  game: EuchreGameInstance;
  settings: EuchreSettings;
  onBidSubmit: (result: BidResult) => void;
};

export default function BidPrompt({ firstRound, game, settings, onBidSubmit }: Props) {
  if (!game?.trump) throw new Error('Trump not found for bid prompt.');
  if (!game?.dealer) throw new Error('Dealer not found for bid prompt.');

  const [bidSelection, setBidSelection] = useState<string | null>(null);
  const [lonerSelection, setLonerSelection] = useState<boolean | null>(false);
  const submitEnabled = firstRound || bidSelection !== null;
  const aloneTitle: string = 'Select if you choose to play without your partner';
  const orderTrumpTitle: string = `Order ${getSuitName(game.trump.suit)}s as trump`;
  const passTitle: string = 'Pass the bid to the next player';
  const cardName: string = getCardFullName(game.trump);
  let dealerTitle: string = '';

  if (game.dealer === game.currentPlayer && firstRound) {
    dealerTitle = `You will pick up the ${cardName}`;
  } else if (game.dealer.team === game.currentPlayer?.team && firstRound) {
    dealerTitle = `Your partner will pick up the ${cardName}`;
  } else if (firstRound) {
    dealerTitle = `The opposing team will pick up the ${cardName}`;
  }

  const handleBidSubmit = (playerPassed: boolean) => {
    const result: BidResult = {
      orderTrump: false,
      loner: false,
      calledSuit: null,
      handScore: 0
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
      <div className="p-1">
        <div
          className={`grid ${firstRound ? 'grid-rows-[22px,42px,175px,30px,30px]' : 'grid-rows-[35px,175px,30px,30px]'} grid-cols-[120px,100px] gap-1`}
        >
          <div
            title={`Choose if the dealer should pick up ${cardName}`}
            className="flex items-center justify-center col-span-2 cursor-default"
          >
            <h2 className="text-yellow-200 font-bold">Bid for Trump</h2>
          </div>

          {firstRound ? (
            <div
              title={dealerTitle}
              className="col-span-2 bg-green-950 text-center border border-white cursor-default"
            >
              <PlayerColor player={game.dealer} settings={settings}>
                <div className="bg-green-950 p-1">
                  Dealer: {game.dealer === game.currentPlayer ? 'You' : game.dealer.name}
                </div>
              </PlayerColor>
            </div>
          ) : (
            <></>
          )}

          {firstRound ? (
            <div className="p-2 bg-green-950 flex items-center justify-center border border-white">
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
            className="bg-green-950 border border-white p-2 justify-center"
            firstRound={firstRound}
            trumpSuit={game.trump.suit}
            onSelectionChange={handleSuitSelectionChange}
          />
          <div
            className={`${firstRound ? 'col-span-2' : 'col-span-3'} bg-green-950 text-center border border-white`}
            title={aloneTitle}
          >
            <label htmlFor="checkAlone">Go Alone: </label>
            <input id="checkAlone" type="checkbox" onChange={(e) => setLonerSelection(e.target.checked)} />
          </div>
          <button
            title={orderTrumpTitle}
            onClick={() => handleBidSubmit(false)}
            className="border border-white hover:bg-amber-100 hover:text-black disabled:hover:bg-inherit disabled:cursor-not-allowed disabled:text-gray-500"
            disabled={!submitEnabled}
          >
            {firstRound ? (game.dealer === game.currentPlayer ? 'Pick Up' : 'Order Up') : 'Name Suit'}
          </button>
          <button
            title={passTitle}
            onClick={() => handleBidSubmit(true)}
            className="border border-white hover:bg-amber-100 hover:text-black"
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

function SuitSelection({ trumpSuit, firstRound, onSelectionChange, className, ...rest }: SelectionProps) {
  const suits: Suit[] = ['♠', '♣', '♥', '♦'];

  const buttonSvg =
    'checked:bg-none bg-none bg-[rgba(150,150,150,0.3)] focus:outline-none focus:ring-2 focus:ring-red-500';
  const retval: React.ReactNode[] = [];

  for (const suit of suits) {
    if (!firstRound && trumpSuit === suit) continue;

    const suitDisabled: boolean = firstRound && trumpSuit !== suit;

    retval.push(
      <div key={suit} className="flex relative items-center justify-center">
        <div className={`absolute pointer-events-none ${getCardClassColorFromSuit(suit)} text-3xl font-bold`}>
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
      {suits.map((s) => {
        if (firstRound || trumpSuit !== s) {
          const suitDisabled: boolean = firstRound && trumpSuit !== s;

          return (
            <PromptSelection
              key={s}
              suit={s}
              value={s}
              isEnabled={!suitDisabled}
              defaultChecked={firstRound && s === trumpSuit}
              onSelectionChanged={onSelectionChange}
              title={`${getSuitName(s)}s`}
            >
              {s}
            </PromptSelection>
          );
        }
      })}
    </div>
  );
}
