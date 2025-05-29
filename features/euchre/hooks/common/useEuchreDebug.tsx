import { useCallback, useMemo, useState } from 'react';
import { GameEventHandlers } from './useEventLog';
import { EuchreGameFlow } from '../../state/reducers/gameFlowReducer';
import { NotificationAction, NotificationActionType } from '../../state/reducers/playerNotificationReducer';
import GamePlayIndicator from '../../components/game/game-play-indicator';
import useEuchreGameAuto from '../game/useEuchreGameAuto';
import { EuchreAnimationActionType } from '../../state/reducers/gameAnimationFlowReducer';
import { EuchrePauseActionType } from '../../state/reducers/gamePauseReducer';
import { createDefaultEuchreGame, createEuchreGame } from '../../util/game/gameSetupLogicUtil';
import { GameSpeed, PromptType } from '../../definitions/definitions';
import {
  EuchreGameValues,
  EuchreGamePlayHandlers,
  EuchreGameSetters,
  ErrorHandlers,
  EuchreGameInstance,
  EuchreDebugHandlers
} from '../../definitions/game-state-definitions';
import { createLonerHandResult } from '../../util/game/gameDebugUtil';
import { createShuffledDeck } from '../../util/game/cardDataUtil';
import { isGameOver } from '../../util/game/gameDataUtil';

const useEuchreDebug = (
  state: EuchreGameValues,
  gameHandlers: EuchreGamePlayHandlers,
  setters: EuchreGameSetters,
  eventHandlers: GameEventHandlers,
  errorHandlers: ErrorHandlers
) => {
  const { runFullGame, runFullGameLoop } = useEuchreGameAuto(errorHandlers);
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
    const gameOver = isGameOver(game, 10);

    if (gameOver) {
      setters.setEuchreDebug(undefined);
      setters.setEuchreGame(game);
      setters.dispatchStateChange(
        EuchreGameFlow.TRICK_FINISHED,
        EuchreAnimationActionType.SET_ANIMATE,
        EuchrePauseActionType.SET_NONE
      );
    }
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

  const handleRunPlayerLonerCalled = useCallback(() => {
    const game = createEuchreGame(state.euchreSettings);
    game.deck = createShuffledDeck(1);
    const handResult = createLonerHandResult(game);
    game.handResults.push(handResult);
    setters.setEuchreGame(game);
    gameHandlers.onReplayHand();
  }, [gameHandlers, setters, state.euchreSettings]);

  const debugHandlers: EuchreDebugHandlers = useMemo(
    () => ({
      onRunInitAndShuffleGame: handleRunInitAndShuffleGame,
      onRunInitGame: handleRunInitDeal,
      onRunTrickNotification: handleRunTrickNotification,
      onRunFullGame: handleRunFullGame,
      onRunFullGameLoop: handleRunFullGameLoop,
      onRunLonerGame: handleRunPlayerLonerCalled,
      onClearDebugGame: handleClearDebugGame
    }),
    [
      handleClearDebugGame,
      handleRunFullGame,
      handleRunFullGameLoop,
      handleRunInitAndShuffleGame,
      handleRunInitDeal,
      handleRunPlayerLonerCalled,
      handleRunTrickNotification
    ]
  );

  return { fullGameInstance, handleStartGameForDebug, handleCloseDebugGame, debugHandlers };
};

export default useEuchreDebug;
