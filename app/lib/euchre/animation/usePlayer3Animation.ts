import { useRemoveTransformations } from "../actions";
import { useFadeOut } from "../useFadeOut";
import { CardTransformation, useMoveCard } from "../useMoveCard";

export default function usePlayer3Animation() {
    const { setCardsToMove } = useMoveCard();
    const { setElementsForTransformation } = useRemoveTransformations();
    const { setElementForFadeOut } = useFadeOut();

    const setCardsToMovePlayer3 = async (transformValues: CardTransformation[]) => {
        await setCardsToMove(transformValues);
    }

    const setElementsForTransformationPlayer3 = (id: string[]) => {
        setElementsForTransformation(id);
    }

    const setElementForFadeOutPlayer3 = (id: string, delay: 0 | 1 | 2 | 3 | 4 | 5, duration: 0 | 1 | 2 | 3 | 4 | 5) => {
        setElementForFadeOut(id, delay, duration);
    }

    return { setCardsToMovePlayer3, setElementsForTransformationPlayer3, setElementForFadeOutPlayer3 };
}

