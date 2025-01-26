import GameTile, { TileValue } from "@/app/ui/bombseeker/game-tile";

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

    const newExposedMap = [...exposedMap.slice(0)];
    const emptyAdjacentTiles: number[][] = [[row, column]];

    if (assignValue.value === 'E') {
        getEmptyAdjacentTiles(row, column, totalRows, totalColumns, bombMap, exposedMap, emptyAdjacentTiles);

        for (const emptyTile of emptyAdjacentTiles)
            if (!newExposedMap[emptyTile[0]][emptyTile[1]].value)
                newExposedMap[emptyTile[0]][emptyTile[1]].value = 'E';
    }

    newExposedMap[row][column] = assignValue;

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
    bombMap: TileValue[][], exposedMap: TileValue[][], emptyTiles: number[][]) {

    // exit if the bomb map contains a value.
    if (bombMap[row][column].value)
        return;

    const adj: number[][] = [[row - 1, column], [row + 1, column], [row, column - 1], [row, column + 1],
    [row - 1, column - 1], [row + 1, column - 1], [row + 1, column + 1], [row - 1, column + 1]];

    // iterate through the 8 adjacent tiles directly top, bottom, left, right, and diagnols.
    for (let i = 0; i < 8; i++) {
        let current = adj[i];
        if (current[0] >= 0 && current[0] < totalRows && current[1] >= 0 && current[1] < totalColumns) {
            if (!exposedMap[current[0]][current[1]].value) {
                let found = false;
                for (const emptyTile of emptyTiles)
                    if (emptyTile[0] === current[0] && emptyTile[1] === current[1]) {
                        found = true;
                        break;
                    }

                if (!found) {
                    emptyTiles.push(current);

                    // recursively find all the next adjacent tiles for the found empty tile.
                    getEmptyAdjacentTiles(current[0], current[1], totalRows, totalColumns, bombMap, exposedMap, emptyTiles);
                }
            }
        }
    }
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

    if (currentValue >= 1 && currentValue <= 9) {

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
    bombMap: TileValue[][], exposedMap: TileValue[][]): TileValue[][] | undefined {

    const directAdjacentTiles = getDirectAdjacentTiles(row, column, totalRows, totalColumns, bombMap);
    let questionMarkFound = false;
    let flaggedCount = 0;
    let bombFound = false;
    let retval = undefined;

    // the feature should only work if the number value of the bomb tile matches the number of flagged adjacent tiles.
    // should also only work if no adjacent tile is set to 'Unknown' (?)
    // ends the game if there's a bomb adjacent to the clicked tile that hasn't been flagged.
    
    for (const adjTile of directAdjacentTiles) {
        const rowVal = adjTile[0];
        const colVal = adjTile[1];

        if (exposedMap[rowVal][colVal].value === "?")
            questionMarkFound = true;

        if (exposedMap[rowVal][colVal].value === "F")
            flaggedCount++;

        if (exposedMap[rowVal][colVal].value === undefined && bombMap[rowVal][colVal].value === "X")
            bombFound = true;
    }

    if (!questionMarkFound && flaggedCount === bombTileValue && bombFound)
        retval = []; // set the exposed map to an empty array if game over.
    else if (!questionMarkFound && flaggedCount == bombTileValue) {
        let newExposedMap: TileValue[][] = exposedMap;

        for (const adjTile of directAdjacentTiles) {
            const rowVal = adjTile[0];
            const colVal = adjTile[1];

            if (exposedMap[rowVal][colVal].value === undefined)
                newExposedMap = getNewExposedMap(rowVal, colVal, totalRows, totalColumns, bombMap, exposedMap, { value: 'E' })
        }
        retval = newExposedMap;
    }

    return retval;
}

export function isGameWon(totalRows: number, totalColumns: number, bombMap: TileValue[][], exposedMap: TileValue[][]): boolean {

    let retval = true;

    for (let r = 0; r < totalRows; r++) {
        for (let c = 0; c < totalColumns; c++) {
            const exposedTile = exposedMap[r][c];
            const bombTile = bombMap[r][c];

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

    for (let r = 0; r < totalRows; r++) {
        for (let c = 0; c < totalColumns; c++) {
            const exposedTile = exposedMap[r][c];
            const bombTile = bombMap[r][c];

            if (exposedTile.value === 'E' && bombTile.value === 'X'){
                retval.gameLost = true;
                retval.bombTile = [r, c];
            }

            if (exposedTile.value === 'F' && bombTile.value !== 'X')
                retval.incorrectTiles.push([r, c]);
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

export function createGameTiles(totalRows: number,
    totalColumns: number,
    bombMap: TileValue[][],
    exposedMap: TileValue[][],
    gameLost: GameLostProps,
    adjacentTiles: number[][],
    onClickEvent: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => void,
    onRightClickEvent: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => void,
    onMouseUpEvent: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => void,
    onMouseDownEvent: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => void,
    onMouseLeave: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void) {

    const rowCells = []; // array of react elements to display

    for (let row = 0; row < totalRows; row++) {
        const tileCells = [];

        for (let col = 0; col < totalColumns; col++) {
            const keyVal = (row * totalColumns) + col;
            const isExposed = (exposedMap && exposedMap.length > 0 && exposedMap[row][col].value === 'E') || gameLost.gameLost;
            const isFlagged = exposedMap && exposedMap.length > 0 && (exposedMap[row][col].value === 'F' || exposedMap[row][col].value === '?');
            const displayValue: TileValue = isExposed ? bombMap[row][col] : (isFlagged ? exposedMap[row][col] : { value: undefined });
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
                disabled={false}>
            </GameTile>)
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
    const gridCount = rowNum * colNum;
    if (gridCount <= bombCount)
        throw new Error();

    const bombMap = create2DArray(rowNum, colNum);
    const randomNumbers = new Set();

    while (randomNumbers.size < bombCount) {
        const num = Math.floor((Math.random() * gridCount)) + 1;
        randomNumbers.add(num);
    }

    for (let i = 0; i < rowNum; i++) {
        const rowVal = i * colNum;
        for (let j = 0; j < colNum; j++) {
            const temp = rowVal + j;
            if (randomNumbers.has(temp))
                bombMap[i][j].value = 'X';
            else
                bombMap[i][j].value = undefined;
        }
    }

    setNumberValues(rowNum, colNum, bombMap);

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

    for (let r = 0; r < rowNum; r++) {
        const rows = [r - 1, r, r + 1];
        for (let c = 0; c < colNum; c++) {
            if (bombMap[r][c].value === 'X')
                continue;

            const cols = [c - 1, c, c + 1];
            let counter = 0;

            for (let rowRange = 0; rowRange < 3; rowRange++) {
                for (let colRange = 0; colRange < 3; colRange++) {
                    const row = rows[rowRange];
                    const col = cols[colRange];

                    if (row >= 0 && row < rowNum && col >= 0 && col < colNum) {
                        if (bombMap[row][col].value === 'X') {
                            counter++;
                        }
                    }
                }
            }

            if (counter)
                bombMap[r][c].value = counter;
            else
                bombMap[r][c].value = undefined;
        }
    }

    return bombMap;
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

    for (let r = 0; r < rowNum; r++) {
        array2D[r] = [];
        for (let c = 0; c < colNum; c++) {
            array2D[r][c] = { value: undefined };
        }
    }

    return array2D;
}