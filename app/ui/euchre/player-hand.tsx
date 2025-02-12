import {  getEncodedCardSvg } from "@/app/lib/euchre/card-data"
import { Card } from "@/app/lib/euchre/data"
import Image from "next/image";

type Props = {
    playerNum: number,
    hand: Card[],
    location: "center" | "side",
    showHand: boolean,
    displayCards: boolean,
    onCardClick: (src: string, dest: string, player: number) => void,
}

export default function PlayerHand({ playerNum, hand, location, showHand, displayCards, onCardClick }: Props) {

    const images: React.ReactNode[] = [];
    let index = 0;

    for (const card of hand) {
        const dynamicSvg: string = getEncodedCardSvg(card, location);
        const cardBackSvg = location === "center" ? "/card-back.svg" : "/card-back-side.svg";
        const keyval = `${playerNum}${index}`;
        const cardval = `card-${playerNum}${index}`;
        const activeClasses = showHand ? "cursor-pointer shadow-sm hover:scale-[1.15] hover:shadow-md hover:shadow-yellow-300 hover:z-10" : "";
        const width = location === "center" ? 75 : 112.5;
        const height = location === "center" ? 112.5 : 75;
        const hidden = !displayCards ? "invisible" : "";

        images.push(
            <div className={`relative ${hidden}`} key={keyval}>
                <Image
                    id={cardval}
                    onClick={() => onCardClick(cardval, `player${playerNum}-region`, playerNum)}
                    className={`contain relative transition duration-300 ease-in-out ${activeClasses}`}
                    quality={100}
                    width={width}
                    height={height}
                    src={showHand ? dynamicSvg : cardBackSvg}
                    alt="Game Card" />
            </div>
        );
        index++;
    }

    return (
        <>
            {images}
        </>
    )
}