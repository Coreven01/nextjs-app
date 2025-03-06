"use client";

import { RefObject, useCallback, useRef } from "react";

type DoubleMouseEventsType = {
  shouldHandleDoubleMouseUp: RefObject<boolean>;
  shouldHandleMouseClick: RefObject<boolean>;
  shouldHandleMouseRightClick: RefObject<boolean>;
  handleDoubleMouseDown: () => void;
  handleDoubleMouseUp: () => void;
  handledMouseClick: () => void;
  handledMouseRightClick: () => void;
  resetMouseClicks: () => void;
};

/** Used to identify when the user is clicking/right clicking/double clicking and to
 * prevent multiple events from firing.
 */
export function useMouseEvents(): DoubleMouseEventsType {
  const shouldHandleDoubleMouseUp = useRef(false);
  const shouldHandleMouseClick = useRef(true);
  const shouldHandleMouseRightClick = useRef(true);

  const handleDoubleMouseDown = useCallback(() => {
    shouldHandleDoubleMouseUp.current = true;
    shouldHandleMouseClick.current = false;
    shouldHandleMouseRightClick.current = false;
  }, []);

  const handleDoubleMouseUp = useCallback(() => {
    shouldHandleDoubleMouseUp.current = false;
  }, []);

  const handledMouseClick = useCallback(() => {
    shouldHandleMouseClick.current = true;
  }, []);

  const handledMouseRightClick = useCallback(() => {
    shouldHandleMouseRightClick.current = true;
  }, []);

  const resetMouseClicks = useCallback(() => {
    shouldHandleDoubleMouseUp.current = false;
    shouldHandleMouseClick.current = true;
    shouldHandleMouseRightClick.current = true;
  }, []);

  return {
    shouldHandleDoubleMouseUp,
    shouldHandleMouseClick,
    shouldHandleMouseRightClick,
    handleDoubleMouseDown,
    handleDoubleMouseUp,
    handledMouseClick,
    handledMouseRightClick,
    resetMouseClicks,
  };
}
