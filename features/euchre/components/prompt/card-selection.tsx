import PromptSelection from './prompt-selection';
import { sortCardsIndices } from '../../util/game/cardDataUtil';
import { getCardFullName } from '../../util/game/cardSvgDataUtil';
import { Card } from '../../definitions/definitions';

interface SelectionProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  playerHand: Card[];
  onSelectionChanged?: (value: string) => void;
}

const CardSelection = ({ playerHand, onSelectionChanged, ...rest }: SelectionProps) => {
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
