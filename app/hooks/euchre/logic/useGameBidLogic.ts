import {
  BidResult,
  Card,
  EuchreGameInstance,
  EuchrePlayer,
  EuchreSettings,
  GameDifficulty,
  Suit
} from '@/app/lib/euchre/definitions';
import { GameBidLogic } from '@/app/lib/euchre/logic-definitions';
import useGameData from '../data/useGameData';
import usePlayerData from '../data/usePlayerData';
import useCardData from '../data/useCardData';
import { useCallback } from 'react';

const useGameBidLogic = () => {
  const { teamPoints, getRandomScoreForDifficulty, playerSittingOut } = useGameData();
  const { playerEqual, availableCardsToPlay } = usePlayerData();
  const { getCardValue, cardIsLeftBower, getSuitCount } = useCardData();
  const { sortCards, getPlayerRotation } = usePlayerData();

  const getHandScore = useCallback(
    (hand: Card[], trump: Card) => {
      let score: number = 0;
      for (const card of hand) score += getCardValue(card, trump);

      return score;
    },
    [getCardValue]
  );

  const getRiskScoreForBid = useCallback(
    (game: EuchreGameInstance, gameLogic: GameBidLogic): number => {
      let score: number = 0;

      const team: 1 | 2 = game.currentPlayer?.team ?? 1;
      const opposingTeam: 1 | 2 = team === 1 ? 2 : 1;
      const currentTeamPoints: number = teamPoints(game, team);
      const opposingTeamPoints: number = teamPoints(game, opposingTeam);
      const difference: number = opposingTeamPoints - currentTeamPoints;

      if (difference >= 4) score += 25;

      return score;
    },
    [teamPoints]
  );

  /** Return a object of important values when making a decision during the bidding process.
   *
   */
  const getGameBidLogic = useCallback(
    (playerCards: Card[], flipCard: Card, firstRoundOfBidding: boolean): GameBidLogic => {
      const playerHasRight: boolean =
        playerCards.find((c) => c.suit === flipCard.suit && c.value === 'J') !== undefined;
      const playerHasLeft: boolean = playerCards.find((c) => cardIsLeftBower(c, flipCard)) !== undefined;
      const suitCount = getSuitCount(playerCards, flipCard);

      const info: GameBidLogic = {
        trumpCardCount: playerCards.filter((c) => c.suit === flipCard.suit || cardIsLeftBower(c, flipCard))
          .length,
        offSuitAceCount: playerCards.filter((c) => c.suit !== flipCard.suit && c.value === 'A').length,
        playerHasRight: playerHasRight,
        playerHasLeft: playerHasLeft,
        suitsInHand: suitCount.length,
        firstRoundOfBidding: firstRoundOfBidding
      };

      return info;
    },
    [cardIsLeftBower, getSuitCount]
  );

  /** */
  const getBidResult = useCallback(
    (
      game: EuchreGameInstance,
      playerCards: Card[],
      potentialTrump: Card,
      gameLogic: GameBidLogic,
      difficulty: GameDifficulty,
      teamNumber: 1 | 2
    ): BidResult => {
      const retval: BidResult = { orderTrump: false, loner: false, calledSuit: null, handScore: 0 };

      let score: number = 0;
      score = getHandScore(playerCards, potentialTrump);
      score += getPositiveModifierForBid(game, potentialTrump, gameLogic);
      score -= getNegativeModifierForBid(game, potentialTrump, gameLogic);
      score += getRiskScoreForBid(game, gameLogic);
      score += getRandomScoreForDifficulty(teamNumber, difficulty, 0, 100);

      const roundValue: number = 25 - ((score % 25) % 25);
      retval.handScore = score + (roundValue <= 10 ? roundValue : -(25 - roundValue));

      return retval;
    },
    [getHandScore, getRandomScoreForDifficulty, getRiskScoreForBid]
  );

  /** Determine how an AI player should play during the bidding round.
   *  Uses heuristic evaluation to create a score. If the score exceeds a value, then the player will name trump.
   */
  const determineBid = useCallback(
    (
      game: EuchreGameInstance,
      flipCard: Card,
      firstRoundOfBidding: boolean,
      gameSettings: EuchreSettings
    ): BidResult => {
      if (!game?.currentPlayer) throw Error('Invalid player in bid logic.');
      if (!game?.dealer) throw Error('Invalid dealer in bid logic.');

      let modifiedResult: BidResult = { orderTrump: false, calledSuit: null, handScore: 0, loner: false };

      const suits: Suit[] = ['♠', '♥', '♦', '♣'];
      const playerWillPickup: boolean = firstRoundOfBidding && game.dealer === game.currentPlayer;
      const playerPotentialHands: Card[][] = [];
      const potentialTrumpCards: Card[] = [];
      const playerCards: Card[] = game.currentPlayer.hand;

      if (playerWillPickup) {
        for (const card of playerCards) {
          const newHand: Card[] = [...playerCards.filter((c) => c !== card), flipCard];
          playerPotentialHands.push(newHand);
        }
      } else {
        playerPotentialHands.push(playerCards);
      }

      if (!firstRoundOfBidding) {
        for (const suit of suits.filter((s) => s !== flipCard.suit)) {
          potentialTrumpCards.push({ suit: suit, value: 'P', index: 0 });
        }
      } else potentialTrumpCards.push(flipCard);

      for (const potentialHand of playerPotentialHands) {
        for (const potentialTrumpCard of potentialTrumpCards) {
          const bidLogic: GameBidLogic = getGameBidLogic(
            potentialHand,
            potentialTrumpCard,
            firstRoundOfBidding
          );
          const tempResult: BidResult = getBidResult(
            game,
            potentialHand,
            potentialTrumpCard,
            bidLogic,
            gameSettings.difficulty,
            game.currentPlayer.team
          );
          if (tempResult.handScore > modifiedResult.handScore) {
            modifiedResult = tempResult;

            if (!firstRoundOfBidding) modifiedResult.calledSuit = potentialTrumpCard.suit;
          }
        }
      }

      const stickTheDealer: boolean =
        gameSettings.stickTheDealer && !firstRoundOfBidding && playerEqual(game.dealer, game.currentPlayer);
      if (stickTheDealer || modifiedResult.handScore >= getQualifyingScore()) {
        modifiedResult.orderTrump = true;
        modifiedResult.loner =
          modifiedResult.handScore >=
          getQualifyingLonerScore(game.currentPlayer.team, gameSettings.difficulty);
      }

      return modifiedResult;
    },
    [getBidResult, getGameBidLogic, playerEqual]
  );

  const getQualifyingScore = () => {
    return 600;
  };

  const getQualifyingLonerScore = (teamNumber: number, difficulty: GameDifficulty) => {
    if (teamNumber === 2 && difficulty === 'novice') {
      return 1200;
    } else if (teamNumber === 2 && difficulty === 'intermediate') {
      return 900;
    }

    return 800;
  };

  const getPositiveModifierForBid = (game: EuchreGameInstance, flipCard: Card, gameLogic: GameBidLogic) => {
    let score: number = 0;

    if (gameLogic.firstRoundOfBidding && flipCard.value === 'J' && game.dealer === game.currentPlayer)
      score += 50;

    if (
      gameLogic.firstRoundOfBidding &&
      flipCard.value === 'J' &&
      game.dealer !== game.currentPlayer &&
      game.dealer?.team === game.currentPlayer?.team
    )
      score += 25;

    if (gameLogic.suitsInHand === 2) score += 25;

    if (gameLogic.offSuitAceCount > 0 && gameLogic.trumpCardCount > 2 && gameLogic.suitsInHand <= 3)
      score += 25;

    return score;
  };

  const getNegativeModifierForBid = (game: EuchreGameInstance, flipCard: Card, gameLogic: GameBidLogic) => {
    let score: number = 0;

    if (
      gameLogic.firstRoundOfBidding &&
      flipCard.value === 'J' &&
      game.dealer?.team !== game.currentPlayer?.team
    )
      score += 50;
    if (gameLogic.suitsInHand === 4) score += 50;
    if (gameLogic.suitsInHand === 3) score += 25;
    if (gameLogic.offSuitAceCount === 0) score += 25;

    return score;
  };

  const determineDiscard = (
    game: EuchreGameInstance,
    player: EuchrePlayer,
    difficulty: GameDifficulty
  ): Card => {
    if (!game.trump) throw Error('Unable to determine discard. Trump card not found.');

    let lowestScore: number = 10000;
    let lowCard: Card | undefined;
    const playerCards: Card[] = availableCardsToPlay(player);
    playerCards.push(game.trump);

    for (const card of playerCards) {
      const tempScore: number =
        getCardValue(card, game.trump) + getRandomScoreForDifficulty(player.team, difficulty, 0, 50);
      if (tempScore < lowestScore) {
        lowestScore = tempScore;
        lowCard = card;
      }
    }

    if (!lowCard) throw Error('Unable to determine discard.');

    return lowCard;
  };

  const orderTrump = (
    gameInstance: EuchreGameInstance | undefined,
    result: BidResult
  ): EuchreGameInstance => {
    const newGame: EuchreGameInstance | undefined = gameInstance ? { ...gameInstance } : undefined;

    if (!newGame) throw Error('Game not found - Order Trump.');

    if (!newGame.dealer) throw Error('Dealer not found - Order Trump.');

    if (!newGame.currentPlayer) throw Error('Current player not found - Order Trump.');

    newGame.maker = newGame.currentPlayer;
    newGame.loner = result.loner;
    const sittingOut = playerSittingOut(newGame);
    const rotation = getPlayerRotation(newGame.gamePlayers, newGame.dealer, sittingOut);
    newGame.currentTricks.push({
      round: newGame.currentRound,
      taker: null,
      cardsPlayed: [],
      playerRenege: null,
      playerSittingOut: null
    });
    newGame.currentPlayer = rotation[0];

    if (result.calledSuit) {
      newGame.turnedDown = newGame.trump;
      newGame.trump = { suit: result.calledSuit, value: 'JK', index: 0 };
    }

    for (const player of newGame.gamePlayers) {
      player.hand = sortCards(player, newGame.trump);
    }

    return newGame;
  };

  return { determineBid, determineDiscard, orderTrump };
};

export default useGameBidLogic;
