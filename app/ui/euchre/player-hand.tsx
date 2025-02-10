import { getCardSvg } from "@/app/lib/euchre/card-data"
import { Card } from "@/app/lib/euchre/data"
import Image from "next/image";

type Props = {
    playerNum: number,
    hand: Card[],
    location: "center" | "side",
    showHand: boolean,
    onCardClick: (src: string, dest: string, player: number) => void,
}

export default function PlayerHand({ playerNum, hand, location, showHand, onCardClick }: Props) {

    const images: React.ReactNode[] = [];
    let index = 0;

    for (const card of hand) {
        const cardSvg: string = getCardSvg(card, location);
        const dynamicSvg = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cardSvg)}`;
        const cardBackSvg = location === "center" ? "/card-back.svg" : "/card-back-side.svg";
        const keyval = `${playerNum}${index}`;
        const cardval = `card-${playerNum}${index}`;

        images.push(<Image
            key={keyval}
            id={cardval}
            onClick={() => onCardClick(cardval, `player${playerNum}-played`, playerNum)}
            className={`contain relative transform duration-300 ease-in-out ${showHand ? "cursor-pointer" : ""}`}
            quality={100}
            width={100}
            height={150}
            src={showHand ? dynamicSvg : cardBackSvg}
            alt="Game Card" />);
        index++;
    }

    return (
        <>
            {images}
        </>
    )
}