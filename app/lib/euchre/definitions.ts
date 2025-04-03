import { orderPlayerHand } from './card-data';
import {
  cardIsLeftBower,
  createPlaceholderCards,
  getCardColorFromSuit,
  getCardValues,
  getPlayerRotation,
  getSuitCount
} from './game';
import { determineBidLogic, determineDiscard } from './game-bid-logic';
import {
  determineCardToPlayLogic,
  determineCurrentWinnerForTrick,
  didPlayerFollowSuit
} from './game-play-logic';

const arrowUpSvg = `checked:bg-[url('/arrowup.svg')] bg-[url('/arrowup.svg')]`;
const arrowDownSvg = `checked:bg-[url('/arrowdown.svg')] bg-[url('/arrowdown.svg')]`;
const menuSvg =
  (true ? arrowDownSvg : arrowUpSvg) +
  ` bg-no-repeat bg-center bg-[length:1.75rem] bg-[rgba(25,115,25,0.9)]
dark:bg-[rgba(25,115,25,0.9)] border border-black appearance-none cursor-pointer border rounded w-8 h-8 checked:dark:bg-stone-500`;

export const RANDOM_FOR_DIFFICULTY = new Map<GameDifficulty, number>([
  ['novice', 0.6],
  ['intermediate', 0.3],
  ['expert', 0]
]);

const CARD_WIDTH = 100;
const CARD_HEIGHT = 150;
export type TeamColor = 'red' | 'blue' | 'orange' | 'yellow' | 'green' | 'white' | 'pink' | 'purple';
export type GameDifficulty = 'novice' | 'intermediate' | 'expert';
export type CardBackColor = 'green' | 'blue' | 'red' | 'black';

export const TEAM_COLOR_MAP: Map<TeamColor, string> = new Map([
  ['red', 'bg-red-600'],
  ['blue', 'bg-blue-600'],
  ['orange', 'bg-orange-500'],
  ['yellow', 'bg-yellow-300'],
  ['green', 'bg-green-600'],
  ['white', 'bg-white'],
  ['pink', 'bg-pink-300'],
  ['purple', 'bg-purple-600']
]);

export const GAME_SPEED_MAP = new Map<string, GameSpeed>([
  ['Faster', 300],
  ['Fast', 700],
  ['Normal', 1000],
  ['Slow', 2000],
  ['Slower', 4000]
]);

export const DIFFICULTY_MAP = new Map<string, GameDifficulty>([
  ['Novice', 'novice'],
  ['Intermediate', 'intermediate'],
  ['Expert', 'expert']
]);

export enum PromptType {
  BID,
  GAME_RESULT,
  HAND_RESULT,
  DISCARD
}
export type PromptValue = {
  type: PromptType;
};

export const AVAILABLE_GAME_SPEED: GameSpeed[] = [150, 300, 700, 1000, 2000, 3000, 4000];
export const AVAILABLE_SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
export const SPADE: string = '♠';
export const HEART: string = '♥';
export const DIAMOND: string = '♦';
export const CLUB: string = '♣';
export const LEFT_BOWER_VALUE = 250;
export type ResultHighlight = 'player1' | 'player2' | 'player3' | 'player4' | 'winner' | 'trump';
export type GameSpeed = 150 | 300 | 700 | 1000 | 2000 | 3000 | 4000;
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
  | 'JK'
  | 'P';
export type CardColor = 'R' | 'B';

export interface EuchreHandResult extends EuchrePlayersPassedResult {
  tricks: EuchreTrick[];
  points: number;
  maker: EuchrePlayer;
  teamWon: 1 | 2;
  loner: boolean;
  discard: Card | null;
  turnedDown: Card | null;
  defenders: EuchrePlayer[];
}
export interface EuchrePlayersPassedResult {
  dealer: EuchrePlayer;
  roundNumber: number;
  kitty: Card[];
  trump: Card;
  allPlayerCards: EuchreCard[];
}

export interface EuchreSettings {
  shouldAnimate: boolean;
  gameSpeed: GameSpeed;
  showHandResult: boolean;
  teamOneColor: TeamColor;
  teamTwoColor: TeamColor;
  enforceFollowSuit: boolean;
  autoFollowSuit: boolean;
  debugShowPlayersHand: boolean;
  debugShowHandsWhenPassed: boolean;
  debugAlwaysPass: boolean;
  difficulty: GameDifficulty;
  viewPlayerInfoDetail: boolean;
  cardColor: CardBackColor;
  stickTheDealer: boolean;
  playerName: string;
}

export interface BidResult {
  orderTrump: boolean;
  loner: boolean;
  calledSuit: Suit | null;
  handScore: number;
}

class EuchrePlayer {
  readonly name: string;
  private hand: Card[] = [];
  placeholder: Card[] = [];
  playedCards: Card[] = [];
  readonly playerNumber: 1 | 2 | 3 | 4;
  readonly team: 1 | 2 = 1;
  human: boolean = false;

  constructor(name: string, team: 1 | 2, playerNumber: 1 | 2 | 3 | 4) {
    this.name = name;
    this.team = team;
    this.playerNumber = playerNumber;
    this.placeholder = createPlaceholderCards(5);
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

  get availableCards(): Card[] {
    return this.hand.filter((c) => c.value !== 'P');
  }

  /** Return 5 cards for the player's hand, however it inclues "placement" cards for cards that have already been played.
   * These placement cards are intended to be hidden by the UI. */
  get displayCards(): Card[] {
    return [...this.hand];
  }

  set assignCards(cards: Card[]) {
    this.hand = cards;
  }

  equal(other: EuchrePlayer): boolean {
    return this.playerNumber === other.playerNumber;
  }

  getTeamColor(settings: EuchreSettings): TeamColor {
    if (this.team === 1) {
      return settings.teamOneColor;
    } else {
      return settings.teamTwoColor;
    }
  }

  getTeamCssClass(settings: EuchreSettings): string {
    const teamColor = this.getTeamColor(settings);
    const teamCss = TEAM_COLOR_MAP.get(teamColor);

    if (teamCss) return teamCss;

    return 'bg-white';
  }

  addToHand(cards: Card[]) {
    this.hand = [...this.hand, ...cards];
  }

  generateElementId(): string {
    return `player-${this.playerNumber}-${Math.floor(Math.random() * 1000)}`;
  }

  /** Routine to determine if the computer should indicate if the flipped card should be picked up, or should name suit. */
  determineBid(
    game: EuchreGameInstance,
    flipCard: Card,
    firstRoundOfBidding: boolean,
    gameSettings: EuchreSettings
  ): BidResult {
    return determineBidLogic(game, flipCard, firstRoundOfBidding, gameSettings);
  }

  determineCardToPlay(game: EuchreGameInstance, difficulty: GameDifficulty): Card {
    return determineCardToPlayLogic(game, difficulty);
  }

  /** */
  chooseDiscard(game: EuchreGameInstance, difficulty: GameDifficulty): Card {
    const cardToDiscard = determineDiscard(game, this, difficulty);
    if (game.trump) this.discard(cardToDiscard, game.trump);
    return cardToDiscard;
  }

  discard(cardToDiscard: Card, trump: Card) {
    if (this.hand.find((c) => c === cardToDiscard)) {
      const tempHand = [...this.hand, trump].filter((c) => c !== cardToDiscard);
      tempHand.forEach((c, index) => (c.index = index));
      this.hand = tempHand;
    } else {
      throw new Error("Unable to discard. Card not found in player's hand.");
    }
  }

  playGameCard(card: Card): EuchreCard {
    const euchreCard = new EuchreCard(this, card);
    const tempCards = this.availableCards.filter((c) => c !== card);
    this.assignCards = tempCards;
    this.playedCards.push(card);

    return euchreCard;
  }

  sortCards(trump: Card | null): void {
    let tempHand: Card[] = this.availableCards;

    if (tempHand.length < 5) {
      tempHand = orderPlayerHand(tempHand);
      tempHand.forEach((c, index) => (c.index = index));
      this.hand = tempHand;

      return;
    }

    tempHand = [];
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

    tempHand = orderPlayerHand(tempHand);
    tempHand.forEach((c, index) => (c.index = index));
    this.hand = tempHand;
  }
}

class Card {
  readonly suit: Suit;
  readonly value: CardValue;
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

  get isPlaceHolder(): boolean {
    return this.value === 'P';
  }

  equal(other: Card): boolean {
    return this.value === other.value && this.suit === other.suit;
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
  readonly player1: EuchrePlayer;
  readonly player2: EuchrePlayer;
  readonly player3: EuchrePlayer;
  readonly player4: EuchrePlayer;

  deck: Card[] = [];
  kitty: Card[] = [];
  dealer: EuchrePlayer | null = null;
  maker: EuchrePlayer | null = null;
  loner: boolean = false;
  trump: Card | null = null;
  discard: Card | null = null;
  turnedDown: Card | null = null;
  cardDealCount: number[] = [];
  currentRound: number = 1;

  private currentTricks: EuchreTrick[] = [];
  private gameResults: EuchreHandResult[] = [];
  private _currentPlayer: EuchrePlayer | null = null;

  constructor(player1: EuchrePlayer, player2: EuchrePlayer, player3: EuchrePlayer, player4: EuchrePlayer) {
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

  get currentTrick(): EuchreTrick | null {
    const lastTrick = this.currentTricks.at(-1);

    if (!lastTrick) return null;

    return { ...lastTrick };
  }

  get handTricks(): EuchreTrick[] {
    return [...this.currentTricks];
  }

  get handFinished(): boolean {
    const playerReneged = this.currentTrick && this.currentTrick.playerRenege !== null;
    const allCardsPlayed = this.currentTricks.filter((t) => t.taker !== null).length === 5;
    return playerReneged || allCardsPlayed;
  }

  get allGameResults(): EuchreHandResult[] {
    return [...this.gameResults];
  }
  get trickFinished(): boolean {
    const playerReneged = this.currentTrick && this.currentTrick.playerRenege !== null;
    const allPlayersPlayed =
      (this.currentTrick && this.currentTrick.cardsPlayed.length === (this.loner ? 3 : 4)) ?? false;
    return playerReneged || allPlayersPlayed;
  }

  get isGameOver(): boolean {
    const teamOnePoints = this.teamPoints(1);
    const teamTwoPoints = this.teamPoints(2);

    return teamOnePoints >= 10 || teamTwoPoints >= 10;
  }

  get currentPlayer(): EuchrePlayer | null {
    return this._currentPlayer;
  }

  assignDealerAndPlayer(player: EuchrePlayer): void {
    this.dealer = player;
    this._currentPlayer = player;
  }

  /** Set the current player */
  assignPlayer(player: EuchrePlayer): void {
    this._currentPlayer = player;
  }

  teamPoints(teamNumber: 1 | 2): number {
    return this.gameResults
      .filter((t) => t.teamWon === teamNumber)
      .map((t) => t.points)
      .reduce((acc, curr) => acc + curr, 0);
  }

  addTrickForNewHand(): void {
    this.currentTricks.push(new EuchreTrick(this.currentRound));
  }

  resetForNewGame(): void {
    this.gameResults = [];
    this.dealer = null;
    this.deck = createPlaceholderCards(24);
    this.resetForNewDeal();
  }

  resetForNewDeal(): void {
    this.kitty = [];
    this.deck = createPlaceholderCards(24);
    this._currentPlayer = null;
    this.maker = null;
    this.loner = false;
    this.trump = null;
    this.discard = null;
    this.turnedDown = null;
    this.cardDealCount = [];
    this.currentTricks = [];

    this.resetPlayerCards();
  }

  resetPlayerCards(): void {
    const players = [this.player1, this.player2, this.player3, this.player4];

    for (const player of players) {
      player.assignCards = [];
      player.playedCards = [];
      player.placeholder = createPlaceholderCards(5);
    }
  }

  shallowCopy(): EuchreGameInstance {
    const game = new EuchreGameInstance(this.player1, this.player2, this.player3, this.player4);
    game.deck = this.deck;
    game.kitty = this.kitty;
    game.dealer = this.dealer;
    game._currentPlayer = this.currentPlayer;
    game.loner = this.loner;
    game.trump = this.trump;
    game.maker = this.maker;
    game.cardDealCount = this.cardDealCount;
    game.currentTricks = this.currentTricks;
    game.gameResults = this.gameResults;
    game.currentRound = this.currentRound;
    game.discard = this.discard;
    game.turnedDown = this.turnedDown;

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
      const tempHand: Card[] = [];

      if (firstRound) numberOfCards = i % 2 ? randomNum : 5 - randomNum;
      else numberOfCards = i % 2 ? 5 - randomNum : randomNum;

      for (let j = 0; j < numberOfCards; j++) {
        tempHand.push(this.deck[counter]);
        counter++;
      }
      currentPlayer.addToHand(tempHand);
    }

    while (counter < this.deck.length) {
      this.kitty.push(this.deck[counter]);
      counter++;
    }
  }

  /** Copy cards that were dealt from the passed game instance. */
  copyCardsFromReplay(replayHand: EuchreHandResult): void {
    const players = this.gamePlayers;

    for (const player of players) {
      player.assignCards = replayHand.allPlayerCards
        .filter((p) => p.player.playerNumber === player.playerNumber)
        .map((p) => new Card(p.card.suit, p.card.value));

      if (player.availableCards.length < 5) {
        throw new Error('Invalid card count for player after copy from replay.');
      }

      if (player.availableCards.find((c) => c.value === 'P')) {
        throw new Error('Invalid card found for player after copy from replay.');
      }
    }

    this.kitty = replayHand.kitty.map((c) => new Card(c.suit, c.value));

    if (replayHand.turnedDown) {
      this.trump = new Card(replayHand.turnedDown.suit, replayHand.turnedDown.value);
    } else {
      this.trump = new Card(replayHand.trump.suit, replayHand.trump.value);
    }

    const tempTrump = this.trump;
    if (replayHand.discard && !this.turnedDown && this.dealer) {
      this.dealer.assignCards = [
        ...this.dealer.availableCards.filter((c) => !c.equal(tempTrump)),
        new Card(replayHand.discard.suit, replayHand.discard.value)
      ];

      if (this.dealer.availableCards.length < 5) {
        throw new Error('Invalid card count for dealer after copy from replay.');
      }
    }
  }

  /** Verify cards were dealt correctly. */
  verifyDealtCards(): void {
    const msg = 'Card dealt verification failed.';

    if (this.kitty.length !== 4) {
      throw new Error('');
    }
    const allCardsDealt = [this.kitty].flat();

    for (const player of this.gamePlayers) {
      const playerHand = player.availableCards;
      if (playerHand.length !== 5) throw new Error(msg + ' Invalid card count for player: ' + player.name);

      if (playerHand.find((c) => c.value === 'P'))
        throw Error(msg + ' Invalid cards found in player hand. (Value === P) Player: ' + player.name);

      allCardsDealt.push(...playerHand);
    }

    const tempSet = new Set<string>([...allCardsDealt.map((c) => `${c.value}${c.suit}`)]);

    if (tempSet.size !== 24) {
      const missingCards = allCardsDealt.filter((c) => !tempSet.has(`${c.value}${c.suit}`));
      throw Error(msg + '  Missing Cards: ' + missingCards.map((c) => `${c.value}${c.suit}`).join(','));
    }
  }

  /** */
  private getHandResult(): EuchreHandResult {
    if (!this.dealer || !this.maker) throw new Error('Dealer and maker not found for hand result.');

    const makerTricksWon = this.currentTricks.filter((t) => t.taker?.team === this.maker?.team).length;
    const renegePlayer = this.currentTricks.find((t) => t.playerRenege !== null)?.playerRenege ?? null;

    let points = 0;
    let teamWon = this.maker.team;

    if (renegePlayer && this.maker.team === renegePlayer.team) {
      points = this.loner ? 4 : 2;
      teamWon = teamWon === 1 ? 2 : 1;
    } else if (renegePlayer && this.maker.team !== renegePlayer.team) {
      points = this.loner ? 4 : 2;
    } else if (this.loner && makerTricksWon === 5) {
      points = 4;
    } else if (makerTricksWon === 5) {
      points = 2;
    } else if (makerTricksWon >= 3) {
      points = 1;
    } else {
      points = 2;
      teamWon = teamWon === 1 ? 2 : 1;
    }

    const allPlayerCards = this.gamePlayers
      .map((p) => [
        ...p.availableCards.map((c) => new EuchreCard(p, c)),
        ...p.playedCards.map((c) => new EuchreCard(p, c))
      ])
      .flat();

    const retval: EuchreHandResult = {
      tricks: [...this.currentTricks],
      points: points,
      teamWon: teamWon,
      dealer: this.dealer,
      maker: this.maker,
      roundNumber: this.currentRound,
      loner: this.loner,
      trump: this.trump ?? new Card('♠', 'P'),
      turnedDown: this.turnedDown,
      discard: this.discard,
      defenders: this.gamePlayers.filter((p) => p.team !== this.maker?.team),
      allPlayerCards: allPlayerCards,
      kitty: [...this.kitty]
    };

    this.validateHandResult(retval);

    return retval;
  }

  private validateHandResult(result: EuchreHandResult): void {
    const msg = 'Hand result validation failed.';
    const allCards = [...result.allPlayerCards.map((c) => c.card), ...result.kitty];
    const gameCards = new Set<string>();

    const player1Cards = result.allPlayerCards.filter((c) => c.player.playerNumber === 1);
    const player2Cards = result.allPlayerCards.filter((c) => c.player.playerNumber === 2);
    const player3Cards = result.allPlayerCards.filter((c) => c.player.playerNumber === 3);
    const player4Cards = result.allPlayerCards.filter((c) => c.player.playerNumber === 4);
    const playerCards = [player1Cards, player2Cards, player3Cards, player4Cards];

    for (const cards of playerCards) {
      if (cards.length !== 5) throw new Error(msg + ' Invalid player card count.');
    }

    if (allCards.length !== 24) throw new Error(msg + ' Invalid total card count.');

    for (const card of allCards) {
      if (card.value === 'P') throw new Error(msg + ' Invalid card (Pending).');

      gameCards.add(`${card.value + card.suit}`);
    }

    if (result.discard) gameCards.add(`${result.discard.value + result.discard.suit}`);

    if (gameCards.size !== 24) throw new Error(msg + ' Invalid unique total card count.');
  }

  /** Update game state if trick is finished.
   *
1` */
  updateIfTrickOver(playerRotation: EuchrePlayer[]): void {
    if (!this.currentPlayer) throw new Error('Game player not found.');
    if (!this.trump) throw new Error('Trump not found.');

    const lastTrick = this.currentTricks.at(-1);
    let playerFollowedSuit = true;

    if (!lastTrick) throw new Error('Trick not found for playthrough');
    const lastCardPlayed = lastTrick.cardsPlayed.at(-1);

    // determine if the player followed suit when possible. if not, then the hand/trick is over and the
    // other team wins the hand.
    if (lastCardPlayed) {
      playerFollowedSuit = didPlayerFollowSuit(this, lastCardPlayed.card);
    }

    if (!playerFollowedSuit || lastTrick.cardsPlayed.length === playerRotation.length) {
      const trickWinner = determineCurrentWinnerForTrick(this.trump, lastTrick);

      if (!trickWinner.card?.player) throw new Error('Trick winner not found.');

      lastTrick.taker = trickWinner.card.player;

      if (this.loner && this.playerSittingOut) {
        const playerSittingOut = this.playerSittingOut;
        lastTrick.playerSittingOut = playerSittingOut.playGameCard(playerSittingOut.availableCards[0]);
        playerSittingOut.sortCards(this.trump);
      }

      if (!playerFollowedSuit) {
        lastTrick.playerRenege = this._currentPlayer;
      } else if (this.currentTricks.length < 5) {
        this._currentPlayer = trickWinner.card?.player ?? null;
      }
    } else {
      this._currentPlayer = playerRotation[0];
    }
  }

  /**
   * Update game state if hand is over.
   */
  updateIfHandOver(): void {
    const handOver =
      (this.currentTrick && this.currentTrick.playerRenege !== null) ||
      (this.currentTricks.length === 5 && this.currentTricks.filter((t) => t.taker !== null).length === 5);

    if (handOver) {
      // if hand is over update the game results.
      this.gameResults.push(this.getHandResult());
      this.currentRound += 1;
    }
  }

  /**
   * Undo the result of the last hand and deal the same cards again as if the hand started over.
   */
  reverseLastHandPlayed(): void {
    const lastGameResult: EuchreHandResult | undefined = this.gameResults.at(-1);

    if (!lastGameResult) throw new Error('Game result not found.');
    if (!this.dealer) throw new Error('Game dealer not found.');
    if (!this.trump) throw new Error('Trump card not found.');

    const discard = this.discard;
    const allCards: EuchreCard[] = lastGameResult.allPlayerCards;
    const currentKitty = [...this.kitty];
    const dealCount = [...this.cardDealCount];
    this.gameResults = [...this.gameResults.slice(0, this.gameResults.length - 1)];

    const player1Hand = allCards.filter((c) => c.player.equal(this.player1)).map((c) => c.card);
    const player2Hand = allCards.filter((c) => c.player.equal(this.player2)).map((c) => c.card);
    const player3Hand = allCards.filter((c) => c.player.equal(this.player3)).map((c) => c.card);
    const player4Hand = allCards.filter((c) => c.player.equal(this.player4)).map((c) => c.card);

    this.resetForNewDeal();
    this.cardDealCount = dealCount;
    this.kitty = currentKitty;
    this.trump = this.kitty[0];
    this.player1.assignCards = player1Hand;
    this.player2.assignCards = player2Hand;
    this.player3.assignCards = player3Hand;
    this.player4.assignCards = player4Hand;
    this._currentPlayer = getPlayerRotation(this.gamePlayers, this.dealer)[0];
    const tempTrump = this.trump;

    if (discard && this.trump) {
      this.dealer.assignCards = [...this.dealer.availableCards.filter((c) => !c.equal(tempTrump)), discard];
    }

    this.deck = [...this.gamePlayers.map((p) => p.availableCards).flat(), ...currentKitty];
    this.currentRound = lastGameResult.roundNumber;
    for (const player of this.gamePlayers) player.sortCards(null);

    this.verifyDealtCards();
  }
}

class EuchreTrick {
  taker: EuchrePlayer | null = null;
  cardsPlayed: EuchreCard[] = [];
  playerSittingOut: EuchreCard | null = null;
  playerRenege: EuchrePlayer | null = null;
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

  equal(other: EuchreCard): boolean {
    return this.player.equal(other.player) && this.card.equal(other.card);
  }
}

export { EuchreCard, EuchreTrick, EuchreGameInstance, EuchrePlayer, Card };
