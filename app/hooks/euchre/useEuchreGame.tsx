'use client';

import UserInfo from '@/app/ui/euchre/player/user-info';
import { ActionDispatch, Dispatch, SetStateAction, useCallback, useMemo, useReducer, useState } from 'react';
import { CardTransformation } from './useMoveCard';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/16/solid';
import {
  getPlayerNotificationType,
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
  EuchreActionType,
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
  EuchrePlayer,
  EuchreSettings,
  EuchreTrick,
  PromptValue,
  Suit
} from '@/app/lib/euchre/definitions';
import { incrementSpeed, INIT_GAME_SETTINGS } from '@/app/lib/euchre/game-setup-logic';
import EphemeralModal from '@/app/ui/euchre/ephemeral-modal';
import { GameEvent, useEventLog } from './useEventLog';
import GameCard from '@/app/ui/euchre/game/game-card';
import useEuchreGameInit from './useEuchreGameInit';
import useEuchreGameInitDeal from './useEuchreGameInitDeal';
import useEuchreGameShuffle from './useEuchreGameShuffle';
import useEuchreGameBid from './useEuchreGameBid';
import useEuchreGameOrder from './useEuchreGameOrder';
import useEuchreGamePlay from './useEuchreGamePlay';
import { getGameStateForNextHand } from '@/app/lib/euchre/game-play-logic';
import { getEncodedCardSvg } from '@/app/lib/euchre/card-data';

export type EuchreGameState = {
  euchreGame: EuchreGameInstance | null;
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

export default function useEuchreGame() {
  //#region Hooks to control game flow *************************************************************************
  const [promptValue, setPromptValue] = useState<PromptValue[]>([]);
  const [shouldCancelGame, setCancelGame] = useState(false);
  const [euchreGame, setEuchreGame] = useState<EuchreGameInstance | null>(null);
  const [euchreSettings, setEuchreSettings] = useState<EuchreSettings>({ ...INIT_GAME_SETTINGS });
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
  const [animationTransformation, setAnimationTransformation] = useState<CardTransformation[][]>([]);
  const { animateForInitialDeal, animateDealCardsForHand, animateForPlayCard, setFadeOutForPlayers } =
    useAnimation(euchreSettings);

  const handleCancelGame = useCallback(() => {
    if (shouldCancelGame) return;

    dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_INIT_DEAL });
    dispatchGameAnimationFlow({
      type: EuchreActionType.SET_ANIMATE_NONE
    });
    dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });
    setCancelGame(true);
  }, [shouldCancelGame]);

  const gameState: EuchreGameState = useMemo(() => {
    return {
      euchreGame: euchreGame,
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
    euchreSettings,
    gameAnimationFlow,
    gameFlow,
    handleCancelGame,
    playedCard,
    playerNotification,
    promptValue,
    shouldCancelGame
  ]);

  const { reset, beginNewGame } = useEuchreGameInit(gameState);
  const {} = useEuchreGameInitDeal(gameState);
  const {} = useEuchreGameShuffle(gameState);
  const { handleBidSubmit } = useEuchreGameBid(gameState, reset);
  const { handleDiscardSubmit } = useEuchreGameOrder(gameState);
  const { handleCardPlayed, handleCloseGameResults, handleCloseHandResults } = useEuchreGamePlay(gameState);

  //#region Other Handlers *************************************************************************
  const resaveGameState = () => {
    // setCancelGame(false);
  };

  /** */
  const handleSettingsChange = (settings: EuchreSettings) => {
    setEuchreSettings(settings);
  };

  /** Reset to view settings */
  const handleResetGame = () => {
    // setCancelGame(true);
    // reset(true);
    // gameInstance.current = null;
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
    dispatchGameAnimationFlow({ type: EuchreActionType.SET_ANIMATE_NONE });
    setEuchreGame(newGame);
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
    clearEvents,
    beginNewGame,
    handleBidSubmit,
    handleResetGame,
    handleSettingsChange,
    handleCancelGame,
    handleDiscardSubmit,
    resaveGameState,
    handleCloseHandResults,
    handleCloseGameResults,
    handleCardPlayed,
    handleReplayHand
  };
}

/** Return a new state to provide a visual element that the user either passed or ordered trump. */
const getPlayerNotificationForBidding = (
  dealer: EuchrePlayer,
  player: EuchrePlayer,
  settings: EuchreSettings,
  info: 'p' | 'o' | 'n',
  loner: boolean,
  namedSuit: Suit | null
): PlayerNotificationAction => {
  const newAction: PlayerNotificationAction = {
    type: PlayerNotificationActionType.UPDATE_PLAYER1,
    payload: undefined
  };

  const icon: React.ReactNode =
    info === 'p' ? (
      <XCircleIcon className="min-h-[18px] max-h-[20px] text-red-300" />
    ) : (
      <CheckCircleIcon className="min-h-[18px] max-h-[20px] text-green-300" />
    );
  let messageLocation = '';
  let delay = settings.gameSpeed;

  switch (player.playerNumber) {
    case 1:
      messageLocation = 'top-5';
      break;
    case 2:
      messageLocation = 'bottom-5';
      break;
    case 3:
      messageLocation = 'right-5';
      break;
    case 4:
      messageLocation = 'left-5';
      break;
  }

  let messageDetail: string;

  switch (info) {
    case 'p':
      messageDetail = 'Pass';
      break;
    case 'o':
      messageDetail = dealer === player ? 'Picking Up' : 'Pick it up';
      delay = incrementSpeed(delay, 1);
      break;
    case 'n':
      messageDetail = 'Calling ' + namedSuit;
      delay = incrementSpeed(delay, 1);
      break;
  }

  const infoDetail = (
    <EphemeralModal
      className={`w-auto absolute whitespace-nowrap shadow-lg shadow-black ${messageLocation}`}
      durationMs={settings.gameSpeed}
      delayMs={delay}
      fadeType="both"
    >
      <UserInfo className="text-sm">
        <div className="bg-stone-900 p-2">
          <div className="flex gap-2 items-center">
            {icon}
            <div>{messageDetail}</div>
          </div>
          {loner ? <div className="w-full text-center text-yellow-200">Going Alone!</div> : <></>}
        </div>
      </UserInfo>
    </EphemeralModal>
  );

  newAction.type = getPlayerNotificationType(player.playerNumber);
  newAction.payload = infoDetail;

  return newAction;
};

/** */
const getPlayerNotificationForPlayedCard = (card: Card, player: EuchrePlayer) => {
  const newAction: PlayerNotificationAction = {
    type: PlayerNotificationActionType.UPDATE_PLAYER1,
    payload: undefined
  };

  let cardLocation = '';
  switch (player.playerNumber) {
    case 1:
      cardLocation = '-top-5';
      break;
    case 2:
      cardLocation = '-bottom-5';
      break;
    case 3:
      cardLocation = '-right-5';
      break;
    case 4:
      cardLocation = '-left-5';
      break;
  }

  const rotateValues = [
    'rotate-[-8deg]',
    'rotate-[-4deg]',
    'rotate-[-1deg]',
    'rotate-[1deg]',
    'rotate-[4deg]',
    'rotate-[8deg]'
  ];

  const infoDetail = (
    <GameCard
      src={getEncodedCardSvg(card, player.location)}
      card={card}
      width={card.getDisplayWidth(player.location)}
      player={player}
      enableShadow={true}
      height={card.getDisplayHeight(player.location)}
      className={`absolute ${rotateValues[Math.round(Math.random() * 5)]} ${cardLocation}`}
      id={card.generateElementId()}
      key={`${card.generateElementId()}-${Math.floor(Math.random() * 1000)}`}
    ></GameCard>
  );

  newAction.type = getPlayerNotificationType(player.playerNumber);
  newAction.payload = infoDetail;
  return newAction;
};

const getPlayerNotificationForAllPassed = (player: EuchrePlayer) => {
  const newAction: PlayerNotificationAction = {
    type: PlayerNotificationActionType.UPDATE_CENTER,
    payload: undefined
  };
  const id = player.generateElementId();
  const infoDetail = (
    <UserInfo className="p-2 text-md w-auto whitespace-nowrap shadow-lg shadow-black" id={id} key={id}>
      <div className="flex gap-2 items-center">All Players Passed</div>
    </UserInfo>
  );
  newAction.payload = infoDetail;

  return newAction;
};

/** */
const getPlayerNotificationForTrickWon = (result: EuchreTrick) => {
  const newAction: PlayerNotificationAction = {
    type: PlayerNotificationActionType.UPDATE_CENTER,
    payload: undefined
  };
  const icon: React.ReactNode = <CheckCircleIcon className="min-h-[18px] max-h-[20px] text-green-300" />;
  let messageLocation = '';

  switch (result.taker?.playerNumber) {
    case 1:
      messageLocation = 'bottom-3';
      break;
    case 2:
      messageLocation = 'top-3';
      break;
    case 3:
      messageLocation = 'left-3';
      break;
    case 4:
      messageLocation = 'right-3';
      break;
  }

  const id = result.taker?.generateElementId();
  const infoDetail = (
    <UserInfo
      className={`p-2 text-lg w-auto absolute whitespace-nowrap z-40 shadow-lg shadow-black ${messageLocation}`}
      id={id}
      key={`${id}-${Math.floor(Math.random() * 1000)}`}
    >
      <div className="flex gap-2 items-center">{icon}</div>
    </UserInfo>
  );

  newAction.payload = infoDetail;

  return newAction;
};
