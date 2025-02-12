
export const spade: string = "♠";
export const heart: string = "♥";
export const diamond: string = "♦";
export const club: string = "♣";

export type Suit = {
    suit: "♠" | "♥" | "♦" | "♣",
    color: "R" | "B"
}

export type CardValue = {
    value: "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A" | "?",
}

export const offsuitValues: Map<CardValue, number> = new Map([
    [{ value: "9" }, 10],
    [{ value: "10" }, 20],
    [{ value: "J" }, 30],
    [{ value: "Q" }, 40],
    [{ value: "K" }, 50],
    [{ value: "A" }, 60],
]);

export const trumpValues: Map<CardValue, number> = new Map([
    [{ value: "9" }, 110],
    [{ value: "10" }, 120],
    [{ value: "J" }, 400],
    [{ value: "Q" }, 130],
    [{ value: "K" }, 140],
    [{ value: "A" }, 150],
]);

export class EuchrePlayer {
    name: string;
    hand: Card[];
    playedCards: Card[] = [];
    playerNumber: 1 | 2 | 3 | 4;
    team: 1 | 2 = 1;
    human: boolean = false;

    constructor(name: string, hand: Card[], playerNumber: 1 | 2 | 3 | 4) {
        this.name = name;
        this.hand = hand;
        this.playerNumber = playerNumber;
    }
}

export class Card {
    suit: Suit;
    value: CardValue;
    index: number = 0;

    constructor(suit: Suit, value: CardValue) {
        this.suit = suit;
        this.value = value;
    }
}

export class PlayerHand {

}

export type EuchreSettings = {

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
    loner: boolean = false;
    trump: Suit | undefined;
    bidNumber: 1 | 2 = 1
    orderedCard: Card | undefined;
    discard: Card | undefined;

    constructor(player1: EuchrePlayer, player2: EuchrePlayer, player3: EuchrePlayer, player4: EuchrePlayer) {
        this.player1 = player1;
        this.player2 = player2;
        this.player3 = player3;
        this.player4 = player4;
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
        game.orderedCard = this.orderedCard;
        game.discard = this.discard;

        return game;
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