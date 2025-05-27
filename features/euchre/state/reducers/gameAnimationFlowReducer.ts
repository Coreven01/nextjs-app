export enum EuchreAnimateType {
  NONE = 1,
  ANIMATE
}

export enum EuchreAnimationActionType {
  SET_NONE = 1,
  SET_ANIMATE
}

export interface EuchreAnimationState {
  animationType: EuchreAnimateType;
}

export interface EuchreAnimationAction {
  type: EuchreAnimationActionType;
}

export const INIT_GAME_ANIMATION_STATE: EuchreAnimationState = {
  animationType: EuchreAnimateType.NONE
};

export function gameAnimationFlowReducer(
  state: EuchreAnimationState,
  action: EuchreAnimationAction
): EuchreAnimationState {
  if (action.type === EuchreAnimationActionType.SET_ANIMATE) {
    return {
      ...state,
      animationType: EuchreAnimateType.ANIMATE
    };
  } else if (action.type === EuchreAnimationActionType.SET_NONE) {
    return {
      ...state,
      animationType: EuchreAnimateType.NONE
    };
  } else {
    throw Error('Unknown game animation flow action: ' + action.type);
  }
}
