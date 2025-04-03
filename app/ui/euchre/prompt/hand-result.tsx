import {
  EuchreGameInstance,
  EuchreHandResult,
  EuchrePlayer,
  EuchreSettings,
  ResultHighlight
} from '@/app/lib/euchre/definitions';
import PlayerColor from '../player/player-team-color';
import { getCardClassColorFromSuit, getSuitName } from '@/app/lib/euchre/card-data';
import clsx from 'clsx';
import HandResultDetail from './hand-result-detail';
import { useState } from 'react';

interface Props extends React.HtmlHTMLAttributes<HTMLDivElement> {
  game: EuchreGameInstance;
  settings: EuchreSettings;
  handResult: EuchreHandResult | null;
}

export default function HandResult({ game, settings, handResult, className, ...rest }: Props) {
  const [selectedHighlight, setSelectedHighlight] = useState<ResultHighlight>('winner');
  if (!handResult) throw new Error('No hand result was found');

  let pointsDisplay: string = `Points for Team ${handResult.teamWon}: ${handResult.points}`;
  const BASE_CLASS = 'text-center dark:bg-stone-800 dark:text-white mb-1';
  const winningTeamPlayer = game.gamePlayers.filter((p) => p.team === handResult.teamWon)[0];
  const playerReneged = handResult.tricks.find((t) => t.playerRenege !== null);

  if (handResult.teamWon === handResult.maker.team) {
    pointsDisplay = `Points for Maker: ${handResult.points}`;
  } else {
    pointsDisplay = `Points for Defenders: ${handResult.points}`;
  }

  const handleSelectionChanged = (selection: ResultHighlight) => {
    setSelectedHighlight(selection);
  };

  return (
    <div {...rest} className={clsx('flex flex-row gap-1 overflow-auto', className)}>
      <div className="md:min-w-48">
        <div className="mb-1">
          <PlayerColor className="md:text-base text-xs" player={handResult.maker} settings={settings}>
            <div className="bg-stone-800 p-1 text-center">
              Maker: {handResult.maker === game.player1 ? 'You' : handResult.maker.name}
            </div>
          </PlayerColor>
        </div>
        <div className=" mb-1">
          <PlayerColor className="md:text-base text-xs" player={handResult.dealer} settings={settings}>
            <div className="bg-stone-800 p-1 text-center">
              Dealer: {handResult.dealer === game.player1 ? 'You' : handResult.dealer.name}
            </div>
          </PlayerColor>
        </div>
        <div className="mb-1">
          <PlayerColor className="md:text-base text-xs" player={winningTeamPlayer} settings={settings}>
            <div className="bg-stone-800 p-1 text-center">{pointsDisplay}</div>
          </PlayerColor>
        </div>
        <div className={`${BASE_CLASS} md:text-base text-xs border dark:border-white md:p-1`}>
          Went Alone: {handResult.loner ? 'Yes' : 'No'}
        </div>
        <div className={`${BASE_CLASS} md:text-base text-xs border dark:border-white md:p-1`}>
          Trump:{' '}
          <span
            title={`${getSuitName(handResult.trump.suit)}s`}
            className={`${getCardClassColorFromSuit(handResult.trump.suit)} bg-white px-1 rounded-full`}
          >
            {handResult.trump.suit}
          </span>
        </div>
        <div className={`${BASE_CLASS} md:text-base text-xs border dark:border-white md:p-1`}>
          Named By Suit: {handResult.turnedDown !== null ? 'Yes' : 'No'}
        </div>
      </div>
      <div>
        <HandHighlightNavigation
          players={[...game.gamePlayers]}
          selection={selectedHighlight}
          onSelectionChanged={handleSelectionChanged}
          className="flex-grow md:text-base text-sm"
        />

        {playerReneged && (
          <div className="dark:text-red-100 text-center mb-2">Hand ended due to player renege</div>
        )}
        {handResult.tricks.map((t) => {
          if (!t.taker) throw new Error();

          const playerReneged = t.playerRenege !== null;
          return (
            <div
              key={`${t.round}-${t.cardsPlayed.map((c, index) => `${c.player.playerNumber}-${c.card.value}-${c.card.suit}`).join('')}`}
              className={`flex items-center ${BASE_CLASS} md:text-base text-xs`}
            >
              <HandResultDetail
                cardsPlayed={t.cardsPlayed}
                playerWon={t.taker}
                handResult={handResult}
                highlight={selectedHighlight}
              />
              {!playerReneged && (
                <div className="flex-grow md:min-w-36">
                  <PlayerColor player={t.taker} settings={settings}>
                    <div className="bg-stone-800 p-1 text-center">Winner: {t.taker.name}</div>
                  </PlayerColor>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface NavProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  selection: ResultHighlight;
  players: EuchrePlayer[];
  onSelectionChanged: (selection: ResultHighlight) => void;
}

function HandHighlightNavigation({ selection, players, className, onSelectionChanged }: NavProps) {
  const selections = new Map<ResultHighlight, string>();
  selections.set('player1', players.find((p) => p.playerNumber === 1)?.name ?? '');
  selections.set('player2', players.find((p) => p.playerNumber === 2)?.name ?? '');
  selections.set('player3', players.find((p) => p.playerNumber === 3)?.name ?? '');
  selections.set('player4', players.find((p) => p.playerNumber === 4)?.name ?? '');
  selections.set('winner', 'Trick Winner');
  selections.set('trump', 'Trump');
  const selectionArray = [...selections.entries()];

  return (
    <ul
      className={clsx(
        'flex justify-center gap-2 overflow-x-scroll w-full md:text-sm text-xs mb-2',
        className
      )}
      style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
    >
      {selectionArray.map((r, i) => {
        return (
          <li className={clsx('whitespace-nowrap')} key={i}>
            {r[0] !== 'player1' ? '| ' : ''}
            <button
              className={clsx('hover:text-yellow-500', {
                'underline decoration-solid decoration-red-600 text-yellow-500': selection === r[0]
              })}
              id={`btn-highlight-${i}`}
              onClick={() => onSelectionChanged(r[0])}
            >
              {r[1]}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
