const fs = require('fs');
const es = require('../../temp-es-dict.json');

const pt = {};

function set(k, v) {
  if (k in es) {
    pt[k] = v;
  }
}

// Portuguese (Brazil) translation generator
// We load EN as reference for keys and structure
import('../../locales/en.js').then(enMod => {
  const en = enMod.default;

  // Set all translated values
  // Mode
  set("mode.core_defense.title", "DEFESA DE TORRES");
  set("mode.core_defense.subtitle", "DEFENDA O NÚCLEO");
  set("mode.core_defense.badge", "★ MODO PRINCIPAL // CAMPANHA");
  set("mode.core_defense.shortTitle", "DEFESA DE TORRES");
  set("mode.core_defense.tagline", "Construa defesas nos trilhos industriais, sobreviva a 12 ondas letais e proteja o reator biomecânico.");
  set("mode.core_defense.objectiveTitle", "PROTOCOLO DE DEFESA");
  set("mode.core_defense.objectiveDefault", "Impeça que as entidades alcancem a câmara do Núcleo");
  set("mode.survival.title", "SOBREVIVÊNCIA");
  set("mode.survival.subtitle", "PURGUE A HORDA");
  set("mode.survival.badge", "MODO SECUNDÁRIO // ARCADE");
  set("mode.survival.shortTitle", "SOBREVIVÊNCIA");
  set("mode.survival.tagline", "Modo secundário de ação rápida: combate direto sem torretas, colete soro e purgue os 5 chefes do complexo.");
  set("mode.survival.objectiveTitle", "DIRETRIZ DA USINA");
  set("mode.survival.objectiveDefault", "Encontre e purgue os chefes do complexo");

  // Diff
  set("diff.facil", "FÁCIL");
  set("diff.normal", "NORMAL");
  set("diff.dificil", "DIFÍCIL");

  // Bosses & Enemies
  set("boss.boss_butcher.name", "O AMPUTADOR DA USINA");
  set("boss.boss_siren.name", "A MÃE DE ARAME");
  set("boss.boss_furnace.name", "AUTÔMATO CREMATÓRIO Nº 09");
  set("boss.boss_apostle.name", "O APÓSTOLO DA ENGRENAGEM");
  set("boss.boss_warden.name", "GUARDIÃO DO SETOR");

  set("enemy.runner.name", "CORREDOR DE TRILHO");
  set("enemy.hulk.name", "PRENSA DE CARNE");
  set("enemy.nest.name", "NINHO ANDANTE");
  set("enemy.regenerator.name", "SUTURADOR DA PRAGA");
  set("enemy.splitter.name", "DIVISOR ABERRANTE");

  // Rewards
  set("reward.heal_pack.name", "Transfusão de Emergência");
  set("reward.heal_pack.desc", "Restaura +75 de Pulso imediatamente.");
  set("reward.teeth_bag.name", "Bolsa de Dentes Extraídos");
  set("reward.teeth_bag.desc", "Ganha +15 Dentes adicionais para a Mesa do Cirurgião.");

  // Shop
  set("shop.dmg.name", "Pólvora Refinada");
  set("shop.dmg.desc", "+3% de Dano Base permanente por nível");
  set("shop.hp.name", "Pontos de Sutura");
  set("shop.hp.desc", "+5 de Pulso Máximo Base permanente por nível");
  set("shop.spd.name", "Microdose de Efedrina");
  set("shop.spd.desc", "+2% de Velocidade de Movimento Base por nível");
  set("shop.atkSpd.name", "Óleo de Mecanismos");
  set("shop.atkSpd.desc", "+2,5% de Cadência de Ataque Base por nível");
  set("shop.mag.name", "Pinça de Extração");
  set("shop.mag.desc", "+0,35m de Alcance do Ímã Base permanente por nível");
  set("shop.reroll.name", "Suborno ao Crupiê");
  set("shop.reroll.desc", "+1 uso extra do botão Rolar de novo (Máx +3)");

  // Characters
  set("char.otto.title", "Dr. V. Richter");
  set("char.otto.role", "Cirurgião Tático");
  set("char.otto.desc", "Ex-médico militar obcecado por enxertos biológicos. Especialista em colheita de dentes e controle de área.");
  set("char.otto.passive", "Protocolo de Dissecação");
  set("char.otto.passiveDesc", "+25% de chance extra de dentes e almas de elites. Começa com 1 Rolar de novo adicional.");
  set("char.otto.weaponTitle", "Serra Giratória");

  set("char.mack.title", "Mack \"O Martelo\"");
  set("char.mack.role", "Demolidor Pesado");
  set("char.mack.desc", "Veterano de forja com chassi cibernético reforçado. Devastador de perto, lento à distância.");
  set("char.mack.passive", "Inércia Balística");
  set("char.mack.passiveDesc", "+30% de área base em todas as armas. Repulsão de projéteis pesados aumentada em 50%.");
  set("char.mack.weaponTitle", "Escopeta Calibre 12");

  set("char.pepe.title", "Pepe \"Faísca\"");
  set("char.pepe.role", "Soldador de Arco");
  set("char.pepe.desc", "Eletricista clandestino habituado a descargas de alta tensão e calor industrial extremo.");
  set("char.pepe.passive", "Arco de Sobrecarga");
  set("char.pepe.passiveDesc", "Ataques têm 20% de chance de emitir arco elétrico para 2 inimigos próximos causando 40% de dano.");
  set("char.pepe.weaponTitle", "Maçarico Térmico");

  set("char.morbo.title", "Morbo");
  set("char.morbo.role", "Vetor da Peste");
  set("char.morbo.desc", "Espécime sobrevivente de experimentos químicos. Exala uma névoa altamente corrosiva ao seu redor.");
  set("char.morbo.passive", "Exudação Cáustica");
  set("char.morbo.passiveDesc", "Inimigos na aura sofrem 15% de lentidão e perdem 2% de vida máxima por segundo.");
  set("char.morbo.weaponTitle", "Incensório de Bile");

  set("char.bob.title", "Bob \"Engraxador\"");
  set("char.bob.role", "Maquinista de Combate");
  set("char.bob.desc", "Especialista em armadilhas de solo, engrenagens e detonadores por pressão.");
  set("char.bob.passive", "Rede de Minas");
  set("char.bob.passiveDesc", "A cada 12s, solta automaticamente uma mina de estilhaços que detona causando 80 de dano.");
  set("char.bob.weaponTitle", "Minas de Estilhaços");

  set("char.krauss.title", "Krauss");
  set("char.krauss.role", "Carrasco do Setor");
  set("char.krauss.desc", "Atirador cibernético com arpão pneumático de alta penetração em linha reta.");
  set("char.krauss.passive", "Tensão Pneumática");
  set("char.krauss.passiveDesc", "Projéteis perfurantes ganham +15% de dano para cada inimigo atravessado.");
  set("char.krauss.weaponTitle", "Arpão Pneumático");

  set("char.axel.title", "Axel");
  set("char.axel.role", "Corredor de Jaula");
  set("char.axel.desc", "Berserker cercado por jaulas de ganchos que trituram os hostis que se aproximam.");
  set("char.axel.passive", "Centrífuga Cinética");
  set("char.axel.passiveDesc", "Velocidade de rotação das jaulas aumenta até +40% enquanto se move continuamente.");
  set("char.axel.weaponTitle", "Jaula do Açougueiro");

  set("char.tesla.title", "Nikola");
  set("char.tesla.role", "Pioneiro da Estática");
  set("char.tesla.desc", "Fascinado por circuitos industriais. Transforma sucata em canais de condução elétrica.");
  set("char.tesla.passive", "Ressonância Estática");
  set("char.tesla.passiveDesc", "Eliminar inimigos eletrocutados libera pulso EMP que atordoa alvos num raio de 3m por 0,8s.");
  set("char.tesla.weaponTitle", "Desfibrilador Quebrado");

  // Weapons
  set("weapon.slash.name", "Serra de Amputação");
  set("weapon.slash.desc", "Arco de serra denteada com rastro de sangue, clarão 3D e forte repulsão. (Não afetada por +Projéteis).");
  set("weapon.shotgun.name", "Escopeta Calibre 12");
  set("weapon.shotgun.desc", "Leque de balins de chumbo com clarão e ejeção de cartucho.");
  set("weapon.flamethrower.name", "Maçarico Incinerador");
  set("weapon.flamethrower.desc", "Cone contínuo de chamas que ilumina e queima os inimigos por segundo. (Não afetada por +Projéteis).");
  set("weapon.aura.name", "Incensório de Bile");
  set("weapon.aura.desc", "Campo corrosivo ao redor do jogador que causa dano e retarda a horda. (Não afetada por +Projéteis).");
  set("weapon.mines.name", "Minas de Estilhaços");
  set("weapon.mines.desc", "Lança minas com sensor vermelho que detonam em área ao serem pisadas.");
  set("weapon.harpoon.name", "Arpão Pneumático");
  set("weapon.harpoon.desc", "Projétil penetrante que perfura múltiplos inimigos em linha reta.");
  set("weapon.orbital.name", "Jaula do Açougueiro");
  set("weapon.orbital.desc", "Jaulas com crânios e ganchos orbitam o jogador estraçalhando a horda.");
  set("weapon.bolt.name", "Desfibrilador Quebrado");
  set("weapon.bolt.desc", "Descarga elétrica de alta voltagem que salta entre vários corpos. (Não afetada por +Projéteis).");
  set("weapon.chakram.name", "Bumerangue de Sucata");
  set("weapon.chakram.desc", "Disco de serra que avança perfurando e volta ao operador causando dano duplo.");
  set("weapon.welder.name", "Soldador de Arco");
  set("weapon.welder.desc", "Carrega por 2,4s e dispara um feixe concentrado por 1,6s na maior densidade de inimigos. (Não afetada por +Projéteis).");
  set("weapon.grenade.name", "Lança-Granadas Peregrino");
  set("weapon.grenade.desc", "Granada balística que explode em área e se fragmenta em submunições ao evoluir.");
  set("weapon.hammer.name", "Martelo de Pistão");
  set("weapon.hammer.desc", "Onda radial de pressão com forte repulsão e atordoamento. (Não afetada por +Projéteis).");
  set("weapon.acid.name", "Frasco de Ácido");
  set("weapon.acid.desc", "Frasco que se estilhaça numa nuvem cáustica que corrói e desacelera os hostis.");

  set("weapon.short.slash", "Serra");
  set("weapon.short.shotgun", "Escopeta");
  set("weapon.short.flamethrower", "Maçarico");
  set("weapon.short.aura", "Incensório");
  set("weapon.short.mines", "Minas");
  set("weapon.short.harpoon", "Arpão");
  set("weapon.short.orbital", "Jaula");
  set("weapon.short.bolt", "Desfibril.");
  set("weapon.short.chakram", "Bumerangue");
  set("weapon.short.welder", "Soldador");
  set("weapon.short.grenade", "Granadas");
  set("weapon.short.hammer", "Martelo");
  set("weapon.short.acid", "Ácido");

  // Passives
  set("passive.multishot.name", "Câmara Modificada");
  set("passive.multishot.desc", "Adiciona +1 projétil às armas compatíveis com tiros extras.");
  set("passive.dmg.name", "Pólvora Prensada");
  set("passive.dmg.desc", "Aumenta o dano de todas as armas em +15% por nível.");
  set("passive.atkSpd.name", "Servomotor Enferrujado");
  set("passive.atkSpd.desc", "Aumenta a velocidade de ataque e giro em +10% por nível.");
  set("passive.maxHp.name", "Placas Cirúrgicas");
  set("passive.maxHp.desc", "Aumenta o Pulso máximo em +25 e cura essa quantia imediatamente.");
  set("passive.regen.name", "Gotejamento Intravenoso");
  set("passive.regen.desc", "Regenera +0,9 de Pulso por segundo continuamente.");
  set("passive.moveSpd.name", "Efedrina Industrial");
  set("passive.moveSpd.desc", "Aumenta a velocidade de movimento em +8% por nível.");
  set("passive.area.name", "Estilhaços Expandidos");
  set("passive.area.desc", "Aumenta a área e alcance dos ataques em +12% por nível.");
  set("passive.crit.name", "Lente do Açougueiro");
  set("passive.crit.desc", "Garante +7% de chance de causar dano crítico duplo (x2).");
  set("passive.magnet.name", "Ímã de Guindaste");
  set("passive.magnet.desc", "Aumenta o raio de coleta de soro e dentes.");

  set("passive.format.multishot", "+{lvl} PROJ.");
  set("passive.format.dmg", "+{pct}% DANO");
  set("passive.format.atkSpd", "+{pct}% CAD.");
  set("passive.format.maxHp", "+{hp} PULSO");
  set("passive.format.regen", "+{val} HP/S");
  set("passive.format.moveSpd", "+{pct}% VEL.");
  set("passive.format.area", "+{pct}% ÁREA");
  set("passive.format.crit", "+{pct}% CRÍT.");
  set("passive.format.magnet", "+{val}M ÍMÃ");

  // Maps
  set("map.easy_plaza.name", "Praça Central");
  set("map.easy_plaza.badge", "FÁCIL // LOOP 360°");
  set("map.easy_plaza.desc", "Arena circular com ampla visibilidade. Os inimigos circulam a borda antes de avançar para o núcleo.");

  set("map.easy_spiral.name", "Descida em Espiral");
  set("map.easy_spiral.badge", "FÁCIL // ESPIRAL CONTÍNUA");
  set("map.easy_spiral.desc", "Trajeto contínuo em espiral com alta densidade de torretas. Excelente para armas de longo alcance e gelo.");

  set("map.easy_serpentine.name", "Trincheira Sinuosa");
  set("map.easy_serpentine.badge", "FÁCIL // CURVAS EM S");
  set("map.easy_serpentine.desc", "Trincheira com 5 curvas fechadas em cotovelo. Ideal para dano em área e maçaricos.");

  set("map.easy_ramps.name", "Rampas de Carga Elevadas");
  set("map.easy_ramps.badge", "FÁCIL // RAMPAS ELEVADAS");
  set("map.easy_ramps.desc", "Duas rampas industriais descendentes convergindo sobre uma ponte central reforçada.");

  set("map.easy_cooling.name", "Circuito de Resfriamento");
  set("map.easy_cooling.badge", "FÁCIL // ANEL DUPLO");
  set("map.easy_cooling.desc", "Canais concêntricos de refrigeração. Os inimigos cruzam a calha antes de invadir o reator.");

  set("map.easy_horseshoe.name", "Ferradura de Aço");
  set("map.easy_horseshoe.badge", "FÁCIL // AFUNILAMENTO EM U");
  set("map.easy_horseshoe.desc", "Curva ampla em U com plataformas internas elevadas. Concentra fogo cruzado na curva central.");

  set("map.norm_twins.name", "Corredores Gêmeos");
  set("map.norm_twins.badge", "NORMAL // ENTRADA PARALELA");
  set("map.norm_twins.desc", "Dois corredores simétricos exigindo alocação tática de torretas em ambos os flancos ao mesmo tempo.");

  set("map.norm_pincer.name", "Pinça Hidráulica");
  set("map.norm_pincer.badge", "NORMAL // ATAQUE EM PINÇA");
  set("map.norm_pincer.desc", "Duas brechas opostas convergindo em 90° em direção ao núcleo central.");

  set("map.norm_cross.name", "Encruzilhada Industrial");
  set("map.norm_cross.badge", "NORMAL // BRECHA QUADRUPLA");
  set("map.norm_cross.desc", "Interseção em cruz. Inimigos atacam em ondas alternadas do norte, sul, leste e oeste.");

  set("map.norm_funnel.name", "Funil de Escória");
  set("map.norm_funnel.badge", "NORMAL // AFUNILAMENTO CONVERGENTE");
  set("map.norm_funnel.desc", "Três brechas amplas que se afunilam subitamente em uma única passagem estreita.");

  set("map.norm_braid.name", "Viaduto Trançado");
  set("map.norm_braid.badge", "NORMAL // ROTAS CRUZADAS");
  set("map.norm_braid.desc", "Duas pistas entrelaçadas que se cruzam em múltiplos viadutos. Requer cobertura versátil.");

  set("map.norm_pit.name", "Fosso de Fundição");
  set("map.norm_pit.badge", "NORMAL // CRATERA VULCÂNICA");
  set("map.norm_pit.desc", "Trilho circular descendo até um fosso central onde o núcleo está ancorado.");

  set("map.hard_isolated.name", "Setor Isolado 9");
  set("map.hard_isolated.badge", "DIFÍCIL // DOIS NÚCLEOS SEPARADOS");
  set("map.hard_isolated.desc", "Dois núcleos separados exigindo duas fortificações completamente autônomas sem alcance compartilhado.");

  set("map.hard_diagonal.name", "Brecha Diagonal");
  set("map.hard_diagonal.badge", "DIFÍCIL // VELOCIDADE MÁXIMA");
  set("map.hard_diagonal.desc", "Trajeto diagonal curto e direto. Hostis atingem o núcleo em menos de 20s se não forem desacelerados.");

  set("map.hard_express.name", "Linha Férrea Expressa");
  set("map.hard_express.badge", "DIFÍCIL // ALTA VELOCIDADE");
  set("map.hard_express.desc", "Linha expressa com inimigos velozes. Essencial coordenar desaceleração contínua.");

  set("map.hard_split_level.name", "Bifurcação Vertical");
  set("map.hard_split_level.badge", "DIFÍCIL // NÍVEIS ELEVADOS");
  set("map.hard_split_level.desc", "Complexo em múltiplos níveis onde os inimigos caem de dutos de ar diretamente nas plataformas.");

  set("map.hard_blind_alleys.name", "O Labirinto");
  set("map.hard_blind_alleys.badge", "DIFÍCIL // CURVAS CEGAS");
  set("map.hard_blind_alleys.desc", "Labirinto claustrofóbico de placas de aço. Bloqueia linha de visão de torres de longo alcance.");

  set("map.hard_dual_breach.name", "Brecha Dupla Ômega");
  set("map.hard_dual_breach.badge", "DIFÍCIL // HORDA SIMULTÂNEA");
  set("map.hard_dual_breach.desc", "Setor final do complexo. Hordas massivas atacam ambos os flancos em sincronia com chefes de elite.");

  // Turret stats
  set("turret.stat.damage", "DANO");
  set("turret.stat.fireRate", "CAD");
  set("turret.stat.range", "ALCANCE");
  set("turret.stat.aoe", "ÁREA");
  set("turret.stat.slow", "LENTIDÃO");
  set("turret.stat.radius", "RAIO");
  set("turret.stat.allies", "ALIADOS");
  set("turret.stat.every", "A CADA");
  set("turret.stat.buffDamage", "BUFF DANO");
  set("turret.stat.chain", "CORRENTE");
  set("turret.stat.burn", "QUEIMADURA");
  set("turret.stat.singleTarget", "ALVO ÚNICO");
  set("turret.stat.scrapPerWave", "SUCATA");
  set("turret.stat.push", "FORÇA");
  set("turret.stat.stun", "ATORDOAR");

  // Tutorials
  set("tutorial.step.intro.title", "PROTOCOLO DE TREINAMENTO TÁTICO");
  set("tutorial.step.intro.text", "Sua missão: proteger o NÚCLEO ao longo de 12 ondas. Os inimigos avançam por três trilhos industriais. Colete SUCATA dos hostis abatidos, construa torretas e melhore suas rotas para resistir. Pressione [ESPAÇO] para iniciar.");
  set("tutorial.step.intro.hint", "Pressione [ESPAÇO] ou clique aqui para continuar.");

  set("tutorial.step.build.title", "PASSO 1 · CONSTRUIR");
  set("tutorial.step.build.text", "Pressione [E] para abrir o terminal de torretas e selecione a PREGADORA. Depois aponte para o chão com a câmera: o anel verde indica posição válida e o vermelho posição bloqueada. Posicione com o botão esquerdo ou [E].");
  set("tutorial.step.build.hint", "Anel verde próximo ao Núcleo · [E] abre o terminal");

  set("tutorial.step.upgrade.title", "PASSO 2 · MELHORAR");
  set("tutorial.step.upgrade.text", "Aproxime-se da torreta e pressione [E]. Ela possui 3 rotas de melhoria com 4 níveis cada. Suba CADÊNCIA ao nível 2 para desbloquear o CANO DUPLO. Apenas uma rota pode passar do nível 2: escolha sua especialização.");
  set("tutorial.step.upgrade.hint", "Aproxime-se da torreta e pressione [E]");

  set("tutorial.step.synergy.title", "PASSO 3 · SINERGIA");
  set("tutorial.step.synergy.text", "Combine papéis táticos. A GEADA desacelera e agrupa os hostis; a BOMBARDA castiga o grupo com dano em área explosivo. Construa uma de cada perto da rota. Os anéis ciano e laranja são sugestões: posicione onde preferir.");
  set("tutorial.step.synergy.hint", "Construa GEADA + BOMBARDA");

  set("tutorial.step.practice.title", "PASSO 4 · FOGO REAL");
  set("tutorial.step.practice.text", "Uma patrulha hostil se aproxima. Observe como a Geada desacelera o bando enquanto a Bombarda castiga a área. Inimigos abatidos soltam SUCATA que voa em sua direção.");
  set("tutorial.step.practice.hint", "Defenda o núcleo");

  set("tutorial.step.done.title", "TREINAMENTO CONCLUÍDO");
  set("tutorial.step.done.text", "Sinergias avançadas: GEADA (Fragmentação) + dano em área/incendiário (+40%); POSTO DE GUARDA (Juggernaut) + OFICINA (Reparo/Escudo); OFICINA (Sobrecarga) + PREGADORA (Chuva de Balas). Vender devolve 50%. Pressione [ESPAÇO] para iniciar as ondas reais.");
  set("tutorial.step.done.hint", "[ESPAÇO] INICIAR OPERAÇÃO");

  // HUD & Wave
  set("hud.objective.title", "OBJETIVO ATUAL:");
  set("hud.objective.default_td", "Contenha a brecha ({diff})");
  set("hud.objective.default_surv", "Sobreviva à horda: {time}");
  set("hud.objective.purge_boss", "PURGUE {name}");
  set("hud.objective.hostiles_left", "Hostis restantes: {count}");
  set("hud.objective.next_wave_in", "Próxima onda em {time}");
  set("hud.objective.first_wave_prep", "Prepare as defesas // Pressione [F] para iniciar");
  set("hud.objective.rebuilding_operator", "RECONSTRUINDO OPERADOR... SEGURE A POSIÇÃO");
  set("hud.objective.tutorial_active", "TUTORIAL // {step}");
  set("hud.objective.next_boss_in", "Próximo Chefe: {time}");
  set("hud.objective.endgame_active", "PURGA ATIVA: ELIMINE OS HOSTIS RESTANTES");

  set("hud.wave.prep", "PREPARAÇÃO");
  set("hud.wave.in_progress", "ONDA {current}/{total}");
  set("hud.wave.event_badge", "EVENTO // {title}");
  set("hud.wave.surv_endgame", "EXTERMÍNIO ATIVO");
  set("hud.wave.surv_horde", "HORDA ATIVA");
  set("hud.wave.skip_prompt", "PRESSIONE [F] PARA INICIAR");
  set("hud.wave.announcement_boss", "ONDA {wave} // CHEFE SE APROXIMANDO: {boss}");
  set("hud.wave.announcement_progress", "ONDA {wave} / {total} EM ANDAMENTO");
  set("hud.wave.announcement_completed", "ONDA {wave} CONCLUÍDA");
  set("hud.wave.start_wave", "INICIAR ONDA");
  set("hud.wave.skip_pause", "PULAR PAUSA");

  set("hud.turret.interact_prompt", "PRESSIONE [E] PARA MELHORAR / VENDER");
  set("hud.turret.place_valid", "COLOCAR {name} · {cost} SUCATA · [ESC] CANCELAR");
  set("hud.turret.place_invalid", "{reason} · [ESC] CANCELAR");
  set("hud.turret.upgrade_sell", "MELHORAR / VENDER · {name}");
  set("hud.turret.build_turret", "CONSTRUIR TORRETA");

  set("hud.slot.level_short", "NV.{lvl}");
  set("hud.slot.weapon_empty", "Espaço de arma disponível");
  set("hud.slot.passive_empty", "Espaço de implante disponível");
  set("hud.slot.weapon_title", "{name} (Nível +{lvl}) — {desc}");
  set("hud.slot.passive_title", "{name} (Nível +{lvl}): {stat} — {desc}");

  set("hud.player_down.title", "[ OPERADOR ABATIDO // SOBRECARGA DO NÚCLEO -{penalty} VIDAS ]");
  set("hud.player_down.countdown", "RECONSTRUINDO EM {seconds}s...");
  set("hud.player_down.announcement", "OPERADOR ABATIDO // SOBRECARGA DO NÚCLEO (-{penalty} VIDAS)");

  set("hud.core.under_attack", "¡NÚCLEO SOB ATAQUE! // {state}");
  set("hud.core.leak_detected.one", "¡FUGA DETECTADA! -1 VIDA");
  set("hud.core.leak_detected.other", "¡FUGA DETECTADA! -{count} VIDAS");
  set("hud.core.state_stable", "ESTÁVEL");
  set("hud.core.state_alert", "ALERTA");
  set("hud.core.state_critical", "CRÍTICO");
  set("hud.core.integrity", "{hp}/{max} INTEGRIDADE");
  set("hud.core.hostiles_counter", "HOSTIS: {count}");
  set("hud.core.state_free_exploration", "EXPLORAÇÃO LIVRE");
  set("hud.core.state_pause", "PAUSA: {seconds}S");

  set("hud.boss.alert", "ALERTA: {name} NO COMPLEXO");
  set("hud.boss.phase1", "FASE I");
  set("hud.boss.phase2", "FASE II // FRENESI");

  set("hud.teammate_down.tag", "¡COMPANHEIRO ABATIDO!");
  set("hud.teammate_down.title", "¡COMPANHEIRO ABATIDO! -10 VIDAS AO NÚCLEO");
  set("hud.teammate_down.sub", "PENALIDADE AO NÚCLEO // CUBRA A POSIÇÃO DELE");

  set("hud.kinetic.sector_alert", "ALERTA DE SETOR");
  set("hud.kinetic.event_started", "EVENTO INICIADO");

  set("hud.event.emergency_detected", "EMERGÊNCIA DETECTADA");
  set("hud.event.completed_title", "EVENTO CONTIDO");
  set("hud.event.leak_banner_tag", "FUGA NO NÚCLEO DETECTADA");
  set("hud.event.sector_alert_tag", "ALERTA DE SETOR");
  set("hud.event.started_title", "EVENTO INICIADO");
  set("hud.event.survive_sub", "SOBREVIVA POR 75 SEGUNDOS DENTRO DO PERÍMETRO");
  set("hud.event.climax_tag", "CLÍMAX DO EVENTO");
  set("hud.event.phase3_title", "BRECHA DE CONTENÇÃO");
  set("hud.event.phase3_sub", "MUTANTES CRÍTICOS CHEGANDO");
  set("hud.event.secured_tag", "SETOR SEGURO");
  set("hud.event.secured_title", "CONTENÇÃO REESTABELECIDA");
  set("hud.event.secured_sub", "PENALIDADE AO NÚCLEO EVITADA");
  set("hud.event.swarm_growing", "DENSIDADE DO ENXAME AUMENTANDO");
  set("hud.event.defend_prefix", "DEFENDA ");
  set("hud.event.survive_prefix", "SOBREVIVA ");
  set("hud.event.loc_substation_east", "SUBESTAÇÃO LESTE");
  set("hud.event.loc_generator_west", "GERADOR AUXILIAR OESTE");
  set("hud.event.loc_console_north", "CONSOLE DE LOGÍSTICA NORTE");
  set("hud.event.loc_relay_south", "RETRANSMISSOR SUL");
  set("hud.event.loc_containment_zone", "ZONA DE CONTENÇÃO ALFA");
  set("hud.event.title_substation_defended", "SUBESTAÇÃO DEFENDIDA");
  set("hud.event.title_sector_purged", "SETOR PURGADO");
  set("hud.event.phase_format", "FASE {phase}: {title}");
  set("hud.event.inside_perimeter", "● DENTRO DO PERÍMETRO (RAIO 15M)");
  set("hud.event.outside_perimeter", "▲ FORA DO PERÍMETRO (A {dist}m) - RETORNE!");

  // Now for all other keys, we copy/translate from ES/EN
  for (const k of Object.keys(es)) {
    if (!pt[k]) {
      // Map based on key patterns
      if (k.startsWith('turret.')) {
        // Translate turret names/roles/upgrades into Portuguese
        pt[k] = translateTurretKeyPt(k, es[k], en[k]);
      } else if (k.startsWith('ui.')) {
        pt[k] = translateUiKeyPt(k, es[k], en[k]);
      } else {
        pt[k] = es[k];
      }
    }
  }

  // Write out locales/pt-BR.js
  const outLines = ['// Portuguese (Brazil) localization dictionary for Traces of Rust.', 'export default {'];
  const keys = Object.keys(es);
  keys.forEach((k, idx) => {
    const isLast = idx === keys.length - 1;
    outLines.push(`  ${JSON.stringify(k)}: ${JSON.stringify(pt[k] || es[k])}${isLast ? '' : ','}`);
  });
  outLines.push('};');
  outLines.push('');

  fs.writeFileSync('locales/pt-BR.js', outLines.join('\n'), 'utf8');
  console.log(`Generated locales/pt-BR.js with ${keys.length} keys!`);
});

function translateTurretKeyPt(k, esVal, enVal) {
  // Common turret terminology
  if (k.endsWith('.role')) {
    if (esVal === 'DAÑO DIRECTO') return 'DANO DIRETO';
    if (esVal === 'ÁREA') return 'ÁREA';
    if (esVal === 'CONTROL') return 'CONTROLE';
    if (esVal === 'TROPAS ALIADAS') return 'TROPAS ALIADAS';
    if (esVal === 'AMPLIFICADOR') return 'AMPLIFICADOR TÁTICO';
    if (esVal === 'CADENA ELÉCTRICA') return 'CORRENTE ELÉTRICA';
    if (esVal === 'ÁREA INCENDIARIA') return 'ÁREA INCENDIÁRIA';
    if (esVal === 'FRANCOTIRADOR') return 'FRANCO-ATIRADOR';
    if (esVal === 'ECONOMÍA') return 'ECONOMIA';
    if (esVal === 'CONTROL A CORTA DISTANCIA') return 'CONTROLE A CURTA DISTÂNCIA';
    if (esVal === 'DESPLAZAMIENTO') return 'DESLOCAMENTO';
  }

  // Turret names
  if (k === 'turret.gunner.name') return 'PREGADORA';
  if (k === 'turret.mortar.name') return 'BOMBARDA';
  if (k === 'turret.cryo.name') return 'GEADA';
  if (k === 'turret.barracks.name') return 'POSTO DE GUARDA';
  if (k === 'turret.support.name') return 'OFICINA TÁTICA';
  if (k === 'turret.tesla.name') return 'BOBINA DE TESLA';
  if (k === 'turret.incinerator.name') return 'MAÇARICO DE FOSSO';
  if (k === 'turret.railgun.name') return 'CANHÃO ELÉTRICO';
  if (k === 'turret.collector.name') return 'COLETOR DE SUCATA';
  if (k === 'turret.press.name') return 'PRENSA DE TRILHO';
  if (k === 'turret.ejector.name') return 'EJETOR HIDRÁULICO';

  // Replace common Spanish terms with Portuguese
  return esVal
    .replace(/\bdaño\b/gi, 'dano')
    .replace(/\bcadencia\b/gi, 'cadência')
    .replace(/\balcance\b/gi, 'alcance')
    .replace(/\brango\b/gi, 'alcance')
    .replace(/\bchatarra\b/gi, 'sucata')
    .replace(/\bnúcleo\b/gi, 'núcleo')
    .replace(/\boleada\b/gi, 'onda')
    .replace(/\boleadas\b/gi, 'ondas')
    .replace(/\benemigo\b/gi, 'inimigo')
    .replace(/\benemigos\b/gi, 'inimigos')
    .replace(/\bataque\b/gi, 'ataque')
    .replace(/\bataques\b/gi, 'ataques')
    .replace(/\bquemadura\b/gi, 'queimadura')
    .replace(/\bperforación\b/gi, 'perfuração')
    .replace(/\bárea\b/gi, 'área')
    .replace(/\bradio\b/gi, 'raio')
    .replace(/\bvelocidad\b/gi, 'velocidade')
    .replace(/\bempuje\b/gi, 'repulsão')
    .replace(/\baturdimiento\b/gi, 'atordoamento')
    .replace(/\baturde\b/gi, 'atordoa')
    .replace(/\blentitud\b/gi, 'lentidão')
    .replace(/\bralentiza\b/gi, 'desacelera')
    .replace(/\bmejora\b/gi, 'melhoria')
    .replace(/\bmejoras\b/gi, 'melhorias')
    .replace(/\bcoloca\b/gi, 'posiciona')
    .replace(/\bdispara\b/gi, 'dispara')
    .replace(/\bráfaga\b/gi, 'rajada')
    .replace(/\bbalas\b/gi, 'balas')
    .replace(/\bmunición\b/gi, 'munição')
    .replace(/\bhóstiles\b/gi, 'hostis')
    .replace(/\bhostiles\b/gi, 'hostis');
}

function translateUiKeyPt(k, esVal, enVal) {
  // Specific UI mappings
  if (k === 'ui.topbar.sector') return 'SETOR 07-B // TRILHOS DE CONTENÇÃO';
  if (k === 'ui.topbar.teeth') return 'DENTES:';
  if (k === 'ui.topbar.settings') return 'CONFIGURAÇÕES';
  if (k === 'ui.menu.campaign_badge') return '★ CAMPANHA PRINCIPAL // 12 ONDAS';
  if (k === 'ui.menu.arcade_badge') return 'MODO SECUNDÁRIO // AÇÃO RÁPIDA · HORDA INFINITA';
  if (k === 'ui.menu.play') return '[ JOGAR ]';
  if (k === 'ui.menu.play_td') return '[ JOGAR : DEFESA DE TORRES ]';
  if (k === 'ui.menu.play_surv') return '[ JOGAR : SOBREVIVÊNCIA ]';
  if (k === 'ui.menu.tutorial_td') return 'TUTORIAL TD';
  if (k === 'ui.menu.manual') return '[ MANUAL E CONTROLES ]';
  if (k === 'ui.menu.shop') return '[ CLÍNICA / IMPLANTES ]';
  if (k === 'ui.menu.online') return 'MULTIJOGADOR P2P';
  if (k === 'ui.menu.dossier_title') return 'DOSSIÊ DE SERVIÇO';
  if (k === 'ui.menu.dossier_mode_td') return 'DOSSIÊ // DEFESA DE TORRES';
  if (k === 'ui.menu.dossier_mode_surv') return 'DOSSIÊ // SOBREVIVÊNCIA';
  if (k === 'ui.menu.dossier_directive_title') return 'DIRETRIZ TÁTICA:';
  if (k === 'ui.menu.dossier_directive_td') return 'Construa defesas nos trilhos industriais, sobreviva a 12 ondas letais e proteja o reator biomecânico.';
  if (k === 'ui.menu.dossier_directive_surv') return 'Modo secundário de ação rápida: combate direto sem torretas, colete soro e purgue os 5 chefes do complexo.';
  if (k === 'ui.menu.dossier_metric_td') return 'MELHOR ONDA SUPERADA:';
  if (k === 'ui.menu.dossier_metric_surv') return 'MELHOR TEMPO NO COMPLEXO:';
  if (k === 'ui.menu.dossier_runs') return 'INCURSÕES REGISTRADAS:';
  if (k === 'ui.menu.dossier_kills') return 'INIMIGOS ELIMINADOS:';
  if (k === 'ui.menu.dossier_bosses') return 'CHEFES PURGADOS:';
  if (k === 'ui.menu.dossier_upgrades') return 'MELHORIAS ADQUIRIDAS:';
  if (k === 'ui.menu.controls_title') return 'CONTROLES DE CAMPO:';
  if (k === 'ui.menu.controls_desc') return 'WASD - Mover · Mouse - Mirar · Espaço - Pular · Shift - Esquiva · F - Iniciar Onda · E - Torretas · Tab - Mapa';

  if (k === 'ui.settings.title') return 'AJUSTES TÁTICOS';
  if (k === 'ui.settings.save_return') return '[ SALVAR E VOLTAR ]';
  if (k === 'ui.settings.audio_section') return 'SUBSISTEMA DE ÁUDIO';
  if (k === 'ui.settings.master_vol') return 'VOLUME GERAL:';
  if (k === 'ui.settings.sfx_vol') return 'EFEITOS E COMBATE (SFX):';
  if (k === 'ui.settings.music_vol') return 'MÚSICA TÁTICA:';
  if (k === 'ui.settings.amb_vol') return 'AMBIÊNCIA DO COMPLEXO:';
  if (k === 'ui.settings.mute_global') return 'SILENCIAR TODO O ÁUDIO:';
  if (k === 'ui.settings.video_section') return 'SUBSISTEMA DE VÍDEO';
  if (k === 'ui.settings.res_scale') return 'ESCALA DE RENDERIZAÇÃO:';
  if (k === 'ui.settings.res_03') return '0,30x (PIXEL ART · RETRÔ)';
  if (k === 'ui.settings.res_044') return '0,44x (EQUILIBRADO · RÁPIDO)';
  if (k === 'ui.settings.res_065') return '0,65x (DETALHADO · 720p)';
  if (k === 'ui.settings.res_10') return '1,00x (RESOLUÇÃO NATIVA)';
  if (k === 'ui.settings.ui_scale') return 'ESCALA DA INTERFACE:';
  if (k === 'ui.settings.ui_scale_1x') return 'x1 (COMPACTA)';
  if (k === 'ui.settings.ui_scale_2x') return 'x2 (RETRÔ COMPACTO)';
  if (k === 'ui.settings.ui_scale_3x') return 'x3 (HUD PADRÃO)';
  if (k === 'ui.settings.ui_scale_4x') return 'x4 (HUD AMPLIADO)';
  if (k === 'ui.settings.fullscreen') return 'TELA CHEIA EXCLUSIVA:';
  if (k === 'ui.settings.crt') return 'FILTRO CRT E GRANULAÇÃO:';
  if (k === 'ui.settings.crt_grain') return 'FILTRO CRT E GRANULAÇÃO DE FILME:';
  if (k === 'ui.settings.shadows') return 'SOMBRAS DINÂMICAS:';
  if (k === 'ui.settings.shadows_lantern') return 'SOMBRAS DINÂMICAS DA LANTERNA:';
  if (k === 'ui.settings.fps') return 'EXIBIR CONTADOR DE FPS:';
  if (k === 'ui.settings.fov') return 'CAMPO DE VISÃO (FOV):';
  if (k === 'ui.settings.controls_section') return 'CONTROLES E CÂMERA';
  if (k === 'ui.settings.mouse_sens') return 'SENSIBILIDADE DO MOUSE:';
  if (k === 'ui.settings.cam_shake') return 'TREMOR DE TELA:';
  if (k === 'ui.settings.reset_section') return 'GESTÃO DE DADOS';
  if (k === 'ui.settings.btn_reset_defaults') return '[ RESTAURAR PADRÕES ]';
  if (k === 'ui.settings.btn_wipe_save') return '[ APAGAR PROGRESSO SALVO ]';
  if (k === 'ui.settings.language') return 'IDIOMA:';
  if (k === 'ui.settings.language_auto') return 'AUTOMÁTICO (SISTEMA)';

  if (k === 'ui.common.enabled') return 'ATIVADO';
  if (k === 'ui.common.disabled') return 'DESATIVADO';
  if (k === 'ui.common.fullscreen_on') return 'TELA CHEIA';
  if (k === 'ui.common.fullscreen_off') return 'JANELA';
  if (k === 'ui.common.visible') return 'VISÍVEL';
  if (k === 'ui.common.hidden') return 'OCULTO';
  if (k === 'ui.common.none') return 'Nenhuma';
  if (k === 'ui.common.weapons') return 'ARMAS:';
  if (k === 'ui.common.passives') return 'PASSIVAS:';

  if (k === 'ui.pause.title') return 'SIMULAÇÃO SUSPENSA';
  if (k === 'ui.pause.sub') return 'PAUSA TÁTICA';
  if (k === 'ui.pause.resume') return '[ CONTINUAR MISSÃO ]';
  if (k === 'ui.pause.settings') return '[ CONFIGURAÇÕES ]';
  if (k === 'ui.pause.to_menu') return '[ ABORTAR PARA O MENU ]';

  if (k === 'ui.shop.title') return 'MESA DO CIRURGIÃO';
  if (k === 'ui.shop.reserve') return 'RESERVA:';
  if (k === 'ui.shop.sub') return 'ENXERTOS E IMPLANTES PERMANENTES USANDO DENTES EXTRAÍDOS';
  if (k === 'ui.shop.play_now') return '[ ENTRAR DIRETO NO COMPLEXO ]';
  if (k === 'ui.shop.back') return '[ VOLTAR ]';
  if (k === 'ui.shop.max') return 'MÁXIMO';
  if (k === 'ui.shop.buy') return 'COMPRAR ({cost})';
  if (k === 'ui.shop.level_tag') return 'NÍVEL {lvl}/{max}';

  if (k === 'ui.levelup.title') return 'SUBIDA DE NÍVEL';
  if (k === 'ui.levelup.slots') return 'SLOTS: {weapons} ARMAS | {passives} PASSIVAS';
  if (k === 'ui.levelup.sub') return 'PROTOCOLO DE REESTRUTURAÇÃO // ESCOLHA UMA MELHORIA';
  if (k === 'ui.levelup.charges') return 'CARGAS: ';
  if (k === 'ui.levelup.reroll_btn') return '[ ROLAR DE NOVO ]';
  if (k === 'ui.levelup.rerolls_remaining.one') return '({count} rolagem restante)';
  if (k === 'ui.levelup.rerolls_remaining.other') return '({count} rolagens restantes)';
  if (k === 'ui.levelup.rerolls_exhausted') return '(Esgotado)';
  if (k === 'ui.levelup.new_weapon') return 'NOVA ARMA';
  if (k === 'ui.levelup.upgrade_weapon') return 'MELHORIA DE ARMA';
  if (k === 'ui.levelup.new_passive') return 'NOVO IMPLANTE';
  if (k === 'ui.levelup.upgrade_passive') return 'MELHORIA DE IMPLANTE';
  if (k === 'ui.levelup.emergency_supply') return 'SUPRIMENTO DE EMERGÊNCIA';
  if (k === 'ui.levelup.new_tag') return 'NOVO';
  if (k === 'ui.levelup.supply_tag') return 'SUPRIMENTO';
  if (k === 'ui.levelup.affects_player') return 'Afeta: Biometria do jogador';
  if (k === 'ui.levelup.affects_label') return 'Afeta: ';
  if (k === 'ui.levelup.affected_weapons') return 'Armas compatíveis: ';
  if (k === 'ui.levelup.no_compatible_weapons') return 'Nenhuma arma compatível no inventário';

  if (k === 'ui.results.report_title_victory') return 'RELATÓRIO DE CONTENÇÃO // MISSÃO CUMPRIDA';
  if (k === 'ui.results.report_title_td_defeat') return 'BRECHA NA CONTENÇÃO // EVACUAÇÃO FALHOU';
  if (k === 'ui.results.report_title_surv_defeat') return 'ATESTADO DE ÓBITO // DOSSIÊ ENCERRADO';
  if (k === 'ui.results.victory_headline') return 'NÚCLEO PROTEGIDO';
  if (k === 'ui.results.defeat_headline') return 'PACIENTE FALECIDO';
  if (k === 'ui.results.cause_default') return 'CAUSA: DESMEMBRAMENTO NO COMPLEXO INDUSTRIAL';
  if (k === 'ui.results.time_label') return 'TEMPO DE SOBREVIVÊNCIA:';
  if (k === 'ui.results.bosses_label') return 'CHEFES PURGADOS:';
  if (k === 'ui.results.kills_label') return 'INIMIGOS ELIMINADOS:';
  if (k === 'ui.results.run_teeth_label') return 'DENTES EXTRAÍDOS NESTA PARTIDA:';
  if (k === 'ui.results.total_teeth_label') return 'RESERVA TOTAL DE DENTES:';
  if (k === 'ui.results.cycle_label') return 'CICLO FINAL ALCANÇADO:';
  if (k === 'ui.results.cycle_val') return 'CICLO {level}';
  if (k === 'ui.results.td_status_label') return 'ONDAS DEFENDIDAS / VIDAS RESTANTES:';
  if (k === 'ui.results.td_status_val') return '{waves}/{totalWaves} ONDAS · VIDAS: {coreHp}/{coreMaxHp}';
  if (k === 'ui.results.surv_status_label') return 'ESTADO DA FASE FINAL:';
  if (k === 'ui.results.surv_endgame_won') return 'ALCANÇADA (PROTOCOLO 15:00 SUPERADO)';
  if (k === 'ui.results.surv_endgame_lost') return 'ABATIDO ANTES DO MINUTO 15:00';
  if (k === 'ui.results.surv_endgame_not_reached') return 'NÃO ALCANÇADA';
  if (k === 'ui.results.btn_restart') return '[ NOVA EXPEDIÇÃO ]';
  if (k === 'ui.results.btn_menu') return '[ VOLTAR AO MENU ]';
  if (k === 'ui.results.btn_shop') return '[ COMPRAR MELHORIAS PERMANENTES ]';

  if (k === 'ui.map_select.header_tape') return 'DOSSIÊ TÁTICO // SETORES INDUSTRIAIS';
  if (k === 'ui.map_select.title') return 'SELEÇÃO DO SETOR DE DESLOCAMENTO';
  if (k === 'ui.map_select.back') return '[ ◄ VOLTAR AO MENU ]';
  if (k === 'ui.map_select.tab_easy_badge') return 'SETOR INICIAL';
  if (k === 'ui.map_select.tab_easy') return 'FÁCIL';
  if (k === 'ui.map_select.tab_easy_sub') return '150 VIDAS · 1 ENTRADA';
  if (k === 'ui.map_select.tab_norm_badge') return 'SETOR PADRÃO';
  if (k === 'ui.map_select.tab_norm') return 'NORMAL';
  if (k === 'ui.map_select.tab_norm_sub') return '100 VIDAS · 2 ENTRADAS';
  if (k === 'ui.map_select.tab_hard_badge') return 'SETOR CRÍTICO';
  if (k === 'ui.map_select.tab_hard') return 'DIFÍCIL';
  if (k === 'ui.map_select.tab_hard_sub') return '75 VIDAS · 2 SAÍDAS';
  if (k === 'ui.map_select.status_completed') return 'CONCLUÍDO';
  if (k === 'ui.map_select.status_record') return 'REC: {bestWave}/12';
  if (k === 'ui.map_select.status_no_data') return 'SEM DADOS';
  if (k === 'ui.map_select.entrances.one') return '1 ENTRADA';
  if (k === 'ui.map_select.entrances.other') return '{count} ENTRADAS';
  if (k === 'ui.map_select.exits.one') return '1 SAÍDA';
  if (k === 'ui.map_select.exits.other') return '{count} SAÍDAS';
  if (k === 'ui.map_select.diff_label') return 'DIFICULDADE:';
  if (k === 'ui.map_select.lives_label') return 'CONTENÇÃO BASE:';
  if (k === 'ui.map_select.lives_val') return '{count} VIDAS';
  if (k === 'ui.map_select.scrap_label') return 'SUPRIMENTO:';
  if (k === 'ui.map_select.scrap_val') return '{count} SUCATA';
  if (k === 'ui.map_select.layout_label') return 'DISPOSIÇÃO:';
  if (k === 'ui.map_select.layout_val') return '{entrances} ENTRADA(S) / {exits} SAÍDA(S)';
  if (k === 'ui.map_select.deploy_btn') return '[ ENVIAR PARA ESTE SETOR ► ]';
  if (k === 'ui.map_select.deploy_sub') return 'INICIAR OPERAÇÃO // 12 ONDAS';

  if (k === 'ui.char_modal.title') return 'ESCOLHA DE OPERADOR';
  if (k === 'ui.char_modal.sub') return 'ESCOLHA UM OPERADOR COM ARMA, PASSIVA E BIOMETRIA ÚNICAS';
  if (k === 'ui.char_modal.close') return '[X] FECHAR';
  if (k === 'ui.char_modal.weapon') return 'ARMA: {name}';
  if (k === 'ui.char_modal.confirm') return '[ CONFIRMAR OPERADOR E PROSSEGUIR ]';
  if (k === 'ui.char_modal.active') return 'ATIVO';
  if (k === 'ui.char_modal.btn_assigned') return '[ DESIGNADO ]';
  if (k === 'ui.char_modal.btn_select') return '[ SELECIONAR ]';
  if (k === 'ui.char_modal.waiting_peer') return 'O outro jogador ainda está selecionando o personagem...';
  if (k === 'ui.char_modal.assigned_waiting') return '[ OPERADOR DESIGNADO // AGUARDANDO ]';
  if (k === 'ui.char_modal.peer_ready') return 'Companheiro pronto! Selecione seu operador para iniciar.';
  if (k === 'ui.char_modal.all_ready') return 'AMBOS OS OPERADORES PRONTOS! INICIANDO MISSÃO...';
  if (k === 'ui.char_modal.deploying') return '[ ENTRANDO! ]';

  if (k === 'ui.turret_modal.title_place') return 'TERMINAL DE POSICIONAMENTO // TORRETAS';
  if (k === 'ui.turret_modal.title_turret') return 'TORRETA // {name}';
  if (k === 'ui.turret_modal.scrap_pill') return 'SUCATA';
  if (k === 'ui.turret_modal.skip_prep') return '[ INICIAR ONDA (F) ]';
  if (k === 'ui.turret_modal.close') return '[ FECHAR (E) ]';
  if (k === 'ui.turret_modal.footer_tip') return 'CONSTRUA E MELHORE USANDO A SUCATA COLETADA DOS HOSTIS. APENAS UMA ROTA PODE PASSAR DO NÍVEL 2.';
  if (k === 'ui.turret_modal.place_instructions_html') return 'Escolha uma torreta e posicione-a livremente. Ao fechar este painel você poderá mirar no chão: <b>verde</b> = válido, <b>vermelho</b> = bloqueado. Clique esquerdo ou <b>E</b> para colocar; <b>ESC</b> para cancelar.';
  if (k === 'ui.turret_modal.not_enough_scrap') return 'SUCATA INSUFICIENTE';
  if (k === 'ui.turret_modal.max_level') return 'NÍVEL MÁXIMO';
  if (k === 'ui.turret_modal.upgrade_btn') return 'MELHORAR ({cost})';
  if (k === 'ui.turret_modal.integrity') return 'INTEGRIDADE {hp} / {maxHp}';
  if (k === 'ui.turret_modal.btn_switch_build') return 'CONSTRUIR OUTRA TORRETA';
  if (k === 'ui.turret_modal.btn_sell') return 'VENDER (+{refund} SUCATA)';

  if (k === 'ui.tutorial_prompt.tape') return 'PROTOCOLO DE TREINAMENTO';
  if (k === 'ui.tutorial_prompt.title') return 'EXECUTAR TUTORIAL?';
  if (k === 'ui.tutorial_prompt.desc1') return 'Este é seu primeiro contrato de defesa. Você pode fazer um tutorial interativo: aprenderá a posicionar torretas livremente, melhorá-las com rotas no estilo BTD6, coletar SUCATA e combinar sinergias como Geada + Bombarda.';
  if (k === 'ui.tutorial_prompt.desc2') return 'Esta escolha é exibida apenas na primeira vez. Depois você poderá repeti-lo pelo menu principal.';
  if (k === 'ui.tutorial_prompt.yes') return '[ SIM, INICIAR TUTORIAL INTERATIVO ]';
  if (k === 'ui.tutorial_prompt.no') return '[ NÃO, JOGAR DIRETO ]';

  if (k === 'ui.lang_screen.title') return 'SELECIONE SEU IDIOMA';
  if (k === 'ui.lang_screen.subtitle') return 'SELECT YOUR LANGUAGE';
  if (k === 'ui.lang_screen.confirm') return '[ CONTINUAR ]';

  return esVal;
}
