'use client';

import { useEffect, useState } from "react";

type TimerEventType = {
    setElements: (source: string, destination: string, player: number) => void,
}

export function usePlayCard(): TimerEventType {

    const [source, setSource] = useState("");
    const [destination, setDestination] = useState<string>("");
    const [player, setPlayer] = useState<number>(0);

    useEffect(() => {
        playCard();
    }, [source, destination]);

    const setElements = (source: string, destination: string, player: number) => {
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
                let transformation = '';

                switch (player) {
                    case 1:
                        transformation = `translate(${destRect.left - srcRect.left / 2}px, ${destRect.top - srcRect.top + (destRect.bottom - destRect.top) / 8}px)`;
                        break;
                    case 2:
                        transformation = `translate(${destRect.left - srcRect.left / 2}px, ${destRect.top - srcRect.top + (destRect.bottom - destRect.top) / 8}px)`;
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
                console.error('transformation error:',source, destination, src, srcRect, destRect);
                throw Error('Unable to translate card.');      
            }
        }
    };

    return { setElements }
}