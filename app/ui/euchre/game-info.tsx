import { sectionStyle } from "../home/home-description";

type Props = {
    centerInfo: React.ReactNode,
    player1Info: React.ReactNode,
    player2Info: React.ReactNode,
    player3Info: React.ReactNode,
    player4Info: React.ReactNode,
}

export function GameInfo({ centerInfo, player1Info, player2Info, player3Info, player4Info }: Props) {

    return (
        <div className="grid grid-flow-col grid-rows-3 min-h-full text-black">
            <div id="player2-region" className="bg-white col-span-1 col-start-2 bg-opacity-50 relative flex justify-center">
                <div id={`game-base-2`} className={`absolute`}>X</div>
                {player2Info}
            </div>
            <div id="player3-region" className="bg-white col-span-1 col-start-1 row-start-2 relative bg-opacity-50 flex items-center">
                <div id={`game-base-3`} className={`absolute top-auto`}>X</div>
                {player3Info}
            </div>
            <div id="game-info" className="bg-white col-span-1 col-start-2 row-start-2 relative bg-opacity-50 min-h-32 flex justify-center">
                {centerInfo}
            </div>
            <div id="player4-region" className="bg-white col-span-1 col-start-3 row-start-2 relative bg-opacity-50 flex items-center">
                <div id={`game-base-4`} className={`absolute top-auto right-0`}>X</div>
                {player4Info}

            </div>
            <div id="player1-region" className="bg-white col-span-1 col-start-2 row-start-3 relative bg-opacity-50 flex justify-center">
                <div id={`game-base-1`} className={`absolute bottom-0`}>X</div>
                {player1Info}
            </div>
        </div>
    );
}