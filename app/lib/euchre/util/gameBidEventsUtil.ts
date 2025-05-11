import { BidResult } from '../../../lib/euchre/definitions/definitions';
import { EuchreGameValues } from '../../../lib/euchre/definitions/game-state-definitions';
import { GameEventHandlers } from '../../../hooks/euchre/useEventLog';
import { createAndAddEvent } from './util';
import { getTeamColor } from './playerDataUtil';

const EVENT_TYPE = '[BID STATE]';

const addBeginBidForTrumpEvent = (state: EuchreGameValues, eventHandlers: GameEventHandlers) => {
  createAndAddEvent(
    eventHandlers,
    state.euchreSettings.debugLogDebugEvents,
    'v',
    state.euchreGame.currentPlayer,
    'Begin bid For trump.',
    undefined,
    getTeamColor(state.euchreGame.currentPlayer, state.euchreSettings)
  );
};

const addAnimateBidForTrumpEvent = (
  begin: boolean,
  state: EuchreGameValues,
  eventHandlers: GameEventHandlers
) => {
  createAndAddEvent(
    eventHandlers,
    state.euchreSettings.debugLogDebugEvents,
    'd',
    undefined,
    `${EVENT_TYPE} - ${begin ? 'Begin' : 'End'} animation for bid for trump.`,
    undefined,
    getTeamColor(state.euchreGame.currentPlayer, state.euchreSettings)
  );
};

const addFinalizeBidForTrumpEvent = (
  begin: boolean,
  state: EuchreGameValues,
  eventHandlers: GameEventHandlers
) => {
  createAndAddEvent(
    eventHandlers,
    state.euchreSettings.debugLogDebugEvents,
    'd',
    undefined,
    `${EVENT_TYPE} - ${begin ? 'Begin' : 'End'} finalize bid for trump.`,
    undefined,
    getTeamColor(state.euchreGame.currentPlayer, state.euchreSettings)
  );
};

const addBeginPassDealEvent = (state: EuchreGameValues, eventHandlers: GameEventHandlers) => {
  createAndAddEvent(
    eventHandlers,
    state.euchreSettings.debugLogDebugEvents,
    'i',
    state.euchreGame.dealer,
    'Deal was passed.',
    undefined,
    getTeamColor(state.euchreGame.dealer, state.euchreSettings)
  );
};

const addPassBidEvent = (state: EuchreGameValues, eventHandlers: GameEventHandlers) => {
  createAndAddEvent(
    eventHandlers,
    state.euchreSettings.debugLogDebugEvents,
    'i',
    state.euchreGame.currentPlayer,
    'Passed bid.',
    undefined,
    getTeamColor(state.euchreGame.currentPlayer, state.euchreSettings)
  );
};

const addBidScoreEvent = (
  bidResult: BidResult,
  state: EuchreGameValues,
  eventHandlers: GameEventHandlers
) => {
  createAndAddEvent(
    eventHandlers,
    state.euchreSettings.debugLogDebugEvents,
    'd',
    state.euchreGame.currentPlayer,
    `${EVENT_TYPE} - Hand Score for bid for trump: ` + bidResult.handScore,
    undefined,
    getTeamColor(state.euchreGame.currentPlayer, state.euchreSettings)
  );
};

const addHandleBidSelectionEvent = (state: EuchreGameValues, eventHandlers: GameEventHandlers) => {
  createAndAddEvent(
    eventHandlers,
    state.euchreSettings.debugLogDebugEvents,
    'd',
    state.euchreGame.currentPlayer,
    `${EVENT_TYPE} - Handle bid selection.`,
    undefined,
    getTeamColor(state.euchreGame.currentPlayer, state.euchreSettings)
  );
};

export {
  addBeginBidForTrumpEvent,
  addAnimateBidForTrumpEvent,
  addFinalizeBidForTrumpEvent,
  addBeginPassDealEvent,
  addPassBidEvent,
  addBidScoreEvent,
  addHandleBidSelectionEvent
};
