'use client';

import { EuchreFlowActionType, EuchreGameFlow, EuchreGameFlowState } from './gameFlowReducer';
import { EuchreActionType, EuchreAnimateType } from './gameAnimationFlowReducer';
import { EuchreGameState } from './useEuchreGame';
import { getGameStateForInitialDeal, incrementSpeed } from '@/app/lib/euchre/game-setup-logic';
import { useCallback, useEffect } from 'react';
import isGameStateValidToContinue from '@/app/lib/euchre/game-state-logic';
import { createEvent, logDebugEvent } from '@/app/lib/euchre/util';
import {
  getPlayerNotificationType,
  PlayerNotificationAction,
  PlayerNotificationActionType
} from './playerNotificationReducer';
import { BidResult, EuchrePlayer, EuchreSettings, PromptType, Suit } from '@/app/lib/euchre/definitions';
import EphemeralModal from '@/app/ui/euchre/ephemeral-modal';
import { getPlayerRotation } from '@/app/lib/euchre/game';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/16/solid';
import UserInfo from '@/app/ui/euchre/player/user-info';

export default function useEuchreGameBid(state: EuchreGameState, onReset: (value: boolean) => void) {
  //#region Bid for Trump *************************************************************************

  /** Handle passing the bid to the next player.*/
  const handlePassForBid = useCallback(() => {
    const newGame = state.euchreGame;
    if (!newGame?.currentPlayer) throw new Error();
    if (!newGame?.trump) throw new Error();

    state.addEvent(
      createEvent(
        'd',
        state.euchreSettings,
        newGame.currentPlayer,
        'Handle Pass for bid. Score: ' + state.bidResult?.handScore
      )
    );

    const biddingRoundFinished = newGame.dealer === newGame.currentPlayer;
    // simulate flipping over the trump card.
    if (biddingRoundFinished && !state.euchreGameFlow.hasSecondBiddingPassed) {
      // remove the card from the DOM
      setTimeout(
        () =>
          state.dispatchPlayerNotification({
            type: PlayerNotificationActionType.UPDATE_CENTER,
            payload: undefined
          }),
        150
      );
    }

    const newPlayerNotification = getPlayerNotificationForBidding(
      newGame.currentPlayer,
      newGame.currentPlayer,
      state.euchreSettings,
      'p',
      false,
      null
    );

    state.dispatchPlayerNotification(newPlayerNotification);
    state.dispatchGameAnimationFlow({ type: EuchreActionType.SET_ANIMATE_BEGIN_BID_FOR_TRUMP });
    state.dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_BID_FOR_TRUMP });
    state.setEuchreGame(newGame);
  }, [state]);

  /** Effect to animate events after the initial bid for trump. */
  useEffect(() => {
    const beginAnimationForBidForTrump = async () => {
      if (
        !isGameStateValidToContinue(
          state.euchreGame,
          state.euchreGameFlow,
          state.euchreAnimationFlow,
          EuchreGameFlow.BEGIN_BID_FOR_TRUMP,
          EuchreAnimateType.ANIMATE_BEGIN_BID_FOR_TRUMP,
          state.shouldCancel,
          state.onCancel
        )
      )
        return;

      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_WAIT });

      // delay for animation between players
      await new Promise((resolve) => setTimeout(resolve, state.euchreSettings.gameSpeed));

      state.addEvent(createEvent('i', state.euchreSettings, undefined, 'End Animation for bid for trump'));
      state.dispatchGameAnimationFlow({ type: EuchreActionType.SET_ANIMATE_NONE });
      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_END_BID_FOR_TRUMP });
    };

    beginAnimationForBidForTrump();
  }, [state]);

  /** Update game flow when player orders trump.
   *
   */
  const handlePlayerOrderTrumpFromBid = useCallback(() => {
    // player called trump, either by suit or telling the deal er to pick up the card.
    state.dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_ORDER_TRUMP });
    state.dispatchGameAnimationFlow({ type: EuchreActionType.SET_ANIMATE_NONE });
  }, [state]);

  /** Either order trump or pass bid from user selection.
   *
   */
  const handlePlayerSelectionForBid = useCallback(
    (result: BidResult) => {
      state.setBidResult(result);

      if (result.orderTrump && !state.euchreSettings.debugAlwaysPass) {
        handlePlayerOrderTrumpFromBid();
      } else {
        handlePassForBid();
      }
    },
    [state, handlePassForBid, handlePlayerOrderTrumpFromBid]
  );

  /** Shuffle and deal cards for regular game play. Starts the bidding process to determine if the dealer should pick up the flipped card
   * or if a player will name suit. */
  const beginBidForTrump = useCallback(() => {
    if (
      !isGameStateValidToContinue(
        state.euchreGame,
        state.euchreGameFlow,
        state.euchreAnimationFlow,
        EuchreGameFlow.BEGIN_BID_FOR_TRUMP,
        EuchreAnimateType.ANIMATE_NONE,
        state.shouldCancel,
        state.onCancel
      )
    )
      return;

    const newGame = state.euchreGame?.shallowCopy();
    if (!newGame?.trump) throw Error('Trump not found for bid for trump.');
    if (!newGame?.currentPlayer) throw Error('Player not found for bid for trump.');

    state.addEvent(createEvent('i', state.euchreSettings, newGame.currentPlayer, 'Begin bid For trump'));

    if (state.euchreGameFlow.hasSecondBiddingPassed) {
      // all users have passed. pass the deal to the next user and begin to re-deal.
      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_PASS_DEAL });
      state.dispatchGameAnimationFlow({ type: EuchreActionType.SET_ANIMATE_NONE });
      return;
    }

    if (newGame.currentPlayer?.human) {
      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_AWAIT_USER_INPUT });
      state.setPromptValue([{ type: PromptType.BID }]); // Show prompt window for choosing trump or passing for human player.
    } else {
      const computerChoice: BidResult = newGame.currentPlayer.determineBid(
        newGame,
        newGame.trump,
        !state.euchreGameFlow.hasFirstBiddingPassed
      );
      handlePlayerSelectionForBid(computerChoice);
    }
  }, [state, handlePlayerSelectionForBid]);

  /** Begin bid for trump game flow.
   *
   */
  useEffect(() => {
    beginBidForTrump();
  }, [beginBidForTrump]);

  /** Modify the game state depending on if the user named trump or passed based on player bid choice.
   *
   */
  const endBidForTrump = useCallback(async () => {
    if (
      !isGameStateValidToContinue(
        state.euchreGame,
        state.euchreGameFlow,
        state.euchreAnimationFlow,
        EuchreGameFlow.END_BID_FOR_TRUMP,
        EuchreAnimateType.ANIMATE_NONE,
        state.shouldCancel,
        state.onCancel
      )
    )
      return;

    const newGame = state.euchreGame?.shallowCopy();
    if (!newGame?.currentPlayer) throw Error('Current player not found for end bid for trump.');

    const biddingRoundFinished = newGame.dealer === newGame.currentPlayer;
    const firstRound = !state.euchreGameFlow.hasFirstBiddingPassed;
    const newGameFlow: EuchreGameFlowState = { ...state.euchreGameFlow };

    newGameFlow.gameFlow = EuchreGameFlow.BEGIN_BID_FOR_TRUMP;
    if (biddingRoundFinished) {
      newGameFlow.hasFirstBiddingPassed = firstRound || newGameFlow.hasFirstBiddingPassed;
      newGameFlow.hasSecondBiddingPassed = !firstRound;
    }

    const rotation = getPlayerRotation(newGame.gamePlayers, newGame.currentPlayer);
    newGame.assignPlayer(rotation[0]);

    state.dispatchGameFlow({ type: EuchreFlowActionType.UPDATE_ALL, payload: newGameFlow });
    state.setEuchreGame(newGame);
  }, [state]);

  /**
   *
   */
  useEffect(() => {
    endBidForTrump();
  }, [endBidForTrump]);

  /** Submit the resulting bid from user input.
   *
   */
  const handleBidSubmit = useCallback(
    (result: BidResult) => {
      if (state.euchreGame && state.euchreGameFlow.gameFlow === EuchreGameFlow.AWAIT_USER_INPUT) {
        state.setPromptValue([]);
        handlePlayerSelectionForBid(result);
      }
    },
    [state, handlePlayerSelectionForBid]
  );

  //#endregion

  //#region Pass Deal *************************************************************************

  /** All players passed during the bidding process. Change state for deal for the next user in the rotation.
   *
   */
  const beginPassDeal = useCallback(async () => {
    if (
      !isGameStateValidToContinue(
        state.euchreGame,
        state.euchreGameFlow,
        state.euchreAnimationFlow,
        EuchreGameFlow.BEGIN_PASS_DEAL,
        EuchreAnimateType.ANIMATE_NONE,
        state.shouldCancel,
        state.onCancel
      )
    )
      return;

    state.dispatchGameFlow({ type: EuchreFlowActionType.SET_WAIT });

    logDebugEvent(
      'All players passed first and second round. Update state to pass the deal to the next user.'
    );

    const newGame = state.euchreGame?.shallowCopy();
    if (!newGame?.currentPlayer) throw Error('Current player not found for end bid for trump.');
    if (!newGame?.dealer) throw Error('Game dealer not found - Pass deal.');

    const rotation = getPlayerRotation(newGame.gamePlayers, newGame.dealer);
    newGame.dealer = rotation[0];

    state.dispatchPlayerNotification(getPlayerNotificationForAllPassed(newGame.dealer));

    await new Promise((resolve) => setTimeout(resolve, incrementSpeed(state.euchreSettings.gameSpeed, 2)));

    onReset(false);
    const newGameFlow = getGameStateForInitialDeal(state.euchreGameFlow, state.euchreSettings, newGame);
    newGameFlow.gameFlow = EuchreGameFlow.BEGIN_SHUFFLE_CARDS;

    state.dispatchGameFlow({
      type: EuchreFlowActionType.UPDATE_ALL,
      payload: newGameFlow
    });

    state.dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });
    state.dispatchGameAnimationFlow({ type: EuchreActionType.SET_ANIMATE_NONE });
    state.setEuchreGame(newGame);
  }, [state, onReset]);

  useEffect(() => {
    const executePassDeal = async () => {
      await beginPassDeal();
    };
    executePassDeal();
  }, [beginPassDeal]);
  //#endregion

  return { handleBidSubmit };
}

/** Return a new state to provide a visual element that the user either passed or ordered trump.
 *
 */
export const getPlayerNotificationForBidding = (
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
      messageLocation = 'md:top-3';
      break;
    case 2:
      messageLocation = 'md:bottom-5 top-3';
      break;
    case 3:
      messageLocation = 'md:right-3 left-3';
      break;
    case 4:
      messageLocation = 'md:left-3 right-3';
      break;
  }

  let messageDetail: string;

  switch (info) {
    case 'p':
      messageDetail = 'Pass';
      break;
    case 'o':
      messageDetail = dealer === player ? 'Picking Up' : 'Pick it up';
      delay = delay;
      break;
    case 'n':
      messageDetail = 'Calling ' + namedSuit;
      delay = delay;
      break;
  }

  const infoDetail = (
    <EphemeralModal
      className={`w-auto absolute whitespace-nowrap shadow-lg shadow-black z-30 ${messageLocation}`}
      durationMs={settings.gameSpeed}
      delayMs={delay}
      fadeType="both"
    >
      <UserInfo className="md:text-base text-xs">
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

/**
 *
 * @param player
 * @returns
 */
const getPlayerNotificationForAllPassed = (player: EuchrePlayer) => {
  const newAction: PlayerNotificationAction = {
    type: PlayerNotificationActionType.UPDATE_CENTER,
    payload: undefined
  };
  const id = player.generateElementId();
  const infoDetail = (
    <UserInfo
      className="p-2 md:text-base text-sm w-auto whitespace-nowrap shadow-lg shadow-black"
      id={id}
      key={id}
    >
      <div className="flex gap-2 items-center">All Players Passed</div>
    </UserInfo>
  );
  newAction.payload = infoDetail;

  return newAction;
};
