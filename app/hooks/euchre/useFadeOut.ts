'use client';

import { useCallback, useEffect, useState } from 'react';
import { GameSpeed } from '../../lib/euchre/definitions/definitions';

export interface FadeOutProps {
  id: string;
  delay: number;
  duration: number;
}

const durationValues = [
  'duration-300',
  'duration-700',
  'duration-1000',
  'duration-1500',
  'duration-3000',
  'duration-4000'
];
const delayValues = ['delay-300', 'delay-700', 'delay-1000', 'delay-1500', 'delay-3000', 'delay-4000'];
const classList = ['transition-opacity', 'ease-in-out'];

export function useFadeOut() {
  const [fadeOutElementId, setFadeOutElement] = useState<string>('');
  const [fadeOutDelay, setFadeOutDelay] = useState<GameSpeed>(1000);
  const [fadeOutDuration, setFadeOutDuration] = useState<GameSpeed>(1000);

  useEffect(() => {
    if (!fadeOutElementId) return;

    const e = document.getElementById(fadeOutElementId);

    if (e) {
      classList.push(`delay-${fadeOutDelay}`);
      classList.push(`duration-${fadeOutDuration}`);
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

  const setElementForFadeOut = useCallback((id: string, delay: GameSpeed, duration: GameSpeed) => {
    setFadeOutDelay(delay);
    setFadeOutDuration(duration);
    setFadeOutElement(id);

    //console.log('Add element for fade out: ', id, delay, duration);
  }, []);

  return { setElementForFadeOut };
}
