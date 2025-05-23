import React, { useMemo } from 'react';
import { GameLostProps, getDirectAdjacentTiles } from '@/features/bombseeker/utils/game';
import { GameState } from '@/features/bombseeker/state/gameStateReducer';
import { GameMapState } from '@/features/bombseeker/state/gameMapReducer';
import GameTile, { TileValue } from './game-tile';

type Props = {
  state: GameState;
  mapState: GameMapState;
  gameLost: GameLostProps;
  tilesToHighlight: number[][];
  disabled: boolean;
  hintActivated: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => void;
  onRightClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => void;
  onMouseUp: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => void;
  onMouseDown: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => void;
  onMouseLeave: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
};

/**
 * Create the game board tiles with the correct color, number, icon based on the given information.
 * @param param0
 * @returns
 */
export default function GameBoardTiles({
  state,
  mapState,
  gameLost,
  tilesToHighlight,
  disabled,
  hintActivated,
  onClick,
  onRightClick,
  onMouseUp,
  onMouseDown,
  onMouseLeave
}: Props) {
  const tiles = useMemo(
    () =>
      createGameTiles(
        state,
        mapState,
        gameLost,
        tilesToHighlight,
        disabled,
        hintActivated,
        onClick,
        onRightClick,
        onMouseUp,
        onMouseDown,
        onMouseLeave
      ),
    [
      state,
      mapState,
      gameLost,
      tilesToHighlight,
      disabled,
      hintActivated,
      onClick,
      onRightClick,
      onMouseUp,
      onMouseDown,
      onMouseLeave
    ]
  );

  return <>{tiles}</>;
}

/** Create the tiles used to display the bomb map/exposed tiles/flagged tiles to the user.*/
function createGameTiles(
  state: GameState,
  mapState: GameMapState,
  gameLost: GameLostProps,
  tilesToHighlight: number[][],
  disabled: boolean,
  hintActivated: boolean,
  onClickEvent: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => void,
  onRightClickEvent: (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    row: number,
    column: number
  ) => void,
  onMouseUpEvent: (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    row: number,
    column: number
  ) => void,
  onMouseDownEvent: (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    row: number,
    column: number
  ) => void,
  onMouseLeave: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
) {
  const rowCells: React.ReactNode[] = []; // array of jsx GameTile to display

  for (let row = 0; row < state.rowCount; row++) {
    const tileCells: React.ReactNode[] = [];

    for (let col = 0; col < state.columnCount; col++) {
      const exposedTile: TileValue = mapState.exposedMap[row][col];
      const bombTile: TileValue = mapState.bombMap[row][col];

      const keyVal: number = row * state.columnCount + col;
      const isExposed: boolean = exposedTile === 'exposed' && bombTile !== 'bomb';
      const isFlagged: boolean = exposedTile === 'flag' || exposedTile === 'unknown';
      const isGameOverBomb =
        gameLost.gameLost &&
        bombTile === 'bomb' &&
        gameLost.bombTile &&
        gameLost.bombTile[0] === row &&
        gameLost.bombTile[1] === col;
      const clickedBomb =
        gameLost.gameLost &&
        gameLost.bombTile &&
        gameLost.bombTile[0] === row &&
        gameLost.bombTile[1] === col;

      let incorrectFlag: boolean = false;
      let displayValue: TileValue = undefined;

      if (gameLost.gameLost && gameLost.incorrectTiles?.length) {
        for (const tile of gameLost.incorrectTiles)
          if (tile[0] === row && tile[1] === col) incorrectFlag = true;
      }

      if (incorrectFlag) displayValue = 'incorrect';
      else if (clickedBomb) displayValue = 'trigger';
      else if (isGameOverBomb) displayValue = 'trigger';
      else if (isExposed) displayValue = bombTile;
      else if (isFlagged) displayValue = exposedTile;
      else if (gameLost.gameLost && bombTile === 'bomb') displayValue = 'bomb';

      let isAdjacentTileHighlight = false;
      let isDisabled = disabled;
      let isHintActivated = false;

      for (const tile of tilesToHighlight) {
        if (tile[0] === row && tile[1] === col && !mapState.exposedMap[row][col]) {
          isAdjacentTileHighlight = true;
          break;
        }
      }

      if (hintActivated) {
        const bombTileValue = bombTile ? parseInt(bombTile.toString()) : 0;
        if (isExposed && bombTileValue > 0 && bombTileValue < 9) {
          const adjacentHintTiles = getDirectAdjacentTiles(row, col, state, mapState);
          const count = adjacentHintTiles
            .map((t) => mapState.exposedMap[t[0]][t[1]])
            .filter((t) => t === 'exposed' || t === 'unknown' || t === 'flag').length;

          isHintActivated = count !== adjacentHintTiles.length;
          isDisabled = !isHintActivated;
        } else {
          isDisabled = true;
        }
      }

      tileCells.push(
        <GameTile
          key={keyVal}
          id={keyVal}
          displayValue={displayValue}
          exposed={isExposed}
          highlight={isAdjacentTileHighlight}
          hintActivated={isHintActivated}
          onTileClick={(event) => onClickEvent(event, row, col)}
          onTileRightClick={(event) => {
            event.preventDefault();
            onRightClickEvent(event, row, col);
          }}
          onMouseUp={(event) => onMouseUpEvent(event, row, col)}
          onMouseDown={(event) => onMouseDownEvent(event, row, col)}
          onMouseLeave={(event) => onMouseLeave(event)}
          disabled={isDisabled}
        ></GameTile>
      );
    }

    rowCells.push(
      <div key={-1 - row} className="flex items-center justify-center">
        {tileCells}
      </div>
    );
  }

  return rowCells;
}
