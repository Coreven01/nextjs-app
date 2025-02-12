'use client';

import { useEffect, useState } from "react";
import { Card } from "./data";
import { getEncodedCardSvg } from "./card-data";

type Props = {
    setPlayElements: (source: string, destination: string, player: number) => void,
}

export function usePlayCard(): Props {

    const [source, setSource] = useState("");
    const [destination, setDestination] = useState<string>("");
    const [player, setPlayer] = useState<number>(0);

    useEffect(() => {
        playCard();
    }, [source, destination]);

    const setPlayElements = (source: string, destination: string, player: number) => {
        setSource(source);
        setDestination(destination);
        setPlayer(player);
    };

    const playCard = () => {

        if (source && destination) {
            const src = document.getElementById(source);
            const dest = document.getElementById(destination);

            const srcRect = src?.getBoundingClientRect();
            const destRect = dest?.getBoundingClientRect();

            if (src && srcRect && dest && destRect) {

                let widthOffset = 0;

                if (srcRect?.width > destRect?.width)
                    widthOffset = srcRect.width - destRect.width;
                else
                    widthOffset = destRect.width - srcRect.width;

                let transformation = '';

                switch (player) {
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
                console.error('transformation error:', source, destination, src, srcRect, destRect);
                throw Error('Unable to translate card.');
            }
        }
    };

    return { setPlayElements }
}

type DealProps = {
    setDealElements: (source: string, destination: string, player: number, card: Card) => Promise<void>,
}

export function useDealCard(): DealProps {

    const [source, setSource] = useState("");
    const [destination, setDestination] = useState<string>("");
    const [player, setPlayer] = useState<number>(0);
    const [currentCard, setCurrentCart] = useState<Card | undefined>();
    const delay = 500;

    useEffect(() => {
        dealCard();
    }, [source, destination]);

    const setDealElements = async (source: string, destination: string, player: number, card: Card) => {

        await new Promise((resolve) => setTimeout(resolve, delay));

        setSource(source);
        setDestination(destination);
        setPlayer(player);
        setCurrentCart(card);
    };

    const dealCard = () => {

        if (source && destination) {
            const src: HTMLImageElement = document.getElementById(source) as HTMLImageElement;
            const dest = document.getElementById(destination);

            const srcRect = src?.getBoundingClientRect();
            const destRect = dest?.getBoundingClientRect();

            if (src && srcRect && dest && destRect) {

                let widthOffset = 0;

                if (srcRect?.width > destRect?.width)
                    widthOffset = srcRect.width - destRect.width;
                else
                    widthOffset = destRect.width - srcRect.width;

                let transformation = '';

                switch (player) {
                    case 1:
                        //transformation = `translate(${destRect.left - srcRect.left + widthOffset / 2}px, ${destRect.top - srcRect.top - 10}px)`;
                        break;
                    case 2:
                        transformation = `translate(${destRect.left - srcRect.left - widthOffset / 2}px, ${destRect.top - srcRect.top}px)`;
                        break;
                    case 3:
                        transformation = `translate(${destRect.right - srcRect.left + (destRect.width / 2)}px, ${destRect.top - srcRect.top - (srcRect.width / 2)}px) rotate(90deg)`;
                        break;
                    case 4:
                    transformation = `translate(${destRect.left - srcRect.right - (destRect.width / 2)}px, ${destRect.top - srcRect.top - (srcRect.width / 2)}px) rotate(-90deg) `;
                }
                //src.style.transform.
                src.style.transform = transformation;

                if (currentCard)
                    src.src = getEncodedCardSvg(currentCard, "side");
                console.log('transformation:', destRect.left, srcRect.left, transformation);
            } else {
                console.error('transformation error:', source, destination, src, srcRect, destRect);
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
        if (ele?.parentNode)
        {
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
       if (elements && elements.length)
       {
            for (const element of elements)
            {
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