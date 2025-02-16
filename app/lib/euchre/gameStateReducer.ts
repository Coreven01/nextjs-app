export interface GameState {

    /** Boolean value to identify if a game has yet been created. */
    hasGameStarted: boolean,
    isAwaitingAnimation: boolean,
    isAwaitingPlayerTurn: boolean,
    isGameBidding: boolean,
    hasFirstBiddingPassed: boolean,
    hasSecondBiddingPassed: boolean,
    isGamePlaying: boolean,
    isDetermineDealer: boolean,
    shouldShowDeck: boolean,
    areCardsDealt: boolean,
}

export interface GameAction {
    type: GameActionType,
    payload: GameState,
}

export enum GameActionType {
    UPDATE_ALL,
}

export const initialGameState: GameState = {
    hasGameStarted: false,
    isAwaitingAnimation: false,
    isAwaitingPlayerTurn: true,
    isGameBidding: false,
    isGamePlaying: false,
    isDetermineDealer: true,
    shouldShowDeck: false,
    areCardsDealt: false,
    hasSecondBiddingPassed: false,
    hasFirstBiddingPassed: false,
};

export function gameStateReducer(state: GameState, action: GameAction) {

    if (action.type === GameActionType.UPDATE_ALL) {
        return { ...action.payload };
    } else {
        throw Error('Unknown action: ' + action.type);
    }
}