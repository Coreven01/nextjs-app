import {
  EuchreGameValues,
  EuchreGameSetters,
  ErrorHandlers
} from '../../../../features/euchre/definitions/game-state-definitions';
import { isGameStateValidToContinue } from '../../../../features/euchre/util/game/gameStateLogicUtil';
import {
  EuchreAnimateType,
  EuchreAnimationActionType
} from '../../../../features/euchre/state/reducers/gameAnimationFlowReducer';
import { EuchreGameFlow } from '../../../../features/euchre/state/reducers/gameFlowReducer';
import { EuchrePauseActionType } from '../../../../features/euchre/state/reducers/gamePauseReducer';

const useGameInitState = (state: EuchreGameValues, setters: EuchreGameSetters, handlers: ErrorHandlers) => {
  const shouldBeginIntro = isGameStateValidToContinue(
    state,
    EuchreGameFlow.BEGIN_INTRO,
    EuchreAnimateType.ANIMATE,
    state.shouldCancel,
    handlers.onCancel
  );

  const continueToBeginDealCardsForDealer = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.BEGIN_DEAL_FOR_DEALER,
      EuchreAnimationActionType.SET_NONE,
      EuchrePauseActionType.SET_NONE
    );
  };

  return { shouldBeginIntro, continueToBeginDealCardsForDealer };
};

export default useGameInitState;
