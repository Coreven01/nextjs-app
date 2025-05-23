import { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/16/solid';
import { GameState } from '@/features/bombseeker/state/gameStateReducer';

type Props = {
  state: GameState;
  onNewGame: (
    rowCount: number,
    columnCount: number,
    bombCount: number,
    hintCount: number,
    quickStart: boolean
  ) => void;
};

type GameLevel = {
  level: GameLevels;
  rows: number;
  columns: number;
  bombs: number;
};

type GameLevels = 'beginner' | 'intermediate' | 'expert' | 'custom';

const INPUT_CLASS =
  'max-w-16 rounded-l-lg p-1 border-black dark:border-gray-300 text-black bg-gray-100 dark:text-gray-600 focus:ring-2 disabled:cursor-not-allowed';
const SELECT_CLASS =
  'min-w-48 rounded-l-lg p-1 border-black dark:border-gray-300 text-black bg-gray-100 dark:text-gray-600 focus:ring-2';
const LABEL_CLASS = 'block font-medium my-2 dark:text-white';
const UP_DOWN_BUTTON_CLASS =
  'w-4 h-4 border dark:border-white border-black disabled:bg-gray-200 disabled:text-stone-500 disabled:cursor-not-allowed';
const MAX_ROWS = 40;
const MIN_ROWS = 9;
const MAX_COLUMNS = 40;
const MIN_COLUMNS = 9;
const MAX_HINTS = 5;
const MIN_HINTS = 0;

const GAME_LEVELS: GameLevel[] = [
  { level: 'beginner', rows: 9, columns: 9, bombs: 10 },
  { level: 'intermediate', rows: 16, columns: 16, bombs: 40 },
  { level: 'expert', rows: 16, columns: 30, bombs: 99 },
  { level: 'custom', rows: 16, columns: 30, bombs: 99 }
];

export default function GameSettings({ state, onNewGame }: Props) {
  const [selectedLevel, setSelectedLevel] = useState<GameLevels>('beginner');
  const [newBombCount, setNewBombCount] = useState(state.bombCount);
  const [newRowCount, setNewRowCount] = useState(state.rowCount);
  const [newColumnCount, setNewColumnCount] = useState(state.columnCount);
  const [newHintCount, setNewHintCount] = useState(state.hintCount);
  const [disableSelection, setDisableSelection] = useState(true);

  // #region
  const handleRowCountUp = () => {
    setNewValue('row', newRowCount + 1);
  };

  const handleRowCountDown = () => {
    setNewValue('row', newRowCount - 1);
  };

  const handleRowCountChange = (value: string) => {
    if (value) setNewValue('row', value);
  };

  const handleColumnCountUp = () => {
    setNewValue('column', newColumnCount + 1);
  };

  const handleColumnCountDown = () => {
    setNewValue('column', newColumnCount - 1);
  };

  const handleColumnCountChange = (value: string) => {
    if (value) setNewValue('column', value);
  };

  const handleBombCountUp = () => {
    setNewValue('bomb', newBombCount + 1);
  };

  const handleBombCountDown = () => {
    setNewValue('bomb', newBombCount - 1);
  };

  const handleBombCountChange = (value: string) => {
    if (value) setNewValue('bomb', value);
  };

  const handleHintCountUp = () => {
    setNewValue('hint', newHintCount + 1);
  };

  const handleHintCountDown = () => {
    setNewValue('hint', newHintCount - 1);
  };

  const handleHintCountChange = (value: string) => {
    setNewValue('hint', value);
  };

  const setNewValue = (value: string, targetValue: string | number | undefined) => {
    const newValue = targetValue ? parseInt(targetValue.toString()) : 0;
    switch (value) {
      case 'row':
        if (newValue < MIN_ROWS) setNewRowCount(MIN_ROWS);
        else if (newValue > MAX_ROWS) setNewRowCount(MAX_ROWS);
        else setNewRowCount(newValue);
        break;
      case 'column':
        if (newValue < MIN_COLUMNS) setNewColumnCount(MIN_COLUMNS);
        else if (newValue > MAX_COLUMNS) setNewColumnCount(MAX_COLUMNS);
        else setNewColumnCount(newValue);
        break;
      case 'bomb':
        const max = Math.max(newColumnCount * newRowCount - 1, 2);
        if (newValue < 1) setNewBombCount(1);
        else if (newValue > max) setNewBombCount(max);
        else setNewBombCount(newValue);
        break;
      case 'hint':
        if (newValue < MIN_HINTS) setNewHintCount(MIN_HINTS);
        else if (newValue > MAX_HINTS) setNewHintCount(MAX_HINTS);
        else setNewHintCount(newValue);
    }
  };

  const handleLevelChangeUp = () => {
    if (selectedLevel === 'beginner') handleLevelChange('intermediate');
    else if (selectedLevel === 'intermediate') handleLevelChange('expert');
    else if (selectedLevel === 'expert') handleLevelChange('custom');
  };

  const handleLevelChangeDown = () => {
    if (selectedLevel === 'custom') handleLevelChange('expert');
    else if (selectedLevel === 'expert') handleLevelChange('intermediate');
    else if (selectedLevel === 'intermediate') handleLevelChange('beginner');
  };

  const handleLevelChange = (newLevel: string) => {
    const selected = GAME_LEVELS.find((lvl) => lvl.level === newLevel);
    let baseLevel = GAME_LEVELS.find((lvl) => lvl.level === 'beginner');

    if (selected) baseLevel = selected;

    if (baseLevel && baseLevel.level !== 'custom') {
      setNewRowCount(baseLevel.rows);
      setNewColumnCount(baseLevel.columns);
      setNewBombCount(baseLevel.bombs);
    }

    setDisableSelection(baseLevel?.level !== 'custom');
    setSelectedLevel(baseLevel?.level ?? 'beginner');
  };

  const handleNewGame = () => {
    onNewGame(newRowCount, newColumnCount, newBombCount, newHintCount, false);
  };

  const handleQuickStart = () => {
    onNewGame(newRowCount, newColumnCount, newBombCount, newHintCount, true);
  };

  // #endregion

  return (
    <div className="flex flex-col md:flex-row justify-center items-center gap-4">
      <div className="min-w-48 items-center md:mr-5">
        <label htmlFor="selectLevel" className={LABEL_CLASS}>
          Level
        </label>
        <div className="flex flex-row grow max-h-[32px]">
          <select
            className={SELECT_CLASS}
            id="selectLevel"
            onChange={(e) => handleLevelChange(e.target.value)}
            value={selectedLevel}
          >
            <option value={'custom'}>Custom</option>
            <option value={'expert'}>Expert</option>
            <option value={'intermediate'}>Intermediate</option>
            <option value={'beginner'}>Beginner</option>
          </select>
          <div className="flex flex-col">
            <button onClick={handleLevelChangeUp}>
              <ChevronUpIcon className={UP_DOWN_BUTTON_CLASS} />
            </button>
            <button onClick={handleLevelChangeDown}>
              <ChevronDownIcon className={UP_DOWN_BUTTON_CLASS} />
            </button>
          </div>
        </div>
      </div>
      <div className="min-w-32 items-center">
        <label htmlFor="rowCount" className={LABEL_CLASS}>
          Row Count
        </label>
        <div className="flex flex-row max-h-[32px]">
          <input
            className={INPUT_CLASS}
            id="rowCount"
            type="number"
            required
            disabled={disableSelection}
            max={MAX_ROWS}
            min={MIN_ROWS}
            value={newRowCount}
            onChange={() => null}
            onBlur={(e) => handleRowCountChange(e.target.value)}
            placeholder="Row Count"
          ></input>
          <div className="flex flex-col">
            <button disabled={disableSelection} onClick={handleRowCountUp} className={UP_DOWN_BUTTON_CLASS}>
              <ChevronUpIcon />
            </button>
            <button disabled={disableSelection} onClick={handleRowCountDown}>
              <ChevronDownIcon className={UP_DOWN_BUTTON_CLASS} />
            </button>
          </div>
        </div>
      </div>
      <div className="min-w-32">
        <label htmlFor="colCount" className={LABEL_CLASS}>
          Column Count
        </label>
        <div className="flex flex-row max-h-[32px]">
          <input
            className={INPUT_CLASS}
            id="colCount"
            type="number"
            required
            disabled={disableSelection}
            max={MAX_COLUMNS}
            min={MIN_COLUMNS}
            value={newColumnCount}
            onChange={() => null}
            onBlur={(e) => handleColumnCountChange(e.target.value)}
            placeholder="column Count"
          ></input>
          <div className="flex flex-col">
            <button disabled={disableSelection} onClick={handleColumnCountUp}>
              <ChevronUpIcon className={UP_DOWN_BUTTON_CLASS} />
            </button>
            <button disabled={disableSelection} onClick={handleColumnCountDown}>
              <ChevronDownIcon className={UP_DOWN_BUTTON_CLASS} />
            </button>
          </div>
        </div>
      </div>
      <div className="min-w-32">
        <label htmlFor="bombValue" className={LABEL_CLASS}>
          Bomb Count
        </label>
        <div className="flex flex-row max-h-[32px]">
          <input
            className={INPUT_CLASS}
            id="bombCount"
            type="number"
            required
            disabled={disableSelection}
            value={newBombCount}
            onChange={() => null}
            onBlur={(e) => handleBombCountChange(e.target.value)}
            placeholder="Bomb Count"
          ></input>
          <div className="flex flex-col">
            <button disabled={disableSelection} onClick={handleBombCountUp}>
              <ChevronUpIcon className={UP_DOWN_BUTTON_CLASS} />
            </button>
            <button disabled={disableSelection} onClick={handleBombCountDown}>
              <ChevronDownIcon className={UP_DOWN_BUTTON_CLASS} />
            </button>
          </div>
        </div>
      </div>
      <div className="min-w-32">
        <label htmlFor="bombValue" className={LABEL_CLASS}>
          Cheat Count
        </label>
        <div className="flex flex-row max-h-[32px]">
          <input
            className={INPUT_CLASS}
            id="hintCount"
            type="number"
            required
            value={newHintCount}
            onChange={() => null}
            onBlur={(e) => handleHintCountChange(e.target.value)}
            placeholder="Cheat Count"
          ></input>
          <div className="flex flex-col">
            <button onClick={handleHintCountUp}>
              <ChevronUpIcon className={UP_DOWN_BUTTON_CLASS} />
            </button>
            <button onClick={handleHintCountDown}>
              <ChevronDownIcon className={UP_DOWN_BUTTON_CLASS} />
            </button>
          </div>
        </div>
      </div>
      <div>
        <button
          className={`border border-black block m-auto justify-center dark:border-white font-medium dark:text-white p-2 dark:bg-neutral-800 bg-zinc-200`}
          onClick={handleNewGame}
        >
          New Game
        </button>
      </div>
      <div>
        <button
          className={`border border-black block m-auto justify-center dark:border-white font-medium dark:text-white p-2 dark:bg-neutral-800 bg-zinc-200`}
          onClick={handleQuickStart}
        >
          Quick Start
        </button>
      </div>
    </div>
  );
}
