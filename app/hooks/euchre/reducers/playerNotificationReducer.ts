import React from 'react';
import { TableLocation } from '../../../lib/euchre/definitions/definitions';

export interface PlayerNotificationState {
  /** Values used to identify what information is dynamically shown in the center of the game. */
  bottomGameInfo: React.ReactNode;
  topGameInfo: React.ReactNode;
  leftGameInfo: React.ReactNode;
  rightGameInfo: React.ReactNode;
  centerGameInfo: React.ReactNode;
}

export interface PlayerNotificationAction {
  type: PlayerNotificationActionType;
  payload?: React.ReactNode;
}

export enum PlayerNotificationActionType {
  UPDATE_BOTTOM,
  UPDATE_TOP,
  UPDATE_LEFT,
  UPDATE_RIGHT,
  UPDATE_CENTER,
  RESET
}

export const INIT_PLAYER_NOTIFICATION: PlayerNotificationState = {
  bottomGameInfo: undefined,
  topGameInfo: undefined,
  leftGameInfo: undefined,
  rightGameInfo: undefined,
  centerGameInfo: undefined
};

export function playerNotificationReducer(
  state: PlayerNotificationState,
  action: PlayerNotificationAction
): PlayerNotificationState {
  if (action.type === PlayerNotificationActionType.UPDATE_BOTTOM) {
    return { ...state, bottomGameInfo: action.payload };
  } else if (action.type === PlayerNotificationActionType.UPDATE_TOP) {
    return { ...state, topGameInfo: action.payload };
  } else if (action.type === PlayerNotificationActionType.UPDATE_LEFT) {
    return { ...state, leftGameInfo: action.payload };
  } else if (action.type === PlayerNotificationActionType.UPDATE_RIGHT) {
    return { ...state, rightGameInfo: action.payload };
  } else if (action.type === PlayerNotificationActionType.UPDATE_CENTER) {
    return { ...state, centerGameInfo: action.payload };
  } else if (action.type === PlayerNotificationActionType.RESET) {
    return { ...INIT_PLAYER_NOTIFICATION };
  } else {
    throw Error('Unknown action: ' + action.type);
  }
}

export function getPlayerNotificationType(location: TableLocation): PlayerNotificationActionType {
  switch (location) {
    case 'bottom':
      return PlayerNotificationActionType.UPDATE_BOTTOM;
    case 'top':
      return PlayerNotificationActionType.UPDATE_TOP;
    case 'left':
      return PlayerNotificationActionType.UPDATE_LEFT;
    case 'right':
      return PlayerNotificationActionType.UPDATE_RIGHT;
  }

  return PlayerNotificationActionType.UPDATE_BOTTOM;
}
