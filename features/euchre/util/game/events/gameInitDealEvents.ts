import { GameEventHandlers } from '../../../hooks/common/useEventLog';
import { createAndAddEvent } from '../../util';
import { EuchreGameValues, EuchrePlayer } from '../../../definitions/game-state-definitions';
import { getTeamColor } from '../playerDataUtil';

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
