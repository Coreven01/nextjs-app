import { EuchreFlowActionType, EuchreGameFlow, EuchreGameFlowState } from './reducers/gameFlowReducer';
import { EuchreAnimationActionType } from './reducers/gameAnimationFlowReducer';
import { useCallback, useEffect } from 'react';
import {
  getPlayerNotificationType,
  PlayerNotificationAction,
  PlayerNotificationActionType
} from './reducers/playerNotificationReducer';
import { BidResult, PromptType } from '@/app/lib/euchre/definitions/definitions';
import UserInfo from '@/app/ui/euchre/player/user-info';
import PlayerNotification from '@/app/ui/euchre/player/player-notification';
import useGameBidLogic from './logic/useGameBidLogic';
import usePlayerData from './data/usePlayerData';
import useGameData from './data/useGameData';
import useGamePlayLogic from './logic/useGamePlayLogic';
import { v4 as uuidv4 } from 'uuid';
import {
  EuchreGameInstance,
  EuchreGameSetters,
  EuchreGameValues,
  EuchrePlayer,
  GameErrorHandlers
} from '../../lib/euchre/definitions/game-state-definitions';
import { GameEventHandlers } from './useEventLog';
import { EuchrePauseActionType, EuchrePauseType } from './reducers/gamePauseReducer';
import useGameBidState from './phases/useGameBidState';

export default function useEuchreGameBid(
  state: EuchreGameValues,
  setters: EuchreGameSetters,
  eventHandlers: GameEventHandlers,
  errorHandlers: GameErrorHandlers
) {
  const { shouldBeginBidForTrump, shouldAnimateBeginBidForTrump, shouldEndBidForTrump, shouldBeginPassDeal } =
    useGameBidState(state, errorHandlers);
  const { determineBid } = useGameBidLogic();
  const { getGameStateForNextHand } = useGamePlayLogic();
  const { getPlayerRotation, playerEqual, getTeamColor } = usePlayerData();
  const { notificationDelay } = useGameData();

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

      eventHandlers.addEvent(
        eventHandlers.createEvent(
          'i',
          currentPlayer,
          'Passed bid.',
          undefined,
          getTeamColor(currentPlayer, state.euchreSettings)
        )
      );

      if (!currentPlayer.human) {
        eventHandlers.addEvent(
          eventHandlers.createEvent('d', currentPlayer, 'Hand Score: ' + bidResult.handScore)
        );
      }

      const notification: PlayerNotificationAction = {
        type: getPlayerNotificationType(currentPlayer.playerNumber),
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
      setters.dispatchStateChange(EuchreGameFlow.BEGIN_BID_FOR_TRUMP, EuchreAnimationActionType.SET_ANIMATE);
    },
    [eventHandlers, getTeamColor, setters, state.euchreGame.currentPlayer, state.euchreSettings]
  );

  /** Handle the result when the player ordered trump and update the game state.
   *
   */
  const handlePlayerOrderTrumpFromBid = useCallback(() => {
    // player called trump, either by suit or telling the deal er to pick up the card.
    //setters.dispatchStateChange(EuchreGameFlow.BEGIN_ORDER_TRUMP, EuchreAnimationActionType.SET_NONE);
  }, []);

  /** Either order trump or pass bid from user selection.
   *
   */
  const handlePlayerSelectionForBid = useCallback(
    (result: BidResult) => {
      const currentPlayer = state.euchreGame.currentPlayer;
      eventHandlers.addEvent(
        eventHandlers.createEvent(
          'v',
          currentPlayer,
          'Handle bid selection.',
          undefined,
          getTeamColor(currentPlayer, state.euchreSettings)
        )
      );

      setters.setBidResult(result);
      if (result.orderTrump && (!state.euchreSettings.debugAlwaysPass || currentPlayer.human)) {
        handlePlayerOrderTrumpFromBid();
      } else {
        handlePassForBid(result);
      }
    },
    [
      eventHandlers,
      getTeamColor,
      handlePassForBid,
      handlePlayerOrderTrumpFromBid,
      setters,
      state.euchreGame.currentPlayer,
      state.euchreSettings
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

  //#endregion

  /** Shuffle and deal cards for regular game play. Starts the bidding process to determine if the dealer should pick up the flipped card
   * or if a player will name suit. */
  const beginBidForTrump = useCallback(() => {
    if (!shouldBeginBidForTrump) return;

    setters.dispatchStateChange(undefined, undefined, EuchrePauseActionType.SET_GENERAL);

    const newGame: EuchreGameInstance = { ...state.euchreGame };
    eventHandlers.addEvent(
      eventHandlers.createEvent(
        'v',
        newGame.currentPlayer,
        'Begin bid For trump.',
        undefined,
        getTeamColor(newGame.currentPlayer, state.euchreSettings)
      )
    );

    if (state.euchreGameFlow.hasSecondBiddingPassed) {
      // all users have passed. pass the deal to the next user and begin to re-deal.
      setters.dispatchStateChange(EuchreGameFlow.BEGIN_PASS_DEAL, EuchreAnimationActionType.SET_NONE);
      return;
    }

    if (newGame.currentPlayer?.human) {
      setters.dispatchStateChange(undefined, undefined, EuchrePauseActionType.SET_USER_INPUT);
      setters.setPromptValue([{ type: PromptType.BID }]); // Show prompt window for choosing trump or passing for human player.
    } else {
      const bidChoice: BidResult = determineBid(
        newGame,
        newGame.trump,
        !state.euchreGameFlow.hasFirstBiddingPassed,
        state.euchreSettings
      );

      handlePlayerSelectionForBid(bidChoice);
    }
  }, [
    determineBid,
    eventHandlers,
    getTeamColor,
    handlePlayerSelectionForBid,
    setters,
    shouldBeginBidForTrump,
    state.euchreGame,
    state.euchreGameFlow.hasFirstBiddingPassed,
    state.euchreGameFlow.hasSecondBiddingPassed,
    state.euchreSettings
  ]);

  /** Effect to animate events after the initial bid for trump. */
  useEffect(() => {
    const beginAnimationForBidForTrump = async () => {
      if (!shouldAnimateBeginBidForTrump) return;

      setters.dispatchStateChange(undefined, undefined, EuchrePauseActionType.SET_GENERAL);
      eventHandlers.addEvent(
        eventHandlers.createEvent(
          'v',
          undefined,
          'Begin animation for bid for trump.',
          undefined,
          getTeamColor(state.euchreGame.currentPlayer, state.euchreSettings)
        )
      );

      // delay for animation between players when passing bid.
      await notificationDelay(state.euchreSettings);

      setters.dispatchStateChange(
        EuchreGameFlow.END_BID_FOR_TRUMP,
        EuchreAnimationActionType.SET_NONE,
        EuchrePauseActionType.SET_NONE
      );
    };

    try {
      beginAnimationForBidForTrump();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'beginAnimationForBidForTrump');
    }
  }, [
    errorHandlers,
    eventHandlers,
    getTeamColor,
    notificationDelay,
    setters,
    shouldAnimateBeginBidForTrump,
    state.euchreGame.currentPlayer,
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

  /** Modify the game state depending on if the user named trump or passed based on player bid choice.
   *
   */
  const endBidForTrump = useCallback(() => {
    if (!shouldEndBidForTrump) return;

    const newGame: EuchreGameInstance = { ...state.euchreGame };
    const newGameFlow: EuchreGameFlowState = { ...state.euchreGameFlow };

    eventHandlers.addEvent(
      eventHandlers.createEvent(
        'v',
        undefined,
        'Begin finalize bid for trump.',
        undefined,
        getTeamColor(newGame.currentPlayer, state.euchreSettings)
      )
    );

    const biddingRoundFinished = playerEqual(newGame.dealer, newGame.currentPlayer);
    const firstRound = !state.euchreGameFlow.hasFirstBiddingPassed;

    newGameFlow.gameFlow = EuchreGameFlow.BEGIN_BID_FOR_TRUMP;
    if (biddingRoundFinished) {
      newGameFlow.hasFirstBiddingPassed = firstRound || newGameFlow.hasFirstBiddingPassed;
      newGameFlow.hasSecondBiddingPassed = !firstRound;
    }

    const rotation: EuchrePlayer[] = getPlayerRotation(newGame.gamePlayers, newGame.currentPlayer);
    newGame.currentPlayer = rotation[0];

    setters.dispatchGameFlow({ type: EuchreFlowActionType.SET_STATE, state: newGameFlow });
    setters.setEuchreGame(newGame);
  }, [
    eventHandlers,
    getPlayerRotation,
    getTeamColor,
    playerEqual,
    setters,
    shouldEndBidForTrump,
    state.euchreGame,
    state.euchreGameFlow,
    state.euchreSettings
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

    eventHandlers.addEvent(
      eventHandlers.createEvent(
        'i',
        state.euchreGame.dealer,
        'Deal was passed.',
        undefined,
        getTeamColor(state.euchreGame.dealer, state.euchreSettings)
      )
    );

    const newGame: EuchreGameInstance = { ...state.euchreGame };
    const rotation: EuchrePlayer[] = getPlayerRotation(newGame.gamePlayers, newGame.dealer);

    newGame.dealer = rotation[0];
    newGame.dealPassedCount += 1;

    setters.dispatchPlayerNotification(getPlayerNotificationForAllPassed());
    await notificationDelay(state.euchreSettings, 1);

    setters.setEuchreGame(newGame);
    setters.setPromptValue([]);
    setters.dispatchGameFlow({
      type: EuchreFlowActionType.SET_STATE,
      state: getGameStateForNextHand(state.euchreGameFlow, state.euchreSettings, newGame)
    });
    setters.dispatchStateChange(
      undefined,
      EuchreAnimationActionType.SET_NONE,
      EuchrePauseActionType.SET_NONE
    );
    setters.dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });
  }, [
    eventHandlers,
    getGameStateForNextHand,
    getPlayerNotificationForAllPassed,
    getPlayerRotation,
    getTeamColor,
    notificationDelay,
    setters,
    shouldBeginPassDeal,
    state.euchreGame,
    state.euchreGameFlow,
    state.euchreSettings
  ]);

  useEffect(() => {
    const passDeal = async () => {
      await beginPassDeal();
    };
    try {
      passDeal();
    } catch (e) {
      const error = e as Error;
      errorHandlers.onError(error, 'passDeal');
    }
  }, [beginPassDeal, errorHandlers]);
  //#endregion

  return { handleBidSubmit };
}
