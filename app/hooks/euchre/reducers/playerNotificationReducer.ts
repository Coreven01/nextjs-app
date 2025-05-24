import React from 'react';
import { TableLocation } from '../../../../features/euchre/definitions/definitions';

export interface NotificationState {
  /** Values used to identify what information is dynamically shown in the center of the game. */
  bottomGameInfo: React.ReactNode;
  topGameInfo: React.ReactNode;
  leftGameInfo: React.ReactNode;
  rightGameInfo: React.ReactNode;
  centerGameInfo: React.ReactNode;
}

export interface NotificationAction {
  type: NotificationActionType;
  payload?: React.ReactNode;
}

export enum NotificationActionType {
  BOTTOM,
  TOP,
  LEFT,
  RIGHT,
  CENTER,
  RESET
}

export const INIT_PLAYER_NOTIFICATION: NotificationState = {
  bottomGameInfo: undefined,
  topGameInfo: undefined,
  leftGameInfo: undefined,
  rightGameInfo: undefined,
  centerGameInfo: undefined
};

export function playerNotificationReducer(
  state: NotificationState,
  action: NotificationAction
): NotificationState {
  if (action.type === NotificationActionType.BOTTOM) {
    return { ...state, bottomGameInfo: action.payload };
  } else if (action.type === NotificationActionType.TOP) {
    return { ...state, topGameInfo: action.payload };
  } else if (action.type === NotificationActionType.LEFT) {
    return { ...state, leftGameInfo: action.payload };
  } else if (action.type === NotificationActionType.RIGHT) {
    return { ...state, rightGameInfo: action.payload };
  } else if (action.type === NotificationActionType.CENTER) {
    return { ...state, centerGameInfo: action.payload };
  } else if (action.type === NotificationActionType.RESET) {
    return { ...INIT_PLAYER_NOTIFICATION };
  } else {
    throw Error('Unknown action: ' + action.type);
  }
}

export function getPlayerNotificationType(location: TableLocation): NotificationActionType {
  switch (location) {
    case 'bottom':
      return NotificationActionType.BOTTOM;
    case 'top':
      return NotificationActionType.TOP;
    case 'left':
      return NotificationActionType.LEFT;
    case 'right':
      return NotificationActionType.RIGHT;
  }

  return NotificationActionType.BOTTOM;
}
