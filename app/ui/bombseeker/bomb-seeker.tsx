'use client';

import { useReducer } from 'react';
import GameMap from './game-map';
import { TileValue } from './game-tile';
import { create2DArray, createBombMap } from '@/app/lib/bombseeker/game';
import {
  GameActionType,
  GameState,
  gameStateReducer,
  initialGameState
} from '@/app/lib/bombseeker/gameStateReducer';
import {
  GameMapActionType,
  gameMapReducer,
  initialGameMapState
} from '@/app/lib/bombseeker/gameMapReducer';

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
        ...gameMapState,
        exposedMap: newExposedMap
      }
    });
  };

  const handleNewGame = (rowCount: number, columnCount: number, bombCount: number) => {
    dispatchGameState({ type: GameActionType.SET_GAME_CREATED_TRUE });
    dispatchGameState({ type: GameActionType.SET_BOMB_COUNT, payload: bombCount });
    dispatchGameState({ type: GameActionType.SET_COLUMN_COUNT, payload: columnCount });
    dispatchGameState({ type: GameActionType.SET_ROW_COUNT, payload: rowCount });

    dispatchGameMapState({
      type: GameMapActionType.UPDATE_ALL,
      payload: {
        exposedMap: create2DArray(rowCount, columnCount),
        bombMap: createBombMap(rowCount, columnCount, bombCount)
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
          onNewGame={handleNewGame}
        />
      </div>
    </div>
  );
}
