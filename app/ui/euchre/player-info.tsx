import { EuchreGameInstance, EuchrePlayer } from "@/app/lib/euchre/data"

type Props = {
    player: EuchrePlayer,
    game: EuchreGameInstance
}

export default function PlayerInfo({ player, game }: Props) {

    const isDealer = player === game.dealer;
    const isMaker = player === game.maker;
    const suit = game.trump?.suit;
    let content = "";

    if (isDealer && isMaker)
        content = `Dealer | Maker`;
    else if (isDealer)
        content = "Dealer";
    else if (isMaker)
        content = `Maker (${suit})`;
    
    return (
        <>
            <div className="rounded border rounded-xl dark:border-white p-2 m-2">
                <div>
                    {player.name} - Team: {player.team}
                </div>
                <div>
                    Tricks {0}/5
                </div>
                <div>
                    Points {0}/5
                </div>
                <div className={`text-yellow-500 ${!content ? "invisible": ""}`}>{content ? content : "X"}</div>
            </div>
        </>
    );
}