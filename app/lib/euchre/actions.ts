'use client';

import { useEffect, useState } from "react";


// type Props = {
//     setPlayElements: (transformValues: CardTransformation) => void,
// }

// export function usePlayCard(): Props {

//     const [values, setValues] = useState<CardTransformation>();

//     useEffect(() => {
//         playCard();
//     }, [values]);

//     const setPlayElements = (transformValues: CardTransformation) => {
//         setValues(transformValues);
//     };

//     const playCard = () => {

//         if (values?.sourceId && values?.destinationId) {
//             const src = document.getElementById(values.sourceId);
//             const dest = document.getElementById(values.destinationId);

//             const srcRect = src?.getBoundingClientRect();
//             const destRect = dest?.getBoundingClientRect();

//             if (src && srcRect && dest && destRect) {

//                 let widthOffset = 0;

//                 if (srcRect?.width > destRect?.width)
//                     widthOffset = srcRect.width - destRect.width;
//                 else
//                     widthOffset = destRect.width - srcRect.width;

//                 let transformation = '';

//                 switch (values.destinationPlayerNumber) {
//                     case 1:
//                         transformation = `translate(${destRect.left - srcRect.left + widthOffset / 2}px, ${destRect.top - srcRect.top - 10}px)`;
//                         break;
//                     case 2:
//                         transformation = `translate(${destRect.left - srcRect.left + widthOffset / 2}px, ${destRect.top - srcRect.top}px)`;
//                         break;
//                     case 3:
//                         transformation = `translate(${destRect.right - srcRect.right}px, ${destRect.top - srcRect.top + (destRect.bottom - destRect.top) / 8}px)`;
//                         break;
//                     case 4:
//                         transformation = `translate(${destRect.left - srcRect.left}px, ${destRect.top - srcRect.top + (destRect.bottom - destRect.top) / 8}px)`;
//                 }

//                 src.style.transform = transformation;
//                 console.log('transformation:', destRect.left, srcRect.left, transformation);
//             } else {
//                 console.error('Transformation error | Source ID: ', values?.sourceId, 
//                     'Destination ID: ', values?.destinationId,
//                     'Source Element: ', src, 
//                     'Destination Element: ', dest, 
//                     'Source Rect: ', srcRect,
//                     'Destination Rect: ', destRect);
//                 throw Error('Unable to translate card.');
//             }
//         }
//     };

//     return { setPlayElements }
// }


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

/** Effect to remove transformation for the given element IDs */
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

export function useFadeOut() {
    const [element, setElement] = useState<string>('');

    useEffect(() => {
        const ele = document.getElementById(element);
        const classList = ["transition-opacity", "delay-[3s]", "opacity-0", "ease-in-out", "duration-[2s]"];

        if (ele)
        {
            ele.classList.add(...classList);
            //ele.classList.remove(...classList);
        }
    }, [element]);

    const setElementForFadeOut = (id:string) => {
        setElement(id);
    }

    return { setElementForFadeOut };
}