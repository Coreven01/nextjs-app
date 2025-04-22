import { Card } from '@/app/lib/euchre/definitions';
import Image from 'next/image';
import { useState } from 'react';
import GamePrompt from './game-prompt';
import clsx from 'clsx';
import GameBorder from '../game/game-border';
import CardSelection from './card-selection';
import useCardSvgData from '@/app/hooks/euchre/data/useCardSvgData';
import useCardData from '@/app/hooks/euchre/data/useCardData';
import PromptHeader from './prompt-header';

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
  const { getCardFullName, getEncodedCardSvg } = useCardSvgData();
  const { getDisplayHeight, getDisplayWidth } = useCardData();
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
            <GameBorder innerClass="w-20 lg:w-full" size="small">
              <div className="p-2 bg-green-950 flex items-center justify-center">
                <Image
                  className={`contain row-span-1 col-span-1`}
                  quality={100}
                  width={getDisplayWidth('center')}
                  height={getDisplayHeight('center')}
                  src={getEncodedCardSvg(pickedUpCard, 'center')}
                  alt={getCardFullName(pickedUpCard)}
                  title={getCardFullName(pickedUpCard)}
                  style={{
                    width: '100%',
                    height: 'auto'
                  }}
                  draggable={false}
                />
              </div>
            </GameBorder>
          </div>

          <div className="p-1 justify-center mt-2">
            <CardSelection onSelectionChanged={handleSelectionChanged} playerHand={playerHand} />
          </div>

          <button
            onClick={() => handleDiscardSubmit()}
            className="h-6 col-span-2 w-full border border-white bg-green-950 hover:bg-amber-100 hover:text-black disabled:hover:bg-inherit disabled:cursor-not-allowed disabled:text-gray-500 lg:text-base text-xs"
            disabled={!submitEnabled}
          >
            Discard Selected
          </button>
        </div>
      </div>
    </GamePrompt>
  );
}
