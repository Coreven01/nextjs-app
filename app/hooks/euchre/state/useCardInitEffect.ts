import { useCallback, useEffect, useRef, useState } from 'react';
import { ErrorHandlers, EuchreGameState } from '../../../lib/euchre/definitions/game-state-definitions';
import { PlayerHandState } from '../reducers/cardStateReducer';
import useAnimationCardState from '../phases/useAnimationCardState';

const useCardInitEffect = (
  state: EuchreGameState,
  errorHandlers: ErrorHandlers,
  handState: PlayerHandState | undefined,
  onResetHandState: () => void,
  onCreateHandState: () => void,
  onInitialzeCardState: () => void,
  onBeginRegroupCards: () => Promise<void>
) => {
  const { euchreGame } = state;

  const { shouldCreateHandState, shouldCreateCardState } = useAnimationCardState(state);

  const initForNewHandEffect = useRef(false);
  const [initCardStateCreated, setInitCardStateCreated] = useState(false);
  const [initForCardsRegroup, setInitForCardsRegroup] = useState(false);

  const handleResetHandState = useCallback(() => {
    const shouldRecreateHandState = handState !== undefined && handState.handId !== euchreGame.handId;

    if (shouldRecreateHandState) {
      initForNewHandEffect.current = false;
      setInitCardStateCreated(false);
      setInitForCardsRegroup(false);
      onResetHandState();
    }
  }, [euchreGame.handId, handState, onResetHandState]);

  const handleCreateHandState = useCallback(() => {
    const createHandState = shouldCreateHandState && !initForNewHandEffect.current;

    if (createHandState) {
      initForNewHandEffect.current = true;
      onCreateHandState();
    }
  }, [onCreateHandState, shouldCreateHandState]);

  const handleCreateCardState = useCallback(() => {
    const createCardState = handState !== undefined && !initCardStateCreated && shouldCreateCardState;

    if (createCardState) {
      setInitCardStateCreated(true);
      onInitialzeCardState();
    }
  }, [handState, initCardStateCreated, onInitialzeCardState, shouldCreateCardState]);

  const handleRegroupPlayerCards = useCallback(async () => {
    const beginRegroup = initCardStateCreated && !initForCardsRegroup;

    if (beginRegroup) {
      setInitForCardsRegroup(true);
      await onBeginRegroupCards();
    }
  }, [initCardStateCreated, initForCardsRegroup, onBeginRegroupCards]);

  //#region  Effect Hooks
  useEffect(() => {
    handleResetHandState();
  }, [handleResetHandState]);

  /** Set initial hand state after cards have been dealt. */
  useEffect(() => {
    handleCreateHandState();
  }, [handleCreateHandState]);

  useEffect(() => {
    handleCreateCardState();
  }, [handleCreateCardState]);

  useEffect(() => {
    handleRegroupPlayerCards();
  }, [handleRegroupPlayerCards]);

  //#endregion

  return { initCardStateCreated };
};

export default useCardInitEffect;
