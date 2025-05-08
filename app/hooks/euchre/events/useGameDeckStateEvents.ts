import { useCallback } from 'react';
import { EuchreGameState } from '../../../lib/euchre/definitions/game-state-definitions';
import { GameEventHandlers } from '../useEventLog';

const useGameDeckStateEvents = (state: EuchreGameState, eventHandlers: GameEventHandlers) => {
  const { euchreGame, euchreSettings } = state;
  const { addEvent, createEvent } = eventHandlers;

  const EVENT_TYPE = '[DECK STATE]';
  const enableDebugLog = euchreSettings.debugEnableDebugMenu;

  const addResetForDealerEvent = useCallback(() => {
    if (!enableDebugLog) return;

    addEvent(
      createEvent(
        'd',
        undefined,
        `${EVENT_TYPE} - Begin game deck state reset for hand ID: ` + euchreGame.handId
      )
    );
  }, [addEvent, createEvent, enableDebugLog, euchreGame.handId]);

  const addAnimateForBeginDealForDealerEvent = useCallback(
    (begin: boolean, skipped: boolean) => {
      if (!enableDebugLog) return;

      addEvent(
        createEvent(
          'd',
          undefined,
          `${EVENT_TYPE} - ${begin ? 'Begin' : 'End'} animation${skipped ? ' SKIPPED ' : ' '}for begin deal for dealer.`
        )
      );
    },
    [addEvent, createEvent, enableDebugLog]
  );

  const addAnimateForEndDealForDealerEvent = useCallback(
    (begin: boolean, skipped: boolean) => {
      if (!enableDebugLog) return;

      addEvent(
        createEvent(
          'd',
          undefined,
          `${EVENT_TYPE} - ${begin ? 'Begin' : 'End'} animation${skipped ? ' SKIPPED ' : ' '}for end deal for dealer.`
        )
      );
    },
    [addEvent, createEvent, enableDebugLog]
  );

  const addAnimateForDealForRegularPlayEvent = useCallback(
    (begin: boolean, skipped: boolean) => {
      if (!enableDebugLog) return;

      addEvent(
        createEvent(
          'd',
          undefined,
          `${EVENT_TYPE} - ${begin ? 'Begin' : 'End'} animation${skipped ? ' SKIPPED ' : ' '}for begin deal for dealer.`
        )
      );
    },
    [addEvent, createEvent, enableDebugLog]
  );

  return {
    addResetForDealerEvent,
    addAnimateForBeginDealForDealerEvent,
    addAnimateForEndDealForDealerEvent,
    addAnimateForDealForRegularPlayEvent
  };
};

export default useGameDeckStateEvents;
