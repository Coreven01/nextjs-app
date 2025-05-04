import { useCallback, useEffect } from 'react';
import {
  getPlayerNotificationType,
  PlayerNotificationAction,
  PlayerNotificationActionType
} from './reducers/playerNotificationReducer';
import { BidResult } from '@/app/lib/euchre/definitions/definitions';
import UserInfo from '@/app/ui/euchre/player/user-info';
import PlayerNotification from '@/app/ui/euchre/player/player-notification';
import useGameBidLogic from './logic/useGameBidLogic';
import usePlayerData from './data/usePlayerData';
import useGameData from './data/useGameData';
import { v4 as uuidv4 } from 'uuid';
import {
  EuchreGameInstance,
  EuchreGameSetters,
  EuchreGameValues,
  EuchrePlayer,
  ErrorHandlers
} from '../../lib/euchre/definitions/game-state-definitions';
import { GameEventHandlers } from './useEventLog';
import { EuchrePauseActionType, EuchrePauseType } from './reducers/gamePauseReducer';
import useGameBidState from './phases/useGameBidState';
import useGameEventsBid from './events/useGameEventsBid';

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
    addAnimateBeginBidForTrumpEvent,
    addFinalizeBidForTrumpEvent,
    addBeginPassDealEvent,
    addPassBidEvent,
    addBidScoreEvent,
    addHandleBidSelectionEvent
  } = useGameEventsBid(state, eventHandlers);

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
      const currentPlayer: EuchrePlayer = state.euchreGame.currentPlayer;

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
            settings={state.euchreSettings}
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
      state.euchreGame.currentPlayer,
      state.euchreSettings
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
      const currentPlayer = state.euchreGame.currentPlayer;
      addHandleBidSelectionEvent();

      setters.setBidResult(result);
      if (result.orderTrump && (!state.euchreSettings.debugAlwaysPass || currentPlayer.human)) {
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
      state.euchreGame.currentPlayer,
      state.euchreSettings.debugAlwaysPass
    ]
  );

  /** Submit the resulting bid from user input.
   *
   */
  const handleBidSubmit = useCallback(
    (result: BidResult) => {
      if (state.euchrePauseState.pauseType === EuchrePauseType.USER_INPUT) {
        setters.setPromptValue([]);
        handlePlayerSelectionForBid(result);
      }
    },
    [handlePlayerSelectionForBid, setters, state.euchrePauseState.pauseType]
  );

  const handlePassDealComplete = useCallback(() => {
    continueToShuffleCards();
  }, [continueToShuffleCards]);

  //#endregion

  /** Shuffle and deal cards for regular game play. Starts the bidding process to determine if the dealer should pick up the flipped card
   * or if a player will name suit. */
  const beginBidForTrump = useCallback(() => {
    if (!shouldBeginBidForTrump) return;

    const game: EuchreGameInstance = state.euchreGame;
    addBeginBidForTrumpEvent();

    if (state.euchreGameFlow.hasSecondBiddingPassed) {
      // all users have passed. pass the deal to the next user and begin to re-deal.
      continueToBeginPassDeal();
      return;
    }

    if (game.currentPlayer?.human) {
      pauseForBidForTrump();
    } else {
      const bidChoice: BidResult = determineBid(
        game,
        game.trump,
        !state.euchreGameFlow.hasFirstBiddingPassed,
        state.euchreSettings
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
    state.euchreGame,
    state.euchreGameFlow.hasFirstBiddingPassed,
    state.euchreGameFlow.hasSecondBiddingPassed,
    state.euchreSettings
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

      addAnimateBeginBidForTrumpEvent();

      // delay for animation between players when passing bid.
      await notificationDelay(state.euchreSettings);
      continueToEndBidForTrump();
    };

    errorHandlers.catchAsync(
      beginAnimationForBidForTrump,
      errorHandlers.onError,
      'beginAnimationForBidForTrump'
    );
  }, [
    addAnimateBeginBidForTrumpEvent,
    continueToEndBidForTrump,
    errorHandlers,
    notificationDelay,
    setters,
    shouldAnimateBeginBidForTrump,
    state.euchreSettings
  ]);

  /** Modify the game state depending on if the user named trump or passed based on player bid choice.
   *
   */
  const endBidForTrump = useCallback(() => {
    if (!shouldEndBidForTrump) return;

    addFinalizeBidForTrumpEvent();
    updateStateAndContinueToBidForTrump(state.euchreGame, state.euchreGameFlow);

    const newGame: EuchreGameInstance = { ...state.euchreGame };
    const rotation: EuchrePlayer[] = getPlayerRotation(newGame.gamePlayers, newGame.currentPlayer);
    newGame.currentPlayer = rotation[0];

    setters.setEuchreGame(newGame);
  }, [
    addFinalizeBidForTrumpEvent,
    getPlayerRotation,
    setters,
    shouldEndBidForTrump,
    state.euchreGame,
    state.euchreGameFlow,
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

    const newGame: EuchreGameInstance = { ...state.euchreGame };
    const rotation: EuchrePlayer[] = getPlayerRotation(newGame.gamePlayers, newGame.dealer);

    newGame.dealer = rotation[0];
    newGame.dealPassedCount += 1;

    setters.dispatchPlayerNotification(getPlayerNotificationForAllPassed());
    await notificationDelay(state.euchreSettings, 1);

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
    state.euchreGame,
    state.euchreSettings
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
