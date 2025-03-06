'use client';

import { useEffect, useState } from "react";

export interface GameEvent {
    id: string,
    delay: number,
    duration: number,
}

export function useEventLog() {
    const [events, setEvents] = useState<GameEvent[]>([]);

    const addEvent = (event: GameEvent) => {

    }

    const clearEvents = () => {

    }

    return { events, addEvent, clearEvents };
}