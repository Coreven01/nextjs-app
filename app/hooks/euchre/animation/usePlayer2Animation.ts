import { CardTransformation, useMoveCard } from '@/app/hooks/euchre/useMoveCard';
import { useRemoveTransformations } from '../../../lib/euchre/actions';
import { useFadeOut } from '@/app/hooks/euchre/useFadeOut';
import { useCallback } from 'react';
import { GameSpeed } from '@/app/lib/euchre/definitions';

export default function usePlayer2Animation() {
  const { setCardsToMove } = useMoveCard();
  const { setElementsForTransformation } = useRemoveTransformations();
  const { setElementForFadeOut } = useFadeOut();

  const setCardsToMovePlayer2 = async (transformValues: CardTransformation[]) => {
    await setCardsToMove(transformValues);
  };

  const setElementsForTransformationPlayer2 = (id: string[]) => {
    setElementsForTransformation(id);
  };

  const setElementForFadeOutPlayer2 = useCallback(
    (id: string, delay: GameSpeed, duration: GameSpeed) => {
      setElementForFadeOut(id, delay, duration);
    },
    [setElementForFadeOut]
  );

  return {
    setCardsToMovePlayer2,
    setElementsForTransformationPlayer2,
    setElementForFadeOutPlayer2
  };
}
