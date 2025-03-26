'use client';

import { EuchreGameInstance, EuchreHandResult, EuchreSettings } from '@/app/lib/euchre/definitions';
import GamePrompt from '../game/game-prompt';
import HandResult from './hand-result';
import clsx from 'clsx';

interface Props extends React.HtmlHTMLAttributes<HTMLDivElement> {
  game: EuchreGameInstance;
  settings: EuchreSettings;
  handResult: EuchreHandResult | null;
  onClose: () => void;
  onReplayHand: () => void;
}

export default function HandResults({
  game,
  settings,
  handResult,
  onReplayHand,
  onClose,
  className,
  ...rest
}: Props) {
  return (
    <GamePrompt zIndex={50} {...rest} className={clsx('bg-stone-800', className)}>
      <div className="p-1">
        <h3 className="md:text-lg text-sm text-center font-bold text-yellow-200">Hand Results</h3>
        <div className="p-1">
          <HandResult game={game} settings={settings} handResult={handResult}></HandResult>
          <div className="flex gap-1 md:text-base text-xs">
            <button
              onClick={onReplayHand}
              className="border border-white bg-red-950 hover:bg-amber-100 hover:text-black w-full mt-2"
            >
              Replay Hand
            </button>
            <button
              onClick={onClose}
              className="border border-white bg-stone-900 hover:bg-amber-100 hover:text-black w-full mt-2"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </GamePrompt>
  );
}
