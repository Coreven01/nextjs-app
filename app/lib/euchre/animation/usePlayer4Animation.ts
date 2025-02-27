import { useRemoveTransformations } from "../actions";
import { useFadeOut } from "../useFadeOut";
import { CardTransformation, useMoveCard } from "../useMoveCard";

export default function usePlayer4Animation() {
    const { setCardsToMove } = useMoveCard();
    const { setElementsForTransformation } = useRemoveTransformations();
    const { setElementForFadeOut } = useFadeOut();

    const setCardsToMovePlayer4 = async (transformValues: CardTransformation[]) => {
        await setCardsToMove(transformValues);
    }

    const setElementsForTransformationPlayer4 = (id: string[]) => {
        setElementsForTransformation(id);
    }

    const setElementForFadeOutPlayer4 = (id: string, delay: 0 | 1 | 2 | 3 | 4 | 5, duration: 0 | 1 | 2 | 3 | 4 | 5) => {
        setElementForFadeOut(id, delay, duration);
    }

    return { setCardsToMovePlayer4, setElementsForTransformationPlayer4, setElementForFadeOutPlayer4 };
}

