'use client';

import { getEncodedCardSvg } from '@/app/lib/euchre/card-data';
import { Card, Suit } from '@/app/lib/euchre/definitions';
import Image from 'next/image';
import { RefObject, useRef } from 'react';

type Props = {
  pickedUpCard: Card;
  playerHand: Card[];
  onDiscardSubmit: (discard: Card) => void;
};

export function DiscardPrompt({ pickedUpCard, playerHand, onDiscardSubmit }: Props) {
  const discardSelection = useRef<HTMLDivElement | null>(null);

  const handleDiscardSubmit = () => {
    let card: Card | undefined;
    // const isLoner = lonerSelection.current?.checked ?? false;
    const cardSelection = discardSelection.current?.querySelectorAll('input[type="radio"]:checked');
    if (cardSelection?.length) {
      const selectedIndex = parseInt((cardSelection[0] as HTMLInputElement)?.value);
      card = playerHand[selectedIndex];
    }

    if (card) onDiscardSubmit(card);
  };

  return (
    <div className="absolute left-0 top-0 h-full w-full bg-neutral-800 bg-opacity-20 flex items-center justify-center">
      <div className="min-h-32 min-w-32 border border-white rounded bg-orange-500 p-2">
        <div className="grid grid-rows-[1fr,35px] grid-cols-[80px,1fr] gap-1">
          <Image
            className={`contain`}
            quality={100}
            width={75}
            height={112.5}
            src={getEncodedCardSvg(pickedUpCard, 'center')}
            alt="Game Card"
          />
          <CardSelection ref={discardSelection} playerHand={playerHand} />
          <button
            onClick={() => handleDiscardSubmit()}
            className="border border-white rounded col-span-2"
          >
            Discard Selected
          </button>
        </div>
      </div>
    </div>
  );
}

interface SelectionProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  playerHand: Card[];
  ref: RefObject<HTMLDivElement | null>;
}

function CardSelection({ playerHand, ref, ...rest }: SelectionProps) {
  const suits: Suit[] = ['♠', '♥', '♦', '♣'];

  const buttonSvg =
    'checked:bg-none bg-none bg-[rgba(150,150,150,0.3)] focus:outline-none focus:ring-2 focus:ring-red-500';
  const retval: React.ReactNode[] = [];
  let counter = 0;

  for (const card of playerHand) {
    retval.push(
      <div key={card.cardId} className="flex relative items-center justify-center">
        <input
          type="radio"
          name="suit"
          value={counter}
          className={`appearance-none cursor-pointer border rounded w-24 h-8 ${buttonSvg} checked:dark:bg-yellow-500`}
        />
        {card.value}-{card.suit}
      </div>
    );
    counter++;
  }

  return (
    <div ref={ref} {...rest} className="flex flex-col gap-2">
      {retval}
    </div>
  );
}
