import { TileValue } from "@/app/ui/bombseeker/game-tile";

export interface GameMapState {

    /** 2D array of values in the bomb map. Dimensions should match the rows, columns. */
    bombMap: TileValue[][],

    /** 2D array of values of which tiles have been exposed by the user. Dimensions should match the rows, columns. */
    exposedMap: TileValue[][],
}

 interface ActionType {
    type: GameMapActionType,
    payload: GameMapState,
}

export enum GameMapActionType {
    UPDATE_EXPOSED,
    UPDATE_BOMB,
    UPDATE_ALL,
}

export const initialGameMapState: GameMapState = {
    bombMap: [],
    exposedMap: [],
};

export function gameMapReducer(state: GameMapState, action: ActionType) {

    if (action.type === GameMapActionType.UPDATE_EXPOSED) {
        return { ...state, exposedMap: action.payload.exposedMap };
    } else if (action.type === GameMapActionType.UPDATE_BOMB) {
        return { ...state, bombMap: action.payload.bombMap };
    }else if (action.type === GameMapActionType.UPDATE_ALL) {
            return { ...state, ...action.payload };
    } else {
        throw Error('Unknown action: ' + action.type);
    }
}