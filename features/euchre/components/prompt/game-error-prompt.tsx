import GamePrompt from './game-prompt';
import clsx from 'clsx';
import PromptHeader from './prompt-header';

import GameButton from '../common/game-button';
import { EuchreError } from '../../definitions/game-state-definitions';

interface Props extends React.HtmlHTMLAttributes<HTMLDivElement> {
  errorState: EuchreError;
  onAttemptToRecover: () => void;
}

export default function GameErrorPrompt({ errorState, onAttemptToRecover, className, ...rest }: Props) {
  const handleAttemptToRecover = () => {
    onAttemptToRecover();
  };
  const handleClose = () => {};

  return (
    <GamePrompt {...rest} zIndex={50} className={clsx('bg-stone-900', className)}>
      <div className="p-2 min-w-16 min-h-16 max-w-xl">
        <PromptHeader>Error</PromptHeader>
        <div className="flex flex-col gap-3 mt-3">
          <div>
            <label>ID: </label>
            {errorState.id}
          </div>
          <div>
            <label>Time: </label>
            {`${errorState.time.toLocaleDateString()} - ${errorState.time.toLocaleTimeString()}`}
          </div>
          <div>
            <label>Message: </label>
            <div className="border dark:border-white dark:bg-black p-2">{errorState.message}</div>
          </div>
          <div className="flex gap-1">
            <GameButton className="grow" type="danger" onClick={handleClose}>
              Close
            </GameButton>
            <GameButton className="grow" type="warn" onClick={handleAttemptToRecover}>
              Attempt To Recover
            </GameButton>
          </div>
        </div>
      </div>
    </GamePrompt>
  );
}
