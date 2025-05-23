import { GameEventHandlers, SUB_CARD } from '../../../../app/hooks/euchre/useEventLog';

import { createAndAddEvent } from '../../../../app/lib/euchre/util/util';
import { EuchreGameValues } from '../../definitions/game-state-definitions';
import { getTeamColor } from './playerDataUtil';

//const EVENT_TYPE = '[SHUFFLE STATE]';

const addSkipDealAnimationEvent = (state: EuchreGameValues, eventHandlers: GameEventHandlers) => {
  createAndAddEvent(
    eventHandlers,
    state.euchreSettings.debugLogDebugEvents,
    'v',
    state.euchreGame.dealer,
    'Begin shuffle and deal for regular play. INIT ANIMATION SKIPPED.',
    undefined,
    getTeamColor(state.euchreGame.dealer, state.euchreSettings)
  );
};

const addBeginShuffleEvent = (state: EuchreGameValues, eventHandlers: GameEventHandlers) => {
  createAndAddEvent(
    eventHandlers,
    state.euchreSettings.debugLogDebugEvents,
    'v',
    state.euchreGame.dealer,
    'Begin shuffle and deal for regular play.',
    undefined,
    getTeamColor(state.euchreGame.dealer, state.euchreSettings)
  );
};

const addTrumpCardFlippedEvent = (state: EuchreGameValues, eventHandlers: GameEventHandlers) => {
  createAndAddEvent(
    eventHandlers,
    state.euchreSettings.debugLogDebugEvents,
    'i',
    state.euchreGame.dealer,
    `Flipped up ${SUB_CARD} for bidding.`,
    [state.euchreGame.trump],
    getTeamColor(state.euchreGame.dealer, state.euchreSettings)
  );
};

export { addSkipDealAnimationEvent, addBeginShuffleEvent, addTrumpCardFlippedEvent };
