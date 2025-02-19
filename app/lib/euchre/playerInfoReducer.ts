
export interface PlayerInfoState {

    /** Boolean value to identify if a game has yet been created. */
    player1Info: React.ReactNode | undefined,
    player2Info: React.ReactNode | undefined,
    player3Info: React.ReactNode | undefined,
    player4Info: React.ReactNode | undefined,
    centerInfo: React.ReactNode | undefined,
}

export interface PlayerInfoAction {
    type: PlayerInfoActionType,
    payload: PlayerInfoState,
}

export enum PlayerInfoActionType {
    UPDATE_PLAYER1,
    UPDATE_PLAYER2,
    UPDATE_PLAYER3,
    UPDATE_PLAYER4,
    UPDATE_CENTER,
    RESET_ALL,
}

export const initialPlayerInfoState: PlayerInfoState = {
    player1Info: undefined,
    player2Info: undefined,
    player3Info: undefined,
    player4Info: undefined,
    centerInfo: undefined,
};

export function playerInfoStateReducer(state: PlayerInfoState, action: PlayerInfoAction) {

    if (action.type === PlayerInfoActionType.UPDATE_PLAYER1) {
        return { ...state, player1Info: action.payload.player1Info, };
    } else if (action.type === PlayerInfoActionType.UPDATE_PLAYER2) {
        return { ...state, player2Info: action.payload.player2Info, };
    } else if
        (action.type === PlayerInfoActionType.UPDATE_PLAYER3) {
        return { ...state, player3Info: action.payload.player3Info, };
    } else if
        (action.type === PlayerInfoActionType.UPDATE_PLAYER4) {
        return { ...state, player4Info: action.payload.player4Info, };
    } else if
        (action.type === PlayerInfoActionType.UPDATE_CENTER) {
        return { ...state, centerInfo: action.payload.centerInfo, };
    } else if (action.type === PlayerInfoActionType.RESET_ALL) {
        return { player1Info: undefined, player2Info: undefined, player3Info: undefined, player4Info: undefined, centerInfo: undefined };
    }
    else {
        throw Error('Unknown action: ' + action.type);
    }
}