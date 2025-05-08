import { EuchreGameValues } from '../../../lib/euchre/definitions/game-state-definitions';
import usePlayerData from '../data/usePlayerData';
import { GameEventHandlers, SUB_CARD } from '../useEventLog';

const useGameEventsShuffle = (state: EuchreGameValues, eventHandlers: GameEventHandlers) => {
  const { getTeamColor } = usePlayerData();
  const EVENT_TYPE = '[SHUFFLE STATE]';
  const enableDebugLog = state.euchreSettings.debugEnableDebugMenu;

  const addSkipDealAnimationEvent = () => {
    eventHandlers.addEvent(
      eventHandlers.createEvent(
        'v',
        state.euchreGame.dealer,
        'Begin shuffle and deal for regular play.',
        undefined,
        getTeamColor(state.euchreGame.dealer, state.euchreSettings)
      )
    );
  };

  const addBeginShuffleEvent = () => {
    eventHandlers.addEvent(
      eventHandlers.createEvent(
        'v',
        state.euchreGame.dealer,
        'Begin shuffle and deal for regular play.',
        undefined,
        getTeamColor(state.euchreGame.dealer, state.euchreSettings)
      )
    );
  };

  const addTrumpCardFlippedEvent = () => {
    eventHandlers.addEvent(
      eventHandlers.createEvent(
        'i',
        state.euchreGame.dealer,
        `Flipped up ${SUB_CARD} for bidding.`,
        [state.euchreGame.trump],
        getTeamColor(state.euchreGame.dealer, state.euchreSettings)
      )
    );
  };

  return { addSkipDealAnimationEvent, addBeginShuffleEvent, addTrumpCardFlippedEvent };
};

export default useGameEventsShuffle;
