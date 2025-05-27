import { GameEventHandlers } from '../../hooks/common/useEventLog';
import { EuchreGameValues } from '../../definitions/game-state-definitions';

const addIntroEvent = (state: EuchreGameValues, eventHandlers: GameEventHandlers) => {
  eventHandlers.addEvent(eventHandlers.createEvent('v', undefined, 'Game started.'));
};

export { addIntroEvent };
