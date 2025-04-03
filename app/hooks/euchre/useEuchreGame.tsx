'use client';

import { ActionDispatch, Dispatch, SetStateAction, useCallback, useMemo, useReducer, useState } from 'react';
import { CardTransformation } from './useMoveCard';
import {
  initialPlayerNotification,
  PlayerNotificationAction,
  PlayerNotificationActionType,
  playerNotificationReducer,
  PlayerNotificationState
} from './playerNotificationReducer';
import {
  EuchreGameFlow,
  EuchreFlowActionType,
  EuchreGameFlowState,
  gameFlowStateReducer,
  INIT_GAME_FLOW_STATE,
  GameFlowAction
} from './gameFlowReducer';
import {
  EuchreAnimationActionType,
  gameAnimationFlowReducer,
  initialGameAnimationState,
  EuchreAnimationState,
  EuchreAnimationAction
} from './gameAnimationFlowReducer';
import useAnimation from '@/app/hooks/euchre/animation/useAnimation';
import {
  BidResult,
  Card,
  EuchreGameInstance,
  EuchreSettings,
  PromptValue
} from '@/app/lib/euchre/definitions';
import { INIT_GAME_SETTINGS } from '@/app/lib/euchre/game-setup-logic';
import { GameEvent, useEventLog } from './useEventLog';
import useEuchreGameInit from './useEuchreGameInit';
import useEuchreGameInitDeal from './useEuchreGameInitDeal';
import useEuchreGameShuffle from './useEuchreGameShuffle';
import useEuchreGameBid from './useEuchreGameBid';
import useEuchreGameOrder from './useEuchreGameOrder';
import useEuchreGamePlay from './useEuchreGamePlay';
import { getGameStateForNextHand } from '@/app/lib/euchre/game-play-logic';

export type EuchreGameState = {
  euchreGame: EuchreGameInstance | null;
  euchreReplayGame: EuchreGameInstance | null;
  euchreGameFlow: EuchreGameFlowState;
  euchreSettings: EuchreSettings;
  playedCard: Card | null;
  bidResult: BidResult | null;
  playerNotification: PlayerNotificationState;
  euchreAnimationFlow: EuchreAnimationState;
  prompValue: PromptValue[];
  shouldCancel: boolean;
  setEuchreGame: Dispatch<SetStateAction<EuchreGameInstance | null>>;
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
  gameFlow: EuchreFlowActionType;
  animationType: EuchreAnimationActionType;
};

export default function useEuchreGame() {
  //#region Hooks to control game flow *************************************************************************
  const [promptValue, setPromptValue] = useState<PromptValue[]>([]);
  const [shouldCancelGame, setCancelGame] = useState(false);
  const [euchreReplayGame, setEuchreReplayGame] = useState<EuchreGameInstance | null>(null);
  const [euchreGame, setEuchreGame] = useState<EuchreGameInstance | null>(null);
  const [euchreSettings, setEuchreSettings] = useState<EuchreSettings>({ ...INIT_GAME_SETTINGS });
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
  // const [animationTransformation, setAnimationTransformation] = useState<CardTransformation[][]>([]);
  // const { animateForInitialDeal, animateDealCardsForHand, animateForPlayCard, setFadeOutForPlayers } =
  //   useAnimation(euchreSettings);

  const handleCancelGame = useCallback(() => {
    if (shouldCancelGame) return;

    dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_INIT_DEAL });
    dispatchGameAnimationFlow({
      type: EuchreAnimationActionType.SET_ANIMATE_NONE
    });
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

  const { reset, beginNewGame, cancelAndReset } = useEuchreGameInit(gameState);
  const {} = useEuchreGameInitDeal(gameState, gameErrorState);
  const {} = useEuchreGameShuffle(gameState, gameErrorState);
  const { handleBidSubmit } = useEuchreGameBid(gameState, gameErrorState, reset);
  const { handleDiscardSubmit } = useEuchreGameOrder(gameState, gameErrorState);
  const { handleCardPlayed, handleCloseGameResults, handleCloseHandResults } = useEuchreGamePlay(
    gameState,
    gameErrorState
  );

  //#region Other Handlers *************************************************************************

  /** */
  const handleSettingsChange = (settings: EuchreSettings) => {
    setEuchreSettings(settings);
  };

  const handleCancelAndReset = () => {
    cancelAndReset();
  };

  /** Reverse game state to play the hand again. Used for testing/debugging */
  const handleReplayHand = () => {
    const newGame = euchreGame?.shallowCopy();

    if (!newGame) throw Error('Game not found for replay hand.');

    setPromptValue([]);
    newGame.reverseLastHandPlayed();
    const newGameFlow = getGameStateForNextHand(gameFlow, euchreSettings, newGame);
    newGameFlow.gameFlow = EuchreGameFlow.BEGIN_BID_FOR_TRUMP;
    dispatchGameFlow({ type: EuchreFlowActionType.UPDATE_ALL, payload: newGameFlow });
    dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE_NONE });
    setEuchreGame(newGame);
  };

  const handleReplayGame = (gameToReplay: EuchreGameInstance) => {
    setEuchreReplayGame(gameToReplay);
    beginNewGame();
  };

  const handleAttemptToRecover = () => {
    if (errorState) {
      dispatchGameFlow({ type: errorState.gameFlow });
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
    clearEvents,
    beginNewGame,
    handleBidSubmit,
    handleSettingsChange,
    handleCancelGame,
    handleDiscardSubmit,
    handleCloseHandResults,
    handleCloseGameResults,
    handleCardPlayed,
    handleReplayHand,
    handleCancelAndReset,
    handleReplayGame,
    handleAttemptToRecover
  };
}
