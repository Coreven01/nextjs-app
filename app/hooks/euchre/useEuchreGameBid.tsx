import { EuchreFlowActionType, EuchreGameFlow, EuchreGameFlowState } from './reducers/gameFlowReducer';
import { EuchreAnimationActionType, EuchreAnimateType } from './reducers/gameAnimationFlowReducer';
import { EuchreGameState } from './useEuchreGame';
import { useCallback, useEffect } from 'react';
import { createEvent } from '@/app/lib/euchre/util';
import {
  getPlayerNotificationType,
  PlayerNotificationAction,
  PlayerNotificationActionType
} from './reducers/playerNotificationReducer';
import { BidResult, EuchreGameInstance, EuchrePlayer, PromptType } from '@/app/lib/euchre/definitions';
import UserInfo from '@/app/ui/euchre/player/user-info';
import PlayerNotification from '@/app/ui/euchre/player/player-notification';
import useGameStateLogic from './logic/useGameStateLogic';
import useGameBidLogic from './logic/useGameBidLogic';
import usePlayerData from './data/usePlayerData';
import useGameData from './data/useGameData';
import useGamePlayLogic from './logic/useGamePlayLogic';
import { v4 as uuidv4 } from 'uuid';

export default function useEuchreGameBid(state: EuchreGameState) {
  const { isGameStateValidToContinue } = useGameStateLogic();
  const { determineBid } = useGameBidLogic();
  const { getGameStateForNextHand } = useGamePlayLogic();
  const { getPlayerRotation, playerEqual, getTeamColor } = usePlayerData();
  const { notificationDelay } = useGameData();
  /**
   *
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
      <UserInfo
        className="p-2 md:text-base text-sm w-auto whitespace-nowrap shadow-lg shadow-black text-black border border-black dark:border-white dark:text-white text-center bg-white dark:bg-stone-800"
        id={id}
      >
        <div className="flex gap-2 items-center">All Players Passed</div>
      </UserInfo>
    );
    newAction.payload = infoDetail;

    return newAction;
  }, []);

  //#region Bid for Trump *************************************************************************

  /** Handle passing the bid to the next player.*/
  const handlePassForBid = useCallback(
    (bidResult: BidResult) => {
      const currentPlayer: EuchrePlayer = state.euchreGame.currentPlayer;

      state.addEvent(
        createEvent(
          'i',
          currentPlayer,
          'Passed bid.',
          undefined,
          getTeamColor(currentPlayer, state.euchreSettings)
        )
      );

      if (!currentPlayer.human) {
        state.addEvent(createEvent('d', currentPlayer, 'Hand Score: ' + bidResult.handScore));
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

      state.dispatchPlayerNotification(notification);
      state.dispatchStateChange(EuchreGameFlow.BEGIN_BID_FOR_TRUMP, EuchreAnimationActionType.SET_ANIMATE);
    },
    [getTeamColor, state]
  );

  /** Effect to animate events after the initial bid for trump. */
  useEffect(() => {
    const beginAnimationForBidForTrump = async () => {
      if (
        !isGameStateValidToContinue(
          state,
          EuchreGameFlow.BEGIN_BID_FOR_TRUMP,
          EuchreAnimateType.ANIMATE,
          state.shouldCancel,
          state.onCancel
        )
      )
        return;

      state.dispatchStateChange(EuchreGameFlow.WAIT);

      // delay for animation between players when passing bid.
      await notificationDelay(state.euchreSettings);

      state.addEvent(createEvent('v', undefined, 'End Animation for bid for trump'));
      state.dispatchStateChange(EuchreGameFlow.END_BID_FOR_TRUMP, EuchreAnimationActionType.SET_NONE);
    };

    try {
      beginAnimationForBidForTrump();
    } catch (e) {
      const error = e as Error;
      state.onError(
        error,
        EuchreGameFlow.BEGIN_BID_FOR_TRUMP,
        EuchreAnimationActionType.SET_ANIMATE,
        'beginAnimationForBidForTrump'
      );
    }
  }, [isGameStateValidToContinue, notificationDelay, state]);

  /** Handle the result when the player ordered trump and update the game state.
   *
   */
  const handlePlayerOrderTrumpFromBid = useCallback(() => {
    // player called trump, either by suit or telling the deal er to pick up the card.
    state.dispatchStateChange(EuchreGameFlow.BEGIN_ORDER_TRUMP, EuchreAnimationActionType.SET_NONE);
  }, [state]);

  /** Either order trump or pass bid from user selection.
   *
   */
  const handlePlayerSelectionForBid = useCallback(
    (result: BidResult) => {
      state.setBidResult(result);

      if (
        result.orderTrump &&
        (!state.euchreSettings.debugAlwaysPass || state.euchreGame.currentPlayer.human)
      ) {
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
        state,
        EuchreGameFlow.BEGIN_BID_FOR_TRUMP,
        EuchreAnimateType.NONE,
        state.shouldCancel,
        state.onCancel
      )
    )
      return;

    const newGame: EuchreGameInstance = { ...state.euchreGame };
    state.addEvent(createEvent('v', newGame.currentPlayer, 'Begin bid For trump.'));

    if (state.euchreGameFlow.hasSecondBiddingPassed) {
      // all users have passed. pass the deal to the next user and begin to re-deal.
      state.dispatchStateChange(EuchreGameFlow.BEGIN_PASS_DEAL, EuchreAnimationActionType.SET_NONE);
      return;
    }

    if (newGame.currentPlayer?.human) {
      state.dispatchStateChange(EuchreGameFlow.AWAIT_PROMPT);
      state.setPromptValue([{ type: PromptType.BID }]); // Show prompt window for choosing trump or passing for human player.
    } else {
      const bidChoice: BidResult = determineBid(
        newGame,
        newGame.trump,
        !state.euchreGameFlow.hasFirstBiddingPassed,
        state.euchreSettings
      );

      handlePlayerSelectionForBid(bidChoice);
    }
  }, [determineBid, handlePlayerSelectionForBid, isGameStateValidToContinue, state]);

  /** Begin bid for trump game flow.
   *
   */
  useEffect(() => {
    try {
      beginBidForTrump();
    } catch (e) {
      const error = e as Error;
      state.onError(
        error,
        EuchreGameFlow.BEGIN_BID_FOR_TRUMP,
        EuchreAnimationActionType.SET_NONE,
        'beginBidForTrump'
      );
    }
  }, [beginBidForTrump, state]);

  /** Modify the game state depending on if the user named trump or passed based on player bid choice.
   *
   */
  const endBidForTrump = useCallback(async () => {
    if (
      !isGameStateValidToContinue(
        state,
        EuchreGameFlow.END_BID_FOR_TRUMP,
        EuchreAnimateType.NONE,
        state.shouldCancel,
        state.onCancel
      )
    )
      return;

    const newGame: EuchreGameInstance = { ...state.euchreGame };
    const newGameFlow: EuchreGameFlowState = { ...state.euchreGameFlow };

    const biddingRoundFinished = playerEqual(newGame.dealer, newGame.currentPlayer);
    const firstRound = !state.euchreGameFlow.hasFirstBiddingPassed;

    newGameFlow.gameFlow = EuchreGameFlow.BEGIN_BID_FOR_TRUMP;
    if (biddingRoundFinished) {
      newGameFlow.hasFirstBiddingPassed = firstRound || newGameFlow.hasFirstBiddingPassed;
      newGameFlow.hasSecondBiddingPassed = !firstRound;
    }

    const rotation: EuchrePlayer[] = getPlayerRotation(newGame.gamePlayers, newGame.currentPlayer);
    newGame.currentPlayer = rotation[0];

    state.dispatchGameFlow({ type: EuchreFlowActionType.SET_STATE, state: newGameFlow });
    state.setEuchreGame(newGame);
  }, [getPlayerRotation, isGameStateValidToContinue, playerEqual, state]);

  /**
   *
   */
  useEffect(() => {
    try {
      endBidForTrump();
    } catch (e) {
      const error = e as Error;
      state.onError(
        error,
        EuchreGameFlow.END_BID_FOR_TRUMP,
        EuchreAnimationActionType.SET_NONE,
        'endBidForTrump'
      );
    }
  }, [endBidForTrump, state]);

  /** Submit the resulting bid from user input.
   *
   */
  const handleBidSubmit = useCallback(
    (result: BidResult) => {
      if (state.euchreGameFlow.gameFlow === EuchreGameFlow.AWAIT_PROMPT) {
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
        state,
        EuchreGameFlow.BEGIN_PASS_DEAL,
        EuchreAnimateType.NONE,
        state.shouldCancel,
        state.onCancel
      )
    )
      return;

    state.dispatchStateChange(EuchreGameFlow.WAIT);
    state.addEvent(
      createEvent(
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

    state.dispatchPlayerNotification(getPlayerNotificationForAllPassed());

    await notificationDelay(state.euchreSettings);

    state.setEuchreGame(newGame);
    state.setPromptValue([]);
    state.dispatchGameFlow({
      type: EuchreFlowActionType.SET_STATE,
      state: getGameStateForNextHand(state.euchreGameFlow, state.euchreSettings, newGame)
    });
    state.dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });
    state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_NONE });
  }, [
    getGameStateForNextHand,
    getPlayerNotificationForAllPassed,
    getPlayerRotation,
    getTeamColor,
    isGameStateValidToContinue,
    notificationDelay,
    state
  ]);

  useEffect(() => {
    const executePassDeal = async () => {
      await beginPassDeal();
    };
    try {
      executePassDeal();
    } catch (e) {
      const error = e as Error;
      state.onError(
        error,
        EuchreGameFlow.BEGIN_PASS_DEAL,
        EuchreAnimationActionType.SET_NONE,
        'executePassDeal'
      );
    }
  }, [beginPassDeal, state]);
  //#endregion

  return { handleBidSubmit };
}
