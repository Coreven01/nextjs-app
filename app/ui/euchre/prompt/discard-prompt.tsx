'use client';

import { getCardFullName, getEncodedCardSvg } from '@/app/lib/euchre/card-data';
import { Card } from '@/app/lib/euchre/definitions';
import Image from 'next/image';
import { useState } from 'react';
import PromptSelection from './prompt-selection';
import GamePrompt from '../game/game-prompt';
import clsx from 'clsx';

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
    <GamePrompt {...rest} className={clsx('bg-green-950', className)}>
      <div className="bg-stone-900 p-2">
        <div className="grid grid-rows-[28px,1fr,30px] grid-cols-[130px,100px] gap-1">
          <div
            title={`Choose which card to discard`}
            className="flex items-center justify-center col-span-2 cursor-default"
          >
            <h2 className="text-yellow-200 font-bold">Choose Discard</h2>
          </div>
          <div className="p-2 bg-green-950 flex flex-col items-center justify-center border border-white">
            <div className="mb-2">Picked up card</div>
            <Image
              className={`contain row-span-1 col-span-1`}
              quality={100}
              width={pickedUpCard.getDisplayWidth('center')}
              height={pickedUpCard.getDisplayHeight('center')}
              src={getEncodedCardSvg(pickedUpCard, 'center')}
              alt={getCardFullName(pickedUpCard)}
              title={getCardFullName(pickedUpCard)}
            />
          </div>
          <div className="p-1 justify-center">
            <CardSelection onSelectionChanged={handleSelectionChanged} playerHand={playerHand} />
          </div>

          <button
            onClick={() => handleDiscardSubmit()}
            className="col-span-2 border border-white bg-green-950 hover:bg-amber-100 hover:text-black disabled:hover:bg-inherit disabled:cursor-not-allowed disabled:text-gray-500"
            disabled={!submitEnabled}
          >
            Discard Selected
          </button>
        </div>
      </div>
    </GamePrompt>
  );
}

interface SelectionProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  playerHand: Card[];
  onSelectionChanged: (value: string) => void;
}

function CardSelection({ playerHand, onSelectionChanged, ...rest }: SelectionProps) {
  return (
    <div {...rest} className="flex flex-col gap-2">
      {playerHand.map((card, index) => {
        return (
          <PromptSelection
            key={index}
            isEnabled={true}
            defaultChecked={false}
            value={`${index}`}
            onSelectionChanged={onSelectionChanged}
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
