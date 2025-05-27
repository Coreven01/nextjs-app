import useCardAnimationPhase from '../../../../app/hooks/euchre/phases/useCardAnimationPhase';
import getEffectForInitHandState from '../../util/play/cardStateInitializeUtil';
import getEffectForPlayHandState from '../../util/play/cardStatePlayUtil';
import {
  EuchreGameState,
  HandState,
  HandStateEffect,
  InitHandHandlers,
  PlayHandHandlers
} from '../../definitions/game-state-definitions';

const useCardStateEffect = (
  state: EuchreGameState,
  handState: HandState | undefined,
  currentTrickId: string,
  cardRefsReady: boolean,
  initHandler: InitHandHandlers,
  playHandHandlers: PlayHandHandlers
) => {
  const { getHandPhase, resetForNewHand, addPhaseCompleted, addPhaseHandled } = useCardAnimationPhase(
    state,
    handState,
    cardRefsReady
  );

  /** Get the function that should be executed for the effect for the current deck state. */
  const getEffectForHandState = (): HandStateEffect => {
    const initEffect = getEffectForInitHandState(
      getHandPhase,
      resetForNewHand,
      addPhaseHandled,
      addPhaseCompleted,
      initHandler,
      handState?.handId ?? ''
    );

    if (initEffect.func) return initEffect;

    const playHandEffect = getEffectForPlayHandState(
      getHandPhase,
      addPhaseHandled,
      addPhaseCompleted,
      playHandHandlers,
      handState?.handId ?? '',
      currentTrickId
    );

    if (playHandEffect.func) return playHandEffect;

    return {};
  };

  return { getEffectForHandState };
};

export default useCardStateEffect;
