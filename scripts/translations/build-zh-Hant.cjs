const fs = require('fs');
const path = require('path');
const turretsData = require('./turrets-complete.json');
const cjkUi = require('./cjk-ui-translations.cjs');
const commonPhrases = require('./common-ui-phrases.cjs');
const es = require('../../temp-es-dict.json');

const zhHant = {};

// 1. Turrets (345 keys)
const turrets = turretsData.zhHant;
for (const [k, v] of Object.entries(turrets)) {
  zhHant[k] = v;
}

// 2. UI Extra (115 keys) & Common phrases (56 keys)
for (const [k, v] of Object.entries(cjkUi)) {
  if (v.zhHant) {
    zhHant[k] = v.zhHant;
  }
}
for (const [k, v] of Object.entries(commonPhrases)) {
  if (v.zhHant) {
    zhHant[k] = v.zhHant;
  }
}

function set(k, v) {
  if (k in es) {
    zhHant[k] = v;
  }
}

// 3. Modes & Diffs
set("mode.core_defense.title", "塔防模式");
set("mode.core_defense.subtitle", "守衛核心");
set("mode.core_defense.badge", "★ 核心戰役 // 12波次");
set("mode.core_defense.shortTitle", "塔防模式");
set("mode.core_defense.tagline", "在工業軌道上部署防禦砲塔，抵擋12波致命狂攻，死守生化反應堆。");
set("mode.core_defense.objectiveTitle", "防禦協議");
set("mode.core_defense.objectiveDefault", "阻止敵對目標突破核心氣密閘門");
set("mode.survival.title", "生存模式");
set("mode.survival.subtitle", "清洗敵潮");
set("mode.survival.badge", "街機副模式 // 純享割草");
set("mode.survival.shortTitle", "生存模式");
set("mode.survival.tagline", "快節奏直接戰鬥模式：無砲塔輔助，收集血清，徹底剿滅工廠內的5大首領。");
set("mode.survival.objectiveTitle", "工廠指令");
set("mode.survival.objectiveDefault", "搜索並殲滅工廠首領");

set("diff.facil", "簡單");
set("diff.normal", "普通");
set("diff.dificil", "困難");

// 4. Bosses & Enemies
set("boss.boss_butcher.name", "工廠肢解屠夫");
set("boss.boss_siren.name", "鐵絲網之母");
set("boss.boss_furnace.name", "09號焚化自動傀儡");
set("boss.boss_apostle.name", "齒輪使徒");
set("boss.boss_warden.name", "扇區典獄長");

set("enemy.runner.name", "軌道疾行者");
set("enemy.hulk.name", "碎肉衝壓機");
set("enemy.nest.name", "遊蕩巢穴");
set("enemy.regenerator.name", "瘟疫縫合體");
set("enemy.splitter.name", "異化分裂體");

// 5. Rewards & Shop
set("reward.heal_pack.name", "急救輸血包");
set("reward.heal_pack.desc", "立即恢復+75點脈搏。");
set("reward.teeth_bag.name", "拔除的牙齒收納袋");
set("reward.teeth_bag.desc", "獲得+15顆牙齒，可在外科手術台上使用。");

set("shop.dmg.name", "精煉火藥");
set("shop.dmg.desc", "每級基礎傷害+3%（永久）");
set("shop.hp.name", "外科縫合線");
set("shop.hp.desc", "每級最大脈搏+5（永久）");
set("shop.spd.name", "微量麻黃素");
set("shop.spd.desc", "每級移動速度+2%（永久）");
set("shop.atkSpd.name", "機械潤滑劑");
set("shop.atkSpd.desc", "每級攻擊速度+2.5%（永久）");
set("shop.mag.name", "精密攝取鑷");
set("shop.mag.desc", "每級磁鐵吸取半徑+0.35米（永久）");
set("shop.reroll.name", "賄賂莊家");
set("shop.reroll.desc", "重抽次數+1（最高+3）");

// 6. Characters
set("char.otto.title", "V·李希特醫生");
set("char.otto.role", "戰術外科軍醫");
set("char.otto.desc", "執迷於機械生化義肢的前軍醫。牙齒回收與控場大師。");
set("char.otto.passive", "解剖協議");
set("char.otto.passiveDesc", "擊殺菁英怪物掉落牙齒與靈魂的機率+25%。開局自帶1次額外重抽次數。");
set("char.otto.weaponTitle", "切割鋸盤");

set("char.mack.title", "麥克 \"巨錘\"");
set("char.mack.role", "重裝爆破手");
set("char.mack.desc", "配備加固外骨骼的工廠老兵。近身火力毀天滅地，但行動略顯遲緩。");
set("char.mack.passive", "彈道慣性");
set("char.mack.passiveDesc", "所有武器的基礎範圍+30%。重型投射物的擊退距離+50%。");
set("char.mack.weaponTitle", "12口徑散彈槍");

set("char.pepe.title", "佩佩 \"電花\"");
set("char.pepe.role", "電弧焊工");
set("char.pepe.desc", "精通高壓電擊與工業極熱環境的地下電工。");
set("char.pepe.passive", "過載電弧");
set("char.pepe.passiveDesc", "攻擊時有20%機率向附近2名敵人傳導連鎖閃電，造成40%傷害。");
set("char.pepe.weaponTitle", "熱線噴槍");

set("char.morbo.title", "莫爾博");
set("char.morbo.role", "瘟疫攜帶者");
set("char.morbo.desc", "生化化學實驗倖存者。周身時刻散發著致命的劇毒腐蝕性濃霧。");
set("char.morbo.passive", "強蝕分泌物");
set("char.morbo.passiveDesc", "光環內的敵人移動速度降低15%，且每秒損失最大生命值的2%。");
set("char.morbo.weaponTitle", "膽汁香爐");

set("char.bob.title", "鮑勃 \"潤滑工\"");
set("char.bob.role", "戰鬥機械師");
set("char.bob.desc", "自主器械、壓力感測器與破片爆破裝置的頂尖工程師。");
set("char.bob.passive", "地雷防線網路");
set("char.bob.passiveDesc", "每隔12秒自動在腳下部署一枚造成80點傷害的破片感應地雷。");
set("char.bob.weaponTitle", "破片地雷");

set("char.krauss.title", "克勞斯");
set("char.krauss.role", "扇區處刑官");
set("char.krauss.desc", "配備高壓氣動重型捕鯨槍的冷酷生化狙擊手。");
set("char.krauss.passive", "氣壓張力");
set("char.krauss.passiveDesc", "穿透型投射物每多貫穿一名敵人，傷害遞增+15%。");
set("char.krauss.weaponTitle", "氣動捕鯨槍");

set("char.axel.title", "阿克塞爾");
set("char.axel.role", "牢籠奔行者");
set("char.axel.desc", "操控周身迴旋的奪命鐵鉤牢籠撕碎逼近敵人的狂戰士。");
set("char.axel.passive", "離心動量");
set("char.axel.passiveDesc", "持續奔跑移動時，環繞牢籠的自轉速度最高可額外提升+40%。");
set("char.axel.weaponTitle", "絞肉牢籠");

set("char.tesla.title", "尼古拉");
set("char.tesla.role", "靜電先驅");
set("char.tesla.desc", "對高壓特斯拉電路極度狂熱的科學家。將廢料重新構築為強導電迴路。");
set("char.tesla.passive", "靜電共振");
set("char.tesla.passiveDesc", "擊殺觸電敵人時釋放EMP衝擊波，使3公尺範圍內的敵人暈眩0.8秒。");
set("char.tesla.weaponTitle", "報廢去顫儀");

// 7. Weapons
set("weapon.slash.name", "切割鋸盤");
set("weapon.slash.desc", "飛濺鮮血的高速旋轉鋼鋸刃。附帶3D閃光與強力擊退效果。（不受發射物數量加成）。");
set("weapon.shotgun.name", "12口徑散彈槍");
set("weapon.shotgun.desc", "伴隨劇烈槍口火光與拋殼的強力實彈扇形齊射。");
set("weapon.flamethrower.name", "焚化噴火器");
set("weapon.flamethrower.desc", "照亮黑暗並造成持續灼燒傷害的噴火槍。（不受發射物數量加成）。");
set("weapon.aura.name", "膽汁香爐");
set("weapon.aura.desc", "在周圍生成高腐蝕毒霧力場，使敵人持續扣血並減速。（不受發射物數量加成）。");
set("weapon.mines.name", "破片地雷");
set("weapon.mines.desc", "投擲紅色感應地雷，敵人踩踏時引發大範圍爆破。");
set("weapon.harpoon.name", "氣動捕鯨槍");
set("weapon.harpoon.desc", "發射直線貫穿多名敵對目標的高能穿甲弩箭。");
set("weapon.orbital.name", "絞肉牢籠");
set("weapon.orbital.desc", "綴滿鐵鉤與頭骨的鋼鐵鐵籠周身環繞迴旋，撕碎逼近的敵群。");
set("weapon.bolt.name", "報廢去顫儀");
set("weapon.bolt.desc", "釋放高壓電火花在多名敵人之間跳躍電擊。（不受發射物數量加成）。");
set("weapon.chakram.name", "廢料回旋鏢");
set("weapon.chakram.desc", "如鋸盤般向前斬切敵人並在回手時造成來回二次傷害。");
set("weapon.welder.name", "弧焊槍");
set("weapon.welder.desc", "充能2.4秒後，朝敵人最為密集的方位噴射持續1.6秒的極高熱雷射束。（不受發射物數量加成）。");
set("weapon.grenade.name", "朝聖者手榴彈");
set("weapon.grenade.desc", "擲出拋物線破片手榴彈，升級後爆炸可分裂出多枚二次爆破子炸彈。");
set("weapon.hammer.name", "活塞重錘");
set("weapon.hammer.desc", "砸地產生附帶強力擊退與暈眩效果的輻射震盪波。（不受發射物數量加成）。");
set("weapon.acid.name", "強酸燒瓶");
set("weapon.acid.desc", "落地碎裂形成大片溶解酸液池，減速並持續腐蝕踏入的敵人。");

set("weapon.short.slash", "鋸盤");
set("weapon.short.shotgun", "散彈槍");
set("weapon.short.flamethrower", "噴火槍");
set("weapon.short.aura", "香爐");
set("weapon.short.mines", "地雷");
set("weapon.short.harpoon", "捕鯨槍");
set("weapon.short.orbital", "牢籠");
set("weapon.short.bolt", "去顫儀");
set("weapon.short.chakram", "回旋鏢");
set("weapon.short.welder", "焊槍");
set("weapon.short.grenade", "手榴彈");
set("weapon.short.hammer", "重錘");
set("weapon.short.acid", "酸液");

// 8. Passives
set("passive.multishot.name", "擴容彈膛");
set("passive.multishot.desc", "受支援的武器發射物數量額外+1。");
set("passive.dmg.name", "壓縮火藥");
set("passive.dmg.desc", "全武器傷害每級提升+15%。");
set("passive.atkSpd.name", "生鏽伺服閥");
set("passive.atkSpd.desc", "攻擊速度與迴轉速度每級提升+10%。");
set("passive.maxHp.name", "外科裝甲板");
set("passive.maxHp.desc", "最大脈搏上限+25，並立即等額回復。");
set("passive.regen.name", "靜脈滴注管");
set("passive.regen.desc", "每秒自動恢復+0.9脈搏生命。");
set("passive.moveSpd.name", "工業麻黃素");
set("passive.moveSpd.desc", "移動速度每級提升+8%。");
set("passive.area.name", "擴散破片");
set("passive.area.desc", "所有攻擊的作用範圍與殺傷面積每級提升+12%。");
set("passive.crit.name", "屠宰目鏡");
set("passive.crit.desc", "造成2倍傷害的暴擊機率提升+7%。");
set("passive.magnet.name", "吊裝磁鐵");
set("passive.magnet.desc", "擴大血清與牙齒的磁力吸附半徑。");

set("passive.format.multishot", "+{lvl} 發射物");
set("passive.format.dmg", "+{pct}% 傷害");
set("passive.format.atkSpd", "+{pct}% 攻速");
set("passive.format.maxHp", "+{hp} 脈搏");
set("passive.format.regen", "+{val} HP/秒");
set("passive.format.moveSpd", "+{pct}% 跑速");
set("passive.format.area", "+{pct}% 範圍");
set("passive.format.crit", "+{pct}% 暴擊");
set("passive.format.magnet", "+{val}M 磁鐵");

// 9. Maps
set("map.easy_plaza.name", "中央樞紐廣場");
set("map.easy_plaza.badge", "簡單 // 360°回環路徑");
set("map.easy_plaza.desc", "視野極度開闊的圓形廣場。敵人會先在開闊外環迂迴行進，然後再直取核心。");

set("map.easy_spiral.name", "螺旋沉降深井");
set("map.easy_spiral.badge", "簡單 // 連續迴旋死鬥");
set("map.easy_spiral.desc", "砲塔部署密度極高的盤旋下行通道。超遠距火砲與冷凍站的絕佳靶場。");

set("map.easy_serpentine.name", "蛇形戰術塹壕");
set("map.easy_serpentine.badge", "簡單 // 連續S形迴環");
set("map.easy_serpentine.desc", "擁有5道髮夾彎的狹長塹壕。範圍爆破與噴火砲塔具備壓倒性優勢。");

set("map.easy_ramps.name", "高架吊裝貨運斜坡");
set("map.easy_ramps.badge", "簡單 // 垂直階梯引道");
set("map.easy_ramps.desc", "兩條下行斜坡最終匯聚於中央加固承重主橋。");

set("map.easy_cooling.name", "同心冷卻回流環");
set("map.easy_cooling.badge", "簡單 // 雙層防衛圓環");
set("map.easy_cooling.desc", "環狀工業冷卻水路。敵人必須突破外環管線，方能逼近內部反應堆。");

set("map.easy_horseshoe.name", "鋼鐵重型馬蹄彎");
set("map.easy_horseshoe.badge", "簡單 // U形絕對瓶頸");
set("map.easy_horseshoe.desc", "四周環繞高台的U形狹道。可在彎道正中構築毀天滅地的交叉火力網。");

set("map.norm_twins.name", "雙生對稱迴廊");
set("map.norm_twins.badge", "普通 // 雙路平行突襲");
set("map.norm_twins.desc", "從東西兩側同時湧來的對稱雙通道。必須兩翼均衡分配防衛力量。");

set("map.norm_pincer.name", "液壓雙向鉗夾通道");
set("map.norm_pincer.badge", "普通 // 90°雙向鉗擊");
set("map.norm_pincer.desc", "呈直角交錯的兩條突進路線，徑直向中央狹小的核心施壓。");

set("map.norm_cross.name", "工廠中央十字路口");
set("map.norm_cross.badge", "普通 // 四象限交叉穿插");
set("map.norm_cross.desc", "東西南北四面八方輪番湧現敵潮的危險四岔路口。");

set("map.norm_funnel.name", "廢渣熔爐漏斗");
set("map.norm_funnel.badge", "普通 // 三路匯流咽喉");
set("map.norm_funnel.desc", "3處寬闊的進犯入口，急劇收縮匯聚為單條極其狹窄的防衛走廊。");

set("map.norm_braid.name", "多層交織高架橋");
set("map.norm_braid.badge", "普通 // 立體上下立交");
set("map.norm_braid.desc", "立體縱橫交錯的雙層路線。必須進行全方位全視角的火力部署。");

set("map.norm_pit.name", "熔礦排渣深坑");
set("map.norm_pit.badge", "普通 // 環形深井漏斗");
set("map.norm_pit.desc", "盤旋下探至熾熱坑底的螺旋通道，核心就坐落於深坑正中心。");

set("map.hard_isolated.name", "9號隔離分裂扇區");
set("map.hard_isolated.badge", "困難 // 徹底雙核分裂");
set("map.hard_isolated.desc", "完全被物理阻斷的兩個獨立核心。必須構築互無增援的兩道防線。");

set("map.hard_diagonal.name", "對角閃擊捷徑");
set("map.hard_diagonal.badge", "困難 // 超短直道衝刺");
set("map.hard_diagonal.desc", "直線距離最短的貫通對角線。若缺乏強力減速，敵人20秒內即可撞碎核心。");

set("map.hard_express.name", "特快重載貨運專線");
set("map.hard_express.badge", "困難 // 極速狂飆直道");
set("map.hard_express.desc", "敵群將以超高衝刺移速奔襲而來的軌道走廊。強力控制設備不可或缺。");

set("map.hard_split_level.name", "立井通風跳變裂谷");
set("map.hard_split_level.badge", "困難 // 垂直高落差斷層");
set("map.hard_split_level.desc", "敵潮將直接從高位通風堅井成批跌落至下方防禦平台，防不勝防。");

set("map.hard_blind_alleys.name", "鋼鐵重裝盲巷迷宮");
set("map.hard_blind_alleys.badge", "困難 // 視線完全遮蔽");
set("map.hard_blind_alleys.desc", "由重型鋼板層層隔斷的密閉迷宮。遠程砲塔的射界將被嚴重阻隔。");

set("map.hard_dual_breach.name", "歐米茄雙重終焉突破口");
set("map.hard_dual_breach.badge", "困難 // 終局雙翼全面進犯");
set("map.hard_dual_breach.desc", "工廠的最核心深處。規格外的天量敵潮與菁英首領將從兩翼同時爆發狂攻。");

// 10. Tutorial
set("tutorial.step.intro.title", "防衛戰術訓練協議");
set("tutorial.step.intro.text", "任務：堅守12波次保衛核心。敵潮將沿3條工業軌道湧入。殲滅敵軍收集廢料，建造並升級防禦塔抵禦進攻。按 [空白鍵] 開始。");
set("tutorial.step.intro.hint", "按 [空白鍵] 或點擊此處繼續。");

set("tutorial.step.build.title", "步驟1 · 建造部署");
set("tutorial.step.build.text", "按 [E] 鍵打開終端並選擇鉚釘機。將鏡頭準星對準地面即可看到光圈指示（綠圈＝可放置，紅圈＝不可放置）。按滑鼠左鍵或 [E] 部署。");
set("tutorial.step.build.hint", "靠近核心的綠圈 · 按 [E] 打開終端");

set("tutorial.step.upgrade.title", "步驟2 · 升級強化");
set("tutorial.step.upgrade.text", "靠近已建成的防禦塔並按 [E]。每座塔擁有3條4階升級路線。提升攻速至2級以解鎖雙聯槍管。僅能選擇其中一條路線突破至2級以上。");
set("tutorial.step.upgrade.hint", "走近防禦塔並按 [E]");

set("tutorial.step.synergy.title", "步驟3 · 協同戰術");
set("tutorial.step.synergy.text", "組合不同塔的定位。冷凍站負責減速聚怪，迫擊砲則對密集的敵群造成毀滅範圍轟炸。藍色和橙色光圈為推薦位，亦可自由放置。");
set("tutorial.step.synergy.hint", "建造 冷凍中繼站 + 迫擊砲");

set("tutorial.step.practice.title", "步驟4 · 實戰演練");
set("tutorial.step.practice.text", "敵方先遣隊正在逼近。觀察冷凍減速與迫擊砲轟碎敵人的過程。拾取被殲滅敵人掉落的廢料。");
set("tutorial.step.practice.hint", "保衛核心氣密閘門");

set("tutorial.step.done.title", "訓練完成");
set("tutorial.step.done.text", "高階戰術：冷凍（易傷）+ 範圍/烈焰（+40%）；哨戒站（鐵衛）+ 工坊（護盾/維修）；工坊（超頻）+ 鉚釘機（彈幕風暴）。出售可返還50%造價。按 [空白鍵] 開啟實戰。");
set("tutorial.step.done.hint", "[空白鍵] 迎擊入侵");

// 11. HUD
set("hud.objective.title", "當前作戰目標：");
set("hud.objective.default_td", "堅守防線 ({diff})");
set("hud.objective.default_surv", "在敵潮中求生：{time}");
set("hud.objective.purge_boss", "斬首殲滅 {name}");
set("hud.objective.hostiles_left", "剩餘敵對目標：{count}");
set("hud.objective.next_wave_in", "距離下波入侵還有 {time}");
set("hud.objective.first_wave_prep", "布防完畢 // 按 [F] 立即迎敵");
set("hud.objective.rebuilding_operator", "幹員正在重構中... 請堅守陣地");
set("hud.objective.tutorial_active", "教學模式 // {step}");
set("hud.objective.next_boss_in", "下一首領逼近倒數：{time}");
set("hud.objective.endgame_active", "終局清洗開啟：徹底殲滅全圖殘存敵軍");

set("hud.wave.prep", "布防整備期");
set("hud.wave.in_progress", "波次 {current}/{total}");
set("hud.wave.event_badge", "突發事件 // {title}");
set("hud.wave.surv_endgame", "終極決戰爆發");
set("hud.wave.surv_horde", "敵潮正在瘋狂湧入");
set("hud.wave.skip_prompt", "按 [F] 提前開始");
set("hud.wave.announcement_boss", "第 {wave} 波 // 首領接近：{boss}");
set("hud.wave.announcement_progress", "第 {wave} / {total} 波 戰鬥中");
set("hud.wave.announcement_completed", "第 {wave} 波 堅守成功");
set("hud.wave.start_wave", "開始波次");
set("hud.wave.skip_pause", "跳過等待");

set("hud.turret.interact_prompt", "按 [E] 升級 / 出售");
set("hud.turret.place_valid", "部署 {name} · 消耗廢料 {cost} · [ESC] 取消");
set("hud.turret.place_invalid", "{reason} · [ESC] 取消");
set("hud.turret.upgrade_sell", "升級 / 出售 · {name}");
set("hud.turret.build_turret", "建造砲塔");

set("hud.slot.level_short", "LV.{lvl}");
set("hud.slot.weapon_empty", "武器欄位空置");
set("hud.slot.passive_empty", "植入體欄位空置");
set("hud.slot.weapon_title", "{name} (等級 +{lvl}) — {desc}");
set("hud.slot.passive_title", "{name} (等級 +{lvl}): {stat} — {desc}");

set("hud.player_down.title", "[ 幹員大破倒地 // 核心過載懲罰 -{penalty} 生命 ]");
set("hud.player_down.countdown", "重構再生完成倒數：{seconds}秒...");
set("hud.player_down.announcement", "幹員倒地 // 核心受到過載懲罰 (-{penalty} 生命)");

set("hud.core.under_attack", "核心遇襲警報！ // {state}");
set("hud.core.leak_detected.one", "突破警報！ -1 生命");
set("hud.core.leak_detected.other", "突破警報！ -{count} 生命");

set("hud.core.state_stable", "運行穩定");
set("hud.core.state_alert", "防禦警戒");
set("hud.core.state_critical", "極度危險");
set("hud.core.integrity", "{hp}/{max} 核心結構完整度");
set("hud.core.hostiles_counter", "殘存敵軍：{count}");
set("hud.core.state_free_exploration", "自由索敵階段");
set("hud.core.state_pause", "戰術等待：{seconds}秒");

set("hud.boss.alert", "警報：首領 {name} 現身");
set("hud.boss.phase1", "第I階段");
set("hud.boss.phase2", "第II階段 // 狂暴化");

set("hud.teammate_down.tag", "隊友倒地！");
set("hud.teammate_down.title", "隊友大破！ 核心生命扣除 -10");
set("hud.teammate_down.sub", "觸發核心連帶懲罰 // 死守防線！");

set("hud.kinetic.sector_alert", "扇區紅色警報");
set("hud.kinetic.event_started", "突發事件爆發");

set("hud.event.emergency_detected", "監測到緊急危情");
set("hud.event.completed_title", "防衛任務達成");
set("hud.event.leak_banner_tag", "核心洩漏警報");
set("hud.event.sector_alert_tag", "扇區警報");
set("hud.event.started_title", "緊急事件開始");
set("hud.event.survive_sub", "在指定防禦圈內堅守存活75秒");
set("hud.event.climax_tag", "決戰高潮");
set("hud.event.phase3_title", "生化收容失效");
set("hud.event.phase3_sub", "高危變異敵群正在湧入");
set("hud.event.secured_tag", "扇區肅清完畢");
set("hud.event.secured_title", "隔離協議重新上線");
set("hud.event.secured_sub", "成功規避核心懲罰");
set("hud.event.swarm_growing", "敵潮密度急劇攀升中");
set("hud.event.defend_prefix", "防衛目標：");
set("hud.event.survive_prefix", "存活目標：");
set("hud.event.loc_substation_east", "東部配電站");
set("hud.event.loc_generator_west", "西部備用發電機");
set("hud.event.loc_console_north", "北部物流中控終端");
set("hud.event.loc_relay_south", "南部通訊中繼塔");
set("hud.event.loc_containment_zone", "阿爾法生化隔離區");
set("hud.event.title_substation_defended", "配電站防守成功");
set("hud.event.title_sector_purged", "扇區清洗成功");
set("hud.event.phase_format", "階段 {phase}：{title}");
set("hud.event.inside_perimeter", "● 處於防禦圈內（半徑15公尺）");
set("hud.event.outside_perimeter", "▲ 脫離防禦圈（脫離 {dist} 公尺）- 立即返回！");

// 12. UI Menus & Settings
set("ui.topbar.sector", "扇區 07-B // 封鎖通道");
set("ui.topbar.teeth", "牙齒：");
set("ui.topbar.settings", "設定");

set("ui.menu.campaign_badge", "★ 核心戰役 // 12波次");
set("ui.menu.arcade_badge", "副模式 // 純享割草 · 無盡敵潮");
set("ui.menu.play", "[ 出擊 ]");
set("ui.menu.play_td", "[ 出擊：塔防模式 ]");
set("ui.menu.play_surv", "[ 出擊：生存模式 ]");
set("ui.menu.tutorial_td", "塔防新手教學");
set("ui.menu.manual", "[ 戰術手冊與鍵位 ]");
set("ui.menu.shop", "[ 外科診所 / 植入體 ]");
set("ui.menu.online", "P2P多人連線");
set("ui.menu.dossier_title", "服役檔案");
set("ui.menu.dossier_mode_td", "戰績 // 塔防模式");
set("ui.menu.dossier_mode_surv", "戰績 // 生存模式");
set("ui.menu.dossier_directive_title", "戰略指令：");
set("ui.menu.dossier_directive_td", "在工業軌道上部署防禦砲塔，抵擋12波致命狂攻，死守生化反應堆。");
set("ui.menu.dossier_directive_surv", "快節奏直接戰鬥模式：無砲塔輔助，收集血清，徹底剿滅工廠內的5大首領。");
set("ui.menu.dossier_metric_td", "最高通關波次：");
set("ui.menu.dossier_metric_surv", "最長生存時間：");
set("ui.menu.dossier_runs", "出擊總場次：");
set("ui.menu.dossier_kills", "殲滅敵對目標：");
set("ui.menu.dossier_bosses", "擊殺工廠首領：");
set("ui.menu.dossier_upgrades", "獲得植入體總數：");
set("ui.menu.controls_title", "作戰鍵位：");
set("ui.menu.controls_desc", "WASD - 移動 · 滑鼠 - 瞄準 · 空白鍵 - 跳躍 · Shift - 翻滾 · F - 開始波次 · E - 砲塔終端 · Tab - 作戰目標");

set("ui.settings.title", "戰術設定");
set("ui.settings.save_return", "[ 儲存並返回 ]");
set("ui.settings.audio_section", "音效設定");
set("ui.settings.master_vol", "主音量：");
set("ui.settings.sfx_vol", "音效與戰鬥聲 (SFX)：");
set("ui.settings.music_vol", "背景音樂：");
set("ui.settings.amb_vol", "環境音效：");
set("ui.settings.mute_global", "靜音全部音訊：");
set("ui.settings.video_section", "畫面設定");
set("ui.settings.res_scale", "渲染解析度縮放：");
set("ui.settings.res_03", "0.30x (復古像素 · 經典)");
set("ui.settings.res_044", "0.44x (標準平衡 · 推薦)");
set("ui.settings.res_06", "0.60x (清晰細膩)");
set("ui.settings.res_08", "0.80x (高解析度)");
set("ui.settings.res_10", "1.00x (原生 1080p)");
set("ui.settings.damage_text", "跳字傷害數字：");
set("ui.settings.pixel_filter", "像素平滑抗鋸齒：");
set("ui.settings.post_proc", "後期畫面效果處理：");
set("ui.settings.blood_splats", "地面鮮血噴濺殘留：");
set("ui.settings.shake_section", "螢幕震動與輔助");
set("ui.settings.shake_int", "螢幕震動強度：");
set("ui.settings.shake_0", "0% (關閉震動)");
set("ui.settings.shake_50", "50% (減弱震動)");
set("ui.settings.shake_100", "100% (預設標準)");
set("ui.settings.shake_150", "150% (身歷其境)");
set("ui.settings.gameplay_section", "操作與遊戲性");
set("ui.settings.auto_aim", "近戰目標自動輔助吸附：");
set("ui.settings.show_turret_range", "放置時常駐顯示射程：");
set("ui.settings.quick_cast", "快捷技能即時施放：");
set("ui.settings.lang_section", "遊戲語言 / Language");
set("ui.settings.lang_select", "介面語言選擇：");

set("ui.shop.title", "外科醫生手術台");
set("ui.shop.subtitle", "使用拔取的牙齒，在肉體上永久嫁接生化賽博義體強化");
set("ui.shop.teeth_count", "持有牙齒：{count}");
set("ui.shop.cost", "消耗：{cost} 牙齒");
set("ui.shop.max", "已達最高等級");
set("ui.shop.buy", "[ 植入 ]");
set("ui.shop.respec_btn", "[ 重置洗點 // 100%退還牙齒 ]");
set("ui.shop.respec_confirm", "確定要清空所有已升級的永久強化並全額返還消耗的牙齒嗎？");
set("ui.shop.close", "[ 關閉 ]");

set("ui.map_select.title", "作戰扇區選擇");
set("ui.map_select.subtitle", "選擇即將進駐並死守的工業防區");
set("ui.map_select.tab_norm", "標準扇區");
set("ui.map_select.tab_norm_sub", "100 生命 · 2處入口");
set("ui.map_select.tab_hard_badge", "極度危險");
set("ui.map_select.tab_hard", "高危扇區");
set("ui.map_select.tab_hard_sub", "75 生命 · 2處出口");
set("ui.map_select.status_completed", "任務達成");
set("ui.map_select.status_record", "最高紀錄：{bestWave}/12");
set("ui.map_select.status_no_data", "暫無戰績");
set("ui.map_select.entrances.one", "1處入口");
set("ui.map_select.entrances.other", "{count}處入口");
set("ui.map_select.exits.one", "1處出口");
set("ui.map_select.exits.other", "{count}處出口");
set("ui.map_select.diff_label", "難度等級：");
set("ui.map_select.lives_label", "初始核心生命：");
set("ui.map_select.lives_val", "{count} 生命");
set("ui.map_select.scrap_label", "初始儲備補給：");
set("ui.map_select.scrap_val", "{count} 廢料");
set("ui.map_select.layout_label", "通道拓撲：");
set("ui.map_select.layout_val", "{entrances} 入口 / {exits} 出口");
set("ui.map_select.deploy_btn", "[ 空降部署至此扇區 ► ]");
set("ui.map_select.deploy_sub", "防衛行動開始 // 12波次");

set("ui.char_modal.title", "幹員選拔部署");
set("ui.char_modal.sub", "挑選具備獨特專屬初始武器與生化被動特性的作戰幹員");
set("ui.char_modal.close", "[X] 關閉");
set("ui.char_modal.weapon", "初始武器：{name}");
set("ui.char_modal.confirm", "[ 鎖定幹員 // 準備出擊 ]");
set("ui.char_modal.active", "已選定");
set("ui.char_modal.btn_assigned", "[ 已指派 ]");
set("ui.char_modal.btn_select", "[ 選擇出擊 ]");
set("ui.char_modal.waiting_peer", "正在等待隊友選擇幹員...");
set("ui.char_modal.assigned_waiting", "[ 選定完成 // 等待中 ]");
set("ui.char_modal.peer_ready", "隊友已準備完畢！請盡快確認您的出戰幹員。");
set("ui.char_modal.all_ready", "全員就緒！即刻部署至戰場...");
set("ui.char_modal.deploying", "[ 正在出擊！ ]");

set("ui.turret_modal.title_place", "部署操作終端 // 砲塔");
set("ui.turret_modal.title_turret", "防禦塔 // {name}");
set("ui.turret_modal.scrap_pill", "廢料");
set("ui.turret_modal.skip_prep", "[ 立即開波 (F) ]");
set("ui.turret_modal.close", "[ 關閉終端 (E) ]");
set("ui.turret_modal.footer_tip", "使用擊殺敵人回收的廢料進行建造與升級。3條升級路線中僅有一條允許升至2階以上。");
set("ui.turret_modal.place_instructions_html", "選擇砲塔自由放置。關閉面板後將鏡頭瞄準地面：<b>綠圈</b>＝可建，<b>紅圈</b>＝不可建。滑鼠左鍵或<b>E</b>鍵建造，按<b>ESC</b>取消。");
set("ui.turret_modal.not_enough_scrap", "廢料不足");
set("ui.turret_modal.max_level", "已達最高等級");
set("ui.turret_modal.upgrade_btn", "升級 ({cost})");
set("ui.turret_modal.integrity", "結構生命 {hp} / {maxHp}");
set("ui.turret_modal.btn_switch_build", "建造其他砲塔");
set("ui.turret_modal.btn_sell", "出售 (+{refund} 廢料)");

set("ui.levelup.title", "生化神經網絡升級");
set("ui.levelup.subtitle", "請選擇一項全新強化或武器組件");
set("ui.levelup.reroll", "重抽卡牌");
set("ui.levelup.rerolls_remaining.one", "剩餘重抽：1次");
set("ui.levelup.rerolls_remaining.other", "剩餘重抽：{count}次");
set("ui.levelup.skip", "跳過本項選擇 (+50 廢料)");

set("ui.results.title_victory", "扇區徹底肅清 // 任務達成");
set("ui.results.title_defeat", "作戰慘遭潰敗 // 信號中斷");
set("ui.results.subtitle_victory", "全殲所有進犯威脅，生物反應堆安然無恙。");
set("ui.results.subtitle_defeat", "核心結構徹底坍塌，或幹員脈搏信號已停跳。");
set("ui.results.time_survived", "堅持時長：{time}");
set("ui.results.waves_cleared", "通關波次：{waves} / 12");
set("ui.results.enemies_killed", "殲滅敵軍總數：{kills}");
set("ui.results.scrap_earned", "累計回收廢料：{scrap}");
set("ui.results.teeth_earned", "斬獲牙齒：{teeth}");
set("ui.results.btn_retry", "[ 重整再戰 ]");
set("ui.results.btn_menu", "[ 撤回基地 ]");

set("ui.tutorial_prompt.tape", "戰術訓練協議");
set("ui.tutorial_prompt.title", "是否開始基礎實戰訓練？");
set("ui.tutorial_prompt.desc1", "檢測到您的初次作戰記錄。我們為您準備了一套互動式實兵訓練：體驗自由擺塔、BTD6式分支強化、廢料回收以及冷凍+火砲的強力殺戮協同機制。");
set("ui.tutorial_prompt.desc2", "本彈窗僅在首次啟動時提示。後續隨時可在主選單重新開啟訓練。");
set("ui.tutorial_prompt.yes", "[ 接受訓練，進入教學 ]");
set("ui.tutorial_prompt.no", "[ 拒絕訓練，直接奔赴前線 ]");

set("ui.lang_screen.title", "請選擇您的偏好語言");
set("ui.lang_screen.subtitle", "SELECT YOUR LANGUAGE");
set("ui.lang_screen.confirm", "[ 確認選擇並繼續 ]");

set("ui.levelup.new_tag", "新");
set("ui.online.status_init", "正在初始化...");
set("ui.online.btn_leave", "[ 退出房間 ]");
set("ui.online.p2p_not_available", "STEAM P2P不可用");
set("ui.dossier.expeditions", "出擊總場次：");
set("ui.mode.status_choose", "[選擇]");

// Fill in any remaining from es
for (const k of Object.keys(es)) {
  if (!zhHant[k]) {
    zhHant[k] = es[k];
  }
}

// Write out locales/zh-Hant.js
const outputPath = path.resolve(__dirname, '../../locales/zh-Hant.js');
const outLines = ['// Traditional Chinese (Taiwan) localization dictionary for Traces of Rust.', 'export default {'];
const keys = Object.keys(es);
keys.forEach((k, idx) => {
  const isLast = idx === keys.length - 1;
  outLines.push(`  ${JSON.stringify(k)}: ${JSON.stringify(zhHant[k] || es[k])}${isLast ? '' : ','}`);
});
outLines.push('};');
outLines.push('');

fs.writeFileSync(outputPath, outLines.join('\n'), 'utf-8');
console.log(`Generated locales/zh-Hant.js with ${keys.length} keys!`);
