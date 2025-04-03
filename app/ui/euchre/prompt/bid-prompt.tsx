'use client';

import { getCardFullName, getEncodedCardSvg, getSuitName } from '@/app/lib/euchre/card-data';
import { BidResult, EuchreGameInstance, EuchreSettings, Suit } from '@/app/lib/euchre/definitions';
import clsx from 'clsx';
import Image from 'next/image';
import React, { useState } from 'react';
import PromptSelection from './prompt-selection';
import GamePrompt from './game-prompt';
import PlayerColor from '../player/player-team-color';
import GameBorder from '../game/game-border';
import CardSelection from './card-selection';
import Switch from '@mui/material/Switch';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  firstRound: boolean;
  game: EuchreGameInstance;
  settings: EuchreSettings;
  onBidSubmit: (result: BidResult) => void;
}

export default function BidPrompt({ firstRound, game, settings, onBidSubmit, className, ...rest }: DivProps) {
  if (!game?.trump) throw new Error('Trump not found for bid prompt.');
  if (!game?.dealer) throw new Error('Dealer not found for bid prompt.');
  if (!game?.currentPlayer) throw new Error('Current player not found for bid prompt.');

  const [bidSelection, setBidSelection] = useState<string | null>(null);
  const [lonerSelection, setLonerSelection] = useState<boolean>(false);
  const submitEnabled = firstRound || bidSelection !== null;
  const aloneTitle: string = 'Select if you choose to play without your partner';
  const orderTrumpTitle: string = `Order ${getSuitName(game.trump.suit)}s as trump`;
  const cardName: string = getCardFullName(game.trump);
  const stickTheDealer = settings.stickTheDealer && !firstRound && game.dealer.equal(game.currentPlayer);
  const passTitle: string = stickTheDealer
    ? 'Unable to pass - Stick the dealer enabled'
    : 'Pass the bid to the next player';

  let dealerTitle: string = '';

  if (game.dealer === game.currentPlayer && firstRound) {
    dealerTitle = `You will pick up the ${cardName}`;
  } else if (game.dealer.team === game.currentPlayer.team && firstRound) {
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

    const isLoner = lonerSelection;
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
    <GamePrompt {...rest} zIndex={50} className={clsx('bg-white dark:bg-stone-800', className)}>
      <div className="p-1">
        <div
          className={clsx(
            `grid gap-1`,
            {
              'md:grid-rows-[1fr,auto,auto,auto,auto] md:grid-cols-[130px,100px] grid-rows-[1fr,auto,auto] grid-cols-[auto,100px,auto]':
                firstRound
            },
            {
              'md:grid-rows-[1fr,130px,30px,30px] md:grid-cols-[100px,100px] grid-rows-[1fr,auto,auto,auto] grid-cols-[auto]':
                !firstRound
            }
          )}
        >
          <div
            title={`Choose if the dealer should pick up ${cardName}`}
            className={clsx(
              'flex items-center justify-center cursor-default',
              {
                'md:col-span-2 col-span-3': firstRound
              },
              { 'md:col-span-2 md:w-full w-64': !firstRound }
            )}
          >
            <h2 className="dark:text-yellow-200 font-bold md:text-lg text-sm">Bid for Trump</h2>
          </div>

          {firstRound && (
            <div className="md:col-span-2 col-span-1">
              <div title={dealerTitle} className="text-center cursor-default">
                <PlayerColor player={game.dealer} settings={settings}>
                  <div className="bg-white dark:bg-stone-800 h-full flex items-center justify-center md:text-base text-xs">
                    Dealer: {game.dealer === game.currentPlayer ? 'You' : game.dealer.name}
                  </div>
                </PlayerColor>
              </div>
            </div>
          )}

          {firstRound && (
            <div>
              <div className="text-center md:text-base text-sm">Trump Card</div>
              <GameBorder className="col-start-1" innerClass="w-20 md:w-full" size="small">
                <div className="p-2 bg-green-950 flex items-center justify-center">
                  <Image
                    className={`contain`}
                    quality={100}
                    width={game.trump.getDisplayWidth('center')}
                    height={game.trump.getDisplayHeight('center')}
                    src={getEncodedCardSvg(game.trump, 'center')}
                    alt={getCardFullName(game.trump)}
                    title={getCardFullName(game.trump)}
                    style={{
                      width: '100%',
                      height: 'auto'
                    }}
                  />
                </div>
              </GameBorder>
            </div>
          )}
          {!firstRound ? (
            <SuitSelection
              className={clsx(
                'p-1 justify-center',
                { 'col-span-1 col-start-2 row-start-3': firstRound },
                { 'md:col-span-2 w-32 m-auto': !firstRound }
              )}
              firstRound={firstRound}
              trumpSuit={game.trump.suit}
              onSelectionChange={handleSuitSelectionChange}
            />
          ) : (
            <div className="p-1 justify-center mt-2">
              <CardSelection playerHand={game.currentPlayer?.availableCards ?? []} />
            </div>
          )}
          <div
            className={clsx(
              'text-center md:text-base text-xs',
              { 'md:col-span-2 md:col-start-1 md:row-start-4 col-start-2 row-start-2': firstRound },
              { 'md:col-span-2': !firstRound }
            )}
            title={aloneTitle}
          >
            <label htmlFor="checkAlone">Go Alone: </label>
            <Switch
              id="checkAlone"
              size="small"
              checked={lonerSelection}
              name="checkAlone"
              color="success"
              onChange={(e) => setLonerSelection(e.target.checked)}
            />
          </div>
          <div
            className={clsx(
              'flex gap-2 md:text-base text-xs text-white',
              {
                'md:flex-row flex-col md:col-span-2 md:col-start-1 md:row-start-5 md:row-span-1 col-start-3 row-start-2 row-span-2':
                  firstRound
              },
              { 'md:col-span-2': !firstRound }
            )}
          >
            <button
              title={passTitle}
              onClick={() => handleBidSubmit(true)}
              className={clsx(
                'w-full flex-grow px-1 border border-white bg-red-950',
                {
                  'hover:bg-amber-100 hover:text-black': !stickTheDealer
                },
                {
                  'disabled:hover:bg-inherit disabled:cursor-not-allowed disabled:text-gray-500':
                    stickTheDealer
                }
              )}
              disabled={stickTheDealer}
            >
              Pass
            </button>
            <button
              title={orderTrumpTitle}
              onClick={() => handleBidSubmit(false)}
              className="w-full flex-grow px-1 border border-white bg-green-950 hover:bg-amber-100 hover:text-black disabled:hover:bg-inherit disabled:cursor-not-allowed disabled:text-gray-500"
              disabled={!submitEnabled}
            >
              {firstRound ? (game.dealer === game.currentPlayer ? 'Pick Up' : 'Order Up') : 'Name Suit'}
            </button>
          </div>
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

  return (
    <div {...rest} className={clsx(`flex flex-col gap-1 md:gap-2`, className)}>
      {suits.map((suit) => {
        if (firstRound || trumpSuit !== suit) {
          const suitDisabled: boolean = firstRound && trumpSuit !== suit;

          return (
            <PromptSelection
              key={suit}
              suit={suit}
              value={suit}
              isEnabled={!suitDisabled}
              defaultChecked={firstRound && suit === trumpSuit}
              onSelectionChanged={onSelectionChange}
              title={`${getSuitName(suit)}s`}
            >
              {suit}
            </PromptSelection>
          );
        }
      })}
    </div>
  );
}
