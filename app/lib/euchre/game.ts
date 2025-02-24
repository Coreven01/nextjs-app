import { offsuitValues, trumpValues } from "./card-data";
import { LEFT_BOWER_VALUE, TIMEOUT_MODIFIER } from "./constants";
import { Card, CardValue, EuchreCard, EuchreGameInstance, EuchrePlayer, EuchreTrick, Suit } from "./data";
import { CardTransformation } from "./useMoveCard";

interface InitDealResult {
    transformations: CardTransformation[][],
    newDealer: EuchrePlayer,
}

export function createEuchreGame(): EuchreGameInstance {
    const player1 = new EuchrePlayer("Nolan", [], 1);
    const player2 = new EuchrePlayer("Jerry", [], 2);
    const player3 = new EuchrePlayer("George", [], 3);
    const player4 = new EuchrePlayer("Elaine", [], 4);

    player1.human = false;
    player3.team = 2;
    player4.team = 2;

    let newGame = new EuchreGameInstance(player1, player2, player3, player4);
    newGame.deck = createDummyCards(24);
    newGame.dealer = player1;

    return newGame;
}

/** Get the rotation of players relative to the given player. */
export function getPlayerRotation(players: EuchrePlayer[], relativePlayer: EuchrePlayer, playerSittingOut: EuchrePlayer | undefined = undefined): EuchrePlayer[] {

    const playerCount = players.length;
    const playerRotation = [1, 3, 2, 4];
    const returnRotation: EuchrePlayer[] = [];
    const indexOffset = (playerRotation.indexOf(relativePlayer.playerNumber) + 1) % playerCount;

    for (let i = 0; i < playerCount; i++) {
        const playerNumber = playerRotation[(i + indexOffset) % playerCount];

        if (playerSittingOut?.playerNumber === playerNumber)
            continue;

        const player = players.filter(p => p.playerNumber === playerNumber);
        if (player?.length)
            returnRotation.push(player[0]);
    }

    return returnRotation;
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

    const availableCards: CardValue[] = ["9", "10", "J", "Q", "K", "A"];
    const deck: Card[] = [];
    const suits: Suit[] = ["♠", "♥", "♦", "♣"];

    for (let card = 0; card < availableCards.length; card++) {
        for (let suit = 0; suit < suits.length; suit++) {
            deck.push(new Card(suits[suit], availableCards[card]))
        }
    }

    return deck;
}

export function createDummyCards(deckSize: number) {
    const retval: Card[] = [];
    for (let i = 0; i < deckSize; i++)
        retval.push(new Card("♠", "2"));

    return retval;
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

            if (remainingIndexes.length === 2) {
                const lastTwoIndexes = [randomNum % 2, (randomNum + 1) % 2];
                randomNumbers.push(remainingIndexes[lastTwoIndexes[0]]);
                randomNumbers.push(remainingIndexes[lastTwoIndexes[1]]);
            }
            else {
                randomNum = Math.floor(Math.random() * (remainingIndexes.length - 1));
                randomNumbers.push(remainingIndexes[randomNum]);
            }
        }
        counter++;

        if (counter > 100)
            throw Error("Error shuffling deck. Random number count exceeded.");
    }

    for (let num = 0; num < deckSize; num++) {
        const card = deck[randomNumbers[num]];
        card.index = num;
        newDeck.push(deck[randomNumbers[num]]);
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

export function playGameCard(player: EuchrePlayer, card: Card, game: EuchreGameInstance): EuchreGameInstance {

    const newGame = game.shallowCopy();

    if (!game.currentTrick)
        throw Error();

    const euchreCard = new EuchreCard(player, card);
    player.hand = player.hand.filter(c => c !== card);
    player.playedCards.push(card);

    game.currentTrick.cardsPlayed.push(euchreCard);

    return newGame;
}


export function getPlayerAndCard(playerInfo: string): { playerNumber: number, index: number } {

    if (!playerInfo)
        return { playerNumber: 0, index: -1 };

    const retval = { playerNumber: parseInt(playerInfo.charAt(5)), index: parseInt(playerInfo.charAt(6)) };
    return retval;
}

/** Deal cards to players until first Jack is dealt. The player that is dealt the Jack will be the initial dealer for the game.
 * Animates using a transform to show a card being dealt to the user, if enabled by the settings.
*/
export function dealCardsForNewDealer(game: EuchreGameInstance): InitDealResult {

    if (!game)
        throw Error("Game not found.");

    if (!game?.dealer)
        throw Error("Game dealer not found for initial dealer.");

    let counter = 0;
    const gameDeck = game.deck;
    const rotation = getPlayerRotation(game.gamePlayers, game.dealer);
    const orgDealerNumber = game.dealer.playerNumber;
    const transformations: CardTransformation[][] = [];
    const retval: InitDealResult = { newDealer: game.dealer, transformations: transformations };

    // Deal until the first jack is dealt
    for (const card of gameDeck) {

        const player = rotation[counter % 4];
        const sourceId = card.dealId;
        const destinationId = player.innerPlayerBaseId;
        const cardToMoveTransformation: CardTransformation[] = [{
            sourceId: sourceId,
            destinationId: destinationId,
            sourcePlayerNumber: orgDealerNumber,
            destinationPlayerNumber: player.playerNumber,
            location: "inner",
            options: {
                msDelay: 500 * TIMEOUT_MODIFIER,
                displayCardValue: true,
                card: card,
                cardOffsetHorizontal: 0,
                cardOffsetVertical: 0,
            }
        }];

        retval.transformations.push(cardToMoveTransformation);

        // exit loop once a Jack is dealt.
        if (card.value === "J") {
            retval.newDealer = rotation[(counter % 4)];
            break;
        }
        counter++;
    }

    return retval;
}

export function determineCurrentWinnerForTrick(trump: Card, trick: EuchreTrick): EuchrePlayer | undefined {

    let winningCard: EuchreCard | undefined;
    let cardValue: number = 0;

    for (let i = 0; i < trick.cardsPlayed.length; i++) {
        const card = trick.cardsPlayed[i];
        const temp = getCardValue(card.card, trump);
        if (temp > cardValue)
            winningCard = card;
    }

    return winningCard?.player;

    return undefined;
}

export function getCardValue(card: Card, trump: Card): number {
    return getCardValueBySuit(card, trump.suit, trump.color);
}

export function getCardValueBySuit(card: Card, trumpSuit: Suit, trumpColor: "R" | "B") {

    let retval = 0;

    if (card.suit === trumpSuit) {
        retval = trumpValues.get(card.value) ?? 0;
    } else if (card.value === "J" && card.color === trumpColor) {
        retval = LEFT_BOWER_VALUE;
    } else {
        retval = (offsuitValues.get(card.value) ?? 0);
    }

    return retval;
}

export function getSuitCount(cards: Card[], trumpCard: Card) {
    const retval: (Suit | number)[][] = [];

    cards.map(c => {
        const isLeftBower = cardIsLeftBower(c, trumpCard);
        const value = retval.find(val => val[0] === (isLeftBower ? trumpCard.suit : c.suit));

        if (value)
            value[1] = value[1] as number + 1;
        else
            retval.push([c.suit, 1]);
    });

    return retval;
}

export function cardIsLeftBower(card: Card, trumpCard: Card) {
    return card.color === trumpCard.color && card.value === "J" && card.suit !== trumpCard.suit;
}