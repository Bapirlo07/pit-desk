import { describe, expect, it } from 'vitest';
import { placeCard } from '../position';
import { TUTORIAL_STEPS } from '../steps';

const viewport = { width: 1280, height: 800 };
const card = { width: 360, height: 200 };

describe('placeCard', () => {
  it('centres the card when there is no target', () => {
    expect(placeCard(null, card, viewport)).toEqual({ top: 300, left: 460, placement: 'center' });
  });

  it('puts the card below a target near the top', () => {
    const r = placeCard({ top: 20, left: 900, width: 150, height: 40 }, card, viewport);
    expect(r.placement).toBe('below');
    expect(r.top).toBe(74);
    expect(r.left).toBe(900);
  });

  it('keeps the card on screen horizontally', () => {
    const r = placeCard({ top: 20, left: 1200, width: 60, height: 40 }, card, viewport);
    expect(r.left).toBe(1280 - 360 - 16);
  });

  it('goes above a target near the bottom', () => {
    expect(placeCard({ top: 700, left: 100, width: 200, height: 50 }, card, viewport).placement).toBe('above');
  });

  it('goes beside a tall target', () => {
    const r = placeCard({ top: 60, left: 20, width: 400, height: 720 }, card, viewport);
    expect(r).toMatchObject({ placement: 'right', left: 434 });
  });

  it('docks on a phone when nothing fits', () => {
    const phone = { width: 375, height: 700 };
    const r = placeCard({ top: 100, left: 0, width: 375, height: 560 }, { width: 343, height: 220 }, phone);
    expect(r.placement).toBe('dock-top');
    expect(r.top).toBe(16);
  });
});

describe('tutorial steps', () => {
  it('have unique ids', () => {
    const ids = TUTORIAL_STEPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only open a ticket when tickets are guaranteed', () => {
    for (const step of TUTORIAL_STEPS) {
      if (step.openTopTicket) expect(step.needsTickets).toBe(true);
    }
  });
});
