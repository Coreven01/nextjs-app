'use client';

import { EuchreFlowActionType, EuchreGameFlow, EuchreGameFlowState } from './gameFlowReducer';
import { EuchreAnimationActionType, EuchreAnimateType } from './gameAnimationFlowReducer';
import { EuchreErrorState, EuchreGameState } from './useEuchreGame';
import { incrementSpeed } from '@/app/lib/euchre/game-setup-logic';
import { useCallback, useEffect } from 'react';
import isGameStateValidToContinue from '@/app/lib/euchre/game-state-logic';
import { createEvent } from '@/app/lib/euchre/util';
import {
  getPlayerNotificationType,
  PlayerNotificationAction,
  PlayerNotificationActionType
} from './playerNotificationReducer';
import { BidResult, EuchrePlayer, PromptType } from '@/app/lib/euchre/definitions';
import { getPlayerRotation } from '@/app/lib/euchre/game';
import UserInfo from '@/app/ui/euchre/player/user-info';
import PlayerNotification from '@/app/ui/euchre/player/player-notification';
import { getGameStateForNextHand } from '@/app/lib/euchre/game-play-logic';

export default function useEuchreGameBid(
  state: EuchreGameState,
  errorState: EuchreErrorState,
  onReset: (value: boolean) => void
) {
  //#region Bid for Trump *************************************************************************

  /** Handle passing the bid to the next player.*/
  const handlePassForBid = useCallback(
    (bidResult: BidResult) => {
      const newGame = state.euchreGame;
      if (!newGame?.currentPlayer) throw new Error();
      if (!newGame?.trump) throw new Error();

      state.addEvent(createEvent('i', state.euchreSettings, newGame.currentPlayer, 'Player passed bid.'));

      if (!newGame.currentPlayer.human) {
        state.addEvent(
          createEvent('d', state.euchreSettings, newGame.currentPlayer, 'Hand Score: ' + bidResult.handScore)
        );
      }

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
          300
        );
      }

      const notification: PlayerNotificationAction = {
        type: getPlayerNotificationType(newGame.currentPlayer.playerNumber),
        payload: (
          <PlayerNotification
            dealer={newGame.currentPlayer}
            player={newGame.currentPlayer}
            settings={state.euchreSettings}
            info={'pass'}
            loner={false}
            namedSuit={null}
          />
        )
      };

      state.dispatchPlayerNotification(notification);
      state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE_BEGIN_BID_FOR_TRUMP });
      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_BID_FOR_TRUMP });
      state.setEuchreGame(newGame);
    },
    [state]
  );

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

      state.addEvent(createEvent('v', state.euchreSettings, undefined, 'End Animation for bid for trump'));
      state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE_NONE });
      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_END_BID_FOR_TRUMP });
    };

    try {
      beginAnimationForBidForTrump();
    } catch (e) {}
  }, [state]);

  /** Update game flow when player orders trump.
   *
   */
  const handlePlayerOrderTrumpFromBid = useCallback(() => {
    // player called trump, either by suit or telling the deal er to pick up the card.
    state.dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_ORDER_TRUMP });
    state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE_NONE });
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
        handlePassForBid(result);
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

    state.addEvent(createEvent('v', state.euchreSettings, newGame.currentPlayer, 'Begin bid For trump.'));

    if (state.euchreGameFlow.hasSecondBiddingPassed) {
      // all users have passed. pass the deal to the next user and begin to re-deal.
      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_BEGIN_PASS_DEAL });
      state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE_NONE });
      return;
    }

    if (newGame.currentPlayer?.human) {
      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_AWAIT_USER_INPUT });
      state.setPromptValue([{ type: PromptType.BID }]); // Show prompt window for choosing trump or passing for human player.
    } else {
      const computerChoice: BidResult = newGame.currentPlayer.determineBid(
        newGame,
        newGame.trump,
        !state.euchreGameFlow.hasFirstBiddingPassed,
        state.euchreSettings
      );
      handlePlayerSelectionForBid(computerChoice);
    }
  }, [state, handlePlayerSelectionForBid]);

  /** Begin bid for trump game flow.
   *
   */
  useEffect(() => {
    try {
      beginBidForTrump();
    } catch (e) {}
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
    try {
      endBidForTrump();
    } catch (e) {}
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
    state.addEvent(createEvent('i', state.euchreSettings, undefined, 'Deal passed.'));

    const newGame = state.euchreGame?.shallowCopy();
    if (!newGame?.currentPlayer) throw Error('Current player not found for end bid for trump.');
    if (!newGame?.dealer) throw Error('Game dealer not found - Pass deal.');

    const rotation = getPlayerRotation(newGame.gamePlayers, newGame.dealer);
    newGame.dealer = rotation[0];

    state.dispatchPlayerNotification(getPlayerNotificationForAllPassed(newGame.dealer));

    await new Promise((resolve) => setTimeout(resolve, incrementSpeed(state.euchreSettings.gameSpeed, 2)));

    state.setEuchreGame(newGame);
    state.setPromptValue([]);
    state.dispatchGameFlow({
      type: EuchreFlowActionType.UPDATE_ALL,
      payload: getGameStateForNextHand(state.euchreGameFlow, state.euchreSettings, newGame)
    });
    state.dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });
    state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE_NONE });
  }, [state]);

  useEffect(() => {
    const executePassDeal = async () => {
      await beginPassDeal();
    };
    try {
      executePassDeal();
    } catch (e) {}
  }, [beginPassDeal]);
  //#endregion

  return { handleBidSubmit };
}

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
