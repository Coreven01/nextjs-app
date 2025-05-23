'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type TimerEventType = {
  time: number;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
};

export function useTimer(): TimerEventType {
  const [time, setTime] = useState<number>(0); // Tracks the elapsed time
  const [isRunning, setIsRunning] = useState(false); // Tracks if the timer is running
  const intervalId = useRef<NodeJS.Timeout | undefined>(undefined); // Holds the interval ID for cleanup

  useEffect(() => {
    // Cleanup interval on unmount
    const tempId = intervalId.current;

    return () => {
      if (tempId) {
        clearInterval(tempId);
      }
    };
  }, [intervalId]);

  const startTimer = useCallback(() => {
    if (isRunning) return; // Prevent starting if already running

    // Create a new interval to update the time every second
    intervalId.current = setInterval(() => {
      setTime((prevTime) => {
        if (prevTime < 1000) return prevTime + 1;
        else return prevTime;
      }); // Increment time every second
    }, 1000);
    setIsRunning(true); // Set running state to true
  }, [isRunning]);

  const pauseTimer = useCallback(() => {
    if (!isRunning) return; // Prevent pausing if it's already paused

    clearInterval(intervalId.current); // Clear the interval to stop updating time
    setIsRunning(false); // Set running state to false
  }, [isRunning, intervalId]);

  const resetTimer = useCallback(() => {
    clearInterval(intervalId.current); // Clear the current interval
    setTime(0); // Reset time to 0
    setIsRunning(false); // Set running state to false
  }, [intervalId]);

  return { time, startTimer, pauseTimer, resetTimer };
}
