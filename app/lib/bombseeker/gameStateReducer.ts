import { TileValue } from "@/app/ui/bombseeker/game-tile";

export interface GameState {

    /** Number of total bombs on the map */
    bombCount: number,

     /** Number of rows in the bomb map */
    rowCount: number,

    /** Number of columns in the bomb map */
    columnCount: number,

    /** Boolean value to identify if a game has yet been created. */
    gameCreated: boolean,
}

export interface ActionType {
    type: string,
    state: GameState,
}

export const initialGameState: GameState = {
    bombCount: 10,
    rowCount: 9,
    columnCount: 9,
    gameCreated: false,
};

export function gameStateReducer(state: GameState, action: ActionType) {

    if (action.type === 'update') {
        return { ...action.state };
    } else {
        throw Error('Unknown action: ' + action.type);
    }
}