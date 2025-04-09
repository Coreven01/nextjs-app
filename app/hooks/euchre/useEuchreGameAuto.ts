'use client';

import { EuchreGameFlowState, INIT_GAME_FLOW_STATE } from './gameFlowReducer';
import {
  BidResult,
  Card,
  EuchreCard,
  EuchreGameInstance,
  EuchreSettings
} from '@/app/lib/euchre/definitions';
import { createEvent, logDebugError } from '@/app/lib/euchre/util';
import useGameSetupLogic from './logic/useGameSetupLogic';
import useGameBidLogic from './logic/useGameBidLogic';
import usePlayerData from './data/usePlayerData';
import useGameData from './data/useGameData';
import useGamePlayLogic from './logic/useGamePlayLogic';

/**  */
export default function useEuchreGameAuto() {
  const { initDeckForInitialDeal, dealCardsForDealer, shuffleAndDealHand, createTrick } = useGameSetupLogic();
  const { determineBid, determineDiscard, orderTrump } = useGameBidLogic();
  const { getPlayerRotation, discard } = usePlayerData();
  const { determineCardToPlay } = useGamePlayLogic();
  const { teamPoints, handFinished, trickFinished, updateIfHandOver, updateIfTrickOver, playerSittingOut } =
    useGameData();

  /** Run through a full game with AI players.
   *
   */
  const runFullGame = (gameSetting: EuchreSettings): EuchreGameInstance => {
    let newGame: EuchreGameInstance = initDeckForInitialDeal(gameSetting.playerName, false);
    const gameFlow: EuchreGameFlowState = { ...INIT_GAME_FLOW_STATE };

    newGame.player1.human = false;
    gameFlow.hasGameStarted = true;
    let teamOneScore = 0;
    let teamTwoScore = 0;

    try {
      //#region Begin deal cards for initial dealer
      const dealResult = dealCardsForDealer(newGame, gameFlow, gameSetting, null);

      if (!dealResult) throw new Error();

      newGame.dealer = dealResult.newDealer;
      newGame.currentPlayer = dealResult.newDealer;
      //#endregion

      //#region  Loop over game logic until a team reaches 10 points.
      while (teamOneScore < 10 && teamTwoScore < 10) {
        gameFlow.hasFirstBiddingPassed = false;
        gameFlow.hasSecondBiddingPassed = false;

        //#region  Shuffle cards and bidding for trump
        const shuffleResult = shuffleAndDealHand(newGame, gameSetting, null, false);

        newGame = shuffleResult.game;

        if (!newGame.currentPlayer) throw new Error();
        if (!newGame.trump) throw new Error();
        if (!newGame.dealer) throw new Error();

        let trumpOrdered = false;
        let allPassed = false;
        let bidResult: BidResult | null = null;

        while (!trumpOrdered && !allPassed) {
          bidResult = determineBid(newGame, newGame.trump, !gameFlow.hasFirstBiddingPassed, gameSetting);

          if (bidResult.orderTrump) {
            trumpOrdered = true;
          } else {
            const biddingRoundFinished = newGame.dealer === newGame.currentPlayer;
            const firstRound: boolean = !gameFlow.hasFirstBiddingPassed;

            if (biddingRoundFinished) {
              gameFlow.hasFirstBiddingPassed = firstRound || gameFlow.hasFirstBiddingPassed;
              gameFlow.hasSecondBiddingPassed = !firstRound;
            }

            if (gameFlow.hasSecondBiddingPassed) {
              allPassed = true;

              const rotation = getPlayerRotation(newGame.gamePlayers, newGame.dealer);
              newGame.dealer = rotation[0];
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

          if (shouldDiscard && newGame.dealer) {
            newGame.discard = determineDiscard(newGame, newGame.dealer, gameSetting.difficulty);
            newGame.dealer.hand = discard(newGame.dealer, newGame.discard, newGame.trump);
          }

          while (!handFinished(newGame) && newGame.currentPlayer) {
            if (trickFinished(newGame)) {
              newGame.currentTricks.push(createTrick(newGame.currentRound));
            }

            const chosenCard: Card = determineCardToPlay(newGame, gameSetting.difficulty);
            const cardPlayed: EuchreCard = { player: newGame.currentPlayer, card: chosenCard };
            newGame.currentPlayer.playedCards.push(chosenCard);

            if (!newGame.currentTrick) throw Error();

            newGame.currentTrick.cardsPlayed.push(cardPlayed);

            const sittingOut = playerSittingOut(newGame);
            const playerRotation = getPlayerRotation(newGame.gamePlayers, newGame.currentPlayer, sittingOut);

            newGame = updateIfTrickOver(newGame, playerRotation);
            newGame = updateIfHandOver(newGame);
          }
        }
        //#endregion

        teamOneScore = teamPoints(newGame, 1);
        teamTwoScore = teamPoints(newGame, 2);

        if (!newGame.dealer) throw Error('Dealer not found after hand finished.');

        const rotation = getPlayerRotation(newGame.gamePlayers, newGame.dealer);
        newGame.dealer = rotation[0];
      }
    } catch (e) {
      const error = e as Error;
      logDebugError(
        createEvent('e', gameSetting, undefined, `${error ? error.message + '\n' + error.stack : e}`, newGame)
      );
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

  return { runFullGame, runFullGameLoop };
}
