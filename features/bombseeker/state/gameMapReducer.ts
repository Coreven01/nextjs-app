import { TileValue } from '@/features/bombseeker/components/game-tile';

export interface GameMapState {
  /** 2D array of values in the bomb map. Dimensions should match the rows, columns. First index is rows, second index is columns. */
  bombMap: TileValue[][];

  /** 2D array of values of which tiles have been exposed by the user. Dimensions should match the rows, columns. First index is rows, second index is columns. */
  exposedMap: TileValue[][];
}

interface ActionType {
  type: GameMapActionType;
  payload: TileValue[][];
}

export enum GameMapActionType {
  UPDATE_EXPOSED,
  UPDATE_BOMB
}

export const INIT_GAME_MAP_STATE: GameMapState = {
  bombMap: [],
  exposedMap: []
};

export function gameMapReducer(state: GameMapState, action: ActionType) {
  if (action.type === GameMapActionType.UPDATE_EXPOSED) {
    return { ...state, exposedMap: action.payload };
  } else if (action.type === GameMapActionType.UPDATE_BOMB) {
    return { ...state, bombMap: action.payload };
  } else {
    throw Error('Unknown game map state action: ' + action.type);
  }
}
