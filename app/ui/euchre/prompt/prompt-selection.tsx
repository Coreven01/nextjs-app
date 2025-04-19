import useCardSvgData from '@/app/hooks/euchre/data/useCardSvgData';
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

const PromptSelection = ({
  children,
  className,
  suit,
  value,
  isEnabled,
  defaultChecked,
  onSelectionChanged,
  ...rest
}: Props) => {
  const { getCardClassColorFromSuit } = useCardSvgData();

  return (
    <div key={suit} className={clsx('flex relative items-center justify-center', className)} {...rest}>
      <div
        className={clsx(
          `absolute pointer-events-none lg:text-2xl text-xl font-bold`,
          getCardClassColorFromSuit(suit)
        )}
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
        className={clsx(
          `appearance-none border 
            rounded w-full lg:h-8 h-6 inset-shadow-sm shadow-xl checked:bg-red-200 hover:checked:bg-red-200 text-white checked:hover:border-red-600
            focus:active:bg-red-200 disabled:cursor-not-allowed checked:focus:bg-red-200 checked:border checked:border-red-600`,
          buttonSvg,
          { 'cursor-pointer hover:bg-amber-100': isEnabled }
        )}
      />
    </div>
  );
};

export default PromptSelection;
