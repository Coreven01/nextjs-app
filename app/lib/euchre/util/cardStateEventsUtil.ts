import { GameEventHandlers } from '../../../hooks/euchre/useEventLog';
import { EuchreGameState, EuchrePlayer } from '../../../lib/euchre/definitions/game-state-definitions';

import { getTeamColor } from '../../../lib/euchre/util/playerDataUtil';
import { createAndAddEvent } from './util';

const EVENT_TYPE = '[CARD STATE]';

const addInitializeHandStateEvent = (
  state: EuchreGameState,
  eventHandlers: GameEventHandlers,
  player: EuchrePlayer
) => {
  createAndAddEvent(
    eventHandlers,
    state.euchreSettings.debugLogDebugEvents,
    'd',
    player,
    `${EVENT_TYPE} - Initialize hand state for hand ID: ` + state.euchreGame.handId,
    undefined,
    getTeamColor(player, state.euchreSettings)
  );
};

const addInitializeCardStateEvent = (
  state: EuchreGameState,
  eventHandlers: GameEventHandlers,
  player: EuchrePlayer
) => {
  createAndAddEvent(
    eventHandlers,
    state.euchreSettings.debugLogDebugEvents,
    'd',
    player,
    `${EVENT_TYPE} - Initialize card state.`,
    undefined,
    getTeamColor(player, state.euchreSettings)
  );
};

const addInitializeCardRegroupEvent = (
  state: EuchreGameState,
  eventHandlers: GameEventHandlers,
  player: EuchrePlayer
) => {
  createAndAddEvent(
    eventHandlers,
    state.euchreSettings.debugLogDebugEvents,
    'd',
    player,
    `${EVENT_TYPE} - Initialize regroup player cards.`,
    undefined,
    getTeamColor(player, state.euchreSettings)
  );
};

export { addInitializeHandStateEvent, addInitializeCardStateEvent, addInitializeCardRegroupEvent };
