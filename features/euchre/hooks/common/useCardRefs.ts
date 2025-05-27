import React from 'react';
import { RefObject, useRef } from 'react';

const useCardRefs = (cardCount: number) => {
  const cardRefs = useRef(new Map<number, RefObject<HTMLDivElement | null>>());

  if (cardRefs.current.size === 0) {
    for (let i = 0; i < cardCount; i++) {
      cardRefs.current.set(i, React.createRef<HTMLDivElement | null>());
    }
  }

  return cardRefs.current;
};

export default useCardRefs;
