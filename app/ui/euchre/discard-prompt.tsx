'use client';

import { getEncodedCardSvg } from '@/app/lib/euchre/card-data';
import { Card, Suit } from '@/app/lib/euchre/data';
import Image from 'next/image';
import { RefObject, useRef } from 'react';

type Props = {
    pickedUpCard: Card,
    playerHand: Card[]
    onDiscardSubmit: (discard: Card) => void,
}

export function DiscardPrompt({ pickedUpCard, playerHand, onDiscardSubmit }: Props) {

    const bidSelection = useRef<HTMLDivElement | null>(null);
    const lonerSelection = useRef<HTMLInputElement | null>(null);

    const handleDiscardSubmit = (trumpOrdered: boolean) => {

        // let suit: Suit | undefined;
        // const isLoner = lonerSelection.current?.checked ?? false;
        // const suitSelection = bidSelection.current?.querySelectorAll('input[type="radio"]:checked');

        // if (suitSelection?.length) {
        //     suit = (suitSelection[0] as HTMLInputElement)?.value as Suit;
        // }

        // const result = { orderTrump: trumpOrdered, loner: isLoner, calledSuit: firstRound ? undefined : suit };

        // onBidSubmit(result);
    }

    return (
        <div className="absolute left-0 top-0 h-full w-full bg-neutral-800 bg-opacity-20 flex items-center justify-center">
            <div className="min-h-32 min-w-32 border border-white rounded bg-orange-500 p-2">
                <div className="grid grid-rows-[165px,35px] grid-cols-[80px,1fr] gap-1">
                    <Image
                        className={`contain row-span-1 col-span-1`}
                        quality={100}
                        width={75}
                        height={112.5}
                        src={getEncodedCardSvg(pickedUpCard, "center")}
                        alt="Game Card" />

                    <CardSelection ref={bidSelection} playerHand={playerHand} />
                    <input ref={lonerSelection} type='checkbox' className='col-span-2' />
                    <button onClick={() => handleDiscardSubmit(true)} className='border border-white rounded'>Order Up</button>
                </div>

            </div>
        </div>
    );
}

interface SelectionProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
    playerHand: Card[],
    ref: RefObject<HTMLDivElement | null>
}

function CardSelection({ playerHand, ref, ...rest }: SelectionProps) {

    const suits: Suit[] = ["♠", "♥", "♦", "♣"];

    const buttonSvg = "checked:bg-none bg-none bg-[rgba(150,150,150,0.3)] focus:outline-none focus:ring-2 focus:ring-red-500";
    const retval: React.ReactNode[] = [];

    for (const card of playerHand) {
        retval.push(
            <div key={card.dealId} className='flex relative items-center justify-center'>
                <input type='radio' name='suit' value={card.dealId} className={`appearance-none cursor-pointer border rounded w-24 h-8 ${buttonSvg} checked:dark:bg-yellow-500`} />
            </div>);
    }
    return (
        <div ref={ref} {...rest} className='flex flex-col gap-2'>
            {retval}
        </div>);
}