'use client';

import { useState } from 'react';
import GameMap from "./game-map"
import { TileValue } from './game-tile';
import { create2DArray, createBombMap } from '@/app/lib/bombseeker/game';

/**
 * Create a bomb seeker game.
 * @returns 
 */
export default function BombSeeker() {

    /** Number of columns on the bomb map. */
    const [totalColumns, setColumns] = useState<number>(9);

    /** Number of rows on the bomb map. */
    const [totalRows, setRows] = useState<number>(9);

    /** Number of bombs to randomly place on the map. */
    const [bombCount, setBombCount] = useState<number>(10);

    /** Map of randomly placed bombs along with the numbers of how many bombs a tile is touching. */
    const [bombMap, setBombMap] = useState<TileValue[][]>([]);

    /** Map of which tiles are exposed, flagged, or questioned. */
    const [exposedMap, setExposedMap] = useState<TileValue[][]>([]);
    const [gameCreated, setGameCreated] = useState<boolean | undefined>(undefined);

    const handlePlay = (newExposedMap: TileValue[][]) => {
        setExposedMap(newExposedMap);
    };

    const handleNewGame = (rows: number, columns: number, bombCount: number) => {

        setColumns(columns);
        setRows(rows);
        setBombCount(bombCount);
        setExposedMap(create2DArray(rows, columns));
        setBombMap(createBombMap(rows, columns, bombCount));
        setGameCreated(true);
    };

    return (
        <div onContextMenu={(event) => event.preventDefault()}>
            <div className={`relative mx-auto flex w-full flex-col`}>
                <GameMap rows={totalRows}
                    columns={totalColumns}
                    bombCount={bombCount}
                    bombMap={bombMap}
                    exposedMap={exposedMap}
                    gameCreated={gameCreated}
                    onPlay={handlePlay}
                    onNewGame={handleNewGame} />
            </div>
        </div>
    );
}