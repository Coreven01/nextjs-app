'use client';

import { PlayerInfoState } from "@/app/lib/euchre/playerInfoReducer";
import GameInfoDetail from "./game-info-detail";

type Props = {
    playerInfoState: PlayerInfoState
}

export function GameInfo({ playerInfoState }: Props) {

    const gameDetailOrdered: React.ReactNode[] = [];
    const renderOrder = [
        playerInfoState.player2Info, 
        playerInfoState.player3Info, 
        playerInfoState.centerInfo, 
        playerInfoState.player4Info, 
        playerInfoState.player1Info
    ];

    for (const player of renderOrder)
    {
        if (!player)
            throw Error("Player not found in game state");

        gameDetailOrdered.push(
        <GameInfoDetail
            id={player.id}
            fadeOutId={player.fadeOutId}
            fadeOutDelay={player.fadeOutDelay}
            fadeOutDuration={player.fadeOutDuration}>
            {player.detail}
        </GameInfoDetail>);
    }

    return (
        <div className="grid grid-flow-col grid-rows-3 gap-1 h-full w-full text-black grid-cols-[1fr,175px,1fr]">
            <div id="player2-region" className="bg-white col-span-1 col-start-2 bg-opacity-50 relative flex justify-center items-center">
                <div id={`game-base-2`} className={`absolute top-0`}>X</div>
                <div id={`game-base-2-inner`} className={`absolute bottom-0`}>X</div>
                {gameDetailOrdered[0]}
            </div>
            <div id="player3-region" className="bg-white col-span-1 col-start-1 row-start-2 relative bg-opacity-50 flex justify-center items-center">
                <div id={`game-base-3`} className={`absolute left-0`}>X</div>
                <div id={`game-base-3-inner`} className={`absolute top-auto right-0`}>X</div>
                {gameDetailOrdered[1]}
            </div>
            <div id="game-info" className="bg-white col-span-1 col-start-2 row-start-2 relative bg-opacity-50 flex justify-center h-32 items-center">
                <div id={`game-center`} className={`absolute top-auto`}>X</div>
                {gameDetailOrdered[2]}
            </div>
            <div id="player4-region" className="bg-white col-span-1 col-start-3 row-start-2 relative bg-opacity-50 flex justify-center items-center">
                <div id={`game-base-4`} className={`absolute top-auto right-0`}>X</div>
                <div id={`game-base-4-inner`} className={`absolute top-auto left-0`}>X</div>
                {gameDetailOrdered[3]}
            </div>
            <div id="player1-region" className="bg-white col-span-1 col-start-2 row-start-3 relative bg-opacity-50 flex justify-center items-center">
                <div id={`game-base-1`} className={`absolute bottom-0`}>X</div>
                <div id={`game-base-1-inner`} className={`absolute top-0`}>X</div>
                {gameDetailOrdered[4]}
            </div>
        </div>
    );
}

