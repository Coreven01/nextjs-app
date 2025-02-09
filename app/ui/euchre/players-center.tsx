import { EuchrePlayer } from "@/app/lib/euchre/data"
import Image from "next/image";

type Props = {
    player: EuchrePlayer
    onCardClick: () => void,
}


export default function PlayerCenter({ player, onCardClick }: Props) {

    const temp = player.playerNumber;

    return (
        <div className="flex flex-row items-center max-h-32">
            <Image className="contain" quality={100} src={"/card-back.svg"} width={75} height={110} objectFit="scale-down" alt="Game Card" />
            <Image className="contain" quality={100} src={"/card-back.svg"} width={75} height={110} objectFit="scale-down" alt="Game Card" />
            <Image className="contain" quality={100} src={"/card-back.svg"} width={75} height={110} objectFit="scale-down" alt="Game Card" />
            <Image className="contain" quality={100} src={"/card-back.svg"} width={75} height={110} objectFit="scale-down" alt="Game Card" />
            <Image className="contain" quality={100} src={"/card-back.svg"} width={75} height={110} objectFit="scale-down" alt="Game Card" />
            <div className="bg-white">{player.hand.map(card => {
                return <span className={card.suit.color === "B" ? "text-black" : "text-red-500"} key={card.index}>{card.value.value} - {card.suit.suit} | </span>
            })}
            <span className="text-black">Team: {player.team} | Number: {player.playerNumber}</span>
            </div>
            {}
        </div>
        );
}