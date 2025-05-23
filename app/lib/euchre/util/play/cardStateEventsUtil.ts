// import { GameEventHandlers } from '../../../../app/hooks/euchre/useEventLog';
// import { EuchreGameState, EuchrePlayer } from '../../definitions/game-state-definitions';

// import { getTeamColor } from '../../../../app/lib/euchre/util/playerDataUtil';
// import { createAndAddEvent } from '../../../../app/lib/euchre/util/util';

// const EVENT_TYPE = '[CARD STATE]';

// const addInitializeHandStateEvent = (
//   state: EuchreGameState,
//   eventHandlers: GameEventHandlers,
//   player: EuchrePlayer
// ) => {
//   createAndAddEvent(
//     eventHandlers,
//     state.euchreSettings.debugLogDebugEvents,
//     'd',
//     player,
//     `${EVENT_TYPE} - Initialize hand state for hand ID: ` + state.euchreGame.handId,
//     undefined,
//     getTeamColor(player, state.euchreSettings)
//   );
// };

// const addInitializeCardStateEvent = (
//   state: EuchreGameState,
//   eventHandlers: GameEventHandlers,
//   player: EuchrePlayer
// ) => {
//   createAndAddEvent(
//     eventHandlers,
//     state.euchreSettings.debugLogDebugEvents,
//     'd',
//     player,
//     `${EVENT_TYPE} - Initialize card state.`,
//     undefined,
//     getTeamColor(player, state.euchreSettings)
//   );
// };

// const addInitializeCardRegroupEvent = (
//   state: EuchreGameState,
//   eventHandlers: GameEventHandlers,
//   player: EuchrePlayer
// ) => {
//   createAndAddEvent(
//     eventHandlers,
//     state.euchreSettings.debugLogDebugEvents,
//     'd',
//     player,
//     `${EVENT_TYPE} - Initialize regroup player cards.`,
//     undefined,
//     getTeamColor(player, state.euchreSettings)
//   );
// };

// export { addInitializeHandStateEvent, addInitializeCardStateEvent, addInitializeCardRegroupEvent };
