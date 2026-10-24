# Chiringuito del Atardecer

El modo `core_defense` es ahora una campaña de gestión, defensa con torretas y servicio de restaurante. El jugador es un cocinero isleño no combatiente; su única herramienta de defensa son las torretas.

## Bucle de campaña

- **3 temporadas × 15 días**.
- Cada temporada elige al azar un recorrido del pool de su dificultad: fácil, normal o difícil.
- La ruta queda fija durante la temporada. El mapa, el chiringuito, el mobiliario, las recetas, las perlas y las mejoras del restaurante persisten.
- Al cambiar de temporada se retiran todas las torretas y se reinician chatarra, stock de comida y despensa. El nuevo recorrido sustituye al anterior.
- La campaña termina en la noche del día 15 de la tercera temporada. Si la despensa llega a 0, la campaña termina de inmediato.

### Día

| Fase | Contenido |
|---|---|
| Mañana | **300 s (5 min) de tiempo límite**. Cosechar y sembrar con minijuegos de 4 fases, pescar en la laguna, elegir la carta de la noche, construir torretas/mobiliario y comprar mejoras. Al agotarse el reloj empieza la tarde automáticamente. |
| Tarde | Dos oleadas. El jugador no combate; solo las torretas dañan. |
| Noche | Los clientes ocupan plazas y piden de la **carta del día**. El jugador cocina, recoge el plato del pase y lo lleva a la mesa. El cielo se oscurece progresivamente y aparece la luna. |

## Controles

- `E`: interactuar (cosechar, recetario, comandas, recoger/dejar/servir plato, ajustar torreta).
- `B`: construcción con pestañas Torretas/Chiringuito.
- `I`: recetario e inventario (también fuera de la mañana).
- `F`: iniciar la tarde o avanzar resúmenes; si no lo pulsas, la mañana termina sola a los 300 s.
- `V`: áreas de alcance de torretas.
- `P`: pausa.
- Minijuego de cocina: arrastra el cuchillo por las guías, haz círculos en la olla, mantén y agita el salero, desliza hacia arriba para voltear en la sartén y arrastra los ingredientes al plato; decora y pulsa SERVIR. `Esc` cancela. El servicio y el reloj de fase se pausan mientras la cocina está abierta.
- Minijuego de siembra: golpea al ritmo para cavar los hoyos, toca las marcas del bancal para sembrar, arrastra tierra y apisona con el mazo al ritmo, y mueve la regadera manteniendo cada celda en la zona verde sin encharcarla. `Esc` cancela.

## Granja, recetas y clientes

- 8 parcelas iniciales con 3 unidades por cosecha. Cada mañana maduran los cultivos sembrados el día anterior.
- Cosechar abre un minijuego de 4 fases: arrancar la planta con un tirón constante, frotar para quitar la tierra, clasificar los frutos por tamaño (S/M/L) y atraparlos al ritmo de la cesta. La calidad modula la cantidad: una planta rota da 1, una cosecha perfecta suma +2 al rendimiento base.
- Sembrar abre otro minijuego de 4 fases: cavar los hoyos al ritmo, colocar una semilla en cada marca respetando el espaciado, cubrir el bancal y apisonar al ritmo, y regar las celdas sin pasarse. La calidad de la siembra fija el `yield` de la parcela: perfecta +2, buena +1, aceptable 0 y pobre −1. El cultivo crece durante la noche y se recoge a la mañana siguiente con ese rendimiento.
- El stock persiste entre días y se vacía al cambiar de temporada.
- La carne de cangrejo se acredita al matar enemigos.
- La laguna del muelle permite pescar con un minijuego de 4 fases: lanzar (fuerza + puntería), esperar la picada real (con tirones falsos), forcejear siguiendo al pez con el cursor y recoger girando el carrete. Hay sardinas, caballas, meros y el raro pez dorado; el pez y la cantidad dependen del lanzamiento y la precisión. El pescado se añade al inventario; las capturas raras dan perlas.
- Recetas iniciales: cangrejo a la sartén y bocaditos de cangrejo (solo cangrejo, para las primeras noches sin cosecha), arroz de cangrejo, ceviche, tacos, brocheta, ensalada isleña, coco tropical y pescado a la brasa. Las demás, incluidos los tacos de pesca, se desbloquean con perlas.
- En el recetario, durante la mañana, se marca la **carta de hoy**: los clientes pedirán preferentemente esos platos. Si la carta se queda sin existencias, piden cualquier plato disponible para no marcharse sin pedir.
- Los pedidos reservan ingredientes al sentarse el cliente. Si el cliente se va, la reserva se devuelve.
- Cocinar abre el minijuego de cinco fases del sistema nuevo: cortar siguiendo guías, remover en círculos sin salpicar, sazonar agitando y soltando en la zona verde, controlar la cocción y voltear con un flick, y emplatar arrastrando los ingredientes + decoración libre. La receta define cortes, bandas de cocción y orden de emplatado. La calidad resultante modula propina y reputación; el servicio se pausa durante el minijuego para que la noche no se consuma cocinando.
- Debug de minijuegos: `python -m http.server 8000`; cocina en `/minigames-lab.html?play=cooking&recipe=crab_rice&level=3&auto=1`, pesca en `/minigames-lab.html?play=fishing&level=3&auto=1`, cosecha en `/minigames-lab.html?play=harvest&crop=tomato&level=3&auto=1`, siembra en `/minigames-lab.html?play=planting&crop=tomato&level=3&auto=1` y sandbox de gestos en `/minigames-lab.html?play=sandbox&level=2&auto=1`.
- Economía: la madera de las bajas normales cae cada 3 enemigos; las oleadas y la limpieza de tarde dan cantidades contenidas. Las torretas son una inversión, no una lluvia de material.
- El plato aparece en el pase. Se recoge con `E`, se transporta y se sirve en la mesa del cliente.
- Las plazas, la paciencia, el encanto y las propinas dependen del mobiliario y de las mejoras.
- La base incluye tres mesas, taburetes y sombrillas. El mobiliario y las estructuras del chiringuito tienen colisión física; las mesas se pueden vender y sustituir.
- El chiringuito y la terraza se construyen con perlas; las recetas, mejoras y mobiliario persisten entre temporadas.

## Guardado continuo

- Clave: `traces_chiringuito_campaign_v1`; récords: `traces_chiringuito_records_v1`.
- Una sola ranura, sin guardado manual ni rebobinado.
- El Host (o el jugador local) guarda cada ~2 s durante fases activas y en eventos críticos.
- El snapshot incluye fase, temporada, día, ruta, despensa, chatarra, perlas, inventario, mobiliario, recetas, carta del día, mejoras, clientes, pedidos, platos, torretas, oleada y enemigos vivos.
- Derrota y victoria se persisten antes de mostrar resultados. `Continuar` restaura el estado exacto, no una mañana anterior.
- Si se cierra durante el minijuego, el ticket vuelve a la cola al cargar y conserva sus ingredientes reservados.
- El Cliente de una partida co-op nunca escribe el save.

## Cooperativo

- Host autoritativo para fases, oleadas, restaurante, clientes, pedidos, cocina, economía, torretas y mobiliario.
- El Cliente envía acciones `CG_ACTION`; el Host valida y difunde `CG_STATE`/`CG_SNAPSHOT`.
- El estado se reconcilia a 1 Hz y la posición de los avatares a 20 Hz. Los enemigos siguen usando `ENEMY_SPAWN` y `ENEMY_BATCH_SYNC`.
- El Cliente puede cosechar, sembrar, construir, cocinar, recoger platos y servir mesas. Las acciones de riesgo se confirman con el siguiente snapshot del Host.
- Ambos avatares usan el cocinero; la bandeja de platos se replica en el avatar remoto.
- El Host guarda la campaña. El Cliente no guarda ni puede rebobinar.

## Archivos principales

- `js/modes/chiringuitoMode.js`: fachada del modo.
- `js/modes/chiringuito/campaignDirector.js`: fases, días, temporadas y transiciones.
- `js/defense/chiringuitoIsland.js`: isla persistente y selección de rutas.
- `js/world/chiringuitoIslandGeometry.js`: deck, barra, cocina, pase y luces.
- `js/restaurant/*`: inventario, granja, mobiliario, clientes, pedidos y cocina.
- `js/config/chiringuito/*`: temporadas, recetas, ingredientes, clientes, mobiliario y tuning.
- `js/ui/chiringuitoUI.js` + `css/hud_chiringuito.css`: HUD, construcción, recetario, comandas, puente de cocina y resúmenes.
- `js/minigames/games/cooking/` + `css/hud_minigames.css`: cocina de 5 fases y UI cartoon; `js/minigames/games/planting/` implementa la siembra de 4 fases; `js/minigames/assets/` centraliza sprites, sonidos y modelos.
- `js/online/chiringuitoSync.js`: snapshot/estado y acciones del co-op.
- `js/core/chiringuitoSave.js`: guardado continuo y récords.
