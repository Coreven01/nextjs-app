import { CardTransformation } from '@/app/hooks/euchre/useMoveCard';
import { TIMEOUT_MODIFIER } from './constants';
import {
  BidResult,
  Card,
  EuchreGameInstance,
  EuchrePlayer,
  EuchreSettings,
  EuchreTrick
} from './data';
import { createEuchreGame, createShuffledDeck, getPlayerRotation } from './game';
import { logDebugEvent } from './util';
import { EuchreGameFlow, GameFlowState } from '@/app/hooks/euchre/gameFlowReducer';

interface InitDealResult {
  transformations: CardTransformation[][];
  newDealer: EuchrePlayer;
}

interface ShuffleResult {
  transformations: CardTransformation[][];
  game: EuchreGameInstance;
}

export const getGameStateForInitialDeal = (
  gameState: GameFlowState,
  settings: EuchreSettings,
  game: EuchreGameInstance
) => {
  const newGameFlow: GameFlowState = {
    ...gameState,
    hasGameStarted: true,
    shouldShowDeckImages: settings.shouldAnimate ? [{ player: game.player1, value: true }] : [],
    shouldShowHandImages: !settings.shouldAnimate
      ? game.gamePlayers.map((p) => {
          return { player: p, value: true };
        })
      : [],
    shouldShowHandValues: [],
    hasFirstBiddingPassed: false,
    hasSecondBiddingPassed: false,
    gameFlow: EuchreGameFlow.INIT_DEAL
  };

  return newGameFlow;
};

/** Initialize the game with shuffled deck and set player 1 for deal. */
export const initDeckForInitialDeal = (cancel: boolean): EuchreGameInstance => {
  logDebugEvent('Init deck for init deal');

  const gameInstance = createEuchreGame();

  if (cancel) return gameInstance;

  gameInstance.dealer = gameInstance.player1;
  gameInstance.currentPlayer = gameInstance.player1;
  gameInstance.deck = createShuffledDeck(5);

  return gameInstance;
};

/**
 * Deal cards to determine who the initial dealer is for a new game.
 * First Jack dealt will be the dealer of the game.
 */
export const dealCardsForDealer = (
  gameInstance: EuchreGameInstance,
  gameState: GameFlowState,
  gameSettings: EuchreSettings
): InitDealResult | null => {
  if (!gameState.hasGameStarted) return null;

  const newGame = gameInstance?.shallowCopy();

  if (!newGame?.deck) throw Error('Game deck not found.');

  // deal the cards until first Jack is dealt.
  const newDealerResult = dealCardsForNewDealer(newGame, gameSettings);
  return newDealerResult;
};

/** Deal cards to players until first Jack is dealt. The player that is dealt the Jack will be the initial dealer for the game.
 * Animates using a transform to show a card being dealt to the user, if enabled by the settings.
 */
function dealCardsForNewDealer(
  game: EuchreGameInstance,
  gameSetting: EuchreSettings
): InitDealResult {
  if (!game) throw Error('Game not found.');

  if (!game?.dealer) throw Error('Game dealer not found for initial dealer.');

  let counter = 0;
  const gameDeck = game.deck;
  const rotation = getPlayerRotation(game.gamePlayers, game.dealer);
  const orgDealerNumber = game.dealer.playerNumber;
  const transformations: CardTransformation[][] = [];
  const retval: InitDealResult = {
    newDealer: game.dealer,
    transformations: transformations
  };

  // Deal until the first jack is dealt
  for (const card of gameDeck) {
    // only create transformation if it's enabled by the settings.
    if (gameSetting.shouldAnimate) {
      const player = rotation[counter % 4];
      const sourceId = card.generateElementId();
      const destinationId = player.innerPlayerBaseId;
      const cardToMoveTransformation: CardTransformation[] = [
        {
          sourceId: sourceId,
          destinationId: destinationId,
          sourcePlayerNumber: orgDealerNumber,
          destinationPlayerNumber: player.playerNumber,
          location: 'inner',
          options: {
            msDelay: 500 * TIMEOUT_MODIFIER,
            displayCardValue: true,
            card: card,
            cardOffsetHorizontal: 0,
            cardOffsetVertical: 0
          }
        }
      ];

      retval.transformations.push(cardToMoveTransformation);
    }

    // exit loop once a jack is dealt.
    if (card.value === 'J') {
      retval.newDealer = rotation[counter % 4];
      break;
    }

    counter++;
  }

  return retval;
}

/** Shuffle and deal cards for regular game play. Starts the bidding process to determine if the dealer should pick up the flipped card
 * or if a player will name suit. */
export const shuffleAndDealHand = (
  gameInstance: EuchreGameInstance,
  gameSettings: EuchreSettings,
  cancel: boolean
): ShuffleResult => {
  const newGame = gameInstance.shallowCopy();
  newGame.resetForNewDeal();

  const retval: ShuffleResult = { transformations: [], game: newGame };

  if (cancel) return retval;

  if (!newGame.dealer) throw Error('Dealer not found.');

  const rotation = getPlayerRotation(newGame.gamePlayers, newGame.dealer);
  newGame.deck = createShuffledDeck(5);
  newGame.dealCards();
  newGame.verifyDealtCards();
  newGame.currentPlayer = rotation[0];
  newGame.trump = newGame.kitty[0];
  retval.transformations.push(getTransformationsForDealCardsForHand(newGame, gameSettings));

  return retval;
};

const getTransformationsForDealCardsForHand = (
  game: EuchreGameInstance,
  gameSettings: EuchreSettings
): CardTransformation[] => {
  if (!game) throw Error('Game not found.');

  if (!game?.dealer) throw Error('Game dealer not found for card animation.');

  const rotation = getPlayerRotation(game.gamePlayers, game.dealer);
  const transformations: CardTransformation[] = [];

  if (!gameSettings.shouldAnimate) return transformations;

  const trumpCard = game.kitty[0];
  const dealerNumber = game.dealer.playerNumber;

  //#region Animation deal cards to users.
  for (let i = 0; i < 8; i++) {
    const player = rotation[i % 4];
    const playerNumber = player.playerNumber;
    const destinationId = player.innerPlayerBaseId;
    const firstRound = i < 4;

    let cardCount: number = 0;
    cardCount = firstRound ? game.cardDealCount[i % 2] : game.cardDealCount[(i + 1) % 2];

    for (let cardIndex = 0; cardIndex < cardCount; cardIndex++) {
      const card = player.hand[firstRound ? cardIndex : 5 - cardCount + cardIndex];
      const cardSrcId = card.generateElementId();

      transformations.push({
        sourceId: cardSrcId,
        destinationId: destinationId,
        sourcePlayerNumber: dealerNumber,
        destinationPlayerNumber: playerNumber,
        location: 'inner',
        options: {
          msDelay: 75 * TIMEOUT_MODIFIER,
          displayCardValue: false,
          card: card,
          cardOffsetHorizontal: 0,
          cardOffsetVertical: 0
        }
      });
    }
  }

  transformations.push({
    sourceId: trumpCard.generateElementId(),
    destinationId: 'game-center',
    sourcePlayerNumber: dealerNumber,
    destinationPlayerNumber: 0,
    location: 'outer',
    options: {
      card: trumpCard,
      displayCardValue: false,
      msDelay: 75 * TIMEOUT_MODIFIER,
      cardOffsetVertical: 0,
      cardOffsetHorizontal: 0
    }
  });

  return transformations;
};

export const orderTrump = (
  gameInstance: EuchreGameInstance | undefined,
  result: BidResult
): EuchreGameInstance => {
  const newGame = gameInstance?.shallowCopy();

  if (!newGame) throw Error('Game not found - Order Trump.');

  if (!newGame.dealer) throw Error('Dealer not found - Order Trump.');

  if (!newGame.currentPlayer) throw Error('Current player not found - Order Trump.');

  newGame.maker = newGame.currentPlayer;
  newGame.loner = result.loner;
  const rotation = getPlayerRotation(newGame.gamePlayers, newGame.dealer, newGame.playerSittingOut);

  let round = 1;

  if (newGame.gameTricks.length > 0) round = newGame.gameTricks.at(-1)?.roundNumber ?? 1;

  const newTrick = new EuchreTrick(round);
  newGame.currentRoundTricks.push(newTrick);
  newGame.currentPlayer = rotation[0];

  if (result.calledSuit) newGame.trump = new Card(result.calledSuit, '2');

  return newGame;
};
