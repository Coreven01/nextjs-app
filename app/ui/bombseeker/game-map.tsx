'use client';

import { TileValue } from './game-tile';
import { isGameWon, getBombsRemaining, isGameLost, getNewExposedMap } from '@/app/lib/bombseeker/game';

import GameOver from './game-over';
import GameBoardTiles from './game-board-tiles';
import GameInfo from './game-info';
import GameSettings from './game-settings';
import { SECTION_STYLE } from '../home/home-description';
import { GameState } from '@/app/lib/bombseeker/gameStateReducer';
import { GameMapState } from '@/app/lib/bombseeker/gameMapReducer';
import useTileClick from '@/app/lib/bombseeker/useTileClick';
import { useMemo, useState } from 'react';
import { useTimer } from '@/app/lib/bombseeker/useTimer';

type Props = {

    state: GameState,
    mapState: GameMapState,

    /** Update the game tiles based on which tiles have been exposed */
    onPlay: (exposedMap: TileValue[][]) => void,

    /** Create a new game with the given number of rows/columns/bomb count */
    onNewGame: (state: GameState) => void,
}

/**
 * Bomb seeker game board
 * @returns 
 */
export default function GameMap({ state, mapState, onPlay, onNewGame }: Props) {

    const gameLost = useMemo(() => isGameLost(state, mapState), [state, mapState]);
    const gameWon = useMemo(() => !gameLost.gameLost && isGameWon(state, mapState), [state, mapState, gameLost]);
    const bombsRemaining = useMemo(() => getBombsRemaining(state, mapState), [state, mapState]);

    const [showGameOverScreen, setShowGameOverScreen] = useState<boolean>(true);

    const {
        time,
        startTimer,
        pauseTimer,
        resetTimer
    } = useTimer();

    const {
        adjacentTiles,
        handleTileClick,
        handleTileRightClick,
        handleTileMouseLeave,
        handleTileMouseUp,
        handleTileMouseDown,
        resetMouseClicks
    } = useTileClick(state, mapState, onPlay, startTimer);

    /** Hide the overlay if the game over screen is cliecked */
    const handleGameOverScreenClick = () => {
        setShowGameOverScreen(false);
    }

    /** Reset the state and generate a new game. */
    const handleNewGameClick = (state: GameState) => {
        pauseTimer();
        resetTimer();
        onNewGame(state);
        resetMouseClicks();
        setShowGameOverScreen(true);
    }

    const CELL_CLASS = `${SECTION_STYLE} mx-4 my-2 p-4`;
    let gameBoard = <></>;

    // create game board if user selects to start a new game.
    if (state.gameCreated) {
        const showGameOver = (gameLost.gameLost || gameWon) && showGameOverScreen;
        const message = gameLost.gameLost ? "Game Over" : gameWon ? "Well Done!" : "";

        if (showGameOver)
            pauseTimer();

        gameBoard =
            <>
                <div className={`${CELL_CLASS} flex flex-col items-center justify-center md:flex-row`}>
                    <GameInfo seconds={time} bombsLeft={bombsRemaining} />
                </div>
                <div className={`${CELL_CLASS} overflow-x-auto relative shadow-md shadow-white`}>
                    <GameBoardTiles
                        state={state}
                        mapState={mapState}
                        gameLost={gameLost}
                        adjacentTiles={adjacentTiles}
                        disabled={gameLost.gameLost || gameWon}
                        onClick={handleTileClick}
                        onRightClick={handleTileRightClick}
                        onMouseUp={handleTileMouseUp}
                        onMouseDown={handleTileMouseDown}
                        onMouseLeave={handleTileMouseLeave} />
                    <GameOver
                        gameLost={gameLost.gameLost}
                        showGameOver={showGameOver}
                        message={message}
                        onGameOverClick={handleGameOverScreenClick} />
                </div>
            </>;
    }

    return (
        <>
            <div className={CELL_CLASS}>
                <GameSettings
                    state={state}
                    onNewGame={handleNewGameClick} />
            </div>
            {gameBoard}
        </>
    );
}