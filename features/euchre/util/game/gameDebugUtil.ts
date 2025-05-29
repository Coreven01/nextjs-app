import { Card, EuchreHandResult } from '../../definitions/definitions';
import {
  EuchreCard,
  EuchreGameInstance,
  EuchrePlayer,
  EuchreSettings,
  EuchreTrick
} from '../../definitions/game-state-definitions';
import { cardEqual, indexCards } from './cardDataUtil';
import { createTrick, resetForNewDeal } from './gameDataUtil';
import { createEuchreGame } from './gameSetupLogicUtil';
import { getPlayerRotation, playerEqual } from './playerDataUtil';
import { v4 as uuidv4 } from 'uuid';

/** Verify cards were dealt correctly. */
const verifyDealtCards = (game: EuchreGameInstance): void => {
  const msg: string = 'Card dealt verification failed.';

  if (game.deck.length !== 24) {
    throw new Error(msg + ' Invalid deck.');
  }

  if (game.kitty.length !== 4) {
    throw new Error(msg + ' Invalid kitty.');
  }
  const allCardsDealt: Card[] = [game.kitty].flat();

  for (const player of game.gamePlayers) {
    const playerHand: Card[] = player.hand;
    if (playerHand.length !== 5) throw new Error(msg + ' Invalid card count for player: ' + player.name);

    if (playerHand.find((c) => c.value === 'P'))
      throw Error(msg + ' Invalid cards found in player hand. (Value === P) Player: ' + player.name);

    const cardIndices = new Set<number>([...player.hand.map((c) => c.index)]);

    if (cardIndices.values().toArray().length !== 5) {
      throw new Error(msg + ' Invalid card indices for player: ' + player.name);
    }

    allCardsDealt.push(...playerHand);
  }

  const tempSet = new Set<string>([...allCardsDealt.map((c) => `${c.value}${c.suit}`)]);

  if (tempSet.size !== 24) {
    const missingCards = allCardsDealt.filter((c) => !tempSet.has(`${c.value}${c.suit}`));
    throw Error(msg + '  Missing Cards: ' + missingCards.map((c) => `${c.value}${c.suit}`).join(','));
  }
};

/**
 * Undo the result of the last hand and deal the same cards again as if the hand started over.
 */
const reverseLastHandPlayed = (game: EuchreGameInstance): EuchreGameInstance => {
  let newGame: EuchreGameInstance = { ...game };
  const lastHandResult: EuchreHandResult | undefined = newGame.handResults.pop();

  if (!lastHandResult) throw new Error('Hand result not found for replay.');

  const dealer = game.gamePlayers.find((p) => p.playerNumber === lastHandResult.dealerPlayerNumber);

  if (!dealer) throw new Error();

  const discard: Card | null = newGame.discard ? { ...newGame.discard } : null;
  const allCards: EuchreCard[] = lastHandResult.allPlayerCards;
  const currentKitty: Card[] = [
    ...lastHandResult.kitty.map((c) => {
      return { ...c };
    })
  ];
  const dealCount: number[] = newGame.cardDealCount.length > 0 ? [...newGame.cardDealCount] : [2, 3];
  const player1Hand: Card[] = allCards
    .filter((c) => playerEqual(c.player, newGame.player1))
    .map((c) => {
      return { ...c.card };
    });
  const player2Hand: Card[] = allCards
    .filter((c) => playerEqual(c.player, newGame.player2))
    .map((c) => {
      return { ...c.card };
    });
  const player3Hand: Card[] = allCards
    .filter((c) => playerEqual(c.player, newGame.player3))
    .map((c) => {
      return { ...c.card };
    });
  const player4Hand: Card[] = allCards
    .filter((c) => playerEqual(c.player, newGame.player4))
    .map((c) => {
      return { ...c.card };
    });

  newGame = resetForNewDeal(newGame);
  newGame.cardDealCount = dealCount;
  newGame.kitty = currentKitty.map((c) => ({ ...c }));
  newGame.trump = newGame.kitty[0];
  newGame.player1.hand = player1Hand.map((c) => ({ ...c }));
  newGame.player2.hand = player2Hand.map((c) => ({ ...c }));
  newGame.player3.hand = player3Hand.map((c) => ({ ...c }));
  newGame.player4.hand = player4Hand.map((c) => ({ ...c }));
  newGame.dealer = dealer;
  newGame.currentPlayer = getPlayerRotation(newGame.gamePlayers, newGame.dealer)[0];
  newGame.handId = uuidv4();
  newGame.currentTrick = createTrick(lastHandResult.roundNumber);
  const tempTrump = newGame.trump;

  if (discard && newGame.trump) {
    newGame.dealer.hand = [...newGame.dealer.hand.filter((c) => !cardEqual(c, tempTrump)), discard];
  }

  newGame.deck = indexCards([
    ...player1Hand,
    ...player2Hand,
    ...player3Hand,
    ...player4Hand,
    ...currentKitty
  ]);
  newGame.currentRound = lastHandResult.roundNumber;
  for (const player of newGame.gamePlayers) player.hand = indexCards(player.hand);

  verifyDealtCards(newGame);

  return newGame;
};

const createLonerHandResult = (game: EuchreGameInstance) => {
  const deck = game.deck;
  const randomPlayerNumber = 1 + Math.round(Math.random() * 3);
  const dealer = game.gamePlayers.find((p) => p.playerNumber === randomPlayerNumber);

  if (!dealer) throw new Error();

  const teammate = game.gamePlayers.find(
    (p) => p.playerNumber !== randomPlayerNumber && p.team === dealer.team
  );

  if (!teammate) throw new Error();

  game.dealer = dealer;
  const rotation = getPlayerRotation(game.gamePlayers, game.dealer);

  const suitedHand = [
    ...deck.filter((c) => c.suit === '♦' && c.value === 'J'),
    ...deck.filter((c) => c.suit === '♥')
  ];

  const hands = new Map<number, Card[]>();
  hands.set(rotation[0].playerNumber, suitedHand.slice(0, 5));
  let dealtCards: Card[] = [];
  dealtCards = hands.values().toArray().flat();
  let availableCards: Card[];

  for (let i = 2; i < 5; i++) {
    availableCards = deck.filter((c) => dealtCards.find((d) => cardEqual(d, c)) === undefined);
    hands.set(rotation[i - 1].playerNumber, availableCards.slice(0, 5));
    dealtCards = hands.values().toArray().flat();
  }

  const kitty = (availableCards = deck.filter((c) => dealtCards.find((d) => cardEqual(d, c)) === undefined));
  const tricks: EuchreTrick[] = [];
  const players = game.gamePlayers;
  for (const player of rotation) {
    player.hand = hands.get(player.playerNumber) ?? [];
  }

  for (let i = 0; i < 5; i++) {
    const trick: EuchreTrick = {
      trickId: uuidv4(),
      taker: null,
      cardsPlayed: [],
      playerSittingOut: null,
      playerRenege: null,
      round: 1
    };
    for (let j = 0; j < 4; j++) {
      trick.cardsPlayed.push({ player: players[j], card: players[j].hand[i] });
    }
    tricks.push(trick);
  }

  const handResult: EuchreHandResult = {
    tricks: tricks,
    points: 2,
    makerPlayerNumber: dealer.playerNumber,
    teamWon: 1,
    loner: true,
    discard: null,
    turnedDown: null,
    dealerPlayerNumber: dealer.playerNumber,
    roundNumber: 1,
    kitty: kitty,
    trump: kitty[0],
    allPlayerCards: tricks.map((t) => t.cardsPlayed).flat()
  };

  return handResult;
};

/** Copy cards that were dealt from the passed game instance. */
const copyCardsFromReplay = (game: EuchreGameInstance, replayHand: EuchreHandResult): EuchreGameInstance => {
  const newGame: EuchreGameInstance = { ...game };
  const players: EuchrePlayer[] = [...newGame.gamePlayers];

  newGame.cardDealCount = [2, 3];

  if (replayHand.turnedDown) {
    newGame.trump = { ...replayHand.turnedDown };
  } else {
    newGame.trump = { ...replayHand.trump };
  }

  newGame.kitty = replayHand.kitty.map((c) => {
    return { ...c };
  });

  for (let i = 0; i < 4; i++) {
    const player = players[i];
    const playerIsDealer = player.playerNumber === replayHand.dealerPlayerNumber;
    const addDiscardToPlayerHand = playerIsDealer && replayHand.discard;
    const cardsForPlayer = replayHand.allPlayerCards
      .filter((p) => p.player.playerNumber === player.playerNumber)
      .map((c) => ({ ...c.card }));

    if (addDiscardToPlayerHand && replayHand.discard) {
      const dealerOriginalHand: Card[] = cardsForPlayer.filter((c) => !cardEqual(c, newGame.trump));
      player.hand = indexCards([...dealerOriginalHand, { ...replayHand.discard }]);
    } else {
      player.hand = indexCards(cardsForPlayer);
    }

    if (player.hand.length !== 5) {
      throw new Error('Invalid card count for player after copy from replay.');
    }

    if (player.hand.find((c) => c.value === 'P')) {
      throw new Error('Invalid card found for player after copy from replay.');
    }
  }

  newGame.deck = indexCards([...replayHand.allPlayerCards.map((c) => c.card), ...replayHand.kitty]);
  return newGame;
};

const createGameForReplay = (replayGame: EuchreGameInstance, gameSettings: EuchreSettings) => {
  const gameInstance: EuchreGameInstance = createEuchreGame(gameSettings);

  gameInstance.currentPlayer = gameInstance.player1;
  gameInstance.dealer = gameInstance.player1;
  gameInstance.deck = indexCards(replayGame.originalDealDeck.map((c) => ({ ...c })));
  gameInstance.originalDealDeck = replayGame.originalDealDeck.map((c) => ({ ...c }));

  return gameInstance;
};

export {
  reverseLastHandPlayed,
  verifyDealtCards,
  createLonerHandResult,
  copyCardsFromReplay,
  createGameForReplay
};
