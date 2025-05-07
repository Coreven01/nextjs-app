import { useCallback, useEffect } from 'react';
import {
  getPlayerNotificationType,
  PlayerNotificationAction,
  PlayerNotificationActionType
} from '../reducers/playerNotificationReducer';
import { BidResult, PromptType } from '@/app/lib/euchre/definitions/definitions';
import UserInfo from '@/app/ui/euchre/player/user-info';
import PlayerNotification from '@/app/ui/euchre/player/player-notification';
import useGameBidLogic from '../logic/useGameBidLogic';
import usePlayerData from '../data/usePlayerData';
import useGameData from '../data/useGameData';
import { v4 as uuidv4 } from 'uuid';
import {
  EuchreGameInstance,
  EuchreGameSetters,
  EuchreGameValues,
  EuchrePlayer,
  ErrorHandlers
} from '../../../lib/euchre/definitions/game-state-definitions';
import { GameEventHandlers } from '../useEventLog';
import { EuchrePauseActionType, EuchrePauseType } from '../reducers/gamePauseReducer';
import useGameBidState from '../phases/useGameBidState';
import useGameEventsBid from '../events/useGameEventsBid';

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
    updateStateAndContinueToBidForTrump,
    pauseForPassDeal,
    continueToBeginOrderTrump,
    continueToShuffleCards
  } = useGameBidState(state, setters, errorHandlers);

  const { determineBid } = useGameBidLogic();
  const { getPlayerRotation } = usePlayerData();
  const { notificationDelay } = useGameData();
  const {
    addBeginBidForTrumpEvent,
    addAnimateBidForTrumpEvent,
    addFinalizeBidForTrumpEvent,
    addBeginPassDealEvent,
    addPassBidEvent,
    addBidScoreEvent,
    addHandleBidSelectionEvent
  } = useGameEventsBid(state, eventHandlers);
  const { euchreGame, euchreSettings, euchreGameFlow, euchrePauseState } = state;

  /**
   * Create a message in the center of the game table to notify the player that all players passed, and the deal is passed to the next player.
   * @param player
   * @returns
   */
  const getPlayerNotificationForAllPassed = useCallback(() => {
    const newAction: PlayerNotificationAction = {
      type: PlayerNotificationActionType.UPDATE_CENTER,
      payload: undefined
    };
    const id = '1';
    const infoDetail = (
      <UserInfo className="absolute p-2 w-auto whitespace-nowrap shadow-lg shadow-black" id={id}>
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

      addPassBidEvent();
      if (!currentPlayer.human) {
        addBidScoreEvent(bidResult);
      }

      const notification: PlayerNotificationAction = {
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
      addBidScoreEvent,
      addPassBidEvent,
      continueToAnimateBeginBidForTrump,
      setters,
      euchreGame.currentPlayer,
      euchreSettings
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
      addHandleBidSelectionEvent();

      setters.setBidResult(result);
      if (result.orderTrump && (!euchreSettings.debugAlwaysPass || currentPlayer.human)) {
        handlePlayerOrderTrumpFromBid();
      } else {
        handlePassForBid(result);
      }
    },
    [
      addHandleBidSelectionEvent,
      handlePassForBid,
      handlePlayerOrderTrumpFromBid,
      setters,
      euchreGame.currentPlayer,
      euchreSettings.debugAlwaysPass
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
    continueToShuffleCards();
  }, [continueToShuffleCards]);

  //#endregion

  /** Shuffle and deal cards for regular game play. Starts the bidding process to determine if the dealer should pick up the flipped card
   * or if a player will name suit. */
  const beginBidForTrump = useCallback(() => {
    if (!shouldBeginBidForTrump) return;

    addBeginBidForTrumpEvent();

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
    addBeginBidForTrumpEvent,
    continueToBeginPassDeal,
    determineBid,
    handlePlayerSelectionForBid,
    pauseForBidForTrump,
    shouldBeginBidForTrump,
    euchreGame,
    euchreGameFlow.hasFirstBiddingPassed,
    euchreGameFlow.hasSecondBiddingPassed,
    euchreSettings
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

      addAnimateBidForTrumpEvent(true);

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
    addAnimateBidForTrumpEvent,
    continueToEndBidForTrump,
    errorHandlers,
    notificationDelay,
    setters,
    shouldAnimateBeginBidForTrump,
    euchreSettings
  ]);

  /** Modify the game state depending on if the user named trump or passed based on player bid choice.
   *
   */
  const endBidForTrump = useCallback(() => {
    if (!shouldEndBidForTrump) return;

    addFinalizeBidForTrumpEvent(false);
    updateStateAndContinueToBidForTrump(euchreGame, euchreGameFlow);

    const newGame: EuchreGameInstance = { ...euchreGame };
    const rotation: EuchrePlayer[] = getPlayerRotation(newGame.gamePlayers, newGame.currentPlayer);
    newGame.currentPlayer = rotation[0];

    setters.setEuchreGame(newGame);
  }, [
    addFinalizeBidForTrumpEvent,
    getPlayerRotation,
    setters,
    shouldEndBidForTrump,
    euchreGame,
    euchreGameFlow,
    updateStateAndContinueToBidForTrump
  ]);

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

    setters.dispatchStateChange(undefined, undefined, EuchrePauseActionType.SET_GENERAL);

    addBeginPassDealEvent();

    const newGame: EuchreGameInstance = { ...euchreGame };
    const rotation: EuchrePlayer[] = getPlayerRotation(newGame.gamePlayers, newGame.dealer);

    newGame.dealer = rotation[0];
    newGame.dealPassedCount += 1;

    setters.dispatchPlayerNotification(getPlayerNotificationForAllPassed());
    await notificationDelay(euchreSettings, 1);

    setters.setEuchreGame(newGame);
    pauseForPassDeal();
    setters.dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });
  }, [
    addBeginPassDealEvent,
    getPlayerNotificationForAllPassed,
    getPlayerRotation,
    notificationDelay,
    pauseForPassDeal,
    setters,
    shouldBeginPassDeal,
    euchreGame,
    euchreSettings
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
