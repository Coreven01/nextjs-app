import GamePrompt from './game-prompt';
import HandResult from './hand-result';
import clsx from 'clsx';
import PromptHeader from './prompt-header';

import GameButton from '../common/game-button';
import { EuchreHandResult } from '../../definitions/definitions';
import { EuchreGameInstance, EuchreSettings } from '../../definitions/game-state-definitions';

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
    <GamePrompt zIndex={50} {...rest} className={clsx('bg-stone-900', className)}>
      <div className="p-1">
        <PromptHeader>Hand Results</PromptHeader>
        <div className="p-1">
          <HandResult game={game} settings={settings} handResult={handResult}></HandResult>
          <div className="flex gap-1 lg:text-base text-xs">
            {settings.debugEnableDebugMenu && (
              <GameButton className="w-full" type="danger" onClick={onReplayHand}>
                Replay Hand
              </GameButton>
            )}
            <GameButton className="w-full" type="primary" onClick={onClose}>
              Close
            </GameButton>
          </div>
        </div>
      </div>
    </GamePrompt>
  );
}
