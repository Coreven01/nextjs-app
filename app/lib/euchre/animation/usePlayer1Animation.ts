import { useRemoveTransformations } from "../actions";
import { useFadeOut } from "../useFadeOut";
import { CardTransformation, useMoveCard } from "../useMoveCard";

export default function usePlayer1Animation() {
    const { setCardsToMove } = useMoveCard();
    const { setElementsForTransformation } = useRemoveTransformations();
    const { setElementForFadeOut } = useFadeOut();

    const setCardsToMovePlayer1 = async (transformValues: CardTransformation[]) => {
        await setCardsToMove(transformValues);
    }

    const setElementsForTransformationPlayer1 = (id: string[]) => {
        setElementsForTransformation(id);
    }

    const setElementForFadeOutPlayer1 = (id: string, delay: 0 | 1 | 2 | 3 | 4 | 5, duration: 0 | 1 | 2 | 3 | 4 | 5) => {
        setElementForFadeOut(id, delay, duration);
    }

    return { setCardsToMovePlayer1, setElementsForTransformationPlayer1, setElementForFadeOutPlayer1 };
}

