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

interface ActionType {
    type: GameActionType,
    payload: GameState,
}

export enum GameActionType {
    UPDATE_ALL,
}

export const initialGameState: GameState = {
    bombCount: 10,
    rowCount: 9,
    columnCount: 9,
    gameCreated: false,
};

export function gameStateReducer(state: GameState, action: ActionType) {

    if (action.type === GameActionType.UPDATE_ALL) {
        return { ...action.payload };
    } else {
        throw Error('Unknown action: ' + action.type);
    }
}