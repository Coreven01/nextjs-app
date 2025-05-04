import { useCallback, useMemo, useReducer, useState } from 'react';
import {
  EuchreGameInstance,
  EuchreGameSetters,
  EuchreGameState,
  EuchreGameValues,
  EuchreSettings
} from '../../../lib/euchre/definitions/game-state-definitions';
import useGameSetupLogic from '../logic/useGameSetupLogic';
import useGameSettings from '../data/useGameSettings';
import {
  EuchreFlowActionType,
  EuchreGameFlow,
  gameFlowStateReducer,
  INIT_GAME_FLOW_STATE
} from '../reducers/gameFlowReducer';
import {
  EuchreAnimationActionType,
  gameAnimationFlowReducer,
  INIT_GAME_ANIMATION_STATE
} from '../reducers/gameAnimationFlowReducer';
import { EuchrePauseActionType, gamePauseFlowReducer, INIT_PAUSE_STATE } from '../reducers/gamePauseReducer';
import { BidResult, Card, PromptType, PromptValue } from '../../../lib/euchre/definitions/definitions';
import { InitDealResult } from '../../../lib/euchre/definitions/logic-definitions';
import { INIT_PLAYER_NOTIFICATION, playerNotificationReducer } from '../reducers/playerNotificationReducer';

const useEuchreGameState = () => {
  const { createDefaultEuchreGame } = useGameSetupLogic();
  const [euchreGame, setEuchreGame] = useState<EuchreGameInstance>(createDefaultEuchreGame());
  const { euchreSettings, saveSettings } = useGameSettings();
  const [euchreReplayGame, setEuchreReplayGame] = useState<EuchreGameInstance | null>(null);
  const [gameFlow, dispatchGameFlow] = useReducer(gameFlowStateReducer, { ...INIT_GAME_FLOW_STATE });
  const [gameAnimationFlow, dispatchGameAnimationFlow] = useReducer(gameAnimationFlowReducer, {
    ...INIT_GAME_ANIMATION_STATE
  });
  const [euchrePauseState, dispatchPauseState] = useReducer(gamePauseFlowReducer, {
    ...INIT_PAUSE_STATE
  });
  const [promptValue, setPromptValue] = useState<PromptValue[]>([{ type: PromptType.INTRO }]);
  const [shouldCancelGame, setShouldCancelGame] = useState(false);
  const [playedCard, setPlayedCard] = useState<Card | null>(null);
  const [dealResult, setDealResult] = useState<InitDealResult | null>(null);
  const [bidResult, setBidResult] = useState<BidResult | null>(null);
  const [playerNotification, dispatchPlayerNotification] = useReducer(playerNotificationReducer, {
    ...INIT_PLAYER_NOTIFICATION
  });

  const dispatchStateChange = (
    gameAction?: EuchreGameFlow,
    gameAnimationAction?: EuchreAnimationActionType,
    gameWait?: EuchrePauseActionType
  ) => {
    if (gameAction) dispatchGameFlow({ type: EuchreFlowActionType.SET_GAME_FLOW, gameFlow: gameAction });
    if (gameAnimationAction) dispatchGameAnimationFlow({ type: gameAnimationAction });
    if (gameWait) dispatchPauseState({ type: gameWait });
  };

  const state: EuchreGameState = useMemo(() => {
    return {
      euchreGame: euchreGame,
      euchreReplayGame: euchreReplayGame,
      euchreGameFlow: gameFlow,
      euchreSettings: euchreSettings,
      euchrePauseState: euchrePauseState,
      euchreAnimationFlow: gameAnimationFlow
    };
  }, [euchreGame, euchrePauseState, euchreReplayGame, euchreSettings, gameAnimationFlow, gameFlow]);

  const stateValues: EuchreGameValues = useMemo(
    () => ({
      euchreGame: euchreGame,
      euchreReplayGame: euchreReplayGame,
      euchreGameFlow: gameFlow,
      euchreSettings: euchreSettings,
      euchrePauseState: euchrePauseState,
      playerNotification: playerNotification,
      euchreAnimationFlow: gameAnimationFlow,
      promptValue: promptValue,
      playedCard: playedCard,
      bidResult: bidResult,
      initDealer: dealResult,
      shouldCancel: shouldCancelGame
    }),
    [
      bidResult,
      dealResult,
      euchreGame,
      euchrePauseState,
      euchreReplayGame,
      euchreSettings,
      gameAnimationFlow,
      gameFlow,
      playedCard,
      playerNotification,
      promptValue,
      shouldCancelGame
    ]
  );

  const setters: EuchreGameSetters = useMemo(
    () => ({
      setEuchreGame: setEuchreGame,
      setEuchreReplayGame: setEuchreReplayGame,
      setPromptValue: setPromptValue,
      setPlayedCard: setPlayedCard,
      setBidResult: setBidResult,
      setInitialDealerResult: setDealResult,
      setShouldCancelGame: setShouldCancelGame,
      dispatchStateChange: dispatchStateChange,
      dispatchPlayerNotification: dispatchPlayerNotification,
      dispatchGameFlow: dispatchGameFlow,
      dispatchGameAnimationFlow: dispatchGameAnimationFlow,
      dispatchPause: () => dispatchPauseState({ type: EuchrePauseActionType.SET_GENERAL })
    }),
    []
  );

  const handleSaveSettings = useCallback(
    (settings: EuchreSettings) => {
      saveSettings(settings);
    },
    [saveSettings]
  );

  return {
    state,
    stateValues,
    setters,
    handleSaveSettings
  };
};

export default useEuchreGameState;
