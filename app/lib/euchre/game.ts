import { offsuitValues, trumpValues } from './card-data';
import { LEFT_BOWER_VALUE } from './constants';
import { Card, CardColor, CardValue, EuchreGameInstance, EuchrePlayer, Suit } from './data';

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
  newGame.deck = createDummyCards(24);
  newGame.dealer = player1;

  return newGame;
}

/** Get the rotation of players relative to the given player. */
export function getPlayerRotation(
  players: EuchrePlayer[],
  relativePlayer: EuchrePlayer,
  playerSittingOut: EuchrePlayer | undefined = undefined
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
export function createDummyCards(deckSize: number): Card[] {
  const retval: Card[] = [];
  for (let i = 0; i < deckSize; i++) retval.push(new Card('♠', '2'));

  return retval;
}

/** Shuffle a deck of cards using random number renerator */
export function shuffleDeck(deck: Card[]): Card[] {
  const deckSize = deck.length;
  const newDeck: Card[] = [];
  const randomNumbers: number[] = [];
  const validIndexes = createRange(0, deckSize - 1);
  let counter = 0;

  while (randomNumbers.length < deckSize) {
    let randomNum = Math.floor(Math.random() * (deckSize - 1));
    if (!randomNumbers.includes(randomNum)) randomNumbers.push(randomNum);

    if (randomNumbers.length > deckSize - 5) {
      const remainingIndexes = validIndexes.filter((val) => !randomNumbers.includes(val));

      if (remainingIndexes.length === 2) {
        const lastTwoIndexes = [randomNum % 2, (randomNum + 1) % 2];
        randomNumbers.push(remainingIndexes[lastTwoIndexes[0]]);
        randomNumbers.push(remainingIndexes[lastTwoIndexes[1]]);
      } else {
        randomNum = Math.floor(Math.random() * (remainingIndexes.length - 1));
        randomNumbers.push(remainingIndexes[randomNum]);
      }
    }
    counter++;

    if (counter > 100) throw Error('Error shuffling deck. Random number count exceeded.');
  }

  for (let num = 0; num < deckSize; num++) {
    const card = deck[randomNumbers[num]];
    card.index = num;
    newDeck.push(deck[randomNumbers[num]]);
  }

  if (newDeck.length < deckSize) throw Error('Logic error: wrong deck size');

  return newDeck;
}

/** Create range of numbers between the givent start and end */
function createRange(start: number, end: number): number[] {
  const result = [];

  for (let i = start; i <= end; i++) {
    result.push(i);
  }

  return result;
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
export function getCardValues(cards: Card[], trump: Card): { card: Card; value: number }[] {
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
export function getCardValue(card: Card, trump: Card): number {
  return getCardValueBySuit(card, trump);
}

/** */
export function getCardValueBySuit(card: Card, trumpCard: Card) {
  let retval = 0;

  if (card.suit === trumpCard.suit) {
    retval = trumpValues.get(card.value) ?? 0;
  } else if (card.value === 'J' && card.color === trumpCard.color) {
    retval = LEFT_BOWER_VALUE;
  } else {
    retval = offsuitValues.get(card.value) ?? 0;
  }

  return retval;
}

/** */
export function getSuitCount(cards: Card[], trumpCard: Card): { suit: Suit; count: number }[] {
  const retval: { suit: Suit; count: number }[] = [];

  cards.map((c) => {
    const isLeftBower = cardIsLeftBower(c, trumpCard);
    const suitForCard = isLeftBower ? trumpCard.suit : c.suit;
    const value: { suit: Suit; count: number } | undefined = retval.find(
      (val) => val.suit === suitForCard
    );

    if (value) value.count += 1;
    else retval.push({ suit: suitForCard, count: 1 });
  });

  return retval;
}

export function cardIsLeftBower(card: Card, trumpCard: Card): boolean {
  return card.color === trumpCard.color && card.value === 'J' && card.suit !== trumpCard.suit;
}

export function getHighAndLow(
  playerHand: Card[],
  trumpCard: Card
): { high: Card | null; low: Card | null } {
  return getHighAndLowFromCards(playerHand, trumpCard);
}

export function getHighAndLowForSuit(
  playerHand: Card[],
  trumpCard: Card,
  suit: Suit
): { high: Card | null; low: Card | null } {
  const hand = playerHand.filter(
    (c) =>
      c.suit === suit ||
      (trumpCard.color === getCardColorFromSuit(suit) && cardIsLeftBower(c, trumpCard))
  );

  return getHighAndLowFromCards(hand, trumpCard);
}

export function getHighAndLowExcludeSuit(
  playerHand: Card[],
  trumpCard: Card,
  excludeSuit: Suit
): { high: Card | null; low: Card | null } {
  let hand = playerHand.filter((c) => c.suit !== excludeSuit);

  if (trumpCard.suit === excludeSuit) hand = hand.filter((c) => !cardIsLeftBower(c, trumpCard));

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
