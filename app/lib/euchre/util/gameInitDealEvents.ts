import { GameEventHandlers } from '../../../hooks/euchre/useEventLog';
import { EuchreGameValues, EuchrePlayer } from '../../../lib/euchre/definitions/game-state-definitions';
import { getTeamColor } from './playerDataUtil';
import { createAndAddEvent } from './util';

const addInitialDealEvent = (state: EuchreGameValues, eventHandlers: GameEventHandlers) => {
  createAndAddEvent(
    eventHandlers,
    state.euchreSettings.debugLogDebugEvents,
    'v',
    undefined,
    'Begin deal cards to determine initial dealer.'
  );
};

const addInitialDealerSetEvent = (
  dealer: EuchrePlayer,
  state: EuchreGameValues,
  eventHandlers: GameEventHandlers
) => {
  createAndAddEvent(
    eventHandlers,
    state.euchreSettings.debugLogDebugEvents,
    'i',
    dealer,
    'Set as initial dealer.',
    undefined,
    getTeamColor(dealer, state.euchreSettings)
  );
};

export { addInitialDealEvent, addInitialDealerSetEvent };
