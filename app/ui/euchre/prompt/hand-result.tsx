import { EuchreHandResult, ResultHighlight } from '@/app/lib/euchre/definitions/definitions';
import { useState } from 'react';
import PlayerColor from '../player/player-team-color';
import clsx from 'clsx';
import HandResultDetail from './hand-result-detail';
import useCardSvgData from '@/app/hooks/euchre/data/useCardSvgData';
import GameWarning from '../game/game-warning';
import usePlayerData from '../../../hooks/euchre/data/usePlayerData';
import {
  EuchreGameInstance,
  EuchrePlayer,
  EuchreSettings
} from '../../../lib/euchre/definitions/game-state-definitions';

interface Props extends React.HtmlHTMLAttributes<HTMLDivElement> {
  game: EuchreGameInstance;
  settings: EuchreSettings;
  handResult: EuchreHandResult | null;
}

export default function HandResult({ game, settings, handResult, className, ...rest }: Props) {
  const { getCardClassColorFromSuit, getSuitName } = useCardSvgData();
  const { getTeamColor } = usePlayerData();

  const [selectedHighlight, setSelectedHighlight] = useState<ResultHighlight>('winner');

  if (!handResult) throw new Error('No hand result was found');

  let pointsDisplay: string = `Points for Team ${handResult.teamWon}: ${handResult.points}`;
  const BASE_CLASS: string = 'text-center dark:bg-stone-800 dark:text-white mb-1';
  const winningTeamPlayer: EuchrePlayer = game.gamePlayers.filter((p) => p.team === handResult.teamWon)[0];
  const playerReneged: boolean = handResult.tricks.find((t) => t.playerRenege !== null) !== undefined;

  if (handResult.teamWon === handResult.maker.team) {
    pointsDisplay = `Points for Maker: ${handResult.points}`;
  } else {
    pointsDisplay = `Points for Defenders: ${handResult.points}`;
  }

  const handleSelectionChanged = (selection: ResultHighlight) => {
    setSelectedHighlight(selection);
  };

  return (
    <div className={clsx('flex flex-col gap-1 overflow-auto', className)} {...rest}>
      <HandHighlightNavigation
        players={[...game.gamePlayers]}
        selection={selectedHighlight}
        onSelectionChanged={handleSelectionChanged}
        className="lg:text-base text-sm mb-1"
      />
      {playerReneged && (
        <GameWarning className="mb-1 border border-red-900">Hand ended due to player renege</GameWarning>
      )}
      <div className="flex gap-1">
        <div className="lg:min-w-48">
          <div className="mb-1">
            <PlayerColor
              className="lg:text-base text-xs"
              teamColor={getTeamColor(handResult.maker, settings)}
            >
              <div className="bg-stone-800 p-1 text-center">Maker: {handResult.maker.name}</div>
            </PlayerColor>
          </div>
          <div className=" mb-1">
            <PlayerColor
              className="lg:text-base text-xs"
              teamColor={getTeamColor(handResult.dealer, settings)}
            >
              <div className="bg-stone-800 p-1 text-center">Dealer: {handResult.dealer.name}</div>
            </PlayerColor>
          </div>
          <div className="mb-1">
            <PlayerColor
              className="lg:text-base text-xs"
              teamColor={getTeamColor(winningTeamPlayer, settings)}
            >
              <div className="bg-stone-800 p-1 text-center">{pointsDisplay}</div>
            </PlayerColor>
          </div>
          <div className={`${BASE_CLASS} lg:text-base text-xs border dark:border-white p-1`}>
            Went Alone: {handResult.loner ? 'Yes' : 'No'}
          </div>
          <div className={`${BASE_CLASS} lg:text-base text-xs border dark:border-white p-1`}>
            Trump:{' '}
            <span
              title={`${getSuitName(handResult.trump.suit)}s`}
              className={`${getCardClassColorFromSuit(handResult.trump.suit)} bg-white px-1 rounded-full`}
            >
              {handResult.trump.suit}
            </span>
          </div>
          <div className={`${BASE_CLASS} lg:text-base text-xs border dark:border-white p-1`}>
            Named By Suit: {handResult.turnedDown !== null ? 'Yes' : 'No'}
          </div>
        </div>
        <div className="lg:min-w-64">
          {handResult.tricks.map((trick) => {
            if (!trick.taker) throw new Error();

            const displayWinner = trick.playerRenege !== null;
            return (
              <div
                key={`${trick.round}-${trick.cardsPlayed.map((c) => `${c.player.playerNumber}-${c.card.value}-${c.card.suit}`).join('')}`}
                className={`flex items-center ${BASE_CLASS} lg:text-base text-xs`}
              >
                <HandResultDetail
                  trick={trick}
                  playerWon={trick.taker}
                  handResult={handResult}
                  highlight={selectedHighlight}
                  playerReneged={playerReneged}
                />
                {!displayWinner && (
                  <PlayerColor
                    className="grow lg:min-w-36 h-full"
                    teamColor={getTeamColor(trick.taker, settings)}
                  >
                    <div className="bg-stone-800 p-1 text-center">Winner: {trick.taker.name}</div>
                  </PlayerColor>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface NavProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  selection: ResultHighlight;
  players: EuchrePlayer[];
  onSelectionChanged: (selection: ResultHighlight) => void;
}

const HandHighlightNavigation = ({ selection, players, className, onSelectionChanged }: NavProps) => {
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
      className={clsx('flex justify-center gap-2 overflow-x-scroll w-full lg:text-sm text-xs h-4', className)}
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
};
