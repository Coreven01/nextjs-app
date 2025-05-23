import { Card, Suit } from './definitions';
import { EuchreCard, EuchreGameInstance, EuchrePlayer, EuchreTrick } from './game-state-definitions';

export interface InitDealResult {
  newDealer: EuchrePlayer;
  cardIndex: number;
}

export interface ShuffleResult {
  game: EuchreGameInstance;
}

export interface GameBidLogic {
  trumpCardCount: number;
  offSuitAceCount: number;
  playerHasRight: boolean;
  playerHasLeft: boolean;
  suitsInHand: number;
  firstRoundOfBidding: boolean;
}

export interface PlayCardResult {
  card: Card;
}

//#region Logic information used to decide which card to play.
export interface TeamLogic {
  currentUserIsMaker: boolean;
  teammateIsMaker: boolean;

  /** True if no cards have yet to be played for the current hand.  */
  isFirstPlayer: boolean;

  /** Number of cards played for the current player in the current round. */
  cardsPlayed: number;

  /** True if the current player leads the current trick. */
  isLeading: boolean;

  /** True if the current player plays the last card for the trick */
  isLast: boolean;
  teammateYetToPlay: boolean;
  playerTeam: 1 | 2;
}

export interface TrumpLogic {
  /** Total trump count for the players entire hand. */
  totalHandTrumpCardCount: number;

  /** Number of trump currently in hand. */
  currentTrumpCardCount: number;

  /** True if the player has right bower */
  playerHasRight: boolean;

  /** True if the player has the left bower */
  playerHasLeft: boolean;

  /** Current cards available to play that are trump. High is the highest value, low is the lowest value. */
  trumpHighLow: { high: Card | null; low: Card | null };

  /** Dealer picked up the right bower. */
  knownPlayerWithRight: EuchrePlayer | null;

  /** Saw the right bower was played by any player */
  rightWasSeen: boolean;

  /** Saw the left bower was played by any player */
  leftWasSeen: boolean;
}

export interface OffsuitLogic {
  /** Number of aces currently available to play. */
  offSuitAceCount: number;

  /** Number of aces currently available to play where the suit was not yet lead. */
  offSuitAceCountNotYetLead: number;

  /** Cards that don't follow trump suit. High is the highest value, low is the lowest value. */
  offsuitHighLow: { high: Card | null; low: Card | null };

  /** Cards that don't follow trump suit where the suit has not yet lead. High is the highest value, low is the lowest value. */
  offsuitNotYetLeadHighLow: { high: Card | null; low: Card | null };

  /** True if teammate lead an offsuit ace. */
  teammateLeadAce: boolean;
}

export interface TrickLogic {
  /** True if any player lead trump for the current trick. */
  trumpWasLead: boolean;

  /** All the card values in the players hand available to play. */
  cardValues: { card: Card; value: number }[];

  /** The card the was lead for the current trick. */
  leadCard: EuchreCard | null;

  /** Number of tricks won by the team for the current hand */
  teamTricksWon: number;

  /** Number of tricks won by the opposing team for the current hand */
  opponentTricksWon: number;

  /** Cards available to play that beat the current winning card for the trick. */
  winningHighLow: { high: Card | null; low: Card | null };

  /** All other cards available to player that won't beat the current winning card. */
  losingHighLow: { high: Card | null; low: Card | null };

  /** Card and user that is currently winning the trick. */
  currentWinningCard: { card: EuchreCard | null; value: number };

  /** Cards that are available to play if the user must follow suit. */
  cardsAvailableToFollowSuit: { card: Card; value: number }[];

  /** Map of suit to the count of those suits in the players hand. */
  suitCount: { suit: Suit; count: number }[];

  /** True if the player must follow suit. */
  mustFollowSuit: boolean;

  /** Suit that must be followed */
  suitToFollow: Suit | null;

  /** Reference to the cards that have been played in the current trick. */
  currentTrick: EuchreTrick;

  /** True if the player's team is currently losing the hand. */
  currentlyLosing: boolean;

  /** Array of suits that were lead for the current hand. General strategy is to avoid leading the same suit more than once
   * because changes are the opposing team will not have any left to follow suit.
   */
  suitsLeadForHand: Set<Suit>;

  leadCardIsRight: boolean;

  leadCardIsLeft: boolean;
}

export interface GamePlayLogic {
  teamInfo: TeamLogic;
  trumpInfo: TrumpLogic;
  offsuitInfo: OffsuitLogic;
  trickInfo: TrickLogic;
}
