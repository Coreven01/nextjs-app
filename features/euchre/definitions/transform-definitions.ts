import { AnimationControls, TargetAndTransition, Transition } from 'framer-motion';
import { Card, GameSpeed, TableLocation } from './definitions';
import { CardBaseState, CardIndex } from './game-state-definitions';
import { RefObject } from 'react';

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

export interface CardAnimationStateContext {
  cardStates: CardBaseState[];
  animationStates: CardAnimationState[];
  animationControls: CardAnimationControls[];
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
