import { CARD_HEIGHT, CARD_WIDTH } from "@/app/lib/euchre/constants";
import { Card } from "@/app/lib/euchre/data"
import Image from "next/image";

type Props = {
    deck: Card[],
    location: "center" | "side"
}

export default function GameDeck({ deck, location }: Props) {

    const images: React.ReactNode[] = [];
    const width = location === "center" ? CARD_WIDTH : CARD_HEIGHT;
    const height = location === "center" ? CARD_HEIGHT : CARD_WIDTH;
    const cardBackSvg = location === "center" ? "/card-back.svg": "/card-back-side.svg";

    const dummyCard = <Image
        key={`deal-dummy`}
        id={`deal-dummy`}
        className={`contain`}
        quality={100}
        width={width}
        height={height}
        src={cardBackSvg}
        alt="Game Card" />;

    images.push(dummyCard);

    let index = 0;

    for (const card of deck) {

        images.push(
            <Image
                id={card.dealId}
                key={index}
                className={`contain absolute top-0 left-0 transition duration-500 ease-in-out h-full`}
                quality={100}
                width={width}
                height={height}
                src={cardBackSvg}
                alt="Game Card" />
        );
        index++;
    }

    return (
        <>
            {images}
        </>
    )
}