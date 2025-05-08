import { useCallback, useMemo } from 'react';
import {
  ErrorHandlers,
  EuchreDebugHandlers,
  EuchreGamePlayHandlers,
  EuchreGameSetters,
  EuchreGameValues
} from '../../lib/euchre/definitions/game-state-definitions';
import { GameEventHandlers } from './useEventLog';
import { GameSpeed, PromptType, TableLocation } from '../../lib/euchre/definitions/definitions';
import useGameSetupLogic from './logic/useGameSetupLogic';
import { EuchreGameFlow } from './reducers/gameFlowReducer';
import { PlayerNotificationAction, PlayerNotificationActionType } from './reducers/playerNotificationReducer';
import GamePlayIndicator from '../../ui/euchre/game/game-play-indicator';
import useEuchreGameAuto from './gameplay/useEuchreGameAuto';
import { EuchreAnimationActionType } from './reducers/gameAnimationFlowReducer';
import { EuchrePauseActionType } from './reducers/gamePauseReducer';

const useEuchreDebug = (
  state: EuchreGameValues,
  gameHandlers: EuchreGamePlayHandlers,
  setters: EuchreGameSetters,
  eventHandlers: GameEventHandlers,
  errorHandlers: ErrorHandlers
) => {
  const { createDefaultEuchreGame } = useGameSetupLogic();
  const { runFullGame } = useEuchreGameAuto();

  const getNotification = useCallback(
    (type: PlayerNotificationActionType, speed: GameSpeed, location: TableLocation) => {
      const newAction: PlayerNotificationAction = {
        type: type,
        payload: undefined
      };

      newAction.payload = <GamePlayIndicator location={location} notificationSpeed={speed} />;

      return newAction;
    },
    []
  );

  const handleStartGameForDebug = useCallback(() => {
    setters.setEuchreGame(createDefaultEuchreGame());
    setters.replacePromptValues([PromptType.DEBUG]);
  }, [createDefaultEuchreGame, setters]);

  const handleCloseDebugGame = useCallback(() => {
    gameHandlers.handleCancelAndReset();
    setters.setEuchreGame(createDefaultEuchreGame());
    setters.replacePromptValues([PromptType.INTRO]);
    setters.setEuchreDebug(undefined);
  }, [createDefaultEuchreGame, gameHandlers, setters]);

  const handleRunInitDeal = useCallback(() => {
    setters.setEuchreDebug(EuchreGameFlow.BEGIN_DEAL_CARDS);
    gameHandlers.handleBeginNewGame();
  }, [gameHandlers, setters]);

  const handleRunInitAndShuffleGame = useCallback(() => {
    setters.setEuchreDebug(EuchreGameFlow.END_DEAL_CARDS);
    gameHandlers.handleBeginNewGame();
  }, [gameHandlers, setters]);

  const handleRunFullGame = useCallback(() => {
    const game = runFullGame(state.euchreSettings, 10);
    setters.setEuchreDebug(undefined);
    setters.setEuchreGame(game);
    setters.dispatchStateChange(
      EuchreGameFlow.TRICK_FINISHED,
      EuchreAnimationActionType.SET_ANIMATE,
      EuchrePauseActionType.SET_NONE
    );
  }, [runFullGame, setters, state.euchreSettings]);

  const handleRunTrickNotification = useCallback(async () => {
    console.log('game speed: ', state.euchreSettings.notificationSpeed);
    const types: PlayerNotificationActionType[] = [
      PlayerNotificationActionType.UPDATE_TOP,
      PlayerNotificationActionType.UPDATE_BOTTOM,
      PlayerNotificationActionType.UPDATE_LEFT,
      PlayerNotificationActionType.UPDATE_RIGHT,
      PlayerNotificationActionType.UPDATE_CENTER
    ];
    const locations: TableLocation[] = ['top', 'bottom', 'left', 'right'];

    for (let t = 0; t < types.length; t++) {
      for (let l = 0; l < locations.length; l++) {
        setters.dispatchPlayerNotification(getNotification(types[t], 1200, locations[l]));
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }
  }, [getNotification, setters, state.euchreSettings.notificationSpeed]);

  const debugHandlers: EuchreDebugHandlers = useMemo(
    () => ({
      handleRunInitAndShuffleGame,
      handleRunInitGame: handleRunInitDeal,
      handleRunTrickNotification,
      handleRunFullGame
    }),
    [handleRunFullGame, handleRunInitAndShuffleGame, handleRunInitDeal, handleRunTrickNotification]
  );

  return { handleStartGameForDebug, handleCloseDebugGame, debugHandlers };
};

export default useEuchreDebug;
