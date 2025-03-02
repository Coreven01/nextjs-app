'use client';

import { useEffect, useState } from "react";

export interface FadeOutProps {
    id: string,
    delay: number,
    duration: number,
}

export function useFadeOut() {
    const [fadeOutElementId, setFadeOutElement] = useState<string>('');
    const [fadeOutDelay, setFadeOutDelay] = useState<number>(2);
    const [fadeOutDuration, setFadeOutDuration] = useState<number>(2);

    useEffect(() => {

        if (!fadeOutElementId)
            return;

        const e = document.getElementById(fadeOutElementId);

        if (e) {
            const delayVals = ["delay-[1s]", "delay-[2s]", "delay-[3s]", "delay-[4s]", "delay-[5s]"];
            const durationVal = ["duration-[1s]", "duration-[2s]", "duration-[3s]", "duration-[4s]", "duration-[5s]"];
            const classList = ["transition-opacity", "ease-in-out"];

            if (fadeOutDelay > 0)
                classList.push(delayVals[fadeOutDelay - 1]);

            if (fadeOutDuration > 0)
                classList.push(durationVal[fadeOutDuration - 1]);

            e.classList.remove("opacity-0");

            setTimeout(() => {
                e.classList.add(...classList);
                e.classList.add("opacity-0");
            }, 50);

            const totalDuration = fadeOutDelay + fadeOutDuration;

            if (totalDuration > 0)
                setTimeout(() => { e.classList.remove(...classList); }, totalDuration * 950);

            //console.log(`Fade out triggered: ${fadeOutElementId}`, e);
        } else {
            //console.log(`Fade out element not found ${fadeOutElementId}`, e);
        }

    }, [fadeOutElementId, fadeOutDelay, fadeOutDuration]);

    const setElementForFadeOut = (id: string, delay: 0 | 1 | 2 | 3 | 4 | 5, duration: 0 | 1 | 2 | 3 | 4 | 5) => {

        // Only update the delay/duration if they have changed.
        if (delay !== fadeOutDelay) {
            setFadeOutDelay(delay); // Only set delay if it's different from the current value
        }

        if (duration !== fadeOutDuration) {
            setFadeOutDuration(duration); // Only set duration if it's different from the current value
        }

        if (id !== fadeOutElementId) {
            setFadeOutElement(id); // Only set the element ID if it's different from the current value
        }

        console.log("Add element for fade out: ", id, delay, duration);
    }

    return { setElementForFadeOut };
}