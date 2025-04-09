import { Card } from '@/app/lib/euchre/definitions';
import PromptSelection from './prompt-selection';
import useCardSvgData from '@/app/hooks/euchre/data/useCardSvgData';

interface SelectionProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  playerHand: Card[];
  onSelectionChanged?: (value: string) => void;
}

export default function CardSelection({ playerHand, onSelectionChanged, ...rest }: SelectionProps) {
  const { getCardFullName } = useCardSvgData();

  return (
    <div {...rest} className="flex flex-col md:gap-2 gap-1">
      {playerHand.map((card, index) => {
        return (
          <PromptSelection
            key={index}
            isEnabled={onSelectionChanged ? true : false}
            defaultChecked={false}
            value={`${index}`}
            onSelectionChanged={onSelectionChanged ?? ((s) => null)}
            suit={card.suit}
            title={getCardFullName(card)}
          >
            {card.value}-{card.suit}
          </PromptSelection>
        );
      })}
    </div>
  );
}
