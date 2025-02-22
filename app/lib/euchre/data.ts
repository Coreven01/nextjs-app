import { createDummyCards, getPlayerRotation } from "./game";
import { determineBidLogic, determineCardToPlayLogic } from "./game-logic";

export type Suit = "♠" | "♥" | "♦" | "♣";
export type CardValue = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A" | "?";

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

    /** Routine to determine if the computer should indicate if the flipped card should be picked up, or should name suit. */ 
    determineBid(game: EuchreGameInstance, flipCard: Card, canNameSuit: boolean): BidResult {

        const result = determineBidLogic(game, flipCard, canNameSuit);
        return result;
    }

    determineCardToPlay(game: EuchreGameInstance): Card {

        return determineCardToPlayLogic(game);
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
    currentTrick: EuchreTrick = new EuchreTrick();
    handTricks: EuchreTrick[] = [];
    gameTricks: EuchreTrick[] = [];
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

    get gamePlayers(): EuchrePlayer[] {
        return [this.player1, this.player2, this.player3, this.player4];
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
        this.currentTrick = new EuchreTrick();
        this.currentPlayer = undefined;
        this.maker = undefined;
        this.loner = false;
        this.trump = undefined;
        this.bidNumber = 1;
        this.discard = undefined;
        this.cardDealCount = [];

        const players = [this.player1, this.player2, this.player3, this.player4];

        for (const player of players) {
            player.hand = [];
            player.playedCards = [];
            player.placeholder = createDummyCards(5);
        }
    }

    shallowCopy() {
        const game = new EuchreGameInstance(this.player1, this.player2, this.player3, this.player4)
        game.deck = this.deck;
        game.kitty = this.kitty;
        game.dealer = this.dealer;
        game.currentTrick = this.currentTrick;
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

        if (!currentGame.dealer)
            throw Error("Unable to deal cards. Dealer not found.");

        const players: EuchrePlayer[] = getPlayerRotation(currentGame.gamePlayers, currentGame.dealer);

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

    verifyDealtCards() {

        const allCardsDealt = [this.player1.hand, this.player2.hand, this.player3.hand, this.player4.hand, this.kitty].flat();

        if (allCardsDealt.length != 24)
            throw Error ("Verify failed. Invalid card count");

        const tempSet = new Set<string>([ ...allCardsDealt.map(c => `${c.value}${c.suit}`)]);

        if (tempSet.size != 24)
            throw Error ("Verify failed. Invalid card count");
    }
}

export class EuchreTrick {
    playerWon: EuchrePlayer | undefined;
    cardsPlayed: EuchreCard[] = [];
    round: number = 0
}

export class EuchreCard {
    player: EuchrePlayer;
    card: Card;

    constructor(player: EuchrePlayer, card: Card) {
        this.player = player;
        this.card = card;
    }
}