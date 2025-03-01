import { getEncodedCardSvg } from "@/app/lib/euchre/card-data"
import { CARD_HEIGHT, CARD_WIDTH } from "@/app/lib/euchre/constants";
import { Card, EuchrePlayer } from "@/app/lib/euchre/data"
import { getPlayerAndCard } from "@/app/lib/euchre/game";
import { GameState } from "@/app/lib/euchre/gameStateReducer";
import Image from "next/image";

type Props = {
    gameState: GameState
    player: EuchrePlayer,
    location: "center" | "side",
    onCardClick: (player: EuchrePlayer, card: Card) => void,
}

export default function PlayerHand({ gameState, player, location, onCardClick }: Props) {

    const shouldShowHandImages = gameState.shouldShowHandImages.find(c => c.player === player)?.value;
    const shouldShowHandValues = gameState.shouldShowHandValues.find(c => c.player === player)?.value;

    if (shouldShowHandImages && player.hand.length === 0 && player.placeholder.length === 0)
        throw Error("Unable to show hand. No cards dealt.");

    const handValues: Card[] = player.hand.length === 0 ? player.placeholder : player.hand;
    const images: React.ReactNode[] = [];
    const activeClasses = shouldShowHandImages && player.human ? "cursor-pointer shadow-sm hover:scale-[1.15] hover:shadow-md hover:shadow-yellow-300 hover:z-10" : "";
    const width = location === "center" ? CARD_WIDTH : CARD_HEIGHT;
    const height = location === "center" ? CARD_HEIGHT : CARD_WIDTH;
    const hidden = !shouldShowHandImages ? "invisible" : "";
    const cardBackSvg = location === "center" ? "/card-back.svg" : "/card-back-side.svg";

    let index = 0;

    const handleCardClick = (srcElementId: string, player: EuchrePlayer) => {

        const cardInfo = getPlayerAndCard(srcElementId)
        const card = player.hand[cardInfo.index];
        onCardClick(player, card);

    }

    for (const card of handValues) {
        const keyval = `${player.playerNumber}${index}`;
        const cardval = `card-${keyval}`;

        images.push(
            <div className={`relative ${hidden}`} key={keyval}>
                <Image
                    id={cardval}
                    onClick={() => handleCardClick(cardval, player)}
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