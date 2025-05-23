import { GameEventHandlers } from '../../../../app/hooks/euchre/useEventLog';
import { EuchreGameState } from '../../definitions/game-state-definitions';
import { createAndAddEvent } from '../../../../app/lib/euchre/util/util';

const EVENT_TYPE = '[DECK STATE]';

const addResetForDealerEvent = (state: EuchreGameState, eventHandlers: GameEventHandlers) => {
  createAndAddEvent(
    eventHandlers,
    state.euchreSettings.debugLogDebugEvents,
    'd',
    undefined,
    `${EVENT_TYPE} - Begin game deck state reset for hand ID: ` + state.euchreGame.handId
  );
};

const addAnimateForBeginDealForDealerEvent = (
  begin: boolean,
  skipped: boolean,
  state: EuchreGameState,
  eventHandlers: GameEventHandlers
) => {
  createAndAddEvent(
    eventHandlers,
    state.euchreSettings.debugLogDebugEvents,
    'd',
    undefined,
    `${EVENT_TYPE} - ${begin ? 'Begin' : 'End'} animation${skipped ? ' SKIPPED ' : ' '}for begin deal for dealer.`
  );
};

const addAnimateForEndDealForDealerEvent = (
  begin: boolean,
  skipped: boolean,
  state: EuchreGameState,
  eventHandlers: GameEventHandlers
) => {
  createAndAddEvent(
    eventHandlers,
    state.euchreSettings.debugLogDebugEvents,
    'd',
    undefined,
    `${EVENT_TYPE} - ${begin ? 'Begin' : 'End'} animation${skipped ? ' SKIPPED ' : ' '}for end deal for dealer.`
  );
};

const addAnimateForDealForRegularPlayEvent = (
  begin: boolean,
  skipped: boolean,
  state: EuchreGameState,
  eventHandlers: GameEventHandlers
) => {
  createAndAddEvent(
    eventHandlers,
    state.euchreSettings.debugLogDebugEvents,
    'd',
    undefined,
    `${EVENT_TYPE} - ${begin ? 'Begin' : 'End'} animation${skipped ? ' SKIPPED ' : ' '}for begin deal for dealer.`
  );
};

export {
  addResetForDealerEvent,
  addAnimateForBeginDealForDealerEvent,
  addAnimateForEndDealForDealerEvent,
  addAnimateForDealForRegularPlayEvent
};
