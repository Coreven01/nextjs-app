'use client';

import { useReducer } from 'react';
import GameMap from "./game-map"
import { TileValue } from './game-tile';
import { create2DArray, createBombMap } from '@/app/lib/bombseeker/game';
import { GameActionType, GameState, gameStateReducer, initialGameState } from '@/app/lib/bombseeker/gameStateReducer';
import { GameMapActionType, gameMapReducer, initialGameMapState } from '@/app/lib/bombseeker/gameMapReducer';

/**
 * Create a bomb seeker game.
 * @returns 
 */
export default function BombSeeker() {

    const [gameState, dispatchGameState] = useReducer(gameStateReducer, initialGameState);
    const [gameMapState, dispatchGameMapState] = useReducer(gameMapReducer, initialGameMapState);

    const handlePlay = (newExposedMap: TileValue[][]) => {
        dispatchGameMapState({
            type: GameMapActionType.UPDATE_EXPOSED,
            payload: {
                ...gameMapState, exposedMap: newExposedMap,
            }
        });
    };

    const handleNewGame = (state: GameState) => {
        dispatchGameState({
            type: GameActionType.UPDATE_ALL,
            payload: {
                ...state, gameCreated:true
            }
        });

        dispatchGameMapState({
            type: GameMapActionType.UPDATE_ALL,
            payload: { 
                exposedMap: create2DArray(state.rowCount, state.columnCount), 
                bombMap: createBombMap(state) 
            }
        });
    };

    return (
        <div onContextMenu={(event) => event.preventDefault()}>
            <div className={`relative mx-auto flex w-full flex-col`}>
                <GameMap
                    state={gameState}
                    mapState={gameMapState}
                    onPlay={handlePlay}
                    onNewGame={handleNewGame} />
            </div>
        </div>
    );
}