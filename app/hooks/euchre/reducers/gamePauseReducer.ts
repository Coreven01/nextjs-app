export enum EuchrePauseType {
  NONE = 1,
  GENERAL,
  ANIMATE,
  USER_INPUT,
  AI_INPUT,
  PROMPT,
  ERROR,
  CANCEL
}

export enum EuchrePauseActionType {
  SET_NONE = 1,
  SET_GENERAL,
  SET_ANIMATE,
  SET_USER_INPUT,
  SET_AI_INPUT,
  SET_PROMPT,
  SET_ERROR,
  SET_CANCEL
}

export interface EuchrePauseState {
  pauseType: EuchrePauseType;
}

export interface EuchrePauseAction {
  type: EuchrePauseActionType;
}

export const INIT_PAUSE_STATE: EuchrePauseState = {
  pauseType: EuchrePauseType.NONE
};

export function gamePauseFlowReducer(state: EuchrePauseState, action: EuchrePauseAction): EuchrePauseState {
  if (action.type === EuchrePauseActionType.SET_ANIMATE) {
    return {
      ...state,
      pauseType: EuchrePauseType.ANIMATE
    };
  } else if (action.type === EuchrePauseActionType.SET_NONE) {
    return {
      ...state,
      pauseType: EuchrePauseType.NONE
    };
  } else if (action.type === EuchrePauseActionType.SET_GENERAL) {
    return {
      ...state,
      pauseType: EuchrePauseType.GENERAL
    };
  } else if (action.type === EuchrePauseActionType.SET_USER_INPUT) {
    return {
      ...state,
      pauseType: EuchrePauseType.USER_INPUT
    };
  } else if (action.type === EuchrePauseActionType.SET_AI_INPUT) {
    return {
      ...state,
      pauseType: EuchrePauseType.AI_INPUT
    };
  } else if (action.type === EuchrePauseActionType.SET_CANCEL) {
    return {
      ...state,
      pauseType: EuchrePauseType.CANCEL
    };
  } else if (action.type === EuchrePauseActionType.SET_ERROR) {
    return {
      ...state,
      pauseType: EuchrePauseType.ERROR
    };
  } else if (action.type === EuchrePauseActionType.SET_PROMPT) {
    return {
      ...state,
      pauseType: EuchrePauseType.PROMPT
    };
  } else {
    throw Error('Unknown game wait action: ' + action.type);
  }
}
