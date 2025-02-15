'use client';

import { useState, useEffect } from 'react';

type DoubleMouseEventsType = {
    shouldHandleDoubleMouseUp: boolean,
    shouldHandleMouseClick: boolean,
    shouldHandleMouseRightClick: boolean,
    handleDoubleMouseDown: () => void,
    handleDoubleMouseUp: () => void,
    handledMouseClick: () => void,
    handledMouseRightClick: () => void,
    resetMouseClicks: () => void,
}

/** Used to identify when the user is clicking/right clicking/double clicking and to 
 * prevent multiple events from firing.
 */
export function useDoubleMouseEvents(): DoubleMouseEventsType {
    const [shouldHandleDoubleMouseUp, setShouldHandleDoubleMouseUp] = useState(false);
    const [shouldHandleMouseClick, setShouldHandleClick] = useState(true);
    const [shouldHandleMouseRightClick, setShouldHandleRightClick] = useState(true);

    const handleDoubleMouseDown = () => {
        setShouldHandleDoubleMouseUp(true);
        setShouldHandleClick(false);
        setShouldHandleRightClick(false);
    };

    const handleDoubleMouseUp = () => {
        setShouldHandleDoubleMouseUp(false);
    };

    const handledMouseClick = () => {
        setShouldHandleClick(true);
    };

    const handledMouseRightClick = () => {
        setShouldHandleRightClick(true);
    };

    const resetMouseClicks = () => {
        setShouldHandleDoubleMouseUp(false);
        setShouldHandleClick(true);
        setShouldHandleRightClick(true);
    }

    return {
        shouldHandleDoubleMouseUp, shouldHandleMouseClick, shouldHandleMouseRightClick, handleDoubleMouseDown,
        handleDoubleMouseUp, handledMouseClick, handledMouseRightClick, resetMouseClicks
    };
}

type TimerEventType = {
    time: number,
    startTimer: () => void,
    pauseTimer: () => void,
    resetTimer: () => void,
}

export function useTimer(): TimerEventType {

    const [time, setTime] = useState<number>(0); // Tracks the elapsed time
    const [isRunning, setIsRunning] = useState(false); // Tracks if the timer is running
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | undefined>(undefined); // Holds the interval ID for cleanup

    useEffect(() => {
        // Cleanup interval on unmount
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [intervalId]);

    const startTimer = () => {

        if (isRunning) return; // Prevent starting if already running

        // Create a new interval to update the time every second
        const newIntervalId = setInterval(() => {
            setTime((prevTime) => {
                if (prevTime < 1000)
                    return prevTime + 1
                else 
                    return prevTime;
                }); // Increment time every second
        }, 1000);
        setIntervalId(newIntervalId); // Store interval ID
        setIsRunning(true); // Set running state to true
    };

    const pauseTimer = () => {
        if (!isRunning) return; // Prevent pausing if it's already paused

        clearInterval(intervalId); // Clear the interval to stop updating time
        setIsRunning(false); // Set running state to false
    };

    const resetTimer = () => {
        clearInterval(intervalId); // Clear the current interval
        setTime(0); // Reset time to 0
        setIsRunning(false); // Set running state to false
    }

    return { time, startTimer, pauseTimer, resetTimer }
}