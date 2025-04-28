import { GameEvent } from '@/app/hooks/euchre/useEventLog';

const ENABLE_LOGGING = true;

/** Log error to console. */
const logConsole = (
  message: object | string | null | undefined,
  ...params: (object | string | number | null | undefined)[]
) => {
  if (!ENABLE_LOGGING) return;

  console.log(message, params);
};

/** Log error to console. */
function logDebugError(
  message: object | string | null | undefined,
  ...params: (object | string | null | undefined)[]
) {
  if (!ENABLE_LOGGING) return;

  const temp = message as GameEvent;

  if (temp && temp.type === 'e') {
    console.error(message, params);
  }
}

/** Create range of numbers between the given start and end. Includes both start and end value. */
function createRange(start: number, end: number): number[] {
  const result = [];

  for (let i = start; i <= end; i++) {
    result.push(i);
  }

  return result;
}

function isElementFullyVisible(element: HTMLElement, container: HTMLElement) {
  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  return (
    elementRect.top >= containerRect.top &&
    elementRect.left >= containerRect.left &&
    elementRect.bottom <= containerRect.bottom &&
    elementRect.right <= containerRect.right
  );
}

function scrollElementIntoViewIfNeeded(element: HTMLElement, container: HTMLElement) {
  if (!isElementFullyVisible(element, container)) {
    element.scrollIntoView({
      behavior: 'smooth',
      inline: 'center'
    });
  }
}

export { scrollElementIntoViewIfNeeded, isElementFullyVisible, createRange, logDebugError, logConsole };
