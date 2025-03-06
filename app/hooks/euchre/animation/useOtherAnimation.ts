import { CardTransformation, useMoveCard } from '@/app/hooks/euchre/useMoveCard';
import { useRemoveTransformations } from '../../../lib/euchre/actions';
import { useFadeOut } from '@/app/hooks/euchre/useFadeOut';
import { useCallback } from 'react';

export default function useOtherAnimation() {
  const { setCardsToMove } = useMoveCard();
  const { setElementsForTransformation } = useRemoveTransformations();
  const { setElementForFadeOut } = useFadeOut();

  const setCardsToMoveOther = async (transformValues: CardTransformation[]) => {
    await setCardsToMove(transformValues);
  };

  const setElementsForTransformationOther = (id: string[]) => {
    setElementsForTransformation(id);
  };

  const setElementForFadeOutOther = useCallback(
    (id: string, delay: 0 | 1 | 2 | 3 | 4 | 5, duration: 0 | 1 | 2 | 3 | 4 | 5) => {
      setElementForFadeOut(id, delay, duration);
    },
    [setElementForFadeOut]
  );

  return {
    setCardsToMoveOther,
    setElementsForTransformationOther,
    setElementForFadeOutOther
  };
}
