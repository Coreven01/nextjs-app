import { TileValue } from '@/features/bombseeker/components/game-tile';
import { GameState } from '../state/gameStateReducer';
import { GameMapState } from '../state/gameMapReducer';

/**
 * @file game.ts
 * @description This file contains logic functions for creating and updating the bomb seeker game.
 *
 * Functions:
 *
 * Author: Nolan Appel
 * Date: 2025-02-01
 */

export type GameLostProps = {
  gameLost: boolean;
  bombTile: number[] | undefined;
  incorrectTiles: number[][];
};

/** Create a deep copy of the array of tile value arrays */
function deepCopyTileValueArray(array: TileValue[][]): TileValue[][] {
  return [
    ...array.map((e) => [
      ...e.map((t) => {
        return t;
      })
    ])
  ];
}

/**
 * Return the new exposed map of tiles that were exposed from clicking on the row/column value for a tile.
 * All adjacent tiles will be exposed if the user clicked on a blank tile in the bomb map.
 */
function getNewExposedMap(
  selectedRow: number,
  selectedColumn: number,
  state: GameState,
  mapState: GameMapState,
  assignValue: TileValue
) {
  const newExposedMap: TileValue[][] = deepCopyTileValueArray(mapState.exposedMap);
  let emptyAdjacentTiles: number[][] = [[selectedRow, selectedColumn]];

  if (assignValue === 'exposed') {
    emptyAdjacentTiles = getEmptyAdjacentTiles(
      selectedRow,
      selectedColumn,
      state,
      mapState,
      emptyAdjacentTiles
    );

    for (const emptyTile of emptyAdjacentTiles)
      if (!newExposedMap[emptyTile[0]][emptyTile[1]]) newExposedMap[emptyTile[0]][emptyTile[1]] = 'exposed';
  }

  newExposedMap[selectedRow][selectedColumn] = assignValue;

  return newExposedMap;
}

function getNewExposedMapForHint(
  selectedRow: number,
  selectedColumn: number,
  state: GameState,
  mapState: GameMapState
) {
  const newExposedMap: TileValue[][] = deepCopyTileValueArray(mapState.exposedMap);
  const adjacentTiles = getDirectAdjacentTiles(selectedRow, selectedColumn, state, mapState);
  for (const tile of adjacentTiles) {
    if (mapState.bombMap[tile[0]][tile[1]] === 'bomb') {
      newExposedMap[tile[0]][tile[1]] = 'flag';
    } else {
      newExposedMap[tile[0]][tile[1]] = 'exposed';
    }
  }

  return newExposedMap;
}

/**
 * Get all the empty tiles adjacent to the given row/column. This will return all empty tiles connected to the clicked tile.
 * @returns 2D array of row/column values of empty tiles adjacent to the given row/column.
 */
function getEmptyAdjacentTiles(
  selectedRow: number,
  selectedColumn: number,
  state: GameState,
  mapState: GameMapState,
  emptyTiles: number[][]
): number[][] {
  let newEmptyTiles = [...emptyTiles.map((e) => [...e])];

  // exit if the bomb map contains a value.
  if (mapState.bombMap[selectedRow][selectedColumn]) return newEmptyTiles;

  // tiles directly adjacent to the given row and column, excluding the given row/column tile.
  const adjTiles: number[][] = getAdjacentTilesArray(selectedRow, selectedColumn, state);

  // iterate through the adjacent tiles.
  for (let i = 0; i < adjTiles.length; i++) {
    const currentTile = adjTiles[i];

    // check to make sure the tile is not yet exposed/flagged.
    const tileIsValid = !mapState.exposedMap[currentTile[0]][currentTile[1]];

    if (tileIsValid) {
      let found = false;

      // check to make sure the current tile has not yet been tested. if already in the empty tile list, then skip the current tile.
      const foundTile = newEmptyTiles.find(
        (emptyTile) => emptyTile[0] === currentTile[0] && emptyTile[1] === currentTile[1]
      );
      if (foundTile) {
        found = true;
      }

      if (!found) {
        newEmptyTiles.push(currentTile);

        // recursively find all the next adjacent tiles for the found empty tile.
        newEmptyTiles = getEmptyAdjacentTiles(currentTile[0], currentTile[1], state, mapState, newEmptyTiles);
      }
    }
  }

  return newEmptyTiles;
}

/**
 * Get the 8 tiles directly adjacent to the given row/column. Only returns the values if they are valid in the grid.
 */
function getDirectAdjacentTiles(
  row: number,
  column: number,
  state: GameState,
  mapState: GameMapState
): number[][] {
  const tileValue = parseInt(mapState.bombMap[row][column]?.toString() ?? '-1', 10);

  // verify between 1 and 8 because the tile value should not be more than adjacent 8 tile.
  if (tileValue >= 1 && tileValue <= 8) {
    return getAdjacentTilesArray(row, column, state);
  } else {
    throw Error('Invalid tile value.');
  }
}

/**
 * This will be triggered when the user uses the double mouse up feature to click all surrounding tiles.
 * This will validate that the feature should be used, and if valid, click the surrounding tiles.
 */
function validateAndClickAdjacentTiles(
  bombTileValue: number,
  row: number,
  column: number,
  state: GameState,
  mapState: GameMapState
): TileValue[][] {
  const directAdjacentTiles = getDirectAdjacentTiles(row, column, state, mapState);
  let questionMarkFound = false;
  let flaggedCount = 0;
  let newExposedMap: TileValue[][] = deepCopyTileValueArray(mapState.exposedMap);

  // the function (game feature) should only work if the number value of the bomb tile matches the number of flagged adjacent tiles.
  // should also only work if no adjacent tile is set to 'Unknown' (?)
  // ends the game if there's a bomb adjacent to the clicked tile that hasn't been flagged.

  for (const adjTile of directAdjacentTiles) {
    const rowVal = adjTile[0];
    const colVal = adjTile[1];

    if (newExposedMap[rowVal][colVal] === 'unknown') questionMarkFound = true;

    if (newExposedMap[rowVal][colVal] === 'flag') flaggedCount++;
  }

  if (!questionMarkFound && flaggedCount == bombTileValue) {
    for (const adjTile of directAdjacentTiles) {
      const rowVal = adjTile[0];
      const colVal = adjTile[1];

      if (newExposedMap[rowVal][colVal] === undefined)
        newExposedMap = getNewExposedMap(
          rowVal,
          colVal,
          state,
          { ...mapState, exposedMap: newExposedMap },
          'exposed'
        );
    }
  }

  return newExposedMap;
}

/** Determine if the game was won. */
function isGameWon(state: GameState, mapState: GameMapState): boolean {
  if (!state.gameCreated) return false;

  if (mapState.exposedMap.find((tile) => tile === undefined)) return false;

  for (let row = 0; row < state.rowCount; row++) {
    for (let col = 0; col < state.columnCount; col++) {
      const exposedTile = mapState.exposedMap[row][col];
      const bombTile = mapState.bombMap[row][col];

      if (exposedTile === 'unknown') return false;

      if (exposedTile !== 'exposed' && exposedTile !== 'flag') return false;

      if (exposedTile === 'flag' && bombTile !== 'bomb') return false;
    }
  }

  return true;
}

/** Determine if the game was lost.
 * @returns Which bomb tile was clicked that lost the game, and which tiles were incorrectly flagged.
 */
function isGameLost(state: GameState, mapState: GameMapState): GameLostProps {
  const retval: GameLostProps = {
    gameLost: false,
    bombTile: undefined,
    incorrectTiles: []
  };

  if (!state.gameCreated) return retval;

  for (let row = 0; row < state.rowCount; row++) {
    for (let col = 0; col < state.columnCount; col++) {
      const exposedTile = mapState.exposedMap[row][col];
      const bombTile = mapState.bombMap[row][col];

      if (exposedTile === 'exposed' && bombTile === 'bomb') {
        retval.gameLost = true;
        retval.bombTile = [row, col];
      }

      if (exposedTile === 'flag' && bombTile !== 'bomb') retval.incorrectTiles.push([row, col]);
    }
  }

  return retval;
}

/** Number of bombs remaining. The map bomb count minus the number of flagged tiles. */
function getBombsRemaining(state: GameState, mapState: GameMapState): number {
  if (!state.gameCreated) return 0;

  let counter = 0;

  for (let row = 0; row < state.rowCount; row++) {
    for (let col = 0; col < state.columnCount; col++) {
      const exposedTile = mapState.exposedMap[row][col];

      if (exposedTile === 'flag') counter++;
    }
  }

  return state.bombCount - counter;
}

/**
 * Creates 2D array with random bomb placement. Also sets the values for adjacent number of bombs the current tile is touching.
 */
function createBombMap(rowCount: number, columnCount: number, bombCount: number): TileValue[][] {
  const maxBombCount = rowCount * columnCount;
  if (maxBombCount <= bombCount) throw new Error();

  const percentBombCover = Math.round((bombCount * 100) / maxBombCount);
  let randomSetValue: TileValue = 'bomb';
  let baseValue: TileValue = undefined;
  let randomCounter = bombCount;

  let bombMap = create2DArray(rowCount, columnCount);
  const randomNumbers = new Set();

  if (percentBombCover > 80) {
    randomCounter = maxBombCount - bombCount;
    randomSetValue = undefined;
    baseValue = 'bomb';
  }

  while (randomNumbers.size < randomCounter) {
    const randomNum = Math.floor(Math.random() * maxBombCount);
    randomNumbers.add(randomNum);
  }

  for (let row = 0; row < rowCount; row++) {
    const rowVal = row * columnCount;
    for (let col = 0; col < columnCount; col++) {
      const temp = rowVal + col;
      if (randomNumbers.has(temp)) bombMap[row][col] = randomSetValue;
      else bombMap[row][col] = baseValue;
    }
  }

  bombMap = setNumberValues(rowCount, columnCount, bombMap);

  return bombMap;
}

/**
 * This is used to initialize the bomb map with the number of bombs adjacent to each tile in the bomb map.
 */
function setNumberValues(rowCount: number, columnCount: number, bombMap: TileValue[][]): TileValue[][] {
  const newBombMap = deepCopyTileValueArray(bombMap);

  for (let row = 0; row < rowCount; row++) {
    const rows = [row - 1, row, row + 1];
    for (let col = 0; col < columnCount; col++) {
      if (newBombMap[row][col] === 'bomb') continue;

      const cols = [col - 1, col, col + 1];
      let counter = 0;

      for (let rowRange = 0; rowRange < 3; rowRange++) {
        for (let colRange = 0; colRange < 3; colRange++) {
          const rowVal = rows[rowRange];
          const colVal = cols[colRange];

          if (rowVal >= 0 && rowVal < rowCount && colVal >= 0 && colVal < columnCount) {
            if (newBombMap[rowVal][colVal] === 'bomb') {
              counter++;
            }
          }
        }
      }

      if (counter) newBombMap[row][col] = counter;
      else newBombMap[row][col] = undefined;
    }
  }

  return newBombMap;
}

/**
 * Create 2D array with given number of rows and columns.
 * Rows represent the first index of the array.
 * Columns represent the second index of the array.
 */
function create2DArray(totalRows: number, totalColumns: number): TileValue[][] {
  const array2D: TileValue[][] = [];

  for (let row = 0; row < totalRows; row++) {
    array2D[row] = [];
    for (let col = 0; col < totalColumns; col++) {
      array2D[row][col] = undefined;
    }
  }

  return array2D;
}

/** 8 adjacent tiles next to the given row/column. */
function getAdjacentTilesArray(row: number, column: number, state: GameState) {
  // get valid row and column values.
  const adjacentRows = [row - 1, row, row + 1].filter((r) => r >= 0 && r < state.rowCount);
  const adjacentColumns = [column - 1, column, column + 1].filter((c) => c >= 0 && c < state.columnCount);

  // tiles directly adjacent to the given row and column, excluding the given row/column tile.
  const adjTiles: number[][] = adjacentRows
    .map((row) => adjacentColumns.map((col) => [row, col]))
    .flat()
    .filter((val) => val[0] !== row || val[1] !== column);

  return adjTiles;
}

export {
  create2DArray,
  setNumberValues,
  createBombMap,
  getNewExposedMap,
  getBombsRemaining,
  validateAndClickAdjacentTiles,
  getDirectAdjacentTiles,
  isGameLost,
  isGameWon,
  getEmptyAdjacentTiles,
  getNewExposedMapForHint
};
