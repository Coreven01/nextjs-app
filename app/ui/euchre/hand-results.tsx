'use client';

import { EuchreHandResult } from '@/app/lib/euchre/data';
import HandResultDetail from './hand-result-detail';

type Props = {
  handResult: EuchreHandResult | null;
  onClose: () => void;
};

const BASE_CLASS =
  'border dark:border-white rounded text-center dark:bg-neutral-800 dark:text-white p-1 my-1';
export function HandResults({ handResult, onClose }: Props) {
  if (!handResult) throw new Error('No hand result was found');

  return (
    <div className="absolute left-0 top-0 h-full w-full bg-neutral-800 bg-opacity-20 flex items-center justify-center">
      <div className="min-h-32 min-w-32 border border-white rounded bg-green-950 p-2">
        <div>
          <h3 className="text-lg text-center">Hand Results</h3>
          <div className="md:flex md:flex-row gap-1">
            <div className="md:min-w-48">
              <div className={`${BASE_CLASS}`}>
                Dealer: {handResult.dealer.name} ({handResult.dealer.team})
              </div>
              <div className={`${BASE_CLASS}`}>
                Maker: {handResult.maker.name} ({handResult.maker.team})
              </div>
              <div className={`${BASE_CLASS}`}>Went Alone: {handResult.loner ? 'Yes' : 'No'}</div>
              <div className={`${BASE_CLASS}`}>Trump: {handResult.trump.suit}</div>
              <div className={`${BASE_CLASS}`}>
                Named By Suit: {handResult.trumpWasNamed ? 'Yes' : 'No'}
              </div>
              <div className={`${BASE_CLASS}`}>
                Points for Team {handResult.teamWon}: {handResult.points}
              </div>
            </div>
            <div>
              {handResult.tricks.map((t) => {
                return (
                  <div
                    key={`${t.round}-${t.cardsPlayed.map((c) => `${c.player.playerNumber}-${c.card.index}`).join('')}`}
                    className={`flex items-center ${BASE_CLASS}`}
                  >
                    <HandResultDetail cardsPlayed={t.cardsPlayed} playerWon={t.taker} />
                    <div>
                      <div>
                        Winner: {t.taker?.name} ({t.taker?.team})
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <button onClick={onClose} className="border border-white rounded w-full mt-2">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
