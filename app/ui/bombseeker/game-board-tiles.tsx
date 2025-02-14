import { useMemo } from 'react';
import { TileValue } from "./game-tile";
import { createGameTiles, GameLostProps } from '@/app/lib/bombseeker/game';
import { GameState } from '@/app/lib/bombseeker/gameStateReducer';

type Props = {
    state: GameState,
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

    return (
        <>
            {tiles}
        </>
    );
}

