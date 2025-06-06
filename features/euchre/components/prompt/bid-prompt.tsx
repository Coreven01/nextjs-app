import clsx from 'clsx';
import React, { useState } from 'react';
import PromptSelection from './prompt-selection';
import GamePrompt from './game-prompt';
import PlayerColor from '../player/player-team-color';
import GameBorder from '../game/game-border';
import CardSelection from './card-selection';
import Switch from '@mui/material/Switch';
import PromptHeader from './prompt-header';
import GameWarning from '../game/game-warning';

import GameButton from '../common/game-button';
import { getCardFullName, getSuitName } from '../../util/game/cardSvgDataUtil';
import { getTeamColor, playerEqual } from '../../util/game/playerDataUtil';
import { EuchreGameInstance, EuchreSettings } from '../../definitions/game-state-definitions';
import { BidResult, Suit } from '../../definitions/definitions';
import PlayingCardFace from '../common/playing-card-face';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  firstRound: boolean;
  game: EuchreGameInstance;
  settings: EuchreSettings;
  onBidSubmit: (result: BidResult) => void;
}

const BidPrompt = ({ firstRound, game, settings, onBidSubmit, className, ...rest }: DivProps) => {
  const [bidSelection, setBidSelection] = useState<string | null>(null);
  const [lonerSelection, setLonerSelection] = useState<boolean>(false);
  const submitEnabled = firstRound || bidSelection !== null;
  const aloneTitle: string = 'Select if you choose to play without your partner';
  const orderTrumpTitle: string = `Order ${getSuitName(game.trump.suit)}s as trump`;
  const cardName: string = getCardFullName(game.trump);
  const stickTheDealer =
    settings.stickTheDealer && !firstRound && playerEqual(game.dealer, game.currentPlayer);
  const passTitle: string = stickTheDealer
    ? 'Unable to pass - Stick the dealer enabled'
    : 'Pass the bid to the next player';

  let dealerTitle: string = '';

  if (playerEqual(game.dealer, game.currentPlayer) && firstRound) {
    dealerTitle = `You will pick up the ${cardName}`;
  } else if (game.dealer.team === game.currentPlayer.team && firstRound) {
    dealerTitle = `Your partner will pick up the ${cardName}`;
  } else if (firstRound) {
    dealerTitle = `The opposing team will pick up the ${cardName}`;
  }

  //#region  Handlers
  const handleBidSubmit = (playerPassed: boolean) => {
    const result: BidResult = {
      orderTrump: false,
      loner: false,
      calledSuit: null,
      handScore: 0,
      cheatScore: 0,
      discard: null
    };

    if (playerPassed) {
      onBidSubmit(result);
      return;
    }

    const isLoner = lonerSelection;
    const suitSelection = bidSelection ?? '';

    if (!firstRound && !suitSelection.length) return;

    result.orderTrump = true;
    result.loner = isLoner;
    result.calledSuit = firstRound ? null : (suitSelection as Suit);

    onBidSubmit(result);
  };

  const handleSuitSelectionChange = (value: string) => {
    setBidSelection(value);
  };
  //#endregion

  return (
    <GamePrompt {...rest} zIndex={50} className={clsx('bg-white dark:bg-stone-900', className)}>
      <div className="p-1">
        <div
          className={clsx(`grid gap-1`, {
            'lg:grid-rows-[1fr,auto,auto,auto,auto] lg:grid-cols-[130px,100px] grid-rows-[1fr,auto,auto] grid-cols-[auto,80px,auto]':
              true
          })}
        >
          <div
            title={`Choose if the dealer should pick up ${cardName}`}
            className={clsx('flex items-center justify-center cursor-default', {
              'lg:col-span-2 col-span-3': true
            })}
          >
            <PromptHeader>Bid for Trump</PromptHeader>
          </div>

          <div className="lg:col-span-2 col-span-2">
            <div title={dealerTitle} className="text-center cursor-default">
              <PlayerColor teamColor={getTeamColor(game.dealer, settings)}>
                <div className="bg-white dark:bg-stone-800 h-full flex items-center justify-center lg:text-base text-xs">
                  Dealer: {playerEqual(game.dealer, game.currentPlayer) ? 'You' : game.dealer.name}
                </div>
              </PlayerColor>
            </div>
          </div>
          <div
            className={clsx('text-center lg:text-base text-xs ml-1', {
              'lg:col-span-2 lg:col-start-1 lg:row-start-4': true
            })}
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
          <div className="flex flex-col">
            <div className="text-center lg:text-base text-xs">
              {firstRound ? 'Trump Card' : 'Select Suit'}
            </div>
            <div className="grow flex items-center">
              <GameBorder className="w-full min-w-28" size="small">
                <div className={clsx('p-2 bg-green-950 flex items-center justify-center')}>
                  {firstRound ? (
                    <PlayingCardFace
                      suit={game.trump.suit}
                      value={game.trump.value}
                      addOverlay={false}
                      className="block"
                    />
                  ) : (
                    <SuitSelection
                      className="w-full lg:w-[90px]"
                      firstRound={firstRound}
                      trumpSuit={game.trump.suit}
                      onSelectionChange={handleSuitSelectionChange}
                      getSuitName={getSuitName}
                    />
                  )}
                </div>
              </GameBorder>
            </div>
          </div>
          <div className={clsx('', { '': firstRound }, { '': !firstRound })}>
            <div className="text-center lg:text-base text-xs">Hand</div>
            <CardSelection playerHand={game.currentPlayer.hand} />
          </div>
          <div
            className={clsx('lg:h-8 flex gap-2 lg:text-base text-xs text-white', {
              'lg:flex-row flex-col lg:col-span-2 lg:col-start-1 lg:row-start-5 lg:row-span-1': true
            })}
          >
            <GameButton
              className="w-full grow"
              title={passTitle}
              type="danger"
              disabled={stickTheDealer}
              onClick={() => handleBidSubmit(true)}
            >
              Pass
            </GameButton>
            <GameButton
              className="w-full grow"
              title={orderTrumpTitle}
              type="success"
              onClick={() => handleBidSubmit(false)}
              disabled={!submitEnabled}
            >
              {' '}
              {firstRound
                ? playerEqual(game.dealer, game.currentPlayer)
                  ? 'Pick Up'
                  : 'Order Up'
                : 'Name Suit'}
            </GameButton>
          </div>
        </div>
        {settings.stickTheDealer && (
          <GameWarning className="mt-2 border border-red-900 lg:text-base text-xs">
            Stick the dealer enabled
          </GameWarning>
        )}
      </div>
    </GamePrompt>
  );
};

interface SelectionProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  trumpSuit: Suit;
  firstRound: boolean;
  onSelectionChange: (value: string) => void;
  getSuitName: (suit: Suit) => string;
}

function SuitSelection({
  trumpSuit,
  firstRound,
  onSelectionChange,
  getSuitName,
  className,
  ...rest
}: SelectionProps) {
  const suits: Suit[] = ['♠', '♣', '♥', '♦'];

  return (
    <div {...rest} className={clsx(`flex flex-col gap-1 lg:gap-2`, className)}>
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

export default BidPrompt;
