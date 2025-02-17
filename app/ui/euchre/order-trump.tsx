'use client';

import { getEncodedCardSvg } from '@/app/lib/euchre/card-data';
import { BidResult, Card, Suit } from '@/app/lib/euchre/data';
import Image from 'next/image';
import { RefObject, useRef } from 'react';

type Props = {
    flipCard: Card | undefined,
    firstRound: boolean,
    onBidSubmit: (result: BidResult) => void,
}

export function OrderTrump({ flipCard, firstRound, onBidSubmit }: Props) {

    const bidSelection = useRef<HTMLDivElement | null>(null);
    const lonerSelection = useRef<HTMLInputElement | null>(null);

    const handleBidSubmit = (trumpOrdered: boolean) => {

        let suit: Suit | undefined;
        const isLoner = lonerSelection.current?.checked ?? false;
        const suitSelection = bidSelection.current?.querySelectorAll('input[type="radio"]:checked');

        if (suitSelection?.length) {
            suit = (suitSelection[0] as HTMLInputElement)?.value as Suit;
        }

        const result = { orderTrump: trumpOrdered, loner: isLoner, calledSuit: suit };

        onBidSubmit(result);
    }

    return (
        <div className="absolute left-0 top-0 h-full w-full bg-neutral-800 bg-opacity-20 flex items-center justify-center">
            <div className="min-h-32 min-w-32 border border-white rounded bg-orange-500 p-2">
                <div className="grid grid-rows-[165px,35px,35px] grid-cols-[80px,1fr] gap-1">
                    <Image
                        className={`contain row-span-1 col-span-1`}
                        quality={100}
                        width={75}
                        height={112.5}
                        src={flipCard ? getEncodedCardSvg(flipCard, "center") : "/card-back.svg"}
                        alt="Game Card" />

                    <SuitSelection ref={bidSelection} trumpSuit={flipCard?.suit} />
                    <input ref={lonerSelection} type='checkbox' className='col-span-2' />
                    <button onClick={() => handleBidSubmit(true)} className='border border-white rounded'>Order Up</button>
                    <button onClick={() => handleBidSubmit(false)} className='border border-white rounded'>Pass</button>
                </div>

            </div>
        </div>
    );
}

interface SelectionProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
    trumpSuit: Suit | undefined,
    ref: RefObject<HTMLDivElement | null>
}

function SuitSelection({ trumpSuit, ref, ...rest }: SelectionProps) {

    const suits: Suit[] = ["♠", "♥", "♦", "♣"];

    const buttonSvg = "checked:bg-none bg-none bg-[rgba(150,150,150,0.3)] focus:outline-none focus:ring-2 focus:ring-red-500";
    const retval: React.ReactNode[] = [];

    for (const suit of suits) {
        retval.push(
            <div key={suit} className='flex relative items-center justify-center'>
                <div className='absolute pointer-events-none text-red-800 text-2xl'>
                    {suit}
                </div>
                <input defaultChecked={suit === trumpSuit} type='radio' name='suit' value={suit} className={`appearance-none cursor-pointer border rounded w-24 h-8 ${buttonSvg} checked:dark:bg-yellow-500`} />
            </div>);
    }
    return (
        <div ref={ref} {...rest} className='flex flex-col gap-2'>
            {retval}
        </div>);
}