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
  const { euchreSettings, euchreGame } = state;
  const { addEvent, createEvent } = eventHandlers;

  const EVENT_TYPE = '[CARD STATE]';
  const enableDebugLog = euchreSettings.debugEnableDebugMenu;

  const addInitializeHandStateEvent = useCallback(() => {
    if (!enableDebugLog) return;

    addEvent(
      createEvent(
        'd',
        player,
        `${EVENT_TYPE} - Initialize hand state for hand ID: ` + euchreGame.handId,
        undefined,
        getTeamColor(player, euchreSettings)
      )
    );
  }, [addEvent, createEvent, enableDebugLog, euchreGame.handId, euchreSettings, getTeamColor, player]);

  const addInitializeCardStateEvent = useCallback(() => {
    if (!enableDebugLog) return;

    addEvent(
      createEvent(
        'd',
        player,
        `${EVENT_TYPE} - Initialize card state.`,
        undefined,
        getTeamColor(player, euchreSettings)
      )
    );
  }, [addEvent, createEvent, enableDebugLog, euchreSettings, getTeamColor, player]);

  const addInitializeCardRegroupEvent = useCallback(() => {
    if (!enableDebugLog) return;

    addEvent(
      createEvent(
        'd',
        player,
        `${EVENT_TYPE} - Initialize regroup player cards.`,
        undefined,
        getTeamColor(player, euchreSettings)
      )
    );
  }, [addEvent, createEvent, enableDebugLog, euchreSettings, getTeamColor, player]);

  return {
    addInitializeHandStateEvent,
    addInitializeCardStateEvent,
    addInitializeCardRegroupEvent
  };
};

export default useGameCardStateEvents;
