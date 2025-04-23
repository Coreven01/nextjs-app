import { Card } from '@/app/lib/euchre/definitions';
import PromptSelection from './prompt-selection';
import useCardSvgData from '@/app/hooks/euchre/data/useCardSvgData';
import useCardData from '../../../hooks/euchre/data/useCardData';

interface SelectionProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  playerHand: Card[];
  onSelectionChanged?: (value: string) => void;
}

const CardSelection = ({ playerHand, onSelectionChanged, ...rest }: SelectionProps) => {
  const { getCardFullName } = useCardSvgData();
  const { sortCardsIndices } = useCardData();
  const orderedCards = sortCardsIndices(playerHand, null);

  return (
    <div className="flex flex-col lg:gap-2 gap-1" {...rest}>
      {orderedCards.map((position) => {
        const card: Card = playerHand[position.cardIndex];
        return (
          <PromptSelection
            key={position.cardIndex}
            isEnabled={onSelectionChanged ? true : false}
            defaultChecked={false}
            value={`${position.cardIndex}`}
            onSelectionChanged={onSelectionChanged ?? (() => null)}
            suit={card.suit}
            title={getCardFullName(card)}
          >
            {card.value}-{card.suit}
          </PromptSelection>
        );
      })}
    </div>
  );
};

export default CardSelection;
