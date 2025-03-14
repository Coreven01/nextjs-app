import { CardTransformation, useMoveCard } from '@/app/hooks/euchre/useMoveCard';
import { useRemoveTransformations } from '../../../lib/euchre/actions';
import { useFadeOut } from '@/app/hooks/euchre/useFadeOut';
import { useCallback } from 'react';
import { GameSpeed } from '@/app/lib/euchre/definitions';

export default function usePlayer3Animation() {
  const { setCardsToMove } = useMoveCard();
  const { setElementsForTransformation } = useRemoveTransformations();
  const { setElementForFadeOut } = useFadeOut();

  const setCardsToMovePlayer3 = async (transformValues: CardTransformation[]) => {
    await setCardsToMove(transformValues);
  };

  const setElementsForTransformationPlayer3 = (id: string[]) => {
    setElementsForTransformation(id);
  };

  const setElementForFadeOutPlayer3 = useCallback(
    (id: string, delay: GameSpeed, duration: GameSpeed) => {
      setElementForFadeOut(id, delay, duration);
    },
    [setElementForFadeOut]
  );

  return {
    setCardsToMovePlayer3,
    setElementsForTransformationPlayer3,
    setElementForFadeOutPlayer3
  };
}
