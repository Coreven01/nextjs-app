import { TileValue } from "@/app/ui/bombseeker/game-tile";

export interface GameMap {

    /** 2D array of values in the bomb map. Dimensions should match the rows, columns. */
    bombMap: TileValue[][],

    /** 2D array of values of which tiles have been exposed by the user. Dimensions should match the rows, columns. */
    exposedMap: TileValue[][],
}

export interface ActionType {
    type: string,
    state: GameMap,
}

export const initialGameState: GameMap = {
    bombMap: [],
    exposedMap: [],
};

export function gameMapReducer(state: GameMap, action: ActionType) {

    if (action.type === 'update') {
        return { ...action.state };
    } else {
        throw Error('Unknown action: ' + action.type);
    }
}