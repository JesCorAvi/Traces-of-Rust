// Paneles, slots, tarjetas y botones nine-slice del atlas de UI tropical.
// Exports: drawPanels.

import { drawNineSliceBox } from './nineSlice.js';

export function drawPanels(ctx, UI) {
  const NS = UI.NINE_SLICE;

  drawNineSliceBox(ctx, NS.panel_metal, {
    bg: '#062a31', speckle: '#1d5b57',
    borderLight: '#7fc9bb', borderDark: '#234b44',
    doubleRim: true, rimInner: '#3d8377', cornerRivets: true, rivetColor: '#ffe0a2'
  });
  drawNineSliceBox(ctx, NS.panel_boss, {
    bg: '#2a1013', speckle: '#8f3434',
    borderLight: '#ff8a68', borderDark: '#4a1c20',
    doubleRim: true, rimInner: '#ad3a37', cornerRivets: true, rivetColor: '#ffd166'
  });
  drawNineSliceBox(ctx, NS.panel_paper, {
    bg: '#0b3438', speckle: '#2f7468',
    borderLight: '#d7b382', borderDark: '#3d6760',
    leftStripe: '#ff8a68'
  });
  drawNineSliceBox(ctx, NS.panel_inset, {
    bg: '#041e24',
    borderLight: '#1c5d58', borderDark: '#6aa89c', pressed: true, cleanCorners: true
  });
  drawNineSliceBox(ctx, NS.panel_tape, {
    bg: '#f0c96b',
    borderLight: '#fff0c7', borderDark: '#7a3f2c', tornEdges: true, cleanCorners: true
  });
  drawNineSliceBox(ctx, NS.panel_teeth, {
    bg: '#082c31', speckle: '#1d5b57',
    borderLight: '#ffd166', borderDark: '#4b3322', doubleRim: true, rimInner: '#7a4a2b'
  });

  drawNineSliceBox(ctx, NS.slot_weapon, {
    bg: '#073239', innerGlow: '#0e4b49', speckle: '#2f7d74',
    borderLight: '#ffd166', borderDark: '#6b3a28',
    doubleRim: true, rimInner: '#2d756b', cornerRivets: true, rivetColor: '#fff0c7'
  });
  drawNineSliceBox(ctx, NS.slot_passive, {
    bg: '#2a2118', innerGlow: '#4c3621', speckle: '#7c5132',
    borderLight: '#ffe0a2', borderDark: '#6b3a28',
    doubleRim: true, rimInner: '#9a6641', cornerRivets: true, rivetColor: '#ffc857'
  });
  drawNineSliceBox(ctx, NS.slot_empty, {
    bg: '#06242a', innerGlow: '#0a3338',
    borderLight: '#2c6f67', borderDark: '#103f43', cleanCorners: true
  });
  drawNineSliceBox(ctx, NS.card_normal, {
    bg: '#0a3238', speckle: '#236359',
    borderLight: '#8ccdc0', borderDark: '#5f3a28',
    doubleRim: true, rimInner: '#33786e', cornerRivets: true, rivetColor: '#ffe0a2'
  });
  drawNineSliceBox(ctx, NS.card_hover, {
    bg: '#155955', speckle: '#ffd166',
    borderLight: '#fff0c7', borderDark: '#ffc857',
    doubleRim: true, rimInner: '#ffc857', cornerRivets: true, rivetColor: '#fff0c7'
  });
  drawNineSliceBox(ctx, NS.bar_frame, {
    bg: '#031b20',
    borderLight: '#83cbbb', borderDark: '#286a62', pressed: true, cleanCorners: true
  });

  drawNineSliceBox(ctx, NS.btn_normal, {
    bg: '#0c3b3e',
    borderLight: '#8ccdc0', borderDark: '#041f23', doubleRim: true, rimInner: '#2d7569', cornerRivets: true, rivetColor: '#ffe0a2'
  });
  drawNineSliceBox(ctx, NS.btn_hover, {
    bg: '#ffd166',
    borderLight: '#fff6d5', borderDark: '#8a4c28', doubleRim: true, rimInner: '#ffeaa8', cornerRivets: true, rivetColor: '#153a3b'
  });
  drawNineSliceBox(ctx, NS.btn_active, {
    bg: '#06262b',
    borderLight: '#c79a54', borderDark: '#04191e', pressed: true, cornerRivets: true
  });
  drawNineSliceBox(ctx, NS.btn_disabled, {
    bg: '#08262a',
    borderLight: '#2e5b55', borderDark: '#123c40', cleanCorners: true
  });

  drawNineSliceBox(ctx, NS.btn_pri_normal, {
    bg: '#c9543f',
    borderLight: '#ffb083', borderDark: '#5b211f',
    doubleRim: true, rimInner: '#ff8a5c', cornerRivets: true, rivetColor: '#fff0c7'
  });
  drawNineSliceBox(ctx, NS.btn_pri_hover, {
    bg: '#ffd166',
    borderLight: '#fff6d5', borderDark: '#8a4c28',
    doubleRim: true, rimInner: '#ffeaa8', cornerRivets: true, rivetColor: '#153a3b'
  });
  drawNineSliceBox(ctx, NS.btn_pri_active, {
    bg: '#86352e',
    borderLight: '#e7644f', borderDark: '#3c1414', pressed: true, cornerRivets: true
  });
  drawNineSliceBox(ctx, NS.btn_pri_disabled, {
    bg: '#311c1b',
    borderLight: '#6e4a44', borderDark: '#231313', cleanCorners: true
  });

  // Paneles y tarjetas especializadas de la pantalla de inicio.
  if (NS.panel_terminal) {
    drawNineSliceBox(ctx, NS.panel_terminal, {
      bg: 'rgba(5, 39, 44, 0.9)', speckle: '#1b5551',
      borderLight: '#6db9aa', borderDark: '#082329',
      doubleRim: true, rimInner: '#2b7167',
      cornerRivets: true, rivetColor: '#ffd166',
      cornerBrackets: true, bracketColor: '#65e6e9'
    });
  }

  if (NS.card_hero_td) {
    drawNineSliceBox(ctx, NS.card_hero_td, {
      bg: 'rgba(6, 51, 50, 0.9)', speckle: '#1b5e58',
      borderLight: '#69b7a7', borderDark: '#062329',
      doubleRim: true, rimInner: '#2b6d64',
      cornerRivets: true, rivetColor: '#ffd166',
      cornerBrackets: true, bracketColor: '#65e6e9'
    });
  }

  if (NS.card_hero_td_active) {
    drawNineSliceBox(ctx, NS.card_hero_td_active, {
      bg: 'rgba(9, 71, 68, 0.96)', innerGlow: 'rgba(89, 214, 200, 0.22)', speckle: '#ffd166',
      borderLight: '#a9fff1', borderDark: '#0c4b46',
      doubleRim: true, rimInner: '#ffd166',
      cornerRivets: true, rivetColor: '#ffd166',
      cornerBrackets: true, bracketColor: '#a9fff1'
    });
  }

  if (NS.card_sec_surv) {
    drawNineSliceBox(ctx, NS.card_sec_surv, {
      bg: 'rgba(44, 24, 23, 0.9)', speckle: '#673130',
      borderLight: '#9b5b4f', borderDark: '#2c1113',
      doubleRim: true, rimInner: '#68352f',
      cornerRivets: true, rivetColor: '#d88b70',
      cornerBrackets: true, bracketColor: '#d88b70'
    });
  }

  if (NS.card_sec_surv_active) {
    drawNineSliceBox(ctx, NS.card_sec_surv_active, {
      bg: 'rgba(82, 37, 31, 0.96)', innerGlow: 'rgba(255, 129, 101, 0.18)', speckle: '#ffd166',
      borderLight: '#ffad8e', borderDark: '#5b211f',
      doubleRim: true, rimInner: '#ff8a68',
      cornerRivets: true, rivetColor: '#ffe0a2',
      cornerBrackets: true, bracketColor: '#ffad8e'
    });
  }

  if (NS.panel_tech_inset) {
    drawNineSliceBox(ctx, NS.panel_tech_inset, {
      bg: 'rgba(4, 31, 36, 0.9)',
      borderLight: '#1c5650', borderDark: '#347e72',
      pressed: true, cleanCorners: true
    });
  }

  if (NS.btn_hero_play) {
    drawNineSliceBox(ctx, NS.btn_hero_play, {
      bg: 'rgba(118, 50, 34, 0.94)', innerGlow: 'rgba(255, 167, 98, 0.18)', speckle: '#ffd166',
      borderLight: '#ffd166', borderDark: '#7a3725',
      doubleRim: true, rimInner: '#ff8a68',
      cornerRivets: true, rivetColor: '#fff0c7',
      cornerBrackets: true, bracketColor: '#ffd166'
    });
  }

  if (NS.btn_hero_play_hover) {
    drawNineSliceBox(ctx, NS.btn_hero_play_hover, {
      bg: '#ffd166', innerGlow: '#fff0b0', speckle: '#173d3f',
      borderLight: '#fff6d5', borderDark: '#8a4c28',
      doubleRim: true, rimInner: '#ffeaa8',
      cornerRivets: true, rivetColor: '#173d3f',
      cornerBrackets: true, bracketColor: '#173d3f'
    });
  }

  if (NS.pill_frame_status) {
    drawNineSliceBox(ctx, NS.pill_frame_status, {
      bg: 'rgba(5, 38, 43, 0.9)',
      borderLight: '#5ea99c', borderDark: '#0a292d',
      doubleRim: true, rimInner: '#2b6b61', cleanCorners: true
    });
  }

  if (NS.pill_frame_currency) {
    drawNineSliceBox(ctx, NS.pill_frame_currency, {
      bg: 'rgba(55, 39, 18, 0.94)', speckle: '#ffd166',
      borderLight: '#ffd166', borderDark: '#5c3c18',
      doubleRim: true, rimInner: '#b88734', cleanCorners: true
    });
  }
}
