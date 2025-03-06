"use client";

/**
 * @file useTileClick.ts
 * @description Hook related to events while playing the bomb seeker game.
 *
 * Functions:
 *
 * Author: Nolan Appel
 * Date: 2025-02-01
 */

import { MouseEventHandler, useCallback, useState } from "react";
import { TileValue } from "@/app/ui/bombseeker/game-tile";
import {
  getDirectAdjacentTiles,
  getNewExposedMap,
  validateAndClickAjacentTiles,
} from "./game";
import { GameState } from "./gameStateReducer";
import { GameMapState } from "./gameMapReducer";
import { useMouseEvents } from "./useMouseEvents";

export default function useTileClick(
  gameState: GameState,
  mapState: GameMapState,
  onPlay: (exposedMap: TileValue[][]) => void,
  startTimer: () => void,
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
    handleDoubleMouseDown,
    handleDoubleMouseUp,
    handledMouseClick,
    handledMouseRightClick,
    resetMouseClicks,
  } = useMouseEvents();

  /**
   * Handle left click of a tile. Exposes the tile and adjacent empty tiles if the tile is empty. If the tile is a bomb, then game over.
   */
  const handleTileClick = useCallback(
    (
      event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
      row: number,
      column: number,
    ) => {
      const exposedTile: TileValue | undefined = mapState.exposedMap.length
        ? mapState.exposedMap[row][column]
        : undefined;

      // prevent duplicate events from firing. Also prevent the event if already flagged/exposed.
      if (
        !shouldHandleMouseClick.current ||
        exposedTile === "E" ||
        exposedTile === "F" ||
        exposedTile === "?"
      ) {
        event.preventDefault();
        handledMouseClick();
      } else {
        startTimer();
        onPlay(getNewExposedMap(row, column, gameState, mapState, "E"));
        handledMouseClick();
      }
    },
    [
      shouldHandleMouseClick,
      mapState,
      gameState,
      startTimer,
      onPlay,
      handledMouseClick,
    ],
  );

  /**
   * Flag the tile as a bomb. Clears the tile if already flagged.
   */
  const handleTileRightClick = useCallback(
    (
      event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
      row: number,
      column: number,
    ) => {
      // prevent duplicate events from firing. Prevent clicking if already exposed.
      if (
        !shouldHandleMouseRightClick.current ||
        mapState.exposedMap[row][column] === "E"
      ) {
        handledMouseRightClick();
      } else {
        startTimer();

        let newVal: TileValue = undefined;

        if (!mapState.exposedMap[row][column]) newVal = "F";
        else if (mapState.exposedMap[row][column] === "F") newVal = "?";

        onPlay(getNewExposedMap(row, column, gameState, mapState, newVal));
        handledMouseRightClick();
      }
    },
    [
      shouldHandleMouseRightClick,
      mapState,
      gameState,
      startTimer,
      onPlay,
      handledMouseRightClick,
    ],
  );

  /**
   * Prevent from clicking the tile if the mouse cursor exits the button area.
   */
  const handleTileMouseLeave = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      if (adjacentTiles.length) {
        handledMouseClick();
        handledMouseRightClick();
        setDoubleMouseDownEvent([]);
        setAdjacentTiles([]);
      }
    },
    [adjacentTiles, handledMouseClick, handledMouseRightClick],
  );

  const popMouseDownEvent = useCallback(() => {
    if (doubleMouseDownEvents.length > 1) {
      const newEvents = [...doubleMouseDownEvents].slice(
        0,
        doubleMouseDownEvents.length - 2,
      );
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
  const handleTileMouseUp = useCallback(
    (
      event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
      row: number,
      column: number,
    ) => {
      if (
        shouldHandleDoubleMouseUp.current &&
        doubleMouseDownEvents.length > 1
      ) {
        const bombTileValue: number = parseInt(
          mapState.bombMap[row][column]?.toString() ?? "0",
          10,
        );
        if (bombTileValue) {
          const newExposedMap = validateAndClickAjacentTiles(
            bombTileValue,
            row,
            column,
            gameState,
            mapState,
          );
          if (newExposedMap) onPlay(newExposedMap);
        }
      } else if (shouldHandleDoubleMouseUp.current) {
        handleDoubleMouseUp();
        setTimeout(() => {
          handledMouseClick();
          handledMouseRightClick();
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
      handledMouseClick,
      handleDoubleMouseUp,
      handledMouseRightClick,
      popMouseDownEvent,
    ],
  );

  const addMouseDownEvent: MouseEventHandler<HTMLButtonElement> = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      const newEvents = [...doubleMouseDownEvents, event];
      setDoubleMouseDownEvent(newEvents);
    },
    [doubleMouseDownEvents],
  );

  /**
   * Attempt to identify if the user is single clicking a tile, or double clicking a tile.
   * If both mouse buttons are held down, then display to the user which tiles would be "clicked".
   */
  const handleTileMouseDown = useCallback(
    (
      event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
      row: number,
      column: number,
    ) => {
      // track the events for mouse down events.
      // used to determine if the user is using the double mouse down/up feature.
      addMouseDownEvent(event);

      // this should only trigger when the user pushes both mouse buttons down.
      if (doubleMouseDownEvents.length >= 1) {
        handleDoubleMouseDown();
        const exposedValue: TileValue = mapState.exposedMap[row][column];

        // if the current tile is not yet exposed then ignore the double mouse down event.
        if (exposedValue !== "E") return;

        const currentValue: TileValue = mapState.bombMap[row][column];
        const exposedTileValue = parseInt(currentValue?.toString() ?? "0", 10);

        if (exposedTileValue >= 1 && exposedTileValue <= 8) {
          const adjacentTilesToHighlight: number[][] = [];
          getDirectAdjacentTiles(row, column, gameState, mapState).map(
            (tile) => {
              const adjacentExposedVal = mapState.exposedMap[tile[0]][tile[1]];
              if (adjacentExposedVal === undefined) {
                adjacentTilesToHighlight.push(tile);
              }
            },
          );

          setAdjacentTiles(adjacentTilesToHighlight);
        }
      }
    },
    [
      doubleMouseDownEvents,
      gameState,
      mapState,
      addMouseDownEvent,
      handleDoubleMouseDown,
    ],
  );

  return {
    adjacentTiles,
    handleTileClick,
    handleTileRightClick,
    handleTileMouseLeave,
    handleTileMouseUp,
    handleTileMouseDown,
    resetMouseClicks,
  };
}
