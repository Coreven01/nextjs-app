'use client';

import { MouseEventHandler, useState } from 'react';
import Board from "./board"
import styles from "./bombseeker.module.css"
import { TileValue } from './game-tile';

/**
 * 
 * @returns 
 */
export default function Game() {

    /** Number of columns on the bomb map. */
    const [columns, setColumns] = useState<number>(10);

    /** Number of rows on the bomb map. */
    const [rows, setRows] = useState<number>(10);

    /** Number of bombs to randomly place on the map. */
    const [bombCount, setBombCount] = useState<number>(10);

    /** Map of randomly placed bombs along with the numbers of how many bombs a tile is touching. */
    const [bombMap, setBombMap] = useState<TileValue[][]>([]);

    /** Map of which tiles are exposed, flagged, or questioned. */
    const [exposedMap, setExposedMap] = useState<TileValue[][]>([]);
    const [gameCreated, setGameCreated] = useState<boolean>(false);

    /** Used to determine if more than one mouse button is pressed. */
    const [doubleMouseDownEvents, setDoubleMouseDownEvent] = useState<React.MouseEvent<HTMLButtonElement, MouseEvent>[]>([]);

    /** Used to determine what tiles to highlight when pressing double mouse down. */
    const [adjacentTiles, setAdjacentTiles] = useState<number[][]>([]);

    if (!gameCreated) {
        setExposedMap(create2DArray(rows, columns));
        setBombMap(createBombMap(rows, columns, bombCount));
        setGameCreated(true);
    }

    function handlePlay(newExposedMap: TileValue[][]) {
        setExposedMap(newExposedMap);
    }

    function handleNewGame(rows: number, columns: number, bombCount: number) {
        setColumns(columns);
        setRows(rows);
        setBombCount(bombCount);
        setGameCreated(false);
    }

    function handleUpdate(rows: number, columns: number, bombCount: number) {
        setColumns(columns);
        setRows(rows);
        setBombCount(bombCount);
        setGameCreated(false);
    }

    const handleMouseDown: MouseEventHandler<HTMLButtonElement> = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        const newEvents = [...doubleMouseDownEvents, event];
        setDoubleMouseDownEvent(newEvents);
    }

    function handleMouseUp() {
        setDoubleMouseDownEvent([]);
    }

    function handleSetAdjacentTiles(tiles: number[][]) {
        setAdjacentTiles(tiles);
    }

    return (
        <div className={``} onContextMenu={(event) => event.preventDefault()}>
            <div className={`relative mx-auto flex w-full flex-col`}>
                <Board rows={rows} columns={columns} bombCount={bombCount} bombMap={bombMap}
                    exposedMap={exposedMap} adjacentTiles={adjacentTiles}
                    onPlay={handlePlay} onNewGame={handleNewGame} onUpdateMap={handleUpdate}
                    onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}
                    mouseEvents={doubleMouseDownEvents} onSetAdjacentTiles={handleSetAdjacentTiles} />
            </div>
            <div className={`${styles.gameInfo}`}>
                <ol>{ }</ol>
            </div>
        </div>
    );
}

/**
 * Creates 2D array with random bomb placement. Also sets the values for adjacent number of bombs the current tile is touching.
 * 
 * @param {number} rowNum 
 * @param {number} colNum 
 * @param {number} bombCount 
 * @returns 
 */
function createBombMap(rowNum: number, colNum: number, bombCount: number): TileValue[][] {
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
function setNumberValues(rowNum: number, colNum: number, bombMap: TileValue[][]): TileValue[][] {

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
function create2DArray(rowNum: number, colNum: number): TileValue[][] {
    const array2D: TileValue[][] = [];

    for (let r = 0; r < rowNum; r++) {
        array2D[r] = [];
        for (let c = 0; c < colNum; c++) {
            array2D[r][c] = { value: undefined };
        }
    }

    return array2D;
}