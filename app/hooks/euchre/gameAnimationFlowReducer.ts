export enum EuchreAnimateType {
  ANIMATE_NONE = 1,
  ANIMATE_DEAL_FOR_DEALER,
  ANIMATE_RETURN_CARDS_TO_DEALER,
  ANIMATE_PASS_CARDS_TO_PLAYERS,
  ANIMATE_DEAL_CARDS_FOR_REGULAR_PLAY,
  ANIMATE_ORDER_TRUMP,
  ANIMATE_BEGIN_PLAY_CARD,
  ANIMATE_BEGIN_BID_FOR_TRUMP,
  ANIMATE_END_PLAY_CARD,
  ANIMATE_BEGIN_PLAY_CARD_RESULT,
  ANIMATE_END_PLAY_CARD_RESULT,
  ANIMATE_TAKE_TRICK
}

export enum EuchreAnimationActionType {
  SET_ANIMATE_NONE = 1,
  SET_ANIMATE_DEAL_FOR_DEALER,
  SET_ANIMATE_RETURN_CARDS_TO_DEALER,
  SET_ANIMATE_PASS_CARDS_TO_PLAYERS,
  SET_ANIMATE_DEAL_CARDS_FOR_REGULAR_PLAY,
  SET_ANIMATE_ORDER_TRUMP,
  SET_ANIMATE_BEGIN_BID_FOR_TRUMP,
  SET_ANIMATE_BEGIN_PLAY_CARD_RESULT,
  SET_ANIMATE_END_PLAY_CARD_RESULT,
  SET_ANIMATE_BEGIN_PLAY_CARD,
  SET_ANIMATE_END_PLAY_CARD,
  SET_ANIMATE_TAKE_TRICK
}

const actionTypeMap: Map<EuchreAnimationActionType, EuchreAnimateType> = new Map([
  [EuchreAnimationActionType.SET_ANIMATE_NONE, EuchreAnimateType.ANIMATE_NONE],
  [EuchreAnimationActionType.SET_ANIMATE_DEAL_FOR_DEALER, EuchreAnimateType.ANIMATE_DEAL_FOR_DEALER],
  [
    EuchreAnimationActionType.SET_ANIMATE_RETURN_CARDS_TO_DEALER,
    EuchreAnimateType.ANIMATE_RETURN_CARDS_TO_DEALER
  ],
  [
    EuchreAnimationActionType.SET_ANIMATE_PASS_CARDS_TO_PLAYERS,
    EuchreAnimateType.ANIMATE_PASS_CARDS_TO_PLAYERS
  ],
  [
    EuchreAnimationActionType.SET_ANIMATE_DEAL_CARDS_FOR_REGULAR_PLAY,
    EuchreAnimateType.ANIMATE_DEAL_CARDS_FOR_REGULAR_PLAY
  ],
  [EuchreAnimationActionType.SET_ANIMATE_ORDER_TRUMP, EuchreAnimateType.ANIMATE_ORDER_TRUMP],
  [EuchreAnimationActionType.SET_ANIMATE_BEGIN_BID_FOR_TRUMP, EuchreAnimateType.ANIMATE_BEGIN_BID_FOR_TRUMP],
  [
    EuchreAnimationActionType.SET_ANIMATE_BEGIN_PLAY_CARD_RESULT,
    EuchreAnimateType.ANIMATE_BEGIN_PLAY_CARD_RESULT
  ],
  [
    EuchreAnimationActionType.SET_ANIMATE_END_PLAY_CARD_RESULT,
    EuchreAnimateType.ANIMATE_END_PLAY_CARD_RESULT
  ],
  [EuchreAnimationActionType.SET_ANIMATE_BEGIN_PLAY_CARD, EuchreAnimateType.ANIMATE_BEGIN_PLAY_CARD],
  [EuchreAnimationActionType.SET_ANIMATE_END_PLAY_CARD, EuchreAnimateType.ANIMATE_END_PLAY_CARD],
  [EuchreAnimationActionType.SET_ANIMATE_TAKE_TRICK, EuchreAnimateType.ANIMATE_TAKE_TRICK]
]);

export interface EuchreAnimationState {
  animationType: EuchreAnimateType;
}

export interface EuchreAnimationAction {
  type: EuchreAnimationActionType;
}

export const initialGameAnimationState: EuchreAnimationState = {
  animationType: EuchreAnimateType.ANIMATE_DEAL_FOR_DEALER
};

export function gameAnimationFlowReducer(
  state: EuchreAnimationState,
  action: EuchreAnimationAction
): EuchreAnimationState {
  if (actionTypeMap.get(action.type)) {
    return {
      ...state,
      animationType: actionTypeMap.get(action.type) ?? EuchreAnimateType.ANIMATE_NONE
    };
  } else {
    throw Error('Unknown game animation flow action: ' + action.type);
  }
}
