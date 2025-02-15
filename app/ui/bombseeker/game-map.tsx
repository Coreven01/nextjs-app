import { MouseEventHandler, useState } from 'react';
import { TileValue } from './game-tile';
import { useDoubleMouseEvents, useTimer } from '@/app/lib/bombseeker/actions';
import { validateAndClickAjacentTiles, getDirectAdjacentTiles, getNewExposedMap, isGameWon, getBombsRemaining, isGameLost } from '@/app/lib/bombseeker/game';

import GameOver from './game-over';
import GameBoardTiles from './game-board-tiles';
import GameInfo from './game-info';
import GameSettings from './game-settings';
import { sectionStyle } from '../home/home-description';
import { GameState } from '@/app/lib/bombseeker/gameStateReducer';
import { GameMapState } from '@/app/lib/bombseeker/gameMapReducer';

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

    const [showGameOverScreen, setShowGameOverScreen] = useState<boolean>(true);

    /** Used to determine if more than one mouse button is pressed. */
    const [doubleMouseDownEvents, setDoubleMouseDownEvent] = useState<React.MouseEvent<HTMLButtonElement, MouseEvent>[]>([]);

    /** Used to determine what tiles to highlight when pressing double mouse down. */
    const [adjacentTiles, setAdjacentTiles] = useState<number[][]>([]);

    const {
        shouldHandleDoubleMouseUp,
        shouldHandleMouseClick,
        shouldHandleMouseRightClick,
        handleDoubleMouseDown,
        handleDoubleMouseUp,
        handledMouseClick,
        handledMouseRightClick,
        resetMouseClicks
    } = useDoubleMouseEvents();

    const {
        time,
        startTimer,
        pauseTimer,
        resetTimer
    } = useTimer();

    /**
     * Handle left click of a tile. Exposes the tile and adjacent empty tiles if the tile is empty. If the tile is a bomb, then game over.
     */
    const handleTileClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => {

        const exposedTile: TileValue | undefined = mapState.exposedMap.length ? mapState.exposedMap[row][column] : undefined;

        if (!shouldHandleMouseClick || exposedTile === undefined || exposedTile.value === 'E' || exposedTile.value === 'F' || exposedTile.value === "?") {
            event.preventDefault();
            handledMouseClick();
            return;
        }

        startTimer();
        onPlay(getNewExposedMap(row, column, state, mapState, { value: 'E' }));
        handledMouseClick();
    };

    /**
     * Flag the tile as a bomb. Clears the tile if already flagged.
     */
    const handleTileRightClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => {

        if (!shouldHandleMouseRightClick || mapState.exposedMap[row][column].value === 'E') {
            handledMouseRightClick();
            return;
        }

        startTimer();

        const newVal: TileValue = { value: undefined };
        if (!mapState.exposedMap[row][column].value)
            newVal.value = 'F';
        else if (mapState.exposedMap[row][column].value === 'F')
            newVal.value = '?';

        onPlay(getNewExposedMap(row, column, state, mapState, newVal));
        handledMouseRightClick();
    }

    /**
     * Prevent from clicking the tile if the mouse cursor exits the button area.
     */
    const handleTileMouseLeave = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        if (adjacentTiles.length) {
            popMouseDownEvent();
            setAdjacentTiles([]);
        }
    }

    /**
     * Feature that was in the original implmentation in Windows. When the user double mouse "upped" a tile, it would count as clicking each tile adjacent 
     * to the current tile. Pretty sure this would only work if there were no "?"ed tiles, and the flagged tile count matched the selected tile number.
     * If these scenarios are true, then click the surrounding tiles.
     */
    const handleTileMouseUp = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => {

        if (shouldHandleDoubleMouseUp && doubleMouseDownEvents.length > 1) {

            const bombTileValue: number = parseInt(mapState.bombMap[row][column].value?.toString() ?? "0", 10);
            if (bombTileValue) {
                const newExposedMap = validateAndClickAjacentTiles(bombTileValue, row, column, state, mapState);
                if (newExposedMap)
                    onPlay(newExposedMap);
            }
        } else if (shouldHandleDoubleMouseUp) {
            handleDoubleMouseUp();
            setTimeout(() => {
                handledMouseClick();
                handledMouseRightClick();
            }, 50);
        }

        popMouseDownEvent();
        setAdjacentTiles([]);
    }

    /**
     * Attempt to identify if the user is single clicking a tile, or double clicking a tile.
     * If both mouse buttons are held down, then display to the user which tiles would be "clicked".
     */
    const handleTileMouseDown = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: number, column: number) => {

        // track the events for mouse down events.
        // used to determine if the user is using the double mouse down/up feature.
        addMouseDownEvent(event);

        if (doubleMouseDownEvents.length >= 1) {

            handleDoubleMouseDown();
            const exposedValue: TileValue = mapState.exposedMap[row][column];

            // if the current tile is not yet exposed then ignore the double mouse down event.
            if (exposedValue.value !== 'E')
                return;

            const currentValue: TileValue = mapState.bombMap[row][column];
            const tempValue = parseInt(currentValue.value?.toString() ?? "0", 10);

            if (tempValue >= 1 && tempValue <= 9) {
                const adjacentTiles = getDirectAdjacentTiles(row, column, state, mapState);
                const adjacentTilesToHighlight: number[][] = [];
                if (adjacentTiles.length) {
                    for (const tile of adjacentTiles) {
                        const adjacentValue = mapState.exposedMap[tile[0]][tile[1]];
                        if (adjacentValue.value === undefined || adjacentValue.value === 'F') {
                            adjacentTilesToHighlight.push(tile);
                        }
                    }
                }

                setAdjacentTiles(adjacentTilesToHighlight);
            }
        }
    }

    const handleNewGameClick = (state: GameState) => {
        onNewGame(state);
        resetMouseClicks();
        pauseTimer();
        resetTimer();
        setShowGameOverScreen(true);
    }

    const addMouseDownEvent: MouseEventHandler<HTMLButtonElement> = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        const newEvents = [...doubleMouseDownEvents, event];
        setDoubleMouseDownEvent(newEvents);
    }

    const popMouseDownEvent = () => {
        if (doubleMouseDownEvents.length > 1) {
            const newEvents = [...doubleMouseDownEvents].slice(0, doubleMouseDownEvents.length - 2);
            setDoubleMouseDownEvent(newEvents);
        } else {
            setDoubleMouseDownEvent([]);
        }
    }

    const handleGameOverScreenClick = () => {
        setShowGameOverScreen(false);
    }

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