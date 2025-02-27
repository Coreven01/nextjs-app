import { EuchrePlayer } from "./data";

interface PlayerValue {
    player: EuchrePlayer,
    value: boolean,
}

export enum EuchreGameFlow {
    INIT_DEAL,
    BEGIN_DEAL_FOR_DEALER,
    SHUFFLE_CARDS,
    DEAL_CARDS,
    BID_FOR_TRUMP,
    ORDER_TRUMP,
    PASS_DEAL,
    PLAY_HAND,
}

export enum EuchreAnimateType {
    ANIMATE_NONE,
    ANIMATE_DEAL_FOR_JACK,
    ANIMATE_RETURN_CARDS_TO_DEALER,
    ANIMATE_PASS_CARDS_TO_PLAYERS,
    ANIMATE_DEAL_CARDS_FOR_REGULAR_PLAY,
    ANIMATE_PLAY_CARDS,
    ANIMATE_TAKE_TRICK,
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
    gameFlow: EuchreGameFlow,
    animationType: EuchreAnimateType
}

export interface GameAction {
    type: GameActionType,
    payload: GameState | undefined,
}

export enum GameActionType {
    UPDATE_ALL,
    SET_INIT_DEAL,
    SET_BEGIN_DEAL_FOR_DEALER,
    SET_SHUFFLE_CARDS,
    SET_DEAL_CARDS,
    SET_BID_FOR_TRUMP,
    SET_ORDER_TRUMP,
    SET_PASS_DEAL,
    SET_PLAY_HAND,

    SET_ANIMATE_NONE,
    SET_ANIMATE_DEAL_FOR_JACK,
    SET_ANIMATE_RETURN_CARDS_TO_DEALER,
    SET_ANIMATE_PASS_CARDS_TO_PLAYERS,
    SET_ANIMATE_DEAL_CARDS_FOR_REGULAR_PLAY,
    SET_ANIMATE_PLAY_CARDS,
    SET_ANIMATE_TAKE_TRICK,
}

export const initialGameState: GameState = {
    hasGameStarted: false,
    shouldShowDeckImages: [],
    shouldShowHandImages: [],
    shouldShowHandValues: [],
    areCardsDealt: false,
    hasSecondBiddingPassed: false,
    hasFirstBiddingPassed: false,
    gameFlow: EuchreGameFlow.INIT_DEAL,
    animationType: EuchreAnimateType.ANIMATE_DEAL_FOR_JACK,
};

export function gameStateReducer(state: GameState, action: GameAction): GameState {

    if (action.type === GameActionType.UPDATE_ALL) {
        return { ...state, ...action.payload };
    } else if (action.type === GameActionType.SET_INIT_DEAL) {
        return { ...state, gameFlow: EuchreGameFlow.INIT_DEAL };
    }
    else if (action.type === GameActionType.SET_BEGIN_DEAL_FOR_DEALER) {
        return { ...state, gameFlow: EuchreGameFlow.BEGIN_DEAL_FOR_DEALER };
    }
    else if (action.type === GameActionType.SET_SHUFFLE_CARDS) {
        return { ...state, gameFlow: EuchreGameFlow.SHUFFLE_CARDS };
    }
    else if (action.type === GameActionType.SET_DEAL_CARDS) {
        return { ...state, gameFlow: EuchreGameFlow.DEAL_CARDS };
    }
    else if (action.type === GameActionType.SET_BID_FOR_TRUMP) {
        return { ...state, gameFlow: EuchreGameFlow.BID_FOR_TRUMP };
    }
    else if (action.type === GameActionType.SET_ORDER_TRUMP) {
        return { ...state, gameFlow: EuchreGameFlow.ORDER_TRUMP };
    }
    else if (action.type === GameActionType.SET_PASS_DEAL) {
        return { ...state, gameFlow: EuchreGameFlow.PASS_DEAL };
    }
    else if (action.type === GameActionType.SET_PLAY_HAND) {
        return { ...state, gameFlow: EuchreGameFlow.PLAY_HAND };
    }
    else if (action.type === GameActionType.SET_ANIMATE_NONE) {
        return { ...state, animationType: EuchreAnimateType.ANIMATE_NONE };
    }
    else if (action.type === GameActionType.SET_ANIMATE_DEAL_FOR_JACK) {
        return { ...state, animationType: EuchreAnimateType.ANIMATE_DEAL_FOR_JACK };
    }
    else if (action.type === GameActionType.SET_ANIMATE_RETURN_CARDS_TO_DEALER) {
        return { ...state, animationType: EuchreAnimateType.ANIMATE_RETURN_CARDS_TO_DEALER };
    }
    else if (action.type === GameActionType.SET_ANIMATE_PASS_CARDS_TO_PLAYERS) {
        return { ...state, animationType: EuchreAnimateType.ANIMATE_PASS_CARDS_TO_PLAYERS };
    }
    else if (action.type === GameActionType.SET_ANIMATE_DEAL_CARDS_FOR_REGULAR_PLAY) {
        return { ...state, animationType: EuchreAnimateType.ANIMATE_DEAL_CARDS_FOR_REGULAR_PLAY };
    }
    else if (action.type === GameActionType.SET_ANIMATE_PLAY_CARDS) {
        return { ...state, animationType: EuchreAnimateType.ANIMATE_PLAY_CARDS };
    }
    else if (action.type === GameActionType.SET_ANIMATE_TAKE_TRICK) {
        return { ...state, animationType: EuchreAnimateType.ANIMATE_TAKE_TRICK };
    }
    else {
        throw Error('Unknown action: ' + action.type);
    }
}