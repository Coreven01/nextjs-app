'use client';

import { EuchreGameInstance, EuchreHandResult, EuchreSettings } from '@/app/lib/euchre/definitions';
import HandResultDetail from './hand-result-detail';
import GamePrompt from '../game/game-prompt';
import PlayerColor from '../player/player-team-color';
import { getCardClassColorFromSuit, getSuitName } from '@/app/lib/euchre/card-data';

type Props = {
  game: EuchreGameInstance;
  settings: EuchreSettings;
  handResult: EuchreHandResult | null;
  onClose: () => void;
  onReplayHand: () => void;
};

const BASE_CLASS = 'border dark:border-white text-center dark:bg-stone-900 dark:text-white p-1 mb-1';
export default function HandResults({ game, settings, handResult, onReplayHand, onClose }: Props) {
  if (!handResult) throw new Error('No hand result was found');
  if (!game.dealer) throw new Error('Dealer not found');
  if (!game.maker) throw new Error('Maker not found');
  let pointsDisplay: string = `Points for Team ${handResult.teamWon}: ${handResult.points}`;
  const winningTeamPlayer = game.gamePlayers.find((p) => p.team === handResult.teamWon);

  if (!winningTeamPlayer) throw new Error();

  if (winningTeamPlayer && winningTeamPlayer.team === game.maker.team) {
    pointsDisplay = `Points for Maker: ${handResult.points}`;
  } else {
    pointsDisplay = `Points for Defenders: ${handResult.points}`;
  }

  return (
    <GamePrompt className={`bg-stone-900`}>
      <div className="p-1">
        <h3 className="text-lg text-center font-bold text-yellow-200">Hand Results</h3>
        <div className="bg-green-950 p-1 border border-white">
          <div className="md:flex md:flex-row gap-1">
            <div className="md:min-w-48">
              <div className="border border-white mb-1">
                <PlayerColor player={game.maker} settings={settings}>
                  <div className="bg-stone-900 p-1 text-center">
                    Maker: {game.maker === game.player1 ? 'You' : game.maker.name}
                  </div>
                </PlayerColor>
              </div>
              <div className="border border-white mb-1">
                <PlayerColor player={game.dealer} settings={settings}>
                  <div className="bg-stone-900 p-1 text-center">
                    Dealer: {game.dealer === game.player1 ? 'You' : game.dealer.name}
                  </div>
                </PlayerColor>
              </div>
              <div className="border border-white mb-1">
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
                    <div className="border border-white w-full">
                      <PlayerColor player={t.taker ?? game.player1} settings={settings}>
                        <div className="bg-stone-900 p-1 text-center">Winner: {t.taker?.name}</div>
                      </PlayerColor>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <button
            onClick={onClose}
            className="border border-white bg-stone-900 hover:bg-amber-100 hover:text-black w-full mt-2"
          >
            Close
          </button>
          <button
            onClick={onReplayHand}
            className="border border-white bg-stone-900 hover:bg-amber-100 hover:text-black w-full mt-2"
          >
            Replay Hand
          </button>
        </div>
      </div>
    </GamePrompt>
  );
}
