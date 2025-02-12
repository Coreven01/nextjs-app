import { Card, EuchreGameInstance, EuchrePlayer } from "@/app/lib/euchre/data"
import PlayerHand from "./player-hand";
import PlayerInfo from "./player-info";
import GameDeck from "./game-deck";

type Props = {
    player: EuchrePlayer
    game: EuchreGameInstance,
    displayCards: boolean,
    dealDeck: Card[],
    location: "center" | "side",
    onCardClick: (src: string, dest: string, player: number) => void,
}


export default function PlayerGameDeck({ player, game, displayCards, dealDeck, location, onCardClick }: Props) {

    const playerNumber = player.playerNumber;
    const positionCenter = `absolute left-auto ${playerNumber === 1 ? "bottom-0" : "top-0"}`;
    const positionSide = `absolute top-auto ${playerNumber === 3 ? "left-0" : "right-0"}`
    const position = location === "center" ? positionCenter : positionSide;

    const onValidClick = game.currentPlayer === player ? onCardClick : () => null;
    const showDeck = player.playerNumber === game.dealer?.playerNumber;
    const gameDeck =  showDeck ? <div id={`game-deck-${playerNumber}`} className={position}><GameDeck deck={dealDeck} /></div> : <></>;
    const classForLocation = `${location === "side" ? "flex-col" : ""} ${playerNumber === 1 || playerNumber ===4 ? "items-end" : ""}`;
    
    return (
        <div className={`flex ${classForLocation} h-full justify-center relative`}>
            <PlayerHand
                hand={player.hand}
                location={location}
                showHand={player.human}
                playerNum={playerNumber}
                displayCards={displayCards}
                onCardClick={onValidClick} />
            <div id={`player-base-${playerNumber}`} className={position}>X</div>
            {gameDeck}
            <PlayerInfo game={game} player={player} />
        </div>
    );
}