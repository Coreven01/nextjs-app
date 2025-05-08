import { BidResult, Card, GameDifficulty, Suit } from '@/app/lib/euchre/definitions/definitions';
import useGameData from '../data/useGameData';
import usePlayerData from '../data/usePlayerData';
import useCardData from '../data/useCardData';
import { useCallback } from 'react';
import useGameSetupLogic from './useGameSetupLogic';
import {
  EuchreGameInstance,
  EuchrePlayer,
  EuchreSettings
} from '../../../lib/euchre/definitions/game-state-definitions';
import { GameBidLogic } from '../../../lib/euchre/definitions/logic-definitions';

const useGameBidLogic = () => {
  const { teamPoints, getRandomScoreForDifficulty } = useGameData();
  const { playerEqual, availableCardsToPlay } = usePlayerData();
  const { getCardValue, cardIsLeftBower, cardIsRightBower, getSuitCount, cardEqual, indexCards } =
    useCardData();
  const { createTrick } = useGameSetupLogic();

  /** Get total score value for a player's hand based on the trump card. */
  const getHandScore = useCallback(
    (hand: Card[], trump: Card) => {
      let score: number = 0;
      for (const card of hand) score += getCardValue(card, trump);

      return score;
    },
    [getCardValue]
  );

  /** Returns a score that should be added from the player's hand score based risk values. */
  const getRiskScoreForBid = useCallback(
    (game: EuchreGameInstance): number => {
      let score: number = 0;
      const team: 1 | 2 = game.currentPlayer.team;
      const opposingTeam: 1 | 2 = team === 1 ? 2 : 1;
      const currentTeamPoints = teamPoints(game, team);
      const opposingTeamPoints = teamPoints(game, opposingTeam);

      // if losing by 4 points or more than take additional risk.
      const difference: number = opposingTeamPoints - currentTeamPoints;
      if (difference >= 4) score += 50;

      return score;
    },
    [teamPoints]
  );

  /** Returns a score that should be added from the player's hand score based on positive qualifiers */
  const getPositiveModifierForBid = useCallback(
    (game: EuchreGameInstance, flipCard: Card, gameLogic: GameBidLogic, gameSettings: EuchreSettings) => {
      let score: number = 0;

      // if stick the dealer is enabled, bump up the score slightly if picking up a jack.
      if (
        gameLogic.firstRoundOfBidding &&
        flipCard.value === 'J' &&
        playerEqual(game.dealer, game.currentPlayer) &&
        gameSettings.stickTheDealer
      )
        score += 50;

      // if teammate will pick up the jack, then bump up the score.
      if (
        gameLogic.firstRoundOfBidding &&
        flipCard.value === 'J' &&
        !playerEqual(game.dealer, game.currentPlayer) &&
        game.dealer.team === game.currentPlayer.team
      )
        score += 50;

      // add point if only 2 suited.
      if (gameLogic.suitsInHand === 2) score += 25;

      if (gameLogic.offSuitAceCount > 0 && gameLogic.trumpCardCount > 2 && gameLogic.suitsInHand <= 3)
        score += 25;

      return score;
    },
    [playerEqual]
  );

  /** Check teammate's hand to see if the trump card/suit would help the current player. */
  const getCheatersModifierForBid = useCallback(
    (game: EuchreGameInstance, flipCard: Card, gameSettings: EuchreSettings): number => {
      if (gameSettings.difficulty === 'tabletalk' && game.currentPlayer.team === 2) {
        const teamPlayer = game.gamePlayers.find(
          (p) => p.team === game.currentPlayer.team && !playerEqual(p, game.currentPlayer)
        );
        if (teamPlayer) {
          const teammateScore = getHandScore(teamPlayer.hand, flipCard);
          if (teammateScore > getQualifyingTeammateScore()) {
            return 100;
          }
        }
      }

      return 0;
    },
    [getHandScore, playerEqual]
  );

  /** Returns a score that should be subtracted from the player's hand score based on negative qualifiers */
  const getNegativeModifierForBid = (
    game: EuchreGameInstance,
    flipCard: Card,
    gameLogic: GameBidLogic,
    gameSettings: EuchreSettings
  ) => {
    let score: number = 0;

    // if opposing team picks up a jack then less likely to call trump.
    if (
      gameLogic.firstRoundOfBidding &&
      flipCard.value === 'J' &&
      game.dealer.team !== game.currentPlayer.team
    )
      score += 75;

    // add points if player has a weak hand.
    if (gameLogic.suitsInHand === 4) score += 50;
    if (gameLogic.suitsInHand === 3) score += 25;
    if (gameLogic.offSuitAceCount === 0) score += 25;

    // if opposing team is dealer, then greater chance they will have call trump with a weak hand if
    // stick the dealer is enabled.
    if (
      !gameLogic.firstRoundOfBidding &&
      gameSettings.stickTheDealer &&
      game.dealer.team !== game.currentPlayer.team
    )
      score += 50;

    return score;
  };

  /** Return important values when making a decision during the bidding process.
   *
   */
  const getGameBidLogic = useCallback(
    (
      game: EuchreGameInstance,
      playerCards: Card[],
      flipCard: Card,
      firstRoundOfBidding: boolean
    ): GameBidLogic => {
      const playerHasRight: boolean = playerCards.find((c) => cardIsRightBower(c, flipCard)) !== undefined;
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
    [cardIsLeftBower, cardIsRightBower, getSuitCount]
  );

  /** Resulting best score for the player's hand after all possible hand values are considered. */
  const getBidResult = useCallback(
    (
      game: EuchreGameInstance,
      playerCards: Card[],
      potentialTrump: Card,
      gameLogic: GameBidLogic,
      gameSettings: EuchreSettings,
      teamNumber: 1 | 2
    ): BidResult => {
      const retval: BidResult = {
        orderTrump: false,
        loner: false,
        calledSuit: null,
        handScore: 0,
        cheatScore: 0,
        discard: null
      };

      let score: number = 0;
      score = getHandScore(playerCards, potentialTrump);
      score += getPositiveModifierForBid(game, potentialTrump, gameLogic, gameSettings);
      score -= getNegativeModifierForBid(game, potentialTrump, gameLogic, gameSettings);
      score += getRiskScoreForBid(game);
      score += getRandomScoreForDifficulty(teamNumber, gameSettings.difficulty, 0, 100);

      const roundValue: number = 25 - ((score % 25) % 25);
      retval.handScore = score + (roundValue <= 10 ? roundValue : -(25 - roundValue));
      retval.cheatScore = getCheatersModifierForBid(game, potentialTrump, gameSettings);

      return retval;
    },
    [
      getCheatersModifierForBid,
      getHandScore,
      getPositiveModifierForBid,
      getRandomScoreForDifficulty,
      getRiskScoreForBid
    ]
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
      let bestResult: BidResult = {
        orderTrump: false,
        calledSuit: null,
        handScore: 0,
        cheatScore: 0,
        loner: false,
        discard: null
      };

      const suits: Suit[] = ['♠', '♥', '♦', '♣'];
      const playerWillPickup: boolean = firstRoundOfBidding && playerEqual(game.dealer, game.currentPlayer);
      const potentialTrumpCards: Card[] = [];
      const playerCards: Card[] = game.currentPlayer.hand;
      const playerPotentialHands: Card[][] = [playerCards];
      const qualifyingCallScore = getQualifyingScore();

      if (playerWillPickup) {
        for (const card of playerCards) {
          const newHand: Card[] = [...playerCards.filter((c) => !cardEqual(c, card)), flipCard];
          playerPotentialHands.push(newHand);
        }
      }

      if (!firstRoundOfBidding) {
        for (const suit of suits.filter((s) => s !== flipCard.suit)) {
          potentialTrumpCards.push({ suit: suit, value: 'P', index: 0 });
        }
      } else potentialTrumpCards.push(flipCard);

      for (const potentialHand of playerPotentialHands) {
        for (const potentialTrumpCard of potentialTrumpCards) {
          const bidLogic: GameBidLogic = getGameBidLogic(
            game,
            potentialHand,
            potentialTrumpCard,
            firstRoundOfBidding
          );
          const tempResult: BidResult = getBidResult(
            game,
            potentialHand,
            potentialTrumpCard,
            bidLogic,
            gameSettings,
            game.currentPlayer.team
          );

          if (tempResult.handScore < qualifyingCallScore) {
            tempResult.handScore += tempResult.cheatScore;
          }

          if (tempResult.handScore > bestResult.handScore) {
            bestResult = tempResult;

            if (!firstRoundOfBidding) bestResult.calledSuit = potentialTrumpCard.suit;

            if (playerWillPickup) {
              const discard = potentialTrumpCard;
              const tempDiscard = playerCards.find(
                (c) => potentialHand.find((p) => cardEqual(p, c)) === undefined
              );
              bestResult.discard = tempDiscard ?? discard;
            }
          }
        }
      }

      const stickTheDealer: boolean =
        gameSettings.stickTheDealer && !firstRoundOfBidding && playerEqual(game.dealer, game.currentPlayer);

      if (stickTheDealer || bestResult.handScore >= qualifyingCallScore) {
        bestResult.orderTrump = true;
        bestResult.loner =
          teamPoints(game, game.currentPlayer.team) < 8 &&
          bestResult.handScore >= getQualifyingLonerScore(game.currentPlayer.team, gameSettings.difficulty);
      }

      return bestResult;
    },
    [cardEqual, getBidResult, getGameBidLogic, playerEqual, teamPoints]
  );

  /** Score used to determine if the player should call suit based on teammate's hand. */
  const getQualifyingTeammateScore = () => {
    return 300;
  };

  /** Score used to determine if the player should call suit. */
  const getQualifyingScore = () => {
    return 600;
  };

  /** Score used to determine if the player should call loner. */
  const getQualifyingLonerScore = (teamNumber: number, difficulty: GameDifficulty) => {
    if (teamNumber === 2 && difficulty === 'novice') {
      return 1200;
    } else if (teamNumber === 2 && difficulty === 'intermediate') {
      return 900;
    }

    return 800;
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

    newGame.maker = newGame.currentPlayer;
    newGame.loner = result.loner;
    newGame.currentTrick = createTrick(newGame.currentRound);

    if (result.calledSuit) {
      newGame.turnedDown = newGame.trump;
      newGame.trump = { suit: result.calledSuit, value: 'JK', index: 0 };
    }

    for (const player of newGame.gamePlayers) {
      player.hand = indexCards(player.hand);
    }

    return newGame;
  };

  return { determineBid, determineDiscard, orderTrump };
};

export default useGameBidLogic;
