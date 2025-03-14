'use client';

import { TeamColor } from '@/app/lib/euchre/definitions';
import { useCallback, useRef, useState } from 'react';

export type GameEventType = 'i' | 'e' | 'd';

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

      if (events.length > 100) {
        setEvents([...events.slice(1), event]);
      } else {
        setEvents([...events, event]);
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
