import { useAnimation } from 'framer-motion';
import { useMemo } from 'react';

const useCardAnimationControls = () => {
  const c0 = useAnimation();
  const c1 = useAnimation();
  const c2 = useAnimation();
  const c3 = useAnimation();
  const c4 = useAnimation();

  const animationControlsArray = useMemo(() => [c0, c1, c2, c3, c4], [c0, c1, c2, c3, c4]);

  return animationControlsArray;
};

export default useCardAnimationControls;
