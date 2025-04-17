import { EuchreFlowActionType, EuchreGameFlow, EuchreGameFlowState } from './reducers/gameFlowReducer';
import { EuchreAnimationActionType, EuchreAnimateType } from './reducers/gameAnimationFlowReducer';
import { EuchreErrorState, EuchreGameState } from './useEuchreGame';
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

export default function useEuchreGameBid(
  state: EuchreGameState,
  errorState: EuchreErrorState,
  onReset: (value: boolean) => void
) {
  const { isGameStateValidToContinue, generateElementId } = useGameStateLogic();
  const { determineBid } = useGameBidLogic();
  const { getGameStateForNextHand } = useGamePlayLogic();
  const { getPlayerRotation, playerEqual } = usePlayerData();
  const { incrementSpeed } = useGameData();

  /**
   *
   * @param player
   * @returns
   */
  const getPlayerNotificationForAllPassed = useCallback(
    (player: EuchrePlayer) => {
      const newAction: PlayerNotificationAction = {
        type: PlayerNotificationActionType.UPDATE_CENTER,
        payload: undefined
      };
      const id = generateElementId();
      const infoDetail = (
        <UserInfo
          className="p-2 md:text-base text-sm w-auto whitespace-nowrap shadow-lg shadow-black text-black border border-black dark:border-white dark:text-white text-center bg-white dark:bg-stone-800"
          id={id}
          key={id}
        >
          <div className="flex gap-2 items-center">All Players Passed</div>
        </UserInfo>
      );
      newAction.payload = infoDetail;

      return newAction;
    },
    [generateElementId]
  );

  //#region Bid for Trump *************************************************************************

  /** Handle passing the bid to the next player.*/
  const handlePassForBid = useCallback(
    (bidResult: BidResult) => {
      const newGame = state.euchreGame;
      if (!newGame) throw new Error();

      state.addEvent(createEvent('i', state.euchreSettings, newGame.currentPlayer, 'Player passed bid.'));

      if (!newGame.currentPlayer.human) {
        state.addEvent(
          createEvent('d', state.euchreSettings, newGame.currentPlayer, 'Hand Score: ' + bidResult.handScore)
        );
      }

      const biddingRoundFinished = playerEqual(newGame.dealer, newGame.currentPlayer);
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
    [playerEqual, state]
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
      await new Promise((resolve) => setTimeout(resolve, state.euchreSettings.notificationSpeed));

      state.addEvent(createEvent('v', state.euchreSettings, undefined, 'End Animation for bid for trump'));
      state.dispatchGameAnimationFlow({ type: EuchreAnimationActionType.SET_ANIMATE_NONE });
      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_END_BID_FOR_TRUMP });
    };

    try {
      beginAnimationForBidForTrump();
    } catch (e) {
      const error = e as Error;

      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_ERROR });
      errorState.setErrorState({
        time: new Date(),
        id: uuidv4(),
        message: error ? error.message : 'Unknown error in beginAnimationForBidForTrump',
        gameFlow: EuchreFlowActionType.SET_BEGIN_BID_FOR_TRUMP,
        animationType: EuchreAnimationActionType.SET_ANIMATE_BEGIN_BID_FOR_TRUMP
      });
    }
  }, [errorState, isGameStateValidToContinue, state]);

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

    const newGame: EuchreGameInstance | null = state.euchreGame ? { ...state.euchreGame } : null;
    if (!newGame) throw Error('Game not found for bid for trump.');

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
      const computerChoice: BidResult = determineBid(
        newGame,
        newGame.trump,
        !state.euchreGameFlow.hasFirstBiddingPassed,
        state.euchreSettings
      );
      handlePlayerSelectionForBid(computerChoice);
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

      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_ERROR });
      errorState.setErrorState({
        time: new Date(),
        id: uuidv4(),
        message: error ? error.message : 'Unknown error in beginBidForTrump',
        gameFlow: EuchreFlowActionType.SET_BEGIN_BID_FOR_TRUMP,
        animationType: EuchreAnimationActionType.SET_ANIMATE_NONE
      });
    }
  }, [beginBidForTrump, errorState, state]);

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

    const newGame: EuchreGameInstance | null = state.euchreGame ? { ...state.euchreGame } : null;
    if (!newGame) throw Error('Game not found for end bid for trump.');

    const biddingRoundFinished = playerEqual(newGame.dealer, newGame.currentPlayer);
    const firstRound = !state.euchreGameFlow.hasFirstBiddingPassed;
    const newGameFlow: EuchreGameFlowState = { ...state.euchreGameFlow };

    newGameFlow.gameFlow = EuchreGameFlow.BEGIN_BID_FOR_TRUMP;
    if (biddingRoundFinished) {
      newGameFlow.hasFirstBiddingPassed = firstRound || newGameFlow.hasFirstBiddingPassed;
      newGameFlow.hasSecondBiddingPassed = !firstRound;
    }

    const rotation: EuchrePlayer[] = getPlayerRotation(newGame.gamePlayers, newGame.currentPlayer);
    newGame.currentPlayer = rotation[0];

    state.dispatchGameFlow({ type: EuchreFlowActionType.UPDATE_ALL, payload: newGameFlow });
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

      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_ERROR });
      errorState.setErrorState({
        time: new Date(),
        id: uuidv4(),
        message: error ? error.message : 'Unknown error in endBidForTrump',
        gameFlow: EuchreFlowActionType.SET_END_BID_FOR_TRUMP,
        animationType: EuchreAnimationActionType.SET_ANIMATE_NONE
      });
    }
  }, [endBidForTrump, errorState, state]);

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

    const newGame: EuchreGameInstance | null = state.euchreGame ? { ...state.euchreGame } : null;
    if (!newGame) throw Error('Game not found for end bid for trump.');

    const rotation: EuchrePlayer[] = getPlayerRotation(newGame.gamePlayers, newGame.dealer);
    newGame.dealer = rotation[0];
    newGame.dealPassedCount += 1;

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
  }, [
    getGameStateForNextHand,
    getPlayerNotificationForAllPassed,
    getPlayerRotation,
    incrementSpeed,
    isGameStateValidToContinue,
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

      state.dispatchGameFlow({ type: EuchreFlowActionType.SET_ERROR });
      errorState.setErrorState({
        time: new Date(),
        id: uuidv4(),
        message: error ? error.message : 'Unknown error in beginPassDeal',
        gameFlow: EuchreFlowActionType.SET_BEGIN_PASS_DEAL,
        animationType: EuchreAnimationActionType.SET_ANIMATE_NONE
      });
    }
  }, [beginPassDeal, errorState, state]);
  //#endregion

  return { handleBidSubmit };
}
