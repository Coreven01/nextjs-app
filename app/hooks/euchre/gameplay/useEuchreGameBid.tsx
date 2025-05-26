import { useCallback, useEffect } from 'react';
import {
  getPlayerNotificationType,
  NotificationAction,
  NotificationActionType
} from '../reducers/playerNotificationReducer';

import UserInfo from '@/features/euchre/components/player/user-info';
import PlayerNotification from '@/features/euchre/components/player/player-notification';
import { v4 as uuidv4 } from 'uuid';
import {
  ErrorHandlers,
  EuchreGameInstance,
  EuchreGameSetters,
  EuchreGameValues,
  EuchrePlayer
} from '../../../../features/euchre/definitions/game-state-definitions';
import { GameEventHandlers } from '../useEventLog';
import { EuchrePauseType } from '../reducers/gamePauseReducer';
import useGameBidState from '../phases/useGameBidState';
import { determineBid } from '../../../../features/euchre/util/game/gameBidLogicUtil';
import { notificationDelay } from '../../../../features/euchre/util/game/gameDataUtil';
import { getPlayerRotation } from '../../../../features/euchre/util/game/playerDataUtil';
import {
  addAnimateBidForTrumpEvent,
  addBeginBidForTrumpEvent,
  addBeginPassDealEvent,
  addBidScoreEvent,
  addFinalizeBidForTrumpEvent,
  addHandleBidSelectionEvent,
  addPassBidEvent
} from '../../../../features/euchre/util/game/gameBidEventsUtil';
import { BidResult, PromptType } from '../../../../features/euchre/definitions/definitions';

export default function useEuchreGameBid(
  state: EuchreGameValues,
  setters: EuchreGameSetters,
  eventHandlers: GameEventHandlers,
  errorHandlers: ErrorHandlers
) {
  const {
    shouldBeginBidForTrump,
    shouldAnimateBeginBidForTrump,
    shouldEndBidForTrump,
    shouldBeginPassDeal,
    continueToAnimateBeginBidForTrump,
    pauseForBidForTrump,
    continueToBeginPassDeal,
    continueToEndBidForTrump,
    updateStateForEndOfTrump,
    pauseForPassDeal,
    continueToBeginOrderTrump,
    updateStateForNewHand
  } = useGameBidState(state, setters, errorHandlers);

  const { euchreGame, euchreSettings, euchreGameFlow, euchrePauseState } = state;

  /**
   * Create a message in the center of the game table to notify the player that all players passed, and the deal is passed to the next player.
   * @param player
   * @returns
   */
  const getPlayerNotificationForAllPassed = useCallback(() => {
    const newAction: NotificationAction = {
      type: NotificationActionType.CENTER,
      payload: undefined
    };
    const infoDetail = (
      <UserInfo className="absolute p-2 w-auto whitespace-nowrap shadow-lg shadow-black">
        <div className="flex items-center">All Players Passed</div>
      </UserInfo>
    );
    newAction.payload = infoDetail;

    return newAction;
  }, []);

  //#region Bid for Trump *************************************************************************

  /** ************************************************************************************************************************************* */

  //#region Handlers
  /** Handle passing the bid to the next player.*/
  const handlePassForBid = useCallback(
    (bidResult: BidResult) => {
      const currentPlayer: EuchrePlayer = euchreGame.currentPlayer;

      addPassBidEvent(state, eventHandlers);
      if (!currentPlayer.human) {
        addBidScoreEvent(bidResult, state, eventHandlers);
      }

      const notification: NotificationAction = {
        type: getPlayerNotificationType(currentPlayer.location),
        payload: (
          <PlayerNotification
            key={uuidv4()}
            dealer={currentPlayer}
            player={currentPlayer}
            settings={euchreSettings}
            info={'pass'}
            loner={false}
            namedSuit={null}
          />
        )
      };

      setters.dispatchPlayerNotification(notification);
      continueToAnimateBeginBidForTrump();
    },
    [
      continueToAnimateBeginBidForTrump,
      euchreGame.currentPlayer,
      euchreSettings,
      eventHandlers,
      setters,
      state
    ]
  );

  /** Handle the result when the player ordered trump and update the game state.
   *
   */
  const handlePlayerOrderTrumpFromBid = useCallback(() => {
    // player called trump, either by suit or telling the deal er to pick up the card.
    continueToBeginOrderTrump();
  }, [continueToBeginOrderTrump]);

  /** Either order trump or pass bid from user selection.
   *
   */
  const handlePlayerSelectionForBid = useCallback(
    (result: BidResult) => {
      const currentPlayer = euchreGame.currentPlayer;
      addHandleBidSelectionEvent(state, eventHandlers);

      setters.setBidResult(result);
      if (result.orderTrump && (!euchreSettings.debugAlwaysPass || currentPlayer.human)) {
        handlePlayerOrderTrumpFromBid();
      } else {
        handlePassForBid(result);
      }
    },
    [
      euchreGame.currentPlayer,
      euchreSettings.debugAlwaysPass,
      eventHandlers,
      handlePassForBid,
      handlePlayerOrderTrumpFromBid,
      setters,
      state
    ]
  );

  /** Submit the resulting bid from user input.
   *
   */
  const handleBidSubmit = useCallback(
    (result: BidResult) => {
      if (euchrePauseState.pauseType === EuchrePauseType.USER_INPUT) {
        setters.removePromptValue(PromptType.BID);
        handlePlayerSelectionForBid(result);
      }
    },
    [handlePlayerSelectionForBid, setters, euchrePauseState.pauseType]
  );

  const handlePassDealComplete = useCallback(() => {
    updateStateForNewHand();
    setters.dispatchPlayerNotification({ type: NotificationActionType.RESET });
    //continueToShuffleCards();
  }, [setters, updateStateForNewHand]);

  //#endregion

  /** Shuffle and deal cards for regular game play. Starts the bidding process to determine if the dealer should pick up the flipped card
   * or if a player will name suit. */
  const beginBidForTrump = useCallback(() => {
    if (!shouldBeginBidForTrump) return;

    addBeginBidForTrumpEvent(state, eventHandlers);

    if (euchreGameFlow.hasSecondBiddingPassed) {
      // all users have passed. pass the deal to the next user and begin to re-deal.
      continueToBeginPassDeal();
      return;
    }

    if (euchreGame.currentPlayer?.human) {
      pauseForBidForTrump();
    } else {
      const bidChoice: BidResult = determineBid(
        euchreGame,
        euchreGame.trump,
        !euchreGameFlow.hasFirstBiddingPassed,
        euchreSettings
      );

      handlePlayerSelectionForBid(bidChoice);
    }
  }, [
    continueToBeginPassDeal,
    euchreGame,
    euchreGameFlow.hasFirstBiddingPassed,
    euchreGameFlow.hasSecondBiddingPassed,
    euchreSettings,
    eventHandlers,
    handlePlayerSelectionForBid,
    pauseForBidForTrump,
    shouldBeginBidForTrump,
    state
  ]);

  /** Begin bid for trump game flow.
   *
   */
  useEffect(() => {
    try {
      beginBidForTrump();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'beginBidForTrump');
    }
  }, [beginBidForTrump, errorHandlers]);

  /** Effect to animate events after the initial bid for trump. */
  useEffect(() => {
    const beginAnimationForBidForTrump = async () => {
      if (!shouldAnimateBeginBidForTrump) return;

      setters.dispatchPause();

      addAnimateBidForTrumpEvent(true, state, eventHandlers);

      // delay for animation between players when passing bid.
      await notificationDelay(euchreSettings);
      continueToEndBidForTrump();
    };

    errorHandlers.catchAsync(
      beginAnimationForBidForTrump,
      errorHandlers.onError,
      'beginAnimationForBidForTrump'
    );
  }, [
    continueToEndBidForTrump,
    errorHandlers,
    euchreSettings,
    eventHandlers,
    setters,
    shouldAnimateBeginBidForTrump,
    state
  ]);

  /** Modify the game state depending on if the user named trump or passed based on player bid choice.
   *
   */
  const endBidForTrump = useCallback(() => {
    if (!shouldEndBidForTrump) return;

    addFinalizeBidForTrumpEvent(false, state, eventHandlers);
    //updateStateAndContinueToBidForTrump(euchreGame, euchreGameFlow);
    updateStateForEndOfTrump();

    //     const newGameFlow = { ...gameflow };
    // const biddingRoundFinished = playerEqual(game.dealer, game.currentPlayer);
    // const firstRound = !state.euchreGameFlow.hasFirstBiddingPassed;

    // newGameFlow.gameFlow = EuchreGameFlow.BEGIN_BID_FOR_TRUMP;
    // if (biddingRoundFinished) {
    //   newGameFlow.hasFirstBiddingPassed = firstRound || newGameFlow.hasFirstBiddingPassed;
    //   newGameFlow.hasSecondBiddingPassed = !firstRound;
    // }

    // setters.dispatchGameFlow({ type: EuchreFlowActionType.SET_STATE, state: newGameFlow });

    //     if (euchreGameFlow.hasSecondBiddingPassed) {
    //   // all users have passed. pass the deal to the next user and begin to re-deal.
    //   continueToBeginPassDeal();
    //   return;
    // }

    // const newGame: EuchreGameInstance = { ...euchreGame };
    // const rotation: EuchrePlayer[] = getPlayerRotation(newGame.gamePlayers, newGame.currentPlayer);
    // newGame.currentPlayer = rotation[0];

    // setters.setEuchreGame(newGame);
  }, [eventHandlers, shouldEndBidForTrump, state, updateStateForEndOfTrump]);

  /**
   *
   */
  useEffect(() => {
    try {
      endBidForTrump();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'endBidForTrump');
    }
  }, [endBidForTrump, errorHandlers]);

  //#endregion

  //#region Pass Deal *************************************************************************

  /** All players passed during the bidding process. Change state for deal for the next user in the rotation.
   *
   */
  const beginPassDeal = useCallback(async () => {
    if (!shouldBeginPassDeal) return;

    //setters.dispatchStateChange(undefined, undefined, EuchrePauseActionType.SET_GENERAL);
    pauseForPassDeal();
    addBeginPassDealEvent(state, eventHandlers);

    const newGame: EuchreGameInstance = { ...euchreGame };
    const rotation: EuchrePlayer[] = getPlayerRotation(newGame.gamePlayers, newGame.dealer);

    newGame.dealer = rotation[0];
    newGame.dealPassedCount += 1;
    setters.setEuchreGame(newGame);

    setters.dispatchPlayerNotification(getPlayerNotificationForAllPassed());
    //await notificationDelay(euchreSettings, 1);

    //pauseForPassDeal();
    //updateStateForNewHand();
    //setters.dispatchPlayerNotification({ type: NotificationActionType.RESET });
  }, [
    euchreGame,
    eventHandlers,
    getPlayerNotificationForAllPassed,
    pauseForPassDeal,
    setters,
    shouldBeginPassDeal,
    state
  ]);

  useEffect(() => {
    const passDeal = async () => {
      await beginPassDeal();
    };

    errorHandlers.catchAsync(passDeal, errorHandlers.onError, 'passDeal');
  }, [beginPassDeal, errorHandlers]);
  //#endregion

  return { handleBidSubmit, handlePassDealComplete };
}
