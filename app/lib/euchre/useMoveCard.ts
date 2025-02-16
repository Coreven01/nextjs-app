'use client';

import { useCallback, useEffect, useState } from "react";
import { getEncodedCardSvg } from "./card-data";
import { Card } from "./data";

export interface CardTransformation {
    sourceId: string,
    destinationId: string,
    sourcePlayerNumber: number,
    destinationPlayerNumber: number,
    options: CardTransformOptions | undefined,
}

export interface CardTransformOptions {
    card: Card | undefined,
    displayCardValue: boolean | undefined,
    msDelay: number | undefined,
    cardOffsetVertical: number,
    cardOffsetHorizontal: number,
}

export type DealAnimation = {
    setCardsToMove: (transformValues: CardTransformation[]) => void,
}

/** Effect to animate dealing a card. */
export function useMoveCard(): DealAnimation {

    const [values, setValues] = useState<CardTransformation[]>([]);

    useEffect(() => {

        const dealCards = async () => {
            for (const transform of values) {
                animateCardMove(transform);

                if (transform?.options?.msDelay)
                    await new Promise((resolve) => setTimeout(resolve, transform?.options?.msDelay));
            }
        }

        dealCards();

    }, [values]);

    const setCardsToMove = useCallback(async (transformValues: CardTransformation[]) => {
        setValues(transformValues);
        await new Promise((resolve) => setTimeout(resolve, 200));
    }, []);

    return { setCardsToMove }
}

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
                if (transform.options.card)
                    src.src = getEncodedCardSvg(transform.options.card, "side");
            }
        } else {
            console.error('Transformation error | Source ID: ', transform?.sourceId,
                'Destination ID: ', transform?.destinationId,
                'Source Element: ', src,
                'Destination Element: ', dest,
                'Source Rect: ', srcRect,
                'Destination Rect: ', destRect);

            throw Error('Unable to translate card.');
        }
    }
};

const getTransformationValue = (transform: CardTransformation, srcRect: DOMRect, destRect: DOMRect) => {
    let widthOffset = 0;

    if (srcRect?.width > destRect?.width)
        widthOffset = srcRect.width - destRect.width;
    else
        widthOffset = destRect.width - srcRect.width;

    const sidePlayers = [3, 4];
    const centerPlayers = [1, 2];
    const rotate90 = centerPlayers.find((val) => val === transform.sourcePlayerNumber) &&
        sidePlayers.find((val) => val === transform.destinationPlayerNumber) ||
        sidePlayers.find((val) => val === transform.sourcePlayerNumber) &&
        centerPlayers.find((val) => val === transform.destinationPlayerNumber);

    const transformationRotation = rotate90 ? "rotate(90deg)" : "rotate(180deg)";

    let transformation = '';

    switch (transform.destinationPlayerNumber) {
        case 1:
            transformation = `translate(${destRect.left - srcRect.left - widthOffset / 2}px, ${destRect.bottom - srcRect.bottom}px) ${transformationRotation}`;
            break;
        case 2:
            transformation = `translate(${destRect.left - srcRect.left - widthOffset / 2}px, ${destRect.top - srcRect.top}px) ${transformationRotation}`;
            break;
        case 3:
            transformation = `translate(${destRect.right - srcRect.left + (destRect.width / 2)}px, ${destRect.top - srcRect.top - (srcRect.width / 2)}px) ${transformationRotation}`;
            break;
        case 4:
            transformation = `translate(${destRect.left - srcRect.right - (destRect.width / 2)}px, ${destRect.top - srcRect.top - (srcRect.width / 2)}px) ${transformationRotation}`;
    }

    return transformation;
}