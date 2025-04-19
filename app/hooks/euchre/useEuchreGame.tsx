import { ActionDispatch, Dispatch, SetStateAction, useCallback, useMemo, useReducer, useState } from 'react';
import {
  initialPlayerNotification,
  PlayerNotificationAction,
  PlayerNotificationActionType,
  playerNotificationReducer,
  PlayerNotificationState
} from './reducers/playerNotificationReducer';
import {
  EuchreGameFlow,
  EuchreFlowActionType,
  EuchreGameFlowState,
  gameFlowStateReducer,
  INIT_GAME_FLOW_STATE,
  GameFlowAction
} from './reducers/gameFlowReducer';
import {
  EuchreAnimationActionType,
  gameAnimationFlowReducer,
  initialGameAnimationState,
  EuchreAnimationState,
  EuchreAnimationAction
} from './reducers/gameAnimationFlowReducer';
import {
  BidResult,
  Card,
  EuchreGameInstance,
  EuchreSettings,
  INIT_GAME_SETTINGS,
  PromptType,
  PromptValue
} from '@/app/lib/euchre/definitions';
import { GameEvent, useEventLog } from './useEventLog';
import useEuchreGameInit from './useEuchreGameInit';
import useEuchreGameInitDeal from './useEuchreGameInitDeal';
import useEuchreGameShuffle from './useEuchreGameShuffle';
import useEuchreGameBid from './useEuchreGameBid';
import useEuchreGameOrder from './useEuchreGameOrder';
import useEuchreGamePlay from './useEuchreGamePlay';
import useGameData from './data/useGameData';
import useGamePlayLogic from './logic/useGamePlayLogic';
import useGameSetupLogic from './logic/useGameSetupLogic';

export type EuchreGameState = {
  euchreGame: EuchreGameInstance;
  euchreReplayGame: EuchreGameInstance | null;
  euchreGameFlow: EuchreGameFlowState;
  euchreSettings: EuchreSettings;
  playedCard: Card | null;
  bidResult: BidResult | null;
  playerNotification: PlayerNotificationState;
  euchreAnimationFlow: EuchreAnimationState;
  prompValue: PromptValue[];
  shouldCancel: boolean;
  setEuchreGame: Dispatch<SetStateAction<EuchreGameInstance>>;
  setEuchreSettings: Dispatch<SetStateAction<EuchreSettings>>;
  setPromptValue: Dispatch<SetStateAction<PromptValue[]>>;
  setPlayedCard: Dispatch<SetStateAction<Card | null>>;
  setBidResult: Dispatch<SetStateAction<BidResult | null>>;
  setShouldCancel: Dispatch<SetStateAction<boolean>>;
  dispatchPlayerNotification: ActionDispatch<[action: PlayerNotificationAction]>;
  dispatchGameFlow: ActionDispatch<[action: GameFlowAction]>;
  dispatchGameAnimationFlow: ActionDispatch<[action: EuchreAnimationAction]>;
  onCancel: () => void;
  addEvent: (e: GameEvent) => void;
};

export type EuchreErrorState = {
  errorState: EuchreError | null;
  setErrorState: Dispatch<SetStateAction<EuchreError | null>>;
};

export type EuchreError = {
  time: Date;
  id: string;
  message: string;
  gameFlow: EuchreGameFlow;
  animationType: EuchreAnimationActionType;
};

const getInitPlayerName = () => {
  const names = ['Joe', 'Jim', 'Jack', 'Jane', 'Joan', 'Jean'];
  const index = Math.round(Math.random() * (names.length - 1));

  return names[index];
};

export default function useEuchreGame() {
  //#region Hooks to control game flow *************************************************************************
  const { createDefaultEuchreGame } = useGameSetupLogic();
  const [promptValue, setPromptValue] = useState<PromptValue[]>([{ type: PromptType.INTRO }]);
  const [shouldCancelGame, setCancelGame] = useState(false);
  const [euchreReplayGame, setEuchreReplayGame] = useState<EuchreGameInstance | null>(null);
  const [euchreGame, setEuchreGame] = useState<EuchreGameInstance>(createDefaultEuchreGame());
  const [euchreSettings, setEuchreSettings] = useState<EuchreSettings>({
    ...INIT_GAME_SETTINGS,
    playerName: getInitPlayerName()
  });
  const [errorState, setErrorState] = useState<EuchreError | null>(null);
  const [playedCard, setPlayedCard] = useState<Card | null>(null);
  const [bidResult, setBidResult] = useState<BidResult | null>(null);
  const { events, addEvent, clearEvents } = useEventLog();

  const [playerNotification, dispatchPlayerNotification] = useReducer(
    playerNotificationReducer,
    initialPlayerNotification
  );

  const [gameFlow, dispatchGameFlow] = useReducer(gameFlowStateReducer, { ...INIT_GAME_FLOW_STATE });
  const [gameAnimationFlow, dispatchGameAnimationFlow] = useReducer(
    gameAnimationFlowReducer,
    initialGameAnimationState
  );

  const handleCancelGame = useCallback(() => {
    if (shouldCancelGame) return;

    dispatchGameFlow({ type: EuchreFlowActionType.SET_GAME_FLOW, gameFlow: EuchreGameFlow.BEGIN_INIT_DEAL });
    dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_NONE });
    dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });
    setCancelGame(true);
  }, [shouldCancelGame]);

  const gameErrorState: EuchreErrorState = {
    errorState: errorState,
    setErrorState: setErrorState
  };

  const gameState: EuchreGameState = useMemo(() => {
    return {
      euchreGame: euchreGame,
      euchreReplayGame: euchreReplayGame,
      euchreGameFlow: gameFlow,
      euchreSettings: euchreSettings,
      playerNotification: playerNotification,
      euchreAnimationFlow: gameAnimationFlow,
      prompValue: promptValue,
      playedCard: playedCard,
      bidResult: bidResult,
      shouldCancel: shouldCancelGame,
      setEuchreGame: setEuchreGame,
      setEuchreSettings: setEuchreSettings,
      setPromptValue: setPromptValue,
      setPlayedCard: setPlayedCard,
      setBidResult: setBidResult,
      setShouldCancel: setCancelGame,
      dispatchPlayerNotification: dispatchPlayerNotification,
      dispatchGameFlow: dispatchGameFlow,
      dispatchGameAnimationFlow: dispatchGameAnimationFlow,
      onCancel: handleCancelGame,
      addEvent: addEvent
    };
  }, [
    addEvent,
    bidResult,
    euchreGame,
    euchreReplayGame,
    euchreSettings,
    gameAnimationFlow,
    gameFlow,
    handleCancelGame,
    playedCard,
    playerNotification,
    promptValue,
    shouldCancelGame
  ]);

  const { reverseLastHandPlayed } = useGameData();
  const { getGameStateForNextHand } = useGamePlayLogic();
  const { reset, handleBeginGame, cancelAndReset } = useEuchreGameInit(gameState);
  const {} = useEuchreGameInitDeal(gameState, gameErrorState);
  const { handleShuffleAndDealComplete } = useEuchreGameShuffle(gameState, gameErrorState);
  const { handleBidSubmit } = useEuchreGameBid(gameState, gameErrorState, reset);
  const { handleDiscardSubmit } = useEuchreGameOrder(gameState, gameErrorState);
  const { handleCardPlayed, handleCloseHandResults } = useEuchreGamePlay(gameState, gameErrorState);

  //#region Other Handlers *************************************************************************

  const handleStartGame = () => {
    reset(true);
  };

  const handleBeginNewGame = () => {
    setEuchreReplayGame(null);
    handleBeginGame();
  };

  /** */
  const handleSettingsChange = (settings: EuchreSettings) => {
    setEuchreSettings(settings);
  };

  const handleCancelAndReset = useCallback(() => {
    cancelAndReset();
  }, [cancelAndReset]);

  /** Reverse game state to play the hand again. Used for testing/debugging */
  const handleReplayHand = () => {
    setPromptValue([]);
    const newGame = reverseLastHandPlayed(euchreGame);
    const newGameFlow = getGameStateForNextHand(gameFlow, euchreSettings, newGame);
    newGameFlow.gameFlow = EuchreGameFlow.BEGIN_BID_FOR_TRUMP;
    dispatchGameFlow({ type: EuchreFlowActionType.SET_STATE, state: newGameFlow });
    dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_NONE });
    setEuchreGame(newGame);
  };

  const handleReplayGame = (gameToReplay: EuchreGameInstance) => {
    setEuchreReplayGame(gameToReplay);
    handleBeginGame();
  };

  const handleAttemptToRecover = () => {
    if (errorState) {
      dispatchGameFlow({ type: EuchreFlowActionType.SET_GAME_FLOW, gameFlow: errorState.gameFlow });
      dispatchGameAnimationFlow({ type: errorState.animationType });
      setErrorState(null);
    }
  };

  //#endregion

  return {
    euchreGame,
    gameFlow,
    gameAnimationFlow,
    playerNotification,
    promptValue,
    euchreSettings,
    events,
    errorState,
    playedCard,
    reset,
    clearEvents,
    handleStartGame,
    handleBeginNewGame,
    handleBidSubmit,
    handleSettingsChange,
    handleCancelGame,
    handleDiscardSubmit,
    handleCloseHandResults,
    handleCardPlayed,
    handleReplayHand,
    handleCancelAndReset,
    handleReplayGame,
    handleAttemptToRecover,
    handleShuffleAndDealComplete
  };
}
