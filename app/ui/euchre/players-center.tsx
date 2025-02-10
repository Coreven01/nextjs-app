import { EuchrePlayer } from "@/app/lib/euchre/data"
import PlayerHand from "./player-hand";

type Props = {
    player: EuchrePlayer
    onCardClick: (src: string, dest: string, player: number) => void,
}


export default function PlayerCenter({ player, onCardClick }: Props) {

    const playerNum = player.playerNumber;

    return (
        <div className="flex flex-row items-center max-h-32">
            <PlayerHand
                hand={player.hand}
                location={playerNum === 1 || playerNum === 2 ? "center" : "side"}
                showHand={player.human}
                playerNum={playerNum}
                onCardClick={onCardClick} />
            <div className="bg-white">{player.hand.map(card => {
                return <span className={card.suit.color === "B" ? "text-black" : "text-red-500"} key={card.index}>{card.value.value} - {card.suit.suit} | </span>
            })}
                <span className="text-black">Team: {player.team} | Number: {player.playerNumber}</span>
            </div>
            { }
        </div>
    );
}