import { BidResult } from '../../../lib/euchre/definitions/definitions';
import { EuchreGameValues } from '../../../lib/euchre/definitions/game-state-definitions';
import usePlayerData from '../data/usePlayerData';
import { GameEventHandlers } from '../useEventLog';

const useGameEventsBid = (state: EuchreGameValues, eventHandlers: GameEventHandlers) => {
  const { getTeamColor } = usePlayerData();

  const addBeginBidForTrumpEvent = () => {
    eventHandlers.addEvent(
      eventHandlers.createEvent(
        'v',
        state.euchreGame.currentPlayer,
        'Begin bid For trump.',
        undefined,
        getTeamColor(state.euchreGame.currentPlayer, state.euchreSettings)
      )
    );
  };

  const addAnimateBeginBidForTrumpEvent = () => {
    eventHandlers.addEvent(
      eventHandlers.createEvent(
        'v',
        undefined,
        'Begin animation for bid for trump.',
        undefined,
        getTeamColor(state.euchreGame.currentPlayer, state.euchreSettings)
      )
    );
  };

  const addFinalizeBidForTrumpEvent = () => {
    eventHandlers.addEvent(
      eventHandlers.createEvent(
        'v',
        undefined,
        'Begin finalize bid for trump.',
        undefined,
        getTeamColor(state.euchreGame.currentPlayer, state.euchreSettings)
      )
    );
  };

  const addBeginPassDealEvent = () => {
    eventHandlers.addEvent(
      eventHandlers.createEvent(
        'i',
        state.euchreGame.dealer,
        'Deal was passed.',
        undefined,
        getTeamColor(state.euchreGame.dealer, state.euchreSettings)
      )
    );
  };

  const addPassBidEvent = () => {
    eventHandlers.addEvent(
      eventHandlers.createEvent(
        'i',
        state.euchreGame.currentPlayer,
        'Passed bid.',
        undefined,
        getTeamColor(state.euchreGame.currentPlayer, state.euchreSettings)
      )
    );
  };

  const addBidScoreEvent = (bidResult: BidResult) => {
    eventHandlers.addEvent(
      eventHandlers.createEvent(
        'd',
        state.euchreGame.currentPlayer,
        'Hand Score: ' + bidResult.handScore,
        undefined,
        getTeamColor(state.euchreGame.currentPlayer, state.euchreSettings)
      )
    );
  };

  const addHandleBidSelectionEvent = () => {
    eventHandlers.addEvent(
      eventHandlers.createEvent(
        'v',
        state.euchreGame.currentPlayer,
        'Handle bid selection.',
        undefined,
        getTeamColor(state.euchreGame.currentPlayer, state.euchreSettings)
      )
    );
  };

  return {
    addBeginBidForTrumpEvent,
    addAnimateBeginBidForTrumpEvent,
    addFinalizeBidForTrumpEvent,
    addBeginPassDealEvent,
    addPassBidEvent,
    addBidScoreEvent,
    addHandleBidSelectionEvent
  };
};

export default useGameEventsBid;
