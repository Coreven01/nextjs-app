import { Card, CardValue, EuchreCard, EuchreGameInstance, EuchrePlayer, EuchreTrick, offsuitValues, Suit, trumpValues } from "./data";


export function createEuchreGame(): EuchreGameInstance {
    const player1 = new EuchrePlayer("Nolan", [], 1);
    const player2 = new EuchrePlayer("Jerry", [], 2);
    const player3 = new EuchrePlayer("George", [], 3);
    const player4 = new EuchrePlayer("Elaine", [], 4);

    player3.team = 2;
    player4.team = 2;

    const newGame = new EuchreGameInstance(player1, player2, player3, player4);
    newGame.dealer = player1;
    newGame.deck = createShuffledDeck(3);

    const players = [player1, player2, player3, player4];
    const randomNum = Math.floor((Math.random() * 3)) + 1;

    for (let i = 0; i < 8; i++) {
        let numberOfCards = 0;
        const currentPlayer = players[(i + 1) % 4];
        const round2 = i > 3;

        if (i % 2)
            if (round2) {
                numberOfCards = randomNum;
            } else {
                numberOfCards = 5 - randomNum;
            }
        else
            if (round2) {
                numberOfCards = 5 - randomNum;
            } else {
                numberOfCards = randomNum;
            }

        for (let j = 0; j < numberOfCards; j++) {
            currentPlayer.hand.push(newGame.deck.pop() ?? new Card({ suit: "♠", color: "B" }, { value: "?" }));
        }
    }

    while (newGame.deck.length) {
        newGame.kitty.push(newGame.deck.pop() ?? new Card({ suit: "♠", color: "B" }, { value: "?" }));
    }

    newGame.dealer = player1;
    newGame.currentTricks.push(new EuchreTrick());

    return newGame;
}

export function createShuffledDeck(shuffleCount: number) {
    if (shuffleCount < 1)
        shuffleCount = 1;

    let newDeck = createEuchreDeck();

    for (let i = 0; i < shuffleCount; i++)
        newDeck = shuffleDeck(newDeck);

    return newDeck;
}

export function createEuchreDeck(): Card[] {

    const availableCards: CardValue[] = [{ value: "9" }, { value: "10" }, { value: "J" }, { value: "Q" }, { value: "K" }, { value: "A" },]
    const deck: Card[] = [];
    const suits: Suit[] = [{ suit: "♠", color: "B" }, { suit: "♥", color: "R" }, { suit: "♦", color: "R" }, { suit: "♣", color: "B" }];

    for (let card = 0; card < availableCards.length; card++) {
        for (let suit = 0; suit < suits.length; suit++) {
            deck.push(new Card(suits[suit], availableCards[card]))
        }
    }

    return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
    const deckSize = deck.length;
    const newDeck: Card[] = [];
    const randomNumbers: number[] = [];
    const validIndexes = createRange(0, deckSize - 1);
    let counter = 0;

    while (randomNumbers.length < deckSize) {
        let randomNum = Math.floor((Math.random() * (deckSize - 1)));
        if (!randomNumbers.includes(randomNum))
            randomNumbers.push(randomNum);

        if (randomNumbers.length > deckSize - 5) {
            const remainingIndexes = validIndexes.filter(val => !randomNumbers.includes(val));

            if (remainingIndexes.length === 1)
                randomNumbers.push(remainingIndexes[0]);
            else {
                randomNum = Math.floor(Math.random() * (remainingIndexes.length - 1));
                randomNumbers.push(remainingIndexes[randomNum]);
            }
        }
        counter++;

        if (counter > 100)
            throw Error("wrong random number list");
    }

    counter = 0;
    for (let num = 0; num < deckSize; num++) {
        const card = deck[randomNumbers[num]];
        card.index = num;
        newDeck.push(deck[randomNumbers[num]]);

        counter++;

        if (counter > 100)
            throw Error("Counter while shuffling exceeded");
    }

    if (newDeck.length < deckSize)
        throw Error("Logic error: wrong deck size");

    return newDeck;
}

function createRange(start: number, end: number) {
    const result = [];

    for (let i = start; i <= end; i++) {
        result.push(i);
    }

    return result;
}

export function isGameWon() {

}

export function playGameCard(playerNumber: number, cardIndex: number, game: EuchreGameInstance): EuchreGameInstance {

    let player: EuchrePlayer | undefined;
    const newGame = game.shallowCopy();

    switch (playerNumber) {
        case 1: player = newGame.player1; break;
        case 2: player = newGame.player2; break;
        case 3: player = newGame.player3; break;
        case 4: player = newGame.player4; break;
    }

    if (!player)
        return newGame;

    const cardPlayed = player.hand[cardIndex];
    const trick = newGame.currentTricks.pop();

    if (!trick)
        throw Error("No tricks in the game");

    const card = new EuchreCard(player, cardPlayed);
    trick.cardsPlayed.push(card);
    trick.playerWon = determineTrickWon(newGame.trump, trick);
    newGame.currentTricks.push(trick);
    
    return newGame;
}

function determineTrickWon(trump: Suit | undefined, trick: EuchreTrick): EuchrePlayer | undefined {

    if (trick.cardsPlayed.length < 4 || !trump)
        return undefined;

    let winningCard: EuchreCard | undefined;
    let cardValue: number = 0;

    for (let i = 0; i < 4; i++) {
        const card = trick.cardsPlayed[i];
        const temp = getCardValue(card, trump);
        if (temp > cardValue)
            winningCard = card;
    }

    return winningCard?.player;
}

function getCardValue(card: EuchreCard, trump: Suit): number {

    let retval = 0;

    if (card.card.suit.suit === trump.suit) {
        retval = trumpValues.get(card.card.value) ?? 0;
    } else if (card.card.value.value === "J" && card.card.suit.color === trump.color) {
        retval = (offsuitValues.get(card.card.value) ?? 0) + 200;
    } else {
        retval = (offsuitValues.get(card.card.value) ?? 0);
    }

    return retval;
}
export function getPlayerAndCard(playerInfo: string): { number: number, index: number } {

    if (!playerInfo)
        return { number: 0, index: -1 };

    const retval = { number: parseInt(playerInfo.charAt(5)), index: parseInt(playerInfo.charAt(6)) };
    return retval;
}

export function determineCardToPlay() {

}