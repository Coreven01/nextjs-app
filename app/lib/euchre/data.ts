import { createDummyCards, getCardColorFromSuit, getPlayerRotation } from "./game";
import { determineBidLogic, determineDiscard } from "./game-bid-logic";
import { determineCardToPlayLogic } from "./game-play-logic";

export type Suit = "♠" | "♥" | "♦" | "♣";
export type CardValue = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A" | "?";
export type CardColor = "R" | "B";
export class EuchrePlayer {
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

    playerBidId(round: number): string {
        return `player-${this.playerNumber}-bid-${round}`;
    }

    /** Routine to determine if the computer should indicate if the flipped card should be picked up, or should name suit. */
    determineBid(game: EuchreGameInstance, flipCard: Card, canNameSuit: boolean): BidResult {

        const result = determineBidLogic(game, flipCard, canNameSuit);
        return result;
    }

    determineCardToPlay(game: EuchreGameInstance): Card {

        return determineCardToPlayLogic(game);
    }

    discard(game: EuchreGameInstance) {
        const cardToDiscard = determineDiscard(game, this);

        if (this.hand.find(c => c === cardToDiscard) && game.trump) {
            this.hand = [...this.hand, game.trump].filter(c => c !== cardToDiscard);
        }
    }
}

export interface BidResult {
    orderTrump: boolean,
    loner: boolean,
    calledSuit: Suit | null,
}

export class Card {
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

    get dealId(): string {
        return `deal-${this.index}`;
    }
}

export class PlayerHand {

}

export const initialGameSettings: EuchreSettings = {
    shouldAnimate: true
}

export type EuchreSettings = {
    shouldAnimate: boolean,
}

export class EuchreGameInstance {

    player1: EuchrePlayer;
    player2: EuchrePlayer;
    player3: EuchrePlayer;
    player4: EuchrePlayer;

    deck: Card[] = [];
    kitty: Card[] = [];
    dealer: EuchrePlayer | undefined;
    currentRoundTricks: EuchreTrick[] = [];
    gameTricks: EuchreTrick[] = [];
    currentPlayer: EuchrePlayer | undefined;
    maker: EuchrePlayer | undefined;
    loner: boolean = false;
    trump: Card | undefined;
    cardDealCount: number[] = [];

    constructor(player1: EuchrePlayer, player2: EuchrePlayer, player3: EuchrePlayer, player4: EuchrePlayer) {
        this.player1 = player1;
        this.player2 = player2;
        this.player3 = player3;
        this.player4 = player4;
    }

    get gamePlayers(): EuchrePlayer[] {
        return [this.player1, this.player2, this.player3, this.player4];
    }

    get playerSittingOut(): EuchrePlayer | undefined {
        if (this.maker && this.loner)
            return this.gamePlayers.find(p => p.team === this.maker?.team && p.playerNumber !== this.maker.playerNumber);

        return undefined;
    }

    get currentTrick() {
        return this.currentRoundTricks.at(-1);
    }

    resetForNewGame() {
        this.gameTricks = [];
        this.dealer = undefined;
        this.deck = createDummyCards(24);
        this.resetForNewDeal();
    }

    resetForNewDeal() {
        this.kitty = [];
        this.deck = createDummyCards(24);
        this.currentPlayer = undefined;
        this.maker = undefined;
        this.loner = false;
        this.trump = undefined;
        this.cardDealCount = [];
        this.currentRoundTricks = [];

        const players = [this.player1, this.player2, this.player3, this.player4];

        for (const player of players) {
            player.hand = [];
            player.playedCards = [];
            player.placeholder = createDummyCards(5);
        }
    }

    shallowCopy(): EuchreGameInstance {
        const game = new EuchreGameInstance(this.player1, this.player2, this.player3, this.player4)
        game.deck = this.deck;
        game.kitty = this.kitty;
        game.dealer = this.dealer;
        game.currentPlayer = this.currentPlayer;
        game.loner = this.loner;
        game.trump = this.trump;
        game.maker = this.maker;
        game.cardDealCount = this.cardDealCount;
        game.currentRoundTricks = this.currentRoundTricks;
        game.gameTricks = this.gameTricks;

        return game;
    }

    dealCards() {

        if (!this.dealer)
            throw Error("Unable to deal cards. Dealer not found.");

        const players: EuchrePlayer[] = getPlayerRotation(this.gamePlayers, this.dealer);

        const randomNum = Math.floor((Math.random() * 3)) + 1;
        let counter = 0;
        this.cardDealCount = [randomNum, 5 - randomNum];

        for (let i = 0; i < 8; i++) {
            let numberOfCards = 0;
            const currentPlayer = players[i % 4];
            const firstRound = i < 4;

            if (firstRound)
                numberOfCards = i % 2 ? randomNum : 5 - randomNum;
            else
                numberOfCards = i % 2 ? 5 - randomNum : randomNum;

            for (let j = 0; j < numberOfCards; j++) {
                currentPlayer.hand.push(this.deck[counter] ?? new Card("♠", "?"));
                counter++;
            }
        }

        while (counter < this.deck.length) {
            this.kitty.push(this.deck[counter] ?? new Card("♠", "?"));
            counter++;
        }
    }

    verifyDealtCards() {

        const allCardsDealt = [this.player1.hand, this.player2.hand, this.player3.hand, this.player4.hand, this.kitty].flat();

        if (allCardsDealt.length != 24)
            throw Error("Verify failed. Invalid card count");

        const tempSet = new Set<string>([...allCardsDealt.map(c => `${c.value}${c.suit}`)]);

        if (tempSet.size != 24)
            throw Error("Verify failed. Invalid card count");
    }
}

export class EuchreTrick {
    playerWon: EuchrePlayer | undefined = undefined;
    cardsPlayed: EuchreCard[] = [];
    round: number = 0

    constructor(round: number){
        this.round = round;
    }
}

export class EuchreCard {
    player: EuchrePlayer;
    card: Card;

    constructor(player: EuchrePlayer, card: Card) {
        this.player = player;
        this.card = card;
    }
}