'use client';

import { useCallback, useState } from 'react';

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
export function useMouseEvents(): DoubleMouseEventsType {
    const [shouldHandleDoubleMouseUp, setShouldHandleDoubleMouseUp] = useState(false);
    const [shouldHandleMouseClick, setShouldHandleClick] = useState(true);
    const [shouldHandleMouseRightClick, setShouldHandleRightClick] = useState(true);

    const handleDoubleMouseDown = useCallback(() => {
        setShouldHandleDoubleMouseUp(true);
        setShouldHandleClick(false);
        setShouldHandleRightClick(false);
    }, []);

    const handleDoubleMouseUp = useCallback(() => {
        setShouldHandleDoubleMouseUp(false);
    }, []);

    const handledMouseClick = useCallback(() => {
        setShouldHandleClick(true);
    }, []);

    const handledMouseRightClick = useCallback(() => {
        setShouldHandleRightClick(true);
    }, []);

    const resetMouseClicks = useCallback(() => {
        setShouldHandleDoubleMouseUp(false);
        setShouldHandleClick(true);
        setShouldHandleRightClick(true);
    }, []);

    return {
        shouldHandleDoubleMouseUp,
        shouldHandleMouseClick,
        shouldHandleMouseRightClick,
        handleDoubleMouseDown,
        handleDoubleMouseUp,
        handledMouseClick,
        handledMouseRightClick,
        resetMouseClicks
    };
}