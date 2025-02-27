import { useRemoveTransformations } from "../actions";
import { useFadeOut } from "../useFadeOut";
import { CardTransformation, useMoveCard } from "../useMoveCard";

export default function usePlayer2Animation() {
    const { setCardsToMove } = useMoveCard();
    const { setElementsForTransformation } = useRemoveTransformations();
    const { setElementForFadeOut } = useFadeOut();

    const setCardsToMovePlayer2 = async (transformValues: CardTransformation[]) => {
        await setCardsToMove(transformValues);
    }

    const setElementsForTransformationPlayer2 = (id: string[]) => {
        setElementsForTransformation(id);
    }

    const setElementForFadeOutPlayer2 = (id: string, delay: 0 | 1 | 2 | 3 | 4 | 5, duration: 0 | 1 | 2 | 3 | 4 | 5) => {
        setElementForFadeOut(id, delay, duration);
    }

    return { setCardsToMovePlayer2, setElementsForTransformationPlayer2, setElementForFadeOutPlayer2 };
}

