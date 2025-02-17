import { Card, EuchreGameInstance, EuchrePlayer } from "@/app/lib/euchre/data"
import PlayerHand from "./player-hand";
import PlayerInfo from "./player-info";
import GameDeck from "./game-deck";

type Props = {
    player: EuchrePlayer
    game: EuchreGameInstance,
    cardsVisible: boolean,
    dealDeck: Card[],
    deckVisible: boolean,
    location: "center" | "side",
    onCardClick: (src: string, dest: string, player: number) => void,
}


export default function PlayerGameDeck({ player, game, cardsVisible, dealDeck, deckVisible, location, onCardClick }: Props) {

    const playerNumber = player.playerNumber;
    const positionCenter = `absolute ${playerNumber === 1 ? "bottom-0" : "top-0"}`;
    const positionSide = `absolute ${playerNumber === 3 ? "left-0" : "right-0"}`
    const position = location === "center" ? positionCenter : positionSide;

    const onValidClick = game.currentPlayer === player ? onCardClick : () => null;

    const gameDeck = deckVisible ? <div id={`game-deck-${playerNumber}`} className={position}><GameDeck deck={dealDeck} location={location} /></div> : <></>;
    const classForLocation = `${location === "side" ? "flex-col" : ""} ${playerNumber === 1 || playerNumber === 4 ? "items-end" : ""}`.trim();
    const playerInfoClass = `${location === "side" ? "w-full" : ""}`

    return (
        <>
            <div className={`flex ${classForLocation} h-full justify-center relative`}>
                <PlayerHand
                    hand={cardsVisible ? player.hand : player.placeholder}
                    location={location}
                    showHand={player.human}
                    playerNum={playerNumber}
                    cardsVisible={cardsVisible}
                    onCardClick={onValidClick} />
                <div id={`player-base-${playerNumber}`} className={position}>
                    X
                </div>
                {gameDeck}
                <div className={playerInfoClass}>
                    <PlayerInfo game={game} player={player} />
                </div>
            </div>
        </>
    );
}