import { GameEventHandlers, SUB_CARD, SUB_SUIT } from '../../../hooks/common/useEventLog';

import { createAndAddEvent } from '../../util';
import { BidResult, Card } from '../../../definitions/definitions';
import { EuchrePlayer, EuchreGameValues } from '../../../definitions/game-state-definitions';
import { getTeamColor } from '../playerDataUtil';

const EVENT_TYPE = '[ORDER STATE]';

const addTrumpOrderedEvent = (
  maker: EuchrePlayer,
  bidResult: BidResult,
  state: EuchreGameValues,
  eventHandlers: GameEventHandlers
) => {
  createAndAddEvent(
    eventHandlers,
    state.euchreSettings.debugLogDebugEvents,
    'i',
    maker ?? undefined,
    `Trump named: ${SUB_SUIT}. ${bidResult.loner ? ' Going alone.' : ''}`,
    [{ value: '2', suit: bidResult.calledSuit ?? state.euchreGame.trump.suit, index: 0 }],
    maker ? getTeamColor(maker, state.euchreSettings) : undefined
  );
};

const addDealerPickedUpEvent = (state: EuchreGameValues, eventHandlers: GameEventHandlers) => {
  createAndAddEvent(
    eventHandlers,
    state.euchreSettings.debugLogDebugEvents,
    'i',
    state.euchreGame.dealer,
    `Dealer picked up: ${SUB_CARD}`,
    [state.euchreGame.trump],
    getTeamColor(state.euchreGame.dealer, state.euchreSettings)
  );
};

const addDiscardEvent = (discard: Card, state: EuchreGameValues, eventHandlers: GameEventHandlers) => {
  createAndAddEvent(
    eventHandlers,
    state.euchreSettings.debugLogDebugEvents,
    'd',
    state.euchreGame.dealer,
    `${EVENT_TYPE} - Dealer discarded: ${SUB_CARD}`,
    [discard],
    getTeamColor(state.euchreGame.dealer, state.euchreSettings)
  );
};

export { addTrumpOrderedEvent, addDiscardEvent, addDealerPickedUpEvent };
