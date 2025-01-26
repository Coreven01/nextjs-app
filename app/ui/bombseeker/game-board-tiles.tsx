import { useMemo } from 'react';
import { TileValue } from "./game-tile";
import { createGameTiles, GameLostProps } from '@/app/lib/bombseeker/game';

type Props = {
    totalRows: number,
    totalColumns: number,
    bombMap: TileValue[][],
    exposedMap: TileValue[][],
    gameLost: GameLostProps,
    adjacentTiles: number[][],
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => void,
    onRightClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => void,
    onMouseUp: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => void,
    onMouseDown: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => void,
    onMouseLeave: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void,
}

export default function GameBoardTiles({ totalRows, totalColumns, bombMap, exposedMap, gameLost, adjacentTiles, onClick, onRightClick, onMouseUp, onMouseDown, onMouseLeave }: Props) {

    const tiles = useMemo(
        () => createGameTiles(totalRows, totalColumns, bombMap, exposedMap, gameLost, adjacentTiles, onClick, onRightClick, onMouseUp, onMouseDown, onMouseLeave),
        [totalRows, totalColumns, bombMap, exposedMap, gameLost, adjacentTiles, onClick, onRightClick, onMouseUp, onMouseDown, onMouseLeave]
      );

    return (
        <>
            {tiles}
        </>
    );   
}

