import { EuchreError } from '@/app/hooks/euchre/useEuchreGame';
import GamePrompt from './game-prompt';
import clsx from 'clsx';
import PromptHeader from './prompt-header';

interface Props extends React.HtmlHTMLAttributes<HTMLDivElement> {
  errorState: EuchreError;
  onAttemptToRecover: () => void;
}
export default function GameErrorPrompt({ errorState, onAttemptToRecover, className, ...rest }: Props) {
  return (
    <GamePrompt {...rest} zIndex={50} className={clsx('bg-stone-800', className)}>
      <div className="p-1 min-w-16 min-h-16">
        <PromptHeader>Error</PromptHeader>
        <div>{errorState.message}</div>
        <button onClick={onAttemptToRecover}>Attempt To Recover</button>
      </div>
    </GamePrompt>
  );
}
