// Paneles, slots, tarjetas y botones nine-slice del atlas de UI.
// Exports: drawPanels.

import { drawNineSliceBox } from './nineSlice.js';

export function drawPanels(ctx, UI) {
  const NS = UI.NINE_SLICE;

  drawNineSliceBox(ctx, NS.panel_metal, {
    bg: '#0c100c', speckle: '#243022',
    borderLight: '#877a5c', borderDark: '#4a2518',
    doubleRim: true, rimInner: '#364832', cornerRivets: true
  });
  drawNineSliceBox(ctx, NS.panel_boss, {
    bg: '#140707', speckle: '#6e1414',
    borderLight: '#a52020', borderDark: '#4a2518',
    doubleRim: true, rimInner: '#6e1414', cornerRivets: true, rivetColor: '#b89c46'
  });
  drawNineSliceBox(ctx, NS.panel_paper, {
    bg: '#101510', speckle: '#364832',
    borderLight: '#877a5c', borderDark: '#364832',
    leftStripe: '#a52020'
  });
  drawNineSliceBox(ctx, NS.panel_inset, {
    bg: '#050605',
    borderLight: '#4a2518', borderDark: '#877a5c', pressed: true, cleanCorners: true
  });
  drawNineSliceBox(ctx, NS.panel_tape, {
    bg: '#c2a64f',
    borderLight: '#e6d7a5', borderDark: '#4a2518', tornEdges: true, cleanCorners: true
  });
  drawNineSliceBox(ctx, NS.panel_teeth, {
    bg: '#0e120d', speckle: '#4a2518',
    borderLight: '#b89c46', borderDark: '#4a2518', doubleRim: true, rimInner: '#4a2518'
  });

  drawNineSliceBox(ctx, NS.slot_weapon, {
    bg: '#0c120d', innerGlow: '#172318', speckle: '#364832',
    borderLight: '#b89c46', borderDark: '#4a2518',
    doubleRim: true, rimInner: '#364832', cornerRivets: true, rivetColor: '#e6d7a5'
  });
  drawNineSliceBox(ctx, NS.slot_passive, {
    bg: '#120e09', innerGlow: '#21180e', speckle: '#4a2518',
    borderLight: '#e6d7a5', borderDark: '#4a2518',
    doubleRim: true, rimInner: '#63533b', cornerRivets: true, rivetColor: '#b89c46'
  });
  drawNineSliceBox(ctx, NS.slot_empty, {
    bg: '#060806', innerGlow: '#0a0d0a',
    borderLight: '#364832', borderDark: '#182018', cleanCorners: true
  });
  drawNineSliceBox(ctx, NS.card_normal, {
    bg: '#0d120d', speckle: '#243022',
    borderLight: '#877a5c', borderDark: '#4a2518',
    doubleRim: true, rimInner: '#364832', cornerRivets: true
  });
  drawNineSliceBox(ctx, NS.card_hover, {
    bg: '#1b2619', speckle: '#b89c46',
    borderLight: '#e6d7a5', borderDark: '#b89c46',
    doubleRim: true, rimInner: '#b89c46', cornerRivets: true, rivetColor: '#e6d7a5'
  });
  drawNineSliceBox(ctx, NS.bar_frame, {
    bg: '#050605',
    borderLight: '#877a5c', borderDark: '#364832', pressed: true, cleanCorners: true
  });

  drawNineSliceBox(ctx, NS.btn_normal, {
    bg: '#161d15',
    borderLight: '#877a5c', borderDark: '#050605', doubleRim: true, rimInner: '#4a2518', cornerRivets: true
  });
  drawNineSliceBox(ctx, NS.btn_hover, {
    bg: '#c8ab50',
    borderLight: '#e6d7a5', borderDark: '#4a2518', doubleRim: true, rimInner: '#e6d7a5', cornerRivets: true, rivetColor: '#050605'
  });
  drawNineSliceBox(ctx, NS.btn_active, {
    bg: '#0b0f0b',
    borderLight: '#b89c46', borderDark: '#050605', pressed: true, cornerRivets: true
  });
  drawNineSliceBox(ctx, NS.btn_disabled, {
    bg: '#070807',
    borderLight: '#243022', borderDark: '#121812', cleanCorners: true
  });

  drawNineSliceBox(ctx, NS.btn_pri_normal, {
    bg: '#4e1212',
    borderLight: '#d43b3b', borderDark: '#050605', doubleRim: true, rimInner: '#8a2020', cornerRivets: true, rivetColor: '#e6d7a5'
  });
  drawNineSliceBox(ctx, NS.btn_pri_hover, {
    bg: '#d4af37',
    borderLight: '#e6d7a5', borderDark: '#4a2518', doubleRim: true, rimInner: '#e6d7a5', cornerRivets: true, rivetColor: '#050605'
  });
  drawNineSliceBox(ctx, NS.btn_pri_active, {
    bg: '#2c0909',
    borderLight: '#a52020', borderDark: '#050605', pressed: true, cornerRivets: true
  });
  drawNineSliceBox(ctx, NS.btn_pri_disabled, {
    bg: '#0e0707',
    borderLight: '#381818', borderDark: '#050605', cleanCorners: true
  });
}
