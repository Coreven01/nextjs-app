import { AnimationControls, TargetAndTransition, Transition } from 'framer-motion';
import { Card, TableLocation } from './definitions';

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

export interface FlipSpringTarget {
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

// export interface CreateCardStateContext {
//   card: Card;
//   control: AnimationControls;
//   flipControl: AnimationControls;
//   initSpringValue?: CardSpringTarget;
//   initAnimateValues?: CardSpringTarget[];
//   initFlipValue?: FlipSpringTarget;
//   initFlipAnimateValues?: FlipSpringTarget[];
// }
