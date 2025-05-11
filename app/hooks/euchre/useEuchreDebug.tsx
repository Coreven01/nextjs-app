import { useCallback, useMemo, useState } from 'react';
import {
  ErrorHandlers,
  EuchreDebugHandlers,
  EuchreGameInstance,
  EuchreGamePlayHandlers,
  EuchreGameSetters,
  EuchreGameValues
} from '../../lib/euchre/definitions/game-state-definitions';
import { GameEventHandlers } from './useEventLog';
import { GameSpeed, PromptType, TableLocation } from '../../lib/euchre/definitions/definitions';
import { EuchreGameFlow } from './reducers/gameFlowReducer';
import { PlayerNotificationAction, PlayerNotificationActionType } from './reducers/playerNotificationReducer';
import GamePlayIndicator from '../../ui/euchre/game/game-play-indicator';
import useEuchreGameAuto from './gameplay/useEuchreGameAuto';
import { EuchreAnimationActionType } from './reducers/gameAnimationFlowReducer';
import { EuchrePauseActionType } from './reducers/gamePauseReducer';
import { createDefaultEuchreGame } from '../../lib/euchre/util/gameSetupLogicUtil';

const useEuchreDebug = (
  state: EuchreGameValues,
  gameHandlers: EuchreGamePlayHandlers,
  setters: EuchreGameSetters,
  eventHandlers: GameEventHandlers,
  errorHandlers: ErrorHandlers
) => {
  const { runFullGame, runFullGameLoop } = useEuchreGameAuto();
  const [fullGameInstance, setFullGameInstance] = useState<EuchreGameInstance | null>(null);

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

  const fullStateReset = useCallback(() => {
    setFullGameInstance(null);
    setters.setBidResult(null);
    setters.setPlayedCard(null);
    setters.setEuchreDebug(undefined);
    setters.setEuchreReplayGame(null);
    setters.setInitialDealerResult(null);
    setters.dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });
    setters.dispatchStateChange(
      EuchreGameFlow.BEGIN_INTRO,
      EuchreAnimationActionType.SET_NONE,
      EuchrePauseActionType.SET_NONE
    );
    setters.setShouldCancelGame(false);
  }, [setters]);

  const handleStartGameForDebug = useCallback(() => {
    fullStateReset();
    setters.setEuchreGame(createDefaultEuchreGame());
    setters.replacePromptValues([PromptType.DEBUG]);
  }, [fullStateReset, setters]);

  const handleCloseDebugGame = useCallback(() => {
    fullStateReset();
    errorHandlers.onCancel();
    setters.setEuchreGame(createDefaultEuchreGame());
    setters.replacePromptValues([PromptType.INTRO]);
    errorHandlers.onResetError();
    errorHandlers.onCancel();
  }, [errorHandlers, fullStateReset, setters]);

  const handleRunInitDeal = useCallback(() => {
    fullStateReset();
    setters.setEuchreDebug(EuchreGameFlow.BEGIN_DEAL_CARDS);
    gameHandlers.onBeginNewGame();
  }, [fullStateReset, gameHandlers, setters]);

  const handleRunInitAndShuffleGame = useCallback(() => {
    fullStateReset();
    setters.setEuchreDebug(EuchreGameFlow.END_DEAL_CARDS);
    gameHandlers.onBeginNewGame();
  }, [fullStateReset, gameHandlers, setters]);

  const handleRunFullGame = useCallback(() => {
    fullStateReset();
    const game = runFullGame(state.euchreSettings, 10);
    setters.setEuchreDebug(undefined);
    setters.setEuchreGame(game);
    setters.dispatchStateChange(
      EuchreGameFlow.TRICK_FINISHED,
      EuchreAnimationActionType.SET_ANIMATE,
      EuchrePauseActionType.SET_NONE
    );
  }, [fullStateReset, runFullGame, setters, state.euchreSettings]);

  const handleRunFullGameLoop = useCallback(() => {
    fullStateReset();
    setFullGameInstance(runFullGameLoop(10, state.euchreSettings));
  }, [fullStateReset, runFullGameLoop, state.euchreSettings]);

  const handleClearDebugGame = useCallback(() => {
    fullStateReset();
  }, [fullStateReset]);

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
      onRunInitAndShuffleGame: handleRunInitAndShuffleGame,
      onRunInitGame: handleRunInitDeal,
      onRunTrickNotification: handleRunTrickNotification,
      onRunFullGame: handleRunFullGame,
      onRunFullGameLoop: handleRunFullGameLoop,
      onClearDebugGame: handleClearDebugGame
    }),
    [
      handleClearDebugGame,
      handleRunFullGame,
      handleRunFullGameLoop,
      handleRunInitAndShuffleGame,
      handleRunInitDeal,
      handleRunTrickNotification
    ]
  );

  return { fullGameInstance, handleStartGameForDebug, handleCloseDebugGame, debugHandlers };
};

export default useEuchreDebug;
