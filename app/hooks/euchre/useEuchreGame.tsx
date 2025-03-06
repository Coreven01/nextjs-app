'use client';

import CenterInfo from '@/app/ui/euchre/center-info';
import UserInfo from '@/app/ui/euchre/user-info';
import Image from 'next/image';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { CardTransformation, FadeOutOptions } from './useMoveCard';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/16/solid';
import {
  initialPlayerNotification,
  PlayerNotificationAction,
  PlayerNotificationActionType,
  playerNotificationReducer
} from './playerNotificationReducer';
import {
  EuchreGameFlow,
  GameFlowActionType,
  GameFlowState,
  gameFlowStateReducer,
  initialGameFlowState
} from './gameFlowReducer';
import {
  EuchreAnimateType,
  EuchreAnimationAnimationType,
  gameAnimationFlowReducer,
  initialGameAnimationState
} from './gameAnimationFlowReducer';
import useAnimation from '@/app/hooks/euchre/animation/useAnimation';
import {
  BidResult,
  Card,
  EuchreGameInstance,
  EuchrePlayer,
  EuchreSettings,
  EuchreTrick,
  initialGameSettings,
  Suit
} from '@/app/lib/euchre/data';
import {
  dealCardsForDealer,
  getGameStateForInitialDeal,
  initDeckForInitialDeal,
  orderTrump,
  shuffleAndDealHand
} from '@/app/lib/euchre/game-setup-logic';
import { logDebugEvent } from '@/app/lib/euchre/util';
import { getEncodedCardSvg } from '@/app/lib/euchre/card-data';
import { TIMEOUT_MODIFIER } from '@/app/lib/euchre/constants';
import { getPlayerRotation } from '@/app/lib/euchre/game';
import {
  determineCurrentWinnerForTrick,
  getGameStateForNextHand,
  playGameCard
} from '@/app/lib/euchre/game-play-logic';

const FLIPPED_CARD_ID = 'flipped-card';

export function useEuchreGame() {
  //#region Hooks to control game flow *************************************************************************
  const [shouldPromptBid, setShouldPromptBid] = useState(false);
  const [shouldPromptDiscard, setShouldPromptDiscard] = useState(false);
  const [shouldCancelGame, setCancelGame] = useState(false);

  const playerCard = useRef<Card | null>(null);
  const bidResult = useRef<BidResult | null>(null);
  const gameInstance = useRef<EuchreGameInstance | null>(null);
  const gameSettings = useRef<EuchreSettings>(initialGameSettings);

  const [playerNotification, dispatchPlayerNotification] = useReducer(
    playerNotificationReducer,
    initialPlayerNotification
  );
  const [gameFlow, dispatchGameFlow] = useReducer(gameFlowStateReducer, initialGameFlowState);
  const [gameAnimationFlow, dispatchGameAnimationFlow] = useReducer(
    gameAnimationFlowReducer,
    initialGameAnimationState
  );
  const [animationTransformation, setAnimationTransformation] = useState<CardTransformation[][]>(
    []
  );
  const fadeOutElements = useRef<FadeOutOptions[]>([]);
  const tempFadeOutElements = useRef<FadeOutOptions[]>([]);

  const {
    animateForInitialDeal,
    animateDealCardsForHand,
    animateForPlayCard,
    setFadeOutForPlayers
  } = useAnimation();

  //#endregion

  //#region Game Initiallization *************************************************************************

  const addFadeOutElements = useCallback(
    async (elements: FadeOutOptions[]): Promise<void> => {
      const maxDuration: number = elements
        .map((e) => e.fadeOutDuration)
        .reduce((acc, curr) => (curr > acc ? curr : acc), 0);
      const maxDelay: number = elements
        .map((e) => e.fadeOutDelay)
        .reduce((acc, curr) => (curr > acc ? curr : acc), 0);
      setFadeOutForPlayers(elements);

      await new Promise((resolve) => setTimeout(resolve, (maxDelay + maxDuration) * 1000));
    },
    [setFadeOutForPlayers]
  );

  const clearFadeOutElements = useCallback(() => {
    addFadeOutElements([
      { playerNumber: 1, fadeOutId: '', fadeOutDelay: 1, fadeOutDuration: 1 },
      { playerNumber: 2, fadeOutId: '', fadeOutDelay: 1, fadeOutDuration: 1 },
      { playerNumber: 3, fadeOutId: '', fadeOutDelay: 1, fadeOutDuration: 1 },
      { playerNumber: 4, fadeOutId: '', fadeOutDelay: 1, fadeOutDuration: 1 },
      { playerNumber: 'o', fadeOutId: '', fadeOutDelay: 1, fadeOutDuration: 1 }
    ]);
  }, [addFadeOutElements]);

  /** */
  const handleCancelGame = useCallback(() => {
    if (shouldCancelGame) return;

    dispatchGameFlow({ type: GameFlowActionType.SET_INIT_DEAL });
    dispatchGameAnimationFlow({
      type: EuchreAnimationAnimationType.SET_ANIMATE_NONE
    });
    dispatchPlayerNotification({ type: PlayerNotificationActionType.RESET });
    setCancelGame(true);
  }, [shouldCancelGame]);

  /**
   * Reset game and state to defaults.
   * */
  const reset = (resetForBeginGame: boolean) => {
    if (resetForBeginGame) {
      dispatchGameFlow({
        type: GameFlowActionType.UPDATE_ALL,
        payload: {
          ...initialGameFlowState,
          shouldShowDeckImages: [],
          shouldShowHandImages: [],
          shouldShowHandValues: []
        }
      });

      dispatchGameAnimationFlow({
        type: EuchreAnimationAnimationType.SET_ANIMATE_NONE
      });
    } else {
      dispatchGameAnimationFlow({
        type: EuchreAnimationAnimationType.SET_ANIMATE_DEAL_CARDS_FOR_REGULAR_PLAY
      });
    }

    dispatchPlayerNotification({
      type: PlayerNotificationActionType.RESET,
      payload: undefined
    });

    setShouldPromptBid(false);
    setShouldPromptDiscard(false);
    playerCard.current = null;
  };

  /**
   * Reset state and begin cards being dealt to determine new dealer.
   * */
  const beginNewGame = () => {
    reset(true);
    setCancelGame(false);
    createGame();
  };

  /**
   * Update the state for a new game.
   * */
  const createGame = () => {
    const newGame = initDeckForInitialDeal(shouldCancelGame);
    const newGameFlowState: GameFlowState = getGameStateForInitialDeal(
      gameFlow,
      gameSettings.current,
      newGame
    );

    newGameFlowState.gameFlow = EuchreGameFlow.BEGIN_DEAL_FOR_DEALER;
    dispatchGameFlow({
      type: GameFlowActionType.UPDATE_ALL,
      payload: newGameFlowState
    });

    gameInstance.current = newGame;
  };

  /** Deal cards to determine who the initial dealer will be for the game. First jack dealt to a user will become the initial dealer.
   *  After logic is run to determine dealer, animate the cards being dealt if turned on from the settings.
   */
  const beginDealCardsForDealer = useCallback(() => {
    if (
      gameInstance.current &&
      gameFlow.gameFlow === EuchreGameFlow.BEGIN_DEAL_FOR_DEALER &&
      gameAnimationFlow.animationType === EuchreAnimateType.ANIMATE_NONE
    ) {
      logDebugEvent('Begin deal Cards for Dealer');

      if (shouldCancelGame) {
        handleCancelGame();
        return;
      }

      const dealResult = dealCardsForDealer(gameInstance.current, gameFlow, gameSettings.current);

      if (!dealResult) throw Error('Unable to determine dealer');

      gameInstance.current.dealer = dealResult.newDealer;
      gameInstance.current.currentPlayer = dealResult.newDealer;

      dispatchGameAnimationFlow({
        type: EuchreAnimationAnimationType.SET_ANIMATE_DEAL_FOR_JACK
      });

      setAnimationTransformation([...animationTransformation, ...dealResult.transformations]);
    }
  }, [
    gameFlow,
    gameAnimationFlow.animationType,
    shouldCancelGame,
    animationTransformation,
    handleCancelGame
  ]);

  useEffect(() => {
    beginDealCardsForDealer();
  }, [beginDealCardsForDealer]);

  /** Animate dealing cards for initial dealer. When finished with animation, begin shuffle and deal for regular play. */
  useEffect(() => {
    const beginAnimationForInitDeal = async () => {
      if (
        gameInstance.current &&
        gameAnimationFlow.animationType === EuchreAnimateType.ANIMATE_DEAL_FOR_JACK
      ) {
        if (shouldCancelGame) return;

        await animateForInitialDeal(
          animationTransformation,
          gameInstance.current,
          gameInstance.current.player1
        );

        dispatchGameAnimationFlow({
          type: EuchreAnimationAnimationType.SET_ANIMATE_NONE
        });

        dispatchGameFlow({
          type: GameFlowActionType.SET_SHUFFLE_CARDS,
          payload: undefined
        });
      }
    };

    beginAnimationForInitDeal();
  }, [
    shouldCancelGame,
    gameInstance,
    animationTransformation,
    animateForInitialDeal,
    gameAnimationFlow.animationType
  ]);

  //#endregion

  //#region Shuffle and Deal for regular playthrough *************************************************************************

  /** Shuffle and deal cards for regular game play. Starts the bidding process to determine if the dealer should pick up the flipped card
   * or if a player will name suit. After deal logic is run, begin animation for dealing cards to players. */
  const beginShuffleAndDealHand = useCallback(() => {
    if (
      gameInstance.current &&
      gameFlow.gameFlow === EuchreGameFlow.SHUFFLE_CARDS &&
      gameAnimationFlow.animationType === EuchreAnimateType.ANIMATE_NONE
    ) {
      logDebugEvent('Begin Shuffle and Deal');

      if (shouldCancelGame) {
        handleCancelGame();
        return;
      }

      const shuffleResult = shuffleAndDealHand(
        gameInstance.current,
        gameSettings.current,
        shouldCancelGame
      );

      gameInstance.current = shuffleResult.game;

      if (!gameInstance.current.trump) throw Error('Trump not found after deal');

      // used for debugging
      const showAllCards = gameInstance.current.gamePlayers.filter((p) => !p.human).length === 4;
      const showCardValues = showAllCards
        ? gameInstance.current.gamePlayers.map((p) => {
            return { player: p, value: true };
          })
        : [];

      const newGameState: GameFlowState = {
        ...gameFlow,
        hasFirstBiddingPassed: false,
        hasSecondBiddingPassed: false,
        shouldShowHandValues: showCardValues,
        gameFlow: EuchreGameFlow.DEAL_CARDS
      };

      dispatchPlayerNotification({
        type: PlayerNotificationActionType.RESET
      });

      // display trump card for bidding in the center of the table.
      dispatchPlayerNotification({
        type: PlayerNotificationActionType.UPDATE_CENTER,
        payload: getFaceUpCard(FLIPPED_CARD_ID, gameInstance.current.trump)
      });

      dispatchGameFlow({
        type: GameFlowActionType.UPDATE_ALL,
        payload: newGameState
      });

      dispatchGameAnimationFlow({
        type: EuchreAnimationAnimationType.SET_ANIMATE_DEAL_CARDS_FOR_REGULAR_PLAY
      });

      setAnimationTransformation([...animationTransformation, ...shuffleResult.transformations]);
    }
  }, [
    gameFlow,
    gameAnimationFlow.animationType,
    shouldCancelGame,
    animationTransformation,
    handleCancelGame
  ]);

  useEffect(() => {
    beginShuffleAndDealHand();
  }, [beginShuffleAndDealHand]);

  /**  */
  useEffect(() => {
    const beginAnimationForDealCards = async () => {
      if (
        gameInstance.current &&
        gameFlow.gameFlow === EuchreGameFlow.DEAL_CARDS &&
        gameAnimationFlow.animationType === EuchreAnimateType.ANIMATE_DEAL_CARDS_FOR_REGULAR_PLAY
      ) {
        if (shouldCancelGame) {
          handleCancelGame();
          return;
        }

        await animateDealCardsForHand(gameInstance.current);

        dispatchGameAnimationFlow({
          type: EuchreAnimationAnimationType.SET_ANIMATE_NONE
        });

        dispatchGameFlow({
          type: GameFlowActionType.SET_BID_FOR_TRUMP
        });
      }
    };

    beginAnimationForDealCards();
  }, [
    shouldCancelGame,
    gameInstance,
    animateDealCardsForHand,
    gameFlow.gameFlow,
    gameAnimationFlow.animationType,
    handleCancelGame
  ]);

  //#endregion

  /** Modify the game state depending on if the user named trump or passed based on player bid choice. */
  const handleBidResult = useCallback(async () => {
    if (
      gameInstance.current &&
      gameFlow.gameFlow === EuchreGameFlow.HANDLE_BID &&
      gameAnimationFlow.animationType === EuchreAnimateType.ANIMATE_NONE
    ) {
      if (shouldCancelGame) {
        handleCancelGame();
        return;
      }
      if (!gameInstance.current) {
        throw Error('Game not found - Bid submission.');
      }

      if (!gameInstance.current.currentPlayer) {
        throw Error('Current player not found - Bid submission.');
      }

      const roundFinished = gameInstance.current.dealer === gameInstance.current.currentPlayer;
      const firstRound = !gameFlow.hasFirstBiddingPassed;

      if (
        bidResult.current &&
        (bidResult.current.orderTrump || bidResult.current.calledSuit) &&
        !gameSettings.current.debugAlwaysPass
      ) {
        // player called trump, either by suit or telling the deal er to pick up the card.
        dispatchGameFlow({ type: GameFlowActionType.SET_ORDER_TRUMP });
        dispatchGameAnimationFlow({ type: EuchreAnimationAnimationType.SET_ANIMATE_NONE });
        //beginOrderTrump(bidResult);
      } else {
        // player passed

        const newGameFlow: GameFlowState = { ...gameFlow };

        if (roundFinished) {
          newGameFlow.hasFirstBiddingPassed = firstRound || newGameFlow.hasFirstBiddingPassed;
          newGameFlow.hasSecondBiddingPassed = !firstRound;
        }

        const playerElementId = gameInstance.current.currentPlayer.generateElementId();
        const newPlayerInfoState = getPlayerStateForBidding(
          playerElementId,
          gameInstance.current.currentPlayer,
          'p',
          null
        );

        const rotation = getPlayerRotation(
          gameInstance.current.gamePlayers,
          gameInstance.current.currentPlayer
        );

        gameInstance.current.currentPlayer = rotation[0];

        dispatchPlayerNotification(newPlayerInfoState);
        dispatchGameFlow({
          type: GameFlowActionType.UPDATE_ALL,
          payload: newGameFlow
        });
        dispatchGameAnimationFlow({
          type: EuchreAnimationAnimationType.SET_ANIMATE_HANDLE_BID
        });

        tempFadeOutElements.current.push({
          playerNumber: gameInstance.current.currentPlayer.playerNumber,
          fadeOutId: playerElementId,
          fadeOutDelay: 1,
          fadeOutDuration: 1
        });

        if (roundFinished && !newGameFlow.hasSecondBiddingPassed) {
          tempFadeOutElements.current.push({
            playerNumber: 'o',
            fadeOutId: FLIPPED_CARD_ID,
            fadeOutDelay: 1,
            fadeOutDuration: 1
          });
        }
      }
    }
  }, [gameAnimationFlow.animationType, gameFlow, handleCancelGame, shouldCancelGame]);

  useEffect(() => {
    handleBidResult();
  }, [handleBidResult]);

  useEffect(() => {
    const beginAnimationForHandleBid = async () => {
      if (
        gameInstance.current &&
        gameFlow.gameFlow === EuchreGameFlow.HANDLE_BID &&
        gameAnimationFlow.animationType === EuchreAnimateType.ANIMATE_HANDLE_BID
      ) {
        logDebugEvent('Begin Animation for Handle Bid');
        if (shouldCancelGame) {
          handleCancelGame();
          return;
        }

        await addFadeOutElements(tempFadeOutElements.current);
        tempFadeOutElements.current = [];

        dispatchGameAnimationFlow({ type: EuchreAnimationAnimationType.SET_ANIMATE_NONE });
        dispatchGameFlow({ type: GameFlowActionType.SET_BID_FOR_TRUMP });
      }
    };

    beginAnimationForHandleBid();
  }, [
    addFadeOutElements,
    gameAnimationFlow.animationType,
    gameFlow.gameFlow,
    handleCancelGame,
    shouldCancelGame
  ]);

  //   /** All players passed during the bidding process. Re-initialize for deal for the next user in the rotation.  */
  const handlePassDeal = useCallback(async () => {
    logDebugEvent(
      'All players passed first and second round. Update state to pass the deal to the next user.'
    );

    if (!gameInstance.current?.dealer) throw Error('Game dealer not found - Pass deal.');

    const rotation = getPlayerRotation(
      gameInstance.current.gamePlayers,
      gameInstance.current.dealer
    );
    gameInstance.current.resetForNewDeal();
    gameInstance.current.dealer = rotation[0];

    dispatchPlayerNotification(getPlayerStateForAllPassed(gameInstance.current.dealer));

    // todo: notify all users have passed.
    await new Promise((resolve) => setTimeout(resolve, 2000 * TIMEOUT_MODIFIER));

    reset(false);
    const newGameFlow = getGameStateForInitialDeal(
      gameFlow,
      gameSettings.current,
      gameInstance.current
    );
    newGameFlow.gameFlow = EuchreGameFlow.SHUFFLE_CARDS;

    dispatchGameFlow({
      type: GameFlowActionType.UPDATE_ALL,
      payload: newGameFlow
    });

    dispatchPlayerNotification({
      type: PlayerNotificationActionType.RESET
    });

    dispatchGameAnimationFlow({ type: EuchreAnimationAnimationType.SET_ANIMATE_NONE });

    clearFadeOutElements();
  }, [clearFadeOutElements, gameFlow]);

  /** Shuffle and deal cards for regular game play. Starts the bidding process to determine if the dealer should pick up the flipped card
   * or if a player will name suit. */
  const beginBidForTrump = useCallback(async () => {
    if (
      gameInstance.current &&
      gameFlow.gameFlow === EuchreGameFlow.BID_FOR_TRUMP &&
      gameAnimationFlow.animationType === EuchreAnimateType.ANIMATE_NONE
    ) {
      logDebugEvent(
        'Begin Bid For Trump - Player: ',
        gameInstance.current.currentPlayer?.name,
        gameInstance.current.currentPlayer
      );

      if (shouldCancelGame) {
        handleCancelGame();
        return;
      }

      if (!gameInstance.current.trump) throw Error('Trump not found.');

      if (!gameInstance.current.currentPlayer) throw Error('Player not found.');

      if (gameFlow.hasSecondBiddingPassed) {
        // all users have passed. pass the deal to the next user and begin to re-deal.
        //alert("all pass deal");
        await handlePassDeal();
        //handleCancelGame();
        return;
      }

      dispatchGameFlow({ type: GameFlowActionType.SET_HANDLE_BID });

      if (gameInstance.current.currentPlayer?.human) {
        setShouldPromptBid(true); // Show prompt window for choosing trump or passing for human player.
      } else {
        const computerChoice = gameInstance.current.currentPlayer.determineBid(
          gameInstance.current,
          gameInstance.current.trump,
          gameFlow.hasFirstBiddingPassed
        );
        // short delay to simulate that the computer is making a decision.
        // if (!shouldCancelGame)
        //   await new Promise((resolve) => setTimeout(resolve, 1000 * TIMEOUT_MODIFIER));

        //await handleBidResult(computerChoice);
        bidResult.current = computerChoice;
      }
    }
  }, [
    gameAnimationFlow.animationType,
    gameFlow.gameFlow,
    gameFlow.hasFirstBiddingPassed,
    gameFlow.hasSecondBiddingPassed,
    handleCancelGame,
    handlePassDeal,
    shouldCancelGame
  ]);

  useEffect(() => {
    beginBidForTrump();
  }, [beginBidForTrump]);

  //   /** Submit the resulting bid from user input. */
  const handleBidSubmit = (result: BidResult) => {
    //     handleBidResult(result);
    //     setShouldPromptBid(false);
  };

  //   /** Player has ordered trump either by naming suit or telling the dealer to pick up the flipped card. */
  const beginOrderTrump = useCallback(async () => {
    if (
      gameInstance.current &&
      gameFlow.gameFlow === EuchreGameFlow.ORDER_TRUMP &&
      gameAnimationFlow.animationType === EuchreAnimateType.ANIMATE_NONE
    ) {
      logDebugEvent('Trump ordered up. Player: ', gameInstance.current?.currentPlayer?.name);

      if (!gameInstance.current) throw new Error('Game not found');

      if (!bidResult.current) throw new Error('Bid result not found');

      gameInstance.current = orderTrump(gameInstance.current, bidResult.current);

      if (!gameInstance.current.dealer) throw Error('Dealer not found - Order Trump.');

      if (!gameInstance.current.maker) throw Error('Maker not found - Order Trump.');

      const orderType = bidResult.current.calledSuit ? 'n' : 'o';
      const playerElementId: string = gameInstance.current.maker.generateElementId();
      const newPlayerInfoState: PlayerNotificationAction = getPlayerStateForBidding(
        playerElementId,
        gameInstance.current.maker,
        orderType,
        bidResult.current.calledSuit
      );

      dispatchPlayerNotification(newPlayerInfoState);
      const option: FadeOutOptions = {
        playerNumber: gameInstance.current.maker.playerNumber,
        fadeOutId: playerElementId,
        fadeOutDelay: 1,
        fadeOutDuration: 1
      };
      tempFadeOutElements.current.push(option);

      dispatchGameAnimationFlow({ type: EuchreAnimationAnimationType.SET_ANIMATE_ORDER_TRUMP });
    }
  }, [gameAnimationFlow.animationType, gameFlow.gameFlow]);

  useEffect(() => {
    beginOrderTrump();
  }, [beginOrderTrump]);

  useEffect(() => {
    const beginAnimationOrderTrump = async () => {
      if (
        gameInstance.current &&
        gameFlow.gameFlow === EuchreGameFlow.ORDER_TRUMP &&
        gameAnimationFlow.animationType === EuchreAnimateType.ANIMATE_ORDER_TRUMP
      ) {
        logDebugEvent('Begin Animation for Order Trump');

        if (shouldCancelGame) {
          handleCancelGame();
          return;
        }

        if (!gameInstance.current?.dealer) throw new Error('Game dealer not found');

        await addFadeOutElements(tempFadeOutElements.current);
        tempFadeOutElements.current = [];
        //await new Promise((resolve) => setTimeout(resolve, 2000 * TIMEOUT_MODIFIER));

        if (gameInstance.current.dealer.human) {
          setShouldPromptDiscard(true);
        } else {
          gameInstance.current.dealer.discard(gameInstance.current);
          dispatchGameFlow({ type: GameFlowActionType.SET_PLAY_HAND });

          clearFadeOutElements();

          dispatchGameFlow({ type: GameFlowActionType.SET_PLAY_HAND });
          dispatchGameAnimationFlow({ type: EuchreAnimationAnimationType.SET_ANIMATE_NONE });
        }
      }
    };

    beginAnimationOrderTrump();
  }, [
    addFadeOutElements,
    clearFadeOutElements,
    gameAnimationFlow.animationType,
    gameFlow.gameFlow,
    handleCancelGame,
    shouldCancelGame
  ]);

  //   /** Proxy handler to animate playing the card for the player's choice before updating the state with the choice and result. */
  useEffect(() => {
    if (
      gameInstance.current &&
      gameFlow.gameFlow === EuchreGameFlow.PLAY_HAND &&
      gameAnimationFlow.animationType === EuchreAnimateType.ANIMATE_PLAY_CARDS
    ) {
      dispatchGameAnimationFlow({ type: EuchreAnimationAnimationType.SET_ANIMATE_NONE });
      dispatchGameFlow({ type: GameFlowActionType.SET_HANDLE_PLAY_CARD });
    }
  }, [gameAnimationFlow.animationType, gameFlow.gameFlow]);

  //   /** Regualr play for the game for winning tricks. Each player will play a card to determine the winner of the trick. If human player,
  //    * wait for user to select a card, otherwise select a card for AI player.
  //    */
  const beginPlayCard = useCallback(() => {
    if (
      gameInstance.current &&
      gameFlow.gameFlow === EuchreGameFlow.PLAY_HAND &&
      gameAnimationFlow.animationType === EuchreAnimateType.ANIMATE_NONE
    ) {
      logDebugEvent('Begin Play Card - Player: ', gameInstance.current?.currentPlayer);

      if (shouldCancelGame) return;

      if (!gameInstance.current?.trump) throw Error('Trump not found.');

      if (!gameInstance.current?.currentPlayer) throw Error('Player not found.');

      if (!gameInstance.current?.currentTrick) throw Error('Game Trick not found');

      if (gameInstance.current.currentTrick.cardsPlayed.length === 4) {
        throw Error('Invalid trick');
      }

      // if (gameInstance.current.currentTrick.cardsPlayed.length === 0) {
      //   await new Promise((resolve) => setTimeout(resolve, 2000 * TIMEOUT_MODIFIER));
      //   dispatchUpdatePlayerInfoState({
      //     type: PlayerInfoActionType.SET_ALL,
      //     payload: initialPlayerGameInfo
      //   });
      // }

      if (gameInstance.current.currentPlayer?.human) {
      } else {
        const computerChoice = gameInstance.current.currentPlayer.determineCardToPlay(
          gameInstance.current
        );
        playerCard.current = computerChoice;
        dispatchGameAnimationFlow({ type: EuchreAnimationAnimationType.SET_ANIMATE_PLAY_CARDS });
      }
    }
  }, [gameFlow.gameFlow, gameAnimationFlow.animationType, shouldCancelGame]);

  useEffect(() => {
    beginPlayCard();
  }, [beginPlayCard]);

  const handlePlayCard = useCallback(async () => {
    if (
      gameInstance.current &&
      gameFlow.gameFlow === EuchreGameFlow.HANDLE_PLAY_CARD &&
      gameAnimationFlow.animationType === EuchreAnimateType.ANIMATE_NONE
    ) {
      logDebugEvent('Handle Play Card - Card: ', playerCard);

      if (!gameInstance.current?.currentPlayer) throw Error('Game not found - Play card.');

      if (!playerCard.current) throw Error('Played card not found');

      gameInstance.current = playGameCard(
        gameInstance.current.currentPlayer,
        playerCard.current,
        gameInstance.current
      );

      if (!gameInstance.current?.currentPlayer) throw Error('Player not found.');

      if (!gameInstance.current?.trump) throw Error('Trump card not found.');

      const rotation = getPlayerRotation(
        gameInstance.current.gamePlayers,
        gameInstance.current.currentPlayer,
        gameInstance.current.playerSittingOut
      );
      const currentRound = gameInstance.current.currentTrick?.round ?? 1;
      // const newPlayerInfoState: PlayerInfoAction = getPlayerStateForPlayedCard(
      //   playerCard,
      //   gameInstance.current.currentPlayer,
      //   playerInfoState
      // );
      // dispatchUpdatePlayerInfoState(newPlayerInfoState);

      if (
        gameInstance.current.currentTrick &&
        gameInstance.current.currentTrick.cardsPlayed.length === rotation.length
      ) {
        const trickWinner = determineCurrentWinnerForTrick(
          gameInstance.current.trump,
          gameInstance.current.currentTrick
        );
        gameInstance.current.currentTrick.playerWon = trickWinner.card?.player;

        if (gameInstance.current.currentRoundTricks.length < 5) {
          gameInstance.current.currentRoundTricks.push(new EuchreTrick(currentRound));
          gameInstance.current.currentPlayer = trickWinner.card?.player;
        }
      } else {
        gameInstance.current.currentPlayer = rotation[0];
      }

      if (
        gameInstance.current.currentRoundTricks.length === 5 &&
        gameInstance.current.currentRoundTricks.filter((t) => t.playerWon !== undefined).length ===
          5
      ) {
        // todo: display round winner.
        await new Promise((resolve) => setTimeout(resolve, 2000 * TIMEOUT_MODIFIER));

        gameInstance.current.gameTricks.push(gameInstance.current.getHandResult());
        gameInstance.current.currentRoundTricks = [];
        dispatchGameFlow({
          type: GameFlowActionType.UPDATE_ALL,
          payload: getGameStateForNextHand(gameFlow, gameSettings.current, gameInstance.current)
        });
        dispatchGameAnimationFlow({ type: EuchreAnimationAnimationType.SET_ANIMATE_NONE });
        //   dispatchUpdatePlayerInfoState({
        //     type: PlayerInfoActionType.SET_ALL,
        //     payload: initialPlayerGameInfo
        //   });
        // } else {
        //   dispatchUpdateGameState({
        //     type: GameActionType.SET_ANIMATE_NONE,
        //     payload: gameState
        //   });
      } else {
        dispatchGameFlow({ type: GameFlowActionType.SET_PLAY_HAND });
        dispatchGameAnimationFlow({ type: EuchreAnimationAnimationType.SET_ANIMATE_NONE });
      }
    }
  }, [gameFlow, gameAnimationFlow.animationType]);

  useEffect(() => {
    handlePlayCard();
  }, [handlePlayCard]);

  //   useEffect(() => {
  //     const beginAnimationPlayCard = async () => {
  //       if (
  //         !shouldCancelGame &&
  //         gameInstance &&
  //         gameState.animationType === EuchreAnimateType.ANIMATE_PLAY_CARDS
  //       ) {
  //         await animateForPlayCard(gameInstance);
  //         await handlePlayCard();
  //       }
  //     };

  //     beginAnimationPlayCard();
  //   }, [gameState, shouldCancelGame, gameInstance, handlePlayCard]);

  //   /** Used for debugging. Attempt to save the state again to restart effects. */
  const resaveGameState = () => {
    //     if (gameInstance) setGame(gameInstance.shallowCopy());
  };

  //   /** Prompt each player if they choose to order trump/pick suit after initial deal. */
  //   const bidForTrump = async () => {
  //     logDebugEvent("Begin bidForTrump - Player: ", gameInstance?.currentPlayer);

  //     if (shouldCancelGame) return;

  //     if (!gameInstance) throw Error("Game not found - Bid for Trump.");

  //     if (!gameInstance?.trump) throw Error("Trump not found.");

  //     if (!gameInstance?.currentPlayer) throw Error("Player not found.");

  //     if (gameState.hasSecondBiddingPassed) {
  //       // all users have passed. pass the deal to the next user.
  //       handlePassDeal();
  //       return;
  //     }

  //     if (gameInstance.currentPlayer?.human) {
  //       setShouldPromptBid(true); // Show prompt window for choosing trump or passing for human player.
  //     } else {
  //       const computerChoice = gameInstance.currentPlayer.determineBid(
  //         gameInstance,
  //         gameInstance.trump,
  //         gameState.hasFirstBiddingPassed,
  //       );
  //       //logBidResult(game, computerChoice);

  //       // short delay to simulate that the computer is making a decision.
  //       if (!shouldCancelGame)
  //         await new Promise((resolve) =>
  //           setTimeout(resolve, 1000 * TIMEOUT_MODIFIER),
  //         );

  //       handleBidResult(computerChoice);
  //     }
  //   };

  //   /** Submit the resulting discard from user input. */
  const handleDiscardSubmit = (card: Card) => {
    //     //handleBidResult(result);
    //     //setShouldPromptBid(false);
    //     throw Error("not implemented");
  };

  //   /** Regualr play for the game for winning tricks. Each player will play a card to determine the winner of the trick. */
  //   const playCard = async () => {
  //     logDebugEvent("Begin playGame - Player: ", gameInstance?.currentPlayer);

  //     const newGame = gameInstance?.shallowCopy();

  //     if (shouldCancelGame) return;

  //     if (!newGame) throw Error("Game not found - Bid for Trump.");

  //     if (!newGame?.trump) throw Error("Trump not found.");

  //     if (!newGame?.currentPlayer) throw Error("Player not found.");

  //     if (!newGame?.currentTrick) throw Error("Game Trick not found");

  //     if (newGame.currentTrick.cardsPlayed.length === 4) {
  //       return;
  //     }

  //     if (newGame.currentRoundTricks.length === 5) {
  //       return;
  //     }

  //     if (newGame.currentPlayer?.human) {
  //     } else {
  //       const computerChoice = newGame.currentPlayer.determineCardToPlay(newGame);
  //       //handlePlayCard(newGame.currentPlayer, computerChoice);
  //       //await new Promise((resolve) => setTimeout(resolve, 1000 * TIMEOUT_MODIFIER));
  //       //newGame.currentTrick.cardsPlayed
  //     }
  //   };

  //#region Animation - can be enabled/disabled by game settings.

  //#endregion

  const handleSettingsChange = (settings: EuchreSettings) => {
    gameSettings.current = settings;
  };

  /** Reset to view settings */
  const handleResetGame = () => {
    setCancelGame(true);
    reset(true);
    gameInstance.current = null;
  };

  return {
    gameInstance,
    gameFlow,
    gameAnimationFlow,
    playerNotification,
    shouldPromptBid,
    shouldPromptDiscard,
    gameSettings,
    beginNewGame,
    handleBidSubmit,
    handleResetGame,
    handleSettingsChange,
    handleCancelGame,
    handleDiscardSubmit,
    resaveGameState
  };
}

const getFaceUpCard = (id: string, card: Card) => {
  return (
    <CenterInfo id={id} className="flex items-center justify-center">
      <Image
        className={`contain`}
        quality={100}
        width={75}
        height={112.5}
        src={getEncodedCardSvg(card, 'center')}
        alt="Game Card"
      />
    </CenterInfo>
  );
};

// /** Return a new state to provide a visual element that the user either passed or ordered trump. */
const getPlayerStateForBidding = (
  id: string,
  player: EuchrePlayer,
  info: 'p' | 'o' | 'n',
  namedSuit: Suit | null
): PlayerNotificationAction => {
  const newAction: PlayerNotificationAction = {
    type: PlayerNotificationActionType.UPDATE_PLAYER1,
    payload: undefined
  };
  const icon: React.ReactNode =
    info === 'p' ? (
      <XCircleIcon className="min-h-[18px] max-h-[20px]" />
    ) : (
      <CheckCircleIcon className="min-h-[18px] max-h-[20px]" />
    );
  let messageDetail: string;

  switch (info) {
    case 'p':
      messageDetail = 'Pass';
      break;
    case 'o':
      messageDetail = 'Pick Up';
      break;
    case 'n':
      messageDetail = 'Calling ' + namedSuit;
      break;
  }

  const infoDetail = (
    <UserInfo id={id} key={`${id}-${Math.floor(Math.random() * 1000)}`}>
      <div className="flex gap-2 items-center">
        {icon}
        {messageDetail}
      </div>
    </UserInfo>
  );

  switch (player.playerNumber) {
    case 1:
      newAction.type = PlayerNotificationActionType.UPDATE_PLAYER1;
      newAction.payload = infoDetail;
      break;
    case 2:
      newAction.type = PlayerNotificationActionType.UPDATE_PLAYER2;
      newAction.payload = infoDetail;
      break;
    case 3:
      newAction.type = PlayerNotificationActionType.UPDATE_PLAYER3;
      newAction.payload = infoDetail;
      break;
    case 4:
      newAction.type = PlayerNotificationActionType.UPDATE_PLAYER4;
      newAction.payload = infoDetail;
      break;
  }

  return newAction;
};

// const getPlayerStateForPlayedCard = (
//   card: Card,
//   player: EuchrePlayer,
//   playerInfoState: PlayerGameInfoState,
// ) => {
//   const newAction: PlayerInfoAction = {
//     type: PlayerInfoActionType.UPDATE_PLAYER1,
//     payload: { ...playerInfoState },
//   };
//   const infoDetail = (
//     <UserInfo
//       id={card.generateElementId()}
//       key={`${card.generateElementId()}-${Math.floor(Math.random() * 1000)}`}
//     >
//       <div className="flex gap-2 items-center">
//         <Image
//           className={`contain`}
//           quality={100}
//           width={card.getDisplayWidth(player.location)}
//           height={card.getDisplayHeight(player.location)}
//           src={getEncodedCardSvg(card, player.location)}
//           alt="Game Card"
//         />
//       </div>
//     </UserInfo>
//   );

//   switch (player.playerNumber) {
//     case 1:
//       newAction.type = PlayerInfoActionType.UPDATE_PLAYER1;
//       newAction.payload.player1GameInfo = infoDetail;
//       break;
//     case 2:
//       newAction.type = PlayerInfoActionType.UPDATE_PLAYER2;
//       newAction.payload.player2GameInfo = infoDetail;
//       break;
//     case 3:
//       newAction.type = PlayerInfoActionType.UPDATE_PLAYER3;
//       newAction.payload.player3GameInfo = infoDetail;
//       break;
//     case 4:
//       newAction.type = PlayerInfoActionType.UPDATE_PLAYER4;
//       newAction.payload.player4GameInfo = infoDetail;
//       break;
//   }

//   return newAction;
// };

const getPlayerStateForAllPassed = (player: EuchrePlayer) => {
  const newAction: PlayerNotificationAction = {
    type: PlayerNotificationActionType.UPDATE_CENTER,
    payload: undefined
  };
  const infoDetail = (
    <UserInfo
      id={player.generateElementId()}
      key={`${player.generateElementId()}-${Math.floor(Math.random() * 1000)}`}
    >
      <div className="flex gap-2 items-center">All Players Passed</div>
    </UserInfo>
  );
  newAction.payload = infoDetail;

  return newAction;
};
