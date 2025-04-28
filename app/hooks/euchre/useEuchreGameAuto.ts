import { EuchreGameFlowState, gameFlowStateReducer, INIT_GAME_FLOW_STATE } from './reducers/gameFlowReducer';
import { BidResult, Card } from '@/app/lib/euchre/definitions/definitions';
import { logDebugError } from '@/app/lib/euchre/util';
import useGameSetupLogic from './logic/useGameSetupLogic';
import useGameBidLogic from './logic/useGameBidLogic';
import usePlayerData from './data/usePlayerData';
import useGameData from './data/useGameData';
import useGamePlayLogic from './logic/useGamePlayLogic';
import { useReducer, useState } from 'react';
import { INIT_PLAYER_NOTIFICATION, playerNotificationReducer } from './reducers/playerNotificationReducer';
import { gameAnimationFlowReducer, INIT_GAME_ANIMATION_STATE } from './reducers/gameAnimationFlowReducer';
import {
  EuchreCard,
  EuchreGameInstance,
  EuchreSettings
} from '../../lib/euchre/definitions/game-state-definitions';
import { useEventLog } from './useEventLog';

/**  */
export default function useEuchreGameAuto() {
  const { createEvent } = useEventLog();
  const [euchreGame, setEuchreGame] = useState<EuchreGameInstance | null>(null);
  const [playedCard, setPlayedCard] = useState<Card | null>(null);
  const [playerNotification, dispatchPlayerNotification] = useReducer(playerNotificationReducer, {
    ...INIT_PLAYER_NOTIFICATION
  });

  const [euchreGameFlow, dispatchEuchreGameFlow] = useReducer(gameFlowStateReducer, {
    ...INIT_GAME_FLOW_STATE
  });
  const [gameAnimationFlow, dispatchGameAnimationFlow] = useReducer(gameAnimationFlowReducer, {
    ...INIT_GAME_ANIMATION_STATE
  });

  const { initDeckForInitialDeal, dealCardsForDealer, shuffleAndDealHand, createTrick } = useGameSetupLogic();
  const { determineBid, determineDiscard, orderTrump } = useGameBidLogic();
  const { getPlayerRotation, discard, playerEqual } = usePlayerData();
  const { determineCardToPlay } = useGamePlayLogic();
  const {
    teamPoints,
    isHandFinished,
    isTrickFinished,
    updateIfHandOver,
    updateIfTrickOver,
    playerSittingOut
  } = useGameData();

  const dealAndBid = (
    game: EuchreGameInstance,
    gameSetting: EuchreSettings
  ): { game: EuchreGameInstance; bidResult: BidResult } => {
    let newGame: EuchreGameInstance = { ...game };
    const gameFlow: EuchreGameFlowState = { ...INIT_GAME_FLOW_STATE };
    gameFlow.hasGameStarted = true;

    while (true) {
      gameFlow.hasFirstBiddingPassed = false;
      gameFlow.hasSecondBiddingPassed = false;

      //#region  Shuffle cards and bidding for trump
      const shuffleResult = shuffleAndDealHand(newGame, gameSetting, null, false);

      newGame = shuffleResult.game;

      let allPassed = false;
      let bidResult: BidResult | null = null;

      while (!bidResult?.orderTrump && !allPassed) {
        bidResult = determineBid(newGame, newGame.trump, !gameFlow.hasFirstBiddingPassed, gameSetting);

        if (bidResult?.orderTrump) {
          return { game: newGame, bidResult: bidResult };
        } else {
          const biddingRoundFinished = playerEqual(newGame.dealer, newGame.currentPlayer);
          const firstRound: boolean = !gameFlow.hasFirstBiddingPassed;

          if (biddingRoundFinished) {
            gameFlow.hasFirstBiddingPassed = firstRound || gameFlow.hasFirstBiddingPassed;
            gameFlow.hasSecondBiddingPassed = !firstRound;
          }

          if (gameFlow.hasSecondBiddingPassed) {
            allPassed = true;
            newGame.dealPassedCount += 1;
          } else {
            const rotation = getPlayerRotation(newGame.gamePlayers, newGame.currentPlayer);
            newGame.currentPlayer = rotation[0];
          }
        }
      }

      const rotation = getPlayerRotation(newGame.gamePlayers, newGame.dealer);
      newGame.dealer = rotation[0];
    }
  };

  const playGameTricks = (
    game: EuchreGameInstance,
    gameSetting: EuchreSettings,
    bidResult: BidResult
  ): EuchreGameInstance => {
    let newGame = orderTrump(game, bidResult);

    const shouldDiscard = bidResult.calledSuit === null;

    if (shouldDiscard) {
      newGame.discard =
        bidResult.discard ?? determineDiscard(newGame, newGame.dealer, gameSetting.difficulty);
      newGame.dealer.hand = discard(newGame.dealer, newGame.discard, newGame.trump);
    }

    let handComplete = false;
    while (!handComplete) {
      const chosenCard: Card = determineCardToPlay(newGame, gameSetting.difficulty);
      const cardPlayed: EuchreCard = { player: newGame.currentPlayer, card: chosenCard };
      newGame.currentPlayer.playedCards.push(chosenCard);
      newGame.currentTrick.cardsPlayed.push(cardPlayed);

      const sittingOut = playerSittingOut(newGame);
      const playerRotation = getPlayerRotation(newGame.gamePlayers, newGame.currentPlayer, sittingOut);

      newGame = updateIfTrickOver(newGame, playerRotation);
      newGame = updateIfHandOver(newGame);
      handComplete = isHandFinished(newGame);

      if (!handComplete && isTrickFinished(newGame)) {
        newGame.currentTrick = createTrick(newGame.currentRound);
      }
    }

    return newGame;
  };

  /** Run through a fully automated game with AI players.
   *
   */
  const runFullGame = (gameSetting: EuchreSettings): EuchreGameInstance => {
    let newGame: EuchreGameInstance = initDeckForInitialDeal(gameSetting, false);
    const gameFlow: EuchreGameFlowState = { ...INIT_GAME_FLOW_STATE };

    newGame.player1.human = false;
    gameFlow.hasGameStarted = true;
    let gameOver = false;

    try {
      //#region Begin deal cards for initial dealer
      const dealResult = dealCardsForDealer(newGame, gameFlow, null);

      if (!dealResult?.newDealer) throw new Error('Dealer not found after dealing for initial deal.');

      newGame.dealer = dealResult.newDealer;
      newGame.currentPlayer = dealResult.newDealer;
      //#endregion

      while (!gameOver) {
        const temp = dealAndBid(newGame, gameSetting);
        const bidResult = temp.bidResult;

        newGame = playGameTricks(temp.game, gameSetting, bidResult);

        gameOver = teamPoints(newGame, 1) >= 10 || teamPoints(newGame, 2) >= 10;
        const rotation = getPlayerRotation(newGame.gamePlayers, newGame.dealer);
        newGame.dealer = rotation[0];
      }
    } catch (e) {
      const error = e as Error;
      logDebugError(createEvent('e', undefined, `${error ? error.message + '\n' + error.stack : e}`));
    }
    //#endregion

    return newGame;
  };

  /** Run a full game for the given loop count. Used to debug logic for selecting cards to play.
   *
   */
  const runFullGameLoop = (loopCount: number, gameSetting: EuchreSettings): EuchreGameInstance | null => {
    let game: EuchreGameInstance | null = null;

    for (let i = 0; i < loopCount; i++) {
      game = runFullGame(gameSetting);
    }

    return game;
  };

  const runCardAnimation = async (gameSetting: EuchreSettings) => {
    let newGame: EuchreGameInstance = initDeckForInitialDeal(gameSetting, false);
    const gameFlow: EuchreGameFlowState = { ...INIT_GAME_FLOW_STATE };

    newGame.player1.human = false;
    gameFlow.hasGameStarted = true;
    let gameOver = false;

    try {
      //#region Begin deal cards for initial dealer
      const dealResult = dealCardsForDealer(newGame, gameFlow, null);

      if (!dealResult?.newDealer) throw new Error('Dealer not found after dealing for initial deal.');

      newGame.dealer = dealResult.newDealer;
      newGame.currentPlayer = dealResult.newDealer;
      //#endregion

      //#region  Loop over game logic until a team reaches 10 points.
      while (!gameOver) {
        gameFlow.hasFirstBiddingPassed = false;
        gameFlow.hasSecondBiddingPassed = false;

        //#region  Shuffle cards and bidding for trump
        const shuffleResult = shuffleAndDealHand(newGame, gameSetting, null, false);

        newGame = shuffleResult.game;

        let trumpOrdered = false;
        let allPassed = false;
        let bidResult: BidResult | null = null;

        while (!trumpOrdered && !allPassed) {
          bidResult = determineBid(newGame, newGame.trump, !gameFlow.hasFirstBiddingPassed, gameSetting);

          if (bidResult?.orderTrump) {
            trumpOrdered = true;
          } else {
            const biddingRoundFinished = playerEqual(newGame.dealer, newGame.currentPlayer);
            const firstRound: boolean = !gameFlow.hasFirstBiddingPassed;

            if (biddingRoundFinished) {
              gameFlow.hasFirstBiddingPassed = firstRound || gameFlow.hasFirstBiddingPassed;
              gameFlow.hasSecondBiddingPassed = !firstRound;
            }

            if (gameFlow.hasSecondBiddingPassed) {
              allPassed = true;
            } else {
              const rotation = getPlayerRotation(newGame.gamePlayers, newGame.currentPlayer);
              newGame.currentPlayer = rotation[0];
            }
          }
        }

        //#endregion

        //#region  Trump Ordered and loop through logic of playing cards for each player.
        if (trumpOrdered && bidResult) {
          newGame = orderTrump(newGame, bidResult);

          const shouldDiscard = bidResult.calledSuit === null;

          if (shouldDiscard) {
            newGame.discard =
              bidResult.discard ?? determineDiscard(newGame, newGame.dealer, gameSetting.difficulty);
            newGame.dealer.hand = discard(newGame.dealer, newGame.discard, newGame.trump);
          }

          let handComplete = false;
          while (!handComplete) {
            const chosenCard: Card = determineCardToPlay(newGame, gameSetting.difficulty);
            const cardPlayed: EuchreCard = { player: newGame.currentPlayer, card: chosenCard };
            newGame.currentPlayer.playedCards.push(chosenCard);

            if (!newGame.currentTrick) throw Error();

            newGame.currentTrick.cardsPlayed.push(cardPlayed);
            setPlayedCard(chosenCard);
            await new Promise((resolve) => setTimeout(resolve, 2000));

            const sittingOut = playerSittingOut(newGame);
            const playerRotation = getPlayerRotation(newGame.gamePlayers, newGame.currentPlayer, sittingOut);

            newGame = updateIfTrickOver(newGame, playerRotation);
            newGame = updateIfHandOver(newGame);
            handComplete = isHandFinished(newGame);

            if (!handComplete && isTrickFinished(newGame)) {
              newGame.currentTrick = createTrick(newGame.currentRound);
            }
          }
        }
        //#endregion

        gameOver = teamPoints(newGame, 1) >= 10 || teamPoints(newGame, 2) >= 10;
        const rotation = getPlayerRotation(newGame.gamePlayers, newGame.dealer);
        newGame.dealer = rotation[0];
      }
    } catch (e) {
      const error = e as Error;
      logDebugError(createEvent('e', undefined, `${error ? error.message + '\n' + error.stack : e}`));
    }
    //#endregion

    return newGame;
  };

  return { runFullGame, runFullGameLoop, runCardAnimation };
}
