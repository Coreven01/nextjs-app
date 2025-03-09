import {
  cardIsLeftBower,
  createDummyCards,
  getCardColorFromSuit,
  getCardValues,
  getPlayerRotation,
  getSuitCount
} from './game';
import { determineBidLogic, determineDiscard } from './game-bid-logic';
import { determineCardToPlayLogic } from './game-play-logic';

const CARD_WIDTH = 75;
const CARD_HEIGHT = 112.5;
export const SPADE: string = '♠';
export const HEART: string = '♥';
export const DIAMOND: string = '♦';
export const CLUB: string = '♣';
export const LEFT_BOWER_VALUE = 250;
export type Suit = '♠' | '♥' | '♦' | '♣';
export type CardValue =
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K'
  | 'A'
  | 'JK';
export type CardColor = 'R' | 'B';

export interface EuchreHandResult {
  tricks: EuchreTrick[];
  points: number;
  maker: EuchrePlayer;
  dealer: EuchrePlayer;
  taker: EuchrePlayer;
  teamWon: 1 | 2;
  roundNumber: number;
  loner: boolean;
  trump: Card;
  trumpWasNamed: boolean;
}

export interface EuchreSettings {
  shouldAnimate: boolean;
  debugAlwaysPass: boolean;
  gameSpeed: number;
  showHandResult: boolean;
}

export interface BidResult {
  orderTrump: boolean;
  loner: boolean;
  calledSuit: Suit | null;
}

class EuchrePlayer {
  name: string;
  hand: Card[];
  placeholder: Card[] = [];
  playedCards: Card[] = [];
  playerNumber: 1 | 2 | 3 | 4;
  team: 1 | 2 = 1;
  human: boolean = false;

  constructor(name: string, hand: Card[], playerNumber: 1 | 2 | 3 | 4) {
    this.name = name;
    this.hand = hand;
    this.playerNumber = playerNumber;
    this.placeholder = createDummyCards(5);
  }

  get innerPlayerBaseId(): string {
    return `game-base-${this.playerNumber}-inner`;
  }

  get outerPlayerBaseId(): string {
    return `game-base-${this.playerNumber}`;
  }

  get playerBase(): string {
    return `player-base-${this.playerNumber}`;
  }

  get location(): 'center' | 'side' {
    return this.playerNumber === 1 || this.playerNumber === 2 ? 'center' : 'side';
  }

  generateElementId(): string {
    return `player-${this.playerNumber}-${Math.floor(Math.random() * 1000)}`;
  }

  /** Routine to determine if the computer should indicate if the flipped card should be picked up, or should name suit. */
  determineBid(game: EuchreGameInstance, flipCard: Card, canNameSuit: boolean): BidResult {
    const result = determineBidLogic(game, flipCard, canNameSuit);
    return result;
  }

  determineCardToPlay(game: EuchreGameInstance): Card {
    return determineCardToPlayLogic(game);
  }

  /** */
  chooseDiscard(game: EuchreGameInstance) {
    const cardToDiscard = determineDiscard(game, this);
    if (game.trump) this.discard(cardToDiscard, game.trump);
  }

  discard(cardToDiscard: Card, trump: Card) {
    if (this.hand.find((c) => c === cardToDiscard)) {
      this.hand = [...this.hand, trump].filter((c) => c !== cardToDiscard);
    } else {
      throw new Error("Unable to discard. Card not found in player's hand.");
    }

    console.log('Card selected for discard: ', cardToDiscard);
  }

  orderHand(trump: Card | null): void {
    if (this.hand.length < 2) return;

    const tempHand: Card[] = [];
    const suitCount = getSuitCount(this.hand, trump).sort((a, b) => b.count - a.count);
    const cardValues = getCardValues(this.hand, trump);

    if (trump) {
      const trumpCards = cardValues
        .filter((c) => c.card.suit === trump.suit || cardIsLeftBower(c.card, trump))
        .sort((a, b) => b.value - a.value)
        .map((c) => c.card);
      tempHand.push(...trumpCards);

      const offSuitCards = cardValues.filter((c) => !trumpCards.includes(c.card));
      for (const suitVal of suitCount.filter((s) => s.suit !== trump.suit)) {
        tempHand.push(
          ...offSuitCards
            .filter((c) => c.card.suit === suitVal.suit)
            .sort((a, b) => b.value - a.value)
            .map((c) => c.card)
        );
      }
    } else {
      for (const suitVal of suitCount) {
        tempHand.push(
          ...cardValues
            .filter((c) => c.card.suit === suitVal.suit)
            .sort((a, b) => b.value - a.value)
            .map((c) => c.card)
        );
      }
    }

    tempHand.forEach((c, index) => (c.index = index));
    this.hand = tempHand;
  }
}

class Card {
  suit: Suit;
  value: CardValue;
  index: number = 0;

  constructor(suit: Suit, value: CardValue) {
    this.suit = suit;
    this.value = value;
  }

  get color(): CardColor {
    return getCardColorFromSuit(this.suit);
  }

  get cardId(): string {
    return `card-${this.index}`;
  }

  getDisplayWidth(location: 'center' | 'side'): number {
    return location === 'center' ? CARD_WIDTH : CARD_HEIGHT;
  }

  getDisplayHeight(location: 'center' | 'side'): number {
    return location === 'center' ? CARD_HEIGHT : CARD_WIDTH;
  }

  generateElementId(): string {
    return `card-${this.index}-${Math.floor(Math.random() * 1000)}`;
  }
}

class EuchreGameInstance {
  player1: EuchrePlayer;
  player2: EuchrePlayer;
  player3: EuchrePlayer;
  player4: EuchrePlayer;

  deck: Card[] = [];
  kitty: Card[] = [];
  dealer: EuchrePlayer | null = null;
  currentTricks: EuchreTrick[] = [];
  gameResults: EuchreHandResult[] = [];
  currentPlayer: EuchrePlayer | null = null;
  maker: EuchrePlayer | null = null;
  loner: boolean = false;
  trump: Card | null = null;
  cardDealCount: number[] = [];
  currentRound: number = 1;

  constructor(
    player1: EuchrePlayer,
    player2: EuchrePlayer,
    player3: EuchrePlayer,
    player4: EuchrePlayer
  ) {
    this.player1 = player1;
    this.player2 = player2;
    this.player3 = player3;
    this.player4 = player4;
  }

  get gamePlayers(): EuchrePlayer[] {
    return [this.player1, this.player2, this.player3, this.player4];
  }

  get playerSittingOut(): EuchrePlayer | null {
    if (this.maker && this.loner)
      return (
        this.gamePlayers.find(
          (p) => p.team === this.maker?.team && p.playerNumber !== this.maker.playerNumber
        ) ?? null
      );

    return null;
  }

  get currentTrick() {
    return this.currentTricks.at(-1);
  }

  resetForNewGame() {
    this.gameResults = [];
    this.dealer = null;
    this.deck = createDummyCards(24);
    this.resetForNewDeal();
  }

  resetForNewDeal() {
    this.kitty = [];
    this.deck = createDummyCards(24);
    this.currentPlayer = null;
    this.maker = null;
    this.loner = false;
    this.trump = null;
    this.cardDealCount = [];
    this.currentTricks = [];

    const players = [this.player1, this.player2, this.player3, this.player4];

    for (const player of players) {
      player.hand = [];
      player.playedCards = [];
      player.placeholder = createDummyCards(5);
    }
  }

  shallowCopy(): EuchreGameInstance {
    const game = new EuchreGameInstance(this.player1, this.player2, this.player3, this.player4);
    game.deck = this.deck;
    game.kitty = this.kitty;
    game.dealer = this.dealer;
    game.currentPlayer = this.currentPlayer;
    game.loner = this.loner;
    game.trump = this.trump;
    game.maker = this.maker;
    game.cardDealCount = this.cardDealCount;
    game.currentTricks = this.currentTricks;
    game.gameResults = this.gameResults;
    game.currentRound = this.currentRound;

    return game;
  }

  dealCards(): void {
    if (!this.dealer) throw Error('Unable to deal cards. Dealer not found.');

    const players: EuchrePlayer[] = getPlayerRotation(this.gamePlayers, this.dealer);

    const randomNum = Math.floor(Math.random() * 3) + 1;
    let counter = 0;
    this.cardDealCount = [randomNum, 5 - randomNum];

    for (let i = 0; i < 8; i++) {
      let numberOfCards = 0;
      const currentPlayer = players[i % 4];
      const firstRound = i < 4;

      if (firstRound) numberOfCards = i % 2 ? randomNum : 5 - randomNum;
      else numberOfCards = i % 2 ? 5 - randomNum : randomNum;

      for (let j = 0; j < numberOfCards; j++) {
        currentPlayer.hand.push(this.deck[counter] ?? new Card('♠', 'JK'));
        counter++;
      }
    }

    while (counter < this.deck.length) {
      this.kitty.push(this.deck[counter] ?? new Card('♠', 'JK'));
      counter++;
    }
  }

  verifyDealtCards(): void {
    const allCardsDealt = [
      this.player1.hand,
      this.player2.hand,
      this.player3.hand,
      this.player4.hand,
      this.kitty
    ].flat();

    if (allCardsDealt.length != 24) throw Error('Verify failed. Invalid card count');

    const tempSet = new Set<string>([...allCardsDealt.map((c) => `${c.value}${c.suit}`)]);

    if (tempSet.size != 24) throw Error('Verify failed. Invalid card count');
  }

  getHandResult(): EuchreHandResult {
    if (!this.dealer || !this.maker) throw new Error();

    const taker = this.currentTricks.find((t) => t.taker !== undefined)?.taker;

    if (!taker) throw new Error('Taker was not found for hand result.');

    const makerTricksWon = this.currentTricks.filter(
      (t) => t.taker?.team === this.maker?.team
    ).length;
    let points = 0;
    let teamWon = this.maker.team;

    if (this.loner && makerTricksWon === 5) {
      points = 4;
    } else if (makerTricksWon === 5) {
      points = 2;
    } else if (makerTricksWon >= 3) {
      points = 1;
    } else {
      points = 2;
      teamWon = teamWon === 1 ? 2 : 1;
    }

    const retval: EuchreHandResult = {
      tricks: [...this.currentTricks],
      points: points,
      teamWon: teamWon,
      dealer: this.dealer,
      maker: this.maker,
      taker: taker,
      roundNumber: this.currentRound,
      loner: this.loner,
      trump: this.trump ?? new Card('♠', '2'),
      trumpWasNamed: this.trump?.value === '2'
    };

    return retval;
  }
}

class EuchreTrick {
  taker: EuchrePlayer | undefined = undefined;
  cardsPlayed: EuchreCard[] = [];
  round: number = 0;

  constructor(round: number) {
    this.round = round;
  }

  static get defaultVal(): EuchreTrick {
    return new EuchreTrick(0);
  }
}

class EuchreCard {
  player: EuchrePlayer;
  card: Card;

  constructor(player: EuchrePlayer, card: Card) {
    this.player = player;
    this.card = card;
  }
}

export { EuchreCard, EuchreTrick, EuchreGameInstance, EuchrePlayer, Card };
