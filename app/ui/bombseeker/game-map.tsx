import { TileValue } from './game-tile';
import { isGameWon, getBombsRemaining, isGameLost } from '@/app/lib/bombseeker/game';

import GameOver from './game-over';
import GameBoardTiles from './game-board-tiles';
import GameInfo from './game-info';
import GameSettings from './game-settings';
import { sectionStyle } from '../home/home-description';
import { GameState } from '@/app/lib/bombseeker/gameStateReducer';
import { GameMapState } from '@/app/lib/bombseeker/gameMapReducer';
import useTileClick from '@/app/lib/bombseeker/useTileClick';

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

    const { time, 
        showGameOverScreen, 
        adjacentTiles, 
        pauseTimer, 
        handleTileClick, 
        handleTileRightClick, 
        handleTileMouseLeave, 
        handleTileMouseUp, 
        handleTileMouseDown, 
        handleNewGameClick, 
        handleGameOverScreenClick 
    } = useTileClick(state, mapState, onPlay, onNewGame);

    const cellClass = `${sectionStyle} mx-4 my-2 p-4`;
    let gameBoard = <></>;

    // create game board if user selects to start a new game.
    if (state.gameCreated) {
        
        const gameLost = isGameLost(state, mapState);
        const gameWon = !gameLost.gameLost && isGameWon(state, mapState);
        const showGameOver = (gameLost.gameLost || gameWon) && showGameOverScreen;
        const bombsRemaining = getBombsRemaining(state, mapState);
        const message = gameLost.gameLost ? "Game Over" : gameWon ? "Win!" : "Error...";

        if (showGameOver)
            pauseTimer();

        gameBoard =
            <>
                <div className={`${cellClass} flex flex-col items-center justify-center md:flex-row`}>
                    <GameInfo seconds={time} bombsLeft={bombsRemaining} />
                </div>
                <div className={`${cellClass} overflow-x-auto relative shadow-md shadow-white`}>
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
            <div className={cellClass}>
                <GameSettings
                    state={state}
                    onNewGame={handleNewGameClick} />
            </div>
            {gameBoard}
        </>
    );
}