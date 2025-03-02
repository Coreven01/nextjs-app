export interface PlayerGameInfoState {

    /** Values used to identify what information is dynamically shown in the center of the game. */
    player1GameInfo: React.ReactNode,
    player2GameInfo: React.ReactNode,
    player3GameInfo: React.ReactNode,
    player4GameInfo: React.ReactNode,
    centerGameInfo: React.ReactNode,
}

export interface PlayerInfoAction {
    type: PlayerInfoActionType,
    payload: PlayerGameInfoState,
}

export enum PlayerInfoActionType {
    UPDATE_PLAYER1,
    UPDATE_PLAYER2,
    UPDATE_PLAYER3,
    UPDATE_PLAYER4,
    UPDATE_CENTER,
    SET_ALL,
}

export const initialPlayerGameInfo: PlayerGameInfoState = {
    player1GameInfo: <div id="state-1"></div>,
    player2GameInfo: <div id="state-2"></div>,
    player3GameInfo: <div id="state-3"></div>,
    player4GameInfo: <div id="state-4"></div>,
    centerGameInfo: <div id="state-center"></div>,
};

export function playerInfoStateReducer(state: PlayerGameInfoState, action: PlayerInfoAction): PlayerGameInfoState {

    if (action.type === PlayerInfoActionType.UPDATE_PLAYER1) {
        return { ...state, player1GameInfo: action.payload.player1GameInfo };
    } else if (action.type === PlayerInfoActionType.UPDATE_PLAYER2) {
        return { ...state, player2GameInfo: action.payload.player2GameInfo };
    } else if (action.type === PlayerInfoActionType.UPDATE_PLAYER3) {
        return { ...state, player3GameInfo: action.payload.player3GameInfo };
    } else if (action.type === PlayerInfoActionType.UPDATE_PLAYER4) {
        return { ...state, player4GameInfo: action.payload.player4GameInfo };
    } else if (action.type === PlayerInfoActionType.UPDATE_CENTER) {
        return { ...state, centerGameInfo: action.payload.centerGameInfo };
    } else if (action.type === PlayerInfoActionType.SET_ALL) {
        return {
            ...state
            , player1GameInfo: action.payload.player1GameInfo 
            , player2GameInfo: action.payload.player2GameInfo 
            , player3GameInfo: action.payload.player3GameInfo 
            , player4GameInfo: action.payload.player4GameInfo 
            , centerGameInfo: action.payload.centerGameInfo
        };
    }
    else {
        throw Error('Unknown action: ' + action.type);
    }
}