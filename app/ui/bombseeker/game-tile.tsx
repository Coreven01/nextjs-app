import styles from "@/app/ui/bombseeker/bombseeker.module.css"
import { MouseEventHandler } from "react";

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
    */
    value: undefined | "X" | "F" | "E" | "?" | number
}

/**
 * Button associated with a bomb tile.
 * 
 * @param {*} param0 
 * @returns 
 */
export default function GameTile({ id, displayValue, exposed, disabled, highlight, 
    onTileClick, onTileRightClick, onMouseUp, onMouseDown, onMouseLeave }: Props) {

    const defaultClass = `${styles.tile} ${styles.tileExposed}`;

    function getTileClass(tileValue: TileValue) {
        switch(tileValue?.value)
        {
            case "X":
                return `${styles.tile} ${styles.tileBomb}`;
            case "F":
                return `${styles.tile} ${styles.tileBomb}`;
            case 1:
                return defaultClass + ` ${styles.tileOne}`;
            case 2:
                return defaultClass + ` ${styles.tileTwo}`;
            case 3:
                return defaultClass + ` ${styles.tileThree}`;
            case 4:
                return defaultClass + ` ${styles.tileFour}`;
            case 5:
                return defaultClass + ` ${styles.tileFive}`;
            case 6:
                return defaultClass + ` ${styles.tileSix}`;
            case 7:
                return defaultClass + ` ${styles.tileSeven}`;
            case 8:
                return defaultClass + ` ${styles.tileEight}`;
            default:
                return ` ${styles.tile}`
        }
    }

    let classValue = exposed ? `${styles.tileExposed} ` +  getTileClass(displayValue) : getTileClass(displayValue);
    classValue = classValue + (highlight ? ` ${styles.tileDark}` : "");

    return (
      <button 
        key={id} 
        data-key={id} 
        className={classValue}
        onClick={onTileClick} 
        onContextMenu={onTileRightClick} 
        onMouseUp={onMouseUp}
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeave}
        disabled={disabled}>
            {displayValue.value}
      </button>
    );
  }