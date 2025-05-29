import { useAnimation } from 'framer-motion';
import { useMemo } from 'react';

const useDeckAnimationControls = () => {
  const c0 = useAnimation();
  const c1 = useAnimation();
  const c2 = useAnimation();
  const c3 = useAnimation();
  const c4 = useAnimation();

  const c5 = useAnimation();
  const c6 = useAnimation();
  const c7 = useAnimation();
  const c8 = useAnimation();
  const c9 = useAnimation();

  const c10 = useAnimation();
  const c11 = useAnimation();
  const c12 = useAnimation();
  const c13 = useAnimation();
  const c14 = useAnimation();

  const c15 = useAnimation();
  const c16 = useAnimation();
  const c17 = useAnimation();
  const c18 = useAnimation();
  const c19 = useAnimation();

  const c20 = useAnimation();
  const c21 = useAnimation();
  const c22 = useAnimation();
  const c23 = useAnimation();

  const animationControlsArray = useMemo(
    () => [
      c0,
      c1,
      c2,
      c3,
      c4,
      c5,
      c6,
      c7,
      c8,
      c9,
      c10,
      c11,
      c12,
      c13,
      c14,
      c15,
      c16,
      c17,
      c18,
      c19,
      c20,
      c21,
      c22,
      c23
    ],
    [
      c0,
      c1,
      c10,
      c11,
      c12,
      c13,
      c14,
      c15,
      c16,
      c17,
      c18,
      c19,
      c2,
      c20,
      c21,
      c22,
      c23,
      c3,
      c4,
      c5,
      c6,
      c7,
      c8,
      c9
    ]
  );

  return animationControlsArray;
};

export default useDeckAnimationControls;
