import { CardTransformation, useMoveCard } from '@/app/hooks/euchre/useMoveCard';
import { useRemoveTransformations } from '../../../lib/euchre/actions';
import { useFadeOut } from '@/app/hooks/euchre/useFadeOut';
import { useCallback } from 'react';

export default function usePlayer1Animation() {
  const { setCardsToMove } = useMoveCard();
  const { setElementsForTransformation } = useRemoveTransformations();
  const { setElementForFadeOut } = useFadeOut();

  const setCardsToMovePlayer1 = useCallback(
    async (transformValues: CardTransformation[]) => {
      await setCardsToMove(transformValues);
    },
    [setCardsToMove]
  );

  const setElementsForTransformationPlayer1 = (id: string[]) => {
    setElementsForTransformation(id);
  };

  const setElementForFadeOutPlayer1 = useCallback(
    (id: string, delay: 0 | 1 | 2 | 3 | 4 | 5, duration: 0 | 1 | 2 | 3 | 4 | 5) => {
      setElementForFadeOut(id, delay, duration);
    },
    [setElementForFadeOut]
  );

  return {
    setCardsToMovePlayer1,
    setElementsForTransformationPlayer1,
    setElementForFadeOutPlayer1
  };
}
