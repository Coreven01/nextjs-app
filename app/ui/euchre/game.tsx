'use client';

import { useState } from "react";
import PlayerCenter from "./players-center";
import { EuchreGameInstance } from "@/app/lib/euchre/data";
import PlayerSide from "./player-side";
import { sectionStyle } from "../home/home-description";
import { usePlayCard } from "@/app/lib/euchre/actions";
import { createEuchreGame, getPlayerAndCard, playGameCard } from "@/app/lib/euchre/game";
import PlayerInfo from "./player-info";


export default function EuchreGame() {

    const [game, setGame] = useState<EuchreGameInstance | undefined>(undefined);
    const [pause, setPaused] = useState(false);
    const { setElements } = usePlayCard();

    const createDeck = () => {
        setGame(createEuchreGame());
    }

    const playCard = async (src: string, dest: string, player: number) => {

        if (pause || !game)
            return;

        setPaused(true);
        alert(src + dest);
        setElements(src, dest, player);

        const { number, index } = getPlayerAndCard(src);

        const newGame = playGameCard(number, index, game);
        await new Promise((resolve) => setTimeout(resolve, 500));
        setPaused(false);
        console.log('card played - src:', src, ' dest:', dest, ' player:', player);
    }

    // check game won
    // update score
    // if current player is ai then play card

    let retval: React.ReactNode;

    if (game) {
        retval = (
            <div className="grid grid-flow-col grid-rows-4 gap-4">
                <div className="row-span-4 min-w-32">
                    <PlayerSide player={game.player3} game={game} onCardClick={playCard} />
                </div>
                <div className="col-span-1">
                    02
                    <PlayerCenter player={game.player2} onCardClick={playCard} />
                    <div>
                        <button onClick={createDeck}>Create Deck</button>
                    </div>
                </div>
                <div className="col-span-1 row-span-2">
                    <div className="grid grid-flow-col grid-rows-3 gap-4 min-h-full text-black">
                        <div id="player2-played" className="bg-white col-span-1 col-start-2 relative bg-opacity-50">02</div>
                        <div id="player3-played" className="bg-white col-span-1 col-start-1 row-start-2 relative bg-opacity-50">03</div>
                        <div id="player4-played" className="bg-white col-span-1 col-start-3 row-start-2 relative bg-opacity-50">04</div>
                        <div id="player1-played" className="bg-white col-span-1 col-start-2 row-start-3 relative bg-opacity-50">01</div>
                    </div>
                </div>
                <div className="col-span-1 ">
                    <PlayerCenter player={game.player1} onCardClick={playCard} />
                </div>

                <div className="row-span-4 min-w-32">
                    <PlayerSide player={game.player4} game={game} onCardClick={playCard} />
                </div>
            </div>)
    } else
        retval = <div>
            <button className="text-white" onClick={createDeck}>Create Game</button>
        </div>;
    return (
        <>
            <div className={`m-2 p-2 ${sectionStyle}`}>
                {retval}
                <div className="bg-white text-center">
                    {game ? game.kitty.map(card => {
                        return <span className={card.suit.color === "B" ? "text-black" : "text-red-500"} key={card.index}>{card.value.value} - {card.suit.suit} | </span>
                    }) : ""}
                </div>
            </div>
        </>
    )
}