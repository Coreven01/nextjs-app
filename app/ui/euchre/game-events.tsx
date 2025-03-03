'use client';

import { RefObject, useRef } from "react";
import Draggable, { DraggableEvent } from "react-draggable";


export default function GameEvents() {

    const draggableRef: RefObject<HTMLDivElement> = (useRef(null) as unknown) as React.RefObject<HTMLDivElement>;

    const handleDrag = (e: DraggableEvent, data: object) => {
      console.log('dragging:', data);
    };
    
    return <Draggable grid={[25, 25]} defaultPosition={{ x: 25, y: 25 }} defaultClassName="absolute z-20" nodeRef={draggableRef} onDrag={handleDrag}>
        <div ref={draggableRef} className="cursor-move flex max-h-64">

            <div style={{ overflow: 'scroll' }}>
                <div style={{ background: 'yellow', whiteSpace: 'pre-wrap' }}>
                    I have long scrollable content with a handle
                    {'\n' + Array(100).fill('x').join('\n')}
                </div>
            </div>
        </div>
    </Draggable>
}


