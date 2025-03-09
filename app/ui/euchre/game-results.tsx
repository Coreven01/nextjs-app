'use client';

import { EuchreHandResult } from '@/app/lib/euchre/definitions';

type Props = {
  gameResults: EuchreHandResult[] | null;
  onClose: () => void;
};

const BASE_CLASS =
  'border dark:border-white rounded text-center dark:bg-neutral-800 dark:text-white p-1 my-1';
export function GameResults({ gameResults, onClose }: Props) {
  if (!gameResults) throw new Error('No game results were found');

  return (
    <div className="absolute left-0 top-0 h-full w-full bg-neutral-800 bg-opacity-20 flex items-center justify-center">
      <div className="min-h-32 min-w-32 border border-white rounded bg-green-950 p-2">
        <div>
          <h3 className="text-lg text-center">Game Results</h3>

          <button onClick={onClose} className="border border-white rounded w-full mt-2">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
