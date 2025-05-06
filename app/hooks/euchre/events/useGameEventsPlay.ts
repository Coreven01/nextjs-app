import { Card, EuchreHandResult } from '../../../lib/euchre/definitions/definitions';
import {
  EuchreCard,
  EuchreGameValues,
  EuchrePlayer
} from '../../../lib/euchre/definitions/game-state-definitions';
import usePlayerData from '../data/usePlayerData';
import { GameEventHandlers, SUB_CARD } from '../useEventLog';

const useGameEventsPlay = (state: EuchreGameValues, eventHandlers: GameEventHandlers) => {
  const { getTeamColor } = usePlayerData();
  const EVENT_TYPE = '[PLAY STATE]';
  const enableDebugLog = state.euchreSettings.debugEnableDebugMenu;

  const addPlayCardEvent = (begin: boolean) => {
    if (!enableDebugLog) return;

    eventHandlers.addEvent(
      eventHandlers.createEvent(
        'd',
        state.euchreGame.currentPlayer,
        `${EVENT_TYPE} - ${begin ? 'Begin' : 'End'} play card for regular play.`,
        undefined,
        getTeamColor(state.euchreGame.currentPlayer, state.euchreSettings)
      )
    );
  };

  const addCardPlayedEvent = (cardPlayed: EuchreCard) => {
    eventHandlers.addEvent(
      eventHandlers.createEvent(
        'i',
        cardPlayed.player,
        `Played card: ${SUB_CARD}.`,
        [cardPlayed.card],
        getTeamColor(cardPlayed.player, state.euchreSettings)
      )
    );
  };

  const addPlayerRenegedEvent = (player: EuchrePlayer, card: Card) => {
    eventHandlers.addEvent(
      eventHandlers.createEvent(
        'i',
        player,
        `Player reneged with ${SUB_CARD}.`,
        [card],
        getTeamColor(player, state.euchreSettings)
      )
    );
  };

  const addTrickWonEvent = (player: EuchrePlayer, card: Card) => {
    eventHandlers.addEvent(
      eventHandlers.createEvent(
        'i',
        player,
        `Won the trick with ${SUB_CARD}.`,
        [card],
        getTeamColor(player, state.euchreSettings)
      )
    );
  };

  const addHandWonEvent = (handResult: EuchreHandResult) => {
    eventHandlers.addEvent(
      eventHandlers.createEvent(
        'i',
        undefined,
        `Hand won by team: ${handResult.teamWon} - Points: ${handResult.points}`,
        undefined,
        getTeamColor(
          handResult.teamWon === 1 ? state.euchreGame.player1 : state.euchreGame.player3,
          state.euchreSettings
        )
      )
    );
  };

  return {
    addPlayCardEvent,
    addCardPlayedEvent,
    addPlayerRenegedEvent,
    addTrickWonEvent,
    addHandWonEvent
  };
};

export default useGameEventsPlay;
