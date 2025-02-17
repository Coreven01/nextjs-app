import { createDummyCards, getPlayerRotation } from "./game";

export type Suit = "♠" | "♥" | "♦" | "♣";
export type CardValue = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A" | "?";

export const offsuitValues: Map<CardValue, number> = new Map([
    ["9", 10],
    ["10", 20],
    ["J", 30],
    ["Q", 40],
    ["K", 50],
    ["A", 60],
]);

export const trumpValues: Map<CardValue, number> = new Map([
    ["9", 110],
    ["10", 120],
    ["J", 400],
    ["Q", 130],
    ["K", 140],
    ["A", 150],
]);

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

    determineCardToPlay(flipCard: Card): BidResult {

        return { orderTrump: false, loner:false, calledSuit: "♠"};
    }
}

export interface BidResult {
    orderTrump: boolean,
    loner: boolean,
    calledSuit: Suit | undefined,
}

export class Card {
    suit: Suit;
    value: CardValue;
    index: number = 0;

    constructor(suit: Suit, value: CardValue) {
        this.suit = suit;
        this.value = value;
    }

    get color(): "R" | "B" {
        return this.suit === "♠" || this.suit === "♣" ? "B" : "R";
    }

    get dealId(): string {
        return `deal-${this.index}`;
    }
}

export class PlayerHand {

}

export type EuchreSettings = {
    shouldAnimate:boolean,
}

export class EuchreGameInstance {

    player1: EuchrePlayer;
    player2: EuchrePlayer;
    player3: EuchrePlayer;
    player4: EuchrePlayer;

    deck: Card[] = [];
    kitty: Card[] = [];
    dealer: EuchrePlayer | undefined;
    currentTricks: EuchreTrick[] = [];
    gameTricks: EuchreTrick[][] = [];
    currentPlayer: EuchrePlayer | undefined;
    maker: EuchrePlayer | undefined;
    loner: boolean = false;
    trump: Card | undefined;
    bidNumber: 1 | 2 = 1
    discard: Card | undefined;
    cardDealCount: number[] = [];

    constructor(player1: EuchrePlayer, player2: EuchrePlayer, player3: EuchrePlayer, player4: EuchrePlayer) {
        this.player1 = player1;
        this.player2 = player2;
        this.player3 = player3;
        this.player4 = player4;
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
        this.currentTricks = [];
        this.currentPlayer = undefined;
        this.maker = undefined;
        this.loner = false;
        this.trump = undefined;
        this.bidNumber = 1;
        this.discard = undefined;
        this.cardDealCount = [];
    }

    shallowCopy() {
        const game = new EuchreGameInstance(this.player1, this.player2, this.player3, this.player4)
        game.deck = this.deck;
        game.kitty = this.kitty;
        game.dealer = this.dealer;
        game.currentTricks = this.currentTricks;
        game.currentPlayer = this.currentPlayer;
        game.loner = this.loner;
        game.trump = this.trump;
        game.bidNumber = this.bidNumber;
        game.discard = this.discard;
        game.maker = this.maker;
        game.cardDealCount = this.cardDealCount;

        return game;
    }

    dealCards() {
        const currentGame: EuchreGameInstance = this;
        const players: EuchrePlayer[] = getPlayerRotation(currentGame);

        const randomNum = Math.floor((Math.random() * 3)) + 1;
        let counter = 0;
        currentGame.cardDealCount = [randomNum, 5 - randomNum];

        for (let i = 0; i < 8; i++) {
            let numberOfCards = 0;
            const currentPlayer = players[i % 4];
            const firstRound = i < 4;

            if (firstRound)
                numberOfCards = i % 2 ? randomNum : 5 - randomNum;
            else
                numberOfCards = i % 2 ? 5 - randomNum : randomNum;

            for (let j = 0; j < numberOfCards; j++) {
                currentPlayer.hand.push(currentGame.deck[counter] ?? new Card("♠", "?"));
                counter++;
            }
        }

        while (counter < currentGame.deck.length) {
            currentGame.kitty.push(currentGame.deck[counter] ?? new Card("♠", "?"));
            counter++;
        }
    }
}

export class EuchreTrick {
    playerWon: EuchrePlayer | undefined;
    cardsPlayed: EuchreCard[] = [];
}

export class EuchreCard {
    player: EuchrePlayer;
    card: Card;

    constructor(player: EuchrePlayer, card: Card) {
        this.player = player;
        this.card = card;
    }
}