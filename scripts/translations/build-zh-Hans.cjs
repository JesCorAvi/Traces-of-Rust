const fs = require('fs');
const path = require('path');
const turretsData = require('./turrets-complete.json');
const cjkUi = require('./cjk-ui-translations.cjs');
const es = require('../../temp-es-dict.json');

const zhHans = {};

// 1. Turrets (345 keys)
const turrets = turretsData.zhHans;
for (const [k, v] of Object.entries(turrets)) {
  zhHans[k] = v;
}

// 2. UI Extra (115 keys) & Common phrases (56 keys)
for (const [k, v] of Object.entries(cjkUi)) {
  if (v.zhHans) {
    zhHans[k] = v.zhHans;
  }
}
const commonPhrases = require('./common-ui-phrases.cjs');
for (const [k, v] of Object.entries(commonPhrases)) {
  if (v.zhHans) {
    zhHans[k] = v.zhHans;
  }
}

function set(k, v) {
  if (k in es) {
    zhHans[k] = v;
  }
}

// 3. Modes & Diffs
set("mode.core_defense.title", "塔防模式");
set("mode.core_defense.subtitle", "守卫核心");
set("mode.core_defense.badge", "★ 核心战役 // 12波次");
set("mode.core_defense.shortTitle", "塔防模式");
set("mode.core_defense.tagline", "在工业轨道上部署防御炮塔，抵挡12波致命狂攻，死守生化反应堆。");
set("mode.core_defense.objectiveTitle", "防御协议");
set("mode.core_defense.objectiveDefault", "阻止敌对目标突破核心气密门");
set("mode.survival.title", "生存模式");
set("mode.survival.subtitle", "清洗敌潮");
set("mode.survival.badge", "街机副模式 // 纯享清怪");
set("mode.survival.shortTitle", "生存模式");
set("mode.survival.tagline", "快节奏直接战斗模式：无炮塔辅助，收集血清，彻底剿灭工厂内的5大头目。");
set("mode.survival.objectiveTitle", "工厂指令");
set("mode.survival.objectiveDefault", "搜索并歼灭工厂头目");

set("diff.facil", "简单");
set("diff.normal", "普通");
set("diff.dificil", "困难");

// 4. Bosses & Enemies
set("boss.boss_butcher.name", "工厂肢解屠夫");
set("boss.boss_siren.name", "铁丝网之母");
set("boss.boss_furnace.name", "09号焚化自动傀儡");
set("boss.boss_apostle.name", "齿轮使徒");
set("boss.boss_warden.name", "扇区典狱长");

set("enemy.runner.name", "轨道疾行者");
set("enemy.hulk.name", "碎肉冲压机");
set("enemy.nest.name", "游荡巢穴");
set("enemy.regenerator.name", "瘟疫缝合体");
set("enemy.splitter.name", "异化分裂体");

// 5. Rewards & Shop
set("reward.heal_pack.name", "急救输血包");
set("reward.heal_pack.desc", "立即恢复+75点脉搏。");
set("reward.teeth_bag.name", "拔除的牙齿收纳袋");
set("reward.teeth_bag.desc", "获得+15颗牙齿，可在外科手术台上使用。");

set("shop.dmg.name", "精炼火药");
set("shop.dmg.desc", "每级基础伤害+3%（永久）");
set("shop.hp.name", "外科缝合线");
set("shop.hp.desc", "每级最大脉搏+5（永久）");
set("shop.spd.name", "微量麻黄碱");
set("shop.spd.desc", "每级移动速度+2%（永久）");
set("shop.atkSpd.name", "机械润滑剂");
set("shop.atkSpd.desc", "每级攻击速度+2.5%（永久）");
set("shop.mag.name", "精密摄取镊");
set("shop.mag.desc", "每级磁铁吸取半径+0.35米（永久）");
set("shop.reroll.name", "贿赂庄家");
set("shop.reroll.desc", "刷新次数+1（最高+3）");

// 6. Characters
set("char.otto.title", "V·里希特医生");
set("char.otto.role", "战术外科军医");
set("char.otto.desc", "执迷于机械生化义肢的前军医。牙齿回收与控场大师。");
set("char.otto.passive", "解剖协议");
set("char.otto.passiveDesc", "击杀精英怪物掉落牙齿与灵魂的几率+25%。开局自带1次额外刷新次数。");
set("char.otto.weaponTitle", "切割锯盘");

set("char.mack.title", "麦克 \"巨锤\"");
set("char.mack.role", "重装爆破手");
set("char.mack.desc", "配备加固外骨骼的工厂老兵。近身火力毁天灭地，但行动略显迟缓。");
set("char.mack.passive", "弹道惯性");
set("char.mack.passiveDesc", "所有武器的基础范围+30%。重型投射物的击退距离+50%。");
set("char.mack.weaponTitle", "12口径霰弹枪");

set("char.pepe.title", "佩佩 \"电花\"");
set("char.pepe.role", "电弧焊工");
set("char.pepe.desc", "精通高压电击与工业极热环境的地下电工。");
set("char.pepe.passive", "过载电弧");
set("char.pepe.passiveDesc", "攻击时有20%几率向附近2名敌人传导连锁闪电，造成40%伤害。");
set("char.pepe.weaponTitle", "热线喷枪");

set("char.morbo.title", "莫尔博");
set("char.morbo.role", "瘟疫携带者");
set("char.morbo.desc", "生化化学实验幸存者。周身时刻散发着致命的剧毒腐蚀性浓雾。");
set("char.morbo.passive", "强蚀分泌物");
set("char.morbo.passiveDesc", "光环内的敌人移动速度降低15%，且每秒损失最大生命值的2%。");
set("char.morbo.weaponTitle", "胆汁香炉");

set("char.bob.title", "鲍勃 \"润滑工\"");
set("char.bob.role", "战斗机械师");
set("char.bob.desc", "自主器械、压力传感器与破片爆破装置的顶尖工程师。");
set("char.bob.passive", "地雷防线网络");
set("char.bob.passiveDesc", "每隔12秒自动在脚下部署一枚造成80点伤害的破片感应地雷。");
set("char.bob.weaponTitle", "破片地雷");

set("char.krauss.title", "克劳斯");
set("char.krauss.role", "扇区处刑官");
set("char.krauss.desc", "配备高压气动重型捕鲸枪的冷酷生化狙击手。");
set("char.krauss.passive", "气压张力");
set("char.krauss.passiveDesc", "穿透型投射物每多贯穿一名敌人，伤害递增+15%。");
set("char.krauss.weaponTitle", "气动捕鲸枪");

set("char.axel.title", "阿克塞尔");
set("char.axel.role", "牢笼奔行者");
set("char.axel.desc", "操控周身回旋的夺命铁钩牢笼撕碎临近敌人的狂战士。");
set("char.axel.passive", "离心动量");
set("char.axel.passiveDesc", "持续奔跑移动时，环绕牢笼的自转速度最高可额外提升+40%。");
set("char.axel.weaponTitle", "绞肉牢笼");

set("char.tesla.title", "尼古拉");
set("char.tesla.role", "静电先驱");
set("char.tesla.desc", "对高压特斯拉电路极度狂热的科学家。将废料重新构筑为强导电回路。");
set("char.tesla.passive", "静电共振");
set("char.tesla.passiveDesc", "击杀触电敌人时释放EMP冲击波，使3米范围内的敌人眩晕0.8秒。");
set("char.tesla.weaponTitle", "报废除颤仪");

// 7. Weapons
set("weapon.slash.name", "切割锯盘");
set("weapon.slash.desc", "飞溅鲜血的高速旋转钢锯刃。附带3D闪光与强力击退效果。（不受发射物数量加成）。");
set("weapon.shotgun.name", "12口径霰弹枪");
set("weapon.shotgun.desc", "伴随剧烈枪口火光与抛壳的强力实弹扇形齐射。");
set("weapon.flamethrower.name", "焚化喷火器");
set("weapon.flamethrower.desc", "照亮黑暗并造成持续灼烧伤害的喷火枪。（不受发射物数量加成）。");
set("weapon.aura.name", "胆汁香炉");
set("weapon.aura.desc", "在周围生成高腐蚀毒雾力场，使敌人持续扣血并减速。（不受发射物数量加成）。");
set("weapon.mines.name", "破片地雷");
set("weapon.mines.desc", "投掷红色感应地雷，敌人踩踏时引发大范围爆破。");
set("weapon.harpoon.name", "气动捕鲸枪");
set("weapon.harpoon.desc", "发射直线贯穿多名敌对目标的高能穿甲弩箭。");
set("weapon.orbital.name", "绞肉牢笼");
set("weapon.orbital.desc", "缀满铁钩与头骨的钢铁铁笼周身环绕回旋，撕碎逼近的敌群。");
set("weapon.bolt.name", "报废除颤仪");
set("weapon.bolt.desc", "释放高压电火花在多名敌人之间跳跃电击。（不受发射物数量加成）。");
set("weapon.chakram.name", "废料回旋镖");
set("weapon.chakram.desc", "如锯盘般向前斩切敌人并在回手时造成来回二次伤害。");
set("weapon.welder.name", "弧焊枪");
set("weapon.welder.desc", "充能2.4秒后，朝敌人最为密集的方位喷射持续1.6秒的极高热激光束。（不受发射物数量加成）。");
set("weapon.grenade.name", "朝圣者手雷");
set("weapon.grenade.desc", "掷出抛物线破片手雷，升级后爆炸可分裂出多枚二次爆破子炸弹。");
set("weapon.hammer.name", "活塞重锤");
set("weapon.hammer.desc", "砸地产生附带强力击退与眩晕效果的辐射震荡波。（不受发射物数量加成）。");
set("weapon.acid.name", "强酸烧瓶");
set("weapon.acid.desc", "落地碎裂形成大片溶解酸液池，减速并持续腐蚀踏入的敌人。");

set("weapon.short.slash", "锯盘");
set("weapon.short.shotgun", "霰弹枪");
set("weapon.short.flamethrower", "喷火枪");
set("weapon.short.aura", "香炉");
set("weapon.short.mines", "地雷");
set("weapon.short.harpoon", "捕鲸枪");
set("weapon.short.orbital", "牢笼");
set("weapon.short.bolt", "除颤仪");
set("weapon.short.chakram", "回旋镖");
set("weapon.short.welder", "焊枪");
set("weapon.short.grenade", "手雷");
set("weapon.short.hammer", "重锤");
set("weapon.short.acid", "酸液");

// 8. Passives
set("passive.multishot.name", "扩容弹膛");
set("passive.multishot.desc", "受支持的武器发射物数量额外+1。");
set("passive.dmg.name", "压缩火药");
set("passive.dmg.desc", "全武器伤害每级提升+15%。");
set("passive.atkSpd.name", "生锈伺服阀");
set("passive.atkSpd.desc", "攻击速度与回转速度每级提升+10%。");
set("passive.maxHp.name", "外科装甲板");
set("passive.maxHp.desc", "最大脉搏上限+25，并立即等额回复。");
set("passive.regen.name", "静脉滴注管");
set("passive.regen.desc", "每秒自动恢复+0.9脉搏生命。");
set("passive.moveSpd.name", "工业麻黄碱");
set("passive.moveSpd.desc", "移动速度每级提升+8%。");
set("passive.area.name", "扩散破片");
set("passive.area.desc", "所有攻击的作用范围与杀伤面积每级提升+12%。");
set("passive.crit.name", "屠宰目镜");
set("passive.crit.desc", "造成2倍伤害的暴击几率提升+7%。");
set("passive.magnet.name", "吊装磁铁");
set("passive.magnet.desc", "扩大血清与牙齿的磁力吸附半径。");

set("passive.format.multishot", "+{lvl} 发射物");
set("passive.format.dmg", "+{pct}% 伤害");
set("passive.format.atkSpd", "+{pct}% 攻速");
set("passive.format.maxHp", "+{hp} 脉搏");
set("passive.format.regen", "+{val} HP/秒");
set("passive.format.moveSpd", "+{pct}% 移速");
set("passive.format.area", "+{pct}% 范围");
set("passive.format.crit", "+{pct}% 暴击");
set("passive.format.magnet", "+{val}M 磁铁");

// 9. Maps
set("map.easy_plaza.name", "中央枢纽广场");
set("map.easy_plaza.badge", "简单 // 360°回环路径");
set("map.easy_plaza.desc", "视野极度开阔的圆形广场。敌人会先在开阔外环迂回行进，然后再直取核心。");

set("map.easy_spiral.name", "螺旋沉降深井");
set("map.easy_spiral.badge", "简单 // 连续回旋死斗");
set("map.easy_spiral.desc", "炮塔部署密度极高的盘旋下行通道。超远距火炮与冷冻站的绝佳靶场。");

set("map.easy_serpentine.name", "蛇形战术堑壕");
set("map.easy_serpentine.badge", "简单 // 连续S形回环");
set("map.easy_serpentine.desc", "拥有5道发卡弯的狭长堑壕。范围爆破与喷火炮塔具备压倒性优势。");

set("map.easy_ramps.name", "高架吊装货运斜坡");
set("map.easy_ramps.badge", "简单 // 垂直阶梯引道");
set("map.easy_ramps.desc", "两条下行斜坡最终汇聚于中央加固承重主桥。");

set("map.easy_cooling.name", "同心冷却回流环");
set("map.easy_cooling.badge", "简单 // 双层防卫圆环");
set("map.easy_cooling.desc", "环状工业冷却水路。敌人必须突破外环管线，方能逼近内部反应堆。");

set("map.easy_horseshoe.name", "钢铁重型马蹄弯");
set("map.easy_horseshoe.badge", "简单 // U形绝对瓶颈");
set("map.easy_horseshoe.desc", "四周环绕高台的U形狭道。可在弯道正中构筑毁天灭地的交叉火力网。");

set("map.norm_twins.name", "双生对称回廊");
set("map.norm_twins.badge", "普通 // 双路平行突袭");
set("map.norm_twins.desc", "从东西两侧同时涌来的对称双通道。必须两翼均衡分配防卫力量。");

set("map.norm_pincer.name", "液压双向钳夹通道");
set("map.norm_pincer.badge", "普通 // 90°双向钳击");
set("map.norm_pincer.desc", "呈直角交错的两条突进路线，径直向中央狭小的核心施压。");

set("map.norm_cross.name", "工厂中央十字路口");
set("map.norm_cross.badge", "普通 // 四象限交叉穿插");
set("map.norm_cross.desc", "东西南北四面八方轮番涌现敌潮的危险四岔路口。");

set("map.norm_funnel.name", "废渣熔炉漏斗");
set("map.norm_funnel.badge", "普通 // 三路汇流咽喉");
set("map.norm_funnel.desc", "3处宽阔的进犯入口，急剧收缩汇聚为单条极其狭窄的防卫走廊。");

set("map.norm_braid.name", "多层交织高架桥");
set("map.norm_braid.badge", "普通 // 立体上下立交");
set("map.norm_braid.desc", "立体纵横交错的双层路线。必须进行全方位全视角的火力部署。");

set("map.norm_pit.name", "熔矿排渣深坑");
set("map.norm_pit.badge", "普通 // 环形深井漏斗");
set("map.norm_pit.desc", "盘旋下探至炽热坑底的螺旋通道，核心就坐落于深坑正中心。");

set("map.hard_isolated.name", "9号隔离分裂扇区");
set("map.hard_isolated.badge", "困难 // 彻底双核分裂");
set("map.hard_isolated.desc", "完全被物理阻断的两个独立核心。必须构筑互无增援的两道防线。");

set("map.hard_diagonal.name", "对角闪击捷径");
set("map.hard_diagonal.badge", "困难 // 超短直道冲刺");
set("map.hard_diagonal.desc", "直线距离最短的贯通对角线。若缺乏强力减速，敌人20秒内即可撞碎核心。");

set("map.hard_express.name", "特快重载货运专线");
set("map.hard_express.badge", "困难 // 极速狂飙直道");
set("map.hard_express.desc", "敌群将以超高冲刺移速奔袭而来的轨道走廊。强力控制设备不可或缺。");

set("map.hard_split_level.name", "立井通风跳变裂谷");
set("map.hard_split_level.badge", "困难 // 垂直高落差断层");
set("map.hard_split_level.desc", "敌潮将直接从高位通风坚井成批跌落至下方防御平台，防不胜防。");

set("map.hard_blind_alleys.name", "钢铁重装盲巷迷宫");
set("map.hard_blind_alleys.badge", "困难 // 视线完全遮蔽");
set("map.hard_blind_alleys.desc", "由重型钢板层层隔断的密闭迷宫。远程炮塔的射界将被严重阻隔。");

set("map.hard_dual_breach.name", "欧米茄双重终焉突破口");
set("map.hard_dual_breach.badge", "困难 // 终局双翼全面进犯");
set("map.hard_dual_breach.desc", "工厂的最核心深处。规格外的天量敌潮与精英头目将从两翼同时爆发狂攻。");

// 10. Tutorial
set("tutorial.step.intro.title", "防卫战术训练协议");
set("tutorial.step.intro.text", "任务：坚守12波次保卫核心。敌潮将沿3条工业轨道涌入。歼灭敌军收集废料，建造并升级防御塔抵御进攻。按 [空格] 开始。");
set("tutorial.step.intro.hint", "按 [空格键] 或点击此处继续。");

set("tutorial.step.build.title", "步骤1 · 建造部署");
set("tutorial.step.build.text", "按 [E] 键打开终端并选择铆钉机。将镜头准星对准地面即可看到光圈指示（绿圈＝可放置，红圈＝不可放置）。按鼠标左键或 [E] 部署。");
set("tutorial.step.build.hint", "靠近核心的绿圈 · 按 [E] 打开终端");

set("tutorial.step.upgrade.title", "步骤2 · 升级强化");
set("tutorial.step.upgrade.text", "靠近已建成的防御塔并按 [E]。每座塔拥有3条4阶升级路线。提升攻速至2级以解锁双联枪管。仅能选择其中一条路线突破至2级以上。");
set("tutorial.step.upgrade.hint", "走近防御塔并按 [E]");

set("tutorial.step.synergy.title", "步骤3 · 协同战术");
set("tutorial.step.synergy.text", "组合不同塔的定位。冷冻站负责减速聚怪，迫击炮则对密集的敌群造成毁灭范围轰炸。蓝色和橙色光圈为推荐位，亦可自由放置。");
set("tutorial.step.synergy.hint", "建造 冷冻中继站 + 迫击炮");

set("tutorial.step.practice.title", "步骤4 · 实战演练");
set("tutorial.step.practice.text", "敌方先遣队正在逼近。观察冷冻减速与迫击炮轰碎敌人的过程。拾取被歼灭敌人掉落的废料。");
set("tutorial.step.practice.hint", "保卫核心气密门");

set("tutorial.step.done.title", "训练完成");
set("tutorial.step.done.text", "高阶战术：冷冻（易伤）+ 范围/烈焰（+40%）；哨戒站（铁卫）+ 工坊（护盾/维修）；工坊（超频）+ 铆钉机（弹幕风暴）。出售可返还50%造价。按 [空格] 开启实战。");
set("tutorial.step.done.hint", "[空格] 迎击入侵");

// 11. HUD
set("hud.objective.title", "当前作战目标：");
set("hud.objective.default_td", "坚守防线 ({diff})");
set("hud.objective.default_surv", "在敌潮中求生：{time}");
set("hud.objective.purge_boss", "斩首歼灭 {name}");
set("hud.objective.hostiles_left", "剩余敌对目标：{count}");
set("hud.objective.next_wave_in", "距离下波入侵还有 {time}");
set("hud.objective.first_wave_prep", "布防完毕 // 按 [F] 立即迎敌");
set("hud.objective.rebuilding_operator", "特工正在重构中... 请坚守阵地");
set("hud.objective.tutorial_active", "教程模式 // {step}");
set("hud.objective.next_boss_in", "下一头目逼近倒计时：{time}");
set("hud.objective.endgame_active", "终局清洗开启：彻底歼灭全图残存敌军");

set("hud.wave.prep", "布防整备期");
set("hud.wave.in_progress", "波次 {current}/{total}");
set("hud.wave.event_badge", "突发事件 // {title}");
set("hud.wave.surv_endgame", "终极决战爆发");
set("hud.wave.surv_horde", "敌潮正在疯狂涌入");
set("hud.wave.skip_prompt", "按 [F] 提前开始");
set("hud.wave.announcement_boss", "第 {wave} 波 // 头目接近：{boss}");
set("hud.wave.announcement_progress", "第 {wave} / {total} 波 战斗中");
set("hud.wave.announcement_completed", "第 {wave} 波 坚守成功");
set("hud.wave.start_wave", "开始波次");
set("hud.wave.skip_pause", "跳过等待");

set("hud.turret.interact_prompt", "按 [E] 升级 / 出售");
set("hud.turret.place_valid", "部署 {name} · 消耗废料 {cost} · [ESC] 取消");
set("hud.turret.place_invalid", "{reason} · [ESC] 取消");
set("hud.turret.upgrade_sell", "升级 / 出售 · {name}");
set("hud.turret.build_turret", "建造炮塔");

set("hud.slot.level_short", "LV.{lvl}");
set("hud.slot.weapon_empty", "武器槽空置");
set("hud.slot.passive_empty", "植入体槽空置");
set("hud.slot.weapon_title", "{name} (等级 +{lvl}) — {desc}");
set("hud.slot.passive_title", "{name} (等级 +{lvl}): {stat} — {desc}");

set("hud.player_down.title", "[ 特工大破倒地 // 核心过载惩罚 -{penalty} 生命 ]");
set("hud.player_down.countdown", "重构再生完成倒计时：{seconds}秒...");
set("hud.player_down.announcement", "特工倒地 // 核心受到过载惩罚 (-{penalty} 生命)");

set("hud.core.under_attack", "核心遇袭警报！ // {state}");
set("hud.core.leak_detected.one", "突破警报！ -1 生命");
set("hud.core.leak_detected.other", "突破警报！ -{count} 生命");

set("hud.core.state_stable", "运行稳定");
set("hud.core.state_alert", "防御警戒");
set("hud.core.state_critical", "极度危险");
set("hud.core.integrity", "{hp}/{max} 核心结构完整度");
set("hud.core.hostiles_counter", "残存敌军：{count}");
set("hud.core.state_free_exploration", "自由索敌阶段");
set("hud.core.state_pause", "战术等待：{seconds}秒");

set("hud.boss.alert", "警报：头目 {name} 现身");
set("hud.boss.phase1", "第I阶段");
set("hud.boss.phase2", "第II阶段 // 狂暴化");

set("hud.teammate_down.tag", "队友倒地！");
set("hud.teammate_down.title", "队友大破！ 核心生命扣除 -10");
set("hud.teammate_down.sub", "触发核心连带惩罚 // 死守防线！");

set("hud.kinetic.sector_alert", "扇区红色警报");
set("hud.kinetic.event_started", "突发事件爆发");

set("hud.event.emergency_detected", "监测到紧急危情");
set("hud.event.completed_title", "防卫任务达成");
set("hud.event.leak_banner_tag", "核心泄漏警报");
set("hud.event.sector_alert_tag", "扇区警报");
set("hud.event.started_title", "紧急事件开始");
set("hud.event.survive_sub", "在指定防御圈内坚守存活75秒");
set("hud.event.climax_tag", "决战高潮");
set("hud.event.phase3_title", "生化收容失效");
set("hud.event.phase3_sub", "高危变异敌群正在涌入");
set("hud.event.secured_tag", "扇区肃清完毕");
set("hud.event.secured_title", "隔离协议重新上线");
set("hud.event.secured_sub", "成功规避核心惩罚");
set("hud.event.swarm_growing", "敌潮密度急剧攀升中");
set("hud.event.defend_prefix", "防卫目标：");
set("hud.event.survive_prefix", "存活目标：");
set("hud.event.loc_substation_east", "东部配电站");
set("hud.event.loc_generator_west", "西部备用发电机");
set("hud.event.loc_console_north", "北部物流中控终端");
set("hud.event.loc_relay_south", "南部通讯中继塔");
set("hud.event.loc_containment_zone", "阿尔法生化隔离区");
set("hud.event.title_substation_defended", "配电站防守成功");
set("hud.event.title_sector_purged", "扇区清洗成功");
set("hud.event.phase_format", "阶段 {phase}：{title}");
set("hud.event.inside_perimeter", "● 处于防御圈内（半径15米）");
set("hud.event.outside_perimeter", "▲ 脱离防御圈（脱离 {dist} 米）- 立即返回！");

// 12. UI Common & Menus
set("ui.topbar.sector", "扇区 07-B // 封锁通道");
set("ui.topbar.teeth", "牙齿：");
set("ui.topbar.settings", "设置");

set("ui.menu.campaign_badge", "★ 核心战役 // 12波次");
set("ui.menu.arcade_badge", "副模式 // 纯享清怪 · 无尽敌潮");
set("ui.menu.play", "[ 出击 ]");
set("ui.menu.play_td", "[ 出击：塔防模式 ]");
set("ui.menu.play_surv", "[ 出击：生存模式 ]");
set("ui.menu.tutorial_td", "塔防新手教程");
set("ui.menu.manual", "[ 战术手册与键位 ]");
set("ui.menu.shop", "[ 外科诊所 / 植入体 ]");
set("ui.menu.online", "P2P多人联机");
set("ui.menu.dossier_title", "服役档案");
set("ui.menu.dossier_mode_td", "战绩 // 塔防模式");
set("ui.menu.dossier_mode_surv", "战绩 // 生存模式");
set("ui.menu.dossier_directive_title", "战略指令：");
set("ui.menu.dossier_directive_td", "在工业轨道上部署防御炮塔，抵挡12波致命狂攻，死守生化反应堆。");
set("ui.menu.dossier_directive_surv", "快节奏直接战斗模式：无炮塔辅助，收集血清，彻底剿灭工厂内的5大头目。");
set("ui.menu.dossier_metric_td", "最高通关波次：");
set("ui.menu.dossier_metric_surv", "最长生存时间：");
set("ui.menu.dossier_runs", "出击总场次：");
set("ui.menu.dossier_kills", "歼灭敌对目标：");
set("ui.menu.dossier_bosses", "击杀工厂头目：");
set("ui.menu.dossier_upgrades", "获得植入体总数：");
set("ui.menu.controls_title", "作战键位：");
set("ui.menu.controls_desc", "WASD - 移动 · 鼠标 - 瞄准 · 空格 - 跳跃 · Shift - 翻滚 · F - 开始波次 · E - 炮塔终端 · Tab - 作战目标");

set("ui.settings.title", "战术设置");
set("ui.settings.save_return", "[ 保存并返回 ]");
set("ui.settings.audio_section", "音频设置");
set("ui.settings.master_vol", "主音量：");
set("ui.settings.sfx_vol", "音效与战斗声 (SFX)：");
set("ui.settings.music_vol", "背景音乐：");
set("ui.settings.amb_vol", "环境音效：");
set("ui.settings.mute_global", "静音全部音频：");
set("ui.settings.video_section", "画面设置");
set("ui.settings.res_scale", "渲染分辨率缩放：");
set("ui.settings.res_03", "0.30x (复古像素 · 经典)");
set("ui.settings.res_044", "0.44x (标准平衡 · 推荐)");
set("ui.settings.res_06", "0.60x (清晰细腻)");
set("ui.settings.res_08", "0.80x (高分辨率)");
set("ui.settings.res_10", "1.00x (原生 1080p)");
set("ui.settings.damage_text", "飘字伤害数字：");
set("ui.settings.pixel_filter", "像素平滑抗锯齿：");
set("ui.settings.post_proc", "后期画面效果处理：");
set("ui.settings.blood_splats", "地面鲜血喷溅残留：");
set("ui.settings.shake_section", "屏幕震动与辅助");
set("ui.settings.shake_int", "屏幕震动强度：");
set("ui.settings.shake_0", "0% (关闭震动)");
set("ui.settings.shake_50", "50% (减弱震动)");
set("ui.settings.shake_100", "100% (默认标准)");
set("ui.settings.shake_150", "150% (身临其境)");
set("ui.settings.gameplay_section", "操作与游戏性");
set("ui.settings.auto_aim", "近战目标自动辅助吸附：");
set("ui.settings.show_turret_range", "放置时常驻显示射程：");
set("ui.settings.quick_cast", "快捷技能即时施放：");
set("ui.settings.lang_section", "游戏语言 / Language");
set("ui.settings.lang_select", "界面语言选择：");

set("ui.shop.title", "外科医生手术台");
set("ui.shop.subtitle", "使用拔取的牙齿，在肉体上永久嫁接生化赛博义体强化");
set("ui.shop.teeth_count", "持有牙齿：{count}");
set("ui.shop.cost", "消耗：{cost} 牙齿");
set("ui.shop.max", "已达最高等级");
set("ui.shop.buy", "[ 植入 ]");
set("ui.shop.respec_btn", "[ 重置洗点 // 100%退还牙齿 ]");
set("ui.shop.respec_confirm", "确定要清空所有已升级的永久强化并全额返还消耗的牙齿吗？");
set("ui.shop.close", "[ 关闭 ]");

set("ui.map_select.title", "作战扇区选择");
set("ui.map_select.subtitle", "选择即将进驻并死守的工业防区");
set("ui.map_select.tab_norm", "标准扇区");
set("ui.map_select.tab_norm_sub", "100 生命 · 2处入口");
set("ui.map_select.tab_hard_badge", "极度危险");
set("ui.map_select.tab_hard", "高危扇区");
set("ui.map_select.tab_hard_sub", "75 生命 · 2处出口");
set("ui.map_select.status_completed", "任务达成");
set("ui.map_select.status_record", "最高纪录：{bestWave}/12");
set("ui.map_select.status_no_data", "暂无战绩");
set("ui.map_select.entrances.one", "1处入口");
set("ui.map_select.entrances.other", "{count}处入口");
set("ui.map_select.exits.one", "1处出口");
set("ui.map_select.exits.other", "{count}处出口");
set("ui.map_select.diff_label", "难度等级：");
set("ui.map_select.lives_label", "初始核心生命：");
set("ui.map_select.lives_val", "{count} 生命");
set("ui.map_select.scrap_label", "初始储备补给：");
set("ui.map_select.scrap_val", "{count} 废料");
set("ui.map_select.layout_label", "通道拓扑：");
set("ui.map_select.layout_val", "{entrances} 入口 / {exits} 出口");
set("ui.map_select.deploy_btn", "[ 空降部署至此扇区 ► ]");
set("ui.map_select.deploy_sub", "防卫行动开始 // 12波次");

set("ui.char_modal.title", "特工选拔部署");
set("ui.char_modal.sub", "挑选具备独特专属初始武器与生化被动特性的作战特工");
set("ui.char_modal.close", "[X] 关闭");
set("ui.char_modal.weapon", "初始武器：{name}");
set("ui.char_modal.confirm", "[ 锁定特工 // 准备出击 ]");
set("ui.char_modal.active", "已选定");
set("ui.char_modal.btn_assigned", "[ 已指派 ]");
set("ui.char_modal.btn_select", "[ 选择出击 ]");
set("ui.char_modal.waiting_peer", "正在等待队友选择特工...");
set("ui.char_modal.assigned_waiting", "[ 选定完成 // 等待中 ]");
set("ui.char_modal.peer_ready", "队友已准备完毕！请尽快确认您的出战特工。");
set("ui.char_modal.all_ready", "全员就绪！即刻部署至战场...");
set("ui.char_modal.deploying", "[ 正在出击！ ]");

set("ui.turret_modal.title_place", "部署操作终端 // 炮塔");
set("ui.turret_modal.title_turret", "防御塔 // {name}");
set("ui.turret_modal.scrap_pill", "废料");
set("ui.turret_modal.skip_prep", "[ 立即开波 (F) ]");
set("ui.turret_modal.close", "[ 关闭终端 (E) ]");
set("ui.turret_modal.footer_tip", "使用击杀敌人回收的废料进行建造与升级。3条升级路线中仅有一条允许升至2阶以上。");
set("ui.turret_modal.place_instructions_html", "选择炮塔自由放置。关闭面板后将镜头瞄准地面：<b>绿圈</b>＝可建，<b>红圈</b>＝不可建。鼠标左键或<b>E</b>键建造，按<b>ESC</b>取消。");
set("ui.turret_modal.not_enough_scrap", "废料不足");
set("ui.turret_modal.max_level", "已达最高等级");
set("ui.turret_modal.upgrade_btn", "升级 ({cost})");
set("ui.turret_modal.integrity", "结构生命 {hp} / {maxHp}");
set("ui.turret_modal.btn_switch_build", "建造其他炮塔");
set("ui.turret_modal.btn_sell", "出售 (+{refund} 废料)");

set("ui.levelup.title", "生化神经网络升级");
set("ui.levelup.subtitle", "请选择一项全新强化或武器组件");
set("ui.levelup.reroll", "刷新卡牌");
set("ui.levelup.rerolls_remaining.one", "剩余刷新：1次");
set("ui.levelup.rerolls_remaining.other", "剩余刷新：{count}次");
set("ui.levelup.skip", "跳过本项选择 (+50 废料)");

set("ui.results.title_victory", "扇区彻底肃清 // 任务达成");
set("ui.results.title_defeat", "作战惨遭溃败 // 信号中断");
set("ui.results.subtitle_victory", "全歼所有进犯威胁，生物反应堆安然无恙。");
set("ui.results.subtitle_defeat", "核心结构彻底坍塌，或特工脉搏信号已停跳。");
set("ui.results.time_survived", "坚持时长：{time}");
set("ui.results.waves_cleared", "通关波次：{waves} / 12");
set("ui.results.enemies_killed", "歼灭敌军总数：{kills}");
set("ui.results.scrap_earned", "累计回收废料：{scrap}");
set("ui.results.teeth_earned", "斩获牙齿：{teeth}");
set("ui.results.btn_retry", "[ 重整再战 ]");
set("ui.results.btn_menu", "[ 撤回基地 ]");

set("ui.tutorial_prompt.tape", "战术训练协议");
set("ui.tutorial_prompt.title", "是否开始基础实战训练？");
set("ui.tutorial_prompt.desc1", "检测到您的初次作战记录。我们为您准备了一套互动式实兵训练：体验自由摆塔、BTD6式分支强化、废料回收以及冷冻+火炮的强力杀戮协同机制。");
set("ui.tutorial_prompt.desc2", "本弹窗仅在首次启动时提示。后续随时可在主菜单重新开启训练。");
set("ui.tutorial_prompt.yes", "[ 接受训练，进入教学 ]");
set("ui.tutorial_prompt.no", "[ 拒绝训练，直接奔赴前线 ]");

set("ui.lang_screen.title", "请选择您的首选语言");
set("ui.lang_screen.subtitle", "SELECT YOUR LANGUAGE");
set("ui.lang_screen.confirm", "[ 确认选择并继续 ]");

set("ui.levelup.new_tag", "新");
set("ui.online.status_init", "正在初始化...");
set("ui.online.btn_leave", "[ 退出房间 ]");
set("ui.online.p2p_not_available", "STEAM P2P不可用");
set("ui.dossier.expeditions", "出击总场次：");
set("ui.mode.status_choose", "[选择]");

// Fill in any remaining from es
for (const k of Object.keys(es)) {
  if (!zhHans[k]) {
    zhHans[k] = es[k];
  }
}

// Write out locales/zh-Hans.js
const outputPath = path.resolve(__dirname, '../../locales/zh-Hans.js');
const outLines = ['// Simplified Chinese localization dictionary for Traces of Rust.', 'export default {'];
const keys = Object.keys(es);
keys.forEach((k, idx) => {
  const isLast = idx === keys.length - 1;
  outLines.push(`  ${JSON.stringify(k)}: ${JSON.stringify(zhHans[k] || es[k])}${isLast ? '' : ','}`);
});
outLines.push('};');
outLines.push('');

fs.writeFileSync(outputPath, outLines.join('\n'), 'utf-8');
console.log(`Generated locales/zh-Hans.js with ${keys.length} keys!`);
