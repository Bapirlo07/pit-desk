/** Pure maths for placing the tutorial card next to the highlighted element. */

export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export type Placement = 'center' | 'below' | 'above' | 'right' | 'left' | 'dock-top' | 'dock-bottom';

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max));

/**
 * Prefer below the target, then above, then beside it. If none fit (e.g. a
 * tall element on a phone), dock the card to the screen edge furthest from it.
 */
export function placeCard(
  target: Rect | null,
  card: Size,
  viewport: Size,
  gap = 14,
  margin = 16,
): { top: number; left: number; placement: Placement } {
  if (!target) {
    return {
      top: Math.max(margin, (viewport.height - card.height) / 2),
      left: Math.max(margin, (viewport.width - card.width) / 2),
      placement: 'center',
    };
  }

  const bottom = target.top + target.height;
  const right = target.left + target.width;
  const alignedLeft = clamp(target.left, margin, viewport.width - card.width - margin);
  const alignedTop = clamp(target.top, margin, viewport.height - card.height - margin);

  if (bottom + gap + card.height <= viewport.height - margin) {
    return { top: bottom + gap, left: alignedLeft, placement: 'below' };
  }
  if (target.top - gap - card.height >= margin) {
    return { top: target.top - gap - card.height, left: alignedLeft, placement: 'above' };
  }
  if (right + gap + card.width <= viewport.width - margin) {
    return { top: alignedTop, left: right + gap, placement: 'right' };
  }
  if (target.left - gap - card.width >= margin) {
    return { top: alignedTop, left: target.left - gap - card.width, placement: 'left' };
  }

  const left = Math.max(margin, (viewport.width - card.width) / 2);
  const targetIsLow = target.top + target.height / 2 > viewport.height / 2;
  return targetIsLow
    ? { top: margin, left, placement: 'dock-top' }
    : { top: viewport.height - card.height - margin, left, placement: 'dock-bottom' };
}
