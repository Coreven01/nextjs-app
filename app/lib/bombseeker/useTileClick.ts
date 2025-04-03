/**
 * @file useTileClick.ts
 * @description Hook related to events while playing the bomb seeker game.
 *
 * Functions:
 *
 * Author: Nolan Appel
 * Date: 2025-02-01
 */

import React, { MouseEventHandler, useCallback, useState } from 'react';
import { TileValue } from '@/app/ui/bombseeker/game-tile';
import {
  getDirectAdjacentTiles,
  getNewExposedMap,
  getNewExposedMapForHint,
  validateAndClickAdjacentTiles
} from './game';
import { GameState } from './gameStateReducer';
import { GameMapState } from './gameMapReducer';
import { useMouseEvents } from './useMouseEvents';

export default function useTileClick(
  gameState: GameState,
  mapState: GameMapState,
  onPlay: (exposedMap: TileValue[][]) => void,
  startTimer: () => void
) {
  /** Used to determine if more than one mouse button is pressed. */
  const [doubleMouseDownEvents, setDoubleMouseDownEvent] = useState<
    React.MouseEvent<HTMLButtonElement, MouseEvent>[]
  >([]);

  /** Used to determine what tiles to highlight when pressing double mouse down. */
  const [adjacentTiles, setAdjacentTiles] = useState<number[][]>([]);

  const {
    shouldHandleDoubleMouseUp,
    shouldHandleMouseClick,
    shouldHandleMouseRightClick,
    onDoubleMouseDown,
    onDoubleMouseUp,
    onMouseClicked,
    onMouseRightClicked,
    resetMouseClicks
  } = useMouseEvents();

  /**
   *
   */
  const handleTileClickForHint = useCallback(
    (row: number, column: number) => {
      const bombTile: TileValue | undefined = mapState.bombMap.length
        ? mapState.bombMap[row][column]
        : undefined;
      if (!bombTile) return;

      startTimer();
      onPlay(getNewExposedMapForHint(row, column, gameState, mapState))
      onMouseClicked();
    },
    [gameState, mapState, onMouseClicked, onPlay, startTimer]
  );

  /**
   * Handle left click of a tile. Exposes the tile and adjacent empty tiles if the tile is empty. If the tile is a bomb, then game over.
   */
  const onTileClick = useCallback(
    (
      event: React.MouseEvent<HTMLButtonElement, MouseEvent> | null,
      row: number,
      column: number,
      hintActivated: boolean
    ) => {
      const currentExposedTile: TileValue | undefined = mapState.exposedMap.length
        ? mapState.exposedMap[row][column]
        : undefined;

      if (currentExposedTile === 'exposed' && hintActivated) {
        handleTileClickForHint(row, column);
      } else if (
        !shouldHandleMouseClick ||
        currentExposedTile === 'exposed' ||
        currentExposedTile === 'flag' ||
        currentExposedTile === 'unknown'
      ) {
        // prevent duplicate events from firing. Also prevent the event if already flagged/exposed.
        event?.preventDefault();
        onMouseClicked();
      } else {
        startTimer();
        onPlay(getNewExposedMap(row, column, gameState, mapState, 'exposed'));
        onMouseClicked();
      }
    },
    [mapState, shouldHandleMouseClick, handleTileClickForHint, onMouseClicked, startTimer, onPlay, gameState]
  );

  /**
   * Flag the tile as a bomb. Clears the tile if already flagged.
   */
  const onTileRightClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => {
      // prevent duplicate events from firing. Prevent clicking if already exposed.
      if (!shouldHandleMouseRightClick || mapState.exposedMap[row][column] === 'exposed') {
        onMouseRightClicked();
      } else {
        startTimer();

        let newVal: TileValue = undefined;

        if (!mapState.exposedMap[row][column]) {
          newVal = 'flag';
        } else if (mapState.exposedMap[row][column] === 'flag') {
          newVal = 'unknown';
        }

        onPlay(getNewExposedMap(row, column, gameState, mapState, newVal));
        onMouseRightClicked();
      }
    },
    [shouldHandleMouseRightClick, mapState, gameState, startTimer, onPlay, onMouseRightClicked]
  );

  /**
   * Prevent from clicking the tile if the mouse cursor exits the button area.
   */
  const onTileMouseLeave = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      if (adjacentTiles.length) {
        onMouseClicked();
        onMouseRightClicked();
        setDoubleMouseDownEvent([]);
        setAdjacentTiles([]);
      }
    },
    [adjacentTiles, onMouseClicked, onMouseRightClicked]
  );

  const popMouseDownEvent = useCallback(() => {
    if (doubleMouseDownEvents.length > 1) {
      const newEvents = [...doubleMouseDownEvents].slice(0, doubleMouseDownEvents.length - 2);
      setDoubleMouseDownEvent(newEvents);
    } else {
      setDoubleMouseDownEvent([]);
    }
  }, [doubleMouseDownEvents]);

  /**
   * Feature that was in the original MineSweeper game on Windows. When the user double mouse "upped" a tile, it would count as clicking each tile adjacent
   * to the current tile. Pretty sure this would only work if there were no "?"ed tiles, and the flagged tile count matched the selected tile number.
   * If these scenarios are true, then click the surrounding tiles as if the user clicked them individually.
   */
  const onTileMouseUp = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => {
      if (shouldHandleDoubleMouseUp && doubleMouseDownEvents.length > 1) {
        const bombTileValue: number = parseInt(mapState.bombMap[row][column]?.toString() ?? '0', 10);
        if (bombTileValue) {
          const newExposedMap = validateAndClickAdjacentTiles(
            bombTileValue,
            row,
            column,
            gameState,
            mapState
          );
          if (newExposedMap) onPlay(newExposedMap);
        }
      } else if (shouldHandleDoubleMouseUp) {
        onDoubleMouseUp();
        setTimeout(() => {
          onMouseClicked();
          onMouseRightClicked();
        }, 25);
      }

      popMouseDownEvent();
      setAdjacentTiles([]);
    },
    [
      shouldHandleDoubleMouseUp,
      doubleMouseDownEvents,
      mapState,
      gameState,
      onPlay,
      onMouseClicked,
      onDoubleMouseUp,
      onMouseRightClicked,
      popMouseDownEvent
    ]
  );

  const addMouseDownEvent: MouseEventHandler<HTMLButtonElement> = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      const newEvents = [...doubleMouseDownEvents, event];
      setDoubleMouseDownEvent(newEvents);
    },
    [doubleMouseDownEvents]
  );

  /**
   * Attempt to identify if the user is single clicking a tile, or double-clicking a tile.
   * If both mouse buttons are held down, then display to the user which tiles would be "clicked".
   */
  const onTileMouseDown = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => {
      // track the events for mouse down events.
      // used to determine if the user is using the double mouse down/up feature.
      addMouseDownEvent(event);

      // this should only trigger when the user pushes both mouse buttons down.
      if (doubleMouseDownEvents.length >= 1) {
        onDoubleMouseDown();
        const exposedValue: TileValue = mapState.exposedMap[row][column];

        // if the current tile is not yet exposed then ignore the double mouse down event.
        if (exposedValue !== 'exposed') return;

        const currentValue: TileValue = mapState.bombMap[row][column];
        const exposedTileValue = parseInt(currentValue?.toString() ?? '0', 10);

        if (exposedTileValue >= 1 && exposedTileValue <= 8) {
          const adjacentTilesToHighlight: number[][] = [];
          getDirectAdjacentTiles(row, column, gameState, mapState).map((tile) => {
            const adjacentExposedVal = mapState.exposedMap[tile[0]][tile[1]];
            if (adjacentExposedVal === undefined) {
              adjacentTilesToHighlight.push(tile);
            }
          });

          setAdjacentTiles(adjacentTilesToHighlight);
        }
      }
    },
    [doubleMouseDownEvents, gameState, mapState, addMouseDownEvent, onDoubleMouseDown]
  );

  return {
    adjacentTiles,
    onTileClick,
    onTileRightClick,
    onTileMouseLeave,
    onTileMouseUp,
    onTileMouseDown,
    resetMouseClicks
  };
}
