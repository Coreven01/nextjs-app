import { GameEventHandlers, SUB_CARD } from '../../../hooks/common/useEventLog';

import { createAndAddEvent } from '../../util';
import { Card, EuchreHandResult } from '../../../definitions/definitions';
import { EuchreGameValues, EuchreCard, EuchrePlayer } from '../../../definitions/game-state-definitions';
import { getTeamColor } from '../playerDataUtil';

const EVENT_TYPE = '[PLAY STATE]';

const addPlayCardEvent = (begin: boolean, state: EuchreGameValues, eventHandlers: GameEventHandlers) => {
  createAndAddEvent(
    eventHandlers,
    state.euchreSettings.debugLogDebugEvents,
    begin ? 'v' : 'd',
    state.euchreGame.currentPlayer,
    `${begin ? `Begin` : `${[EVENT_TYPE]} - End`} play card for regular play.`,
    undefined,
    getTeamColor(state.euchreGame.currentPlayer, state.euchreSettings)
  );
};

const addCardPlayedEvent = (
  cardPlayed: EuchreCard,
  state: EuchreGameValues,
  eventHandlers: GameEventHandlers
) => {
  createAndAddEvent(
    eventHandlers,
    state.euchreSettings.debugLogDebugEvents,
    'i',
    cardPlayed.player,
    `Played card: ${SUB_CARD}.`,
    [cardPlayed.card],
    getTeamColor(cardPlayed.player, state.euchreSettings)
  );
};

const addPlayerRenegedEvent = (
  player: EuchrePlayer,
  card: Card,
  state: EuchreGameValues,
  eventHandlers: GameEventHandlers
) => {
  createAndAddEvent(
    eventHandlers,
    state.euchreSettings.debugLogDebugEvents,
    'i',
    player,
    `Player reneged with ${SUB_CARD}.`,
    [card],
    getTeamColor(player, state.euchreSettings)
  );
};

const addTrickWonEvent = (
  player: EuchrePlayer,
  card: Card,
  state: EuchreGameValues,
  eventHandlers: GameEventHandlers
) => {
  createAndAddEvent(
    eventHandlers,
    state.euchreSettings.debugLogDebugEvents,
    'i',
    player,
    `Won the trick with ${SUB_CARD}.`,
    [card],
    getTeamColor(player, state.euchreSettings)
  );
};

const addHandWonEvent = (
  handResult: EuchreHandResult,
  state: EuchreGameValues,
  eventHandlers: GameEventHandlers
) => {
  createAndAddEvent(
    eventHandlers,
    state.euchreSettings.debugLogDebugEvents,
    'i',
    undefined,
    `Hand won by team: ${handResult.teamWon} - Points: ${handResult.points}`,
    undefined,
    getTeamColor(
      handResult.teamWon === 1 ? state.euchreGame.player1 : state.euchreGame.player3,
      state.euchreSettings
    )
  );
};

export { addPlayCardEvent, addCardPlayedEvent, addPlayerRenegedEvent, addTrickWonEvent, addHandWonEvent };
