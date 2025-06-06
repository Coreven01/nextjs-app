import { v4 as uuidv4 } from 'uuid';
import { EuchreGameFlowState, EuchreGameFlow } from '../../state/reducers/gameFlowReducer';
import { TableLocation, GameDifficulty } from '../../definitions/definitions';
import { EuchrePlayer, EuchreGameInstance, EuchreSettings } from '../../definitions/game-state-definitions';
import { InitDealResult, ShuffleResult } from '../../definitions/logic-definitions';
import { createPlaceholderCards, createShuffledDeck, getSuitCount, indexCards } from './cardDataUtil';
import { createTrick, resetForNewDeal, dealCards } from './gameDataUtil';
import { getPlayerRotation } from './playerDataUtil';
import { copyCardsFromReplay, verifyDealtCards } from './gameDebugUtil';

const createPlayer = (
  name: string,
  team: 1 | 2,
  playerNumber: 1 | 2 | 3 | 4,
  location: TableLocation
): EuchrePlayer => {
  return {
    name: name,
    team: team,
    playerNumber: playerNumber,
    hand: [],
    playedCards: [],
    human: false,
    location: location
  };
};

const createBaseGame = (
  player1: EuchrePlayer,
  player2: EuchrePlayer,
  player3: EuchrePlayer,
  player4: EuchrePlayer
): EuchreGameInstance => {
  return {
    gameId: uuidv4(),
    handId: '',
    player1: player1,
    player2: player2,
    player3: player3,
    player4: player4,
    deck: [],
    kitty: [],
    dealer: player1,
    maker: null,
    loner: false,
    trump: { suit: '♠', value: 'P', index: 0 },
    discard: null,
    turnedDown: null,
    cardDealCount: [],
    handResults: [],
    gamePlayers: [player1, player2, player3, player4],
    dealPassedCount: 0,
    originalDealDeck: [],

    currentRound: 1,
    currentTrick: createTrick(1),
    currentTricks: [],
    currentPlayer: player1
  };
};

/** Create default euchre game with default players and dummy cards.
 *
 */
const createDefaultEuchreGame = () => {
  const player1: EuchrePlayer = createPlayer('Player 1', 1, 1, 'bottom');
  const player2: EuchrePlayer = createPlayer('Player 2', 1, 2, 'top');
  const player3: EuchrePlayer = createPlayer('Player 3', 2, 3, 'left');
  const player4: EuchrePlayer = createPlayer('Player 4', 2, 4, 'right');

  const newGame: EuchreGameInstance = createBaseGame(player1, player2, player3, player4);

  return newGame;
};

/** Create a game ready for initial deal. */
const createEuchreGame = (gameSettings: EuchreSettings): EuchreGameInstance => {
  const player1: EuchrePlayer = createPlayer(gameSettings.playerName, 1, 1, 'bottom');
  const player2: EuchrePlayer = createPlayer('Jerry', 1, 2, 'top');
  const player3: EuchrePlayer = createPlayer('George', 2, 3, 'left');
  const player4: EuchrePlayer = createPlayer('Elaine', 2, 4, 'right');

  player1.human = !gameSettings.debugAllComputerPlayers;

  const newGame: EuchreGameInstance = createBaseGame(player1, player2, player3, player4);
  newGame.deck = createPlaceholderCards(24);
  newGame.handId = uuidv4();
  newGame.dealer = player1;

  return newGame;
};

/** Get the initial game state when the game begins. */
const getGameStateForInitialDeal = (
  gameState: EuchreGameFlowState,
  settings: EuchreSettings,
  gamePlayers: EuchrePlayer[]
) => {
  const newGameFlow: EuchreGameFlowState = {
    ...gameState,
    hasGameStarted: true,
    shouldShowCardValuesForHand: gamePlayers.map((p) => {
      return { player: p, value: p.human || settings.debugShowPlayersHand };
    }),
    hasFirstBiddingPassed: false,
    hasSecondBiddingPassed: false,
    gameFlow: EuchreGameFlow.BEGIN_INTRO
  };

  return newGameFlow;
};

/** Initialize the game with shuffled deck and set player 1 for deal. */
const createGameForInitialDeal = (gameSettings: EuchreSettings): EuchreGameInstance => {
  const gameInstance: EuchreGameInstance = createEuchreGame(gameSettings);

  gameInstance.currentPlayer = gameInstance.player1;
  gameInstance.dealer = gameInstance.player1;
  gameInstance.deck = createShuffledDeck(5);
  gameInstance.originalDealDeck = gameInstance.deck.map((c) => ({ ...c }));

  return gameInstance;
};

/** Deal cards to players until first Jack is dealt. The player that is dealt the Jack will be the initial dealer for the game.
 * Animates using a transform to show a card being dealt to the user, if enabled by the settings.
 */
const dealCardsForNewDealer = (game: EuchreGameInstance): InitDealResult => {
  let counter: number = 0;
  const rotation: EuchrePlayer[] = getPlayerRotation(game.gamePlayers, game.dealer);
  const retval: InitDealResult = {
    newDealer: game.dealer,
    cardIndex: 0
  };

  let jackCount = 0;
  // Deal until the first jack is dealt
  for (const card of game.deck) {
    // exit loop once a jack is dealt.
    if (card.value === 'J') {
      retval.newDealer = rotation[counter % 4];
      retval.cardIndex = counter;
      jackCount++;

      if (jackCount === 1) break;
    }

    counter++;
  }

  return retval;
};

/**
 * Deal cards to determine who the initial dealer is for a new game.
 * First Jack dealt will be the dealer of the game.
 */
const dealCardsForDealer = (
  gameInstance: EuchreGameInstance,
  gameState: EuchreGameFlowState
): InitDealResult | null => {
  if (!gameState.hasGameStarted) return null;

  // deal the cards until first Jack is dealt.
  const newDealerResult = dealCardsForNewDealer(gameInstance);
  return newDealerResult;
};

/** Shuffle and deal cards for regular game play. Starts the bidding process to determine if the dealer should pick up the flipped card
 * or if a player will name suit. */
const shuffleAndDealHand = (
  gameInstance: EuchreGameInstance,
  gameSettings: EuchreSettings,
  replayGameInstance: EuchreGameInstance | null
): ShuffleResult => {
  let newGame: EuchreGameInstance | undefined;
  const difficulty: GameDifficulty = gameSettings.difficulty;
  const redealLimit: number = 10;
  const replayHand = replayGameInstance?.handResults.find((r) => r.roundNumber === gameInstance.currentRound);

  let counter: number = 0;
  let shouldReDeal: boolean = true;

  while (shouldReDeal) {
    newGame = resetForNewDeal(gameInstance);

    if (replayHand === undefined) {
      newGame.deck = createShuffledDeck(5);
      newGame = dealCards(newGame);
      newGame.trump = { ...newGame.kitty[0] };
    } else {
      newGame = copyCardsFromReplay(newGame, replayHand);
    }

    if (difficulty === 'novice' && replayHand === undefined) {
      // if AI players have a strong start for 'novice' difficulty, then re-deal until limit is reached.
      const computerIsDealer = newGame.dealer.team === 2;
      const player3SuitCount = getSuitCount(newGame.player3.hand, newGame.trump);
      const player4SuitCount = getSuitCount(newGame.player4.hand, newGame.trump);
      const trumpCardFlipped = newGame.trump?.value === 'J' && computerIsDealer;

      shouldReDeal =
        counter < redealLimit &&
        (trumpCardFlipped || player3SuitCount.length === 2 || player4SuitCount.length === 2);
      counter++;
    } else {
      shouldReDeal = false;
    }
  }

  if (!newGame) throw new Error('[shuffleAndDealHand] - Invalid game when shuffling and dealing.');

  for (const player of newGame.gamePlayers) {
    player.hand = indexCards(player.hand);
  }

  try {
    verifyDealtCards(newGame);
  } catch (e) {
    const cardsForPlayers = newGame.gamePlayers.map((p) => p.hand);
    console.error(cardsForPlayers, replayHand);
    throw e;
  }

  return { game: newGame };
};

export {
  shuffleAndDealHand,
  getGameStateForInitialDeal,
  createEuchreGame,
  createGameForInitialDeal,
  dealCardsForDealer,
  createPlayer,
  createDefaultEuchreGame,
  createTrick
};
