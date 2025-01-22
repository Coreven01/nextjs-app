'use client';

import { TileValue } from '@/app/ui/bombseeker/game-tile';
import { useState } from 'react';

type DoubleMouseEventsType = {
    shouldHandleDoubleMouseUp: boolean, 
    shouldHandleClick: boolean, 
    shouldHandleRightClick: boolean,
    handleDoubleMouseDown: () => void,
    handleDoubleMouseUp:() => void, 
    handledClick: () => void, 
    handledRightClick: () => void,
}

export default function useDoubleMouseEvents(): DoubleMouseEventsType {
    const [shouldHandleDoubleMouseUp, setShouldHandleDoubleMouseUp] = useState(false);
    const [shouldHandleClick, setShouldHandleClick] = useState(true);
    const [shouldHandleRightClick, setShouldHandleRightClick] = useState(true);

    const handleDoubleMouseDown = () => {
        setShouldHandleDoubleMouseUp(true);
        setShouldHandleClick(false);
        setShouldHandleRightClick(false);
    };

    const handleDoubleMouseUp = () => {
        setShouldHandleDoubleMouseUp(false);
    };

    const handledClick = () => {
        setShouldHandleClick(true);
    };

    const handledRightClick = () => {
        setShouldHandleRightClick(true);
    };

    return { shouldHandleDoubleMouseUp, shouldHandleClick, shouldHandleRightClick, handleDoubleMouseDown, handleDoubleMouseUp, handledClick, handledRightClick };
}

type ClickProps = {
    event: React.MouseEvent<HTMLButtonElement>,
    row: number,
    column: number,
    id: number,
    exposedMap: TileValue[][]
}