import { TileValue } from "@/app/ui/bombseeker/game-tile";
import { GameState } from "./gameStateReducer";
import { GameMapState } from "./gameMapReducer";

/**
 * @file game.ts
 * @description This file contains logic functions for creating and updating the bombseekr game.
 * 
 * Functions:
 * 
 * Author: Nolan Appel
 * Date: 2025-02-01
 */

/** Create a deep copy of the array of tile value arrays */
function deepCopyTileValueArray(array: TileValue[][]): TileValue[][] {
    return [...array.map(e => [...e.map(t => { const r: TileValue = { value: t.value }; return r; })])];
}

/**
     * Return the new exposed map of tiles that were exposed from clicking on the row/column value for a tile.
     * All adjacent tiles will be exposed if the user clicked on a blank tile in the bomb map.
     */
export function getNewExposedMap(
    selectedRow: number,
    selectedColumn: number,
    state: GameState,
    mapState: GameMapState,
    assignValue: TileValue) {

    const newExposedMap: TileValue[][] = deepCopyTileValueArray(mapState.exposedMap);
    let emptyAdjacentTiles: number[][] = [[selectedRow, selectedColumn]];

    if (assignValue.value === 'E') {
        emptyAdjacentTiles = getEmptyAdjacentTiles(selectedRow, selectedColumn, state, mapState, emptyAdjacentTiles);

        for (const emptyTile of emptyAdjacentTiles)
            if (!newExposedMap[emptyTile[0]][emptyTile[1]].value)
                newExposedMap[emptyTile[0]][emptyTile[1]].value = 'E';
    }

    newExposedMap[selectedRow][selectedColumn].value = assignValue.value;

    return newExposedMap;
}

/**
 * Get all the empty tiles adjacent to the given row/column. This will return all empty tiles connected to the clicked tile.
 * @returns 2D array of row/column values of empty tiles adjacent to the given row/column.
 */
export function getEmptyAdjacentTiles(
    selectedRow: number,
    selectedColumn: number,
    state: GameState,
    mapState: GameMapState,
    emptyTiles: number[][]): number[][] {

    let newEmptyTiles = [...emptyTiles.map(e => [...e])];

    // exit if the bomb map contains a value.
    if (mapState.bombMap[selectedRow][selectedColumn].value)
        return newEmptyTiles;

    // tiles directly adjacent to the given row and column.
    const adj: number[][] = [
        [selectedRow - 1, selectedColumn],
        [selectedRow + 1, selectedColumn],
        [selectedRow, selectedColumn - 1],
        [selectedRow, selectedColumn + 1],
        [selectedRow - 1, selectedColumn - 1],
        [selectedRow + 1, selectedColumn - 1],
        [selectedRow + 1, selectedColumn + 1],
        [selectedRow - 1, selectedColumn + 1]
    ];

    // iterate through the 8 adjacent tiles directly top, bottom, left, right, and diagnals.
    for (let i = 0; i < 8; i++) {
        const current = adj[i];

        // check to make sure the tile exists in the grid and the tile is not yet exposed.
        const tileIsValid = current[0] >= 0 &&
            current[0] < state.rowCount &&
            current[1] >= 0 &&
            current[1] < state.columnCount &&
            !mapState.exposedMap[current[0]][current[1]].value;

        if (tileIsValid) {

            let found = false;

            // check to make sure the current tile has not yet been tested. if already in the empty tile list, then skip the current tile.
            for (const emptyTile of newEmptyTiles)
                if (emptyTile[0] === current[0] && emptyTile[1] === current[1]) {
                    found = true;
                    break;
                }

            if (!found) {
                newEmptyTiles.push(current);

                // recursively find all the next adjacent tiles for the found empty tile.
                newEmptyTiles = getEmptyAdjacentTiles(current[0], current[1], state, mapState, newEmptyTiles);
            }

        }
    }

    return newEmptyTiles;
}

/**
 * Get the 8 tiles directly adjacent to the given row/column. Only returns the values if they are valid in the grid.
 */
export function getDirectAdjacentTiles(row: number, column: number, state: GameState, mapState: GameMapState): number[][] {

    const adjacentTiles: number[][] = [];
    const tileValue = parseInt(mapState.bombMap[row][column].value?.toString() ?? '-1', 10);

    if (tileValue >= 1 && tileValue <= 8) {

        // 8 adjacent tiles next to the given row/column.
        const adj: number[][] = [
            [row - 1, column],
            [row + 1, column],
            [row, column - 1],
            [row, column + 1],
            [row - 1, column - 1],
            [row + 1, column - 1],
            [row + 1, column + 1],
            [row - 1, column + 1]
        ];

        // iterate through the 8 adjacent tiles directly top, bottom, left, right, and diagnals.
        for (let i = 0; i < 8; i++) {
            const current: number[] = adj[i];
            if (current[0] >= 0 && current[0] < state.rowCount && current[1] >= 0 && current[1] < state.columnCount) {
                adjacentTiles.push(current);
            }
        }
    }

    return adjacentTiles;
}

/**
 * This will be triggered when the user uses the double mouse up feature to click all surrounding tiles.
 * This will validate that the feature should be used, and if valid, click the surrounding tiles.
 */
export function validateAndClickAjacentTiles(
    bombTileValue: number,
    row: number,
    column: number,
    state: GameState,
    mapState: GameMapState): TileValue[][] {

    const directAdjacentTiles = getDirectAdjacentTiles(row, column, state, mapState);
    let questionMarkFound = false;
    let flaggedCount = 0;
    let newExposedMap: TileValue[][] = deepCopyTileValueArray(mapState.exposedMap);

    // the feature should only work if the number value of the bomb tile matches the number of flagged adjacent tiles.
    // should also only work if no adjacent tile is set to 'Unknown' (?)
    // ends the game if there's a bomb adjacent to the clicked tile that hasn't been flagged.

    for (const adjTile of directAdjacentTiles) {
        const rowVal = adjTile[0];
        const colVal = adjTile[1];

        if (newExposedMap[rowVal][colVal].value === "?")
            questionMarkFound = true;

        if (newExposedMap[rowVal][colVal].value === "F")
            flaggedCount++;
    }

    if (!questionMarkFound && flaggedCount == bombTileValue) {
        for (const adjTile of directAdjacentTiles) {
            const rowVal = adjTile[0];
            const colVal = adjTile[1];

            if (newExposedMap[rowVal][colVal].value === undefined)
                newExposedMap = getNewExposedMap(rowVal, colVal, state, { ...mapState, exposedMap: newExposedMap }, { value: 'E' });
        }
    }

    return newExposedMap;
}

/** Determine if the game was won. */
export function isGameWon(state: GameState, mapState: GameMapState): boolean {

    for (let row = 0; row < state.rowCount; row++) {
        for (let col = 0; col < state.columnCount; col++) {
            const exposedTile = mapState.exposedMap[row][col];
            const bombTile = mapState.bombMap[row][col];

            if (exposedTile.value === '?')
                return false;

            if (exposedTile.value !== 'E' && exposedTile.value !== 'F')
                return false;

            if (exposedTile.value === 'F' && bombTile.value !== 'X')
                return false;
        }
    }

    return true;
}

export type GameLostProps = {
    gameLost: boolean,
    bombTile: number[] | undefined,
    incorrectTiles: number[][]
}

/** Determine if the game was lost. 
  * @returns Which bomb tile was clicked that lost the game, and which tiles were incorrectly flagged.
*/
export function isGameLost(state: GameState, mapState: GameMapState): GameLostProps {

    const retval: GameLostProps = { gameLost: false, bombTile: undefined, incorrectTiles: [] };

    for (let row = 0; row < state.rowCount; row++) {
        for (let col = 0; col < state.columnCount; col++) {
            const exposedTile = mapState.exposedMap[row][col];
            const bombTile = mapState.bombMap[row][col];

            if (exposedTile.value === 'E' && bombTile.value === 'X') {
                retval.gameLost = true;
                retval.bombTile = [row, col];
            }

            if (exposedTile.value === 'F' && bombTile.value !== 'X')
                retval.incorrectTiles.push([row, col]);
        }
    }

    return retval;
}

/** Number of bombs remaining. The map bomb count minus the number of flagged tiles. */
export function getBombsRemaining(state: GameState, mapState: GameMapState): number {

    let retval = 0;
    let counter = 0;

    for (let row = 0; row < state.rowCount; row++) {
        for (let col = 0; col < state.columnCount; col++) {
            const exposedTile = mapState.exposedMap[row][col];

            if (exposedTile.value === 'F')
                counter++;
        }
    }

    retval = state.bombCount - counter;
    return retval;
}

/**
 * Creates 2D array with random bomb placement. Also sets the values for adjacent number of bombs the current tile is touching.
 */
export function createBombMap(state: GameState): TileValue[][] {

    const rowCount = state.rowCount;
    const columnCount = state.columnCount;
    const bombCount = state.bombCount;

    const maxBombCount = rowCount * columnCount;
    if (maxBombCount <= bombCount)
        throw new Error();

    const percentBombCover = Math.round(bombCount * 100 / maxBombCount);
    const randomSetValue: TileValue = { value: 'X' };
    const baseValue: TileValue = { value: undefined };
    let randomCounter = bombCount;

    let bombMap = create2DArray(rowCount, columnCount);
    const randomNumbers = new Set();

    if (percentBombCover > 80) {
        randomCounter = maxBombCount - bombCount;
        randomSetValue.value = undefined;
        baseValue.value = 'X';
    }

    while (randomNumbers.size < randomCounter) {
        const randomNum = Math.floor((Math.random() * maxBombCount));
        randomNumbers.add(randomNum);
    }

    for (let row = 0; row < rowCount; row++) {
        const rowVal = row * columnCount;
        for (let col = 0; col < columnCount; col++) {
            const temp = rowVal + col;
            if (randomNumbers.has(temp))
                bombMap[row][col].value = randomSetValue.value;
            else
                bombMap[row][col].value = baseValue.value;
        }
    }

    bombMap = setNumberValues(state, bombMap);

    return bombMap;
}

/**
 * Set the number of bombs adjacent to the current tile for each tile in the bomb map.
 */
export function setNumberValues(state: GameState, bombMap: TileValue[][]): TileValue[][] {

    const newBombMap = deepCopyTileValueArray(bombMap);

    for (let row = 0; row < state.rowCount; row++) {
        const rows = [row - 1, row, row + 1];
        for (let col = 0; col < state.columnCount; col++) {
            if (newBombMap[row][col].value === 'X')
                continue;

            const cols = [col - 1, col, col + 1];
            let counter = 0;

            for (let rowRange = 0; rowRange < 3; rowRange++) {
                for (let colRange = 0; colRange < 3; colRange++) {
                    const rowVal = rows[rowRange];
                    const colVal = cols[colRange];

                    if (rowVal >= 0 && rowVal < state.rowCount && colVal >= 0 && colVal < state.columnCount) {
                        if (newBombMap[rowVal][colVal].value === 'X') {
                            counter++;
                        }
                    }
                }
            }

            if (counter)
                newBombMap[row][col].value = counter;
            else
                newBombMap[row][col].value = undefined;
        }
    }

    return newBombMap;
}

/**
 * Create 2D array with given number of rows and columns.
 * Rows represent the first index of the array.
 * Columns represent the second index of the array.
 */
export function create2DArray(totalRows: number, totalColumns: number): TileValue[][] {
    const array2D: TileValue[][] = [];

    for (let row = 0; row < totalRows; row++) {
        array2D[row] = [];
        for (let col = 0; col < totalColumns; col++) {
            array2D[row][col] = { value: undefined };
        }
    }

    return array2D;
}