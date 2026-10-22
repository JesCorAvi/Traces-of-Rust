const fs = require('fs');
const es = require('../../temp-es-dict.json');

const en = {};

// Helper to assign translations
function set(key, val) {
  if (!(key in es)) {
    console.warn('Key not in es:', key);
  }
  en[key] = val;
}

// ==================== UI & MENUS ====================
set("ui.loading.title", "Traces of Rust");
set("ui.loading.sub", "TACTICAL HORROR · CORE DEFENSE & SURVIVAL");
set("ui.loading.status_init", "CALIBRATING BIO-CONTAINMENT SENSORS...");
set("ui.loading.tip", "TIP: Position turrets near choke points and collect scrap promptly.");
set("ui.loading.step_engine", "INITIALIZING GRAPHICS ENGINE & ATLAS...");
set("ui.loading.step_resources", "CONFIGURING ASSETS & OPERATORS...");
set("ui.loading.step_shaders", "COMPILING SHADERS & GPU BUFFERS...");
set("ui.loading.step_vram", "PRE-WARMING TEXTURES IN VRAM...");
set("ui.loading.step_ready", "SYSTEMS OPERATIONAL // ENTERING FACILITY");

set("ui.topbar.version", "v0.9.8b");
set("ui.topbar.fullscreen", "FULLSCREEN");
set("ui.topbar.fps", "FPS: --");
set("ui.topbar.souls_title", "Souls collected");
set("ui.topbar.teeth_title", "Extracted teeth (Clinic currency)");

set("ui.menu.title", "Traces of Rust");
set("ui.menu.tagline", "TACTICAL HORROR · CORE DEFENSE & SURVIVAL");
set("ui.menu.mode_badge", "CAMPAIGN // CORE DEFENSE");
set("ui.menu.mode_card_title", "TACTICAL DEFENSE");
set("ui.menu.mode_card_desc", "Deploy turrets, manage scrap economy, and protect the reactor across 12 waves.");
set("ui.menu.play", "[ PLAY ]");
set("ui.menu.character", "[ OPERATOR DOSSIER ]");
set("ui.menu.modes", "[ GAME MODES ]");
set("ui.menu.shop", "[ CLINIC / IMPLANTS ]");
set("ui.menu.coop", "[ CO-OP MODE ]");
set("ui.menu.tutorial", "[ TUTORIAL ]");
set("ui.menu.manual", "[ MANUAL & CONTROLS ]");
set("ui.menu.settings", "[ SETTINGS ]");
set("ui.menu.credits", "[ CREDITS ]");
set("ui.menu.btn_tutorial", "[ TUTORIAL ]");
set("ui.menu.btn_shop", "[ CLINIC / IMPLANTS ]");
set("ui.menu.btn_coop", "[ CO-OP MODE ]");
set("ui.menu.btn_manual", "[ MANUAL & CONTROLS ]");

set("ui.dossier.badge", "FIELD DOSSIER");
set("ui.dossier.title", "OPERATOR RECORD // SECTOR ZERO");
set("ui.dossier.sub", "TACTICAL METRICS AND SURGICAL BIOMETRICS");
set("ui.dossier.name", "OPERATOR:");
set("ui.dossier.role", "TACTICAL ROLE:");
set("ui.dossier.passive", "CYBERNETIC IMPLANT:");
set("ui.dossier.passive_desc", "Passive description");
set("ui.dossier.weapon", "PRIMARY WEAPON:");
set("ui.dossier.expeditions", "TOTAL EXPEDITIONS:");
set("ui.dossier.kills", "HOSTILES PURGED:");
set("ui.dossier.bosses", "BOSSES SLAIN:");
set("ui.dossier.implants", "IMPLANTS ACQUIRED:");
set("ui.dossier.best_time", "BEST TIME (SURVIVAL):");
set("ui.dossier.max_cycle", "HIGHEST CYCLE REACHED:");
set("ui.dossier.max_wave", "MAX WAVE DEFENDED:");
set("ui.dossier.btn_change", "[ CHANGE OPERATOR ]");
set("ui.dossier.btn_clinic", "[ SURGEON'S TABLE ]");
set("ui.dossier.btn_back", "[ RETURN ]");

set("ui.settings.title", "TACTICAL SETTINGS");
set("ui.settings.sub", "AUDIO, VIDEO AND CONTROL CALIBRATION");
set("ui.settings.volume_general", "MASTER VOLUME:");
set("ui.settings.volume_sfx", "SFX / COMBAT:");
set("ui.settings.volume_music", "TACTICAL MUSIC:");
set("ui.settings.volume_ambience", "FACILITY AMBIENCE:");
set("ui.settings.fullscreen", "EXCLUSIVE FULLSCREEN:");
set("ui.settings.cam_shake", "SCREEN SHAKE:");
set("ui.settings.mouse_sens", "MOUSE SENSITIVITY:");
set("ui.settings.fps_toggle", "SHOW FPS COUNTER:");
set("ui.settings.res_scale", "INTERNAL RESOLUTION:");
set("ui.settings.res_scale_sub", "(Higher value improves clarity; lower value improves performance)");
set("ui.settings.res_scale_44", "0.44x (RETRO CRT · FAST)");
set("ui.settings.res_scale_55", "0.55x (BALANCED)");
set("ui.settings.res_scale_65", "0.65x (DETAILED · 720p)");
set("ui.settings.res_scale_75", "0.75x (SHARP)");
set("ui.settings.res_scale_85", "0.85x (HIGH DEFINITION)");
set("ui.settings.res_scale_100", "1.00x (NATIVE · DEMANDING)");
set("ui.settings.ui_scale", "INTERFACE SCALE (HUD):");
set("ui.settings.ui_scale_sub", "(Adjusts HUD and panel size on screen)");
set("ui.settings.ui_scale_085x", "x0.85 (ULTRA COMPACT)");
set("ui.settings.ui_scale_1x", "x1 (COMPACT)");
set("ui.settings.ui_scale_115x", "x1.15 (MEDIUM)");
set("ui.settings.ui_scale_125x", "x1.25 (COMFORTABLE · DEFAULT)");
set("ui.settings.ui_scale_14x", "x1.4 (LARGE · 1440p+)");
set("ui.settings.fov", "FIELD OF VIEW (FOV):");
set("ui.settings.fov_sub", "(Camera zoom: lower = tactical combat, higher = panoramic awareness)");
set("ui.settings.shadows_lantern", "DYNAMIC FLASHLIGHT SHADOWS:");
set("ui.settings.crt_grain", "CRT FILTER & FILM GRAIN:");
set("ui.settings.toggle_on", "[ON]");
set("ui.settings.toggle_off", "[OFF]");
set("ui.settings.btn_close", "[ SAVE & CLOSE ]");

set("ui.manual.title", "FIELD OPERATOR MANUAL");
set("ui.manual.sub", "TACTICAL PROTOCOLS, TURRETS, AND COMBAT DOCTRINE");
set("ui.manual.close", "[ CLOSE MANUAL ]");

set("ui.credits.title", "FACILITY PERSONNEL // CREDITS");
set("ui.credits.sub", "CORE SYSTEM & SIMULATION DEVELOPERS");
set("ui.credits.close", "[ RETURN TO MENU ]");

// Online / Co-op
set("ui.online.title", "MULTIPLAYER TERMINAL // COOPERATIVE");
set("ui.online.sub", "Share the 6-character room code with your teammate or invite via Steam.");
set("ui.online.status_init", "INITIALIZING...");
set("ui.online.status_offline", "OFFLINE MODE");
set("ui.online.status_connected", "● CO-OP LINK ACTIVE");
set("ui.online.status_error", "LINK ERROR");
set("ui.online.local_operator", "Local Operator");
set("ui.online.offline_tip", "Launch the game with an active connection to access cooperative matches.");
set("ui.online.ready_tip", "Operator ready // Cooperative Mode");
set("ui.online.overlay_btn", "[ OPEN OVERLAY (SHIFT+TAB) ]");
set("ui.online.create_box_title", "★ CREATE MATCH");
set("ui.online.create_box_sub", "Generate a private room. Share the code or invite friends directly:");
set("ui.online.btn_create", "[ CREATE MATCH ]");
set("ui.online.active_room", "● ACTIVE ROOM");
set("ui.online.members_count", "{count} / {max} Operators");
set("ui.online.link_code", "LINK CODE:");
set("ui.online.waiting_coop", "Local operator connected. Waiting for teammates...");
set("ui.online.btn_start_coop", "[ ► INITIATE CO-OP DEPLOYMENT ]");
set("ui.online.waiting_host_deploy", "⏳ Connected to room. Waiting for Host to initiate deployment...");
set("ui.online.btn_copy_link", "[ COPY LINK ]");
set("ui.online.btn_link_copied", "[ LINK COPIED! ]");
set("ui.online.btn_leave", "[ LEAVE ]");
set("ui.online.join_box_title", "★ JOIN MATCH");
set("ui.online.join_box_sub", "Enter the code provided by your teammate:");
set("ui.online.join_placeholder", "Paste room code here...");
set("ui.online.btn_join", "[ JOIN MATCH ]");
set("ui.online.private_badge", "🔒 PRIVATE TACTICAL CHANNEL");
set("ui.online.private_tip", "Protected cooperative match. Only players with the exact code or direct invite can join.");
set("ui.online.btn_back", "[ RETURN ]");
set("ui.online.host_badge", "[HOST]");
set("ui.online.client_badge", "[CLIENT]");
set("ui.online.online_indicator", "● ONLINE");
set("ui.online.err_invalid_id", "Please enter a valid Lobby ID.");
set("ui.online.err_need_steam", "You must run the packaged Windows version with Steam open to join lobbies.");
set("ui.online.connected_success", "Successfully connected to room #{id}!");
set("ui.online.room_closed", "This match has ended or the room has closed.");
set("ui.online.room_join_error", "Could not connect to room: {error}");
set("ui.online.room_full_or_not_found", "The room does not exist or is full.");
set("ui.online.peer_disconnected_toast", "Teammate disconnected. Continuing mission solo.");
set("ui.online.peer_disconnected_announcement", "TEAMMATE DISCONNECTED // SOLO MISSION");
set("ui.online.waiting_host_restart", "WAITING FOR HOST TO RESTART");
set("ui.online.waiting_host_btn", "WAITING FOR HOST...");
set("ui.online.p2p_not_available", "STEAM P2P NOT AVAILABLE");
set("ui.online.no_peer_connected", "NO TEAMMATE CONNECTED");
set("ui.online.scrap_insufficient", "INSUFFICIENT SCRAP");
set("ui.online.scrap_send_failed", "FAILED TO SEND SCRAP");
set("ui.online.scrap_sent", "-{value} SCRAP SENT");
set("ui.online.scrap_received", "+{amount} SCRAP RECEIVED");
set("ui.online.stage_cancelled", "Deployment cancelled by teammate.");
set("ui.online.no_active_room", "No active room.");
set("ui.online.err_invalid_code", "Invalid code. Enter the 6-character room code or paste the full link.");
set("ui.online.err_need_steam_create", "To create Steamworks lobbies, run the game from the Windows build with Steam running.");

// First boot lang screen & common
set("ui.lang_screen.title", "SELECT YOUR LANGUAGE");
set("ui.lang_screen.subtitle", "SELECCIONA TU IDIOMA");
set("ui.lang_screen.confirm", "[ CONTINUE ]");
set("ui.common.none", "None");
set("ui.common.weapons", "WEAPONS:");
set("ui.common.passives", "PASSIVES:");
set("ui.common.close", "[ CLOSE ]");
set("ui.common.confirm", "[ CONFIRM ]");
set("ui.common.cancel", "[ CANCEL ]");
set("ui.common.back", "[ BACK ]");

// Map Selector
set("ui.map_modal.badge", "SECTOR CONTRACT");
set("ui.map_modal.title", "EXPEDITION DESTINATION SELECTOR");
set("ui.map_modal.sub", "CHOOSE ROUTE TOPOLOGY, CHOKE POINTS, AND OPERATIONAL DIFFICULTY");
set("ui.map_modal.diff_label", "DEFENSE DIFFICULTY (AFFECTS HP, SPEED, SPAWN RATE AND REWARDS):");
set("ui.map_modal.diff_easy", "FÁCIL // 1.0x");
set("ui.map_modal.diff_easy_desc", "Standard routes, wide margins, +10% starting scrap.");
set("ui.map_modal.diff_normal", "NORMAL // 1.4x");
set("ui.map_modal.diff_normal_desc", "Optimal tactical balance: fast runners, reinforced armor, standard rewards.");
set("ui.map_modal.diff_hard", "DIFÍCIL // 2.1x");
set("ui.map_modal.diff_hard_desc", "Nightmare for veterans: split breaches, resilient elites, double teeth bonus.");
set("ui.map_modal.status_ready", "READY TO DEPLOY");
set("ui.map_modal.status_waiting_host", "WAITING FOR HOST TO SELECT MAP...");
set("ui.map_modal.btn_cancel", "[ CANCEL ]");
set("ui.map_modal.btn_confirm", "[ CONFIRM SECTOR & DEPLOY ]");
set("ui.map_modal.label_entries", "BREACHES / ENTRIES");
set("ui.map_modal.label_exits", "DEFENDED CORES");
set("ui.map_modal.medal_badge", "★ SECTOR SECURED");
set("ui.map_modal.entry_one", "{count} ENTRY");
set("ui.map_modal.entry_many", "{count} ENTRIES");
set("ui.map_modal.exit_one", "{count} CORE");
set("ui.map_modal.exit_many", "{count} CORES");

// Char Selector
set("ui.char_modal.badge", "CYBERNETIC SELECTION");
set("ui.char_modal.title", "AVAILABLE OPERATORS");
set("ui.char_modal.sub", "CHOOSE AN OPERATOR WITH UNIQUE WEAPON, PASSIVE, AND BASE BIOMETRICS");
set("ui.char_modal.ready_local", "[ READY ]");
set("ui.char_modal.cancel_ready", "[ CANCEL READY ]");
set("ui.char_modal.btn_assigned", "[ ASSIGNED ]");
set("ui.char_modal.btn_select", "[ SELECT ]");
set("ui.char_modal.active", "ACTIVE");

// Mode Selector
set("ui.mode_modal.badge", "GAME MODE");
set("ui.mode_modal.title", "SELECT OPERATION MODE");
set("ui.mode_modal.sub", "CAMPAIGN TOWER DEFENSE VS HORDE SURVIVORS");
set("ui.mode.badge_primary", "★ PRIMARY");
set("ui.mode.badge_arcade", "ARCADE MODE");
set("ui.mode.status_active", "● ACTIVE");
set("ui.mode.status_choose", "[CHOOSE]");
set("ui.mode.td_sub", "12 WAVES // REACTOR");
set("ui.mode.surv_sub", "ENDLESS HORDE");
set("ui.mode.campaign_banner", "★ MAIN CAMPAIGN{sector} // 12 WAVES");
set("ui.mode.sector_tag", " // SECTOR: {name} ({diff})");
set("ui.mode.arcade_banner", "SECONDARY MODE // FAST ACTION · ENDLESS HORDE");
set("ui.mode.btn_close", "[ CLOSE ]");

// Level Up
set("ui.levelup.badge", "SYNAPTIC SURGE");
set("ui.levelup.title", "LEVEL UP");
set("ui.levelup.slots", "SLOTS: {weapons} WEAPONS | {passives} PASSIVES");
set("ui.levelup.sub", "IMPLANT RESTRUCTURING PROTOCOL · CHOOSE AN UPGRADE");
set("ui.levelup.charges", "CHARGES: ");
set("ui.levelup.reroll_btn", "[ REROLL ]");
set("ui.levelup.rerolls_remaining.one", "({count} reroll left)");
set("ui.levelup.rerolls_remaining.other", "({count} rerolls left)");
set("ui.levelup.rerolls_exhausted", "(Exhausted)");
set("ui.levelup.new_weapon", "NEW WEAPON");
set("ui.levelup.upgrade_weapon", "WEAPON UPGRADE");
set("ui.levelup.new_passive", "NEW IMPLANT");
set("ui.levelup.upgrade_passive", "IMPLANT UPGRADE");
set("ui.levelup.emergency_supply", "EMERGENCY SUPPLY");
set("ui.levelup.new_tag", "NEW");
set("ui.levelup.supply_tag", "SUPPLY");
set("ui.levelup.affects_player", "Affects: Player biometrics");
set("ui.levelup.affects_label", "Affects: ");
set("ui.levelup.affected_weapons", "Compatible weapons: ");
set("ui.levelup.no_compatible_weapons", "No compatible weapons in inventory yet");

// Shop
set("ui.shop.badge", "SURGEON'S TABLE");
set("ui.shop.title", "SURGICAL DRILL & IMPLANTS");
set("ui.shop.sub", "PERMANENT BIOMECHANICAL ENHANCEMENTS USING EXTRACTED TEETH");
set("ui.shop.teeth_count", "EXTRACTED TEETH: {souls}");
set("ui.shop.max_level", "MAX LEVEL REACHED");
set("ui.shop.cost_label", "COST: {cost} TEETH");
set("ui.shop.level_tag", "LVL {lvl}/{max}");
set("ui.shop.btn_upgrade", "[ EXTRACT & ENHANCE ]");
set("ui.shop.btn_close", "[ LEAVE CLINIC ]");

// Results
set("ui.results.victory_title", "SECTOR SECURED");
set("ui.results.victory_sub", "THE REACTOR HAS BEEN SAVED // ANOMALY PURGED");
set("ui.results.defeat_title", "OPERATOR TERMINATED");
set("ui.results.defeat_sub", "THE CORE HAS COLLAPSED // SURGICAL RETREAT");
set("ui.results.time_label", "MISSION DURATION:");
set("ui.results.kills_label", "HOSTILES PURGED:");
set("ui.results.wave_label", "MAX WAVE DEFENDED:");
set("ui.results.cycle_label", "FINAL CYCLE REACHED:");
set("ui.results.cycle_val", "CYCLE {level}");
set("ui.results.teeth_label", "EXTRACTED TEETH (CLINIC):");
set("ui.results.souls_label", "SOULS HARVESTED:");
set("ui.results.diff_label", "MISSION DIFFICULTY:");
set("ui.results.btn_menu", "[ RETURN TO BASE ]");
set("ui.results.btn_retry", "[ REDEPLOY ]");

// Turret Build Menu & Modals
set("ui.turret_modal.title", "DEFENSIVE TURRET BLUEPRINTS");
set("ui.turret_modal.sub", "DEPLOY TACTICAL STRUCTURES ON INDUSTRIAL GROUND");
set("ui.turret_modal.scrap_available", "SCRAP AVAILABLE: {scrap}");
set("ui.turret_modal.btn_cancel", "[ CANCEL ]");
set("ui.turret_modal.path_max", "[ MAX LEVEL REACHED ]");
set("ui.turret_modal.btn_upgrade", "UPGRADE ({cost} SCRAP)");
set("ui.turret_modal.btn_sell", "SELL (+{refund} SCRAP)");
set("ui.turret_modal.dmg_dealt", "DAMAGE DEALT: {damage}");
set("ui.turret_modal.kills_count", "KILLS: {kills}");
set("ui.turret_modal.cost_chip", "COST: {cost} SCRAP");
set("ui.turret_modal.stat_dmg", "DMG: {val}");
set("ui.turret_modal.stat_rate", "RATE: {val}/s");
set("ui.turret_modal.stat_range", "RANGE: {val}m");
set("ui.turret_modal.stat_pierce", "PIERCE: {val}");
set("ui.turret_modal.stat_boost", "BOOST: +{val}%");
set("ui.turret_modal.stat_radius", "RADIUS: {val}m");
set("ui.turret_modal.stat_pressure", "FORCE: {val}");
set("ui.turret_modal.stat_cycle", "CYCLE: {val}s");
set("ui.turret_modal.stat_cooldown", "COOLDOWN: {val}s");

// Tutorial Prompt
set("ui.tutorial_prompt.tape", "TRAINING PROTOCOL");
set("ui.tutorial_prompt.title", "EXECUTE TUTORIAL?");
set("ui.tutorial_prompt.desc1", "This is your first defense contract. You can take an interactive tutorial: learn to place turrets freely, upgrade them with BTD6-style branching paths, collect SCRAP, and combine synergies like Frost + Bombardier.");
set("ui.tutorial_prompt.desc2", "This choice is only prompted on your first run. You can replay it anytime from the main menu.");
set("ui.tutorial_prompt.yes", "[ YES, START INTERACTIVE TUTORIAL ]");
set("ui.tutorial_prompt.no", "[ NO, JUMP STRAIGHT INTO COMBAT ]");

// Difficulties
set("diff.facil", "EASY");
set("diff.normal", "NORMAL");
set("diff.dificil", "HARD");

// Game Modes
set("mode.core_defense.title", "TOWER DEFENSE");
set("mode.core_defense.subtitle", "DEFEND THE CORE");
set("mode.core_defense.desc", "Deploy turrets freely on ground, manage scrap economy, upgrade 3 branching paths per tower, and protect the reactor across 12 escalating waves.");
set("mode.core_defense.tag", "TACTICAL");
set("mode.survival.title", "SURVIVAL");
set("mode.survival.subtitle", "PURGE THE HORDE");
set("mode.survival.desc", "Direct combat survivors-style. Purge continuous waves of mutants, gather souls, unlock weapons and cybernetic implants, and survive 15 minutes until final evacuation.");
set("mode.survival.tag", "HORDE");

// Enemies & Bosses
set("enemy.runner.name", "TRACK RUNNER");
set("enemy.hulk.name", "MEAT PRESS");
set("enemy.leaper.name", "TRENCH LEAPER");
set("enemy.armored.name", "IRON BULWARK");
set("enemy.splitter.name", "ABERRANT SPLITTER");

set("boss.boss_butcher.name", "THE PLANT AMPUTATOR");
set("boss.boss_siren.name", "THE WIRE MOTHER");
set("boss.boss_drill.name", "MINING AUGER");
set("boss.boss_apostle.name", "HERETIC OF GEARS");
set("boss.boss_warden.name", "SECTOR WARDEN");

// Rewards
set("reward.heal_pack.name", "Emergency Transfusion");
set("reward.heal_pack.desc", "Restores +75 Pulse immediately.");
set("reward.teeth_bag.name", "Bag of Extracted Teeth");
set("reward.teeth_bag.desc", "Gain +15 additional Teeth for the Surgeon's Table.");

// Shop Permanent Upgrades
set("shop.dmg.name", "Refined Gunpowder");
set("shop.dmg.desc", "+3% permanent Base Damage per level");
set("shop.hp.name", "Surgical Sutures");
set("shop.hp.desc", "+5 permanent Base Maximum Pulse per level");
set("shop.spd.name", "Microdose Ephedrine");
set("shop.spd.desc", "+2% permanent Base Movement Speed per level");
set("shop.atkSpd.name", "Mechanism Oil");
set("shop.atkSpd.desc", "+2.5% permanent Base Fire Rate per level");
set("shop.mag.name", "Extraction Forceps");
set("shop.mag.desc", "+0.35m permanent Base Magnet Radius per level");
set("shop.reroll.name", "Croupier Bribe");
set("shop.reroll.desc", "+1 extra use of the Reroll button (Max +3)");

// ==================== OPERATORS ====================
set("char.otto.title", "Dr. V. Richter");
set("char.otto.role", "Tactical Surgeon");
set("char.otto.desc", "Former military doctor obsessed with limb replacement. Excels at crowd control and harvesting vital biometrics.");
set("char.otto.passive", "Dissection Protocol");
set("char.otto.passiveDesc", "+25% extra tooth and soul drop chance from elites. Starts with 1 additional Reroll.");
set("char.otto.weaponTitle", "Rotary Saw");

set("char.mack.title", "Mack \"The Hammer\"");
set("char.mack.role", "Heavy Demolitionist");
set("char.mack.desc", "Factory veteran with reinforced cybernetic chassis. Devastating up close, sluggish at distance.");
set("char.mack.passive", "Ballistic Inertia");
set("char.mack.passiveDesc", "+30% base area on all weapons. Heavy projectile knockback increased by 50%.");
set("char.mack.weaponTitle", "12-Gauge Shotgun");

set("char.pepe.title", "Pepe \"Spark\"");
set("char.pepe.role", "Arc Welder");
set("char.pepe.desc", "Underground electrician specialized in high-voltage industrial discharge and high heat tolerance.");
set("char.pepe.passive", "Overcharge Arc");
set("char.pepe.passiveDesc", "Attacks have a 20% chance to arc chain lightning to 2 nearby enemies for 40% damage.");
set("char.pepe.weaponTitle", "Thermal Torch");

set("char.morbo.title", "Morbo");
set("char.morbo.role", "Plague Carrier");
set("char.morbo.desc", "Surviving subject of biochemical experiments. Emits a relentless caustic field around him.");
set("char.morbo.passive", "Caustic Exudation");
set("char.morbo.passiveDesc", "Enemies entering his aura suffer 15% slow and lose 2% max HP per second.");
set("char.morbo.weaponTitle", "Bile Censer");

set("char.bob.title", "Bob \"Greaser\"");
set("char.bob.role", "Combat Machinist");
set("char.bob.desc", "Specialized in autonomous mechanics, pressure sensors, and explosive ordnance.");
set("char.bob.passive", "Mine Network");
set("char.bob.passiveDesc", "Every 12s, automatically drops an auxiliary proximity mine that detonates for 80 damage.");
set("char.bob.weaponTitle", "Shrapnel Mines");

set("char.krauss.title", "Krauss");
set("char.krauss.role", "Sector Executioner");
set("char.krauss.desc", "Cold cybernetic marksman equipped with high-pressure pneumatic harpoon systems.");
set("char.krauss.passive", "Pneumatic Tension");
set("char.krauss.passiveDesc", "Piercing projectiles gain +15% damage for each enemy they pass through.");
set("char.krauss.weaponTitle", "Pneumatic Harpoon");

set("char.axel.title", "Axel");
set("char.axel.role", "Cage Runner");
set("char.axel.desc", "Berserker surrounded by orbital chain cages that tear apart any hostile approaching his perimeter.");
set("char.axel.passive", "Kinetic Centrifuge");
set("char.axel.passiveDesc", "Orbital rotation speed increases by up to +40% the longer he moves continuously.");
set("char.axel.weaponTitle", "Butcher Cage");

set("char.tesla.title", "Nikola");
set("char.tesla.role", "Static Pioneer");
set("char.tesla.desc", "Obsessed with high-voltage industrial circuits. Reconfigures scrap into electrical conduits.");
set("char.tesla.passive", "Static Resonance");
set("char.tesla.passiveDesc", "Killing shocked enemies releases an EMP wave that stuns hostiles within 3m for 0.8s.");
set("char.tesla.weaponTitle", "Broken Defibrillator");

// ==================== WEAPONS ====================
set("weapon.slash.name", "Amputation Saw");
set("weapon.slash.desc", "Serrated circular arc leaving blood trails, 3D flash, and strong knockback. (Unaffected by +Projectiles).");
set("weapon.shotgun.name", "12-Gauge Shotgun");
set("weapon.shotgun.desc", "Physical buckshot spread with muzzle flash and shell ejection.");
set("weapon.flamethrower.name", "Incinerating Blowtorch");
set("weapon.flamethrower.desc", "Continuous flame cone illuminating dark halls and applying Burn per second. (Unaffected by +Projectiles).");
set("weapon.aura.name", "Bile Censer");
set("weapon.aura.desc", "Corrosive field around player dealing damage and slowing the horde. (Unaffected by +Projectiles).");
set("weapon.mines.name", "Shrapnel Mines");
set("weapon.mines.desc", "Drops mines with red proximity sensors that detonate in area when stepped on.");
set("weapon.harpoon.name", "Pneumatic Harpoon");
set("weapon.harpoon.desc", "High-velocity piercing bolt penetrating straight through multiple enemies.");
set("weapon.orbital.name", "Butcher Cage");
set("weapon.orbital.desc", "Hook-and-skull iron cages orbiting the operator, tearing through ranks.");
set("weapon.bolt.name", "Broken Defibrillator");
set("weapon.bolt.desc", "High-voltage electrical discharge arcing between multiple bodies. (Unaffected by +Projectiles).");
set("weapon.chakram.name", "Scrap Boomerang");
set("weapon.chakram.desc", "Buzzsaw disc that shoots out, pierces, and returns to the operator damaging twice.");
set("weapon.welder.name", "Arc Welder");
set("weapon.welder.desc", "Charges for 2.4s and unleashes a concentrated beam for 1.6s toward highest enemy density. (Unaffected by +Projectiles).");
set("weapon.grenade.name", "Pilgrim Grenade Launcher");
set("weapon.grenade.desc", "Ballistic grenade exploding in area and splitting into cluster bomblets upon upgrading.");
set("weapon.hammer.name", "Piston Hammer");
set("weapon.hammer.desc", "Radial pressure shockwave with heavy knockback and stun. (Unaffected by +Projectiles).");
set("weapon.acid.name", "Acid Flask");
set("weapon.acid.desc", "Flask shattering into a lingering corrosive cloud, melting and slowing hostiles.");

// Short weapon names
set("weapon.short.slash", "Saw");
set("weapon.short.shotgun", "Shotgun");
set("weapon.short.flamethrower", "Torch");
set("weapon.short.aura", "Censer");
set("weapon.short.mines", "Mines");
set("weapon.short.harpoon", "Harpoon");
set("weapon.short.orbital", "Cage");
set("weapon.short.bolt", "Defibril.");
set("weapon.short.chakram", "Boomerang");
set("weapon.short.welder", "Welder");
set("weapon.short.grenade", "Grenades");
set("weapon.short.hammer", "Hammer");
set("weapon.short.acid", "Acid");

// ==================== PASSIVES ====================
set("passive.multishot.name", "Modified Chamber");
set("passive.multishot.desc", "Adds +1 projectile to weapons supporting additional projectiles.");
set("passive.dmg.name", "Pressed Gunpowder");
set("passive.dmg.desc", "Increases damage of all weapons by +15% per level.");
set("passive.atkSpd.name", "Rusted Servomotor");
set("passive.atkSpd.desc", "Increases attack and rotation speed by +10% per level.");
set("passive.maxHp.name", "Surgical Plates");
set("passive.maxHp.desc", "Increases maximum Pulse by +25 and heals that amount immediately.");
set("passive.regen.name", "Intravenous Drip");
set("passive.regen.desc", "Regenerates +0.9 Pulse per second continuously.");
set("passive.moveSpd.name", "Industrial Ephedrine");
set("passive.moveSpd.desc", "Increases movement speed by +8% per level.");
set("passive.area.name", "Expanded Shrapnel");
set("passive.area.desc", "Increases attack area and range by +12% per level.");
set("passive.crit.name", "Butcher Lens");
set("passive.crit.desc", "Adds +7% chance to deal double damage (x2).");
set("passive.magnet.name", "Crane Magnet");
set("passive.magnet.desc", "Increases pickup radius for serum and teeth.");

set("passive.format.multishot", "+{lvl} PROJ.");
set("passive.format.dmg", "+{pct}% DMG");
set("passive.format.atkSpd", "+{pct}% SPD");
set("passive.format.maxHp", "+{hp} PULSE");
set("passive.format.regen", "+{val} HP/S");
set("passive.format.moveSpd", "+{pct}% MOVE");
set("passive.format.area", "+{pct}% AREA");
set("passive.format.crit", "+{pct}% CRIT");
set("passive.format.magnet", "+{val}M MAGNET");

// ==================== MAPS ====================
set("map.easy_plaza.name", "Central Plaza");
set("map.easy_plaza.badge", "EASY // 360° LOOP");
set("map.easy_plaza.desc", "Central circular arena with wide vantage points. Enemies circle the perimeter before converging on the core.");

set("map.easy_spiral.name", "Spiral Descent");
set("map.easy_spiral.badge", "EASY // CONTINUOUS SPIRAL");
set("map.easy_spiral.desc", "Single ascending spiral path with high turret density. Excellent for long-range and frost towers.");

set("map.easy_serpentine.name", "Winding Trench");
set("map.easy_serpentine.badge", "EASY // MULTI-S-CURVES");
set("map.easy_serpentine.desc", "Trench snake-winding with 5 sharp hairpin bends. Superb for area-of-effect and flame turrets.");

set("map.easy_ramps.name", "High Loading Ramps");
set("map.easy_ramps.badge", "EASY // ELEVATED RAMPS");
set("map.easy_ramps.desc", "Dual descending industrial ramps converging onto a reinforced central bridge.");

set("map.easy_cooling.name", "Cooling Circuit");
set("map.easy_cooling.badge", "EASY // DOUBLE RING");
set("map.easy_cooling.desc", "Concentric cooling canal loops. Enemies traverse outer waterworks before reaching the plant heart.");

set("map.easy_horseshoe.name", "Iron Horseshoe");
set("map.easy_horseshoe.badge", "EASY // U-CHOKE");
set("map.easy_horseshoe.desc", "Broad U-bend with elevated interior platforms. Concentrates high crossfire on the central curve.");

set("map.norm_twins.name", "Twin Corridors");
set("map.norm_twins.badge", "NORMAL // PARALLEL ENTRY");
set("map.norm_twins.desc", "Two symmetrical corridors requiring defensive allocation across both flanks simultaneously.");

set("map.norm_pincer.name", "Hydraulic Pincer");
set("map.norm_pincer.badge", "NORMAL // PINCER ASSAULT");
set("map.norm_pincer.desc", "Two opposite breaches converging at 90° onto a central core with limited perimeter.");

set("map.norm_cross.name", "Industrial Crossroads");
set("map.norm_cross.badge", "NORMAL // FOUR-WAY BREACH");
set("map.norm_cross.desc", "Four-way intersection. Enemies arrive in alternating waves from north, south, east, and west.");

set("map.norm_funnel.name", "Slag Funnel");
set("map.norm_funnel.badge", "NORMAL // CONVERGENT FUNNEL");
set("map.norm_funnel.desc", "Three wide entry breaches narrowing abruptly into a single reinforced choke point.");

set("map.norm_braid.name", "Braided Viaduct");
set("map.norm_braid.badge", "NORMAL // CROSSOVER ROUTES");
set("map.norm_braid.desc", "Two interwoven tracks crossing over multiple overpasses. Demands versatile turret positioning.");

set("map.norm_pit.name", "The Smelting Pit");
set("map.norm_pit.badge", "NORMAL // VOLCANIC CRATER");
set("map.norm_pit.desc", "Perimeter path descending into a central molten pit where the reactor core is anchored.");

set("map.hard_isolated.name", "Isolated Sector 9");
set("map.hard_isolated.badge", "HARD // DUAL SPLIT CORES");
set("map.hard_isolated.desc", "Two separated cores requiring two fully autonomous defensive outposts without overlapping range.");

set("map.hard_diagonal.name", "Diagonal Breach");
set("map.hard_diagonal.badge", "HARD // SPRINT VELOCITY");
set("map.hard_diagonal.desc", "Direct short diagonal track. Hostiles reach core in under 20s if not slowed immediately.");

set("map.hard_express.name", "Express Rail Line");
set("map.hard_express.badge", "HARD // HIGH SPEED SPRINT");
set("map.hard_express.desc", "Rapid transit rail line with high enemy speeds. Essential to coordinate heavy crowd-control.");

set("map.hard_split_level.name", "Vertical Bifurcation");
set("map.hard_split_level.badge", "HARD // ELEVATED TIERS");
set("map.hard_split_level.desc", "Multi-tiered facility where enemies drop down from ventilation shafts onto defensive platforms.");

set("map.hard_blind_alleys.name", "The Labyrinth");
set("map.hard_blind_alleys.badge", "HARD // BLIND CORNERS");
set("map.hard_blind_alleys.desc", "Claustrophobic maze of steel walls. Blocks line-of-sight and renders long-range towers ineffective.");

set("map.hard_dual_breach.name", "Omega Dual Breach");
set("map.hard_dual_breach.badge", "HARD // SIMULTANEOUS HORDE");
set("map.hard_dual_breach.desc", "Final facility sector. Massive hordes strike both flanks in perfect synchronization with elite bosses.");

// ==================== TUTORIAL ====================
set("tutorial.step.intro.title", "DEFENSE TRAINING PROTOCOL");
set("tutorial.step.intro.text", "Your mission: protect the CORE across 12 waves. Enemies advance along three industrial tracks. Collect SCRAP from downed hostiles, build turrets, and upgrade them to survive. Press [SPACE] to begin.");
set("tutorial.step.intro.hint", "Press [SPACE] or click here to continue.");

set("tutorial.step.place_turret.title", "DEPLOY YOUR FIRST TURRET");
set("tutorial.step.place_turret.text", "Open the build menu with [E] near the ground, select the NAILER (100 Scrap), and place it covering the central route with [LMB].");
set("tutorial.step.place_turret.hint", "Press [E] to open the build menu and place a Nailer.");

set("tutorial.step.upgrade_turret.title", "UPGRADE PATHS");
set("tutorial.step.upgrade_turret.text", "Approach your placed turret and press [E] to open its upgrade console. Each turret features 3 distinct specialization paths (Rate, Pierce, Incendiary). Upgrade the Rate path to Level 1.");
set("tutorial.step.upgrade_turret.hint", "Press [E] facing the turret and buy the first upgrade.");

set("tutorial.step.collect_scrap.title", "SCRAP ECONOMY");
set("tutorial.step.collect_scrap.text", "Downed hostiles drop glowing blue Scrap gears. Collect them quickly with your operator to fund additional defenses. Higher waves require dense turret arrays.");
set("tutorial.step.collect_scrap.hint", "Collect scrap from the ground to replenish your tactical reserves.");

set("tutorial.step.elemental_synergy.title", "TACTICAL SYNERGIES");
set("tutorial.step.elemental_synergy.text", "Combine damage types: FROST slows dense swarms, making them vulnerable to BOMBARDIER area mortar shells. Experiment with crossfire configurations.");
set("tutorial.step.elemental_synergy.hint", "Combine freezing towers with high explosive artillery.");

set("tutorial.step.complete.title", "TRAINING COMPLETE");
set("tutorial.step.complete.text", "Operator qualified for field deployment. Select your sector contract from the main terminal and purge the infestation. Good luck.");
set("tutorial.step.complete.hint", "Press [SPACE] to return to the tactical terminal.");

// ==================== HUD ====================
set("hud.objective.title", "CURRENT OBJECTIVE:");
set("hud.objective.default_td", "Hold the breach ({diff})");
set("hud.objective.default_surv", "Survive the horde: {time}");
set("hud.objective.purge_boss", "PURGE {name}");
set("hud.objective.hostiles_left", "Hostiles remaining: {count}");
set("hud.objective.next_wave_in", "Next wave in {time}");
set("hud.objective.first_wave_prep", "Prepare defenses // Press [F] to start");
set("hud.objective.rebuilding_operator", "REBUILDING OPERATOR... HOLD PERIMETER");
set("hud.objective.tutorial_active", "TUTORIAL // {step}");
set("hud.objective.next_boss_in", "Next Boss: {time}");
set("hud.objective.endgame_active", "PURGE ACTIVE: ELIMINATE REMAINING HOSTILES");

set("hud.wave.prep", "PREPARATION");
set("hud.wave.in_progress", "WAVE {current}/{total}");
set("hud.wave.event_badge", "EVENT // {title}");
set("hud.wave.surv_endgame", "EXTERMINATION ACTIVE");
set("hud.wave.surv_horde", "HORDE ACTIVE");
set("hud.wave.skip_prompt", "PRESS [F] TO START");
set("hud.wave.announcement_boss", "WAVE {wave} // BOSS INCOMING: {boss}");
set("hud.wave.announcement_progress", "WAVE {wave} / {total} IN PROGRESS");
set("hud.wave.announcement_completed", "WAVE {wave} COMPLETED");
set("hud.wave.start_wave", "START WAVE");
set("hud.wave.skip_pause", "SKIP PAUSE");

set("hud.turret.interact_prompt", "PRESS [E] TO UPGRADE / SELL");
set("hud.turret.place_valid", "PLACE {name} · {cost} SCRAP · [ESC] CANCEL");
set("hud.turret.place_invalid", "{reason} · [ESC] CANCEL");
set("hud.turret.upgrade_sell", "UPGRADE / SELL · {name}");
set("hud.turret.build_turret", "BUILD TURRET");

set("hud.slot.level_short", "LV.{lvl}");
set("hud.slot.weapon_empty", "Weapon slot available");
set("hud.slot.passive_empty", "Implant slot available");
set("hud.slot.weapon_title", "{name} (Level +{lvl}) — {desc}");
set("hud.slot.passive_title", "{name} (Level +{lvl}): {stat} — {desc}");

set("hud.player_down.title", "[ OPERATOR DOWN // CORE OVERLOAD -{penalty} LIVES ]");
set("hud.player_down.countdown", "REBUILDING IN {seconds}s...");
set("hud.player_down.announcement", "OPERATOR DOWN // CORE OVERLOAD (-{penalty} LIVES)");

set("hud.core.under_attack", "CORE UNDER ATTACK! // {state}");
set("hud.core.leak_detected.one", "BREACH DETECTED! -1 LIFE");
set("hud.core.leak_detected.other", "BREACH DETECTED! -{count} LIVES");
set("hud.core.state_stable", "STABLE");
set("hud.core.state_alert", "ALERT");
set("hud.core.state_critical", "CRITICAL");
set("hud.core.integrity", "{hp}/{max} INTEGRITY");
set("hud.core.hostiles_counter", "HOSTILES: {count}");
set("hud.core.state_free_exploration", "FREE EXPLORATION");
set("hud.core.state_pause", "PAUSE: {seconds}S");

set("hud.boss.alert", "ALERT: {name} ON DECK");
set("hud.boss.phase1", "PHASE I");
set("hud.boss.phase2", "PHASE II // FRENZY");

set("hud.teammate_down.tag", "TEAMMATE DOWN!");
set("hud.teammate_down.title", "TEAMMATE DOWN! -10 LIVES TO CORE");
set("hud.teammate_down.sub", "CORE PENALTY // COVER THEIR POSITION");

set("hud.kinetic.sector_alert", "SECTOR ALERT");
set("hud.kinetic.event_started", "EVENT INITIATED");

set("hud.event.emergency_detected", "EMERGENCY DETECTED");
set("hud.event.completed_title", "EVENT SECURED");
set("hud.event.leak_banner_tag", "CORE LEAK DETECTED");
set("hud.event.sector_alert_tag", "SECTOR ALERT");
set("hud.event.started_title", "EVENT INITIATED");
set("hud.event.survive_sub", "SURVIVE FOR 75 SECONDS INSIDE PERIMETER");
set("hud.event.climax_tag", "EVENT CLIMAX");
set("hud.event.phase3_title", "CONTAINMENT BREACH");
set("hud.event.phase3_sub", "CRITICAL MUTANTS ARRIVING");
set("hud.event.secured_tag", "SECTOR SECURED");
set("hud.event.secured_title", "CONTAINMENT RE-ESTABLISHED");
set("hud.event.secured_sub", "CORE PENALTY PREVENTED");
set("hud.event.swarm_growing", "SWARM DENSITY INCREASING");
set("hud.event.defend_prefix", "DEFEND ");
set("hud.event.survive_prefix", "SURVIVE ");
set("hud.event.loc_substation_east", "EAST SUBSTATION");
set("hud.event.loc_generator_west", "WEST AUXILIARY GENERATOR");
set("hud.event.loc_console_north", "NORTH LOGISTICS CONSOLE");
set("hud.event.loc_relay_south", "SOUTH RELAY HUB");
set("hud.event.loc_containment_zone", "ALPHA CONTAINMENT ZONE");
set("hud.event.title_substation_defended", "SUBSTATION SECURED");
set("hud.event.title_sector_purged", "SECTOR PURGED");
set("hud.event.phase_format", "PHASE {phase}: {title}");
set("hud.event.inside_perimeter", "● INSIDE PERIMETER (15M RADIUS)");
set("hud.event.outside_perimeter", "▲ OUTSIDE PERIMETER ({dist}m AWAY) - RETURN!");

// ==================== TURRETS (All 11 turrets, paths, upgrades) ====================
// 1. GUNNER (Clavadora)
set("turret.gunner.name", "NAILER");
set("turret.gunner.role", "DIRECT DAMAGE");
set("turret.gunner.desc", "Rapid-fire industrial pneumatic rifle. Cheap and reliable against single targets.");
set("turret.gunner.path.rate.name", "FIRE RATE");
set("turret.gunner.upgrade.rate.1.name", "Hair Trigger");
set("turret.gunner.upgrade.rate.1.desc", "+25% fire rate.");
set("turret.gunner.upgrade.rate.2.name", "Twin Barrels");
set("turret.gunner.upgrade.rate.2.desc", "Fires at 2 targets simultaneously.");
set("turret.gunner.upgrade.rate.3.name", "Supercharged Motor");
set("turret.gunner.upgrade.rate.3.desc", "+30% fire rate.");
set("turret.gunner.upgrade.rate.4.name", "Lead Storm");
set("turret.gunner.upgrade.rate.4.desc", "Every attack unleashes a concentrated 6-bullet burst.");

set("turret.gunner.path.pierce.name", "PIERCE");
set("turret.gunner.upgrade.pierce.1.name", "Steel Core");
set("turret.gunner.upgrade.pierce.1.desc", "+2 damage.");
set("turret.gunner.upgrade.pierce.2.name", "Armor-Piercing Nails");
set("turret.gunner.upgrade.pierce.2.desc", "Nails pierce through 2 enemies.");
set("turret.gunner.upgrade.pierce.3.name", "Reinforced Barrel");
set("turret.gunner.upgrade.pierce.3.desc", "+3 damage and +10% range.");
set("turret.gunner.upgrade.pierce.4.name", "Electromagnetic Rail");
set("turret.gunner.upgrade.pierce.4.desc", "Fires rail slugs that pierce all enemies in a line with +50% damage.");

set("turret.gunner.path.incendiary.name", "INCENDIARY");
set("turret.gunner.upgrade.incendiary.1.name", "Thermite Powder");
set("turret.gunner.upgrade.incendiary.1.desc", "+15% damage.");
set("turret.gunner.upgrade.incendiary.2.name", "Incendiary Rounds");
set("turret.gunner.upgrade.incendiary.2.desc", "Applies Burn (4 dps for 3s).");
set("turret.gunner.upgrade.incendiary.3.name", "Dense Fuel");
set("turret.gunner.upgrade.incendiary.3.desc", "+50% burn damage.");
set("turret.gunner.upgrade.incendiary.4.name", "Explosive Munitions");
set("turret.gunner.upgrade.incendiary.4.desc", "Impacts explode in area with substantially stronger burn.");

// 2. MORTAR (Bombarda)
set("turret.mortar.name", "BOMBARDIER");
set("turret.mortar.role", "AREA DAMAGE");
set("turret.mortar.desc", "Heavy lobbing mortar. Slow rate of fire, massive explosive area damage.");
set("turret.mortar.path.caliber.name", "CALIBER");
set("turret.mortar.upgrade.caliber.1.name", "Heavy Casing");
set("turret.mortar.upgrade.caliber.1.desc", "+8 damage.");
set("turret.mortar.upgrade.caliber.2.name", "Widened Blast Radius");
set("turret.mortar.upgrade.caliber.2.desc", "+30% blast radius.");
set("turret.mortar.upgrade.caliber.3.name", "High Explosive Compound");
set("turret.mortar.upgrade.caliber.3.desc", "+15 damage.");
set("turret.mortar.upgrade.caliber.4.name", "Siege Warhead");
set("turret.mortar.upgrade.caliber.4.desc", "Massive shells dealing +100% damage with heavy blast area.");

set("turret.mortar.path.barrage.name", "FIRE RATE");
set("turret.mortar.upgrade.barrage.1.name", "Rapid Loader");
set("turret.mortar.upgrade.barrage.1.desc", "+20% fire rate.");
set("turret.mortar.upgrade.barrage.2.name", "Automated Carousel");
set("turret.mortar.upgrade.barrage.2.desc", "+25% fire rate.");
set("turret.mortar.upgrade.barrage.3.name", "Twin Launch Tubes");
set("turret.mortar.upgrade.barrage.3.desc", "Fires 2 shells per salvo.");
set("turret.mortar.upgrade.barrage.4.name", "Cluster Barrage");
set("turret.mortar.upgrade.barrage.4.desc", "Each shell detonates into 4 secondary explosive bomblets.");

set("turret.mortar.path.napalm.name", "NAPALM");
set("turret.mortar.upgrade.napalm.1.name", "Incendiary Residue");
set("turret.mortar.upgrade.napalm.1.desc", "Explosions ignite targets for 2s.");
set("turret.mortar.upgrade.napalm.2.name", "Napalm Slag");
set("turret.mortar.upgrade.napalm.2.desc", "Leaves a flaming ground puddle for 4s.");
set("turret.mortar.upgrade.napalm.3.name", "Sticky Gel");
set("turret.mortar.upgrade.napalm.3.desc", "Ground fire slows enemies by 25%.");
set("turret.mortar.upgrade.napalm.4.name", "Hellfire Basin");
set("turret.mortar.upgrade.napalm.4.desc", "Massive lingering firestorm burning hostiles continuously.");

// 3. CRYO (Escarcha)
set("turret.cryo.name", "FROST RELAY");
set("turret.cryo.role", "CROWD CONTROL");
set("turret.cryo.desc", "Cryogenic emitter projecting sub-zero liquid nitrogen to slow oncoming swarms.");
set("turret.cryo.path.refrigerant.name", "REFRIGERANT");
set("turret.cryo.upgrade.refrigerant.1.name", "Concentrated Nitrogen");
set("turret.cryo.upgrade.refrigerant.1.desc", "+10% slow intensity.");
set("turret.cryo.upgrade.refrigerant.2.name", "Thermal Shock");
set("turret.cryo.upgrade.refrigerant.2.desc", "Slowed enemies take +15% damage from all sources.");
set("turret.cryo.upgrade.refrigerant.3.name", "Deep Freeze");
set("turret.cryo.upgrade.refrigerant.3.desc", "Slow intensity increased to 60%.");
set("turret.cryo.upgrade.refrigerant.4.name", "Absolute Zero");
set("turret.cryo.upgrade.refrigerant.4.desc", "Enemies in range are completely frozen solid for 1.5s periodically.");

set("turret.cryo.path.radius.name", "RADIUS");
set("turret.cryo.upgrade.radius.1.name", "Wide Diffuser");
set("turret.cryo.upgrade.radius.1.desc", "+20% coverage area.");
set("turret.cryo.upgrade.radius.2.name", "Pressurized Jet");
set("turret.cryo.upgrade.radius.2.desc", "+25% coverage area.");
set("turret.cryo.upgrade.radius.3.name", "Vortex Dispersion");
set("turret.cryo.upgrade.radius.3.desc", "+30% coverage area.");
set("turret.cryo.upgrade.radius.4.name", "Blizzard Dome");
set("turret.cryo.upgrade.radius.4.desc", "Massive sub-zero blizzard enveloping entire crossroads.");

set("turret.cryo.path.lethal.name", "LETHAL FROST");
set("turret.cryo.upgrade.lethal.1.name", "Ice Crystals");
set("turret.cryo.upgrade.lethal.1.desc", "Cryo spray deals 3 damage per second.");
set("turret.cryo.upgrade.lethal.2.name", "Brittle Siphon");
set("turret.cryo.upgrade.lethal.2.desc", "+5 dps; slowed enemies bleed scrap upon death.");
set("turret.cryo.upgrade.lethal.3.name", "Hypothermic Rupture");
set("turret.cryo.upgrade.lethal.3.desc", "+10 dps; frosted hostiles lose armor.");
set("turret.cryo.upgrade.lethal.4.name", "Shatter Extinction");
set("turret.cryo.upgrade.lethal.4.desc", "Frozen enemies shatter on death, triggering ice explosions.");

// 4. BARRACKS (Cuartel)
set("turret.barracks.name", "GUARD POST");
set("turret.barracks.role", "ALLIED SQUAD");
set("turret.barracks.desc", "Deploys armed combat synthetic units to intercept and block enemies on track.");
set("turret.barracks.path.recruitment.name", "RECRUITMENT");
set("turret.barracks.upgrade.recruitment.1.name", "Rapid Cloning");
set("turret.barracks.upgrade.recruitment.1.desc", "Synthetics respawn 25% faster.");
set("turret.barracks.upgrade.recruitment.2.name", "Reinforced Squad");
set("turret.barracks.upgrade.recruitment.2.desc", "Deploys 3 soldiers instead of 2.");
set("turret.barracks.upgrade.recruitment.3.name", "Bio-Alloy Armor");
set("turret.barracks.upgrade.recruitment.3.desc", "Allied units gain +50% max HP.");
set("turret.barracks.upgrade.recruitment.4.name", "Iron Phalanx");
set("turret.barracks.upgrade.recruitment.4.desc", "Deploys 4 heavily armored riot soldiers that resist knockback.");

set("turret.barracks.path.weaponry.name", "WEAPONRY");
set("turret.barracks.upgrade.weaponry.1.name", "Serrated Bayonets");
set("turret.barracks.upgrade.weaponry.1.desc", "+3 melee damage.");
set("turret.barracks.upgrade.weaponry.2.name", "Shock Batons");
set("turret.barracks.upgrade.weaponry.2.desc", "Attacks have a 20% chance to stun hostiles for 1s.");
set("turret.barracks.upgrade.weaponry.3.name", "Pneumatic Blades");
set("turret.barracks.upgrade.weaponry.3.desc", "+8 melee damage.");
set("turret.barracks.upgrade.weaponry.4.name", "Plasma Lancers");
set("turret.barracks.upgrade.weaponry.4.desc", "High-frequency plasma lances carving through armored targets.");

set("turret.barracks.path.fabrication.name", "FABRICATION");
set("turret.barracks.upgrade.fabrication.1.name", "Field First-Aid");
set("turret.barracks.upgrade.fabrication.1.desc", "Soldiers regenerate 5% HP per second.");
set("turret.barracks.upgrade.fabrication.2.name", "Defensive Rally");
set("turret.barracks.upgrade.fabrication.2.desc", "Soldiers gain +25% armor in combat.");
set("turret.barracks.upgrade.fabrication.3.name", "Retaliation Spikes");
set("turret.barracks.upgrade.fabrication.3.desc", "Reflects 30% melee damage back to attackers.");
set("turret.barracks.upgrade.fabrication.4.name", "Cyborg Juggernauts");
set("turret.barracks.upgrade.fabrication.4.desc", "Elite mechanized cyborgs equipped with heavy shields and hydraulic axes.");

// 5. SUPPORT (Taller / Emisor Táctico)
set("turret.support.name", "TACTICAL WORKSHOP");
set("turret.support.role", "SUPPORT AMPLIFIER");
set("turret.support.desc", "Engineering hub providing buffs, extra range, and fire rate to nearby towers.");
set("turret.support.path.overclock.name", "OVERCLOCK");
set("turret.support.upgrade.overclock.1.name", "Synchronized Tuning");
set("turret.support.upgrade.overclock.1.desc", "+10% fire rate to towers in range.");
set("turret.support.upgrade.overclock.2.name", "Heavy Capacitor");
set("turret.support.upgrade.overclock.2.desc", "+15% fire rate to towers in range.");
set("turret.support.upgrade.overclock.3.name", "Thermal Ventilation");
set("turret.support.upgrade.overclock.3.desc", "+20% fire rate and reduced overheat.");
set("turret.support.upgrade.overclock.4.name", "Hyper-Frequency Link");
set("turret.support.upgrade.overclock.4.desc", "+35% fire rate; attacks trigger double hit chance.");

set("turret.support.path.power.name", "POWER");
set("turret.support.upgrade.power.1.name", "Energy Relays");
set("turret.support.upgrade.power.1.desc", "+10% damage to towers in range.");
set("turret.support.upgrade.power.2.name", "High-Caliber Bench");
set("turret.support.upgrade.power.2.desc", "+15% damage to towers in range.");
set("turret.support.upgrade.power.3.name", "Amplified Induction");
set("turret.support.upgrade.power.3.desc", "+20% damage to towers in range.");
set("turret.support.upgrade.power.4.name", "War Protocol Core");
set("turret.support.upgrade.power.4.desc", "+30% damage and +15% critical strike chance to nearby towers.");

set("turret.support.path.radar.name", "RADAR & RANGE");
set("turret.support.upgrade.radar.1.name", "Long-Range Emitter");
set("turret.support.upgrade.radar.1.desc", "+15% support aura radius.");
set("turret.support.upgrade.radar.2.name", "Telemetry Antenna");
set("turret.support.upgrade.radar.2.desc", "+15% firing range to boosted towers.");
set("turret.support.upgrade.radar.3.name", "Wide Array Sensor");
set("turret.support.upgrade.radar.3.desc", "+25% support aura radius.");
set("turret.support.upgrade.radar.4.name", "Global Command Array");
set("turret.support.upgrade.radar.4.desc", "Massive radar array granting camouflage detection and infinite tracking.");

// 6. TESLA (Bobina de Tesla)
set("turret.tesla.name", "TESLA COIL");
set("turret.tesla.role", "CHAIN LIGHTNING");
set("turret.tesla.desc", "High-voltage coil discharging chain lightning bolts across swarming hostiles.");
set("turret.tesla.path.chain.name", "CHAIN");
set("turret.tesla.upgrade.chain.1.name", "Conductive Coil");
set("turret.tesla.upgrade.chain.1.desc", "Arcs to +1 additional target.");
set("turret.tesla.upgrade.chain.2.name", "High-Frequency Spark");
set("turret.tesla.upgrade.chain.2.desc", "Arcs to +2 additional targets.");
set("turret.tesla.upgrade.chain.3.name", "Plasma Network");
set("turret.tesla.upgrade.chain.3.desc", "Arcs to +3 additional targets.");
set("turret.tesla.upgrade.chain.4.name", "Ball Lightning Discharge");
set("turret.tesla.upgrade.chain.4.desc", "Arcs across 10 enemies with zero damage falloff per bounce.");

set("turret.tesla.path.voltage.name", "VOLTAGE");
set("turret.tesla.upgrade.voltage.1.name", "Heavy Transformer");
set("turret.tesla.upgrade.voltage.1.desc", "+5 damage per arc.");
set("turret.tesla.upgrade.voltage.2.name", "Dielectric Breaker");
set("turret.tesla.upgrade.voltage.2.desc", "+10 damage per arc.");
set("turret.tesla.upgrade.voltage.3.name", "Kilovolt Pulse");
set("turret.tesla.upgrade.voltage.3.desc", "+18 damage per arc.");
set("turret.tesla.upgrade.voltage.4.name", "Megawatt Overvoltage");
set("turret.tesla.upgrade.voltage.4.desc", "Devastating electric bolts disintegrating light mutants instantly.");

set("turret.tesla.path.overcharge.name", "OVERCHARGE");
set("turret.tesla.upgrade.overcharge.1.name", "Rapid Induction");
set("turret.tesla.upgrade.overcharge.1.desc", "+20% attack rate.");
set("turret.tesla.upgrade.overcharge.2.name", "Electromagnetic Stun");
set("turret.tesla.upgrade.overcharge.2.desc", "Lightning has a 15% chance to stun hostiles for 0.7s.");
set("turret.tesla.upgrade.overcharge.3.name", "Capacitor Bank");
set("turret.tesla.upgrade.overcharge.3.desc", "+25% attack rate.");
set("turret.tesla.upgrade.overcharge.4.name", "Storm Conductor");
set("turret.tesla.upgrade.overcharge.4.desc", "Creates permanent electric storm fields stunning and zapping all targets.");

// 7. INCINERATOR (Soplete de Foso / Horno Incinerador)
set("turret.incinerator.name", "TRENCH INCINERATOR");
set("turret.incinerator.role", "INCENDIARY AREA");
set("turret.incinerator.desc", "High-pressure flamethrower cone engulfing entire columns of hostiles in sustained fire.");
set("turret.incinerator.path.fuel.name", "FUEL");
set("turret.incinerator.upgrade.fuel.1.name", "Heavy Hydrocarbons");
set("turret.incinerator.upgrade.fuel.1.desc", "+20% burn damage.");
set("turret.incinerator.upgrade.fuel.2.name", "Thick Gel Matrix");
set("turret.incinerator.upgrade.fuel.2.desc", "Burn duration increased by 2s.");
set("turret.incinerator.upgrade.fuel.3.name", "Corrosive Additives");
set("turret.incinerator.upgrade.fuel.3.desc", "Fire melts through armor, reducing physical resistance by 30%.");
set("turret.incinerator.upgrade.fuel.4.name", "Thermite Inferno");
set("turret.incinerator.upgrade.fuel.4.desc", "White-hot thermite flames dealing extreme continuous damage.");

set("turret.incinerator.path.pressure.name", "PRESSURE");
set("turret.incinerator.upgrade.pressure.1.name", "Dual Pneumatic Pump");
set("turret.incinerator.upgrade.pressure.1.desc", "+20% flame range.");
set("turret.incinerator.upgrade.pressure.2.name", "Broad Nozzle");
set("turret.incinerator.upgrade.pressure.2.desc", "+25% flame cone angle.");
set("turret.incinerator.upgrade.pressure.3.name", "Pressure Booster");
set("turret.incinerator.upgrade.pressure.3.desc", "+25% flame range.");
set("turret.incinerator.upgrade.pressure.4.name", "Firestorm Jet");
set("turret.incinerator.upgrade.pressure.4.desc", "Enormous flame jet sweeping 180° across entire defense avenues.");

set("turret.incinerator.path.napalm.name", "NAPALM");
set("turret.incinerator.upgrade.napalm.1.name", "Sticky Residue");
set("turret.incinerator.upgrade.napalm.1.desc", "Burning targets slowed by 15%.");
set("turret.incinerator.upgrade.napalm.2.name", "Flaming Puddles");
set("turret.incinerator.upgrade.napalm.2.desc", "Leaves ground fire burning for 3s.");
set("turret.incinerator.upgrade.napalm.3.name", "Napalm Clots");
set("turret.incinerator.upgrade.napalm.3.desc", "Burning enemies slowed by 30%.");
set("turret.incinerator.upgrade.napalm.4.name", "Scorched Earth");
set("turret.incinerator.upgrade.napalm.4.desc", "Entire ground becomes permanent boiling molten magma.");

// 8. RAILGUN (Cañón de Riel)
set("turret.railgun.name", "RAILGUN");
set("turret.railgun.role", "SNIPER / PIERCE");
set("turret.railgun.desc", "Long-range electromagnetic accelerator piercing through infinite targets in line.");
set("turret.railgun.path.caliber.name", "CALIBER");
set("turret.railgun.upgrade.caliber.1.name", "Depleted Uranium Slugs");
set("turret.railgun.upgrade.caliber.1.desc", "+18 damage.");
set("turret.railgun.upgrade.caliber.2.name", "Kinetic Penetrators");
set("turret.railgun.upgrade.caliber.2.desc", "+28 damage.");
set("turret.railgun.upgrade.caliber.3.name", "Hyper-Velocity Dart");
set("turret.railgun.upgrade.caliber.3.desc", "+45 damage.");
set("turret.railgun.upgrade.caliber.4.name", "Orbital Penetrator");
set("turret.railgun.upgrade.caliber.4.desc", "Pierces all enemies with colossal direct and shockwave damage.");

set("turret.railgun.path.coils.name", "COILS");
set("turret.railgun.upgrade.coils.1.name", "Supercooled Coils");
set("turret.railgun.upgrade.coils.1.desc", "+20% fire rate.");
set("turret.railgun.upgrade.coils.2.name", "Capacitor Recharge");
set("turret.railgun.upgrade.coils.2.desc", "+25% fire rate.");
set("turret.railgun.upgrade.coils.3.name", "Pulse Inverter");
set("turret.railgun.upgrade.coils.3.desc", "+30% fire rate.");
set("turret.railgun.upgrade.coils.4.name", "Continuous Rail Accelerators");
set("turret.railgun.upgrade.coils.4.desc", "Rapidly fires hypersonic kinetic slugs without cooldown delay.");

set("turret.railgun.path.scope.name", "OPTICS & TARGETING");
set("turret.railgun.upgrade.scope.1.name", "Laser Rangefinder");
set("turret.railgun.upgrade.scope.1.desc", "+25% targeting range.");
set("turret.railgun.upgrade.scope.2.name", "Weakpoint Analysis");
set("turret.railgun.upgrade.scope.2.desc", "+20% critical strike chance.");
set("turret.railgun.upgrade.scope.3.name", "Thermal Sights");
set("turret.railgun.upgrade.scope.3.desc", "+35% targeting range.");
set("turret.railgun.upgrade.scope.4.name", "Target Lock Array");
set("turret.railgun.upgrade.scope.4.desc", "Guaranteed critical hits against bosses and priority armored targets.");

// 9. COLLECTOR (Recolector de Chatarra)
set("turret.collector.name", "SCRAP CONDENSER");
set("turret.collector.role", "ECONOMY");
set("turret.collector.desc", "Industrial vacuum condenser sucking in nearby scrap and generating passive dividends.");
set("turret.collector.path.yield.name", "YIELD");
set("turret.collector.upgrade.yield.1.name", "Magnetic Siphon");
set("turret.collector.upgrade.yield.1.desc", "+25% scrap pickup radius.");
set("turret.collector.upgrade.yield.2.name", "Centrifugal Sorter");
set("turret.collector.upgrade.yield.2.desc", "+10% scrap earned per drop.");
set("turret.collector.upgrade.yield.3.name", "Compressor Chamber");
set("turret.collector.upgrade.yield.3.desc", "+20% scrap earned per drop.");
set("turret.collector.upgrade.yield.4.name", "Molecular Smelter");
set("turret.collector.upgrade.yield.4.desc", "Doubles all scrap values and automatically vacuums map-wide drops.");

set("turret.collector.path.logistics.name", "LOGISTICS");
set("turret.collector.upgrade.logistics.1.name", "Drone Couriers");
set("turret.collector.upgrade.logistics.1.desc", "Increases pickup range by 30%.");
set("turret.collector.upgrade.logistics.2.name", "Rapid Conveyor");
set("turret.collector.upgrade.logistics.2.desc", "Generates +1 scrap every 5s passively.");
set("turret.collector.upgrade.logistics.3.name", "Pneumatic Distribution");
set("turret.collector.upgrade.logistics.3.desc", "Generates +2 scrap every 4s passively.");
set("turret.collector.upgrade.logistics.4.name", "Automated Smelting Foundry");
set("turret.collector.upgrade.logistics.4.desc", "Generates continuous stream of scrap and discounts all tower upgrades by 15%.");

set("turret.collector.path.reserve.name", "RESERVE");
set("turret.collector.upgrade.reserve.1.name", "Reinforced Hopper");
set("turret.collector.upgrade.reserve.1.desc", "Refund on sold towers increased by 10%.");
set("turret.collector.upgrade.reserve.2.name", "Emergency Battery");
set("turret.collector.upgrade.reserve.2.desc", "Grants +50 scrap upon completing each wave.");
set("turret.collector.upgrade.reserve.3.name", "Titanium Silo");
set("turret.collector.upgrade.reserve.3.desc", "Grants +100 scrap upon completing each wave.");
set("turret.collector.upgrade.reserve.4.name", "Strategic Reserve Vault");
set("turret.collector.upgrade.reserve.4.desc", "Instantly awards 250 scrap and +25% end-of-wave interest.");

// 10. PRESS (Prensa de Vía)
set("turret.press.name", "PISTON PRESS");
set("turret.press.role", "CLOSE CONTROL");
set("turret.press.desc", "Heavy mechanical floor hammer slamming down on passing enemies with severe crush damage.");
set("turret.press.path.pressure.name", "PRESSURE");
set("turret.press.upgrade.pressure.1.name", "Pneumatic Pistons");
set("turret.press.upgrade.pressure.1.desc", "+20% crush damage.");
set("turret.press.upgrade.pressure.2.name", "Hydraulic Overdrive");
set("turret.press.upgrade.pressure.2.desc", "+35% crush damage.");
set("turret.press.upgrade.pressure.3.name", "Reinforced Anvil");
set("turret.press.upgrade.pressure.3.desc", "+50% crush damage.");
set("turret.press.upgrade.pressure.4.name", "Industrial Crusher");
set("turret.press.upgrade.pressure.4.desc", "Instantly crushes hostiles below 30% HP; massive boss damage.");

set("turret.press.path.cadence.name", "CADENCE");
set("turret.press.upgrade.cadence.1.name", "Counterweight Balance");
set("turret.press.upgrade.cadence.1.desc", "+20% slam rate.");
set("turret.press.upgrade.cadence.2.name", "Dual Hydraulic Cylinder");
set("turret.press.upgrade.cadence.2.desc", "+25% slam rate.");
set("turret.press.upgrade.cadence.3.name", "Fast Return Valve");
set("turret.press.upgrade.cadence.3.desc", "+30% slam rate.");
set("turret.press.upgrade.cadence.4.name", "Piston Hurricane");
set("turret.press.upgrade.cadence.4.desc", "Slams down continuously with rapid seismic shockwaves.");

set("turret.press.path.weight.name", "WEIGHT & STUN");
set("turret.press.upgrade.weight.1.name", "Lead Base");
set("turret.press.upgrade.weight.1.desc", "Slams stun enemies for 0.5s.");
set("turret.press.upgrade.weight.2.name", "Seismic Tremor");
set("turret.press.upgrade.weight.2.desc", "Stun duration increased to 1.0s in wider area.");
set("turret.press.upgrade.weight.3.name", "Tungsten Weight");
set("turret.press.upgrade.weight.3.desc", "Stun duration increased to 1.5s; pushes enemies backward.");
set("turret.press.upgrade.weight.4.name", "Tectonic Impact");
set("turret.press.upgrade.weight.4.desc", "Slams trigger devastating 3s stuns and strip armor permanently.");

// 11. EJECTOR (Eyección Hidráulica)
set("turret.ejector.name", "HYDRAULIC EJECTOR");
set("turret.ejector.role", "DISPLACEMENT");
set("turret.ejector.desc", "Pneumatic shockwave repulsor blasting enemies backward along the track.");
set("turret.ejector.path.pressure.name", "PRESSURE");
set("turret.ejector.upgrade.pressure.1.name", "High-Volume Reservoir");
set("turret.ejector.upgrade.pressure.1.desc", "+25% knockback force.");
set("turret.ejector.upgrade.pressure.2.name", "Compressed Blast");
set("turret.ejector.upgrade.pressure.2.desc", "+40% knockback force.");
set("turret.ejector.upgrade.pressure.3.name", "Supersonic Expulsion");
set("turret.ejector.upgrade.pressure.3.desc", "+60% knockback force.");
set("turret.ejector.upgrade.pressure.4.name", "Atmospheric Cannon");
set("turret.ejector.upgrade.pressure.4.desc", "Hurls entire squads of enemies all the way back to the breach entrance.");

set("turret.ejector.path.valve.name", "VALVE & RECHARGE");
set("turret.ejector.upgrade.valve.1.name", "Fast Exhaust");
set("turret.ejector.upgrade.valve.1.desc", "+20% recharge speed.");
set("turret.ejector.upgrade.valve.2.name", "Rotary Valve");
set("turret.ejector.upgrade.valve.2.desc", "+25% recharge speed.");
set("turret.ejector.upgrade.valve.3.name", "Dual Compressor");
set("turret.ejector.upgrade.valve.3.desc", "+30% recharge speed.");
set("turret.ejector.upgrade.valve.4.name", "Continuous Pulse Engine");
set("turret.ejector.upgrade.valve.4.desc", "Blasts sonic shockwaves every 1.5 seconds.");

set("turret.ejector.path.reflux.name", "REFLUX & SHOCK");
set("turret.ejector.upgrade.reflux.1.name", "Acoustic Concussion");
set("turret.ejector.upgrade.reflux.1.desc", "Enemies blown back are dazed for 1s.");
set("turret.ejector.upgrade.reflux.2.name", "Shrapnel Dust");
set("turret.ejector.upgrade.reflux.2.desc", "Deals 12 physical damage on expulsion.");
set("turret.ejector.upgrade.reflux.3.name", "Vortex Cavitation");
set("turret.ejector.upgrade.reflux.3.desc", "Deals 25 damage and dazes for 2s.");
set("turret.ejector.upgrade.reflux.4.name", "Kinetic Singularity");
set("turret.ejector.upgrade.reflux.4.desc", "Pushes back and then implodes enemies together for massive combo damage.");


// Additional keys
set("mode.core_defense.badge", "★ MAIN CAMPAIGN // 12 WAVES");
set("mode.core_defense.shortTitle", "TOWER DEFENSE");
set("mode.core_defense.tagline", "Deploy defenses along industrial tracks, survive 12 lethal waves, and protect the biomechanical reactor.");
set("mode.core_defense.objectiveTitle", "DEFENSE PROTOCOL");
set("mode.core_defense.objectiveDefault", "Prevent hostile entities from breaching the Core airlock");
set("mode.survival.badge", "SECONDARY MODE // ARCADE");
set("mode.survival.shortTitle", "SURVIVAL");
set("mode.survival.tagline", "Fast-paced secondary mode: direct combat without turrets, harvest serum, and purge all 5 plant bosses.");
set("mode.survival.objectiveTitle", "FACILITY DIRECTIVE");
set("mode.survival.objectiveDefault", "Locate and purge all facility bosses");

set("boss.boss_furnace.name", "CREMATORY AUTOMATON NO. 09");
set("enemy.nest.name", "WALKING NEST");
set("enemy.regenerator.name", "PLAGUE SUTURER");

set("tutorial.step.build.title", "STEP 1 · BUILD");
set("tutorial.step.build.text", "Press [E] to open the turret terminal and select NAILER. Then aim at the floor: green ring indicates valid placement; red is blocked. Place with left-click or [E].");
set("tutorial.step.build.hint", "Green ring near Core · [E] opens terminal");
set("tutorial.step.upgrade.title", "STEP 2 · UPGRADE");
set("tutorial.step.upgrade.text", "Approach your turret and press [E]. It features 3 upgrade paths with 4 tiers each. Upgrade FIRE RATE to tier 2 to unlock TWIN BARRELS. Only one path can exceed tier 2: choose your specialization.");
set("tutorial.step.upgrade.hint", "Approach turret and press [E]");
set("tutorial.step.synergy.title", "STEP 3 · SYNERGY");
set("tutorial.step.synergy.text", "Combine tactical roles. FROST slows and clusters enemies; BOMBARDIER punishes dense clusters with explosive area damage. Build one of each near the route. Cyan and orange rings are tactical suggestions: place them wherever you prefer.");
set("tutorial.step.synergy.hint", "Build FROST + BOMBARDIER");
set("tutorial.step.practice.title", "STEP 4 · LIVE FIRE");
set("tutorial.step.practice.text", "A hostile vanguard is approaching. Watch how Frost slows the pack while the Bombardier inflicts heavy area damage. Fallen enemies drop SCRAP that flies toward you.");
set("tutorial.step.practice.hint", "Defend the core");
set("tutorial.step.done.title", "TRAINING COMPLETE");
set("tutorial.step.done.text", "Advanced synergies: FROST (Shatter) + Area/Incendiary (+40%); GUARD POST (Juggernaut) + WORKSHOP (Shield/Repair); WORKSHOP (Overclock) + NAILER (Lead Storm). Selling refunds 50%. Press [SPACE] to launch the real assault.");
set("tutorial.step.done.hint", "[SPACE] COMMENCE ASSAULT");

set("turret.stat.damage", "DMG");
set("turret.stat.fireRate", "RATE");
set("turret.stat.range", "RANGE");
set("turret.stat.aoe", "AREA");
set("turret.stat.slow", "SLOW");
set("turret.stat.radius", "RADIUS");
set("turret.stat.allies", "ALLIES");
set("turret.stat.every", "EVERY");
set("turret.stat.buffDamage", "BUFF DMG");
set("turret.stat.chain", "CHAIN");
set("turret.stat.burn", "BURN");
set("turret.stat.singleTarget", "SINGLE TARGET");
set("turret.stat.scrapPerWave", "SCRAP");
set("turret.stat.push", "FORCE");
set("turret.stat.stun", "STUN");

set("ui.topbar.sector", "SECTOR 07-B // CONTAINMENT RAILS");
set("ui.topbar.teeth", "TEETH:");
set("ui.topbar.settings", "SETTINGS");
set("ui.menu.campaign_badge", "★ MAIN CAMPAIGN // 12 WAVES");
set("ui.menu.arcade_badge", "SECONDARY MODE // FAST ACTION · ENDLESS HORDE");
set("ui.menu.play_td", "[ PLAY : TOWER DEFENSE ]");
set("ui.menu.play_surv", "[ PLAY : SURVIVAL ]");
set("ui.menu.tutorial_td", "TD TUTORIAL");
set("ui.menu.online", "P2P MULTIPLAYER");
set("ui.menu.dossier_title", "SERVICE DOSSIER");
set("ui.menu.dossier_mode_td", "DOSSIER // TOWER DEFENSE");
set("ui.menu.dossier_mode_surv", "DOSSIER // SURVIVAL");
set("ui.menu.dossier_directive_title", "TACTICAL DIRECTIVE:");
set("ui.menu.dossier_directive_td", "Deploy defenses along industrial tracks, survive 12 lethal waves, and protect the biomechanical reactor.");
set("ui.menu.dossier_directive_surv", "Fast-paced secondary mode: direct combat without turrets, harvest serum, and purge all 5 plant bosses.");
set("ui.menu.dossier_metric_td", "BEST WAVE DEFENDED:");
set("ui.menu.dossier_metric_surv", "BEST TIME IN FACILITY:");
set("ui.menu.dossier_runs", "EXPEDITIONS RECORDED:");
set("ui.menu.dossier_kills", "HOSTILES PURGED:");
set("ui.menu.dossier_bosses", "PLANT BOSSES PURGED:");
set("ui.menu.dossier_upgrades", "IMPLANTS ACQUIRED:");
set("ui.menu.controls_title", "FIELD CONTROLS:");
set("ui.menu.controls_desc", "WASD - Move · Mouse - Aim · Space - Jump · Shift - Dash · F - Start Wave · E - Turrets · Tab - Map");

set("ui.settings.save_return", "[ SAVE & RETURN ]");
set("ui.settings.audio_section", "AUDIO SUBSYSTEM");
set("ui.settings.master_vol", "MASTER VOLUME:");
set("ui.settings.sfx_vol", "SFX & COMBAT:");
set("ui.settings.music_vol", "ADAPTIVE MUSIC:");
set("ui.settings.amb_vol", "FACILITY AMBIENCE:");
set("ui.settings.mute_global", "MUTE ALL AUDIO:");
set("ui.settings.video_section", "VIDEO SUBSYSTEM");
set("ui.settings.res_scale", "RENDER SCALE:");
set("ui.settings.res_03", "0.30x (PIXEL ART · RETRO)");
set("ui.settings.res_044", "0.44x (BALANCED · FAST)");
set("ui.settings.res_065", "0.65x (DETAILED · 720p)");
set("ui.settings.res_10", "1.00x (NATIVE RESOLUTION)");
set("ui.settings.ui_scale", "INTERFACE SCALE:");
set("ui.settings.ui_scale_2x", "x2 (RETRO COMPACT)");
set("ui.settings.ui_scale_3x", "x3 (STANDARD HUD)");
set("ui.settings.ui_scale_4x", "x4 (ENLARGED HUD)");
set("ui.settings.fullscreen", "EXCLUSIVE FULLSCREEN:");
set("ui.settings.crt", "CRT FILTER & FILM GRAIN:");
set("ui.settings.shadows", "DYNAMIC SHADOWS:");
set("ui.settings.fps", "SHOW FPS COUNTER:");
set("ui.settings.controls_section", "INPUT & CAMERA");
set("ui.settings.mouse_sens", "MOUSE SENSITIVITY:");
set("ui.settings.cam_shake", "SCREEN SHAKE:");
set("ui.settings.reset_section", "DATA MANAGEMENT");
set("ui.settings.btn_reset_defaults", "[ RESET SETTINGS TO DEFAULT ]");
set("ui.settings.btn_wipe_save", "[ WIPE SAVED PROGRESS ]");
set("ui.settings.language", "LANGUAGE:");
set("ui.settings.language_auto", "AUTO (SYSTEM)");

set("ui.common.enabled", "ENABLED");
set("ui.common.disabled", "DISABLED");
set("ui.common.fullscreen_on", "FULLSCREEN");
set("ui.common.fullscreen_off", "WINDOWED");
set("ui.common.visible", "VISIBLE");
set("ui.common.hidden", "HIDDEN");

set("ui.pause.title", "SIMULATION SUSPENDED");
set("ui.pause.sub", "TACTICAL PAUSE");
set("ui.pause.resume", "[ RESUME MISSION ]");
set("ui.pause.settings", "[ SETTINGS ]");
set("ui.pause.to_menu", "[ ABORT TO MAIN MENU ]");

set("ui.manual.sec1_title", "1. MOVEMENT & INTERACTION:");
set("ui.manual.sec1_body", "<b>WASD</b> Move · <b>Mouse</b> Aim/Look · <b>Space</b> Jump · <b>Shift</b> Dash/Roll · <b>E</b> Interact / Turret Menu · <b>F</b> Start Wave early · <b>Tab</b> Objective Tracker · <b>ESC / P</b> Pause Menu · <b>F2 / F3</b> Debug Mode.");
set("ui.manual.sec2_title", "2. SURVIVAL MODE:");
set("ui.manual.sec2_body", "Survive as long as possible. A Plant Boss emerges every 3 minutes.");
set("ui.manual.sec3_title", "3. DEFEND THE CORE MODE:");
set("ui.manual.sec3_body", "Protect the Central Biomechanical Reactor across 12 waves. Enemies advance along industrial tracks toward the Core, but will pursue you if you get too close.<br><br>Collect <b>SCRAP</b> from downed hostiles. Press <b>E</b> to open the terminal, select a turret, and place it freely by aiming at the floor with the camera (green ring = valid). Approach a turret and press <b>E</b> to upgrade or sell it. Each turret has 3 upgrade paths and only one can exceed tier 2. The optional interactive tutorial teaches all of this and key synergies.");

set("ui.shop.reserve", "RESERVE:");
set("ui.shop.play_now", "[ DEPLOY DIRECTLY TO FACILITY ]");
set("ui.shop.back", "[ RETURN ]");
set("ui.shop.max", "MAXIMUM");
set("ui.shop.buy", "BUY ({cost})");

set("ui.results.report_title_victory", "CONTAINMENT REPORT // MISSION SUCCESS");
set("ui.results.report_title_td_defeat", "CONTAINMENT BREACH // EVACUATION FAILED");
set("ui.results.report_title_surv_defeat", "DEATH CERTIFICATE // DOSSIER CLOSED");
set("ui.results.victory_headline", "CORE SECURED");
set("ui.results.defeat_headline", "PATIENT EXPIRED");
set("ui.results.cause_default", "CAUSE: DISMEMBERMENT IN INDUSTRIAL PLANT");
set("ui.results.bosses_label", "BOSSES PURGED:");
set("ui.results.run_teeth_label", "TEETH EXTRACTED THIS RUN:");
set("ui.results.total_teeth_label", "TOTAL TEETH RESERVES:");
set("ui.results.td_status_label", "WAVES DEFENDED / LIVES REMAINING:");
set("ui.results.td_status_val", "{waves}/{totalWaves} WAVES · LIVES: {coreHp}/{coreMaxHp}");
set("ui.results.surv_status_label", "FINAL PHASE STATUS:");
set("ui.results.surv_endgame_won", "ACHIEVED (SURPASSED PROTOCOL 15:00)");
set("ui.results.surv_endgame_lost", "FALLEN BEFORE MINUTE 15:00");
set("ui.results.surv_endgame_not_reached", "NOT REACHED");
set("ui.results.btn_restart", "[ NEW EXPEDITION ]");
set("ui.results.btn_shop", "[ BUY PERMANENT UPGRADES ]");

set("ui.map_select.header_tape", "TACTICAL DOSSIER // INDUSTRIAL SECTORS");
set("ui.map_select.title", "DEPLOYMENT SECTOR SELECTION");
set("ui.map_select.back", "[ ◄ RETURN TO MENU ]");
set("ui.map_select.tab_easy_badge", "ENTRY SECTOR");
set("ui.map_select.tab_easy", "EASY");
set("ui.map_select.tab_easy_sub", "150 LIVES · 1 ENTRANCE");
set("ui.map_select.tab_norm_badge", "STANDARD SECTOR");
set("ui.map_select.tab_norm", "NORMAL");
set("ui.map_select.tab_norm_sub", "100 LIVES · 2 ENTRANCES");
set("ui.map_select.tab_hard_badge", "CRITICAL SECTOR");
set("ui.map_select.tab_hard", "HARD");
set("ui.map_select.tab_hard_sub", "75 LIVES · 2 EXITS");
set("ui.map_select.status_completed", "SECURED");
set("ui.map_select.status_record", "REC: {bestWave}/12");
set("ui.map_select.status_no_data", "NO DATA");
set("ui.map_select.entrances.one", "1 ENTRANCE");
set("ui.map_select.entrances.other", "{count} ENTRANCES");
set("ui.map_select.exits.one", "1 EXIT");
set("ui.map_select.exits.other", "{count} EXITS");
set("ui.map_select.diff_label", "DIFFICULTY:");
set("ui.map_select.lives_label", "BASE CONTAINMENT:");
set("ui.map_select.lives_val", "{count} LIVES");
set("ui.map_select.scrap_label", "SUPPLY:");
set("ui.map_select.scrap_val", "{count} SCRAP");
set("ui.map_select.layout_label", "LAYOUT:");
set("ui.map_select.layout_val", "{entrances} ENTRANCE(S) / {exits} EXIT(S)");
set("ui.map_select.deploy_btn", "[ DEPLOY TO THIS SECTOR ► ]");
set("ui.map_select.deploy_sub", "COMMENCE OPERATION // 12 WAVES");

set("ui.char_modal.close", "[X] CLOSE");
set("ui.char_modal.weapon", "WEAPON: {name}");
set("ui.char_modal.confirm", "[ ASSIGN OPERATOR & PROCEED ]");
set("ui.char_modal.waiting_peer", "Teammate is still selecting an operator...");
set("ui.char_modal.assigned_waiting", "[ OPERATOR ASSIGNED // WAITING ]");
set("ui.char_modal.peer_ready", "Teammate ready! Select your operator to begin.");
set("ui.char_modal.all_ready", "BOTH OPERATORS READY! INITIATING DEPLOYMENT...");
set("ui.char_modal.deploying", "[ DEPLOYING! ]");

set("ui.turret_modal.title_place", "DEPLOYMENT TERMINAL // TURRETS");
set("ui.turret_modal.title_turret", "TURRET // {name}");
set("ui.turret_modal.scrap_pill", "SCRAP");
set("ui.turret_modal.skip_prep", "[ START WAVE (F) ]");
set("ui.turret_modal.close", "[ CLOSE (E) ]");
set("ui.turret_modal.footer_tip", "BUILD AND UPGRADE USING SCRAP COLLECTED FROM HOSTILES. ONLY ONE PATH CAN EXCEED LEVEL 2.");
set("ui.turret_modal.place_instructions_html", "Select a turret to place it freely. Closing this console allows aiming at the floor: <b>green</b> = valid, <b>red</b> = blocked. Left-click or <b>E</b> to place; <b>ESC</b> to cancel.");
set("ui.turret_modal.not_enough_scrap", "INSUFFICIENT SCRAP");
set("ui.turret_modal.max_level", "MAX LEVEL");
set("ui.turret_modal.upgrade_btn", "UPGRADE ({cost})");
set("ui.turret_modal.integrity", "INTEGRITY {hp} / {maxHp}");
set("ui.turret_modal.btn_switch_build", "BUILD ANOTHER TURRET");

// Check if any keys from es are missing in en
const missing = Object.keys(es).filter(k => !(k in en));
if (missing.length > 0) {
  console.error(`Missing ${missing.length} keys in EN!`, missing.slice(0, 10));
  process.exit(1);
}

// Generate locales/en.js
const outLines = ['// English localization dictionary for Traces of Rust.', 'export default {'];
const keys = Object.keys(en);
keys.forEach((k, idx) => {
  const isLast = idx === keys.length - 1;
  outLines.push(`  ${JSON.stringify(k)}: ${JSON.stringify(en[k])}${isLast ? '' : ','}`);
});
outLines.push('};');
outLines.push('');

fs.writeFileSync('locales/en.js', outLines.join('\n'), 'utf8');
console.log(`Successfully generated locales/en.js with ${keys.length} keys!`);
