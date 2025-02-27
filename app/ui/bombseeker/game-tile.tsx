import { MouseEventHandler } from "react";
import { FlagIcon, FireIcon } from '@heroicons/react/16/solid';
import { XMarkIcon } from '@heroicons/react/24/outline';

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

/** Represents a value for a button on the bomb map 
        * undefined: no value 
     *  F: button is flagged by the user.
     *  E: button/space is exposed. user clicked on the button and doesn't contain a bomb.
     *  X: button/space is a bomb.
     *  ?: User flagged the button as unknown and not to auto click.
     *  I: Tile is flagged incorrectly as bomb but is empty.
     *  T: Bomb tile that triggered game lost.
*/
export type TileValue = undefined | "X" | "F" | "E" | "?" | "I" | "T" | number;

const TILE_BG_COLOR = "bg-zinc-300";
const TILE_DEFAULT = "border border-black text-xl font-bold h-7 w-7 p-0 text-center";
const TILE_EXPOSED = "bg-white";
const TILE_BOMB = "bg-white";
const TILE_TRIGGERED = "bg-red-600";
const TILE_UNKNOWN = "bg-yellow-200 text-black";
const TILE_DARK = "bg-zinc-400";
const TILE_ONE = "text-blue-500 ";
const TILE_TWO = "text-green-500 ";
const TILE_THREE = "text-red-500 ";
const TILE_FOUR = "text-blue-800 ";
const TILE_FIVE = "text-purple-700 ";
const TILE_SIX = "text-teal-500 ";
const TILE_SEVEN = "text-black ";
const TILE_EIGHT = "text-gray-500 ";

/**
 * Button associated with a bomb tile.
 * 
 * @param {*} param0 
 * @returns 
 */
export default function GameTile({ id, displayValue, exposed, disabled, highlight,
    onTileClick, onTileRightClick, onMouseUp, onMouseDown, onMouseLeave }: Props) {

    const classValue: string = getTileClass(displayValue, highlight, exposed);
    let value: React.ReactNode;

    if (displayValue === "F")
        value = <FlagIcon className='w-5 h-5 m-auto text-rose-500 scale-115' />;
    else if (displayValue === "X" || displayValue === "T")
        value = <FireIcon className='w-5 h-5 m-auto text-neutral-800 scale-115' />;
    else if (displayValue === "I")
        value = (
            <span className='relative'>
                <FlagIcon className='absolute top-[-9px] left-[-9px] w-5 h-5 m-auto text-rose-500 scale-115' />
                <XMarkIcon className='absolute top-[-9px] left-[-9px] w-5 h-5 m-auto text-black scale-[2]' />
            </span>
        );
    else
        value = displayValue?.toString();

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

function getTileClass(tileValue: TileValue, highlight: boolean, exposed: boolean) {

    const defaultExposed = `${TILE_EXPOSED} ${TILE_DEFAULT}`;

    switch (tileValue) {
        case "X":
            return `${TILE_DEFAULT} ${TILE_BOMB}`;
        case "T":
            return `${TILE_DEFAULT} ${TILE_TRIGGERED}`;
        case "F":
            return `${TILE_DEFAULT} ${TILE_BG_COLOR}`;
        case "?":
            return `${TILE_DEFAULT} ${TILE_UNKNOWN}`;
        case 1:
            return defaultExposed + ` ${TILE_ONE}`;
        case 2:
            return defaultExposed + ` ${TILE_TWO}`;
        case 3:
            return defaultExposed + ` ${TILE_THREE}`;
        case 4:
            return defaultExposed + ` ${TILE_FOUR}`;
        case 5:
            return defaultExposed + ` ${TILE_FIVE}`;
        case 6:
            return defaultExposed + ` ${TILE_SIX}`;
        case 7:
            return defaultExposed + ` ${TILE_SEVEN}`;
        case 8:
            return defaultExposed + ` ${TILE_EIGHT}`;
        default:
            return `${(highlight ? ` ${TILE_DARK}` : exposed ? `${TILE_EXPOSED}` : `${TILE_BG_COLOR}`)} ${TILE_DEFAULT}`
    }
}