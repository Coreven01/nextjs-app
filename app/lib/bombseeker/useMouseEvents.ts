import { useCallback, useRef } from 'react';

type DoubleMouseEventsType = {
  shouldHandleDoubleMouseUp: boolean;
  shouldHandleMouseClick: boolean;
  shouldHandleMouseRightClick: boolean;
  onDoubleMouseDown: () => void;
  onDoubleMouseUp: () => void;
  onMouseClicked: () => void;
  onMouseRightClicked: () => void;
  resetMouseClicks: () => void;
};

/** Used to identify when the user is clicking/right-clicking/double-clicking and to
 * prevent multiple events from firing.
 */
export function useMouseEvents(): DoubleMouseEventsType {
  const shouldHandleDoubleMouseUp = useRef(false);
  const shouldHandleMouseClick = useRef(true);
  const shouldHandleMouseRightClick = useRef(true);

  const onDoubleMouseDown = useCallback(() => {
    shouldHandleDoubleMouseUp.current = true;
    shouldHandleMouseClick.current = false;
    shouldHandleMouseRightClick.current = false;
  }, []);

  const onDoubleMouseUp = useCallback(() => {
    shouldHandleDoubleMouseUp.current = false;
  }, []);

  const onMouseClicked = useCallback(() => {
    shouldHandleMouseClick.current = true;
  }, []);

  const onMouseRightClicked = useCallback(() => {
    shouldHandleMouseRightClick.current = true;
  }, []);

  const resetMouseClicks = useCallback(() => {
    shouldHandleDoubleMouseUp.current = false;
    shouldHandleMouseClick.current = true;
    shouldHandleMouseRightClick.current = true;
  }, []);

  return {
    shouldHandleDoubleMouseUp: shouldHandleDoubleMouseUp.current,
    shouldHandleMouseClick: shouldHandleMouseClick.current,
    shouldHandleMouseRightClick: shouldHandleMouseRightClick.current,
    onDoubleMouseDown,
    onDoubleMouseUp,
    onMouseClicked,
    onMouseRightClicked,
    resetMouseClicks
  };
}
