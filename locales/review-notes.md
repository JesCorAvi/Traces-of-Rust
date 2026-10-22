# Notas de Revisión y Cadenas con Matices / Localization Review Notes
**Traces of Rust — 8 Locales**

Este documento recopila términos, juegos de palabras, limitaciones de espacio en interfaz y decisiones específicas tomadas durante la traducción para su revisión editorial humana.

---

### 1. Términos con Metáforas Médicas e Industriales
- **Pulso (Pulse / Santé / HP)**:
  - En español el juego usa "Pulso" en lugar de "Vida" para dar el sabor temático de operaciones quirúrgicas / adrenalina táctica.
  - *en*: Se preserva como "Pulse" para coherencia con "Pulse Overload" y la ambientación del Dr. Richter.
  - *pt-BR*: Traducido como "Pulso".
  - *fr*: Traducido como "Pouls".
  - *ja*: Traducido como "パルス" (Pulse) en atributos, pero en descripciones contextuales como "体力" cuando se refiere a recuperación biológica.
  - *zh-Hans / zh-Hant*: Traducido como "脉搏" / "脈搏".
  - *ko*: Traducido como "맥박" (Pulse).
  - *ru*: Traducido como "Пульс".

- **Dientes (Teeth / Dents / 歯)**:
  - Metáfora macabra de extracción para la mesa de mejoras permanentes del cirujano. Se conserva literal en todos los idiomas por ser la moneda diegética distintiva del juego.

### 2. Reglas Plurales Especiales
- **Ruso (ru)**:
  - Requiere 3 formas de plural CLDR:
    - `one`: termina en 1 (ej. 1 враг, 21 враг, 1 жизнь)
    - `few`: termina en 2, 3, 4 excepto 12-14 (ej. 2-4 врага, 2-4 жизни)
    - `many`: termina en 0, 5-9, 11-14 (ej. 5-20 врагов, 5-20 жизней)
  - Las claves con plural en `locales/ru.js` incluyen `.one`, `.few`, `.many` para garantizar concordancia gramatical perfecta (por ejemplo `hud.core.leak_detected.one`, `.few`, `.many`).

- **Chino Simplificado (zh-Hans), Chino Tradicional (zh-Hant), Japonés (ja), Coreano (ko)**:
  - Estas lenguas no diferencian forma singular y plural morfológicamente. Usan una única clave común o `.other` según la especificación CLDR.

### 3. Diferencias zh-Hans vs zh-Hant
- **Torreta**: zh-Hans: `炮塔` (pàotǎ) | zh-Hant: `砲塔` (pàotǎ - grafía con radical de piedra).
- **Jefe**: zh-Hans: `头目` / `Boss` | zh-Hant: `首領` / `Boss`.
- **Reroll / Actualizar**: zh-Hans: `刷新` | zh-Hant: `重抽`.
- **Operador**: zh-Hans: `特工` | zh-Hant: `幹員`.
- **Chatarra**: zh-Hans: `废料` | zh-Hant: `廢料`.

### 4. Ajustes por Longitud de Cadenas
- **Ruso y Francés**:
  - Tienden a ser entre un 15% y 35% más largos que el español en botones y banners.
  - Se han utilizado formas imperativas o infinitivas compactas (ej. fr: `[ JOUER ]`, `[ PARAMÈTRES ]`, ru: `[ ИГРАТЬ ]`, `[ НАСТРОЙКИ ]`) para asegurar que no se desborden de los contenedores de menú de 220px-280px.

### 5. Cadenas con Matices Especiales para Revisión Humana (Flagged Strings)
1. **`ui.manual.sec1_body` (Teclas y Atajos de Teclado)**:
   - En francés se añadió la referencia a `ZQSD` (estándar de teclado AZERTY usado en Francia y Bélgica) junto a `WASD` (`ZQSD / WASD`). Revisar si se prefiere solo mostrar dinámicamente según la distribución de teclado.
2. **`char.otto.title` ("Dr. V. Richter" vs "Doctor Otto")**:
   - En el código interno el identificador es `otto`, pero en el texto diegético se le llama "Dr. V. Richter" ("V. リヒター医師", "V·李希特", "V·里希特"). Se mantuvo Richter por ambientación del lore original.
3. **`char.bob.title` ("Bob El Grasas" / "Bob El Engrasador")**:
   - Traducido como:
     - *en*: `Bob "The Oiler"`
     - *pt-BR*: `Bob "O Graxeiro"`
     - *fr*: `Bob "Le Graisseur"`
     - *ja*: `ボブ "オイラー"`
     - *ko*: `밥 "기름쟁이"`
     - *zh-Hans*: `鲍勃 "润滑工"`
     - *zh-Hant*: `鮑勃 "潤滑工"`
     - *ru*: `Боб «Масленка»`
4. **`turret.press.name` ("Prensa de Vía" / "Piston Press")**:
   - En español e inglés se diseñó como un martillo industrial que desciende sobre la vía. En CJK se tradujo como:
     - *ja*: `レールプレス`
     - *ko*: `피스톤 프레스`
     - *zh-Hans*: `轨道重压机`
     - *zh-Hant*: `軌道重壓機`
5. **`shop.respec_btn` ("Respec" / "Refund")**:
   - Explicado claramente como "Reiniciar mejoras y reembolsar el 100% de los dientes" en todos los idiomas para evitar confusiones de si se pierden las divisas permanentes.
6. **`ui.mode.arcade_badge` ("Arcade" / "Sin torretas")**:
   - En *zh-Hans* y *zh-Hant* se utilizó el término habitual de la comunidad para juegos survivors estilo Vampire Survivors: `纯享清怪` / `純享割草` (estilo 'mow down hordes' / 'musou'), destacando la diferencia con el modo TD.
