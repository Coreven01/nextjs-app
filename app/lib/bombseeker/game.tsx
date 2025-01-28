import GameTile, { TileValue } from "@/app/ui/bombseeker/game-tile";

function deepCopyTileValueArray(array: TileValue[][]): TileValue[][] {
    return [...array.map(e => [...e.map(t => { const r: TileValue = { value: t.value }; return r; })])];
}

/**
     * Return the new exposed map of tiles that were exposed from clicking on the row/column value for a tile.
     * All adjacent tiles will be exposed if the user clicked on a blank tile in the bomb map.
     * 
     * @param {*} row 
     * @param {*} column 
     * @param {*} bombMap 
     * @param {*} exposedMap 
     * @returns 
     */
export function getNewExposedMap(
    row: number, column: number,
    totalRows: number, totalColumns: number,
    bombMap: TileValue[][],
    exposedMap: TileValue[][],
    assignValue: TileValue) {

    const newExposedMap: TileValue[][] = deepCopyTileValueArray(exposedMap);
    let emptyAdjacentTiles: number[][] = [[row, column]];

    if (assignValue.value === 'E') {
        emptyAdjacentTiles = getEmptyAdjacentTiles(row, column, totalRows, totalColumns, bombMap, exposedMap, emptyAdjacentTiles);

        for (const emptyTile of emptyAdjacentTiles)
            if (!newExposedMap[emptyTile[0]][emptyTile[1]].value)
                newExposedMap[emptyTile[0]][emptyTile[1]].value = 'E';
    }

    newExposedMap[row][column].value = assignValue.value;

    return newExposedMap;
}

/**
 * Get all the empty tiles adjacent to the given row/column. This will return all empty tiles connected to the clicked tile.
 * 
 * @param row 
 * @param column 
 * @param bombMap 
 * @param emptyTiles 
 * @returns 2D array of row/column values of empty tiles adjacent to the given row/column.
 */
export function getEmptyAdjacentTiles(row: number, column: number, totalRows: number, totalColumns: number,
    bombMap: TileValue[][], exposedMap: TileValue[][], emptyTiles: number[][]): number[][] {

    let newEmptyTiles = [...emptyTiles.map(e => [...e])];

    // exit if the bomb map contains a value.
    if (bombMap[row][column].value)
        return newEmptyTiles;

    // tiles directly adjacent to the given row and column.
    const adj: number[][] = [[row - 1, column], [row + 1, column], [row, column - 1], [row, column + 1],
    [row - 1, column - 1], [row + 1, column - 1], [row + 1, column + 1], [row - 1, column + 1]];

    // iterate through the 8 adjacent tiles directly top, bottom, left, right, and diagnals.
    for (let i = 0; i < 8; i++) {
        const current = adj[i];

        // check to make sure the tile exists in the grid and the tile is not yet exposed.
        const tileIsValid = current[0] >= 0 && current[0] < totalRows && current[1] >= 0 && current[1] < totalColumns && !exposedMap[current[0]][current[1]].value;

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
                newEmptyTiles = getEmptyAdjacentTiles(current[0], current[1], totalRows, totalColumns, bombMap, exposedMap, newEmptyTiles);
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
export function getDirectAdjacentTiles(row: number, column: number, totalRows: number, totalColumns: number, bombMap: TileValue[][]): number[][] {

    const adjacentTiles: number[][] = [];
    const currentValue = parseInt(bombMap[row][column]?.value?.toString() ?? '-1', 10);

    if (currentValue >= 1 && currentValue <= 8) {

        const adj: number[][] = [[row - 1, column], [row + 1, column], [row, column - 1], [row, column + 1],
        [row - 1, column - 1], [row + 1, column - 1], [row + 1, column + 1], [row - 1, column + 1]];

        // iterate through the 8 adjacent tiles directly top, bottom, left, right, and diagnals.
        for (let i = 0; i < 8; i++) {
            let current: number[] = adj[i];
            if (current[0] >= 0 && current[0] < totalRows && current[1] >= 0 && current[1] < totalColumns) {
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
export function validateAndClickAjacentTiles(bombTileValue: number, row: number, column: number, totalRows: number, totalColumns: number,
    bombMap: TileValue[][], exposedMap: TileValue[][]): TileValue[][] {

    const directAdjacentTiles = getDirectAdjacentTiles(row, column, totalRows, totalColumns, bombMap);
    let questionMarkFound = false;
    let flaggedCount = 0;
    let newExposedMap: TileValue[][] = deepCopyTileValueArray(exposedMap);

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
                newExposedMap = getNewExposedMap(rowVal, colVal, totalRows, totalColumns, bombMap, newExposedMap, { value: 'E' });
        }
    }

    return newExposedMap;
}

export function isGameWon(totalRows: number, totalColumns: number, bombMap: TileValue[][], exposedMap: TileValue[][]): boolean {

    let retval = true;

    for (let row = 0; row < totalRows; row++) {
        for (let col = 0; col < totalColumns; col++) {
            const exposedTile = exposedMap[row][col];
            const bombTile = bombMap[row][col];

            if (exposedTile.value === '?')
                return false;

            if (exposedTile.value !== 'E' && exposedTile.value !== 'F')
                return false;

            if (exposedTile.value === 'F' && bombTile.value !== 'X')
                return false;
        }
    }

    return retval;
}

export type GameLostProps = {
    gameLost: boolean,
    bombTile: number[] | undefined,
    incorrectTiles: number[][]
}

export function isGameLost(totalRows: number, totalColumns: number, bombMap: TileValue[][], exposedMap: TileValue[][]): GameLostProps {

    const retval: GameLostProps = { gameLost: false, bombTile: undefined, incorrectTiles: [] };

    for (let row = 0; row < totalRows; row++) {
        for (let col = 0; col < totalColumns; col++) {
            const exposedTile = exposedMap[row][col];
            const bombTile = bombMap[row][col];

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

export function getBombsRemaining(totalRows: number, totalColumns: number, totalBombs: number, exposedMap: TileValue[][]): number {

    let retval = 0;
    let counter = 0;

    for (let row = 0; row < totalRows; row++) {
        for (let col = 0; col < totalColumns; col++) {
            const exposedTile = exposedMap[row][col];

            if (exposedTile.value === 'F')
                counter++;
        }
    }

    retval = totalBombs - counter;

    return retval;
}

/**
 * 
 * @param totalRows 
 * @param totalColumns 
 * @param bombMap 
 * @param exposedMap 
 * @param gameLost 
 * @param adjacentTiles 
 * @param onClickEvent 
 * @param onRightClickEvent 
 * @param onMouseUpEvent 
 * @param onMouseDownEvent 
 * @param onMouseLeave 
 * @returns 
 */
export function createGameTiles(totalRows: number,
    totalColumns: number,
    bombMap: TileValue[][],
    exposedMap: TileValue[][],
    gameLost: GameLostProps,
    adjacentTiles: number[][],
    disabled: boolean,
    onClickEvent: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => void,
    onRightClickEvent: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => void,
    onMouseUpEvent: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => void,
    onMouseDownEvent: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => void,
    onMouseLeave: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void) {

    const rowCells = []; // array of jsx GameTile to display

    for (let row = 0; row < totalRows; row++) {
        const tileCells = [];

        for (let col = 0; col < totalColumns; col++) {
            const exposedTile: TileValue = exposedMap[row][col];
            const bombTile: TileValue = bombMap[row][col];

            const keyVal = (row * totalColumns) + col;
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

            //isExposed ? bombTile : (isFlagged ? exposedTile : { value: undefined });

            let isAdjacentTileHighlight = false;

            if (adjacentTiles.length) {
                for (const tile of adjacentTiles) {
                    if (tile[0] === row && tile[1] === col && !exposedMap[row][col].value) {
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
export function createBombMap(rowNum: number, colNum: number, bombCount: number): TileValue[][] {
    const maxBombCount = rowNum * colNum;
    if (maxBombCount <= bombCount)
        throw new Error();

    const percentBombCover = Math.round(bombCount * 100 / maxBombCount);
    const randomSetValue: TileValue = { value: 'X' };
    const baseValue: TileValue = { value: undefined };
    let randomCounter = bombCount;

    let bombMap = create2DArray(rowNum, colNum);
    const randomNumbers = new Set();

    if (percentBombCover > 80){
        randomCounter = maxBombCount - bombCount;
        randomSetValue.value = undefined;
        baseValue.value = 'X';
    }

    while (randomNumbers.size < randomCounter) {
        const randomNum = Math.floor((Math.random() * maxBombCount));
        randomNumbers.add(randomNum);
    }

    for (let row = 0; row < rowNum; row++) {
        const rowVal = row * colNum;
        for (let col = 0; col < colNum; col++) {
            const temp = rowVal + col;
            if (randomNumbers.has(temp))
                bombMap[row][col].value = randomSetValue.value;
            else
                bombMap[row][col].value = baseValue.value;
        }
    }

    bombMap = setNumberValues(rowNum, colNum, bombMap);

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
export function setNumberValues(rowNum: number, colNum: number, bombMap: TileValue[][]): TileValue[][] {

    const newBombMap = deepCopyTileValueArray(bombMap);

    for (let row = 0; row < rowNum; row++) {
        const rows = [row - 1, row, row + 1];
        for (let col = 0; col < colNum; col++) {
            if (newBombMap[row][col].value === 'X')
                continue;

            const cols = [col - 1, col, col + 1];
            let counter = 0;

            for (let rowRange = 0; rowRange < 3; rowRange++) {
                for (let colRange = 0; colRange < 3; colRange++) {
                    const rowVal = rows[rowRange];
                    const colVal = cols[colRange];

                    if (rowVal >= 0 && rowVal < rowNum && colVal >= 0 && colVal < colNum) {
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