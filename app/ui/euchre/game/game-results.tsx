'use client';

import { EuchreGameInstance, EuchreHandResult, EuchreSettings } from '@/app/lib/euchre/definitions';
import HandResult from '../prompt/hand-result';
import { useState } from 'react';

type Props = {
  game: EuchreGameInstance;
  settings: EuchreSettings;
  gameResults: EuchreHandResult[] | null;
  onClose: () => void;
  onReplayHand: () => void;
};

export default function GameResults({ game, settings, gameResults, onReplayHand, onClose }: Props) {
  const [selection, setSelection] = useState(0);

  if (!gameResults) throw new Error('No game results were found');

  return (
    <div className="absolute left-0 top-0 h-full w-full bg-neutral-800 bg-opacity-20 flex items-center justify-center">
      <div className="min-h-32 min-w-32 border border-white bg-green-950 p-2">
        <div>
          <h3 className="text-lg text-center">Game Results</h3>
          <div>
            <button>Overview</button>
          </div>
          <HandResult game={game} settings={settings} handResult={gameResults[0]}></HandResult>
          <button onClick={onClose} className="border border-white w-full mt-2">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
