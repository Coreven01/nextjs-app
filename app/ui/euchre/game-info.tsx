
type Props = {
    centerInfo: React.ReactNode,
    player1Info: React.ReactNode,
    player2Info: React.ReactNode,
    player3Info: React.ReactNode,
    player4Info: React.ReactNode,
}

export function GameInfo({centerInfo, player1Info, player2Info, player3Info, player4Info} : Props) {

    return (
        <div className="grid grid-flow-col grid-rows-3 min-h-full text-black">
            <div id="player2-region" className="bg-white col-span-1 col-start-2 relative bg-opacity-50">{player2Info}</div>
            <div id="player3-region" className="bg-white col-span-1 col-start-1 row-start-2 relative bg-opacity-50">{player3Info}</div>
            <div id="game-info" className="bg-white col-span-1 col-start-2 row-start-2 relative bg-opacity-50">{centerInfo}</div>
            <div id="player4-region" className="bg-white col-span-1 col-start-3 row-start-2 relative bg-opacity-50">{player4Info}</div>
            <div id="player1-region" className="bg-white col-span-1 col-start-2 row-start-3 relative bg-opacity-50">{player1Info}</div>
        </div>
    );
}