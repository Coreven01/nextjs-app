'use client';

import { TeamColor } from '@/app/lib/euchre/definitions';
import { useCallback, useRef, useState } from 'react';

/** Information, Warn, Error, Debug, Verbose */
export type GameEventType = 'i' | 'w' | 'e' | 'd' | 'v';

export interface GameEvent {
  id: number;
  type: GameEventType;
  time: string;
  message?: string;
  player?: string;
  team?: number;
  teamColor?: TeamColor;
}

export function useEventLog() {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const counter = useRef(0);

  const addEvent = useCallback(
    (event: GameEvent) => {
      event.id = counter.current;
      counter.current++;

      if (events.length > 200) {
        setEvents((prev) => [...prev.slice(1), event]);
      } else {
        setEvents((prev) => [...prev, event]);
      }
    },
    [events]
  );

  const clearEvents = useCallback(() => {
    counter.current = 0;
    setEvents([]);
  }, []);

  return { events, addEvent, clearEvents };
}
