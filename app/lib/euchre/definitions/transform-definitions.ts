import { TargetAndTransition } from 'framer-motion';
import { TableLocation } from './definitions';

export const INIT_Z_INDEX = 30;
export const DEFAULT_SPRING_VAL: CardSpringTarget = {
  x: 0,
  y: 0,
  rotate: 0,
  opacity: 1,
  rotateY: 0,
  rotateX: 0,
  zIndex: INIT_Z_INDEX,
  transformStyle: 'preserve-3d'
};

export interface CardSpringTarget extends TargetAndTransition {
  x: number;
  y: number;
  rotate?: number;
  opacity?: number;
  rotateY?: number;
  rotateX?: number;
  zIndex?: number;
}

export interface CardPosition {
  /** Index used to order the card for display. */
  ordinalIndex: number;

  /** Index associated with the index of the card in the player's hand. */
  cardIndex: number;

  location?: TableLocation;
}

export interface CardSpringProps extends CardPosition {
  animateValues: CardSpringTarget[];
}
