import { BidResult, Card } from '../../../lib/euchre/definitions/definitions';
import { EuchreGameValues, EuchrePlayer } from '../../../lib/euchre/definitions/game-state-definitions';
import usePlayerData from '../data/usePlayerData';
import { GameEventHandlers, SUB_CARD, SUB_SUIT } from '../useEventLog';

const useGameEventsOrder = (state: EuchreGameValues, eventHandlers: GameEventHandlers) => {
  const { getTeamColor } = usePlayerData();
  const EVENT_TYPE = '[ORDER STATE]';
  const enableDebugLog = state.euchreSettings.debugEnableDebugMenu;

  const addTrumpOrderedEvent = (maker: EuchrePlayer, bidResult: BidResult) => {
    eventHandlers.addEvent(
      eventHandlers.createEvent(
        'i',
        maker ?? undefined,
        `Trump named: ${SUB_SUIT}. ${bidResult.loner ? ' Going alone.' : ''}`,
        [{ value: '2', suit: bidResult.calledSuit ?? state.euchreGame.trump.suit, index: 0 }],
        maker ? getTeamColor(maker, state.euchreSettings) : undefined
      )
    );
  };

  const addDealerPickedUpEvent = (card: Card) => {
    eventHandlers.addEvent(
      eventHandlers.createEvent(
        'i',
        state.euchreGame.dealer,
        `Dealer picked up: ${SUB_CARD}`,
        [state.euchreGame.trump],
        getTeamColor(state.euchreGame.dealer, state.euchreSettings)
      )
    );
  };

  const addDiscardEvent = (discard: Card) => {
    if (!enableDebugLog) return;

    eventHandlers.addEvent(
      eventHandlers.createEvent(
        'd',
        state.euchreGame.dealer,
        `${EVENT_TYPE} - Dealer discarded: ${SUB_CARD}`,
        [discard],
        getTeamColor(state.euchreGame.dealer, state.euchreSettings)
      )
    );
  };

  return { addTrumpOrderedEvent, addDiscardEvent, addDealerPickedUpEvent };
};

export default useGameEventsOrder;
