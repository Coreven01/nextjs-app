import { RefObject } from "react";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/16/solid";

type Props = {
    defaultRow: number,
    newRows: RefObject<HTMLInputElement | null>,
    defaultColumns: number,
    newColumns: RefObject<HTMLInputElement | null>,
    defaultBombCount: number,
    newBombCount: RefObject<HTMLInputElement | null>,
    onNewGame: () => void,
}

export default function GameSettings({ defaultRow,
    newRows,
    defaultColumns,
    newColumns,
    defaultBombCount,
    newBombCount,
    onNewGame }: Props) {

    const inputClass = "max-w-16 rounded-l-lg p-1 border-gray-300 bg-gray-100 text-gray-600 focus:ring-2";
    const labelClass = "block font-medium my-2 dark:text-white";
    const maxRows = 25;
    const minRows = 10;
    const maxColumns = 25;
    const minColumns = 10;

    const handleRowCountUp = () => {
        if (newRows.current && newRows.current.valueAsNumber < maxRows)
            newRows.current.value = `${newRows.current.valueAsNumber + 1}`;
    }

    const handleRowCountDown = () => {
        if (newRows.current && newRows.current.valueAsNumber > minRows)
            newRows.current.value = `${newRows.current.valueAsNumber - 1}`;
    }

    const handleRowCountLeave = () => {
        if (newRows.current) {
            if (newRows.current.valueAsNumber < minRows)
                newRows.current.value = `${minRows}`;
            else if (newRows.current.valueAsNumber > maxRows)
                newRows.current.value = `${maxRows}`;
        }
    }

    const handleColumnCountUp = () => {
        if (newColumns.current && newColumns.current.valueAsNumber < maxRows)
            newColumns.current.value = `${newColumns.current.valueAsNumber + 1}`;
    }

    const handleColumnCountDown = () => {
        if (newColumns.current && newColumns.current.valueAsNumber > minRows)
            newColumns.current.value = `${newColumns.current.valueAsNumber - 1}`;
    }

    const handleColumnCountLeave = () => {
        if (newColumns.current) {
            if (newColumns.current.valueAsNumber < minRows)
                newColumns.current.value = `${minRows}`;
            else if (newColumns.current.valueAsNumber > maxRows)
                newColumns.current.value = `${maxRows}`;
        }
    }

    const handleBombCountUp = () => {
        if (newColumns.current && newColumns.current.valueAsNumber < maxRows)
            newColumns.current.value = `${newColumns.current.valueAsNumber + 1}`;
    }

    const handleBombCountDown = () => {
        if (newColumns.current && newColumns.current.valueAsNumber > minRows)
            newColumns.current.value = `${newColumns.current.valueAsNumber - 1}`;
    }

    const handleBombCountLeave = () => {
        if (newColumns.current) {
            if (newColumns.current.valueAsNumber < minRows)
                newColumns.current.value = `${minRows}`;
            else if (newColumns.current.valueAsNumber > maxRows)
                newColumns.current.value = `${maxRows}`;
        }
    }
    
    return (
        <div className="flex flex-col md:flex-row justify-center items-center gap-4">
            <div className="min-w-32 items-center">
                <label
                    htmlFor="rowCount"
                    className={labelClass}
                >Row Count</label>
                <div className='flex flex-row max-h-[32px]'>
                    <input className={inputClass}
                        id='rowCount'
                        type='number'
                        required
                        max={maxRows}
                        min={minRows}
                        ref={newRows}
                        defaultValue={defaultRow}
                        onBlur={handleRowCountLeave}
                        placeholder='Row Count'></input>
                    <div className='flex flex-col'>
                        <button onClick={handleRowCountUp}><ChevronUpIcon className="w-4 h-4 border dark:border-white" /></button>
                        <button onClick={handleRowCountDown}><ChevronDownIcon className="w-4 h-4 border dark:border-white" /></button>
                    </div>
                </div>
            </div>
            <div className="min-w-32">
                <label
                    htmlFor="colCount"
                    className={labelClass}
                >Column Count</label>
                <div className='flex flex-row max-h-[32px]'>
                    <input className={inputClass}
                        id='colCount'
                        type='number'
                        required
                        max={maxColumns}
                        min={minColumns}
                        ref={newColumns}
                        defaultValue={defaultColumns}
                        onBlur={handleColumnCountLeave}
                        placeholder='column Count'></input>
                    <div className='flex flex-col'>
                        <button onClick={handleColumnCountUp}><ChevronUpIcon className="w-4 h-4 border dark:border-white" /></button>
                        <button onClick={handleColumnCountDown}><ChevronDownIcon className="w-4 h-4 border dark:border-white" /></button>
                    </div>
                </div>
            </div>
            <div className="min-w-32">
                <label
                    htmlFor="bombValue"
                    className={labelClass}
                >Bomb Count</label>
                <div className='flex flex-row max-h-[32px]'>
                    <input className={inputClass}
                        id='bombCount'
                        type='number'
                        required
                        ref={newBombCount}
                        defaultValue={defaultBombCount}
                        onBlur={handleBombCountLeave}
                        placeholder='Bomb Count'></input>
                    <div className='flex flex-col'>
                        <button onClick={handleBombCountUp}><ChevronUpIcon className="w-4 h-4 border dark:border-white" /></button>
                        <button onClick={handleBombCountDown}><ChevronDownIcon className="w-4 h-4 border dark:border-white" /></button>
                    </div>
                </div>
            </div>
            <div className='my-2 p-2'>
                <button
                    className={`border rounded block m-auto justify-center dark:border-white font-medium dark:text-white p-2 dark:bg-neutral-800 bg-zinc-200`}
                    onClick={onNewGame}>New Game</button>
            </div>
        </div>

    );
}