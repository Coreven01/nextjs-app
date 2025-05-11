import { GameEventHandlers } from '../../../hooks/euchre/useEventLog';
import { EuchreGameValues } from '../../../lib/euchre/definitions/game-state-definitions';

const addIntroEvent = (state: EuchreGameValues, eventHandlers: GameEventHandlers) => {
  eventHandlers.addEvent(eventHandlers.createEvent('v', undefined, 'Game started.'));
};

export { addIntroEvent };
