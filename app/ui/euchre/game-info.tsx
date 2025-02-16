import { PlayerInfoState } from "@/app/lib/euchre/playerInfoReducer";
import { sectionStyle } from "../home/home-description";

type Props = {
    playerInfoState: PlayerInfoState
}

export function GameInfo({ playerInfoState }: Props) {

    //console.log("Player state: ", playerInfoState);
    return (
        <div className="grid grid-flow-col grid-rows-3 gap-1 h-full w-full text-black grid-cols-[1fr,175px,1fr]">
            <div id="player2-region" className="bg-white col-span-1 col-start-2 bg-opacity-50 relative flex justify-center">
                <div id={`game-base-2`} className={`absolute`}>X</div>
                <div id={`game-base-2-inner`} className={`absolute bottom-0`}>X</div>
                {undefined}
            </div>
            <div id="player3-region" className="bg-white col-span-1 col-start-1 row-start-2 relative bg-opacity-50 flex items-center">
                <div id={`game-base-3`} className={`absolute top-auto`}>X</div>
                <div id={`game-base-3-inner`} className={`absolute top-auto right-0`}>X</div>
                {undefined}
            </div>
            <div id="game-info" className="bg-white col-span-1 col-start-2 row-start-2 relative bg-opacity-50 flex justify-center h-32">
                {playerInfoState.centerInfo}
            </div>
            <div id="player4-region" className="bg-white col-span-1 col-start-3 row-start-2 relative bg-opacity-50 flex items-center">
                <div id={`game-base-4`} className={`absolute top-auto right-0`}>X</div>
                <div id={`game-base-4-inner`} className={`absolute top-auto left-0`}>X</div>
                {undefined}
            </div>
            <div id="player1-region" className="bg-white col-span-1 col-start-2 row-start-3 relative bg-opacity-50 flex justify-center">
                <div id={`game-base-1`} className={`absolute bottom-0`}>X</div>
                <div id={`game-base-1-inner`} className={`absolute`}>X</div>
                {undefined}
            </div>
        </div>
    );
}