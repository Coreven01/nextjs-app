import { EuchreGameValues, EuchrePlayer } from '../../../lib/euchre/definitions/game-state-definitions';
import usePlayerData from '../data/usePlayerData';
import { GameEventHandlers } from '../useEventLog';

const useGameEventsInitDeal = (state: EuchreGameValues, eventHandlers: GameEventHandlers) => {
  const { getTeamColor } = usePlayerData();

  const addInitialDealEvent = () => {
    eventHandlers.addEvent(
      eventHandlers.createEvent('v', undefined, 'Begin deal cards to determine initial dealer.')
    );
  };

  const addInitialDealerSetEvent = (dealer: EuchrePlayer) => {
    eventHandlers.addEvent(
      eventHandlers.createEvent(
        'i',
        dealer,
        'Set as initial dealer.',
        undefined,
        getTeamColor(dealer, state.euchreSettings)
      )
    );
  };

  return { addInitialDealEvent, addInitialDealerSetEvent };
};

export default useGameEventsInitDeal;
