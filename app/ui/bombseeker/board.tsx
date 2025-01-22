import { MouseEventHandler, useRef } from 'react';
import GameTile from './game-tile'
import { TileValue } from './game-tile';
import styles from "@/app/ui/bombseeker/bombseeker.module.css"

type Props = {
    rows: number,
    columns: number,
    bombCount: number,
    bombMap: TileValue[][],
    exposedMap: TileValue[][],
    mouseEvents: React.MouseEvent<HTMLButtonElement, MouseEvent>[],
    adjacentTiles: number[][],
    onPlay: (e: TileValue[][]) => void,
    onNewGame: (rows: number, columns: number, bombCount: number) => void,
    onUpdateMap: (rows: number, columns: number, bombCount: number) => void,
    onMouseDown: MouseEventHandler<HTMLButtonElement>,
    onMouseUp: MouseEventHandler<HTMLButtonElement>,
    onSetAdjacentTiles: (tiles: number[][]) => void,
}

/**
 * Mine sweeper game board
 * 
 * @param {*} param0 
 * @returns 
 */
export default function Board({ rows, columns, bombCount, bombMap, exposedMap, mouseEvents, adjacentTiles,
    onPlay, onNewGame, onUpdateMap, onMouseDown, onMouseUp, onSetAdjacentTiles }: Props) {

    const newBombValue = useRef<HTMLInputElement>(null);
    const newRowValue = useRef<HTMLInputElement>(null);
    const newColumnValue = useRef<HTMLInputElement>(null);

    /**
     * Handle regular click of a tile. Exposes the tile and adjacent empty tiles if the tile is not a bomb.
     * 
     * @param {*} row 
     * @param {*} column 
     * @param {*} id 
     * @returns 
     */
    function handleClick(event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number, id: number) {

        console.log('clicked id: ', id, row, column, 'exposed: ', exposedMap[row][column],
            'bomb map: ', bombMap[row][column], "current event: ", event, "mouse Events: ", mouseEvents);

        if (exposedMap[row][column].value === 'E' || exposedMap[row][column].value === 'F')
            return;

        if (bombMap[row][column].value === 'X')
            onPlay([]);
        else
            onPlay(getNewExposedMap(row, column, bombMap, exposedMap, { value: 'E' }));
    }

    /**
     * Flag the tile as a bomb. Clears the tile if already flagged.
     * 
     * @param {*} row 
     * @param {*} column 
     * @param {*} id 
     */
    function handleRightClick(event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number, id: number) {

        console.log("right click event: ", event, "mouse events: ", mouseEvents);

        if (exposedMap[row][column].value === 'E')
            return;

        let newVal: TileValue = { value: undefined };
        if (!exposedMap[row][column].value)
            newVal.value = 'F';
        else if (exposedMap[row][column].value === 'F')
            newVal.value = '?';

        onPlay(getNewExposedMap(row, column, bombMap, exposedMap, newVal));
    }

    function handleMouseLeave(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        if (adjacentTiles.length) {
            onMouseUp(event);
            onSetAdjacentTiles([]);
        }
    }

    /**
     * 
     * @param {*} event 
     * @param {*} row 
     * @param {*} column 
     * @param {*} id 
     */
    function handleDoubleMouseUp(event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number, id: number) {

        // enter this block if a double mouse down is detected.
        if (mouseEvents.length >= 2 && adjacentTiles.length) {
            const bombMapValue: number = parseInt(bombMap[row][column].value?.toString() ?? "0", 10);
            if (bombMapValue)
            {
                const directAdjactTiles = getDirectAdjacentTiles(row, column);
                for (const adjTile of directAdjactTiles)
                {

                }
            }
            console.log("double mouse up event: ", event, "mouse event: ", mouseEvents, "adjacent tile: ", adjacentTiles);
        }

        onMouseUp(event);
        onSetAdjacentTiles([]);
    }

    function handleDoubleMouseDown(event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number, id: number) {

        // if (event.buttons === 0)
        //     event.preventDefault();
        // else
        onMouseDown(event);

        console.log("double mouse down event: ", event, "mouse event: ", mouseEvents);

        if (mouseEvents.length >= 1) {
            const currentValue: TileValue = bombMap[row][column];
            const tempValue = parseInt(currentValue.value?.toString() ?? "0", 10);

            if (tempValue >= 1 && tempValue <= 9) {
                const adjacentTiles = getDirectAdjacentTiles(row, column);
                const adjacentTilesToHighlight: number[][] = [];
                if (adjacentTiles.length) {
                    for (const tile of adjacentTiles) {
                        const adjacentValue = exposedMap[tile[0]][tile[1]];
                        if (adjacentValue.value === undefined || adjacentValue.value === 'F') {
                            adjacentTilesToHighlight.push(tile);
                            console.log("tile to add for double mouse down: ", tile);
                        }
                    }
                }

                onSetAdjacentTiles(adjacentTilesToHighlight);
            }
        }
    }

    /**
     * Return the new exposed map that were exposed from clicking on the row/column value.
     * @param {*} row 
     * @param {*} column 
     * @param {*} bombMap 
     * @param {*} exposedMap 
     * @returns 
     */
    function getNewExposedMap(
        row: number, column: number,
        bombMap: TileValue[][],
        exposedMap: TileValue[][],
        assignValue: TileValue) {
        const newExposedMap = [...exposedMap.slice(0)];
        const emptyAdjacentTiles: number[][] = [[row, column]];

        if (assignValue.value === 'E') {
            getEmptyAdjacentTiles(row, column, bombMap, emptyAdjacentTiles);
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
    function getEmptyAdjacentTiles(row: number, column: number, bombMap: TileValue[][], emptyTiles: number[][]) {
        if (bombMap[row][column].value)
            return;

        const adj: number[][] = [[row - 1, column], [row + 1, column], [row, column - 1], [row, column + 1],
        [row - 1, column - 1], [row + 1, column - 1], [row + 1, column + 1], [row - 1, column + 1]];

        // iterate through the 8 adjacent tiles directly top, bottom, left, right, and diagnols.
        for (let i = 0; i < 8; i++) {
            let current = adj[i];
            if (current[0] >= 0 && current[0] < rows && current[1] >= 0 && current[1] < columns) {
                if (!exposedMap[current[0]][current[1]].value) {
                    let found = false;
                    for (const emptyTile of emptyTiles)
                        if (emptyTile[0] === current[0] && emptyTile[1] === current[1]) {
                            found = true;
                            break;
                        }

                    if (!found) {
                        emptyTiles.push(current);
                        getEmptyAdjacentTiles(current[0], current[1], bombMap, emptyTiles);
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
    function getDirectAdjacentTiles(row: number, column: number): number[][] {
        const adjacentTiles: number[][] = [];

        if (mouseEvents.length >= 1) {
            const currentValue = parseInt(bombMap[row][column]?.value?.toString() ?? '-1', 10);

            if (currentValue >= 1 && currentValue <= 9) {

                const adj: number[][] = [[row - 1, column], [row + 1, column], [row, column - 1], [row, column + 1],
                [row - 1, column - 1], [row + 1, column - 1], [row + 1, column + 1], [row - 1, column + 1]];

                // iterate through the 8 adjacent tiles directly top, bottom, left, right, and diagnols.
                for (let i = 0; i < 8; i++) {
                    let current: number[] = adj[i];
                    if (current[0] >= 0 && current[0] < rows && current[1] >= 0 && current[1] < columns) {
                        adjacentTiles.push(current);
                    }
                }
            }
        }

        return adjacentTiles;
    }

    const gameLost = exposedMap === undefined || exposedMap.length === 0;
    const gameWon = false;
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
                onTileClick={(event) => handleClick(event, r, c, keyVal)}
                onTileRightClick={(event) => {
                    event.preventDefault();
                    handleRightClick(event, r, c, keyVal);
                }}
                onDoubleMouseUp={(event) => handleDoubleMouseUp(event, r, c, keyVal)}
                onDoubleMouseDown={(event) => handleDoubleMouseDown(event, r, c, keyVal)}
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
            <div className={`${styles.gameStatus}`}>{gameLost ? "Game Over" : ""}</div>
        </>
    );
}