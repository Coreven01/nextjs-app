import GameTile, { TileValue } from "@/app/ui/bombseeker/game-tile";
import { GameState } from "./gameStateReducer";

/** Create a deep copy of the array of tile value arrays */
function deepCopyTileValueArray(array: TileValue[][]): TileValue[][] {
    return [...array.map(e => [...e.map(t => { const r: TileValue = { value: t.value }; return r; })])];
}

/**
     * Return the new exposed map of tiles that were exposed from clicking on the row/column value for a tile.
     * All adjacent tiles will be exposed if the user clicked on a blank tile in the bomb map.
     * 
     * @param {*} selectedRow 
     * @param {*} selectedColumn 
     * @param {*} bombMap 
     * @param {*} exposedMap 
     * @returns 
     */
export function getNewExposedMap(
    selectedRow: number,
    selectedColumn: number,
    state: GameState,
    assignValue: TileValue) {

    const newExposedMap: TileValue[][] = deepCopyTileValueArray(state.exposedMap);
    let emptyAdjacentTiles: number[][] = [[selectedRow, selectedColumn]];

    if (assignValue.value === 'E') {
        emptyAdjacentTiles = getEmptyAdjacentTiles(selectedRow, selectedColumn, state, emptyAdjacentTiles);

        for (const emptyTile of emptyAdjacentTiles)
            if (!newExposedMap[emptyTile[0]][emptyTile[1]].value)
                newExposedMap[emptyTile[0]][emptyTile[1]].value = 'E';
    }

    newExposedMap[selectedRow][selectedColumn].value = assignValue.value;

    return newExposedMap;
}

/**
 * Get all the empty tiles adjacent to the given row/column. This will return all empty tiles connected to the clicked tile.
 * 
 * @param selectedRow 
 * @param selectedColumn 
 * @param bombMap 
 * @param emptyTiles 
 * @returns 2D array of row/column values of empty tiles adjacent to the given row/column.
 */
export function getEmptyAdjacentTiles(selectedRow: number, selectedColumn: number, state: GameState, emptyTiles: number[][]): number[][] {

    let newEmptyTiles = [...emptyTiles.map(e => [...e])];

    // exit if the bomb map contains a value.
    if (state.bombMap[selectedRow][selectedColumn].value)
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
            !state.exposedMap[current[0]][current[1]].value;

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
                newEmptyTiles = getEmptyAdjacentTiles(current[0], current[1], state, newEmptyTiles);
            }

        }
    }

    return newEmptyTiles;
}

/**
 * Get the 8 tiles directly adjacent to the given row/column. Only returns the values if they are valid in the grid.
 * 
 * @param row Row value to find the adjacent tiles.
 * @param column Column value to find the adjacent tiles.
 * @returns 
 */
export function getDirectAdjacentTiles(row: number, column: number, state: GameState): number[][] {

    const adjacentTiles: number[][] = [];
    const tileValue = parseInt(state.bombMap[row][column].value?.toString() ?? '-1', 10);

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
 * 
 * @param bombTileValue 
 * @param row 
 * @param column 
 * @param totalRows 
 * @param totalColumns 
 * @param bombMap 
 * @param exposedMap 
 * @returns 
 */
export function validateAndClickAjacentTiles(bombTileValue: number, row: number, column: number, state: GameState): TileValue[][] {

    const directAdjacentTiles = getDirectAdjacentTiles(row, column, state);
    let questionMarkFound = false;
    let flaggedCount = 0;
    let newExposedMap: TileValue[][] = deepCopyTileValueArray(state.exposedMap);

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
                newExposedMap = getNewExposedMap(rowVal, colVal, state, { value: 'E' });
        }
    }

    return newExposedMap;
}

export function isGameWon(state: GameState): boolean {

    for (let row = 0; row < state.rowCount; row++) {
        for (let col = 0; col < state.columnCount; col++) {
            const exposedTile = state.exposedMap[row][col];
            const bombTile = state.bombMap[row][col];

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

export function isGameLost(state: GameState): GameLostProps {

    const retval: GameLostProps = { gameLost: false, bombTile: undefined, incorrectTiles: [] };

    for (let row = 0; row < state.rowCount; row++) {
        for (let col = 0; col < state.columnCount; col++) {
            const exposedTile = state.exposedMap[row][col];
            const bombTile = state.bombMap[row][col];

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

export function getBombsRemaining(state: GameState): number {

    let retval = 0;
    let counter = 0;

    for (let row = 0; row < state.rowCount; row++) {
        for (let col = 0; col < state.columnCount; col++) {
            const exposedTile = state.exposedMap[row][col];

            if (exposedTile.value === 'F')
                counter++;
        }
    }

    retval = state.bombCount - counter;

    return retval;
}


export function createGameTiles(
    state: GameState,
    gameLost: GameLostProps,
    adjacentTiles: number[][],
    disabled: boolean,
    onClickEvent: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => void,
    onRightClickEvent: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => void,
    onMouseUpEvent: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => void,
    onMouseDownEvent: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => void,
    onMouseLeave: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void) {

    const rowCells = []; // array of jsx GameTile to display

    for (let row = 0; row < state.rowCount; row++) {
        const tileCells = [];

        for (let col = 0; col < state.columnCount; col++) {
            const exposedTile: TileValue = state.exposedMap[row][col];
            const bombTile: TileValue = state.bombMap[row][col];

            const keyVal = (row * state.columnCount) + col;
            const isExposed = exposedTile.value === 'E' && bombTile.value !== "X";
            const isFlagged = exposedTile.value === 'F' || exposedTile.value === '?';
            const isGameOverBomb = gameLost.gameLost && bombTile.value === 'X' && gameLost.bombTile && gameLost.bombTile[0] === row && gameLost.bombTile[1] === col;
            const clickedBomb = gameLost.gameLost && gameLost.bombTile && gameLost.bombTile[0] === row && gameLost.bombTile[1] === col

            let incorrectFlag = false;
            const displayValue: TileValue = { value: undefined };

            if (gameLost.gameLost && gameLost.incorrectTiles?.length) {
                for (const tile of gameLost.incorrectTiles)
                    if (tile[0] === row && tile[1] === col)
                        incorrectFlag = true;
            }

            if (incorrectFlag)
                displayValue.value = "I";
            else if (clickedBomb)
                displayValue.value = "T";
            else if (isGameOverBomb)
                displayValue.value = "T";
            else if (isExposed)
                displayValue.value = bombTile.value;
            else if (isFlagged)
                displayValue.value = exposedTile.value;
            else if (gameLost.gameLost && bombTile.value === "X")
                displayValue.value = "X";

            let isAdjacentTileHighlight = false;

            if (adjacentTiles.length) {
                for (const tile of adjacentTiles) {
                    if (tile[0] === row && tile[1] === col && !state.exposedMap[row][col].value) {
                        isAdjacentTileHighlight = true;
                        break;
                    }
                }
            }

            tileCells.push(<GameTile
                key={keyVal}
                id={keyVal}
                displayValue={displayValue}
                exposed={isExposed}
                highlight={isAdjacentTileHighlight}
                onTileClick={(event) => onClickEvent(event, row, col)}
                onTileRightClick={(event) => {
                    event.preventDefault();
                    onRightClickEvent(event, row, col);
                }}
                onMouseUp={(event) => onMouseUpEvent(event, row, col)}
                onMouseDown={(event) => onMouseDownEvent(event, row, col)}
                onMouseLeave={(event) => onMouseLeave(event)}
                disabled={disabled}>
            </GameTile>);
        }

        rowCells.push(<div key={-1 - row} className="flex items-center justify-center">{tileCells}</div>);
    }

    return rowCells;
}

/**
 * Creates 2D array with random bomb placement. Also sets the values for adjacent number of bombs the current tile is touching.
 * 
 * @param {number} rowNum 
 * @param {number} colNum 
 * @param {number} bombCount 
 * @returns 
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

    bombMap = setNumberValues(state);

    return bombMap;
}

/**
 * Set the number of bombs adjacent to the current tile for each tile in the bomb map.
 * 
 * @param {*} rowNum 
 * @param {*} colNum 
 * @param {*} area 
 * @returns 
 */
export function setNumberValues(state: GameState): TileValue[][] {

    const newBombMap = deepCopyTileValueArray(state.bombMap);

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
 * @param rowNum Number of rows
 * @param colNum Number of columns
 * @returns 
 */
export function create2DArray(rowNum: number, colNum: number): TileValue[][] {
    const array2D: TileValue[][] = [];

    for (let row = 0; row < rowNum; row++) {
        array2D[row] = [];
        for (let col = 0; col < colNum; col++) {
            array2D[row][col] = { value: undefined };
        }
    }

    return array2D;
}