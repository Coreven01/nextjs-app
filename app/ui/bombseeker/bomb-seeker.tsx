'use client';

import { useReducer, useState } from 'react';
import GameMap from "./game-map"
import { TileValue } from './game-tile';
import { create2DArray, createBombMap } from '@/app/lib/bombseeker/game';
import { GameState, gameStateReducer, initialGameState } from '@/app/lib/bombseeker/gameStateReducer';

/**
 * Create a bomb seeker game.
 * @returns 
 */
export default function BombSeeker() {

    const [gameState, dispatchGameState] = useReducer(gameStateReducer, initialGameState);

    /** Number of columns on the bomb map. */
    //const [totalColumns, setColumns] = useState<number>(9);

    /** Number of rows on the bomb map. */
    //const [totalRows, setRows] = useState<number>(9);

    /** Number of bombs to randomly place on the map. */
    //const [bombCount, setBombCount] = useState<number>(10);

    /** Map of randomly placed bombs along with the numbers of how many bombs a tile is touching. */
    //const [bombMap, setBombMap] = useState<TileValue[][]>([]);

    /** Map of which tiles are exposed, flagged, or questioned. */
    //const [exposedMap, setExposedMap] = useState<TileValue[][]>([]);
    //const [gameCreated, setGameCreated] = useState<boolean | undefined>(undefined);

    const handlePlay = (newExposedMap: TileValue[][]) => {
        dispatchGameState({
            type: 'update',
            state: {
                ...gameState, exposedMap: newExposedMap,
            }
        });
    };

    const handleNewGame = (state: GameState) => {
        dispatchGameState({
            type: 'update',
            state: {
                ...state, exposedMap: create2DArray(state.rowCount, state.columnCount), bombMap: createBombMap(state)
            }
        });
    };

    return (
        <div onContextMenu={(event) => event.preventDefault()}>
            <div className={`relative mx-auto flex w-full flex-col`}>
                <GameMap 
                    state={gameState}
                    onPlay={handlePlay}
                    onNewGame={handleNewGame} />
            </div>
        </div>
    );
}