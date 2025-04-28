'use client';

import { EuchreGameInstance, EuchreSettings } from '@/app/lib/euchre/definitions/game-state-definitions';
import GamePrompt from './game-prompt';
import HandResult from './hand-result';
import clsx from 'clsx';
import PromptHeader from './prompt-header';
import { EuchreHandResult } from '../../../lib/euchre/definitions/definitions';

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
        <PromptHeader>Hand Results</PromptHeader>
        <div className="p-1">
          <HandResult game={game} settings={settings} handResult={handResult}></HandResult>
          <div className="h-8 flex gap-1 lg:text-base text-xs">
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
