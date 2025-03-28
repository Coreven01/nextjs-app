import { Card } from '@/app/lib/euchre/definitions';
import PromptSelection from './prompt-selection';
import { getCardFullName } from '@/app/lib/euchre/card-data';

interface SelectionProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  playerHand: Card[];
  onSelectionChanged?: (value: string) => void;
}

export default function CardSelection({ playerHand, onSelectionChanged, ...rest }: SelectionProps) {
  return (
    <div {...rest} className="flex flex-col gap-2">
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
