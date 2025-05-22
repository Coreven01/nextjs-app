import { useRef, useState } from 'react';
import { HandPhase } from '../phases/useCardAnimationPhase';

const getPhaseKey = (phase: HandPhase) => `${phase.phase}__${phase.action}` as const;

const useCardAnimationPhaseState = () => {
  const [idsCompletedForAction, setIdCompletedForAction] = useState(new Map<string, string[]>());
  const idsHandledForAction = useRef<Map<string, string[]>>(new Map<string, string[]>());

  const addPhaseHandled = (phase: HandPhase, id: string) => {
    const currentValues: string[] = idsHandledForAction.current.get(getPhaseKey(phase)) ?? [];
    currentValues.push(id);
    idsHandledForAction.current.set(getPhaseKey(phase), currentValues);
  };

  const hasIdBeenHandledForPhase = (phase: HandPhase, id: string) => {
    const currentValues: string[] | undefined = idsHandledForAction.current.get(getPhaseKey(phase));
    if (!currentValues) return false;
    return currentValues.includes(id);
  };

  const addPhaseCompleted = (phase: HandPhase, id: string) => {
    setIdCompletedForAction((prev) => {
      const newState = new Map<string, string[]>(prev);
      const currentValues: string[] = newState.get(getPhaseKey(phase)) ?? [];
      currentValues.push(id);
      newState.set(getPhaseKey(phase), currentValues);
      return newState;
    });
  };

  //   const removePhaseExecuted = (phase: HandPhase) => {
  //     idsHandledForAction.current.delete(getPhaseKey(phase));
  //   };

  //   const removePhaseCompleted = (phase: HandPhase) => {
  //     setIdCompletedForAction((prev) => {
  //       const newState = new Map<string, string[]>(prev);
  //       newState.set(getPhaseKey(phase), []);
  //       return newState;
  //     });
  //   };

  const hasPhaseCompleted = (phase: HandPhase, id: string) => {
    const currentValues: string[] | undefined = idsCompletedForAction.get(getPhaseKey(phase));
    if (!currentValues) return false;
    return currentValues.includes(id);
  };

  const clearStateValues = () => {
    idsHandledForAction.current.clear();

    setIdCompletedForAction(() => {
      const newState = new Map<string, string[]>();
      return newState;
    });
  };

  return {
    addPhaseHandled,
    addPhaseCompleted,
    hasIdBeenHandledForPhase,
    hasPhaseCompleted,
    clearStateValues
  };
};

export default useCardAnimationPhaseState;
