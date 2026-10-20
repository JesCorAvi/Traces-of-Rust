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

  // Paneles y tarjetas especializadas por sprite para la pantalla de inicio estilo PC
  if (NS.panel_terminal) {
    drawNineSliceBox(ctx, NS.panel_terminal, {
      bg: 'rgba(8, 14, 10, 0.88)', speckle: '#1c281a',
      borderLight: '#5a7852', borderDark: '#121812',
      doubleRim: true, rimInner: '#2d422a',
      cornerRivets: true, rivetColor: '#8ef77b',
      cornerBrackets: true, bracketColor: '#8ef77b'
    });
  }

  if (NS.card_hero_td) {
    drawNineSliceBox(ctx, NS.card_hero_td, {
      bg: 'rgba(12, 18, 12, 0.86)', speckle: '#1c281a',
      borderLight: '#4a6844', borderDark: '#0e160e',
      doubleRim: true, rimInner: '#283c24',
      cornerRivets: true, rivetColor: '#6a945f',
      cornerBrackets: true, bracketColor: '#6a945f'
    });
  }

  if (NS.card_hero_td_active) {
    drawNineSliceBox(ctx, NS.card_hero_td_active, {
      bg: 'rgba(18, 30, 18, 0.94)', innerGlow: 'rgba(32, 60, 32, 0.4)', speckle: '#f0c954',
      borderLight: '#8ef77b', borderDark: '#1c3618',
      doubleRim: true, rimInner: '#f0c954',
      cornerRivets: true, rivetColor: '#f0c954',
      cornerBrackets: true, bracketColor: '#8ef77b'
    });
  }

  if (NS.card_sec_surv) {
    drawNineSliceBox(ctx, NS.card_sec_surv, {
      bg: 'rgba(16, 10, 10, 0.86)', speckle: '#381616',
      borderLight: '#5a3636', borderDark: '#120808',
      doubleRim: true, rimInner: '#3a1e1e',
      cornerRivets: true, rivetColor: '#7a4242',
      cornerBrackets: true, bracketColor: '#7a4242'
    });
  }

  if (NS.card_sec_surv_active) {
    drawNineSliceBox(ctx, NS.card_sec_surv_active, {
      bg: 'rgba(30, 14, 14, 0.94)', innerGlow: 'rgba(60, 20, 20, 0.4)', speckle: '#ff6b6b',
      borderLight: '#ff5555', borderDark: '#4a1212',
      doubleRim: true, rimInner: '#a52020',
      cornerRivets: true, rivetColor: '#ff8888',
      cornerBrackets: true, bracketColor: '#ff5555'
    });
  }

  if (NS.panel_tech_inset) {
    drawNineSliceBox(ctx, NS.panel_tech_inset, {
      bg: 'rgba(5, 8, 6, 0.88)',
      borderLight: '#182418', borderDark: '#364e32',
      pressed: true, cleanCorners: true
    });
  }

  if (NS.btn_hero_play) {
    drawNineSliceBox(ctx, NS.btn_hero_play, {
      bg: 'rgba(38, 30, 12, 0.92)', innerGlow: 'rgba(60, 48, 18, 0.5)', speckle: '#f0c954',
      borderLight: '#f0c954', borderDark: '#4a3610',
      doubleRim: true, rimInner: '#b89c46',
      cornerRivets: true, rivetColor: '#f5ecd3',
      cornerBrackets: true, bracketColor: '#f0c954'
    });
  }

  if (NS.btn_hero_play_hover) {
    drawNineSliceBox(ctx, NS.btn_hero_play_hover, {
      bg: '#d4af37', innerGlow: '#fff0a0', speckle: '#050605',
      borderLight: '#fff2b2', borderDark: '#5a420e',
      doubleRim: true, rimInner: '#ffe072',
      cornerRivets: true, rivetColor: '#050605',
      cornerBrackets: true, bracketColor: '#050605'
    });
  }

  if (NS.pill_frame_status) {
    drawNineSliceBox(ctx, NS.pill_frame_status, {
      bg: 'rgba(8, 14, 10, 0.88)',
      borderLight: '#4a6844', borderDark: '#121812',
      doubleRim: true, rimInner: '#283c24', cleanCorners: true
    });
  }

  if (NS.pill_frame_currency) {
    drawNineSliceBox(ctx, NS.pill_frame_currency, {
      bg: 'rgba(22, 18, 8, 0.92)', speckle: '#b89c46',
      borderLight: '#f0c954', borderDark: '#3a2e0a',
      doubleRim: true, rimInner: '#877028', cleanCorners: true
    });
  }
}
