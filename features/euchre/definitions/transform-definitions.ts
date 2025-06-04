import { AnimationControls, TargetAndTransition, Transition } from 'framer-motion';
import { Card, GameSpeed, TableLocation } from './definitions';
import {
  CardBaseState,
  CardIndex,
  DeckState,
  EuchrePlayer,
  GamePlayContext,
  HandState
} from './game-state-definitions';
import { Dispatch, RefObject, SetStateAction } from 'react';
import { InitDealResult } from './logic-definitions';

export const INIT_Z_INDEX = 30;
export const DEFAULT_SPRING_VAL: CardSpringTarget = {
  x: 0,
  y: 0,
  rotate: 0,
  opacity: 1,
  zIndex: INIT_Z_INDEX,
  transformStyle: 'preserve-3d'
};

export interface CardSpringTarget extends TargetAndTransition {
  x: number;
  y: number;
  rotate?: number;
  opacity?: number;
  zIndex?: number;
}

export interface FlipSpringTarget extends TargetAndTransition {
  rotateY: number;
  rotateX: number;
  transition?: Transition;
}

export interface CardPosition {
  /** Index used to order the card for display. */
  ordinalIndex: number;

  /** Index associated with the index of the card in the player's hand. */
  cardIndex: number;

  location?: TableLocation;
}

export interface CardSpringProps extends CardPosition {
  initialSpring: CardSpringTarget | undefined;
  animateSprings: CardSpringTarget[];
}

export interface FlipSpringProps extends CardPosition {
  initialSpring: FlipSpringTarget | undefined;
  animateSprings: FlipSpringTarget[];
}

export interface CreateCardStatesContext {
  cards: Card[];
  controls: AnimationControls[];
  flipControls: AnimationControls[];
  initCardSpring: CardSpringProps[];
  initFlipSprings: FlipSpringProps[];
}

export interface AnimationSpringsResult {
  cardSprings: CardSpringProps[];
  flipSprings: FlipSpringProps[];
}

export interface CardAnimationState extends CardIndex {
  xDamping: number;
  xStiffness: number;
  yDamping: number;
  yStiffness: number;
}

export interface CardAnimationControls extends CardIndex {
  initSpring?: CardSpringTarget;
  animateSprings: CardSpringTarget[];
  controls: AnimationControls | undefined;
  flipControls?: AnimationControls | undefined;
  initFlipSpring?: FlipSpringTarget;
  animateFlipSprings?: FlipSpringTarget[];
}

export interface ZTransition {
  startZ?: number;
  endZ: number;
  delayMs: number;
}

export interface CardAnimationStateContext {
  cardStates: CardBaseState[];
  animationStates: CardAnimationState[];
  animationControls: CardAnimationControls[];
}

export interface DispatchCardAnimation {
  setCardStates: Dispatch<SetStateAction<CardBaseState[]>>;
  setCardAnimationStates: Dispatch<SetStateAction<CardAnimationState[]>>;
  setCardAnimationControls: Dispatch<SetStateAction<CardAnimationControls[]>>;
}

export interface SpringContext {
  sourceElement: HTMLElement;
  destinationElement: HTMLElement;
  relativeElement?: HTMLElement;
  destinationLocation?: TableLocation;
  gameSpeed?: GameSpeed;
  currentSpring?: CardSpringTarget;
}

/** Elements associated with different locations on the game table. Used when determining tranformations when moving/animating cards. */
export interface GameTableElements {
  /** Map of side locations to elements near the center of the game table. */
  centerTableRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>;

  /** Map of side locations to elements near the edge of the game table. */
  outerTableRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>;

  /** Element that divides the game table horizontally. */
  centerHorizontalRef: RefObject<HTMLDivElement | null>;

  /** Element that divides the game table vertically. */
  centerVerticalRef: RefObject<HTMLDivElement | null>;

  /** Element for the entire game table. */
  gameTableRef: RefObject<HTMLDivElement | null> | undefined;
}

export interface CardPlayAnimationState {
  handState: HandState | undefined;
  gameContext: GamePlayContext;
  stateContext: CardAnimationStateContext;
  player: EuchrePlayer;
  dispatchAnimationState: DispatchCardAnimation;
  playerTableCenterElement: HTMLElement | null;
  cardRefs: Map<number, RefObject<HTMLDivElement | null>>;
  playerDeckRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>;
  initializeSortOrder: () => void;
  getRelativeCenter: (location: TableLocation) => HTMLElement | null;
  getWidth: (element: HTMLElement, reset: boolean) => number;
  getAvailableCardsAndState: (useInitSortOrder: boolean) => CardSpringProps[];
  onTrickComplete: (card: Card) => void;
  onTrumpOrderedComplete: (playerNumber: number) => void;
  onDealPassed: (playerNumber: number) => void;
}

export interface CardInitAnimationState {
  gameContext: GamePlayContext;
  stateContext: CardAnimationStateContext;
  player: EuchrePlayer;
  dispatchAnimationState: DispatchCardAnimation;
  cardRefs: Map<number, RefObject<HTMLDivElement | null>>;
  playerDeckRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>;
  getUpdatedCardAnimationSprings: (
    controls: CardAnimationControls[],
    updatedSprings: CardSpringProps[],
    flipSprings: FlipSpringProps[]
  ) => CardAnimationControls[];
  setSortOrder: (orderedIndices: CardPosition[]) => void;
  createStates: (
    cards: Card[],
    location: TableLocation,
    includeCardValue: boolean,
    initValues: CardSpringProps[],
    initFlipValues: FlipSpringProps[],
    reverseIndex: boolean
  ) => CardAnimationStateContext;
  getRelativeCenter: (location: TableLocation) => HTMLElement | null;
  getWidth: (element: HTMLElement, reset: boolean) => number;
  getAvailableCardsAndState: (useInitSortOrder: boolean) => CardSpringProps[];
  onDealComplete: (playerNumber: number) => void;
}

export interface DeckInitAnimationState {
  gameContext: GamePlayContext;
  stateContext: CardAnimationStateContext;
  dispatchAnimationState: DispatchCardAnimation;
  deckAnimationControls: AnimationControls;
  cardRefs: Map<number, RefObject<HTMLDivElement | null>>;
  createStates: (
    cards: Card[],
    location: TableLocation,
    includeCardValue: boolean,
    initValues: CardSpringProps[],
    initFlipValues: FlipSpringProps[],
    reverseIndex: boolean
  ) => CardAnimationStateContext;
}

export interface DealForDealerAnimationState {
  gameContext: GamePlayContext;
  stateContext: CardAnimationStateContext;
  deckAnimationControls: AnimationControls;
  centerHorizontalElement: HTMLElement | null;
  centerVerticalElement: HTMLElement | null;
  outerTableRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>;
  cardRefs: Map<number, RefObject<HTMLDivElement | null>>;
  playerDeckRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>;
  initDealer: InitDealResult | null;
  getMoveCardsIntoPositionState: () => {
    initMoveToDealer: CardSpringTarget;
    moveIntoView: CardSpringTarget;
  };
  updateCardBaseAndAnimationSprings: (
    stateContext: CardAnimationStateContext,
    cardSprings: CardSpringProps[],
    flipSprings: FlipSpringProps[]
  ) => void;
}

export interface RegularDealAnimationState {
  deckState: DeckState | undefined;
  gameContext: GamePlayContext;
  stateContext: CardAnimationStateContext;
  deckAnimationControls: AnimationControls;
  centerHorizontalElement: HTMLElement | null;
  centerVerticalElement: HTMLElement | null;
  outerTableRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>;
  cardRefs: Map<number, RefObject<HTMLDivElement | null>>;
  playerDeckRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>;
  getMoveCardsIntoPositionState: () => {
    initMoveToDealer: CardSpringTarget;
    moveIntoView: CardSpringTarget;
  };
  updateCardBaseAndAnimationSprings: (
    stateContext: CardAnimationStateContext,
    cardSprings: CardSpringProps[],
    flipSprings: FlipSpringProps[]
  ) => void;
}
