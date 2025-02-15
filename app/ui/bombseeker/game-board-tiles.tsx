import { useMemo } from 'react';
import { GameLostProps } from '@/app/lib/bombseeker/game';
import { GameState } from '@/app/lib/bombseeker/gameStateReducer';
import { GameMapState } from '@/app/lib/bombseeker/gameMapReducer';
import GameTile, { TileValue } from './game-tile';

type Props = {
    state: GameState,
    mapState: GameMapState,
    gameLost: GameLostProps,
    adjacentTiles: number[][],
    disabled: boolean,
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => void,
    onRightClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => void,
    onMouseUp: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => void,
    onMouseDown: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => void,
    onMouseLeave: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void,
}

/**
 * Create the game board tiles with the correct color, number, icon based on the given information.
 * @param param0 
 * @returns 
 */
export default function GameBoardTiles({
    state,
    mapState,
    gameLost,
    adjacentTiles,
    disabled,
    onClick,
    onRightClick,
    onMouseUp,
    onMouseDown,
    onMouseLeave }: Props) {

    const tiles = useMemo(
        () => createGameTiles(
            state,
            mapState,
            gameLost,
            adjacentTiles,
            disabled,
            onClick,
            onRightClick,
            onMouseUp,
            onMouseDown,
            onMouseLeave),
        [
            state,
            mapState,
            gameLost,
            adjacentTiles,
            disabled,
            onClick,
            onRightClick,
            onMouseUp,
            onMouseDown,
            onMouseLeave
        ]
    );

    /** Create the tiles used to display the bomb map/exposed tiles/flagged tiles to the user.*/
    function createGameTiles(
        state: GameState,
        mapState: GameMapState,
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
                const exposedTile: TileValue = mapState.exposedMap[row][col];
                const bombTile: TileValue = mapState.bombMap[row][col];

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
                        if (tile[0] === row && tile[1] === col && !mapState.exposedMap[row][col].value) {
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

    return (
        <>
            {tiles}
        </>
    );
}