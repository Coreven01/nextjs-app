'use client';

import { useEffect, useState } from "react";
import { Card } from "./data";
import { getEncodedCardSvg } from "./card-data";

interface CardTransformation {
    sourceId: string,
    destinationId: string,
    sourcePlayerNumber: number,
    destinationPlayerNumber: number,
}

interface CardTransformOptions {
    card: Card | undefined,
    displayCardValue: boolean | undefined,
    msDelay: number | undefined,
}

type Props = {
    setPlayElements: (transformValues: CardTransformation) => void,
}

export function usePlayCard(): Props {

    const [values, setValues] = useState<CardTransformation>();

    useEffect(() => {
        playCard();
    }, [values]);

    const setPlayElements = (transformValues: CardTransformation) => {
        setValues(transformValues);
    };

    const playCard = () => {

        if (values?.sourceId && values?.destinationId) {
            const src = document.getElementById(values.sourceId);
            const dest = document.getElementById(values.destinationId);

            const srcRect = src?.getBoundingClientRect();
            const destRect = dest?.getBoundingClientRect();

            if (src && srcRect && dest && destRect) {

                let widthOffset = 0;

                if (srcRect?.width > destRect?.width)
                    widthOffset = srcRect.width - destRect.width;
                else
                    widthOffset = destRect.width - srcRect.width;

                let transformation = '';

                switch (values.destinationPlayerNumber) {
                    case 1:
                        transformation = `translate(${destRect.left - srcRect.left + widthOffset / 2}px, ${destRect.top - srcRect.top - 10}px)`;
                        break;
                    case 2:
                        transformation = `translate(${destRect.left - srcRect.left + widthOffset / 2}px, ${destRect.top - srcRect.top}px)`;
                        break;
                    case 3:
                        transformation = `translate(${destRect.right - srcRect.right}px, ${destRect.top - srcRect.top + (destRect.bottom - destRect.top) / 8}px)`;
                        break;
                    case 4:
                        transformation = `translate(${destRect.left - srcRect.left}px, ${destRect.top - srcRect.top + (destRect.bottom - destRect.top) / 8}px)`;
                }

                src.style.transform = transformation;
                console.log('transformation:', destRect.left, srcRect.left, transformation);
            } else {
                console.error('transformation error:', values?.sourceId, values?.destinationId, src, srcRect, destRect);
                throw Error('Unable to translate card.');
            }
        }
    };

    return { setPlayElements }
}

type DealProps = {
    setDealElements: (transformValues: CardTransformation, transformOptions: CardTransformOptions) => Promise<void>,
}

export function useDealCard(): DealProps {

    const [values, setValues] = useState<CardTransformation>();
    const [options, setOptions] = useState<CardTransformOptions>();

    useEffect(() => {
        dealCard();
    }, [values]);

    const setDealElements = async (transformValues: CardTransformation, transformOptions: CardTransformOptions) => {

        setValues(transformValues);
        setOptions(transformOptions);

        if (transformOptions?.msDelay)
            await new Promise((resolve) => setTimeout(resolve, transformOptions.msDelay));
    };

    const dealCard = () => {

        if (values?.sourceId && values?.destinationId) {
            const src: HTMLImageElement = document.getElementById(values.sourceId) as HTMLImageElement;
            const dest = document.getElementById(values.destinationId);

            const srcRect = src?.getBoundingClientRect();
            const destRect = dest?.getBoundingClientRect();

            if (src && srcRect && dest && destRect) {

                let widthOffset = 0;

                if (srcRect?.width > destRect?.width)
                    widthOffset = srcRect.width - destRect.width;
                else
                    widthOffset = destRect.width - srcRect.width;

                const sidePlayers = [3, 4];
                const centerPlayers = [1, 2];
                const rotate90 = centerPlayers.find((val) => val === values.sourcePlayerNumber) &&
                    sidePlayers.find((val) => val === values.destinationPlayerNumber) ||
                    sidePlayers.find((val) => val === values.sourcePlayerNumber) &&
                    centerPlayers.find((val) => val === values.destinationPlayerNumber);

                const transformationRotation = rotate90 ? "rotate(90deg)" : "rotate(180deg)";

                let transformation = '';

                switch (values.destinationPlayerNumber) {
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

                src.style.transform = transformation;

                if (options?.displayCardValue) {
                    if (options.card)
                        src.src = getEncodedCardSvg(options.card, "side");
                }

                console.log('transformation:', destRect.left, srcRect.left, transformation);
            } else {
                console.error('transformation error:', values?.sourceId, values?.destinationId, src, srcRect, destRect);
                throw Error('Unable to translate card.');
            }
        }
    };

    return { setDealElements }
}

export function useRemoveElement() {
    const [element, setElement] = useState("");

    useEffect(() => {
        const ele = document.getElementById(element);
        if (ele?.parentNode) {
            ele.parentNode.removeChild(ele);
            console.log("removing: ", ele);
        }

    }, [element]);

    const setElementToRemove = (id: string) => {
        setElement(id);
    };

    return { setElementToRemove };
}

export function useRemoveTransformations() {
    const [elements, setElements] = useState<string[]>([]);

    useEffect(() => {
        if (elements && elements.length) {
            for (const element of elements) {
                const img = document.getElementById(element) as HTMLElement;
                if (img)
                    img.style.transform = "";
            }
        }
    }, [elements]);

    const setElementsForTransformation = (id: string[]) => {
        setElements(id);
    };

    return { setElementsForTransformation };
}