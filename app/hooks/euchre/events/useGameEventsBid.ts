import { useCallback } from 'react';
import { BidResult } from '../../../lib/euchre/definitions/definitions';
import { EuchreGameValues } from '../../../lib/euchre/definitions/game-state-definitions';
import usePlayerData from '../data/usePlayerData';
import { GameEventHandlers } from '../useEventLog';

const useGameEventsBid = (state: EuchreGameValues, eventHandlers: GameEventHandlers) => {
  const { getTeamColor } = usePlayerData();
  const { euchreGame, euchreSettings } = state;
  const { addEvent, createEvent } = eventHandlers;

  const enableDebugLog = state.euchreSettings.debugEnableDebugMenu;
  const EVENT_TYPE = '[BID STATE]';

  const addBeginBidForTrumpEvent = useCallback(() => {
    addEvent(
      createEvent(
        'v',
        euchreGame.currentPlayer,
        'Begin bid For trump.',
        undefined,
        getTeamColor(euchreGame.currentPlayer, euchreSettings)
      )
    );
  }, [addEvent, createEvent, euchreGame.currentPlayer, euchreSettings, getTeamColor]);

  const addAnimateBidForTrumpEvent = useCallback(
    (begin: boolean) => {
      if (!enableDebugLog) return;

      addEvent(
        createEvent(
          'd',
          undefined,
          `${EVENT_TYPE} - ${begin ? 'Begin' : 'End'} animation for bid for trump.`,
          undefined,
          getTeamColor(euchreGame.currentPlayer, euchreSettings)
        )
      );
    },
    [addEvent, createEvent, enableDebugLog, euchreGame.currentPlayer, euchreSettings, getTeamColor]
  );

  const addFinalizeBidForTrumpEvent = useCallback(
    (begin: boolean) => {
      if (!enableDebugLog) return;

      addEvent(
        createEvent(
          'd',
          undefined,
          `${EVENT_TYPE} - ${begin ? 'Begin' : 'End'} finalize bid for trump.`,
          undefined,
          getTeamColor(euchreGame.currentPlayer, euchreSettings)
        )
      );
    },
    [addEvent, createEvent, enableDebugLog, euchreGame.currentPlayer, euchreSettings, getTeamColor]
  );

  const addBeginPassDealEvent = useCallback(() => {
    addEvent(
      createEvent(
        'i',
        euchreGame.dealer,
        'Deal was passed.',
        undefined,
        getTeamColor(euchreGame.dealer, euchreSettings)
      )
    );
  }, [addEvent, createEvent, euchreGame.dealer, euchreSettings, getTeamColor]);

  const addPassBidEvent = useCallback(() => {
    addEvent(
      createEvent(
        'i',
        euchreGame.currentPlayer,
        'Passed bid.',
        undefined,
        getTeamColor(euchreGame.currentPlayer, euchreSettings)
      )
    );
  }, [addEvent, createEvent, euchreGame.currentPlayer, euchreSettings, getTeamColor]);

  const addBidScoreEvent = useCallback(
    (bidResult: BidResult) => {
      if (!enableDebugLog) return;

      addEvent(
        createEvent(
          'd',
          euchreGame.currentPlayer,
          `${EVENT_TYPE} - Hand Score for bid for trump: ` + bidResult.handScore,
          undefined,
          getTeamColor(euchreGame.currentPlayer, euchreSettings)
        )
      );
    },
    [addEvent, createEvent, enableDebugLog, euchreGame.currentPlayer, euchreSettings, getTeamColor]
  );

  const addHandleBidSelectionEvent = useCallback(() => {
    if (!enableDebugLog) return;

    addEvent(
      createEvent(
        'd',
        euchreGame.currentPlayer,
        `${EVENT_TYPE} - Handle bid selection.`,
        undefined,
        getTeamColor(euchreGame.currentPlayer, euchreSettings)
      )
    );
  }, [addEvent, createEvent, enableDebugLog, euchreGame.currentPlayer, euchreSettings, getTeamColor]);

  return {
    addBeginBidForTrumpEvent,
    addAnimateBidForTrumpEvent,
    addFinalizeBidForTrumpEvent,
    addBeginPassDealEvent,
    addPassBidEvent,
    addBidScoreEvent,
    addHandleBidSelectionEvent
  };
};

export default useGameEventsBid;
