export interface GameState {
  /** Number of total bombs on the map */
  bombCount: number;

  /** Number of rows in the bomb map */
  rowCount: number;

  /** Number of columns in the bomb map */
  columnCount: number;

  /** Boolean value to identify if a game has yet been created. */
  gameCreated: boolean;
}

interface ActionType {
  type: GameActionType;
  payload?: number;
}

export enum GameActionType {
  SET_BOMB_COUNT,
  SET_ROW_COUNT,
  SET_COLUMN_COUNT,
  SET_GAME_CREATED_TRUE,
  SET_GAME_CREATED_FALSE,
}

export const initialGameState: GameState = {
  bombCount: 10,
  rowCount: 9,
  columnCount: 9,
  gameCreated: false,
};

export function gameStateReducer(
  state: GameState,
  action: ActionType,
): GameState {
  if (action.type === GameActionType.SET_BOMB_COUNT) {
    return { ...state, bombCount: action.payload ?? 10 };
  } else if (action.type === GameActionType.SET_COLUMN_COUNT) {
    return { ...state, columnCount: action.payload ?? 9 };
  } else if (action.type === GameActionType.SET_ROW_COUNT) {
    return { ...state, rowCount: action.payload ?? 9 };
  } else if (action.type === GameActionType.SET_GAME_CREATED_TRUE) {
    return { ...state, gameCreated: true };
  } else if (action.type === GameActionType.SET_GAME_CREATED_FALSE) {
    return { ...state, gameCreated: false };
  } else {
    throw Error("Unknown action: " + action.type);
  }
}
