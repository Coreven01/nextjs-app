import { TileValue } from './game-tile';
import {
  isGameWon,
  getBombsRemaining,
  isGameLost,
  create2DArray,
  createBombMap
} from '@/features/bombseeker/utils/game';

import GameOver from './game-over';
import GameBoardTiles from './game-board-tiles';
import GameInfo from './game-info';
import GameSettings from './game-settings';
import { SECTION_STYLE } from '../../../app/ui/home/home-description';
import {
  GameActionType,
  gameStateReducer,
  INIT_GAME_STATE
} from '@/features/bombseeker/state/gameStateReducer';
import {
  GameMapActionType,
  gameMapReducer,
  INIT_GAME_MAP_STATE
} from '@/features/bombseeker/state/gameMapReducer';
import useTileClick from '@/features/bombseeker/hooks/useTileClick';
import React, { useEffect, useMemo, useReducer, useState } from 'react';
import { useTimer } from '@/features/bombseeker/hooks/useTimer';
import clsx from 'clsx';
import { orbitron } from '@/app/ui/fonts';

/**
 * Bomb seeker game board
 * @returns
 */
export default function GameMap() {
  const [gameState, dispatchGameState] = useReducer(gameStateReducer, { ...INIT_GAME_STATE });
  const [gameMapState, dispatchGameMapState] = useReducer(gameMapReducer, { ...INIT_GAME_MAP_STATE });
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const gameLost = useMemo(() => isGameLost(gameState, gameMapState), [gameState, gameMapState]);
  const gameWon = useMemo(
    () => !gameLost.gameLost && isGameWon(gameState, gameMapState),
    [gameState, gameMapState, gameLost]
  );

  const [hintActivated, setHintActivated] = useState<boolean>(false);
  const [showGameOverScreen, setShowGameOverScreen] = useState<boolean>(true);
  const [quickStartValue, setQuickStartValue] = useState<{ row: number; column: number } | null>(null);
  const { time, startTimer, pauseTimer, resetTimer } = useTimer();
  const bombsRemaining = useMemo(() => getBombsRemaining(gameState, gameMapState), [gameState, gameMapState]);
  const hintsRemaining = gameState.hintCount - hintsUsed;

  const handlePlay = (newExposedMap: TileValue[][]) => {
    dispatchGameMapState({
      type: GameMapActionType.UPDATE_EXPOSED,
      payload: newExposedMap
    });
  };

  const {
    adjacentTiles,
    onTileClick,
    onTileRightClick,
    onTileMouseLeave,
    onTileMouseUp,
    onTileMouseDown,
    resetMouseClicks
  } = useTileClick(gameState, gameMapState, handlePlay, startTimer);

  useEffect(() => {
    if (quickStartValue) {
      onTileClick(null, quickStartValue.row, quickStartValue.column, false);
      setQuickStartValue(null);
    }
  }, [onTileClick, quickStartValue]);

  /** */
  const handleNewGame = (
    rowCount: number,
    columnCount: number,
    bombCount: number,
    hintCount: number,
    quickStart: boolean
  ) => {
    dispatchGameState({ type: GameActionType.SET_GAME_CREATED_TRUE });
    dispatchGameState({ type: GameActionType.SET_BOMB_COUNT, payload: bombCount });
    dispatchGameState({ type: GameActionType.SET_COLUMN_COUNT, payload: columnCount });
    dispatchGameState({ type: GameActionType.SET_ROW_COUNT, payload: rowCount });
    dispatchGameState({ type: GameActionType.SET_HINT_COUNT, payload: hintCount });
    setHintsUsed(0);

    const newBombMap: TileValue[][] = createBombMap(rowCount, columnCount, bombCount);
    dispatchGameMapState({
      type: GameMapActionType.UPDATE_EXPOSED,
      payload: create2DArray(rowCount, columnCount)
    });
    dispatchGameMapState({
      type: GameMapActionType.UPDATE_BOMB,
      payload: newBombMap
    });

    if (quickStart) handleSetQuickStartValue(newBombMap, rowCount, columnCount);
  };

  /** */
  const handleSetQuickStartValue = (newBombMap: TileValue[][], rowCount: number, columnCount: number) => {
    const selectedTile = { row: 0, column: 0 };
    let shouldBreak = false;
    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < columnCount; c++) {
        if (newBombMap[r][c] === undefined) {
          selectedTile.row = r;
          selectedTile.column = c;
          shouldBreak = true;
          break;
        }
      }
      if (shouldBreak) break;
    }
    setQuickStartValue(selectedTile);
  };

  /** Hide the overlay if the game over screen is clicked */
  const handleGameOverScreenClick = () => {
    setShowGameOverScreen(false);
  };

  /** Reset the state and generate a new game. */
  const handleNewGameClick = (
    rowCount: number,
    columnCount: number,
    bombCount: number,
    hintCount: number,
    quickStart: boolean
  ) => {
    pauseTimer();
    resetTimer();
    handleNewGame(rowCount, columnCount, bombCount, hintCount, quickStart);
    resetMouseClicks();
    setShowGameOverScreen(true);
    setHintsUsed(0);
    setHintActivated(false);
  };

  /** */
  const handleActivateHint = () => {
    if (hintsRemaining > 0) setHintActivated((prev) => !prev);
  };

  /** */
  const handleTileClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    row: number,
    column: number
  ): void => {
    if (hintActivated) {
      setHintActivated(false);
      setHintsUsed((prev) => prev + 1);
    }
    onTileClick(event, row, column, hintActivated);
  };

  const CELL_CLASS = `${SECTION_STYLE} mx-4 my-2 p-4`;
  let gameBoard: React.ReactNode = <></>;

  // create game board if user selects to start a new game.
  if (gameState.gameCreated) {
    const showGameOver = (gameLost.gameLost || gameWon) && showGameOverScreen;
    const message = gameLost.gameLost ? 'Game Over' : gameWon ? 'Well Done!' : '';

    if (showGameOver) pauseTimer();

    gameBoard = (
      <>
        <div
          className={clsx(
            `flex flex-col items-center justify-center text-xl md:flex-row`,
            orbitron.className,
            CELL_CLASS
          )}
        >
          <GameInfo
            seconds={time}
            bombsLeft={bombsRemaining}
            hintsLeft={hintsRemaining}
            hintActivated={hintActivated}
            onActivateHint={handleActivateHint}
          />
        </div>
        <div className={`${CELL_CLASS} overflow-x-auto relative shadow-md shadow-white`}>
          <GameBoardTiles
            state={gameState}
            mapState={gameMapState}
            gameLost={gameLost}
            tilesToHighlight={adjacentTiles}
            disabled={gameLost.gameLost || gameWon}
            hintActivated={hintActivated}
            onClick={handleTileClick}
            onRightClick={onTileRightClick}
            onMouseUp={onTileMouseUp}
            onMouseDown={onTileMouseDown}
            onMouseLeave={onTileMouseLeave}
          />
          <GameOver
            gameLost={gameLost.gameLost}
            showGameOver={showGameOver}
            message={message}
            onGameOverClick={handleGameOverScreenClick}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <div className={CELL_CLASS}>
        <GameSettings state={gameState} onNewGame={handleNewGameClick} />
      </div>
      {gameBoard}
    </>
  );
}
