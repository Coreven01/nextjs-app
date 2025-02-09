import { EuchreGameInstance, EuchrePlayer } from "@/app/lib/euchre/data"
import Image from "next/image";
import React from "react";
import PlayerInfo from "./player-info";

type Props = {
    player: EuchrePlayer,
    game: EuchreGameInstance,
    onCardClick: (src: string, dest: string, player: number) => void,
}


export default function PlayerSide({ player, game, onCardClick }: Props) {

    const playerNumber = player.playerNumber;
    const images: React.ReactNode[] = [];

    for (let i = 0; i < player.hand.length; i++) {
        images.push(
            <Image onClick={() => onCardClick(`card-${player.playerNumber}${i}`, `player${playerNumber}-played`, player.playerNumber)}
                key={`${player.playerNumber}${i}`}
                id={`card-${player.playerNumber}${i}`}
                className="contain relative transform duration-300 ease-in-out cursor-pointer"
                quality={100}
                src={"/card-back-side.svg"}
                width={112}
                height={750} alt="Photo" />
        )
    }

    return (
        <div className={`flex flex-col ${playerNumber === 3 ? "items-start" : "items-end"} justify-center min-h-full relative`}>
            {images}
            <div id={`player-base-${playerNumber}`} className={`absolute top-auto {playerNumber === 3 ? "left-0" : "right-0"}`}>X</div>
            <PlayerInfo game={game} player={player} />
        </div>);
}