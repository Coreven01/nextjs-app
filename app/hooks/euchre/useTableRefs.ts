import React from 'react';
import { RefObject, useRef } from 'react';

const useTableRef = (playerCount: number) => {
  const tableRefs = useRef(new Map<number, RefObject<HTMLDivElement | null>>());

  if (tableRefs.current.size === 0) {
    for (let i = 1; i <= playerCount; i++) {
      // maps player number to ref element. player number starts a 1.
      tableRefs.current.set(i, React.createRef<HTMLDivElement | null>());
    }
  }

  return tableRefs.current;
};

export default useTableRef;
