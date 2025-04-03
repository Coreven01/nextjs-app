import Switch from '@mui/material/Switch';

type Props = {
  seconds: number;
  bombsLeft: number;
  hintsLeft: number;
  hintActivated: boolean;
  onActivateHint: () => void;
};

export default function GameInfo({ seconds, bombsLeft, hintsLeft, hintActivated, onActivateHint }: Props) {
  return (
    <div className="flex gap-10 items-center justify-center">
      <div className="min-w-28">Time: {seconds}</div>
      <div className={`mt-3 md:mt-0`}>Remaining: {bombsLeft}</div>
      <div className={`mt-3 md:mt-0`}>Hints: {hintsLeft}</div>
      <div>
        <label htmlFor="activateHint">Activate Hint</label>
        <Switch id="activateHint" checked={hintActivated} onChange={onActivateHint}></Switch>
      </div>
    </div>
  );
}
