import { getCardClassColorFromSuit } from '@/app/lib/euchre/card-data';
import { Suit } from '@/app/lib/euchre/definitions';
import clsx from 'clsx';

interface Props extends React.HtmlHTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  suit: Suit;
  value: string;
  isEnabled: boolean;
  defaultChecked: boolean;
  onSelectionChanged: (value: string) => void;
}
const buttonSvg =
  'checked:bg-none bg-none bg-[rgba(175, 175, 175, 0.8)] focus:outline-none focus:ring-2 focus:ring-red-500';

export default function PromptSelection({
  children,
  className,
  suit,
  value,
  isEnabled,
  defaultChecked,
  onSelectionChanged,
  ...rest
}: Props) {
  return (
    <div key={suit} className={clsx('flex relative items-center justify-center', className)} {...rest}>
      <div
        className={`absolute pointer-events-none ${getCardClassColorFromSuit(suit)} md:text-2xl text-xl font-bold`}
      >
        {children}
      </div>
      <input
        onChange={(e) => onSelectionChanged(e.target.value)}
        disabled={!isEnabled}
        defaultChecked={defaultChecked}
        type="radio"
        name="prompt-selection"
        value={value}
        className={`appearance-none ${isEnabled ? 'cursor-pointer hover:bg-amber-100' : ''} ${buttonSvg} border 
            rounded w-full md:h-8 h-6 inset-shadow-sm shadow-xl checked:bg-red-200 hover:checked:bg-red-200 focus:bg-amber-300 text-white 
            focus:active:bg-red-200 disabled:cursor-not-allowed checked:focus:bg-red-200`}
      />
    </div>
  );
}
