import { offsuitValues, trumpValues } from '@/app/lib/euchre/card-data';
import { Card, CardColor, CardValue, LEFT_BOWER_VALUE, Suit } from '@/app/lib/euchre/definitions';
import { createRange } from '@/app/lib/euchre/util';
import { useCallback } from 'react';

const useCardData = () => {
  const CARD_WIDTH = 100;
  const CARD_HEIGHT = 150;

  const cardEqual = useCallback((card1: Card, card2: Card): boolean => {
    return card1.value === card2.value && card1.suit === card2.suit;
  }, []);

  const cardId = (card: Card): string => {
    return `card-${card.index}`;
  };

  const isPlaceHolder = (card: Card): boolean => {
    return card.value === 'P';
  };

  const getDisplayWidth = (location: 'center' | 'side'): number => {
    return location === 'center' ? CARD_WIDTH : CARD_HEIGHT;
  };

  const getDisplayHeight = (location: 'center' | 'side'): number => {
    return location === 'center' ? CARD_HEIGHT : CARD_WIDTH;
  };

  /** Get the card color from the given suit.  */
  const getCardColor = (suit: Suit): CardColor => {
    return suit === '♠' || suit === '♣' ? 'B' : 'R';
  };

  const cardIsLeftBower = useCallback((card: Card, trumpCard: Card): boolean => {
    return (
      getCardColor(card.suit) === getCardColor(trumpCard.suit) &&
      card.value === 'J' &&
      card.suit !== trumpCard.suit
    );
  }, []);

  const cardIsRightBower = useCallback((card: Card, trumpCard: Card): boolean => {
    return card.value === 'J' && card.suit === trumpCard.suit;
  }, []);

  /** Get the associated card values for the given cards and trump card. */
  const getCardValues = (cards: Card[], trump: Card | null): { card: Card; value: number }[] => {
    const retval: { card: Card; value: number }[] = [];

    for (let i = 0; i < cards.length; i++) {
      retval.push({ card: cards[i], value: getCardValue(cards[i], trump) });
    }

    return retval;
  };

  /** Return only the cards and their values for the given suit, based on the trump value. If no suit is provided,
   *  return all cards values.
   */
  const getCardValuesForSuit = (
    cards: Card[],
    trump: Card,
    suit: Suit | null
  ): { card: Card; value: number }[] => {
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
  };

  /** Return only the cards and their values for the given suit, based on the trump value. If no suit is provided,
   *  return all cards values.
   */
  const getCardValuesExcludeSuit = (
    cards: Card[],
    trump: Card,
    excludeSuit: Suit | null
  ): { card: Card; value: number }[] => {
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
  };

  /** */
  const getCardValueBySuit = useCallback(
    (card: Card, trumpCard: Card | null) => {
      let retval = 0;

      if (trumpCard && card.suit === trumpCard.suit) {
        retval = trumpValues.get(card.value) ?? 0;
      } else if (trumpCard && cardIsLeftBower(card, trumpCard)) {
        retval = LEFT_BOWER_VALUE;
      } else {
        retval = offsuitValues.get(card.value) ?? 0;
      }

      return retval;
    },
    [cardIsLeftBower]
  );

  /** */
  const getCardValue = useCallback(
    (card: Card, trump: Card | null): number => {
      return getCardValueBySuit(card, trump);
    },
    [getCardValueBySuit]
  );

  /** */
  const getSuitCount = (cards: Card[], trumpCard: Card | null): { suit: Suit; count: number }[] => {
    const retval: { suit: Suit; count: number }[] = [];

    cards.map((c) => {
      const isLeftBower = trumpCard ? cardIsLeftBower(c, trumpCard) : false;
      const suitForCard = isLeftBower && trumpCard ? trumpCard.suit : c.suit;
      const value: { suit: Suit; count: number } | undefined = retval.find((val) => val.suit === suitForCard);

      if (value) value.count += 1;
      else retval.push({ suit: suitForCard, count: 1 });
    });

    return retval;
  };

  const getHighAndLow = (playerHand: Card[], trumpCard: Card): { high: Card | null; low: Card | null } => {
    return getHighAndLowFromCards(playerHand, trumpCard);
  };

  const getHighAndLowForSuit = (
    playerHand: Card[],
    trumpCard: Card,
    suit: Suit
  ): { high: Card | null; low: Card | null } => {
    const hand = playerHand.filter(
      (c) =>
        c.suit === suit ||
        (getCardColor(trumpCard.suit) === getCardColor(suit) && cardIsLeftBower(c, trumpCard))
    );

    return getHighAndLowFromCards(hand, trumpCard);
  };

  const getHighAndLowExcludeSuit = (
    playerHand: Card[],
    trumpCard: Card,
    excludeSuits: Suit[]
  ): { high: Card | null; low: Card | null } => {
    const excludeLeftFromHand = excludeSuits.includes(trumpCard.suit);

    const hand = playerHand.filter((c) => {
      const cardIsLeft = cardIsLeftBower(c, trumpCard);
      if (excludeLeftFromHand && cardIsLeft) return false;
      if (!cardIsLeft && excludeSuits.includes(c.suit)) return false;

      return true;
    });

    return getHighAndLowFromCards(hand, trumpCard);
  };

  const getHighAndLowFromCards = (
    playerHand: Card[],
    trumpCard: Card
  ): { high: Card | null; low: Card | null } => {
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
  };

  /** Creates a deck of shuffled cards for a euchre game. 24 cards total.
   *
   */
  const createShuffledDeck = (shuffleCount: number): Card[] => {
    if (shuffleCount < 1) shuffleCount = 1;

    let newDeck = createEuchreDeck();

    for (let i = 0; i < shuffleCount; i++) newDeck = shuffleDeck(newDeck);

    return newDeck;
  };

  /** Create a deck of cards used for a euchre game.
   *
   */
  const createEuchreDeck = (): Card[] => {
    const availableValues: CardValue[] = ['9', '10', 'J', 'Q', 'K', 'A'];
    const deck: Card[] = [];
    const suits: Suit[] = ['♠', '♥', '♦', '♣'];

    for (let card = 0; card < availableValues.length; card++) {
      for (let suit = 0; suit < suits.length; suit++) {
        deck.push({ suit: suits[suit], value: availableValues[card], index: 0 });
      }
    }

    return deck;
  };

  /** Create cards for the given deck size.
   *
   */
  const createPlaceholderCards = useCallback((deckSize: number): Card[] => {
    const retval: Card[] = [];
    for (let i = 0; i < deckSize; i++) {
      const temp: Card = { suit: '♠', value: 'P', index: i };
      retval.push(temp);
    }

    return retval;
  }, []);

  /** Shuffle a deck of cards using random number generator
   *
   */
  const shuffleDeck = (deck: Card[]): Card[] => {
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
  };

  return {
    cardEqual,
    cardId,
    isPlaceHolder,
    getDisplayHeight,
    getDisplayWidth,
    createShuffledDeck,
    cardIsLeftBower,
    cardIsRightBower,
    createPlaceholderCards,
    getCardValues,
    getSuitCount,
    getCardValue,
    getCardValuesForSuit,
    getHighAndLow,
    getHighAndLowForSuit,
    getCardValuesExcludeSuit,
    getHighAndLowExcludeSuit,
    getCardColor
  };
};

export default useCardData;
