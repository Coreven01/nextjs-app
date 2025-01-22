import { MouseEventHandler, useRef } from 'react';
import GameTile from './game-tile'
import { TileValue } from './game-tile';
import styles from "@/app/ui/bombseeker/bombseeker.module.css"
import useDoubleMouseEvents from '@/app/lib/bombseeker/actions';

type Props = {

    /** Number of rows in the bomb map */
    rows: number,

    /** Number of columns in the bomb map */
    columns: number,

    /** Number of total bombs on the map */
    bombCount: number,

    /** 2D array of values in the bomb map. Dimensions should match the rows, columns. */
    bombMap: TileValue[][],

    /** 2D array of values of which tiles have been exposed by the user. Dimensions should match the rows, columns. */
    exposedMap: TileValue[][],

    /** Array of mouse events used to detect when a user is holding both mouse buttons down. */
    mouseEvents: React.MouseEvent<HTMLButtonElement, MouseEvent>[],

    /** Tiles directly adjacent to the current tile the user is clicking on. */
    adjacentTiles: number[][],

    /** Update the bomb map based on which tiles have been exposed */
    onPlay: (exposedMap: TileValue[][]) => void,

    /** Create a new game with the given number of rows/columns/bomb count */
    onNewGame: (rows: number, columns: number, bombCount: number) => void,
    onMouseDown: MouseEventHandler<HTMLButtonElement>,
    onMouseUp: MouseEventHandler<HTMLButtonElement>,

    /** Show a visual indicator to the user which for tiles will be "clicked" when using the double mouse click event. */
    onSetAdjacentTiles: (tiles: number[][]) => void,
}

/**
 * Mine sweeper game board
 * 
 * @param {*} param0 
 * @returns 
 */
export default function Board({ rows, columns, bombCount, bombMap, exposedMap, mouseEvents, adjacentTiles,
    onPlay, onNewGame, onMouseDown, onMouseUp, onSetAdjacentTiles }: Props) {

    const newBombValue = useRef<HTMLInputElement>(null);
    const newRowValue = useRef<HTMLInputElement>(null);
    const newColumnValue = useRef<HTMLInputElement>(null);

    const { shouldHandleDoubleMouseUp, shouldHandleClick, shouldHandleRightClick, handleDoubleMouseDown,
        handleDoubleMouseUp, handledClick, handledRightClick } = useDoubleMouseEvents();

    /**
     * Handle regular click of a tile. Exposes the tile and adjacent empty tiles if the tile is empty. If the tile is a bomb, then game over.
     * 
     * @param {*} row 
     * @param {*} column 
     * @param {*} id 
     * @returns 
     */
    function handleClickEvent(event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) {

        // console.log("Click: shouldHandleClick: ", shouldHandleClick);

        if (!shouldHandleClick || exposedMap[row][column].value === 'E' || exposedMap[row][column].value === 'F') {
            event.preventDefault();
            handledClick();
            return;
        }

        if (bombMap[row][column].value === 'X')
            onPlay([]); // set the exposed map to an empty array if game over.
        else
            onPlay(getNewExposedMap(row, column, rows, columns, bombMap, exposedMap, { value: 'E' }));

        handledClick();
    }

    /**
     * Flag the tile as a bomb. Clears the tile if already flagged.
     * 
     * @param {*} row 
     * @param {*} column 
     * @param {*} id 
     */
    function handleRightClickEvent(event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number, id: number) {

        // console.log("Right Click: shouldHandleRightClick: ", shouldHandleRightClick);

        if (!shouldHandleRightClick || exposedMap[row][column].value === 'E') {
            handledRightClick();
            return;
        }

        let newVal: TileValue = { value: undefined };
        if (!exposedMap[row][column].value)
            newVal.value = 'F';
        else if (exposedMap[row][column].value === 'F')
            newVal.value = '?';

        onPlay(getNewExposedMap(row, column, rows, columns, bombMap, exposedMap, newVal));
        handledRightClick();
    }

    /**
     * Prevent from clicking the tile if the mouse cursor exits the button area.
     * @param event 
     */
    function handleMouseLeave(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        if (adjacentTiles.length) {
            onMouseUp(event);
            onSetAdjacentTiles([]);
        }
    }

    /**
     * Feature that was in the original implmentation in Windows. When the user double mouse "upped" a tile, it would count as clicking each tile adjacent 
     * to the current tile. Pretty sure this would only work if there were no "?"ed tiles, and the flagged tile count matched the selected tile number.
     * If these scenarios are true, then click the surrounding tiles.
     * @param {*} event 
     * @param {*} row 
     * @param {*} column 
     * @param {*} id 
     */
    function handleMouseUpEvent(event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number, id: number) {

        //console.log("Mouse Up: shouldHandleDoubleMouseUp: ", shouldHandleDoubleMouseUp);

        if (shouldHandleDoubleMouseUp && mouseEvents.length > 1) {

            const bombTileValue: number = parseInt(bombMap[row][column].value?.toString() ?? "0", 10);
            if (bombTileValue) {
                const newExposedMap = validateAndClickAjacentTiles(bombTileValue, row, column, rows, columns, bombMap, exposedMap);
                if (newExposedMap)
                    onPlay(newExposedMap);
            }
        } else if (shouldHandleDoubleMouseUp) {
            handleDoubleMouseUp();
            setTimeout(() => {
                handledClick();
                handledRightClick();
            }, 50);
        }

        onMouseUp(event);
        onSetAdjacentTiles([]);
    }

    /**
     * 
     * @param event 
     * @param row 
     * @param column 
     * @param id 
     * @returns 
     */
    function handleMouseDownEvent(event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number, id: number) {

        // console.log("Mouse Down: shouldHandleDoubleMouseUp: ", shouldHandleDoubleMouseUp, "event: ", event);

        // track the events for mouse down events.
        // used to determine if the user is using the double mouse down/up feature.
        onMouseDown(event);

        if (mouseEvents.length >= 1) {

            handleDoubleMouseDown();
            const exposedValue: TileValue = exposedMap[row][column];

            // if the current tile is not yet exposed then ignore the double mouse down event.
            if (exposedValue.value !== 'E')
                return;

            const currentValue: TileValue = bombMap[row][column];
            const tempValue = parseInt(currentValue.value?.toString() ?? "0", 10);

            if (tempValue >= 1 && tempValue <= 9) {
                const adjacentTiles = getDirectAdjacentTiles(row, column, rows, columns, bombMap);
                const adjacentTilesToHighlight: number[][] = [];
                if (adjacentTiles.length) {
                    for (const tile of adjacentTiles) {
                        const adjacentValue = exposedMap[tile[0]][tile[1]];
                        if (adjacentValue.value === undefined || adjacentValue.value === 'F') {
                            adjacentTilesToHighlight.push(tile);
                        }
                    }
                }

                onSetAdjacentTiles(adjacentTilesToHighlight);
            }
        }
    }

    const gameLost = exposedMap === undefined || exposedMap.length === 0;
    const gameWon = isGameWon(rows, columns, bombMap, exposedMap);
    const rowCells = []; // array of react elements to display

    for (let r = 0; r < rows; r++) {
        const tileCells = [];
        for (let c = 0; c < columns; c++) {
            const keyVal = (r * columns) + c;
            const isExposed = (exposedMap && exposedMap.length > 0 && exposedMap[r][c].value === 'E') || gameLost;
            const isFlagged = exposedMap && exposedMap.length > 0 && (exposedMap[r][c].value === 'F' || exposedMap[r][c].value === '?');
            const displayValue: TileValue = isExposed ? bombMap[r][c] : (isFlagged ? exposedMap[r][c] : { value: undefined });
            let isAdjacentTileHighlight = false;

            if (adjacentTiles.length) {
                for (const tile of adjacentTiles) {
                    if (tile[0] === r && tile[1] === c && !exposedMap[r][c].value) {
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
                onTileClick={(event) => handleClickEvent(event, r, c)}
                onTileRightClick={(event) => {
                    event.preventDefault();
                    handleRightClickEvent(event, r, c, keyVal);
                }}
                onMouseUp={(event) => handleMouseUpEvent(event, r, c, keyVal)}
                onMouseDown={(event) => handleMouseDownEvent(event, r, c, keyVal)}
                onMouseLeave={(event) => handleMouseLeave(event)}
                disabled={false}>
            </GameTile>)
        }

        rowCells.push(<div key={-1 - r} className={`${styles.boardRow}`}>{tileCells}</div>);
    }

    return (
        <>
            <div className="flex flex-col md:flex-row justify-center items-center gap-4">
                <div className="">
                    <label
                        htmlFor="rowCount"
                        className="block font-medium my-2 dark:text-white"
                    >Row Count</label>
                    <input className="max-w-16 border-gray-300 bg-gray-100 text-gray-600 focus:ring-2"
                        id='rowCount'
                        type='number'
                        required
                        max={20}
                        ref={newRowValue}
                        defaultValue={rows}
                        placeholder='Row Count'></input>

                </div>
                <div className="">
                    <label
                        htmlFor="colCount"
                        className="block font-medium my-2 dark:text-white"
                    >Row Count</label>
                    <input className="max-w-fit border-gray-300 bg-gray-100 text-gray-600 focus:ring-2"
                        id='colCount'
                        type='number'
                        required
                        max={20}
                        ref={newColumnValue}
                        defaultValue={columns}
                        placeholder='Column Count'></input>
                </div>
                <div className="">
                    <label
                        htmlFor="rowCount"
                        className="block font-medium my-2 dark:text-white"
                    >Row Count</label>
                    <input className="max-w-fit border-gray-300 bg-gray-100 text-gray-600 focus:ring-2"
                        id='bombValue'
                        type='number'
                        required
                        max={20}
                        ref={newBombValue}
                        defaultValue={bombCount}
                        placeholder='Bomb Count'></input>
                </div>
            </div>
            <div className='my-2'>
                <button
                    className={`border block m-auto justify-center dark:border-white font-medium dark:text-white p-2 dark:bg-neutral-800`}
                    onClick={() => onNewGame(
                        newRowValue.current?.valueAsNumber ?? 0,
                        newColumnValue.current?.valueAsNumber ?? 0,
                        newBombValue.current?.valueAsNumber ?? 0)}>New Game</button>
            </div>
            {rowCells}
            <br />
            <div className={`${styles.gameStatus}`}>{gameLost ? "Game Over" : gameWon ? "You're Winner!" : ""}</div>
        </>
    );
}

/**
     * Return the new exposed map that were exposed from clicking on the row/column value.
     * 
     * @param {*} row 
     * @param {*} column 
     * @param {*} bombMap 
     * @param {*} exposedMap 
     * @returns 
     */
function getNewExposedMap(
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
 * Get all the empty tiles adjacent to the given row/column. 
 * 
 * @param row 
 * @param column 
 * @param bombMap 
 * @param emptyTiles 
 * @returns 2D array of row/column values of empty tiles adjacent to the given row/column.
 */
function getEmptyAdjacentTiles(row: number, column: number, totalRows: number, totalColumns: number,
    bombMap: TileValue[][], exposedMap: TileValue[][], emptyTiles: number[][]) {

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
 * Get the 9 tiles directly adjacent to the given row/column. Only returns the values if they are valid in the grid.
 * @param row Row value to find the adjacent tiles.
 * @param column Column value to find the adjacent tiles.
 * @returns 
 */
function getDirectAdjacentTiles(row: number, column: number, totalRows: number, totalColumns: number, bombMap: TileValue[][]): number[][] {
    const adjacentTiles: number[][] = [];

    const currentValue = parseInt(bombMap[row][column]?.value?.toString() ?? '-1', 10);

    if (currentValue >= 1 && currentValue <= 9) {

        const adj: number[][] = [[row - 1, column], [row + 1, column], [row, column - 1], [row, column + 1],
        [row - 1, column - 1], [row + 1, column - 1], [row + 1, column + 1], [row - 1, column + 1]];

        // iterate through the 8 adjacent tiles directly top, bottom, left, right, and diagnols.
        for (let i = 0; i < 8; i++) {
            let current: number[] = adj[i];
            if (current[0] >= 0 && current[0] < totalRows && current[1] >= 0 && current[1] < totalColumns) {
                adjacentTiles.push(current);
            }
        }
    }

    return adjacentTiles;
}

function validateAndClickAjacentTiles(bombTileValue: number, row: number, column: number, totalRows: number, totalColumns: number,
    bombMap: TileValue[][], exposedMap: TileValue[][]): TileValue[][] | undefined {
    const directAdjactTiles = getDirectAdjacentTiles(row, column, totalRows, totalColumns, bombMap);
    let questionMarkFound = false;
    let flaggedCount = 0;
    let bombFound = false;
    let retval = undefined;

    for (const adjTile of directAdjactTiles) {
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

        for (const adjTile of directAdjactTiles) {
            const rowVal = adjTile[0];
            const colVal = adjTile[1];

            if (exposedMap[rowVal][colVal].value === undefined)
                newExposedMap = getNewExposedMap(rowVal, colVal, totalRows, totalColumns, bombMap, exposedMap, { value: 'E' })
        }
        retval = newExposedMap;
    }

    return retval;
}

function isGameWon(totalRows: number, totalColumns: number, bombMap: TileValue[][], exposedMap: TileValue[][]): boolean {
    let retval = false;


    return retval;
}