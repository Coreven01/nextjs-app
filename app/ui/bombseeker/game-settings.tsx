import { useRef, useState } from "react";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/16/solid";
import { GameState } from "@/app/lib/bombseeker/gameStateReducer";

type Props = {
  state: GameState;
  onNewGame: (rowCount: number, columnCount: number, bombCount: number) => void;
};

type GameLevel = {
  level: "b" | "i" | "e" | "c";
  rows: number;
  columns: number;
  bombs: number;
};

const INPUT_CLASS =
  "max-w-16 rounded-l-lg p-1 border-gray-300 bg-gray-100 text-gray-600 focus:ring-2";
const SELECT_CLASS =
  "min-w-48 rounded-l-lg p-1 border-gray-300 bg-gray-100 text-gray-600 focus:ring-2";
const LABEL_CLASS = "block font-medium my-2 dark:text-white";
const MAX_ROWS = 40;
const MIN_ROWS = 9;
const MAX_COLUMNS = 40;
const MIN_COLUMNS = 9;

const GAME_LEVELS: GameLevel[] = [
  { level: "b", rows: 9, columns: 9, bombs: 10 },
  { level: "i", rows: 16, columns: 16, bombs: 40 },
  { level: "e", rows: 16, columns: 30, bombs: 99 },
  { level: "c", rows: 16, columns: 30, bombs: 99 },
];

export default function GameSettings({ state, onNewGame }: Props) {
  const selectedLevel = useRef<HTMLSelectElement>(null);
  const newBombCount = useRef<HTMLInputElement>(null);
  const newRows = useRef<HTMLInputElement>(null);
  const newColumns = useRef<HTMLInputElement>(null);
  const [disableSelection, setDisableSelection] = useState(true);

  const handleRowCountUp = () => {
    if (newRows.current && newRows.current.valueAsNumber < MAX_ROWS)
      newRows.current.value = `${newRows.current.valueAsNumber + 1}`;
  };

  const handleRowCountDown = () => {
    if (newRows.current && newRows.current.valueAsNumber > MIN_ROWS)
      newRows.current.value = `${newRows.current.valueAsNumber - 1}`;
  };

  const handleRowCountLeave = () => {
    if (newRows.current) {
      if (newRows.current.valueAsNumber < MIN_ROWS)
        newRows.current.value = `${MIN_ROWS}`;
      else if (newRows.current.valueAsNumber > MAX_ROWS)
        newRows.current.value = `${MAX_ROWS}`;
    }
  };

  const handleColumnCountUp = () => {
    if (newColumns.current && newColumns.current.valueAsNumber < MAX_ROWS)
      newColumns.current.value = `${newColumns.current.valueAsNumber + 1}`;
  };

  const handleColumnCountDown = () => {
    if (newColumns.current && newColumns.current.valueAsNumber > MIN_ROWS)
      newColumns.current.value = `${newColumns.current.valueAsNumber - 1}`;
  };

  const handleColumnCountLeave = () => {
    if (newColumns.current) {
      if (newColumns.current.valueAsNumber < MIN_ROWS)
        newColumns.current.value = `${MIN_ROWS}`;
      else if (newColumns.current.valueAsNumber > MAX_ROWS)
        newColumns.current.value = `${MAX_ROWS}`;
    }
  };

  const handleBombCountUp = () => {
    const max = Math.max(
      (newColumns.current?.valueAsNumber ?? 1) *
        (newRows.current?.valueAsNumber ?? 1) -
        1,
      1,
    );

    if (newBombCount.current && newBombCount.current.valueAsNumber < max)
      newBombCount.current.value = `${newBombCount.current.valueAsNumber + 1}`;
  };

  const handleBombCountDown = () => {
    if (newBombCount.current && newBombCount.current.valueAsNumber > 1)
      newBombCount.current.value = `${newBombCount.current.valueAsNumber - 1}`;
  };

  const handleBombCountLeave = () => {
    const max = Math.max(
      (newColumns.current?.valueAsNumber ?? 1) *
        (newRows.current?.valueAsNumber ?? 1),
      2,
    );

    if (newBombCount.current) {
      if (newBombCount.current.valueAsNumber < 1)
        newBombCount.current.value = `${10}`;
      else if (newBombCount.current.valueAsNumber >= max)
        newBombCount.current.value = `${max - 1}`;
    }
  };

  const handleLevelChangeUp = () => {
    if (selectedLevel.current === null) return;

    const selectedValue: string = selectedLevel.current.value;

    if (selectedValue === "b") selectedLevel.current.value = "i";
    else if (selectedValue === "i") selectedLevel.current.value = "e";
    else if (selectedValue === "e") selectedLevel.current.value = "c";

    handleLevelChange();
  };

  const handleLevelChangeDown = () => {
    if (selectedLevel.current === null) return;

    const selectedValue: string = selectedLevel.current.value;

    if (selectedValue === "c") selectedLevel.current.value = "e";
    else if (selectedValue === "e") selectedLevel.current.value = "i";
    else if (selectedValue === "i") selectedLevel.current.value = "b";

    handleLevelChange();
  };

  const handleLevelChange = () => {
    const selectedValue: string = selectedLevel.current?.value ?? "";
    const selected = GAME_LEVELS.find((lvl) => lvl.level === selectedValue);
    let baseLevel = GAME_LEVELS.find((lvl) => lvl.level === "b");

    if (selected) baseLevel = selected;

    if (
      baseLevel &&
      newRows.current &&
      newColumns.current &&
      newBombCount.current &&
      baseLevel.level !== "c"
    ) {
      newRows.current.value = `${baseLevel.rows}`;
      newColumns.current.value = `${baseLevel.columns}`;
      newBombCount.current.value = `${baseLevel.bombs}`;
    }

    setDisableSelection(baseLevel?.level !== "c");
  };

  const handleNewGame = () => {
    if (newBombCount.current && newRows.current && newColumns.current) {
      const tempVals = {
        rowCount: newRows.current.valueAsNumber,
        columnCount: newColumns.current.valueAsNumber,
        bombCount: newBombCount.current.valueAsNumber,
      };
      onNewGame(tempVals.rowCount, tempVals.columnCount, tempVals.bombCount);
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-center items-center gap-4">
      <div className="min-w-48 items-center md:mr-5">
        <label htmlFor="selectLevel" className={LABEL_CLASS}>
          Level
        </label>
        <div className="flex flex-row flex-grow max-h-[32px]">
          <select
            className={SELECT_CLASS}
            id="selectLevel"
            onChange={handleLevelChange}
            ref={selectedLevel}
            defaultValue={"b"}
          >
            <option value={"c"}>Custom</option>
            <option value={"e"}>Expert</option>
            <option value={"i"}>Intermediate</option>
            <option value={"b"}>Beginner</option>
          </select>
          <div className="flex flex-col">
            <button onClick={handleLevelChangeUp}>
              <ChevronUpIcon className="w-4 h-4 border dark:border-white" />
            </button>
            <button onClick={handleLevelChangeDown}>
              <ChevronDownIcon className="w-4 h-4 border dark:border-white" />
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
            ref={newRows}
            defaultValue={state.rowCount}
            onBlur={handleRowCountLeave}
            placeholder="Row Count"
          ></input>
          <div className="flex flex-col">
            <button disabled={disableSelection} onClick={handleRowCountUp}>
              <ChevronUpIcon className="w-4 h-4 border dark:border-white" />
            </button>
            <button disabled={disableSelection} onClick={handleRowCountDown}>
              <ChevronDownIcon className="w-4 h-4 border dark:border-white" />
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
            ref={newColumns}
            defaultValue={state.columnCount}
            onBlur={handleColumnCountLeave}
            placeholder="column Count"
          ></input>
          <div className="flex flex-col">
            <button disabled={disableSelection} onClick={handleColumnCountUp}>
              <ChevronUpIcon className="w-4 h-4 border dark:border-white" />
            </button>
            <button disabled={disableSelection} onClick={handleColumnCountDown}>
              <ChevronDownIcon className="w-4 h-4 border dark:border-white" />
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
            ref={newBombCount}
            defaultValue={state.bombCount}
            onBlur={handleBombCountLeave}
            placeholder="Bomb Count"
          ></input>
          <div className="flex flex-col">
            <button disabled={disableSelection} onClick={handleBombCountUp}>
              <ChevronUpIcon className="w-4 h-4 border dark:border-white" />
            </button>
            <button disabled={disableSelection} onClick={handleBombCountDown}>
              <ChevronDownIcon className="w-4 h-4 border dark:border-white" />
            </button>
          </div>
        </div>
      </div>
      <div className="my-2 p-2">
        <button
          className={`border border-black dark:border-white rounded block m-auto justify-center dark:border-white font-medium dark:text-white p-2 dark:bg-neutral-800 bg-zinc-200`}
          onClick={handleNewGame}
        >
          New Game
        </button>
      </div>
    </div>
  );
}
