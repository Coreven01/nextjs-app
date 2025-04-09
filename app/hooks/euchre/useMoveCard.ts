'use client';

import { Card, GameSpeed } from '@/app/lib/euchre/definitions';
import { useCallback, useEffect, useState } from 'react';
import useCardSvgData from './data/useCardSvgData';

export interface CardTransformation {
  sourceId: string;
  destinationId: string;
  sourcePlayerNumber: number;
  destinationPlayerNumber: number;
  location: 'inner' | 'outer';
  options: CardTransformOptions | undefined;
}

export interface CardTransformOptions {
  card: Card | undefined;
  displayCardValue: boolean | undefined;
  msDelay: number | undefined;
  cardOffsetVertical: number;
  cardOffsetHorizontal: number;
}

export interface FadeOutOptions {
  playerNumber: number | 'o';
  fadeOutId: string;
  fadeOutDelay: GameSpeed;
  fadeOutDuration: GameSpeed;
}

export type DealAnimation = {
  setCardsToMove: (transformValues: CardTransformation[]) => Promise<void>;
};

/** Effect to animate dealing a card. */
export function useMoveCard(): DealAnimation {
  const [values, setValues] = useState<CardTransformation[]>([]);
  const { getEncodedCardSvg } = useCardSvgData();

  useEffect(() => {
    const dealCards = async () => {
      for (const transform of values) {
        animateCardMove(transform);

        if (transform?.options?.msDelay)
          await new Promise((resolve) => setTimeout(resolve, transform?.options?.msDelay));
      }
    };

    dealCards();
  }, [values]);

  const animateCardMove = (transform: CardTransformation) => {
    if (transform?.sourceId && transform?.destinationId) {
      const src: HTMLImageElement = document.getElementById(transform.sourceId) as HTMLImageElement;
      const dest = document.getElementById(transform.destinationId);

      const srcRect = src?.getBoundingClientRect();
      const destRect = dest?.getBoundingClientRect();

      if (src && srcRect && dest && destRect) {
        const transformation = getTransformationValue(transform, srcRect, destRect);

        src.style.transform = transformation;

        if (transform.options?.displayCardValue) {
          if (transform.options.card) src.src = getEncodedCardSvg(transform.options.card, 'side');
        }
      } else {
        console.error(
          'Transformation error | Source ID: ',
          transform?.sourceId,
          'Destination ID: ',
          transform?.destinationId,
          'Source Element: ',
          src,
          'Destination Element: ',
          dest,
          'Source Rect: ',
          srcRect,
          'Destination Rect: ',
          destRect
        );

        throw Error('Unable to translate card.');
      }
    }
  };

  const getTransformationValue = (transform: CardTransformation, srcRect: DOMRect, destRect: DOMRect) => {
    const sidePlayers = [3, 4];
    const centerPlayers = [1, 2];

    if (centerPlayers.find((num) => num === transform.sourcePlayerNumber))
      return getTransformationForCenter(transform, srcRect, destRect);
    else return getTransformationForSide(transform, srcRect, destRect);
  };

  function getTransformationForCenter(transform: CardTransformation, srcRect: DOMRect, destRect: DOMRect) {
    let widthOffset = 0;
    let heightOffset = 0;

    if (srcRect?.width > destRect?.width) widthOffset = srcRect.width - destRect.width;
    else widthOffset = destRect.width - srcRect.width;

    if (srcRect?.width > destRect?.height) heightOffset = srcRect.width - destRect.height;
    else heightOffset = destRect.width - srcRect.height;

    const sidePlayers = [3, 4];
    const centerPlayers = [1, 2];
    const rotate90 =
      (centerPlayers.find((val) => val === transform.sourcePlayerNumber) &&
        sidePlayers.find((val) => val === transform.destinationPlayerNumber)) ||
      (sidePlayers.find((val) => val === transform.sourcePlayerNumber) &&
        centerPlayers.find((val) => val === transform.destinationPlayerNumber));

    const transformationRotation = rotate90 ? 'rotate(90deg)' : 'rotate(180deg)';

    let transformation = '';

    if (transform.location === 'outer') {
      switch (transform.destinationPlayerNumber) {
        case 1:
          transformation = `translate(${destRect.left - srcRect.left - widthOffset / 2}px, ${destRect.bottom - srcRect.bottom}px) ${transformationRotation}`;
          break;
        case 2:
          transformation = `translate(${destRect.left - srcRect.left - widthOffset / 2}px, ${destRect.top - srcRect.top}px) ${transformationRotation}`;
          break;
        case 3:
          transformation = `translate(${destRect.right - srcRect.left + destRect.width / 2}px, ${destRect.top - srcRect.top - heightOffset / 2}px) ${transformationRotation}`;
          break;
        case 4:
          transformation = `translate(${destRect.left - srcRect.right - destRect.width / 2}px, ${destRect.top - srcRect.top - heightOffset / 2}px) ${transformationRotation}`;
      }
    } else {
      switch (transform.destinationPlayerNumber) {
        case 1:
          transformation = `translate(${destRect.left - srcRect.left - widthOffset / 2}px, ${destRect.top - srcRect.top}px) ${transformationRotation}`;
          break;
        case 2:
          transformation = `translate(${destRect.left - srcRect.left - widthOffset / 2}px, ${destRect.bottom - srcRect.bottom}px) ${transformationRotation}`;
          break;
        case 3:
          transformation = `translate(${destRect.left - srcRect.right - destRect.width / 2}px, ${destRect.top - srcRect.top - srcRect.height / 2}px) ${transformationRotation}`;
          break;
        case 4:
          transformation = `translate(${destRect.right - srcRect.left + destRect.width / 2}px, ${destRect.top - srcRect.top - srcRect.height / 2}px) ${transformationRotation}`;
      }
    }

    return transformation;
  }

  function getTransformationForSide(transform: CardTransformation, srcRect: DOMRect, destRect: DOMRect) {
    let widthOffset = 0;
    let heightOffset = 0;

    if (srcRect?.width > destRect?.width) widthOffset = srcRect.width - destRect.width;
    else widthOffset = destRect.width - srcRect.width;

    if (srcRect?.height > destRect?.height) heightOffset = srcRect.height - destRect.height;
    else heightOffset = destRect.height - srcRect.height;

    const sidePlayers = [3, 4];
    const centerPlayers = [1, 2];
    const rotate90 =
      (centerPlayers.find((val) => val === transform.sourcePlayerNumber) &&
        sidePlayers.find((val) => val === transform.destinationPlayerNumber)) ||
      (sidePlayers.find((val) => val === transform.sourcePlayerNumber) &&
        centerPlayers.find((val) => val === transform.destinationPlayerNumber));

    const transformationRotation = rotate90 ? 'rotate(90deg)' : 'rotate(180deg)';

    let transformation = '';

    if (transform.location === 'outer') {
      switch (transform.destinationPlayerNumber) {
        case 1:
          transformation = `translate(${destRect.left - srcRect.left - widthOffset / 2}px, ${destRect.bottom - srcRect.bottom}px) ${transformationRotation}`;
          break;
        case 2:
          transformation = `translate(${destRect.left - srcRect.left - widthOffset / 2}px, ${destRect.top - srcRect.top}px) ${transformationRotation}`;
          break;
        case 3:
          transformation = `translate(${destRect.right - srcRect.left + destRect.width / 2}px, ${destRect.top - srcRect.top - srcRect.width / 2}px) ${transformationRotation}`;
          break;
        case 4:
          transformation = `translate(${destRect.left - srcRect.right - destRect.width / 2}px, ${destRect.top - srcRect.top - srcRect.width / 2}px) ${transformationRotation}`;
      }
    } else {
      switch (transform.destinationPlayerNumber) {
        case 1:
          transformation = `translate(${destRect.left - srcRect.left - widthOffset / 2}px, ${destRect.top - srcRect.top}px) ${transformationRotation}`;
          break;
        case 2:
          transformation = `translate(${destRect.left - srcRect.left - widthOffset / 2}px, ${destRect.bottom - srcRect.bottom}px) ${transformationRotation}`;
          break;
        case 3:
          transformation = `translate(${destRect.left - srcRect.right - destRect.width / 2}px, ${destRect.top - srcRect.top - srcRect.width / 2}px) ${transformationRotation}`;
          break;
        case 4:
          transformation = `translate(${destRect.right - srcRect.left + destRect.width / 2}px, ${destRect.top - srcRect.top - srcRect.width / 2}px) ${transformationRotation}`;
      }
    }

    return transformation;
  }

  const setCardsToMove = useCallback(async (transformValues: CardTransformation[]) => {
    setValues(transformValues);

    const msOptions = transformValues.map((transform) =>
      transform?.options?.msDelay ? transform.options.msDelay : 0
    );
    const totalMs = msOptions.reduce((accumulator, current) => accumulator + current);

    if (totalMs > 0) await new Promise((resolve) => setTimeout(resolve, totalMs));
  }, []);

  return { setCardsToMove };
}
