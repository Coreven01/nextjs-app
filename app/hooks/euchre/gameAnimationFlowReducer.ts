export enum EuchreAnimateType {
  ANIMATE_NONE,
  ANIMATE_DEAL_FOR_JACK,
  ANIMATE_RETURN_CARDS_TO_DEALER,
  ANIMATE_PASS_CARDS_TO_PLAYERS,
  ANIMATE_DEAL_CARDS_FOR_REGULAR_PLAY,
  ANIMATE_ORDER_TRUMP,
  ANIMATE_PLAY_CARDS,
  ANIMATE_HANDLE_BID,
  ANIMATE_HANDLE_PLAY_CARD,
  ANIMATE_TAKE_TRICK
}

export interface EuchreAnimationState {
  animationType: EuchreAnimateType;
}

export interface EuchreAnimationAction {
  type: EuchreAnimationAnimationType;
}

export enum EuchreAnimationAnimationType {
  SET_ANIMATE_NONE,
  SET_ANIMATE_DEAL_FOR_JACK,
  SET_ANIMATE_RETURN_CARDS_TO_DEALER,
  SET_ANIMATE_PASS_CARDS_TO_PLAYERS,
  SET_ANIMATE_DEAL_CARDS_FOR_REGULAR_PLAY,
  SET_ANIMATE_ORDER_TRUMP,
  SET_ANIMATE_HANDLE_BID,
  SET_ANIMATE_HANDLE_PLAY_CARD,
  SET_ANIMATE_PLAY_CARDS,
  SET_ANIMATE_TAKE_TRICK
}

export const initialGameAnimationState: EuchreAnimationState = {
  animationType: EuchreAnimateType.ANIMATE_DEAL_FOR_JACK
};

export function gameAnimationFlowReducer(
  state: EuchreAnimationState,
  action: EuchreAnimationAction
): EuchreAnimationState {
  if (action.type === EuchreAnimationAnimationType.SET_ANIMATE_NONE) {
    return { ...state, animationType: EuchreAnimateType.ANIMATE_NONE };
  } else if (action.type === EuchreAnimationAnimationType.SET_ANIMATE_DEAL_FOR_JACK) {
    return { ...state, animationType: EuchreAnimateType.ANIMATE_DEAL_FOR_JACK };
  } else if (action.type === EuchreAnimationAnimationType.SET_ANIMATE_RETURN_CARDS_TO_DEALER) {
    return {
      ...state,
      animationType: EuchreAnimateType.ANIMATE_RETURN_CARDS_TO_DEALER
    };
  } else if (action.type === EuchreAnimationAnimationType.SET_ANIMATE_PASS_CARDS_TO_PLAYERS) {
    return {
      ...state,
      animationType: EuchreAnimateType.ANIMATE_PASS_CARDS_TO_PLAYERS
    };
  } else if (action.type === EuchreAnimationAnimationType.SET_ANIMATE_DEAL_CARDS_FOR_REGULAR_PLAY) {
    return {
      ...state,
      animationType: EuchreAnimateType.ANIMATE_DEAL_CARDS_FOR_REGULAR_PLAY
    };
  } else if (action.type === EuchreAnimationAnimationType.SET_ANIMATE_HANDLE_BID) {
    return { ...state, animationType: EuchreAnimateType.ANIMATE_HANDLE_BID };
  } else if (action.type === EuchreAnimationAnimationType.SET_ANIMATE_HANDLE_PLAY_CARD) {
    return { ...state, animationType: EuchreAnimateType.ANIMATE_HANDLE_PLAY_CARD };
  } else if (action.type === EuchreAnimationAnimationType.SET_ANIMATE_ORDER_TRUMP) {
    return { ...state, animationType: EuchreAnimateType.ANIMATE_ORDER_TRUMP };
  } else if (action.type === EuchreAnimationAnimationType.SET_ANIMATE_PLAY_CARDS) {
    return { ...state, animationType: EuchreAnimateType.ANIMATE_PLAY_CARDS };
  } else if (action.type === EuchreAnimationAnimationType.SET_ANIMATE_TAKE_TRICK) {
    return { ...state, animationType: EuchreAnimateType.ANIMATE_TAKE_TRICK };
  } else {
    throw Error('Unknown action: ' + action.type);
  }
}
