import { offsuitValues, trumpValues } from './card-data';
import {
  Card,
  CardColor,
  CardValue,
  EuchreGameInstance,
  EuchrePlayer,
  Suit,
  LEFT_BOWER_VALUE
} from './definitions';
import { createRange } from './util';

/** Create default euchre game with default players and dummy cards. */
export function createEuchreGame(): EuchreGameInstance {
  const player1 = new EuchrePlayer('Nolan', [], 1);
  const player2 = new EuchrePlayer('Jerry', [], 2);
  const player3 = new EuchrePlayer('George', [], 3);
  const player4 = new EuchrePlayer('Elaine', [], 4);

  player1.human = true;
  player3.team = 2;
  player4.team = 2;

  const newGame = new EuchreGameInstance(player1, player2, player3, player4);
  newGame.deck = createPlaceholderCards(24);
  newGame.dealer = player1;

  return newGame;
}

/** Get the rotation of players relative to the given player. */
export function getPlayerRotation(
  players: EuchrePlayer[],
  relativePlayer: EuchrePlayer,
  playerSittingOut: EuchrePlayer | null = null
): EuchrePlayer[] {
  const playerCount = players.length;
  const playerRotation = [1, 3, 2, 4];
  const returnRotation: EuchrePlayer[] = [];
  const indexOffset = (playerRotation.indexOf(relativePlayer.playerNumber) + 1) % playerCount;

  for (let i = 0; i < playerCount; i++) {
    const playerNumber = playerRotation[(i + indexOffset) % playerCount];

    if (playerSittingOut?.playerNumber === playerNumber) continue;

    const player = players.filter((p) => p.playerNumber === playerNumber);
    if (player?.length) returnRotation.push(player[0]);
  }

  return returnRotation;
}

/** Creates a deck of shuffled cards for a euchre game. 24 cards total. */
export function createShuffledDeck(shuffleCount: number): Card[] {
  if (shuffleCount < 1) shuffleCount = 1;

  let newDeck = createEuchreDeck();

  for (let i = 0; i < shuffleCount; i++) newDeck = shuffleDeck(newDeck);

  return newDeck;
}

/** Create a deck of cards used for a euchre game. */
export function createEuchreDeck(): Card[] {
  const availableCards: CardValue[] = ['9', '10', 'J', 'Q', 'K', 'A'];
  const deck: Card[] = [];
  const suits: Suit[] = ['♠', '♥', '♦', '♣'];

  for (let card = 0; card < availableCards.length; card++) {
    for (let suit = 0; suit < suits.length; suit++) {
      deck.push(new Card(suits[suit], availableCards[card]));
    }
  }

  return deck;
}

/** Create cards for the given deck size. All the cards a 2 of spades. */
export function createPlaceholderCards(deckSize: number): Card[] {
  const retval: Card[] = [];
  for (let i = 0; i < deckSize; i++) {
    const temp = new Card('♠', 'P');
    temp.index = -1 - i;
    retval.push(temp);
  }

  return retval;
}

/** Shuffle a deck of cards using random number generator */
export function shuffleDeck(deck: Card[]): Card[] {
  const deckSize = deck.length;
  const newDeck: Card[] = [];
  const randomNumbers: number[] = [];
  let remainingIndexes = createRange(0, deckSize - 1);

  while (randomNumbers.length < deckSize) {
    remainingIndexes = remainingIndexes.filter((val) => !randomNumbers.includes(val));
    const randomNum = Math.floor(Math.random() * (remainingIndexes.length - 1));
    randomNumbers.push(remainingIndexes[randomNum]);
  }

  for (let num = 0; num < deckSize; num++) {
    const card = deck[randomNumbers[num]];
    card.index = num;
    newDeck.push(card);
  }

  if (newDeck.length < deckSize) throw Error('Logic error: wrong deck size');

  return newDeck;
}

/** Get player number and card from the given string. Used to convert a card's element ID back into usable information. */
export function getPlayerAndCard(playerInfo: string): { playerNumber: number; index: number } {
  if (!playerInfo) return { playerNumber: 0, index: -1 };

  const retval = {
    playerNumber: parseInt(playerInfo.charAt(5)),
    index: parseInt(playerInfo.charAt(6))
  };
  return retval;
}

/** Get the card color from the given suit.  */
export function getCardColorFromSuit(suit: Suit): CardColor {
  return suit === '♠' || suit === '♣' ? 'B' : 'R';
}

/** Get the associated card values for the given cards and trump card. */
export function getCardValues(cards: Card[], trump: Card | null): { card: Card; value: number }[] {
  const retval: { card: Card; value: number }[] = [];

  for (let i = 0; i < cards.length; i++) {
    retval.push({ card: cards[i], value: getCardValue(cards[i], trump) });
  }

  return retval;
}

/** Return only the cards and their values for the given suit, based on the trump value. If no suit is provided,
 *  return all cards values.
 */
export function getCardValuesForSuit(
  cards: Card[],
  trump: Card,
  suit: Suit | null
): { card: Card; value: number }[] {
  const retval: { card: Card; value: number }[] = [];
  const excludeLeft = suit ? trump.suit !== suit : false;
  const includeLeft = suit ? trump.suit === suit : true;

  for (const card of cards) {
    if (suit) {
      const cardIsLeft = cardIsLeftBower(card, trump);
      if (excludeLeft && cardIsLeft) continue;

      if (card.suit === suit || (includeLeft && cardIsLeft))
        retval.push({ card: card, value: getCardValue(card, trump) });
    } else {
      retval.push({ card: card, value: getCardValue(card, trump) });
    }
  }

  return retval;
}

/** Return only the cards and their values for the given suit, based on the trump value. If no suit is provided,
 *  return all cards values.
 */
export function getCardValuesExcludeSuit(
  cards: Card[],
  trump: Card,
  excludeSuit: Suit | null
): { card: Card; value: number }[] {
  const retval: { card: Card; value: number }[] = [];
  const excludeLeft = trump.suit === excludeSuit;

  for (const card of cards) {
    if (excludeSuit) {
      const cardIsLeft = cardIsLeftBower(card, trump);
      if (excludeLeft && cardIsLeft) continue;

      if (card.suit !== excludeSuit) retval.push({ card: card, value: getCardValue(card, trump) });
    } else {
      retval.push({ card: card, value: getCardValue(card, trump) });
    }
  }

  return retval;
}

/** */
export function getCardValue(card: Card, trump: Card | null): number {
  return getCardValueBySuit(card, trump);
}

/** */
export function getCardValueBySuit(card: Card, trumpCard: Card | null) {
  let retval = 0;

  if (trumpCard && card.suit === trumpCard.suit) {
    retval = trumpValues.get(card.value) ?? 0;
  } else if (trumpCard && card.value === 'J' && card.color === trumpCard.color) {
    retval = LEFT_BOWER_VALUE;
  } else {
    retval = offsuitValues.get(card.value) ?? 0;
  }

  return retval;
}

/** */
export function getSuitCount(cards: Card[], trumpCard: Card | null): { suit: Suit; count: number }[] {
  const retval: { suit: Suit; count: number }[] = [];

  cards.map((c) => {
    const isLeftBower = trumpCard ? cardIsLeftBower(c, trumpCard) : false;
    const suitForCard = isLeftBower && trumpCard ? trumpCard.suit : c.suit;
    const value: { suit: Suit; count: number } | undefined = retval.find((val) => val.suit === suitForCard);

    if (value) value.count += 1;
    else retval.push({ suit: suitForCard, count: 1 });
  });

  return retval;
}

export function cardIsLeftBower(card: Card, trumpCard: Card): boolean {
  return card.color === trumpCard.color && card.value === 'J' && card.suit !== trumpCard.suit;
}

export function cardIsRightBower(card: Card, trumpCard: Card): boolean {
  return card.value === 'J' && card.suit === trumpCard.suit;
}

export function getHighAndLow(playerHand: Card[], trumpCard: Card): { high: Card | null; low: Card | null } {
  return getHighAndLowFromCards(playerHand, trumpCard);
}

export function getHighAndLowForSuit(
  playerHand: Card[],
  trumpCard: Card,
  suit: Suit
): { high: Card | null; low: Card | null } {
  const hand = playerHand.filter(
    (c) =>
      c.suit === suit || (trumpCard.color === getCardColorFromSuit(suit) && cardIsLeftBower(c, trumpCard))
  );

  return getHighAndLowFromCards(hand, trumpCard);
}

export function getHighAndLowExcludeSuit(
  playerHand: Card[],
  trumpCard: Card,
  excludeSuits: Suit[]
): { high: Card | null; low: Card | null } {
  const excludeLeftFromHand = excludeSuits.includes(trumpCard.suit);

  const hand = playerHand.filter((c) => {
    const cardIsLeft = cardIsLeftBower(c, trumpCard);
    if (excludeLeftFromHand && cardIsLeft) return false;
    if (!cardIsLeft && excludeSuits.includes(c.suit)) return false;

    return true;
  });

  return getHighAndLowFromCards(hand, trumpCard);
}

function getHighAndLowFromCards(
  playerHand: Card[],
  trumpCard: Card
): { high: Card | null; low: Card | null } {
  let highCardVal = 0;
  let lowCardVal = 1000;
  let highCard: Card | null = null;
  let lowCard: Card | null = null;

  for (const card of playerHand) {
    const cardVal = getCardValue(card, trumpCard);

    if (cardVal > highCardVal) {
      highCard = card;
      highCardVal = cardVal;
    }

    if (cardVal < lowCardVal) {
      lowCard = card;
      lowCardVal = cardVal;
    }
  }

  return { high: highCard, low: lowCard };
}
