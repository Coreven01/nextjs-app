'use client';

/**
 * @file useTileClick.ts
 * @description Hook related to events while playing the bomb seeker game.
 * 
 * Functions:
 * 
 * Author: Nolan Appel
 * Date: 2025-02-01
 */

import { MouseEventHandler, useState } from "react";
import { useDoubleMouseEvents, useTimer } from "./actions";
import { TileValue } from "@/app/ui/bombseeker/game-tile";
import { getDirectAdjacentTiles, getNewExposedMap, validateAndClickAjacentTiles } from "./game";
import { GameState } from "./gameStateReducer";
import { GameMapState } from "./gameMapReducer";

export default function useTileClick(
    state: GameState,
    mapState: GameMapState,
    onPlay: (exposedMap: TileValue[][]) => void,
    onNewGame: (state: GameState) => void,) {

    const [showGameOverScreen, setShowGameOverScreen] = useState<boolean>(true);

    /** Used to determine if more than one mouse button is pressed. */
    const [doubleMouseDownEvents, setDoubleMouseDownEvent] = useState<React.MouseEvent<HTMLButtonElement, MouseEvent>[]>([]);

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
        resetMouseClicks
    } = useDoubleMouseEvents();

    const {
        time,
        startTimer,
        pauseTimer,
        resetTimer
    } = useTimer();


    /**
     * Handle left click of a tile. Exposes the tile and adjacent empty tiles if the tile is empty. If the tile is a bomb, then game over.
     */
    const handleTileClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => {

        const exposedTile: TileValue | undefined = mapState.exposedMap.length ? mapState.exposedMap[row][column] : undefined;

        // prevent duplicate events from firing. Also prevent from being clicked if already flagged/exposed.
        if (!shouldHandleMouseClick || exposedTile === undefined || exposedTile.value === 'E' || exposedTile.value === 'F' || exposedTile.value === "?") {
            event.preventDefault();
            handledMouseClick();

            return;
        }

        startTimer();
        onPlay(getNewExposedMap(row, column, state, mapState, { value: 'E' }));
        handledMouseClick();
    };

    /**
     * Flag the tile as a bomb. Clears the tile if already flagged.
     */
    const handleTileRightClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => {

        // prevent duplicate events from firing. Prevent clicking if already exposed.
        if (!shouldHandleMouseRightClick || mapState.exposedMap[row][column].value === 'E') {
            handledMouseRightClick();
            return;
        }

        startTimer();

        const newVal: TileValue = { value: undefined };

        if (!mapState.exposedMap[row][column].value)
            newVal.value = 'F';
        else if (mapState.exposedMap[row][column].value === 'F')
            newVal.value = '?';

        onPlay(getNewExposedMap(row, column, state, mapState, newVal));
        handledMouseRightClick();
    }

    /**
     * Prevent from clicking the tile if the mouse cursor exits the button area.
     */
    const handleTileMouseLeave = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {

        if (adjacentTiles.length) {
            handledMouseClick();
            handledMouseRightClick();
            setDoubleMouseDownEvent([]);
            setAdjacentTiles([]);
        }
    }

    /**
     * Feature that was in the original MineSweeper game on Windows. When the user double mouse "upped" a tile, it would count as clicking each tile adjacent 
     * to the current tile. Pretty sure this would only work if there were no "?"ed tiles, and the flagged tile count matched the selected tile number.
     * If these scenarios are true, then click the surrounding tiles as if the user clicked them individually.
     */
    const handleTileMouseUp = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => {

        if (shouldHandleDoubleMouseUp && doubleMouseDownEvents.length > 1) {

            const bombTileValue: number = parseInt(mapState.bombMap[row][column].value?.toString() ?? "0", 10);
            if (bombTileValue) {
                const newExposedMap = validateAndClickAjacentTiles(bombTileValue, row, column, state, mapState);
                if (newExposedMap)
                    onPlay(newExposedMap);
            }
        } else if (shouldHandleDoubleMouseUp) {
            handleDoubleMouseUp();
            setTimeout(() => {
                handledMouseClick();
                handledMouseRightClick();
            }, 25);
        }

        popMouseDownEvent();
        setAdjacentTiles([]);
    }

    /**
     * Attempt to identify if the user is single clicking a tile, or double clicking a tile.
     * If both mouse buttons are held down, then display to the user which tiles would be "clicked".
     */
    const handleTileMouseDown = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => {

        // track the events for mouse down events.
        // used to determine if the user is using the double mouse down/up feature.
        addMouseDownEvent(event);

        if (doubleMouseDownEvents.length >= 1) {

            handleDoubleMouseDown();
            const exposedValue: TileValue = mapState.exposedMap[row][column];

            // if the current tile is not yet exposed then ignore the double mouse down event.
            if (exposedValue.value !== 'E')
                return;

            const currentValue: TileValue = mapState.bombMap[row][column];
            const tempValue = parseInt(currentValue.value?.toString() ?? "0", 10);

            if (tempValue >= 1 && tempValue <= 9) {
                const adjacentTiles = getDirectAdjacentTiles(row, column, state, mapState);
                const adjacentTilesToHighlight: number[][] = [];
                if (adjacentTiles.length) {
                    for (const tile of adjacentTiles) {
                        const adjacentValue = mapState.exposedMap[tile[0]][tile[1]];
                        if (adjacentValue.value === undefined || adjacentValue.value === 'F') {
                            adjacentTilesToHighlight.push(tile);
                        }
                    }
                }

                setAdjacentTiles(adjacentTilesToHighlight);
            }
        }
    }

    /** Reset the state and generate a new game. */
    const handleNewGameClick = (state: GameState) => {
        onNewGame(state);
        resetMouseClicks();
        pauseTimer();
        resetTimer();
        setShowGameOverScreen(true);
    }

    /** Hide the overlay if the game over screen is cliecked */
    const handleGameOverScreenClick = () => {
        setShowGameOverScreen(false);
    }

    const addMouseDownEvent: MouseEventHandler<HTMLButtonElement> = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        const newEvents = [...doubleMouseDownEvents, event];
        setDoubleMouseDownEvent(newEvents);
    }

    const popMouseDownEvent = () => {

        if (doubleMouseDownEvents.length > 1) {
            const newEvents = [...doubleMouseDownEvents].slice(0, doubleMouseDownEvents.length - 2);
            setDoubleMouseDownEvent(newEvents);
        } else {
            setDoubleMouseDownEvent([]);
        }
    }

    return { time, showGameOverScreen, adjacentTiles, pauseTimer, handleTileClick, handleTileRightClick, handleTileMouseLeave, handleTileMouseUp, handleTileMouseDown, handleNewGameClick, handleGameOverScreenClick };
}