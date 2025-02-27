import { useRemoveTransformations } from "../actions";
import { useFadeOut } from "../useFadeOut";
import { CardTransformation, useMoveCard } from "../useMoveCard";

export default function useOtherAnimation() {
    const { setCardsToMove } = useMoveCard();
    const { setElementsForTransformation } = useRemoveTransformations();
    const { setElementForFadeOut } = useFadeOut();

    const setCardsToMoveOther = async (transformValues: CardTransformation[]) => {
        await setCardsToMove(transformValues);
    }

    const setElementsForTransformationOther = (id: string[]) => {
        setElementsForTransformation(id);
    }

    const setElementForFadeOutOther = (id: string, delay: 0 | 1 | 2 | 3 | 4 | 5, duration: 0 | 1 | 2 | 3 | 4 | 5) => {
        setElementForFadeOut(id, delay, duration);
    }

    return { setCardsToMoveOther, setElementsForTransformationOther, setElementForFadeOutOther };
}

