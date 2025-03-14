import { CardTransformation, useMoveCard } from '@/app/hooks/euchre/useMoveCard';
import { useRemoveTransformations } from '../../../lib/euchre/actions';
import { useFadeOut } from '@/app/hooks/euchre/useFadeOut';
import { useCallback } from 'react';
import { GameSpeed } from '@/app/lib/euchre/definitions';

export default function usePlayer4Animation() {
  const { setCardsToMove } = useMoveCard();
  const { setElementsForTransformation } = useRemoveTransformations();
  const { setElementForFadeOut } = useFadeOut();

  const setCardsToMovePlayer4 = async (transformValues: CardTransformation[]) => {
    await setCardsToMove(transformValues);
  };

  const setElementsForTransformationPlayer4 = (id: string[]) => {
    setElementsForTransformation(id);
  };

  const setElementForFadeOutPlayer4 = useCallback(
    (id: string, delay: GameSpeed, duration: GameSpeed) => {
      setElementForFadeOut(id, delay, duration);
    },
    [setElementForFadeOut]
  );

  return {
    setCardsToMovePlayer4,
    setElementsForTransformationPlayer4,
    setElementForFadeOutPlayer4
  };
}
