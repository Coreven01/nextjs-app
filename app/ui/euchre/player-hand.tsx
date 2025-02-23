import { getEncodedCardSvg } from "@/app/lib/euchre/card-data"
import { Card, EuchrePlayer } from "@/app/lib/euchre/data"
import { GameState } from "@/app/lib/euchre/gameStateReducer";
import Image from "next/image";

type Props = {
    gameState: GameState
    player: EuchrePlayer,
    location: "center" | "side",
    onCardClick: (src: string, dest: string, card: Card) => void,
}

export default function PlayerHand({ gameState, player, location, onCardClick }: Props) {

    const shouldShowHandImages = gameState.shouldShowHandImages.find(c => c.player === player)?.value;
    const shouldShowHandValues = gameState.shouldShowHandValues.find(c => c.player === player)?.value;

    if (shouldShowHandImages && player.hand.length === 0 && player.placeholder.length === 0)
        throw Error("Unable to show hand. No cards dealt.");
    
    const handValues: Card[] = player.hand.length === 0 ? player.placeholder : player.hand;
    const images: React.ReactNode[] = [];
    const activeClasses = shouldShowHandImages && player.human ? "cursor-pointer shadow-sm hover:scale-[1.15] hover:shadow-md hover:shadow-yellow-300 hover:z-10" : "";
    const width = location === "center" ? 75 : 112.5;
    const height = location === "center" ? 112.5 : 75;
    const hidden = !shouldShowHandImages ? "invisible" : "";
    const cardBackSvg = location === "center" ? "/card-back.svg" : "/card-back-side.svg";

    let index = 0;

    for (const card of handValues) {
        const keyval = `${player.playerNumber}${index}`;
        const cardval = `card-${keyval}`;

        images.push(
            <div className={`relative ${hidden}`} key={keyval}>
                <Image
                    id={cardval}
                    onClick={() => onCardClick(cardval, `player${player.playerNumber}-region`, player.hand[0])}
                    className={`contain relative transition duration-300 ease-in-out ${activeClasses}`}
                    quality={100}
                    width={width}
                    height={height}
                    src={shouldShowHandValues ? getEncodedCardSvg(card, location) : cardBackSvg}
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