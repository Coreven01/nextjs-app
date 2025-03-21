import { EuchreGameInstance, EuchreHandResult, EuchreSettings } from '@/app/lib/euchre/definitions';
import PlayerColor from '../player/player-team-color';
import { getCardClassColorFromSuit, getSuitName } from '@/app/lib/euchre/card-data';
import clsx from 'clsx';
import HandResultDetail from './hand-result-detail';

interface Props extends React.HtmlHTMLAttributes<HTMLDivElement> {
  game: EuchreGameInstance;
  settings: EuchreSettings;
  handResult: EuchreHandResult | null;
}

export default function HandResult({ game, settings, handResult, className, ...rest }: Props) {
  if (!handResult) throw new Error('No hand result was found');

  let pointsDisplay: string = `Points for Team ${handResult.teamWon}: ${handResult.points}`;
  const BASE_CLASS = 'border dark:border-white text-center dark:bg-stone-900 dark:text-white p-1 mb-1';
  const winningTeamPlayer = game.gamePlayers.filter((p) => p.team === handResult.teamWon)[0];

  if (handResult.teamWon === handResult.maker.team) {
    pointsDisplay = `Points for Maker: ${handResult.points}`;
  } else {
    pointsDisplay = `Points for Defenders: ${handResult.points}`;
  }

  return (
    <div {...rest} className={clsx('md:flex md:flex-row gap-1', className)}>
      <div className="md:min-w-48">
        <div className="mb-1">
          <PlayerColor player={handResult.maker} settings={settings}>
            <div className="bg-stone-900 p-1 text-center">
              Maker: {handResult.maker === game.player1 ? 'You' : handResult.maker.name}
            </div>
          </PlayerColor>
        </div>
        <div className=" mb-1">
          <PlayerColor player={handResult.dealer} settings={settings}>
            <div className="bg-stone-900 p-1 text-center">
              Dealer: {handResult.dealer === game.player1 ? 'You' : handResult.dealer.name}
            </div>
          </PlayerColor>
        </div>
        <div className="mb-1">
          <PlayerColor player={winningTeamPlayer} settings={settings}>
            <div className="bg-stone-900 p-1 text-center">{pointsDisplay}</div>
          </PlayerColor>
        </div>
        <div className={`${BASE_CLASS}`}>Went Alone: {handResult.loner ? 'Yes' : 'No'}</div>
        <div className={`${BASE_CLASS}`}>
          Trump:{' '}
          <span
            title={`${getSuitName(handResult.trump.suit)}s`}
            className={`${getCardClassColorFromSuit(handResult.trump.suit)} bg-white px-1 rounded-full`}
          >
            {handResult.trump.suit}
          </span>
        </div>
        <div className={`${BASE_CLASS}`}>Named By Suit: {handResult.trumpWasNamed ? 'Yes' : 'No'}</div>
      </div>
      <div>
        {handResult.tricks.map((t) => {
          return (
            <div
              key={`${t.round}-${t.cardsPlayed.map((c, index) => `${c.player.playerNumber}-${c.card.value}-${c.card.suit}`).join('')}`}
              className={`flex items-center ${BASE_CLASS}`}
            >
              <HandResultDetail cardsPlayed={t.cardsPlayed} playerWon={t.taker} />
              <div className="w-full">
                <PlayerColor player={t.taker ?? game.player1} settings={settings}>
                  <div className="bg-stone-900 p-1 text-center">Winner: {t.taker?.name}</div>
                </PlayerColor>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
