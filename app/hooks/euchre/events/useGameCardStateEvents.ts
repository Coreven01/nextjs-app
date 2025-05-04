import { useCallback } from 'react';
import { EuchreGameState, EuchrePlayer } from '../../../lib/euchre/definitions/game-state-definitions';
import usePlayerData from '../data/usePlayerData';
import { GameEventHandlers } from '../useEventLog';

const useGameCardStateEvents = (
  state: EuchreGameState,
  eventHandlers: GameEventHandlers,
  player: EuchrePlayer
) => {
  const { getTeamColor } = usePlayerData();
  const EVENT_TYPE = '[CARD STATE]';

  const addInitializeHandStateEvent = useCallback(() => {
    eventHandlers.addEvent(
      eventHandlers.createEvent(
        'd',
        player,
        `${EVENT_TYPE} - Initialize hand state for hand ID: ` + state.euchreGame.handId,
        undefined,
        getTeamColor(player, state.euchreSettings)
      )
    );
  }, [eventHandlers, getTeamColor, player, state.euchreGame.handId, state.euchreSettings]);

  const addInitializeCardStateEvent = useCallback(() => {
    eventHandlers.addEvent(
      eventHandlers.createEvent(
        'd',
        player,
        `${EVENT_TYPE} - Initialize card state.`,
        undefined,
        getTeamColor(player, state.euchreSettings)
      )
    );
  }, [eventHandlers, getTeamColor, player, state.euchreSettings]);

  const addInitializeCardRegroupEvent = useCallback(() => {
    eventHandlers.addEvent(
      eventHandlers.createEvent(
        'd',
        player,
        `${EVENT_TYPE} - Initialize regroup player cards.`,
        undefined,
        getTeamColor(player, state.euchreSettings)
      )
    );
  }, [eventHandlers, getTeamColor, player, state.euchreSettings]);

  return {
    addInitializeHandStateEvent,
    addInitializeCardStateEvent,
    addInitializeCardRegroupEvent
  };
};

export default useGameCardStateEvents;
