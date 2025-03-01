import { FadeOutProps } from "./useFadeOut";

export interface PlayerInfoStateDetail {
    id: string | undefined,
    detail: React.ReactNode,

}
export interface PlayerInfoState {

    /** Values used to identify what information is dynamically shown in the center of the game. */
    player1Info: PlayerInfoStateDetail,
    player2Info: PlayerInfoStateDetail,
    player3Info: PlayerInfoStateDetail,
    player4Info: PlayerInfoStateDetail,
    centerInfo: PlayerInfoStateDetail,
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
    SET_ALL,
}

export const initialPlayerInfoState: PlayerInfoState = {
    player1Info: { id: "state-1", detail: undefined },
    player2Info: { id: "state-2", detail: undefined },
    player3Info: { id: "state-3", detail: undefined },
    player4Info: { id: "state-4", detail: undefined },
    centerInfo: { id: "state-center", detail: undefined },
};

export function playerInfoStateReducer(state: PlayerInfoState, action: PlayerInfoAction): PlayerInfoState {

    if (action.type === PlayerInfoActionType.UPDATE_PLAYER1) {
        return { ...state, player1Info: action.payload.player1Info };
    } else if (action.type === PlayerInfoActionType.UPDATE_PLAYER2) {
        return { ...state, player2Info: action.payload.player2Info };
    } else if (action.type === PlayerInfoActionType.UPDATE_PLAYER3) {
        return { ...state, player3Info: action.payload.player3Info };
    } else if (action.type === PlayerInfoActionType.UPDATE_PLAYER4) {
        return { ...state, player4Info: action.payload.player4Info };
    } else if (action.type === PlayerInfoActionType.UPDATE_CENTER) {
        return { ...state, centerInfo: action.payload.centerInfo };
    } else if (action.type === PlayerInfoActionType.SET_ALL) {
        return {
            ...state
            , player1Info: { ...action.payload.player1Info }
            , player2Info: { ...action.payload.player2Info }
            , player3Info: { ...action.payload.player3Info }
            , player4Info: { ...action.payload.player4Info }
            , centerInfo: { ...action.payload.centerInfo }
        };
    }
    else {
        throw Error('Unknown action: ' + action.type);
    }
}