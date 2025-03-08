'use client';

import { useCallback, useEffect, useState } from 'react';

export interface FadeOutProps {
  id: string;
  delay: number;
  duration: number;
}

const delayVals: Map<number, string> = new Map<number, string>([
  [0.5, 'delay-[0.5s]'],
  [1, 'delay-[1s]'],
  [2, 'delay-[2s]'],
  [3, 'delay-[3s]'],
  [4, 'delay-[4s]'],
  [5, 'delay-[5s]']
]);

const durationVal: Map<number, string> = new Map<number, string>([
  [0.5, 'duration-[0.5s]'],
  [1, 'duration-[1s]'],
  [2, 'duration-[2s]'],
  [3, 'duration-[3s]'],
  [4, 'duration-[4s]'],
  [5, 'duration-[5s]']
]);
const classList = ['transition-opacity', 'ease-in-out'];

export function useFadeOut() {
  const [fadeOutElementId, setFadeOutElement] = useState<string>('');
  const [fadeOutDelay, setFadeOutDelay] = useState<number>(2);
  const [fadeOutDuration, setFadeOutDuration] = useState<number>(2);

  useEffect(() => {
    if (!fadeOutElementId) return;

    const e = document.getElementById(fadeOutElementId);

    if (e) {
      if (fadeOutDelay > 0) classList.push(delayVals.get(fadeOutDelay) ?? '');

      if (fadeOutDuration > 0) classList.push(durationVal.get(fadeOutDuration) ?? '');

      e.classList.remove('opacity-0');

      setTimeout(() => {
        e.classList.add(...classList);
        e.classList.add('opacity-0');
      }, 15);

      const totalDuration = fadeOutDelay + fadeOutDuration;

      if (totalDuration > 0)
        setTimeout(() => {
          e.classList.remove(...classList);
        }, totalDuration * 1000);

      console.log(`Fade out triggered: ${fadeOutElementId}`, e);
    } else {
      //console.log(`Fade out element not found ${fadeOutElementId}`, e);
    }
  }, [fadeOutElementId, fadeOutDelay, fadeOutDuration]);

  const setElementForFadeOut = useCallback((id: string, delay: number, duration: number) => {
    setFadeOutDelay(delay);
    setFadeOutDuration(duration);
    setFadeOutElement(id);

    //console.log('Add element for fade out: ', id, delay, duration);
  }, []);

  return { setElementForFadeOut };
}
