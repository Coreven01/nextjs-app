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
    const [totalColumns, setColumns] = useState<number>(20);

    /** Number of rows on the bomb map. */
    const [totalRows, setRows] = useState<number>(15);

    /** Number of bombs to randomly place on the map. */
    const [bombCount, setBombCount] = useState<number>(50);

    /** Map of randomly placed bombs along with the numbers of how many bombs a tile is touching. */
    const [bombMap, setBombMap] = useState<TileValue[][]>([]);

    /** Map of which tiles are exposed, flagged, or questioned. */
    const [exposedMap, setExposedMap] = useState<TileValue[][]>([]);
    const [gameCreated, setGameCreated] = useState<boolean>(false);

    const handlePlay = (newExposedMap: TileValue[][]) => {
        setExposedMap(newExposedMap);
    };

    const handleNewGame = (rows: number, columns: number, bombCount: number) => {

        if (rows < 10 || rows > 50)
            rows = 10;

        setColumns(columns);
        setRows(rows);
        setBombCount(bombCount);
        setExposedMap(create2DArray(rows, columns));
        setBombMap(createBombMap(rows, columns, bombCount));
        setGameCreated(true);
    };

    if (!gameCreated) {
        handleNewGame(totalRows, totalColumns, bombCount);
    }

    return (
        <div onContextMenu={(event) => event.preventDefault()}>
            <div className={`relative mx-auto flex w-full flex-col`}>
                <GameMap rows={totalRows}
                    columns={totalColumns}
                    bombCount={bombCount}
                    bombMap={bombMap}
                    exposedMap={exposedMap}
                    onPlay={handlePlay}
                    onNewGame={handleNewGame} />
            </div>
        </div>
    );
}