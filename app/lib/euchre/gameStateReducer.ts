import { EuchrePlayer } from "./data";

interface PlayerValue {
    player: EuchrePlayer,
    value: boolean,
}

export interface GameState {

    /** Boolean value to identify if a game has yet been created. */
    hasGameStarted: boolean,
    hasFirstBiddingPassed: boolean,
    hasSecondBiddingPassed: boolean,

    /** Should show the game deck. Shown when animating dealing cards to users. */
    shouldShowDeckImages: PlayerValue[],

    /** Should show the images for cards for the player. This does not show the value of the cards, but the back of the card. */
    shouldShowHandImages: PlayerValue[],

    /** Should show the cards face up. */
    shouldShowHandValues: PlayerValue[],
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
    shouldShowDeckImages: [],
    shouldShowHandImages: [],
    shouldShowHandValues: [],
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