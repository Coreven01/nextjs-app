import { useCallback, useMemo, useState } from 'react';

import { GameEventHandlers } from './useEventLog';

import { EuchreGameFlow } from './reducers/gameFlowReducer';
import { NotificationAction, NotificationActionType } from './reducers/playerNotificationReducer';
import GamePlayIndicator from '../../../features/euchre/components/game/game-play-indicator';
import useEuchreGameAuto from './gameplay/useEuchreGameAuto';
import { EuchreAnimationActionType } from './reducers/gameAnimationFlowReducer';
import { EuchrePauseActionType } from './reducers/gamePauseReducer';
import { createDefaultEuchreGame } from '../../../features/euchre/util/game/gameSetupLogicUtil';
import { GameSpeed, PromptType } from '../../../features/euchre/definitions/definitions';
import {
  EuchreGameValues,
  EuchreGamePlayHandlers,
  EuchreGameSetters,
  ErrorHandlers,
  EuchreGameInstance,
  EuchreDebugHandlers
} from '../../../features/euchre/definitions/game-state-definitions';

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
    (type: NotificationActionType, speed: GameSpeed, location: 'center' | 'middle' | 'outer') => {
      const newAction: NotificationAction = {
        type: type,
        payload: undefined
      };

      newAction.payload = (
        <GamePlayIndicator playerLocation={type} relativeLocation={location} notificationSpeed={speed} />
      );

      return newAction;
    },
    []
  );

  /** */
  const fullStateReset = useCallback(() => {
    setFullGameInstance(null);
    setters.setBidResult(null);
    setters.setPlayedCard(null);
    setters.setEuchreDebug(undefined);
    setters.setEuchreReplayGame(null);
    setters.setInitialDealerResult(null);
    setters.dispatchPlayerNotification({ type: NotificationActionType.RESET });
    setters.dispatchStateChange(
      EuchreGameFlow.BEGIN_INTRO,
      EuchreAnimationActionType.SET_NONE,
      EuchrePauseActionType.SET_NONE
    );
    setters.setShouldCancelGame(false);
  }, [setters]);

  /** */
  const handleStartGameForDebug = useCallback(() => {
    fullStateReset();
    setters.setEuchreGame(createDefaultEuchreGame());
    setters.replacePromptValues([PromptType.DEBUG]);
  }, [fullStateReset, setters]);

  /** */
  const handleCloseDebugGame = useCallback(() => {
    fullStateReset();
    errorHandlers.onCancel();
    setters.setEuchreGame(createDefaultEuchreGame());
    setters.replacePromptValues([PromptType.INTRO]);
    errorHandlers.onResetError();
    errorHandlers.onCancel();
  }, [errorHandlers, fullStateReset, setters]);

  /** */
  const handleRunInitDeal = useCallback(() => {
    fullStateReset();
    setters.setEuchreDebug(EuchreGameFlow.BEGIN_DEAL_CARDS);
    gameHandlers.onBeginNewGame();
  }, [fullStateReset, gameHandlers, setters]);

  /** */
  const handleRunInitAndShuffleGame = useCallback(() => {
    fullStateReset();
    setters.setEuchreDebug(EuchreGameFlow.BEGIN_BID_FOR_TRUMP);
    gameHandlers.onBeginNewGame();
  }, [fullStateReset, gameHandlers, setters]);

  /** */
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

  /** */
  const handleRunFullGameLoop = useCallback(() => {
    fullStateReset();
    setFullGameInstance(runFullGameLoop(10, state.euchreSettings));
  }, [fullStateReset, runFullGameLoop, state.euchreSettings]);

  const handleClearDebugGame = useCallback(() => {
    fullStateReset();
  }, [fullStateReset]);

  /** */
  const handleRunTrickNotification = useCallback(async () => {
    console.log('game speed: ', state.euchreSettings.notificationSpeed);
    const types: NotificationActionType[] = [
      NotificationActionType.TOP,
      NotificationActionType.BOTTOM,
      NotificationActionType.LEFT,
      NotificationActionType.RIGHT,
      NotificationActionType.CENTER
    ];
    const locations: ('center' | 'middle' | 'outer')[] = ['center', 'middle', 'outer'];

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
