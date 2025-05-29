import { useCallback, useMemo, useReducer, useState } from 'react';

import useGameSettings from '../../../../features/euchre/state/useGameSettings';
import {
  EuchreFlowActionType,
  EuchreGameFlow,
  gameFlowStateReducer,
  INIT_GAME_FLOW_STATE
} from '../../../../features/euchre/state/reducers/gameFlowReducer';
import {
  EuchreAnimationActionType,
  gameAnimationFlowReducer,
  INIT_GAME_ANIMATION_STATE
} from '../../../../features/euchre/state/reducers/gameAnimationFlowReducer';
import {
  EuchrePauseActionType,
  gamePauseFlowReducer,
  INIT_PAUSE_STATE
} from '../../../../features/euchre/state/reducers/gamePauseReducer';
import {
  INIT_PLAYER_NOTIFICATION,
  playerNotificationReducer
} from '../../../../features/euchre/state/reducers/playerNotificationReducer';
import { createDefaultEuchreGame } from '../../../../features/euchre/util/game/gameSetupLogicUtil';
import { PromptType, Card, BidResult } from '../../../../features/euchre/definitions/definitions';
import {
  EuchreGameInstance,
  EuchreGameState,
  EuchreGameValues,
  EuchreGameSetters,
  EuchreSettings
} from '../../../../features/euchre/definitions/game-state-definitions';
import { InitDealResult } from '../../../../features/euchre/definitions/logic-definitions';

const useEuchreGameState = () => {
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
  const [euchreDebug, setEuchreDebug] = useState<EuchreGameFlow | undefined>(undefined);
  const [promptValue, setPromptValue] = useState<PromptType[]>([PromptType.INTRO]);
  const [shouldCancelGame, setShouldCancelGame] = useState(false);
  const [shouldReplayHand, setShouldReplayHand] = useState(false);
  const [playedCard, setPlayedCard] = useState<Card | null>(null);
  const [dealResult, setDealResult] = useState<InitDealResult | null>(null);
  const [bidResult, setBidResult] = useState<BidResult | null>(null);
  const [playerNotification, dispatchPlayerNotification] = useReducer(playerNotificationReducer, {
    ...INIT_PLAYER_NOTIFICATION
  });

  const dispatchStateChange = useCallback(
    (
      gameAction?: EuchreGameFlow,
      gameAnimationAction?: EuchreAnimationActionType,
      gameWait?: EuchrePauseActionType
    ) => {
      if (gameAction) dispatchGameFlow({ type: EuchreFlowActionType.SET_GAME_FLOW, gameFlow: gameAction });
      if (gameAnimationAction) dispatchGameAnimationFlow({ type: gameAnimationAction });
      if (gameWait) dispatchPauseState({ type: gameWait });
    },
    []
  );

  const handleAddPromptValue = useCallback((value: PromptType) => {
    setPromptValue((prev) => [...prev, value]);
  }, []);

  const handleRemovePromptValue = useCallback((value: PromptType) => {
    setPromptValue((prev) => [...prev.filter((p) => p !== value)]);
  }, []);

  const handleClearPromptValues = useCallback(() => {
    setPromptValue([]);
  }, []);

  const handleReplacePromptValues = useCallback((values: PromptType[]) => {
    setPromptValue(values);
  }, []);

  const state: EuchreGameState = useMemo(() => {
    return {
      euchreGame: euchreGame,
      euchreReplayGame: euchreReplayGame,
      euchreGameFlow: gameFlow,
      euchreSettings: euchreSettings,
      euchrePauseState: euchrePauseState,
      euchreAnimationFlow: gameAnimationFlow,
      euchreDebug: euchreDebug
    };
  }, [
    euchreDebug,
    euchreGame,
    euchrePauseState,
    euchreReplayGame,
    euchreSettings,
    gameAnimationFlow,
    gameFlow
  ]);

  const stateValues: EuchreGameValues = useMemo(
    () => ({
      euchreGame: euchreGame,
      euchreReplayGame: euchreReplayGame,
      euchreGameFlow: gameFlow,
      euchreSettings: euchreSettings,
      euchrePauseState: euchrePauseState,
      euchreDebug: euchreDebug,
      playerNotification: playerNotification,
      euchreAnimationFlow: gameAnimationFlow,
      promptValues: promptValue,
      playedCard: playedCard,
      bidResult: bidResult,
      initDealer: dealResult,
      shouldCancel: shouldCancelGame,
      shouldReplayHand: shouldReplayHand
    }),
    [
      euchreGame,
      euchreReplayGame,
      gameFlow,
      euchreSettings,
      euchrePauseState,
      euchreDebug,
      playerNotification,
      gameAnimationFlow,
      promptValue,
      playedCard,
      bidResult,
      dealResult,
      shouldCancelGame,
      shouldReplayHand
    ]
  );

  const setters: EuchreGameSetters = useMemo(() => {
    const setters: EuchreGameSetters = {
      setEuchreGame: setEuchreGame,
      setEuchreReplayGame: setEuchreReplayGame,
      setEuchreDebug: setEuchreDebug,
      setPlayedCard: setPlayedCard,
      setBidResult: setBidResult,
      setInitialDealerResult: setDealResult,
      setShouldCancelGame: setShouldCancelGame,
      setShouldReplayHand: setShouldReplayHand,

      addPromptValue: handleAddPromptValue,
      removePromptValue: handleRemovePromptValue,
      clearPromptValues: handleClearPromptValues,
      replacePromptValues: handleReplacePromptValues,

      dispatchStateChange: dispatchStateChange,
      dispatchPlayerNotification: dispatchPlayerNotification,
      dispatchGameFlow: dispatchGameFlow,
      dispatchGameAnimationFlow: dispatchGameAnimationFlow,
      dispatchPause: () => dispatchPauseState({ type: EuchrePauseActionType.SET_GENERAL })
    };

    return setters;
  }, [
    dispatchStateChange,
    handleAddPromptValue,
    handleClearPromptValues,
    handleRemovePromptValue,
    handleReplacePromptValues
  ]);

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
