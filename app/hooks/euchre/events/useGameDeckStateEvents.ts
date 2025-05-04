import { useCallback } from 'react';
import { EuchreGameState } from '../../../lib/euchre/definitions/game-state-definitions';
import { GameEventHandlers } from '../useEventLog';

const useGameDeckStateEvents = (state: EuchreGameState, eventHandlers: GameEventHandlers) => {
  const EVENT_TYPE = '[DECK STATE]';

  const addResetForDealerEvent = useCallback(() => {
    eventHandlers.addEvent(
      eventHandlers.createEvent(
        'd',
        undefined,
        `${EVENT_TYPE} - Begin game deck state reset for hand ID: ` + state.euchreGame.handId
      )
    );
  }, [eventHandlers, state.euchreGame.handId]);

  const addAnimateForBeginDealForDealerEvent = useCallback(
    (begin: boolean) => {
      eventHandlers.addEvent(
        eventHandlers.createEvent(
          'd',
          undefined,
          `${EVENT_TYPE} - ${begin ? 'Begin' : 'End'} animation for begin deal for dealer.`
        )
      );
    },
    [eventHandlers]
  );

  const addAnimateForEndDealForDealerEvent = useCallback(
    (begin: boolean) => {
      eventHandlers.addEvent(
        eventHandlers.createEvent(
          'd',
          undefined,
          `${EVENT_TYPE} - ${begin ? 'Begin' : 'End'} animation for end deal for dealer.`
        )
      );
    },
    [eventHandlers]
  );

  const addAnimateForBeginDealForRegularPlay = useCallback(
    (begin: boolean) => {
      eventHandlers.addEvent(
        eventHandlers.createEvent(
          'd',
          undefined,
          `${EVENT_TYPE} - ${begin ? 'Begin' : 'End'} animation for begin deal for dealer.`
        )
      );
    },
    [eventHandlers]
  );

  return {
    addResetForDealerEvent,
    addAnimateForBeginDealForDealerEvent,
    addAnimateForEndDealForDealerEvent,
    addAnimateForBeginDealForRegularPlay
  };
};

export default useGameDeckStateEvents;
