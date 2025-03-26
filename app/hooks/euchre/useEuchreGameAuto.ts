'use client';

import { EuchreGameFlowState, INIT_GAME_FLOW_STATE } from './gameFlowReducer';
import {
  dealCardsForDealer,
  initDeckForInitialDeal,
  orderTrump,
  shuffleAndDealHand
} from '@/app/lib/euchre/game-setup-logic';
import { BidResult, Card, EuchreGameInstance, EuchreSettings } from '@/app/lib/euchre/definitions';
import { getPlayerRotation } from '@/app/lib/euchre/game';
import { createEvent, logDebugEvent } from '@/app/lib/euchre/util';

/**  */
export default function useEuchreGameAuto(gameSetting: EuchreSettings) {
  /** Run through a full game with AI players. */
  const runFullGame = (): EuchreGameInstance => {
    let newGame: EuchreGameInstance = initDeckForInitialDeal(false);
    const gameFlow: EuchreGameFlowState = { ...INIT_GAME_FLOW_STATE };

    newGame.player1.human = false;
    gameFlow.hasGameStarted = true;
    let teamOneScore = 0;
    let teamTwoScore = 0;

    try {
      //#region Begin deal cards for initial dealer
      const dealResult = dealCardsForDealer(newGame, gameFlow, gameSetting);

      if (!dealResult) throw new Error();

      newGame.assignDealerAndPlayer(dealResult.newDealer);
      //#endregion

      //#region  Loop over game logic until a team reaches 10 points.
      while (teamOneScore < 10 && teamTwoScore < 10) {
        gameFlow.hasFirstBiddingPassed = false;
        gameFlow.hasSecondBiddingPassed = false;

        //#region  Shuffle cards and bidding for trump
        const shuffleResult = shuffleAndDealHand(newGame, gameSetting, false);

        newGame = shuffleResult.game;

        if (!newGame.currentPlayer) throw new Error();
        if (!newGame.trump) throw new Error();
        if (!newGame.dealer) throw new Error();

        let trumpOrdered = false;
        let allPassed = false;
        let bidResult: BidResult | null = null;

        while (!trumpOrdered && !allPassed) {
          bidResult = newGame.currentPlayer.determineBid(
            newGame,
            newGame.trump,
            !gameFlow.hasFirstBiddingPassed
          );

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
              newGame.assignPlayer(rotation[0]);
            }
          }
        }

        //#endregion

        //#region  Trump Ordered and loop through logic of playing cards for each player.
        if (trumpOrdered && bidResult) {
          newGame = orderTrump(newGame, bidResult);

          const shouldDiscard = bidResult.calledSuit === null;

          if (shouldDiscard && newGame.dealer) {
            newGame.discard = newGame.dealer.chooseDiscard(newGame);
          }

          while (!newGame.handFinished && newGame.currentPlayer) {
            if (newGame.trickFinished) {
              newGame.addTrickForNewHand();
            }

            const chosenCard: Card = newGame.currentPlayer.determineCardToPlay(newGame);
            const cardPlayed = newGame.currentPlayer.playGameCard(chosenCard);

            if (!newGame.currentTrick) throw Error();

            newGame.currentTrick.cardsPlayed.push(cardPlayed);

            const playerRotation = getPlayerRotation(
              newGame.gamePlayers,
              newGame.currentPlayer,
              newGame.playerSittingOut
            );

            newGame.updateIfTrickOver(playerRotation);
            newGame.updateIfHandOver();
          }
        }
        //#endregion

        teamOneScore = newGame.teamPoints(1);
        teamTwoScore = newGame.teamPoints(2);

        if (!newGame.dealer) throw Error();

        const rotation = getPlayerRotation(newGame.gamePlayers, newGame.dealer);
        newGame.dealer = rotation[0];
      }
    } catch (e) {
      logDebugEvent(createEvent('e', gameSetting, undefined, `${e}`, newGame));
    }
    //#endregion

    return newGame;
  };

  /** Run a full game for the given loop count. Used to debug logic for selecting cards to play. */
  const runFullGameLoop = (loopCount: number): EuchreGameInstance | null => {
    let game: EuchreGameInstance | null = null;

    for (let i = 0; i < loopCount; i++) {
      game = runFullGame();
    }

    return game;
  };

  return { runFullGame, runFullGameLoop };
}
