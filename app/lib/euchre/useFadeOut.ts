'use client';

import { useEffect, useState } from "react";

export function useFadeOut() {
    const [element, setElement] = useState<string>('');

    useEffect(() => {
        const ele = document.getElementById(element);
        const classList = ["transition-opacity", "delay-[3s]", "opacity-0", "ease-in-out", "duration-[2s]"];

        if (ele) {
            ele.classList.add(...classList);
            //ele.classList.remove(...classList);
        }
    }, [element]);

    const setElementForFadeOut = (id: string) => {
        setElement(id);
    }

    return { setElementForFadeOut };
}