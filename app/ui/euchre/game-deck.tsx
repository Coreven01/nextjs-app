import { Card } from "@/app/lib/euchre/data"
import Image from "next/image";

type Props = {
    deck: Card[],
}

export default function GameDeck({ deck }: Props) {

    const images: React.ReactNode[] = [];
    const width = 75;
    const height = 112.5;
    const cardBackSvg = "/card-back.svg";

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
                id={`deal-${index}`}
                key={index}
                className={`contain absolute top-0 left-0 transition duration-500 ease-in-out`}
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