import React from 'react';

export interface PlayerNotificationState {
  /** Values used to identify what information is dynamically shown in the center of the game. */
  player1GameInfo: React.ReactNode;
  player2GameInfo: React.ReactNode;
  player3GameInfo: React.ReactNode;
  player4GameInfo: React.ReactNode;
  centerGameInfo: React.ReactNode;
}

export interface PlayerNotificationAction {
  type: PlayerNotificationActionType;
  payload?: React.ReactNode;
}

export enum PlayerNotificationActionType {
  UPDATE_PLAYER1,
  UPDATE_PLAYER2,
  UPDATE_PLAYER3,
  UPDATE_PLAYER4,
  UPDATE_CENTER,
  RESET
}

export const initialPlayerNotification: PlayerNotificationState = {
  player1GameInfo: undefined,
  player2GameInfo: undefined,
  player3GameInfo: undefined,
  player4GameInfo: undefined,
  centerGameInfo: undefined
};

export function playerNotificationReducer(
  state: PlayerNotificationState,
  action: PlayerNotificationAction
): PlayerNotificationState {
  if (action.type === PlayerNotificationActionType.UPDATE_PLAYER1) {
    return { ...state, player1GameInfo: action.payload };
  } else if (action.type === PlayerNotificationActionType.UPDATE_PLAYER2) {
    return { ...state, player2GameInfo: action.payload };
  } else if (action.type === PlayerNotificationActionType.UPDATE_PLAYER3) {
    return { ...state, player3GameInfo: action.payload };
  } else if (action.type === PlayerNotificationActionType.UPDATE_PLAYER4) {
    return { ...state, player4GameInfo: action.payload };
  } else if (action.type === PlayerNotificationActionType.UPDATE_CENTER) {
    return { ...state, centerGameInfo: action.payload };
  } else if (action.type === PlayerNotificationActionType.RESET) {
    return { ...initialPlayerNotification };
  } else {
    throw Error('Unknown action: ' + action.type);
  }
}
