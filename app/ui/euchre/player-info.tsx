import { EuchreGameInstance, EuchrePlayer } from "@/app/lib/euchre/data"

type Props = {
    player: EuchrePlayer,
    game: EuchreGameInstance
}

export default function PlayerInfo({ player, game }: Props) {

    const dealerInfo: React.ReactNode = player === game.dealer ? <div className="text-yellow">Dealer</div> : <div></div>
    const tricksTaken = game.gameTricks.filter((t) => t.filter((t2) => t2.playerWon === player)).length;

    return (
        <>
            <div className="rounded border rounded-xl dark:border-white p-2 m-2">
                <div>
                    {player.name} - Team: {player.team}
                </div>
                <div>
                    Tricks {tricksTaken}/10
                </div>
                {dealerInfo}
            </div>
            <div className="bg-white">{player.hand.map(card => {
                return <span className={card.suit.color === "B" ? "text-black" : "text-red-500"} key={card.index}>{card.value.value} - {card.suit.suit} | </span>
            })}
            </div>
        </>
    );
}