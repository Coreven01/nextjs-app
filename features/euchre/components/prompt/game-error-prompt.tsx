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
  return (
    <GamePrompt {...rest} zIndex={50} className={clsx('bg-stone-900', className)}>
      <div className="p-2 min-w-16 min-h-16">
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
            {errorState.message}
          </div>
          <GameButton type="warn" onClick={onAttemptToRecover}>
            Attempt To Recover
          </GameButton>
        </div>
      </div>
    </GamePrompt>
  );
}
