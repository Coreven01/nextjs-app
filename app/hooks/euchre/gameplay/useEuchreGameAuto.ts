import { EuchreGameFlowState, INIT_GAME_FLOW_STATE } from '../reducers/gameFlowReducer';

import {
  ErrorHandlers,
  EuchreAnimationHandlers,
  EuchreCard,
  EuchreError,
  EuchreGameInstance,
  EuchreGamePlayHandlers,
  EuchreSettings,
  GamePlayContext
} from '../../../../features/euchre/definitions/game-state-definitions';
import { useEventLog } from '../useEventLog';
import {
  createGameForInitialDeal,
  dealCardsForDealer,
  shuffleAndDealHand
} from '../../../../features/euchre/util/game/gameSetupLogicUtil';
import {
  determineBid,
  determineDiscard,
  orderTrump
} from '../../../../features/euchre/util/game/gameBidLogicUtil';
import {
  discard,
  getPlayerRotation,
  playerEqual
} from '../../../../features/euchre/util/game/playerDataUtil';
import { determineCardToPlay } from '../../../../features/euchre/util/game/gamePlayLogicUtil';
import {
  createTrick,
  isHandFinished,
  isTrickFinished,
  playerSittingOut,
  teamPoints,
  updateIfHandOver,
  updateIfTrickOver
} from '../../../../features/euchre/util/game/gameDataUtil';
import { logError } from '../../../lib/euchre/util/util';
import { BidResult, Card } from '../../../../features/euchre/definitions/definitions';

/**  */
export default function useEuchreGameAuto() {
  const { createEvent } = useEventLog();

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
  const runFullGame = (gameSetting: EuchreSettings, maxPoints?: number): EuchreGameInstance => {
    let newGame: EuchreGameInstance = createGameForInitialDeal(gameSetting, false);
    const gameFlow: EuchreGameFlowState = { ...INIT_GAME_FLOW_STATE };

    newGame.player1.human = false;
    gameFlow.hasGameStarted = true;
    let gameOver = false;
    const points: number = maxPoints ?? 10;

    try {
      //#region Begin deal cards for initial dealer
      const dealResult = dealCardsForDealer(newGame, gameFlow);

      if (!dealResult?.newDealer) throw new Error('Dealer not found after dealing for initial deal.');

      newGame.dealer = dealResult.newDealer;
      newGame.currentPlayer = dealResult.newDealer;
      //#endregion

      while (!gameOver) {
        const temp = dealAndBid(newGame, gameSetting);
        const bidResult = temp.bidResult;

        newGame = playGameTricks(temp.game, gameSetting, bidResult);

        gameOver = teamPoints(newGame, 1) >= points || teamPoints(newGame, 2) >= points;
        const rotation = getPlayerRotation(newGame.gamePlayers, newGame.dealer);
        newGame.dealer = rotation[0];
      }
    } catch (e) {
      const error = e as Error;
      logError(createEvent('e', undefined, `${error ? error.message + '\n' + error.stack : e}`));
    }
    //#endregion

    return newGame;
  };

  /** Run a full game for the given loop count. Used to debug logic for selecting cards to play.
   *
   */
  const runFullGameLoop = (loopCount: number, gameSetting: EuchreSettings): EuchreGameInstance => {
    let game: EuchreGameInstance | undefined = undefined;

    for (let i = 0; i < loopCount; i++) {
      game = runFullGame(gameSetting);
    }

    if (!game) throw new Error();

    return game;
  };

  return { runFullGame, runFullGameLoop };
}
