import { TileValue } from "@/app/ui/bombseeker/game-tile";

export interface GameState {

    /** Boolean value to identify if a game has yet been created. */
    gameStarted: boolean,
    awaitingAnimation: boolean,
    awaitingPlayerTurn: boolean,
    gameBidding: boolean,
    firstBiddingPassed: boolean,
    secondBiddingPassed: boolean,
    gamePlaying: boolean,
    determineDealer: boolean,
    showDeck: boolean,
    cardsDealt: boolean,
}

interface ActionType {
    type: GameActionType,
    payload: GameState,
}

export enum GameActionType {
    UPDATE_ALL,
}

export const initialGameState: GameState = {
    gameStarted: false,
    awaitingAnimation: false,
    awaitingPlayerTurn: true,
    gameBidding: false,
    gamePlaying: false,
    determineDealer: true,
    showDeck: false,
    cardsDealt: false,
    secondBiddingPassed: false,
    firstBiddingPassed: false,
};

export function gameStateReducer(state: GameState, action: ActionType) {

    if (action.type === GameActionType.UPDATE_ALL) {
        return { ...action.payload };
    } else {
        throw Error('Unknown action: ' + action.type);
    }
}