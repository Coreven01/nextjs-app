import React from 'react';
import { RefObject, useRef } from 'react';
import { TableLocation } from '../../lib/euchre/definitions/definitions';

const useTableRef = () => {
  const tableRefs = useRef(new Map<TableLocation, RefObject<HTMLDivElement | null>>());
  const locations: TableLocation[] = ['bottom', 'top', 'left', 'right'];
  if (tableRefs.current.size === 0) {
    for (let i = 0; i < 4; i++) {
      // maps player number to ref element. player number starts a 1.
      tableRefs.current.set(locations[i], React.createRef<HTMLDivElement | null>());
    }
  }

  return tableRefs.current;
};

export default useTableRef;
