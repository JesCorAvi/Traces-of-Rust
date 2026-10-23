const fs = require('fs');
const es = require('../../temp-es-dict.json');

const fr = {};

function set(k, v) {
  if (k in es) {
    fr[k] = v;
  }
}

// French translation generator
import('../../locales/en.js').then(enMod => {
  const en = enMod.default;

  // Mode
  set("mode.core_defense.title", "TOWER DEFENSE");
  set("mode.core_defense.subtitle", "DÉFENDRE LE CŒUR");
  set("mode.core_defense.badge", "★ CAMPAGNE PRINCIPALE // 12 VAGUES");
  set("mode.core_defense.shortTitle", "TOWER DEFENSE");
  set("mode.core_defense.tagline", "Déployez des défenses sur les voies industrielles, survivez à 12 vagues mortelles et protégez le réacteur biomécanique.");
  set("mode.core_defense.objectiveTitle", "PROTOCOLE DE DÉFENSE");
  set("mode.core_defense.objectiveDefault", "Empêchez les entités d'atteindre le sas du Cœur");
  set("mode.survival.title", "SURVIE");
  set("mode.survival.subtitle", "PURGER LA HORDE");
  set("mode.survival.badge", "MODE SECONDAIRE // ARCADE");
  set("mode.survival.shortTitle", "SURVIE");
  set("mode.survival.tagline", "Mode secondaire d'action rapide : combat direct sans tourelles, récoltez du sérum et purgez les 5 boss du complexe.");
  set("mode.survival.objectiveTitle", "DIRECTIVE DU COMPLEXE");
  set("mode.survival.objectiveDefault", "Trouvez et éliminez les boss du complexe");

  // Diff
  set("diff.facil", "FACILE");
  set("diff.normal", "NORMAL");
  set("diff.dificil", "DIFFICILE");

  // Bosses & Enemies
  set("boss.boss_butcher.name", "L'AMPUTATEUR DE L'USINE");
  set("boss.boss_siren.name", "LA MÈRE DE RONCES");
  set("boss.boss_furnace.name", "AUTOMATE CRÉMATOIRE N° 09");
  set("boss.boss_apostle.name", "L'APÔTRE DE L'ENGRENAGE");
  set("boss.boss_warden.name", "LE GARDIEN DU SECTEUR");

  set("enemy.runner.name", "COUREUR DE VOIE");
  set("enemy.hulk.name", "PRESSE DE CHAIR");
  set("enemy.nest.name", "NID AMBULANT");
  set("enemy.regenerator.name", "SUTUREUR DE PESTE");
  set("enemy.splitter.name", "SCISSIONNAIRE ABERRANT");

  // Rewards
  set("reward.heal_pack.name", "Transfusion d'Urgence");
  set("reward.heal_pack.desc", "Restaure +75 Pouls immédiatement.");
  set("reward.teeth_bag.name", "Sac de Dents Extraites");
  set("reward.teeth_bag.desc", "Confère +15 Dents supplémentaires pour la Table du Chirurgien.");

  // Shop
  set("shop.dmg.name", "Poudre Raffinée");
  set("shop.dmg.desc", "+3% de Dégâts de Base permanents par niveau");
  set("shop.hp.name", "Points de Suture");
  set("shop.hp.desc", "+5 de Pouls Maximum de Base permanent par niveau");
  set("shop.spd.name", "Microdose d'Éphédrine");
  set("shop.spd.desc", "+2% de Vitesse de Déplacement de Base par niveau");
  set("shop.atkSpd.name", "Huile de Mécanismes");
  set("shop.atkSpd.desc", "+2,5% de Cadence de Tir de Base par niveau");
  set("shop.mag.name", "Pinces d'Extraction");
  set("shop.mag.desc", "+0,35m de Portée d'Aimant de Base par niveau");
  set("shop.reroll.name", "Pot-de-vin au Croupier");
  set("shop.reroll.desc", "+1 utilisation supplémentaire du bouton Relancer (Max +3)");

  // Characters
  set("char.otto.title", "Dr. V. Richter");
  set("char.otto.role", "Chirurgien Tactique");
  set("char.otto.desc", "Ancien médecin militaire obsédé par les greffes cybernétiques. Expert en extraction de dents et contrôle de zone.");
  set("char.otto.passive", "Protocole de Dissection");
  set("char.otto.passiveDesc", "+25% de chance supplémentaire d'obtenir des dents et âmes des élites. Démarre avec 1 Relance additionnelle.");
  set("char.otto.weaponTitle", "Scie Rotative");

  set("char.mack.title", "Mack \"Le Marteau\"");
  set("char.mack.role", "Démolisseur Lourd");
  set("char.mack.desc", "Vétéran d'usine doté d'un châssis renforcé. Dévastateur au corps à corps, lent à distance.");
  set("char.mack.passive", "Inertie Balistique");
  set("char.mack.passiveDesc", "+30% de zone de base sur toutes les armes. Recul des projectiles lourds augmenté de 50%.");
  set("char.mack.weaponTitle", "Fusil à Pompe Calibre 12");

  set("char.pepe.title", "Pepe \"Étincelle\"");
  set("char.pepe.role", "Soudeur à l'Arc");
  set("char.pepe.desc", "Électricien clandestin habitué aux décharges haute tension et à la chaleur industrielle extrême.");
  set("char.pepe.passive", "Arc de Surcharge");
  set("char.pepe.passiveDesc", "Les attaques ont 20% de chances de propager un arc électrique vers 2 ennemis proches pour 40% de dégâts.");
  set("char.pepe.weaponTitle", "Chalumeau Thermique");

  set("char.morbo.title", "Morbo");
  set("char.morbo.role", "Vecteur de Peste");
  set("char.morbo.desc", "Sujet survivant d'expériences chimiques. Émet une brume hautement corrosive autour de lui.");
  set("char.morbo.passive", "Exsudat Caustique");
  set("char.morbo.passiveDesc", "Les ennemis dans son aura subissent 15% de ralentissement et perdent 2% de santé max par seconde.");
  set("char.morbo.weaponTitle", "Encensoir de Bile");

  set("char.bob.title", "Bob \"Graisseur\"");
  set("char.bob.role", "Machiniste de Combat");
  set("char.bob.desc", "Spécialiste des pièges au sol, engrenages de précision et détonateurs à pression.");
  set("char.bob.passive", "Réseau de Mines");
  set("char.bob.passiveDesc", "Toutes les 12s, largue automatiquement une mine à shrapnel infligeant 80 dégâts à l'explosion.");
  set("char.bob.weaponTitle", "Mines à Shrapnel");

  set("char.krauss.title", "Krauss");
  set("char.krauss.role", "Bourreau du Secteur");
  set("char.krauss.desc", "Tireur cybernétique équipé d'un harpon pneumatique perforant les cibles en ligne droite.");
  set("char.krauss.passive", "Tension Pneumatique");
  set("char.krauss.passiveDesc", "Les projectiles perforants gagnent +15% de dégâts pour chaque ennemi transpercé.");
  set("char.krauss.weaponTitle", "Harpon Pneumatique");

  set("char.axel.title", "Axel");
  set("char.axel.role", "Coureur de Cage");
  set("char.axel.desc", "Berserker entouré de cages à crochets orbitant autour de lui pour déchiqueter la horde.");
  set("char.axel.passive", "Centrifugeuse Cinétique");
  set("char.axel.passiveDesc", "La vitesse de rotation des cages augmente jusqu'à +40% en courant de manière continue.");
  set("char.axel.weaponTitle", "Cage de Boucher");

  set("char.tesla.title", "Nikola");
  set("char.tesla.role", "Pionnier Statique");
  set("char.tesla.desc", "Fasciné par les circuits industriels. Reconfigure la ferraille en canaux de conduction électrique.");
  set("char.tesla.passive", "Résonance Statique");
  set("char.tesla.passiveDesc", "Éliminer des ennemis électrocutés libère une onde IEM étourdissant les cibles dans un rayon de 3m pendant 0,8s.");
  set("char.tesla.weaponTitle", "Défibrillateur Brisé");

  // Weapons
  set("weapon.slash.name", "Scie d'Amputation");
  set("weapon.slash.desc", "Arc de scie dentelée laissant une traînée sanglante, éclat 3D et fort recul. (Non affectée par +Projectiles).");
  set("weapon.shotgun.name", "Fusil à Pompe Calibre 12");
  set("weapon.shotgun.desc", "Éventail de chevrotine avec flash de départ et éjection d'étui.");
  set("weapon.flamethrower.name", "Chalumeau Incinérateur");
  set("weapon.flamethrower.desc", "Cône continu de flammes éclairant les couloirs et infligeant Brûlure par seconde. (Non affectée par +Projectiles).");
  set("weapon.aura.name", "Encensoir de Bile");
  set("weapon.aura.desc", "Champ corrosif autour du joueur infligeant des dégâts et ralentissant la horde. (Non affectée par +Projectiles).");
  set("weapon.mines.name", "Mines à Shrapnel");
  set("weapon.mines.desc", "Dépose des mines à capteur de proximité rouge qui explosent en zone dès qu'on marche dessus.");
  set("weapon.harpoon.name", "Harpon Pneumatique");
  set("weapon.harpoon.desc", "Projectile lourd perforant plusieurs ennemis en ligne droite.");
  set("weapon.orbital.name", "Cage de Boucher");
  set("weapon.orbital.desc", "Cages de fer ornées de crânes tournant autour du joueur et déchiquetant les rangs.");
  set("weapon.bolt.name", "Défibrillateur Brisé");
  set("weapon.bolt.desc", "Décharge électrique à haute tension sautant entre plusieurs corps. (Non affectée par +Projectiles).");
  set("weapon.chakram.name", "Boomerang de Ferraille");
  set("weapon.chakram.desc", "Disque de scie projeté qui transperce et revient vers l'opérateur en infligeant des dégâts doublés.");
  set("weapon.welder.name", "Soudeur à l'Arc");
  set("weapon.welder.desc", "Charge pendant 2,4s et libère un rayon concentré pendant 1,6s vers la plus forte densité ennemie. (Non affectée par +Projectiles).");
  set("weapon.grenade.name", "Lance-Grenades Pèlerin");
  set("weapon.grenade.desc", "Grenade balistique qui explose en zone et se divise en sous-munitions après amélioration.");
  set("weapon.hammer.name", "Marteau à Piston");
  set("weapon.hammer.desc", "Onde de choc radiale à haute pression infligeant fort recul et étourdissement. (Non affectée par +Projectiles).");
  set("weapon.acid.name", "Fiole d'Acide");
  set("weapon.acid.desc", "Fiole qui éclate en nuage corrosif persistant, faisant fondre et ralentissant les hostiles.");

  set("weapon.short.slash", "Scie");
  set("weapon.short.shotgun", "Fusil");
  set("weapon.short.flamethrower", "Chalumeau");
  set("weapon.short.aura", "Encensoir");
  set("weapon.short.mines", "Mines");
  set("weapon.short.harpoon", "Harpon");
  set("weapon.short.orbital", "Cage");
  set("weapon.short.bolt", "Défibril.");
  set("weapon.short.chakram", "Boomerang");
  set("weapon.short.welder", "Soudeur");
  set("weapon.short.grenade", "Grenades");
  set("weapon.short.hammer", "Marteau");
  set("weapon.short.acid", "Acide");

  // Passives
  set("passive.multishot.name", "Chambre Modifiée");
  set("passive.multishot.desc", "Ajoute +1 projectile aux armes compatibles avec les tirs multiples.");
  set("passive.dmg.name", "Poudre Pressée");
  set("passive.dmg.desc", "Augmente les dégâts de toutes les armes de +15% par niveau.");
  set("passive.atkSpd.name", "Servomoteur Rouillé");
  set("passive.atkSpd.desc", "Augmente la cadence de tir et de rotation de +10% par niveau.");
  set("passive.maxHp.name", "Plaques Chirurgicales");
  set("passive.maxHp.desc", "Augmente le Pouls maximum de +25 et soigne ce montant immédiatement.");
  set("passive.regen.name", "Goutte-à-Goutte IV");
  set("passive.regen.desc", "Régénère continuellement +0,9 de Pouls par seconde.");
  set("passive.moveSpd.name", "Éphédrine Industrielle");
  set("passive.moveSpd.desc", "Augmente la vitesse de déplacement de +8% par niveau.");
  set("passive.area.name", "Shrapnel Élargi");
  set("passive.area.desc", "Augmente la zone et la portée des attaques de +12% par niveau.");
  set("passive.crit.name", "Lentille de Boucher");
  set("passive.crit.desc", "Ajoute +7% de chances d'infliger des dégâts critiques doublés (x2).");
  set("passive.magnet.name", "Aimant de Grue");
  set("passive.magnet.desc", "Augmente le rayon de ramassage du sérum et des dents.");

  set("passive.format.multishot", "+{lvl} PROJ.");
  set("passive.format.dmg", "+{pct}% DÉGÂTS");
  set("passive.format.atkSpd", "+{pct}% CAD.");
  set("passive.format.maxHp", "+{hp} POULS");
  set("passive.format.regen", "+{val} HP/S");
  set("passive.format.moveSpd", "+{pct}% VIT.");
  set("passive.format.area", "+{pct}% ZONE");
  set("passive.format.crit", "+{pct}% CRIT.");
  set("passive.format.magnet", "+{val}M AIMANT");

  // Maps
  set("map.easy_plaza.name", "Place Centrale");
  set("map.easy_plaza.badge", "FACILE // BOUCLE 360°");
  set("map.easy_plaza.desc", "Arène circulaire offrant une excellente vue. Les ennemis parcourent le périmètre avant de converger vers le cœur.");

  set("map.easy_spiral.name", "Descente en Spirale");
  set("map.easy_spiral.badge", "FACILE // SPIRALE CONTINUE");
  set("map.easy_spiral.desc", "Piste continue en spirale avec forte densité de tourelles. Idéale pour les tirs à longue portée et le givre.");

  set("map.easy_serpentine.name", "Tranchée Sinueuse");
  set("map.easy_serpentine.badge", "FACILE // COURBES EN S");
  set("map.easy_serpentine.desc", "Tranchée jalonnée de 5 virages en épingle. Parfaite pour les dégâts de zone et les flammes.");

  set("map.easy_ramps.name", "Rampes de Chargement");
  set("map.easy_ramps.badge", "FACILE // RAMPES ÉLEVÉES");
  set("map.easy_ramps.desc", "Deux rampes industrielles descendantes qui convergent sur un pont central fortifié.");

  set("map.easy_cooling.name", "Circuit de Refroidissement");
  set("map.easy_cooling.badge", "FACILE // DOUBLE ANNEAU");
  set("map.easy_cooling.desc", "Canaux de refroidissement concentriques. Les ennemis traversent le bassin avant d'atteindre le réacteur.");

  set("map.easy_horseshoe.name", "Fer à Cheval d'Acier");
  set("map.easy_horseshoe.badge", "FACILE // GOULET EN U");
  set("map.easy_horseshoe.desc", "Large boucle en U avec plates-formes intérieures surélevées. Concentre les tirs croisés.");

  set("map.norm_twins.name", "Couloirs Jumeaux");
  set("map.norm_twins.badge", "NORMAL // ENTRÉES PARALLÈLES");
  set("map.norm_twins.desc", "Deux couloirs symétriques nécessitant une répartition tactique des tourelles sur les deux flancs.");

  set("map.norm_pincer.name", "Pince Hydraulique");
  set("map.norm_pincer.badge", "NORMAL // ATTAQUE EN PINCE");
  set("map.norm_pincer.desc", "Deux brèches opposées convergeant à 90° vers un cœur central au périmètre réduit.");

  set("map.norm_cross.name", "Carrefour Industriel");
  set("map.norm_cross.badge", "NORMAL // BRÈCHE EN CROIX");
  set("map.norm_cross.desc", "Intersection à quatre voies. Les ennemis attaquent par vagues alternées du nord, sud, est et ouest.");

  set("map.norm_funnel.name", "Entonnoir de Mâchefer");
  set("map.norm_funnel.badge", "NORMAL // GOULET CONVERGENT");
  set("map.norm_funnel.desc", "Trois larges brèches qui se resserrent brutalement en un unique passage fortifié.");

  set("map.norm_braid.name", "Viaduc Tressé");
  set("map.norm_braid.badge", "NORMAL // VOIES ENTRECROISÉES");
  set("map.norm_braid.desc", "Deux voies entrelacées se croisant sur plusieurs ponts. Exige une couverture polyvalente.");

  set("map.norm_pit.name", "Fosse de Fonderie");
  set("map.norm_pit.badge", "NORMAL // CRATÈRE VOLCANIQUE");
  set("map.norm_pit.desc", "Chemin circulaire descendant vers une fosse ardente où repose le cœur du réacteur.");

  set("map.hard_isolated.name", "Secteur Isolé 9");
  set("map.hard_isolated.badge", "DIFFICILE // DOUBLE CŒUR SÉPARÉ");
  set("map.hard_isolated.desc", "Deux cœurs distincts nécessitant deux avant-postes défensifs entièrement autonomes sans portée partagée.");

  set("map.hard_diagonal.name", "Brèche Diagonale");
  set("map.hard_diagonal.badge", "DIFFICILE // SPRINT ULTRARAPIDE");
  set("map.hard_diagonal.desc", "Trajet diagonal direct et court. Les hostiles atteignent le cœur en moins de 20s sans ralentissement.");

  set("map.hard_express.name", "Ligne Ferrée Express");
  set("map.hard_express.badge", "DIFFICILE // SPRINT VÉLOCE");
  set("map.hard_express.desc", "Voie ferroviaire rapide avec ennemis à grande vitesse. Ralentissements indispensables.");

  set("map.hard_split_level.name", "Bifurcation Verticale");
  set("map.hard_split_level.badge", "DIFFICILE // PALIERS MULTIPLES");
  set("map.hard_split_level.desc", "Usine sur plusieurs niveaux où les ennemis tombent des conduits d'aération sur les plates-formes.");

  set("map.hard_blind_alleys.name", "Le Labyrinthe");
  set("map.hard_blind_alleys.badge", "DIFFICILE // COINS MORTS");
  set("map.hard_blind_alleys.desc", "Labyrinthe d'acier claustrophobe. Bloque les lignes de visée des tourelles à longue portée.");

  set("map.hard_dual_breach.name", "Double Brèche Oméga");
  set("map.hard_dual_breach.badge", "DIFFICILE // HORDE SIMULTANÉE");
  set("map.hard_dual_breach.desc", "Secteur final de l'usine. Des hordes massives frappent les deux flancs en parfaite synchronisation avec des boss d'élite.");

  // Turret stats
  set("turret.stat.damage", "DÉGÂTS");
  set("turret.stat.fireRate", "CAD");
  set("turret.stat.range", "PORTÉE");
  set("turret.stat.aoe", "ZONE");
  set("turret.stat.slow", "RALENT.");
  set("turret.stat.radius", "RAYON");
  set("turret.stat.allies", "ALLIÉS");
  set("turret.stat.every", "TOUS LES");
  set("turret.stat.buffDamage", "BUFF DÉGÂTS");
  set("turret.stat.chain", "CHAÎNE");
  set("turret.stat.burn", "BRÛLURE");
  set("turret.stat.singleTarget", "CIBLE UNIQUE");
  set("turret.stat.scrapPerWave", "FERRAILLE");
  set("turret.stat.push", "FORCE");
  set("turret.stat.stun", "ÉTOURDIR");

  // Tutorials
  set("tutorial.step.intro.title", "PROTOCOLE D'ENTRAÎNEMENT TACTIQUE");
  set("tutorial.step.intro.text", "Votre mission : protéger le CŒUR durant 12 vagues. Les ennemis progressent le long de trois voies industrielles. Collectez la FERRAILLE sur les hostiles abattus, construisez des tourelles et améliorez-les pour tenir. Appuyez sur [ESPACE] pour commencer.");
  set("tutorial.step.intro.hint", "Appuyez sur [ESPACE] ou cliquez ici pour continuer.");

  set("tutorial.step.build.title", "ÉTAPE 1 · CONSTRUIRE");
  set("tutorial.step.build.text", "Appuyez sur [E] pour ouvrir le terminal des tourelles et choisissez la CLOUEUSE. Pointez ensuite le sol avec la caméra : anneau vert = position valide, anneau rouge = bloqué. Placez avec clic gauche ou [E].");
  set("tutorial.step.build.hint", "Anneau vert près du Cœur · [E] ouvre le terminal");

  set("tutorial.step.upgrade.title", "ÉTAPE 2 · AMÉLIORER");
  set("tutorial.step.upgrade.text", "Approchez-vous de la tourelle et appuyez sur [E]. Elle dispose de 3 voies d'amélioration de 4 niveaux. Montez la CADENCE au niveau 2 pour débloquer le DOUBLE CANON. Une seule voie peut dépasser le niveau 2 : choisissez votre spécialisation.");
  set("tutorial.step.upgrade.hint", "Approchez-vous de la tourelle et appuyez sur [E]");

  set("tutorial.step.synergy.title", "ÉTAPE 3 · SYNERGIE");
  set("tutorial.step.synergy.text", "Combinez les rôles tactiques. Le GIVRE ralentit et regroupe les hostiles ; la BOMBARDE châtie le groupe avec des dégâts de zone explosifs. Construisez-en une de chaque près de la voie. Les anneaux cyan et orange sont des suggestions : placez-les où vous voulez.");
  set("tutorial.step.synergy.hint", "Construisez GIVRE + BOMBARDE");

  set("tutorial.step.practice.title", "ÉTAPE 4 · TIR RÉEL");
  set("tutorial.step.practice.text", "Une avant-garde hostile approche. Observez comment le Givre freine la meute pendant que la Bombarde pilonne la zone. Les ennemis éliminés laissent de la FERRAILLE qui vole vers vous.");
  set("tutorial.step.practice.hint", "Défendez le cœur");

  set("tutorial.step.done.title", "ENTRAÎNEMENT TERMINÉ");
  set("tutorial.step.done.text", "Synergies avancées : GIVRE (Fracture) + zone/feu (+40%) ; POSTE DE GARDE (Juggernaut) + ATELIER (Bouclier/Réparation) ; ATELIER (Surcharge) + CLOUEUSE (Tempête). La vente rembourse 50%. Appuyez sur [ESPACE] pour lancer l'assaut réel.");
  set("tutorial.step.done.hint", "[ESPACE] COMMENCER L'OPÉRATION");

  // HUD
  set("hud.objective.title", "OBJECTIF ACTUEL :");
  set("hud.objective.default_td", "Tenez la brèche ({diff})");
  set("hud.objective.default_surv", "Survivez à la horde : {time}");
  set("hud.objective.purge_boss", "PURGEZ {name}");
  set("hud.objective.hostiles_left", "Hostiles restants : {count}");
  set("hud.objective.next_wave_in", "Prochaine vague dans {time}");
  set("hud.objective.first_wave_prep", "Préparez les défenses // Appuyez sur [F] pour démarrer");
  set("hud.objective.rebuilding_operator", "RECONSTRUCTION DE L'OPÉRATEUR... TENEZ LA POSITION");
  set("hud.objective.tutorial_active", "TUTORIEL // {step}");
  set("hud.objective.next_boss_in", "Prochain Boss : {time}");
  set("hud.objective.endgame_active", "PURGE ACTIVE : ÉLIMINEZ LES HOSTILES RESTANTS");

  set("hud.wave.prep", "PRÉPARATION");
  set("hud.wave.in_progress", "VAGUE {current}/{total}");
  set("hud.wave.event_badge", "ÉVÉNEMENT // {title}");
  set("hud.wave.surv_endgame", "EXTERMINATION ACTIVE");
  set("hud.wave.surv_horde", "HORDE ACTIVE");
  set("hud.wave.skip_prompt", "APPUYEZ SUR [F] POUR LANCER");
  set("hud.wave.announcement_boss", "VAGUE {wave} // BOSS EN APPROCHE : {boss}");
  set("hud.wave.announcement_progress", "VAGUE {wave} / {total} EN COURS");
  set("hud.wave.announcement_completed", "VAGUE {wave} TERMINÉE");
  set("hud.wave.start_wave", "LANCER LA VAGUE");
  set("hud.wave.skip_pause", "PASSER LA PAUSE");

  set("hud.turret.interact_prompt", "APPUYEZ SUR [E] POUR AMÉLIORER / VENDRE");
  set("hud.turret.place_valid", "PLACER {name} · {cost} FERRAILLE · [ÉCHAP] ANNULER");
  set("hud.turret.place_invalid", "{reason} · [ÉCHAP] ANNULER");
  set("hud.turret.upgrade_sell", "AMÉLIORER / VENDRE · {name}");
  set("hud.turret.build_turret", "CONSTRUIRE TOURELLE");

  set("hud.slot.level_short", "NV.{lvl}");
  set("hud.slot.weapon_empty", "Emplacement d'arme disponible");
  set("hud.slot.passive_empty", "Emplacement d'implant disponible");
  set("hud.slot.weapon_title", "{name} (Niveau +{lvl}) — {desc}");
  set("hud.slot.passive_title", "{name} (Niveau +{lvl}) : {stat} — {desc}");

  set("hud.player_down.title", "[ OPÉRATEUR ABATTU // SURCHARGE DU CŒUR -{penalty} VIES ]");
  set("hud.player_down.countdown", "RECONSTRUCTION DANS {seconds}s...");
  set("hud.player_down.announcement", "OPÉRATEUR ABATTU // SURCHARGE DU CŒUR (-{penalty} VIES)");

  set("hud.core.under_attack", "¡CŒUR SOUS ATTAQUE ! // {state}");
  set("hud.core.leak_detected.one", "¡FUITE DÉTECTÉE ! -1 VIE");
  set("hud.core.leak_detected.other", "¡FUITE DÉTECTÉE ! -{count} VIES");
  set("hud.core.state_stable", "STABLE");
  set("hud.core.state_alert", "ALERTE");
  set("hud.core.state_critical", "CRITIQUE");
  set("hud.core.integrity", "{hp}/{max} INTÉGRITÉ");
  set("hud.core.hostiles_counter", "HOSTILES : {count}");
  set("hud.core.state_free_exploration", "EXPLORATION LIBRE");
  set("hud.core.state_pause", "PAUSE : {seconds}S");

  set("hud.boss.alert", "ALERTE : {name} SUR LE PONT");
  set("hud.boss.phase1", "PHASE I");
  set("hud.boss.phase2", "PHASE II // FRÉNÉSIE");

  set("hud.teammate_down.tag", "¡COÉQUIPIER ABATTU !");
  set("hud.teammate_down.title", "¡COÉQUIPIER ABATTU ! -10 VIES AU CŒUR");
  set("hud.teammate_down.sub", "PÉNALITÉ AU CŒUR // COUVREZ SA POSITION");

  set("hud.kinetic.sector_alert", "ALERTE DE SECTEUR");
  set("hud.kinetic.event_started", "ÉVÉNEMENT INITIÉ");

  set("hud.event.emergency_detected", "URGENCE DÉTECTÉE");
  set("hud.event.completed_title", "ÉVÉNEMENT SÉCURISÉ");
  set("hud.event.leak_banner_tag", "FUITE DANS LE CŒUR");
  set("hud.event.sector_alert_tag", "ALERTE DE SECTEUR");
  set("hud.event.started_title", "ÉVÉNEMENT DÉCLENCHÉ");
  set("hud.event.survive_sub", "SURVIVEZ PENDANT 75 SECONDES DANS LE PÉRIMÈTRE");
  set("hud.event.climax_tag", "CLIMAX DE L'ÉVÉNEMENT");
  set("hud.event.phase3_title", "BRÈCHE DE CONFINEMENT");
  set("hud.event.phase3_sub", "MUTANTS CRITIQUES EN APPROCHE");
  set("hud.event.secured_tag", "SECTEUR SÉCURISÉ");
  set("hud.event.secured_title", "CONFINEMENT RÉTABLI");
  set("hud.event.secured_sub", "PÉNALITÉ AU CŒUR ÉVITÉE");
  set("hud.event.swarm_growing", "DENSITÉ DE L'ESSAIM EN HAUSSE");
  set("hud.event.defend_prefix", "DÉFENDEZ ");
  set("hud.event.survive_prefix", "SURVIVEZ ");
  set("hud.event.loc_substation_east", "SOUS-STATION EST");
  set("hud.event.loc_generator_west", "GÉNÉRATEUR AUXILIAIRE OUEST");
  set("hud.event.loc_console_north", "CONSOLE DE LOGISTIQUE NORD");
  set("hud.event.loc_relay_south", "RELAIS SUD");
  set("hud.event.loc_containment_zone", "ZONE DE CONFINEMENT ALPHA");
  set("hud.event.title_substation_defended", "SOUS-STATION DÉFENDUE");
  set("hud.event.title_sector_purged", "SECTEUR PURGÉ");
  set("hud.event.phase_format", "PHASE {phase} : {title}");
  set("hud.event.inside_perimeter", "● DANS LE PÉRIMÈTRE (RAYON 15M)");
  set("hud.event.outside_perimeter", "▲ HORS DU PÉRIMÈTRE (À {dist}m) - REVENEZ !");

  // Fill in other keys
  for (const k of Object.keys(es)) {
    if (!fr[k]) {
      if (k.startsWith('turret.')) {
        fr[k] = translateTurretKeyFr(k, es[k], en[k]);
      } else if (k.startsWith('ui.')) {
        fr[k] = translateUiKeyFr(k, es[k], en[k]);
      } else {
        fr[k] = en[k] || es[k];
      }
    }
  }

  // Write locales/fr.js
  const outLines = ['// French localization dictionary for Crabs wants your food!.', 'export default {'];
  const keys = Object.keys(es);
  keys.forEach((k, idx) => {
    const isLast = idx === keys.length - 1;
    outLines.push(`  ${JSON.stringify(k)}: ${JSON.stringify(fr[k] || es[k])}${isLast ? '' : ','}`);
  });
  outLines.push('};');
  outLines.push('');

  fs.writeFileSync('locales/fr.js', outLines.join('\n'), 'utf8');
  console.log(`Generated locales/fr.js with ${keys.length} keys!`);
});

function translateTurretKeyFr(k, esVal, enVal) {
  if (k.endsWith('.role')) {
    if (esVal === 'DAÑO DIRECTO') return 'DÉGÂTS DIRECTS';
    if (esVal === 'ÁREA') return 'ZONE';
    if (esVal === 'CONTROL') return 'CONTRÔLE';
    if (esVal === 'TROPAS ALIADAS') return 'TROUPES ALLIÉES';
    if (esVal === 'AMPLIFICADOR') return 'AMPLIFICATEUR TACTIQUE';
    if (esVal === 'CADENA ELÉCTRICA') return 'CHAÎNE ÉLECTRIQUE';
    if (esVal === 'ÁREA INCENDIARIA') return 'ZONE INCENDIAIRE';
    if (esVal === 'FRANCOTIRADOR') return 'TIREUR D\'ÉLITE';
    if (esVal === 'ECONOMÍA') return 'ÉCONOMIE';
    if (esVal === 'CONTROL A CORTA DISTANCIA') return 'CONTRÔLE AU CONTACT';
    if (esVal === 'DESPLAZAMIENTO') return 'DÉPLACEMENT';
  }

  if (k === 'turret.gunner.name') return 'CLOUEUSE';
  if (k === 'turret.mortar.name') return 'BOMBARDE';
  if (k === 'turret.cryo.name') return 'GIVRE';
  if (k === 'turret.barracks.name') return 'POSTE DE GARDE';
  if (k === 'turret.support.name') return 'ATELIER TACTIQUE';
  if (k === 'turret.tesla.name') return 'BOBINE TESLA';
  if (k === 'turret.incinerator.name') return 'LANCE-FLAMMES DE FOSSE';
  if (k === 'turret.railgun.name') return 'CANON ÉLECTROMAGNÉTIQUE';
  if (k === 'turret.collector.name') return 'RÉCOLTEUR DE FERRAILLE';
  if (k === 'turret.press.name') return 'PRESSE DE VOIE';
  if (k === 'turret.ejector.name') return 'ÉJECTEUR HYDRAULIQUE';

  return esVal
    .replace(/\bdaño\b/gi, 'dégâts')
    .replace(/\bcadencia\b/gi, 'cadence')
    .replace(/\balcance\b/gi, 'portée')
    .replace(/\brango\b/gi, 'portée')
    .replace(/\bchatarra\b/gi, 'ferraille')
    .replace(/\bnúcleo\b/gi, 'cœur')
    .replace(/\boleada\b/gi, 'vague')
    .replace(/\boleadas\b/gi, 'vagues')
    .replace(/\benemigo\b/gi, 'ennemi')
    .replace(/\benemigos\b/gi, 'ennemis')
    .replace(/\bataque\b/gi, 'attaque')
    .replace(/\bataques\b/gi, 'attaques')
    .replace(/\bquemadura\b/gi, 'brûlure')
    .replace(/\bperforación\b/gi, 'transpercement')
    .replace(/\bárea\b/gi, 'zone')
    .replace(/\bradio\b/gi, 'rayon')
    .replace(/\bvelocidad\b/gi, 'vitesse')
    .replace(/\bempuje\b/gi, 'recul')
    .replace(/\baturdimiento\b/gi, 'étourdissement')
    .replace(/\baturde\b/gi, 'étourdit')
    .replace(/\bralentiza\b/gi, 'ralentit')
    .replace(/\bmejora\b/gi, 'amélioration')
    .replace(/\bmejoras\b/gi, 'améliorations')
    .replace(/\bcoloca\b/gi, 'place')
    .replace(/\bdispara\b/gi, 'tire')
    .replace(/\bráfaga\b/gi, 'rafale')
    .replace(/\bbalas\b/gi, 'balles')
    .replace(/\bmunición\b/gi, 'munitions')
    .replace(/\bhóstiles\b/gi, 'hostiles')
    .replace(/\bhostiles\b/gi, 'hostiles');
}

function translateUiKeyFr(k, esVal, enVal) {
  if (k === 'ui.topbar.sector') return 'SECTEUR 07-B // VOIES DE CONFINEMENT';
  if (k === 'ui.topbar.teeth') return 'DENTS :';
  if (k === 'ui.topbar.settings') return 'PARAMÈTRES';
  if (k === 'ui.menu.campaign_badge') return '★ CAMPAGNE PRINCIPALE // 12 VAGUES';
  if (k === 'ui.menu.arcade_badge') return 'MODE SECONDAIRE // ACTION RAPIDE · HORDE INFINIE';
  if (k === 'ui.menu.play') return '[ JOUER ]';
  if (k === 'ui.menu.play_td') return '[ JOUER : TOWER DEFENSE ]';
  if (k === 'ui.menu.play_surv') return '[ JOUER : SURVIE ]';
  if (k === 'ui.menu.tutorial_td') return 'TUTORIEL TD';
  if (k === 'ui.menu.manual') return '[ MANUEL & CONTRÔLES ]';
  if (k === 'ui.menu.shop') return '[ CLINIQUE / IMPLANTS ]';
  if (k === 'ui.menu.online') return 'MULTIJOUEUR P2P';
  if (k === 'ui.menu.dossier_title') return 'DOSSIER DE SERVICE';
  if (k === 'ui.menu.dossier_mode_td') return 'DOSSIER // TOWER DEFENSE';
  if (k === 'ui.menu.dossier_mode_surv') return 'DOSSIER // SURVIE';
  if (k === 'ui.menu.dossier_directive_title') return 'DIRECTIVE TACTIQUE :';
  if (k === 'ui.menu.dossier_directive_td') return 'Déployez des défenses sur les voies industrielles, survivez à 12 vagues mortelles et protégez le réacteur biomécanique.';
  if (k === 'ui.menu.dossier_directive_surv') return 'Mode secondaire d\'action rapide : combat direct sans tourelles, récoltez du sérum et purgez les 5 boss du complexe.';
  if (k === 'ui.menu.dossier_metric_td') return 'MEILLEURE VAGUE DÉFENDUE :';
  if (k === 'ui.menu.dossier_metric_surv') return 'MEILLEUR TEMPS DE SURVIE :';
  if (k === 'ui.menu.dossier_runs') return 'EXPÉDITIONS ENREGISTRÉES :';
  if (k === 'ui.menu.dossier_kills') return 'HOSTILES ÉLIMINÉS :';
  if (k === 'ui.menu.dossier_bosses') return 'BOSS PURGÉS :';
  if (k === 'ui.menu.dossier_upgrades') return 'IMPLANTS ACQUIS :';
  if (k === 'ui.menu.controls_title') return 'COMMANDES DU TERRAIN :';
  if (k === 'ui.menu.controls_desc') return 'WASD - Déplacer · Souris - Viser · Espace - Sauter · Shift - Roulade · F - Lancer Vague · E - Tourelles · Tab - Carte';

  if (k === 'ui.settings.title') return 'PARAMÈTRES TACTIQUES';
  if (k === 'ui.settings.save_return') return '[ ENREGISTRER & RETOUR ]';
  if (k === 'ui.settings.audio_section') return 'SOUS-SYSTÈME AUDIO';
  if (k === 'ui.settings.master_vol') return 'VOLUME GÉNÉRAL :';
  if (k === 'ui.settings.sfx_vol') return 'EFFETS & COMBAT (SFX) :';
  if (k === 'ui.settings.music_vol') return 'MUSIQUE ADAPTATIVE :';
  if (k === 'ui.settings.amb_vol') return 'AMBIANCE DE L\'USINE :';
  if (k === 'ui.settings.mute_global') return 'COUPER TOUT L\'AUDIO :';
  if (k === 'ui.settings.video_section') return 'SOUS-SYSTÈME VIDÉO';
  if (k === 'ui.settings.res_scale') return 'ÉCHELLE DE RENDU :';
  if (k === 'ui.settings.res_03') return '0,30x (PIXEL ART · RÉTRO)';
  if (k === 'ui.settings.res_044') return '0,44x (ÉQUILIBRÉ · RAPIDE)';
  if (k === 'ui.settings.res_065') return '0,65x (DÉTAILLÉ · 720p)';
  if (k === 'ui.settings.res_10') return '1,00x (RÉSOLUTION NATIVE)';
  if (k === 'ui.settings.ui_scale') return 'ÉCHELLE D\'INTERFACE :';
  if (k === 'ui.settings.ui_scale_1x') return 'x1 (COMPACTE)';
  if (k === 'ui.settings.ui_scale_2x') return 'x2 (RÉTRO COMPACT)';
  if (k === 'ui.settings.ui_scale_3x') return 'x3 (HUD STANDARD)';
  if (k === 'ui.settings.ui_scale_4x') return 'x4 (HUD AGRANDI)';
  if (k === 'ui.settings.fullscreen') return 'PLEIN ÉCRAN EXCLUSIF :';
  if (k === 'ui.settings.crt') return 'FILTRE CRT & GRAIN DU FILM :';
  if (k === 'ui.settings.crt_grain') return 'FILTRE CRT & GRAIN DU FILM :';
  if (k === 'ui.settings.shadows') return 'OMBRES DYNAMIQUES :';
  if (k === 'ui.settings.shadows_lantern') return 'OMBRES DYNAMIQUES DU MONDE :';
  if (k === 'ui.settings.fps') return 'AFFICHER LE COMPTEUR DE FPS :';
  if (k === 'ui.settings.fov') return 'CHAMP DE VISION (FOV) :';
  if (k === 'ui.settings.controls_section') return 'COMMANDES & CAMÉRA';
  if (k === 'ui.settings.mouse_sens') return 'SENSIBILITÉ SOURIS :';
  if (k === 'ui.settings.cam_shake') return 'SECOUSSE D\'ÉCRAN :';
  if (k === 'ui.settings.reset_section') return 'GESTION DES DONNÉES';
  if (k === 'ui.settings.btn_reset_defaults') return '[ RÉINITIALISER PARAMÈTRES ]';
  if (k === 'ui.settings.btn_wipe_save') return '[ EFFACER PROGRESSION ]';
  if (k === 'ui.settings.language') return 'LANGUE :';
  if (k === 'ui.settings.language_auto') return 'AUTOMATIQUE (SYSTÈME)';

  if (k === 'ui.common.enabled') return 'ACTIVÉ';
  if (k === 'ui.common.disabled') return 'DÉSACTIVÉ';
  if (k === 'ui.common.fullscreen_on') return 'PLEIN ÉCRAN';
  if (k === 'ui.common.fullscreen_off') return 'FENÊTRÉ';
  if (k === 'ui.common.visible') return 'VISIBLE';
  if (k === 'ui.common.hidden') return 'MASQUÉ';
  if (k === 'ui.common.none') return 'Aucune';
  if (k === 'ui.common.weapons') return 'ARMES :';
  if (k === 'ui.common.passives') return 'PASSIFS :';

  if (k === 'ui.pause.title') return 'SIMULATION SUSPENDUE';
  if (k === 'ui.pause.sub') return 'PAUSE TACTIQUE';
  if (k === 'ui.pause.resume') return '[ REPRENDRE LA MISSION ]';
  if (k === 'ui.pause.settings') return '[ PARAMÈTRES ]';
  if (k === 'ui.pause.to_menu') return '[ RETOUR AU MENU PRINCIPAL ]';

  if (k === 'ui.shop.title') return 'TABLE DU CHIRURGIEN';
  if (k === 'ui.shop.reserve') return 'RÉSERVE :';
  if (k === 'ui.shop.sub') return 'GREFFES & IMPLANTS PERMANENTS CONTRE DENTS EXTRAITES';
  if (k === 'ui.shop.play_now') return '[ ENTRER DIRECTEMENT DANS L\'USINE ]';
  if (k === 'ui.shop.back') return '[ RETOUR ]';
  if (k === 'ui.shop.max') return 'MAXIMUM';
  if (k === 'ui.shop.buy') return 'ACHETER ({cost})';
  if (k === 'ui.shop.level_tag') return 'NIVEAU {lvl}/{max}';

  if (k === 'ui.levelup.title') return 'MONTÉE DE NIVEAU';
  if (k === 'ui.levelup.slots') return 'SLOTS : {weapons} ARMES | {passives} PASSIFS';
  if (k === 'ui.levelup.sub') return 'PROTOCOLE DE RESTRUCTURATION // CHOISISSEZ UNE AMÉLIORATION';
  if (k === 'ui.levelup.charges') return 'CHARGES : ';
  if (k === 'ui.levelup.reroll_btn') return '[ RELANCER ]';
  if (k === 'ui.levelup.rerolls_remaining.one') return '({count} relance restante)';
  if (k === 'ui.levelup.rerolls_remaining.other') return '({count} relances restantes)';
  if (k === 'ui.levelup.rerolls_exhausted') return '(Épuisé)';
  if (k === 'ui.levelup.new_weapon') return 'NOUVELLE ARME';
  if (k === 'ui.levelup.upgrade_weapon') return 'AMÉLIORATION D\'ARME';
  if (k === 'ui.levelup.new_passive') return 'NOUVEL IMPLANT';
  if (k === 'ui.levelup.upgrade_passive') return 'AMÉLIORATION D\'IMPLANT';
  if (k === 'ui.levelup.emergency_supply') return 'RAVITAILLEMENT D\'URGENCE';
  if (k === 'ui.levelup.new_tag') return 'NOUVEAU';
  if (k === 'ui.levelup.supply_tag') return 'SECOURS';
  if (k === 'ui.levelup.affects_player') return 'Concerne : Biométrie de l\'opérateur';
  if (k === 'ui.levelup.affects_label') return 'Concerne : ';
  if (k === 'ui.levelup.affected_weapons') return 'Armes compatibles : ';
  if (k === 'ui.levelup.no_compatible_weapons') return 'Aucune arme compatible dans l\'inventaire';

  if (k === 'ui.results.report_title_victory') return 'RAPPORT DE CONFINEMENT // OPÉRATION RÉUSSIE';
  if (k === 'ui.results.report_title_td_defeat') return 'BRÈCHE DE CONFINEMENT // ÉVACUATION ÉCHOUÉE';
  if (k === 'ui.results.report_title_surv_defeat') return 'CERTIFICAT DE DÉCÈS // DOSSIER CLOS';
  if (k === 'ui.results.victory_headline') return 'CŒUR SÉCURISÉ';
  if (k === 'ui.results.defeat_headline') return 'PATIENT DÉCÉDÉ';
  if (k === 'ui.results.cause_default') return 'CAUSE : DÉMEMBREMENT DANS L\'USINE INDUSTRIELLE';
  if (k === 'ui.results.time_label') return 'TEMPS DE SURVIE :';
  if (k === 'ui.results.bosses_label') return 'BOSS PURGÉS :';
  if (k === 'ui.results.kills_label') return 'HOSTILES ÉLIMINÉS :';
  if (k === 'ui.results.run_teeth_label') return 'DENTS EXTRAITES CETTE EXPÉDITION :';
  if (k === 'ui.results.total_teeth_label') return 'RÉSERVE TOTALE DE DENTS :';
  if (k === 'ui.results.cycle_label') return 'CYCLE FINAL ATTEINT :';
  if (k === 'ui.results.cycle_val') return 'CYCLE {level}';
  if (k === 'ui.results.td_status_label') return 'VAGUES DÉFENDUES / VIES RESTANTES :';
  if (k === 'ui.results.td_status_val') return '{waves}/{totalWaves} VAGUES · VIES : {coreHp}/{coreMaxHp}';
  if (k === 'ui.results.surv_status_label') return 'STATUT DE PHASE FINALE :';
  if (k === 'ui.results.surv_endgame_won') return 'ATTEINT (PROTOCOLE 15:00 DÉPASSÉ)';
  if (k === 'ui.results.surv_endgame_lost') return 'TOMBÉ AVANT LA MINUTE 15:00';
  if (k === 'ui.results.surv_endgame_not_reached') return 'NON ATTEINT';
  if (k === 'ui.results.btn_restart') return '[ NOUVELLE EXPÉDITION ]';
  if (k === 'ui.results.btn_menu') return '[ RETOUR AU MENU ]';
  if (k === 'ui.results.btn_shop') return '[ ACHETER AMÉLIORATIONS PERMANENTES ]';

  if (k === 'ui.map_select.header_tape') return 'DOSSIER TACTIQUE // SECTEURS INDUSTRIELS';
  if (k === 'ui.map_select.title') return 'SÉLECTION DU SECTEUR DE DÉPLOIEMENT';
  if (k === 'ui.map_select.back') return '[ ◄ RETOUR AU MENU ]';
  if (k === 'ui.map_select.tab_easy_badge') return 'SECTEUR D\'OUVERTURE';
  if (k === 'ui.map_select.tab_easy') return 'FACILE';
  if (k === 'ui.map_select.tab_easy_sub') return '150 VIES · 1 ENTRÉE';
  if (k === 'ui.map_select.tab_norm_badge') return 'SECTEUR STANDARD';
  if (k === 'ui.map_select.tab_norm') return 'NORMAL';
  if (k === 'ui.map_select.tab_norm_sub') return '100 VIES · 2 ENTRÉES';
  if (k === 'ui.map_select.tab_hard_badge') return 'SECTEUR CRITIQUE';
  if (k === 'ui.map_select.tab_hard') return 'DIFFICILE';
  if (k === 'ui.map_select.tab_hard_sub') return '75 VIES · 2 SORTIES';
  if (k === 'ui.map_select.status_completed') return 'ACCOMPLI';
  if (k === 'ui.map_select.status_record') return 'REC : {bestWave}/12';
  if (k === 'ui.map_select.status_no_data') return 'SANS DONNÉES';
  if (k === 'ui.map_select.entrances.one') return '1 ENTRÉE';
  if (k === 'ui.map_select.entrances.other') return '{count} ENTRÉES';
  if (k === 'ui.map_select.exits.one') return '1 SORTIE';
  if (k === 'ui.map_select.exits.other') return '{count} SORTIES';
  if (k === 'ui.map_select.diff_label') return 'DIFFICULTÉ :';
  if (k === 'ui.map_select.lives_label') return 'CONFINEMENT BASE :';
  if (k === 'ui.map_select.lives_val') return '{count} VIES';
  if (k === 'ui.map_select.scrap_label') return 'APPROVISIONNEMENT :';
  if (k === 'ui.map_select.scrap_val') return '{count} FERRAILLE';
  if (k === 'ui.map_select.layout_label') return 'DISPOSITION :';
  if (k === 'ui.map_select.layout_val') return '{entrances} ENTRÉE(S) / {exits} SORTIE(S)';
  if (k === 'ui.map_select.deploy_btn') return '[ DÉPLOYER SUR CE SECTEUR ► ]';
  if (k === 'ui.map_select.deploy_sub') return 'LANCER L\'OPÉRATION // 12 VAGUES';

  if (k === 'ui.char_modal.title') return 'SÉLECTION D\'OPÉRATEUR';
  if (k === 'ui.char_modal.sub') return 'CHOISISSEZ UN OPÉRATEUR AUX ARMES, PASSIFS ET BIOMÉTRIE UNIQUES';
  if (k === 'ui.char_modal.close') return '[X] FERMER';
  if (k === 'ui.char_modal.weapon') return 'ARME : {name}';
  if (k === 'ui.char_modal.confirm') return '[ ASSIGNER OPÉRATEUR & CONTINUER ]';
  if (k === 'ui.char_modal.active') return 'ACTIF';
  if (k === 'ui.char_modal.btn_assigned') return '[ ASSIGNÉ ]';
  if (k === 'ui.char_modal.btn_select') return '[ SÉLECTIONNER ]';
  if (k === 'ui.char_modal.waiting_peer') return 'Le coéquipier choisit son opérateur...';
  if (k === 'ui.char_modal.assigned_waiting') return '[ OPÉRATEUR CHOISI // EN ATTENTE ]';
  if (k === 'ui.char_modal.peer_ready') return 'Coéquipier prêt ! Choisissez votre opérateur pour débuter.';
  if (k === 'ui.char_modal.all_ready') return 'LES DEUX OPÉRATEURS SONT PRÊTS ! DÉPLOIEMENT...';
  if (k === 'ui.char_modal.deploying') return '[ EN COURS DE DÉPLOIEMENT ! ]';

  if (k === 'ui.turret_modal.title_place') return 'TERMINAL D\'EMPLACEMENT // TOURELLES';
  if (k === 'ui.turret_modal.title_turret') return 'TOURELLE // {name}';
  if (k === 'ui.turret_modal.scrap_pill') return 'FERRAILLE';
  if (k === 'ui.turret_modal.skip_prep') return '[ LANCER LA VAGUE (F) ]';
  if (k === 'ui.turret_modal.close') return '[ FERMER (E) ]';
  if (k === 'ui.turret_modal.footer_tip') return 'CONSTRUISEZ ET AMÉLIOREZ GRÂCE À LA FERRAILLE RÉCOLTÉE. UNE SEULE VOIE PEUT DÉPASSER LE NIVEAU 2.';
  if (k === 'ui.turret_modal.place_instructions_html') return 'Choisissez une tourelle et placez-la librement. À la fermeture, visez le sol : <b>vert</b> = valide, <b>rouge</b> = bloqué. Clic gauche ou <b>E</b> pour poser ; <b>ÉCHAP</b> pour annuler.';
  if (k === 'ui.turret_modal.not_enough_scrap') return 'FERRAILLE INSUFFISANTE';
  if (k === 'ui.turret_modal.max_level') return 'NIVEAU MAXIMUM';
  if (k === 'ui.turret_modal.upgrade_btn') return 'AMÉLIORER ({cost})';
  if (k === 'ui.turret_modal.integrity') return 'INTÉGRITÉ {hp} / {maxHp}';
  if (k === 'ui.turret_modal.btn_switch_build') return 'CONSTRUIRE UNE AUTRE TOURELLE';
  if (k === 'ui.turret_modal.btn_sell') return 'VENDRE (+{refund} FERRAILLE)';

  if (k === 'ui.tutorial_prompt.tape') return 'PROTOCOLE D\'INSTRUCTION';
  if (k === 'ui.tutorial_prompt.title') return 'EXÉCUTER LE TUTORIEL ?';
  if (k === 'ui.tutorial_prompt.desc1') return 'C\'est votre premier contrat de défense. Vous pouvez suivre un didacticiel interactif : vous apprendrez à déployer librement vos tourelles, à les améliorer via des embranchements tactiques, à ramasser la FERRAILLE et à exploiter les synergies Givre + Bombarde.';
  if (k === 'ui.tutorial_prompt.desc2') return 'Ce choix n\'est proposé que lors de votre premier lancement. Vous pourrez le rejouer plus tard depuis le menu principal.';
  if (k === 'ui.tutorial_prompt.yes') return '[ OUI, LANCER LE TUTORIEL INTERACTIF ]';
  if (k === 'ui.tutorial_prompt.no') return '[ NON, JOUER DIRECTEMENT ]';

  if (k === 'ui.lang_screen.title') return 'SÉLECTIONNEZ VOTRE LANGUE';
  if (k === 'ui.lang_screen.subtitle', 'SELECT YOUR LANGUAGE');
  if (k === 'ui.lang_screen.confirm') return '[ CONTINUER ]';

  return enVal || esVal;
}
