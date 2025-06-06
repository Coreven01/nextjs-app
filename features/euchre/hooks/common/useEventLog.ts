import { useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TeamColor, Card } from '../../definitions/definitions';
import { EuchrePlayer } from '../../definitions/game-state-definitions';

/** Information, Warn, Error, Debug, Verbose */
export type GameEventType = 'i' | 'w' | 'e' | 'd' | 'v';
export const SUB_CARD: string = '[[C]]';
export const SUB_SUIT: string = '[[S]]';

export interface GameEvent {
  id: string;
  type: GameEventType;
  time: string;
  message?: string;
  player?: string;
  team?: number;
  teamColor?: TeamColor;
  cards?: Card[];
}

export interface GameEventHandlers {
  addEvent: (event: GameEvent) => void;
  clearEvents: () => void;
  createEvent: (
    type: GameEventType,
    player?: EuchrePlayer,
    message?: string,
    cards?: Card[],
    teamColor?: TeamColor
  ) => GameEvent;
}

export function useEventLog() {
  const [events, setEvents] = useState<GameEvent[]>([]);

  const addEvent = useCallback(
    (event: GameEvent) => {
      if (events.length > 200) {
        setEvents((prev) => [...prev.slice(1), event]);
      } else {
        setEvents((prev) => [...prev, event]);
      }
    },
    [events]
  );

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  const createEvent = (
    type: GameEventType,
    player?: EuchrePlayer,
    message?: string,
    cards?: Card[],
    teamColor?: TeamColor
  ): GameEvent => {
    return {
      id: uuidv4(),
      time: new Date().toLocaleTimeString(),
      type: type,
      message: message,
      player: player?.name,
      team: player?.team,
      teamColor: teamColor,
      cards: cards
    };
  };

  return { events, addEvent, clearEvents, createEvent };
}
