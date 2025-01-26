import clsx from 'clsx';
import { MouseEventHandler } from "react";
import { FlagIcon, FireIcon } from '@heroicons/react/16/solid';

type Props = {
    id: number,
    displayValue: TileValue,
    exposed: boolean,
    disabled: boolean,
    highlight: boolean,
    onTileClick: MouseEventHandler<HTMLButtonElement> | undefined,
    onTileRightClick: MouseEventHandler<HTMLButtonElement> | undefined,
    onMouseUp: MouseEventHandler<HTMLButtonElement> | undefined,
    onMouseDown: MouseEventHandler<HTMLButtonElement> | undefined,
    onMouseLeave: MouseEventHandler<HTMLButtonElement> | undefined,
}

/** Represents a value for a button on the bomb map */
export type TileValue = {

    /** undefined: no value 
     *  F: button is flagged by the user.
     *  E: button/space is exposed. user clicked on the button and doesn't contain a bomb.
     *  X: button/space is a bomb.
     *  ?: User flagged the button as unknown and not to auto click.
     *  I: Tile is flagged as bomb but is empty.
    */
    value: undefined | "X" | "F" | "E" | "?" | "I" | number
}

/**
 * Button associated with a bomb tile.
 * 
 * @param {*} param0 
 * @returns 
 */
export default function GameTile({ id, displayValue, exposed, disabled, highlight,
    onTileClick, onTileRightClick, onMouseUp, onMouseDown, onMouseLeave }: Props) {

    function getTileClass(tileValue: TileValue, highlight: boolean, exposed: boolean) {

        //const tileSvg = " bg-[url('/tile.svg')] bg-no-repeat bg-center bg-contain";
        const tileBgColor = "bg-zinc-300";
        const tileDefault = "border border-black text-xl font-bold h-8 w-8 p-0 text-center select-none";
        const tileExposed = "bg-white";
        const tileBomb = "bg-red-100";
        const tileUnknown = "bg-yellow-200 text-black";
        const tileDark = "bg-zinc-400";
        const tile1 = "text-blue-500 ";
        const tile2 = "text-green-500 ";
        const tile3 = "text-red-500 ";
        const tile4 = "text-blue-800 ";
        const tile5 = "text-purple-700 ";
        const tile6 = "text-teal-500 ";
        const tile7 = "text-black ";
        const tile8 = "text-gray-500 ";
        const defaultExposed = `${tileExposed} ${tileDefault}`;

        switch (tileValue?.value) {
            case "X":
                return `${tileDefault} ${tileBomb}`;
            case "F":
                return `${tileDefault} ${tileBomb}`;
            case "?":
                return `${tileDefault} ${tileUnknown}`;
            case 1:
                return defaultExposed + ` ${tile1}`;
            case 2:
                return defaultExposed + ` ${tile2}`;
            case 3:
                return defaultExposed + ` ${tile3}`;
            case 4:
                return defaultExposed + ` ${tile4}`;
            case 5:
                return defaultExposed + ` ${tile5}`;
            case 6:
                return defaultExposed + ` ${tile6}`;
            case 7:
                return defaultExposed + ` ${tile7}`;
            case 8:
                return defaultExposed + ` ${tile8}`;
            default:
                return `${(highlight ? ` ${tileDark}` : exposed ? `${tileExposed}` : `${tileBgColor}`)} ${tileDefault}`
        }
    }

    // const tileSvg = " bg-[url('/tile.svg')] bg-no-repeat bg-center bg-[length:1.75rem]";
    const classValue = getTileClass(displayValue, highlight, exposed);
    const value = displayValue.value === "F" ? <FlagIcon className='w-5 h-5 m-auto text-red-500' /> : displayValue.value;
    return (
        <button
            key={id}
            className={classValue}
            onClick={onTileClick}
            onContextMenu={onTileRightClick}
            onMouseUp={onMouseUp}
            onMouseDown={onMouseDown}
            onMouseLeave={onMouseLeave}
            disabled={disabled}>
            {value}
        </button>
    );
}