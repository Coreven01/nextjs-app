import { AnimationControls, TargetAndTransition, Transition } from 'framer-motion';
import { Card, GameSpeed, TableLocation } from './definitions';
import { CardBaseState, CardIndex } from './game-state-definitions';

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
  initialValue: CardSpringTarget | undefined;
  animateValues: CardSpringTarget[];
}

export interface FlipSpringProps extends CardPosition {
  initialValue: FlipSpringTarget | undefined;
  animateValues: FlipSpringTarget[];
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
  initSpringValue?: CardSpringTarget;
  animateValues: CardSpringTarget[];
  controls: AnimationControls | undefined;
  flipControl: AnimationControls | undefined;
  initFlipSpring?: FlipSpringTarget;
  animateFlipSpring?: FlipSpringTarget[];
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
