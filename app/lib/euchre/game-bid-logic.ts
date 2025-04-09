// import {
//   BidResult,
//   Card,
//   EuchreGameInstance,
//   EuchrePlayer,
//   EuchreSettings,
//   GameDifficulty,
//   Suit
// } from './definitions';
// import { cardIsLeftBower, getCardValue, getRandomScoreForDifficulty, getSuitCount } from './game';
// import { GameBidLogic } from './logic-definitions';

// /** Return a object of important values when making a decision during the bidding process.
//  *
//  */
// function getGameBidLogic(playerCards: Card[], flipCard: Card, firstRoundOfBidding: boolean): GameBidLogic {
//   const playerHasRight = playerCards.find((c) => c.suit === flipCard.suit && c.value === 'J') !== undefined;
//   const playerHasLeft = playerCards.find((c) => cardIsLeftBower(c, flipCard)) !== undefined;
//   const suitCount = getSuitCount(playerCards, flipCard);

//   const info: GameBidLogic = {
//     trumpCardCount: playerCards.filter((c) => c.suit === flipCard.suit || cardIsLeftBower(c, flipCard))
//       .length,
//     offSuitAceCount: playerCards.filter((c) => c.suit !== flipCard.suit && c.value === 'A').length,
//     playerHasRight: playerHasRight,
//     playerHasLeft: playerHasLeft,
//     suitsInHand: suitCount.length,
//     firstRoundOfBidding: firstRoundOfBidding
//   };

//   return info;
// }

// /** Determine how an AI player should play during the bidding round.
//  *  Uses heuristic evaluation to create a score. If the score exceeds a value, then the player will name trump.
//  */
// function determineBidLogic(
//   game: EuchreGameInstance,
//   flipCard: Card,
//   firstRoundOfBidding: boolean,
//   gameSettings: EuchreSettings
// ): BidResult {
//   if (!game?.currentPlayer) throw Error('Invalid player in bid logic.');
//   if (!game?.dealer) throw Error('Invalid dealer in bid logic.');

//   let modifiedResult: BidResult = { orderTrump: false, calledSuit: null, handScore: 0, loner: false };

//   const suits: Suit[] = ['♠', '♥', '♦', '♣'];
//   const playerWillPickup: boolean = firstRoundOfBidding && game.dealer === game.currentPlayer;
//   const playerPotentialHands: Card[][] = [];
//   const potentialTrumpCards: Card[] = [];
//   const playerCards = game.currentPlayer.availableCards;

//   if (playerWillPickup) {
//     for (const card of playerCards) {
//       const newHand = [...playerCards.filter((c) => c !== card), flipCard];
//       playerPotentialHands.push(newHand);
//     }
//   } else {
//     playerPotentialHands.push(playerCards);
//   }

//   if (!firstRoundOfBidding) {
//     for (const suit of suits.filter((s) => s !== flipCard.suit)) {
//       potentialTrumpCards.push(new Card(suit, 'P'));
//     }
//   } else potentialTrumpCards.push(flipCard);

//   for (const potentialHand of playerPotentialHands) {
//     for (const potentialTrumpCard of potentialTrumpCards) {
//       const bidLogic = getGameBidLogic(potentialHand, potentialTrumpCard, firstRoundOfBidding);
//       const tempResult = getBidResult(
//         game,
//         potentialHand,
//         potentialTrumpCard,
//         bidLogic,
//         gameSettings.difficulty,
//         game.currentPlayer.team
//       );
//       if (tempResult.handScore > modifiedResult.handScore) {
//         modifiedResult = tempResult;

//         if (!firstRoundOfBidding) modifiedResult.calledSuit = potentialTrumpCard.suit;
//       }
//     }
//   }

//   const stickTheDealerScore =
//     gameSettings.stickTheDealer && !firstRoundOfBidding && game.dealer.equal(game.currentPlayer);
//   if (stickTheDealerScore || modifiedResult.handScore >= getQualifyingScore()) {
//     modifiedResult.orderTrump = true;
//     modifiedResult.loner =
//       modifiedResult.handScore >= getQualifyingLonerScore(game.currentPlayer.team, gameSettings.difficulty);
//   }

//   return modifiedResult;
// }

// /** */
// function getBidResult(
//   game: EuchreGameInstance,
//   playerCards: Card[],
//   potentialTrump: Card,
//   gameLogic: GameBidLogic,
//   difficulty: GameDifficulty,
//   teamNumber: 1 | 2
// ): BidResult {
//   const retval: BidResult = { orderTrump: false, loner: false, calledSuit: null, handScore: 0 };

//   let score = 0;
//   score = getHandScore(playerCards, potentialTrump);
//   score += getPositiveModifierForBid(game, potentialTrump, gameLogic);
//   score -= getNegativeModifierForBid(game, potentialTrump, gameLogic);
//   score += getRiskScoreForBid(game, gameLogic);
//   score += getRandomScoreForDifficulty(teamNumber, difficulty, 0, 100);

//   const roundValue = 25 - ((score % 25) % 25);
//   retval.handScore = score + (roundValue <= 10 ? roundValue : -(25 - roundValue));

//   return retval;
// }

// const getHandScore = (hand: Card[], trump: Card) => {
//   let score = 0;
//   for (const card of hand) score += getCardValue(card, trump);

//   return score;
// };

// function getQualifyingScore() {
//   return 600;
// }

// function getQualifyingLonerScore(teamNumber: number, difficulty: GameDifficulty) {
//   if (teamNumber === 2 && difficulty === 'novice') {
//     return 1200;
//   } else if (teamNumber === 2 && difficulty === 'intermediate') {
//     return 900;
//   }

//   return 800;
// }

// function getPositiveModifierForBid(game: EuchreGameInstance, flipCard: Card, gameLogic: GameBidLogic) {
//   let score = 0;

//   if (gameLogic.firstRoundOfBidding && flipCard.value === 'J' && game.dealer === game.currentPlayer)
//     score += 50;

//   if (
//     gameLogic.firstRoundOfBidding &&
//     flipCard.value === 'J' &&
//     game.dealer !== game.currentPlayer &&
//     game.dealer?.team === game.currentPlayer?.team
//   )
//     score += 25;

//   if (gameLogic.suitsInHand === 2) score += 25;

//   if (gameLogic.offSuitAceCount > 0 && gameLogic.trumpCardCount > 2 && gameLogic.suitsInHand <= 3)
//     score += 25;

//   return score;
// }

// function getNegativeModifierForBid(game: EuchreGameInstance, flipCard: Card, gameLogic: GameBidLogic) {
//   let score = 0;

//   if (
//     gameLogic.firstRoundOfBidding &&
//     flipCard.value === 'J' &&
//     game.dealer?.team !== game.currentPlayer?.team
//   )
//     score += 50;
//   if (gameLogic.suitsInHand === 4) score += 50;
//   if (gameLogic.suitsInHand === 3) score += 25;
//   if (gameLogic.offSuitAceCount === 0) score += 25;

//   return score;
// }

// function getRiskScoreForBid(game: EuchreGameInstance, gameLogic: GameBidLogic): number {
//   let score = 0;

//   const team = game.currentPlayer?.team ?? 1;
//   const opposingTeam = team === 1 ? 2 : 1;
//   const currentTeamPoints = game.teamPoints(team);
//   const opposingTeamPoints = game.teamPoints(opposingTeam);
//   const difference = opposingTeamPoints - currentTeamPoints;

//   if (difference >= 4) score += 25;

//   return score;
// }

// function determineDiscard(game: EuchreGameInstance, player: EuchrePlayer, difficulty: GameDifficulty): Card {
//   if (!game.trump) throw Error('Unable to determine discard. Trump card not found.');

//   let lowestScore = 10000;
//   let lowCard: Card | undefined;
//   const playerCards: Card[] = player.availableCards;

//   for (const card of [...playerCards]) {
//     const tempScore =
//       getCardValue(card, game.trump) + getRandomScoreForDifficulty(player.team, difficulty, 0, 50);
//     if (tempScore < lowestScore) {
//       lowestScore = tempScore;
//       lowCard = card;
//     }
//   }

//   if (!lowCard) throw Error('Unable to determine discard.');

//   return lowCard;
// }

// export { determineBidLogic, determineDiscard };
