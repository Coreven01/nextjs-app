import { useState } from 'react';
import GamePrompt from './game-prompt';
import clsx from 'clsx';
import GameBorder from '../game/game-border';
import CardSelection from './card-selection';
import PromptHeader from './prompt-header';
import GameButton from '../common/game-button';
import { Card } from '../../definitions/definitions';
import PlayingCardFace from '../common/playing-card-face';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  pickedUpCard: Card;
  playerHand: Card[];
  onDiscardSubmit: (discard: Card) => void;
}

export default function DiscardPrompt({
  pickedUpCard,
  playerHand,
  onDiscardSubmit,
  className,
  ...rest
}: DivProps) {
  const [discardSelection, setDiscardSelection] = useState<string | null>(null);
  const submitEnabled = discardSelection !== null;

  const handleDiscardSubmit = () => {
    let card: Card | undefined;
    const cardSelection = discardSelection;
    if (cardSelection?.length) {
      const selectedIndex = parseInt(cardSelection);
      card = playerHand[selectedIndex];
    }

    if (card) onDiscardSubmit(card);
  };

  const handleSelectionChanged = (value: string) => {
    setDiscardSelection(value);
  };

  return (
    <GamePrompt {...rest} zIndex={50} className={clsx('bg-green-950', className)}>
      <div className="bg-stone-900 p-1">
        <div className="grid grid-rows-[28px,1fr,auto] grid-cols-[auto,100px] gap-1">
          <div
            title={`Choose which card to discard`}
            className="flex items-center justify-center col-span-2 cursor-default"
          >
            <PromptHeader>Choose Discard</PromptHeader>
          </div>
          <div>
            <div className="mb-2 text-center lg:text-base text-xs">Picked up card</div>
            <GameBorder className="w-full min-w-28 lg:w-32" size="small">
              <div className="p-2 bg-green-950 flex items-center justify-center">
                <PlayingCardFace
                  suit={pickedUpCard.suit}
                  value={pickedUpCard.value}
                  addOverlay={false}
                  className="block"
                />
              </div>
            </GameBorder>
          </div>

          <div className="p-1 justify-center mt-2">
            <CardSelection onSelectionChanged={handleSelectionChanged} playerHand={playerHand} />
          </div>
          <GameButton
            className="w-full col-span-2 mt-1"
            type="success"
            onClick={handleDiscardSubmit}
            disabled={!submitEnabled}
          >
            Discard Selected
          </GameButton>
        </div>
      </div>
    </GamePrompt>
  );
}
