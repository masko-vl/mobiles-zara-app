import { useCallback, useRef, useState } from 'react';
import type {
  DragEvent as ReactDragEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from 'react';

/** Pointer travel below this distance still counts as a click on the cards. */
const DRAG_THRESHOLD_PX = 5;

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  startScrollLeft: number;
  startScrollTop: number;
  /** Travelled beyond the threshold: this interaction is a drag. */
  moved: boolean;
}

/**
 * Drag-to-scroll for a horizontally scrollable container (mouse only —
 * touch devices already scroll natively).
 *
 * Design notes:
 * - Everything that changes during the drag lives in refs: pointermove only
 *   writes scrollLeft on the DOM node, so a drag renders nothing per frame.
 *   isDragging is the sole state, driving cursor/user-select styles — two
 *   renders per interaction (start, end), never during movement.
 * - setPointerCapture is taken only once the drag exceeds the threshold,
 *   NOT on pointerdown: capture retargets the browser-generated click to
 *   the container, which would break card navigation on plain clicks.
 *   Capturing after the threshold keeps the drag alive outside the
 *   container while leaving clicks untouched.
 * - preventDefault on pointerdown cancels the compatibility mousedown: text
 *   selection and native image dragging never start. The click activation
 *   behavior of the cards is unaffected (click fires even when pointerdown
 *   is canceled, per the Pointer Events spec).
 * - The drag ends via pointerup/pointercancel only. After a real drag the
 *   browser's click is swallowed once (capture phase); a timeout clears the
 *   flag so that, when no click follows (release outside), the next legit
 *   click is not eaten.
 */
export function useDragToScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null) as RefObject<T>;
  const drag = useRef<DragState | null>(null);
  const suppressClick = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const onPointerDown = useCallback((event: ReactPointerEvent<T>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    const list = ref.current;
    if (!list) return;
    event.preventDefault();

    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: list.scrollLeft,
      startScrollTop: list.scrollTop,
      moved: false,
    };
    suppressClick.current = false;
    setIsDragging(true);
  }, []);

  const onPointerMove = useCallback((event: ReactPointerEvent<T>) => {
    const state = drag.current;
    const list = ref.current;
    // Guard on the pointer id: stray moves from other pointers are ignored.
    if (!state || !list || state.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - state.startX;

    if (!state.moved && Math.abs(deltaX) > DRAG_THRESHOLD_PX) {
      state.moved = true;
      // Capture only once drag intent is clear, never on pointerdown:
      // capture retargets the browser-generated click to this container,
      // which would stop plain clicks from opening the cards.
      try {
        list.setPointerCapture(event.pointerId);
      } catch {
        /* synthetic events carry no active pointer; dragging still works */
      }
    }
    list.scrollLeft = state.startScrollLeft - deltaX;
  }, []);

  const endDrag = useCallback((event: ReactPointerEvent<T>) => {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) return;
    if (state.moved) {
      // The browser fires a click right after pointerup; swallow it once.
      // The timeout clears the flag when no click follows (release outside),
      // so a later legit click is never eaten.
      suppressClick.current = true;
      setTimeout(() => {
        suppressClick.current = false;
      }, 0);
    }

    drag.current = null;
    setIsDragging(false);
  }, []);

  const onClickCapture = useCallback((event: ReactMouseEvent<T>) => {
    if (suppressClick.current) {
      // A drag is not a click: swallow it so the cards do not navigate.
      event.preventDefault();
      event.stopPropagation();
      suppressClick.current = false;
    }
  }, []);

  const onDragStart = useCallback((event: ReactDragEvent<T>) => {
    // Defense in depth against native <img> ghost drags inside the strip.
    event.preventDefault();
  }, []);

  return {
    ref,
    isDragging,
    dragHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onClickCapture,
      onDragStart,
    },
  };
}
