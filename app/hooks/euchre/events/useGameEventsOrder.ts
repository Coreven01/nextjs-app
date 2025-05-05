import { BidResult, Card } from '../../../lib/euchre/definitions/definitions';
import { EuchreGameValues, EuchrePlayer } from '../../../lib/euchre/definitions/game-state-definitions';
import usePlayerData from '../data/usePlayerData';
import { GameEventHandlers, SUB_SUIT } from '../useEventLog';

const useGameEventsOrder = (state: EuchreGameValues, eventHandlers: GameEventHandlers) => {
  const { getTeamColor } = usePlayerData();

  const addTrumpOrderedEvent = (maker: EuchrePlayer, bidResult: BidResult) => {
    eventHandlers.addEvent(
      eventHandlers.createEvent(
        'i',
        maker ?? undefined,
        `Trump named: ${SUB_SUIT}. ${bidResult.loner ? ' Going alone.' : ''}`,
        [state.euchreGame.trump],
        maker ? getTeamColor(maker, state.euchreSettings) : undefined
      )
    );
  };

  const addDiscardEvent = (discard: Card) => {
    eventHandlers.addEvent(
      eventHandlers.createEvent(
        'd',
        state.euchreGame.dealer,
        `Dealer discarded: ${discard?.value}-${discard?.suit}`,
        undefined,
        getTeamColor(state.euchreGame.dealer, state.euchreSettings)
      )
    );
  };

  return { addTrumpOrderedEvent, addDiscardEvent };
};

export default useGameEventsOrder;
