import { EuchreGameValues } from '../../../lib/euchre/definitions/game-state-definitions';
import { GameEventHandlers } from '../useEventLog';

const useGameEventsInit = (state: EuchreGameValues, eventHandlers: GameEventHandlers) => {
  const addIntroEvent = () => {
    eventHandlers.addEvent(eventHandlers.createEvent('v', undefined, 'Game started.'));
  };

  return { addIntroEvent };
};

export default useGameEventsInit;
