const fs = require('fs');
const es = require('../../temp-es-dict.json');

const ja = {};

function set(k, v) {
  if (k in es) {
    ja[k] = v;
  }
}

import('../../locales/en.js').then(enMod => {
  const en = enMod.default;

  // Mode
  set("mode.core_defense.title", "タワーディフェンス");
  set("mode.core_defense.subtitle", "コア防衛");
  set("mode.core_defense.badge", "★ メインキャンペーン // 12ウェーブ");
  set("mode.core_defense.shortTitle", "タワーディフェンス");
  set("mode.core_defense.tagline", "工業ルートにタレットを配備し、12の猛攻を耐え抜き、バイオ生体リアクターを防衛せよ。");
  set("mode.core_defense.objectiveTitle", "防衛プロトコル");
  set("mode.core_defense.objectiveDefault", "敵のコア隔壁到達を阻止せよ");
  set("mode.survival.title", "サバイバル");
  set("mode.survival.subtitle", "大群殲滅");
  set("mode.survival.badge", "サブモード // アーケード");
  set("mode.survival.shortTitle", "サバイバル");
  set("mode.survival.tagline", "高速アクションモード：タレットなしの直接戦闘。血清を回収し、工場の5体のボスを討伐せよ。");
  set("mode.survival.objectiveTitle", "工場指令");
  set("mode.survival.objectiveDefault", "工場のボスを発見・討伐せよ");

  // Diff
  set("diff.facil", "イージー");
  set("diff.normal", "ノーマル");
  set("diff.dificil", "ハード");

  // Bosses & Enemies
  set("boss.boss_butcher.name", "工場解体機");
  set("boss.boss_siren.name", "有刺鉄線の母");
  set("boss.boss_furnace.name", "火葬オートマタ09号");
  set("boss.boss_apostle.name", "歯車の使徒");
  set("boss.boss_warden.name", "区画看守");

  set("enemy.runner.name", "レールランナー");
  set("enemy.hulk.name", "ミートプレス");
  set("enemy.nest.name", "徘徊する巣");
  set("enemy.regenerator.name", "疫病縫合者");
  set("enemy.splitter.name", "変異分裂体");

  // Rewards
  set("reward.heal_pack.name", "緊急輸血パック");
  set("reward.heal_pack.desc", "パルスを即座に+75回復。");
  set("reward.teeth_bag.name", "抜去された歯の袋");
  set("reward.teeth_bag.desc", "外科医の診察台用に追加の歯+15を獲得。");

  // Shop
  set("shop.dmg.name", "精製火薬");
  set("shop.dmg.desc", "レベル毎に基礎ダメージ+3%（永続）");
  set("shop.hp.name", "外科縫合糸");
  set("shop.hp.desc", "レベル毎に最大パルス+5（永続）");
  set("shop.spd.name", "微量エフェドリン");
  set("shop.spd.desc", "レベル毎に移動速度+2%（永続）");
  set("shop.atkSpd.name", "機構潤滑油");
  set("shop.atkSpd.desc", "レベル毎に攻撃速度+2.5%（永続）");
  set("shop.mag.name", "抽出用ピンセット");
  set("shop.mag.desc", "レベル毎に磁石吸引範囲+0.35m（永続）");
  set("shop.reroll.name", "ディーラーへの賄賂");
  set("shop.reroll.desc", "リロール回数+1（最大+3）");

  // Characters
  set("char.otto.title", "V・リヒター医師");
  set("char.otto.role", "戦術外科医");
  set("char.otto.desc", "生体義肢移植に執着する元軍医。歯の回収と群衆制圧の専門家。");
  set("char.otto.passive", "解剖プロトコル");
  set("char.otto.passiveDesc", "エリートからの歯とソウルのドロップ率+25%。追加リロール1回で開始。");
  set("char.otto.weaponTitle", "回転ノコギリ");

  set("char.mack.title", "マック \"ハンマー\"");
  set("char.mack.role", "重装破壊兵");
  set("char.mack.desc", "強化サイバネティクス骨格を持つ工場のベテラン。近接火力は絶大だが機動力は低い。");
  set("char.mack.passive", "弾道慣性");
  set("char.mack.passiveDesc", "全武器の基礎範囲+30%。重発射体のノックバック+50%。");
  set("char.mack.weaponTitle", "12ゲージ散弾銃");

  set("char.pepe.title", "ペペ \"スパーク\"");
  set("char.pepe.role", "アーク溶接工");
  set("char.pepe.desc", "高電圧放電と極限の熱に慣れた闇の電気技師。");
  set("char.pepe.passive", "過負荷アーク");
  set("char.pepe.passiveDesc", "攻撃時20%の確率で近くの敵2体に連鎖電撃を放ち40%のダメージを与える。");
  set("char.pepe.weaponTitle", "熱線バーナー");

  set("char.morbo.title", "モルボ");
  set("char.morbo.role", "疫病キャリア");
  set("char.morbo.desc", "化学実験の生還被験者。周囲に強烈な腐食霧を放ち続ける。");
  set("char.morbo.passive", "苛性分泌");
  set("char.morbo.passiveDesc", "オーラ内の敵は移動速度15%低下、毎秒最大HPの2%を失う。");
  set("char.morbo.weaponTitle", "胆汁の香炉");

  set("char.bob.title", "ボブ \"オイラー\"");
  set("char.bob.role", "戦闘機関士");
  set("char.bob.desc", "自律機構、圧力センサー、破片爆薬の専門家。");
  set("char.bob.passive", "地雷ネットワーク");
  set("char.bob.passiveDesc", "12秒ごとに80ダメージの破片地雷を自動投下。");
  set("char.bob.weaponTitle", "破片地雷");

  set("char.krauss.title", "クラウス");
  set("char.krauss.role", "区画処刑人");
  set("char.krauss.desc", "高圧空気モリを備えた冷徹なサイボーグ狙撃手。");
  set("char.krauss.passive", "空圧テンション");
  set("char.krauss.passiveDesc", "貫通発射体が敵を貫くごとにダメージ+15%。");
  set("char.krauss.weaponTitle", "空気圧式モリ");

  set("char.axel.title", "アクセル");
  set("char.axel.role", "ケージランナー");
  set("char.axel.desc", "周囲を回転する鉤爪ケージで接近する敵をミンチにする狂戦士。");
  set("char.axel.passive", "運動遠心力");
  set("char.axel.passiveDesc", "連続移動中、ケージの回転速度が最大+40%まで上昇。");
  set("char.axel.weaponTitle", "肉切りケージ");

  set("char.tesla.title", "ニコラ");
  set("char.tesla.role", "静電の先駆者");
  set("char.tesla.desc", "高電圧回路に魅せられた狂気の発明家。スクラップを導電路に再構築する。");
  set("char.tesla.passive", "静電共鳴");
  set("char.tesla.passiveDesc", "感電した敵を倒すとEMPが発生し、3m以内の敵を0.8秒スタン。");
  set("char.tesla.weaponTitle", "壊れた除細動器");

  // Weapons
  set("weapon.slash.name", "切断ノコギリ");
  set("weapon.slash.desc", "血飛沫を残す回転ノコギリ刃。3D閃光と強ノックバック。（発射体数増加無効）。");
  set("weapon.shotgun.name", "12ゲージ散弾銃");
  set("weapon.shotgun.desc", "マズルフラッシュと薬莢排出を伴う実弾散弾の扇状射撃。");
  set("weapon.flamethrower.name", "焼却バーナー");
  set("weapon.flamethrower.desc", "暗闇を照らし毎秒燃焼ダメージを与える連続火炎放射。（発射体数増加無効）。");
  set("weapon.aura.name", "胆汁の香炉");
  set("weapon.aura.desc", "周囲に腐食フィールドを展開し敵に継続ダメージと減速を与える。（発射体数増加無効）。");
  set("weapon.mines.name", "破片地雷");
  set("weapon.mines.desc", "踏んだ瞬間に広範囲爆発を起こす赤色センサー地雷を散布。");
  set("weapon.harpoon.name", "空気圧式モリ");
  set("weapon.harpoon.desc", "一直線上に複数の敵を貫通する高威力ボルト。");
  set("weapon.orbital.name", "肉切りケージ");
  set("weapon.orbital.desc", "フックと頭蓋骨の鉄製ケージが旋回し、群れを切り裂く。");
  set("weapon.bolt.name", "壊れた除細動器");
  set("weapon.bolt.desc", "複数の敵を飛び火して感電させる高圧電気ショック。（発射体数増加無効）。");
  set("weapon.chakram.name", "スクラップブーメラン");
  set("weapon.chakram.desc", "敵を切り裂いて前進し、手元に戻りながら往復ダメージを与えるノコ刃。");
  set("weapon.welder.name", "アーク溶接機");
  set("weapon.welder.desc", "2.4秒チャージ後、最も敵が密集する方向へ1.6秒間ビーム照射。（発射体数増加無効）。");
  set("weapon.grenade.name", "ピルグリムグレネード");
  set("weapon.grenade.desc", "着弾時に炸裂し、強化により子弾クラスターへ分裂する弾道弾。");
  set("weapon.hammer.name", "ピストンハンマー");
  set("weapon.hammer.desc", "強烈な吹き飛ばしとスタンを伴う放射状衝撃波。（発射体数増加無効）。");
  set("weapon.acid.name", "酸性ボトル");
  set("weapon.acid.desc", "着弾で炸裂し、敵を溶かし減速させる腐食雲を生成。");

  set("weapon.short.slash", "ノコギリ");
  set("weapon.short.shotgun", "散弾銃");
  set("weapon.short.flamethrower", "バーナー");
  set("weapon.short.aura", "香炉");
  set("weapon.short.mines", "地雷");
  set("weapon.short.harpoon", "モリ");
  set("weapon.short.orbital", "ケージ");
  set("weapon.short.bolt", "除細動器");
  set("weapon.short.chakram", "ブーメラン");
  set("weapon.short.welder", "溶接機");
  set("weapon.short.grenade", "グレネード");
  set("weapon.short.hammer", "ハンマー");
  set("weapon.short.acid", "酸");

  // Passives
  set("passive.multishot.name", "改良薬室");
  set("passive.multishot.desc", "対応する武器の発射体数を+1追加。");
  set("passive.dmg.name", "圧縮火薬");
  set("passive.dmg.desc", "全武器のダメージがレベル毎に+15%増加。");
  set("passive.atkSpd.name", "錆びたサーボ");
  set("passive.atkSpd.desc", "攻撃速度と旋回速度がレベル毎に+10%増加。");
  set("passive.maxHp.name", "外科プレート");
  set("passive.maxHp.desc", "最大パルスを+25増加し即座に同量回復。");
  set("passive.regen.name", "点滴チューブ");
  set("passive.regen.desc", "毎秒+0.9のパルスを自動回復。");
  set("passive.moveSpd.name", "工業エフェドリン");
  set("passive.moveSpd.desc", "移動速度がレベル毎に+8%増加。");
  set("passive.area.name", "拡散破片");
  set("passive.area.desc", "攻撃の範囲と効果面積がレベル毎に+12%増加。");
  set("passive.crit.name", "肉切りレンズ");
  set("passive.crit.desc", "2倍ダメージを与えるクリティカル確率が+7%増加。");
  set("passive.magnet.name", "クレーン磁石");
  set("passive.magnet.desc", "血清と歯の回収範囲を拡大。");

  set("passive.format.multishot", "+{lvl} 弾数");
  set("passive.format.dmg", "+{pct}% ダメージ");
  set("passive.format.atkSpd", "+{pct}% 攻撃速度");
  set("passive.format.maxHp", "+{hp} パルス");
  set("passive.format.regen", "+{val} HP/秒");
  set("passive.format.moveSpd", "+{pct}% 移動速度");
  set("passive.format.area", "+{pct}% 範囲");
  set("passive.format.crit", "+{pct}% 会心");
  set("passive.format.magnet", "+{val}M 磁石");

  // Maps
  set("map.easy_plaza.name", "中央広場");
  set("map.easy_plaza.badge", "イージー // 360°ループ");
  set("map.easy_plaza.desc", "見晴らしの良い円形広場。敵は外周を周回してからコアへ向かう。");

  set("map.easy_spiral.name", "螺旋降下路");
  set("map.easy_spiral.badge", "イージー // 連続螺旋");
  set("map.easy_spiral.desc", "タレット密度の高い下り螺旋コース。遠距離砲と冷気タレットに最適。");

  set("map.easy_serpentine.name", "蛇行トレンチ");
  set("map.easy_serpentine.badge", "イージー // 連続S字カーブ");
  set("map.easy_serpentine.desc", "5つのヘアピンカーブを持つ塹壕。範囲攻撃と火炎タレットに有利。");

  set("map.easy_ramps.name", "高所搬入スロープ");
  set("map.easy_ramps.badge", "イージー // 高架スロープ");
  set("map.easy_ramps.desc", "中央の強化橋梁に合流する2本の下降スロープ。");

  set("map.easy_cooling.name", "冷却サーキット");
  set("map.easy_cooling.badge", "イージー // ダブルリング");
  set("map.easy_cooling.desc", "同心円状の冷却水路。敵は外周水路を抜けてからリアクターへ向かう。");

  set("map.easy_horseshoe.name", "鋼鉄の蹄鉄");
  set("map.easy_horseshoe.badge", "イージー // U字チョーク");
  set("map.easy_horseshoe.desc", "高台に囲まれたU字カーブ。カーブ中央に強烈な十字砲火を敷ける。");

  set("map.norm_twins.name", "双子回廊");
  set("map.norm_twins.badge", "ノーマル // 並行侵入路");
  set("map.norm_twins.desc", "両側から同時に攻め寄せる2本の対称回廊。均等な戦力配置が必要。");

  set("map.norm_pincer.name", "油圧ハサミ");
  set("map.norm_pincer.badge", "ノーマル // 挟撃アサルト");
  set("map.norm_pincer.desc", "直角に交わる2方向の侵入路が狭小な中央コアに迫る。");

  set("map.norm_cross.name", "工場十字路");
  set("map.norm_cross.badge", "ノーマル // 十字侵入");
  set("map.norm_cross.desc", "東西南北の四方向から交互にウェーブが押し寄せる交差点。");

  set("map.norm_funnel.name", "鉱滓ファンネル");
  set("map.norm_funnel.badge", "ノーマル // 収束漏斗");
  set("map.norm_funnel.desc", "3つの広い入口が1つの狭小な防衛路へと急激に収束する。");

  set("map.norm_braid.name", "交差高架橋");
  set("map.norm_braid.badge", "ノーマル // 立体交差");
  set("map.norm_braid.desc", "立体的に交差する2本のルート。全方位をカバーする配置が必須。");

  set("map.norm_pit.name", "溶鉱ピット");
  set("map.norm_pit.badge", "ノーマル // 火口クレーター");
  set("map.norm_pit.desc", "コアが鎮座する灼熱のピット底へと下る螺旋状の走路。");

  set("map.hard_isolated.name", "隔離セクター9");
  set("map.hard_isolated.badge", "ハード // 分割コア");
  set("map.hard_isolated.desc", "完全に分断された2つのコア。支援が届かない独立した2陣地を構築せよ。");

  set("map.hard_diagonal.name", "対角強襲路");
  set("map.hard_diagonal.badge", "ハード // 高速スプリント");
  set("map.hard_diagonal.desc", "直線的な最短対角ルート。減速なしでは敵は20秒でコアへ到達する。");

  set("map.hard_express.name", "特急貨物ライン");
  set("map.hard_express.badge", "ハード // 快速スプリント");
  set("map.hard_express.desc", "超高速で敵が突進してくる鉄道ライン。強力な足止めが不可欠。");

  set("map.hard_split_level.name", "垂直分岐坑");
  set("map.hard_split_level.badge", "ハード // 多層段差");
  set("map.hard_split_level.desc", "換気シャフトから防衛プラットフォームへ敵が直接落下してくる立体構造。");

  set("map.hard_blind_alleys.name", "鉄の迷宮");
  set("map.hard_blind_alleys.badge", "ハード // 視界遮断通路");
  set("map.hard_blind_alleys.desc", "鉄板で囲まれた閉塞迷路。長射程タレットの射線が遮られる。");

  set("map.hard_dual_breach.name", "オメガ二重突破口");
  set("map.hard_dual_breach.badge", "ハード // 同時大群襲撃");
  set("map.hard_dual_breach.desc", "工場の最深部。エリートボスとともに両翼から規格外の大群が押し寄せる。");

  // Stats
  set("turret.stat.damage", "威力");
  set("turret.stat.fireRate", "速度");
  set("turret.stat.range", "射程");
  set("turret.stat.aoe", "範囲");
  set("turret.stat.slow", "減速");
  set("turret.stat.radius", "半径");
  set("turret.stat.allies", "兵力");
  set("turret.stat.every", "間隔");
  set("turret.stat.buffDamage", "強化");
  set("turret.stat.chain", "連鎖");
  set("turret.stat.burn", "燃焼");
  set("turret.stat.singleTarget", "単体特化");
  set("turret.stat.scrapPerWave", "資源");
  set("turret.stat.push", "衝撃");
  set("turret.stat.stun", "気絶");

  // Tutorials
  set("tutorial.step.intro.title", "防衛訓練プロトコル");
  set("tutorial.step.intro.text", "任務：全12ウェーブに渡りコアを防衛せよ。敵は3つの工業ルートを進攻してくる。倒した敵からスクラップを回収し、タレットを建造・強化して持ちこたえよ。[SPACE]で開始。");
  set("tutorial.step.intro.hint", "[SPACE]キーまたはここをクリックして続行。");

  set("tutorial.step.build.title", "ステップ1 · 建造");
  set("tutorial.step.build.text", "[E]キーでタレット端末を開き、ネイルガンを選択。床にカメラを向けると配置ガイドが表示される（緑＝配置可能、赤＝配置不可）。左クリックまたは[E]で配置。");
  set("tutorial.step.build.hint", "コア近くの緑リング · [E]で端末を開く");

  set("tutorial.step.upgrade.title", "ステップ2 · 強化");
  set("tutorial.step.upgrade.text", "建造したタレットに近づき[E]を押せ。各タレットには4段階の強化ルートが3本ある。攻撃速度をレベル2に上げてツインバレルを解放せよ。レベル2を超えられるのは1ルートのみ。");
  set("tutorial.step.upgrade.hint", "タレットに接近して[E]を押す");

  set("tutorial.step.synergy.title", "ステップ3 · シナジー");
  set("tutorial.step.synergy.text", "役割を組み合わせろ。フロストは敵を減速させて密集させ、ボンバーは密集した群れを範囲爆撃で粉砕する。青と橙のリングは推奨位置。好きな場所に配置してよい。");
  set("tutorial.step.synergy.hint", "フロスト + ボンバーを建造");

  set("tutorial.step.practice.title", "ステップ4 · 実戦演習");
  set("tutorial.step.practice.text", "敵の前衛が接近中。フロストが足止めし、ボンバーが爆破する様子を確認せよ。倒れた敵からスクラップが飛び出し回収される。");
  set("tutorial.step.practice.hint", "コアを防衛せよ");

  set("tutorial.step.done.title", "訓練修了");
  set("tutorial.step.done.text", "高度なシナジー：フロスト（粉砕）+ 範囲/火炎（+40%）；詰所（ジャガーノート）+ 工房（シールド/修理）；工房（過負荷）+ ネイルガン（弾幕）。売却で50%返還。[SPACE]で本戦開始。");
  set("tutorial.step.done.hint", "[SPACE] 迎撃開始");

  // HUD & Wave
  set("hud.objective.title", "現在の目標：");
  set("hud.objective.default_td", "防衛線を死守せよ ({diff})");
  set("hud.objective.default_surv", "群れを生き延びろ：{time}");
  set("hud.objective.purge_boss", "{name} を殲滅せよ");
  set("hud.objective.hostiles_left", "残存敵性体：{count}");
  set("hud.objective.next_wave_in", "次ウェーブまで {time}");
  set("hud.objective.first_wave_prep", "防衛準備完了 // [F]で開始");
  set("hud.objective.rebuilding_operator", "オペレーター再構築中... 陣地を維持せよ");
  set("hud.objective.tutorial_active", "チュートリアル // {step}");
  set("hud.objective.next_boss_in", "次ボス接近まで：{time}");
  set("hud.objective.endgame_active", "掃討戦発動：残存敵を全て殲滅せよ");

  set("hud.wave.prep", "準備フェーズ");
  set("hud.wave.in_progress", "ウェーブ {current}/{total}");
  set("hud.wave.event_badge", "イベント // {title}");
  set("hud.wave.surv_endgame", "最終殲滅戦突入");
  set("hud.wave.surv_horde", "ホード襲来中");
  set("hud.wave.skip_prompt", "[F] で開始");
  set("hud.wave.announcement_boss", "ウェーブ {wave} // ボス接近：{boss}");
  set("hud.wave.announcement_progress", "ウェーブ {wave} / {total} 進行中");
  set("hud.wave.announcement_completed", "ウェーブ {wave} 防衛完了");
  set("hud.wave.start_wave", "ウェーブ開始");
  set("hud.wave.skip_pause", "待機スキップ");

  set("hud.turret.interact_prompt", "[E] で強化 / 売却");
  set("hud.turret.place_valid", "{name} を配置 · スクラップ {cost} · [ESC] キャンセル");
  set("hud.turret.place_invalid", "{reason} · [ESC] キャンセル");
  set("hud.turret.upgrade_sell", "強化 / 売却 · {name}");
  set("hud.turret.build_turret", "タレット建造");

  set("hud.slot.level_short", "LV.{lvl}");
  set("hud.slot.weapon_empty", "武器スロット空き");
  set("hud.slot.passive_empty", "インプラントスロット空き");
  set("hud.slot.weapon_title", "{name} (レベル +{lvl}) — {desc}");
  set("hud.slot.passive_title", "{name} (レベル +{lvl}): {stat} — {desc}");

  set("hud.player_down.title", "[ オペレーター大破 // コア過負荷 -{penalty} ライフ ]");
  set("hud.player_down.countdown", "再構築完了まで {seconds}秒...");
  set("hud.player_down.announcement", "オペレーター大破 // コア過負荷 (-{penalty} ライフ)");

  set("hud.core.under_attack", "コア攻撃警報！ // {state}");
  // Japanese has single other form
  set("hud.core.leak_detected.one", "侵入警報！ -1 ライフ");
  set("hud.core.leak_detected.other", "侵入警報！ -{count} ライフ");

  set("hud.core.state_stable", "安定");
  set("hud.core.state_alert", "警戒");
  set("hud.core.state_critical", "危険");
  set("hud.core.integrity", "{hp}/{max} コア耐久度");
  set("hud.core.hostiles_counter", "残存敵：{count}");
  set("hud.core.state_free_exploration", "自由索敵中");
  set("hud.core.state_pause", "待機中：{seconds}秒");

  set("hud.boss.alert", "警報：{name} 出現");
  set("hud.boss.phase1", "第I形態");
  set("hud.boss.phase2", "第II形態 // 狂暴化");

  set("hud.teammate_down.tag", "味方大破！");
  set("hud.teammate_down.title", "味方大破！ コアライフ -10");
  set("hud.teammate_down.sub", "コアペナルティ発生 // 陣地を死守せよ");

  set("hud.kinetic.sector_alert", "区画警報");
  set("hud.kinetic.event_started", "イベント発生");

  set("hud.event.emergency_detected", "緊急事態検知");
  set("hud.event.completed_title", "防衛成功");
  set("hud.event.leak_banner_tag", "コア漏洩検知");
  set("hud.event.sector_alert_tag", "区画警報");
  set("hud.event.started_title", "イベント開始");
  set("hud.event.survive_sub", "エリア内で75秒間生存せよ");
  set("hud.event.climax_tag", "クライマックス");
  set("hud.event.phase3_title", "隔離突破");
  set("hud.event.phase3_sub", "危険変異体接近中");
  set("hud.event.secured_tag", "区画鎮圧");
  set("hud.event.secured_title", "隔離機能復旧");
  set("hud.event.secured_sub", "コアペナルティ回避");
  set("hud.event.swarm_growing", "大群密度増加中");
  set("hud.event.defend_prefix", "防衛指令：");
  set("hud.event.survive_prefix", "生存指令：");
  set("hud.event.loc_substation_east", "東部変電所");
  set("hud.event.loc_generator_west", "西部予備発電機");
  set("hud.event.loc_console_north", "北部物流コンソール");
  set("hud.event.loc_relay_south", "南部中継塔");
  set("hud.event.loc_containment_zone", "アルファ隔離区画");
  set("hud.event.title_substation_defended", "変電所防衛完了");
  set("hud.event.title_sector_purged", "区画殲滅完了");
  set("hud.event.phase_format", "フェーズ {phase}：{title}");
  set("hud.event.inside_perimeter", "● エリア内（半径15M）");
  set("hud.event.outside_perimeter", "▲ エリア外（{dist}m 離脱中）- 戻れ！");

  // Fill in other keys
  for (const k of Object.keys(es)) {
    if (!ja[k]) {
      if (k.startsWith('turret.')) {
        ja[k] = translateTurretKeyJa(k, es[k], en[k]);
      } else if (k.startsWith('ui.')) {
        ja[k] = translateUiKeyJa(k, es[k], en[k]);
      } else {
        ja[k] = en[k] || es[k];
      }
    }
  }

  // Write locales/ja.js
  const outLines = ['// Japanese localization dictionary for Traces of Rust.', 'export default {'];
  const keys = Object.keys(es);
  keys.forEach((k, idx) => {
    const isLast = idx === keys.length - 1;
    outLines.push(`  ${JSON.stringify(k)}: ${JSON.stringify(ja[k] || es[k])}${isLast ? '' : ','}`);
  });
  outLines.push('};');
  outLines.push('');

  fs.writeFileSync('locales/ja.js', outLines.join('\n'), 'utf8');
  console.log(`Generated locales/ja.js with ${keys.length} keys!`);
});

function translateTurretKeyJa(k, esVal, enVal) {
  if (k.endsWith('.role')) {
    if (esVal === 'DAÑO DIRECTO') return '直接ダメージ';
    if (esVal === 'ÁREA') return '範囲攻撃';
    if (esVal === 'CONTROL') return '敵足止め';
    if (esVal === 'TROPAS ALIADAS') return '友軍歩兵';
    if (esVal === 'AMPLIFICADOR') return '戦術支援';
    if (esVal === 'CADENA ELÉCTRICA') return '連鎖電撃';
    if (esVal === 'ÁREA INCENDIARIA') return '火炎放射';
    if (esVal === 'FRANCOTIRADOR') return '長距離狙撃';
    if (esVal === 'ECONOMÍA') return '資源回収';
    if (esVal === 'CONTROL A CORTA DISTANCIA') return '近接粉砕';
    if (esVal === 'DESPLAZAMIENTO') return '敵吹き飛ばし';
  }

  if (k === 'turret.gunner.name') return 'ネイルガン';
  if (k === 'turret.mortar.name') return 'ボンバー';
  if (k === 'turret.cryo.name') return 'フロスト';
  if (k === 'turret.barracks.name') return '警備詰所';
  if (k === 'turret.support.name') return '戦術工房';
  if (k === 'turret.tesla.name') return 'テスラコイル';
  if (k === 'turret.incinerator.name') return '塹壕焼却炉';
  if (k === 'turret.railgun.name') return 'レールガン';
  if (k === 'turret.collector.name') return 'スクラップ濃縮機';
  if (k === 'turret.press.name') return 'レールプレス';
  if (k === 'turret.ejector.name') return '油圧エジェクター';

  return enVal || esVal;
}

function translateUiKeyJa(k, esVal, enVal) {
  if (k === 'ui.topbar.sector') return 'セクター07-B // 封鎖ルート';
  if (k === 'ui.topbar.teeth') return '歯：';
  if (k === 'ui.topbar.settings') return '設定';
  if (k === 'ui.menu.campaign_badge') return '★ メインキャンペーン // 12ウェーブ';
  if (k === 'ui.menu.arcade_badge') return 'サブモード // 高速アクション · エンドレスホード';
  if (k === 'ui.menu.play') return '[ 出撃 ]';
  if (k === 'ui.menu.play_td') return '[ 出撃：タワーディフェンス ]';
  if (k === 'ui.menu.play_surv') return '[ 出撃：サバイバル ]';
  if (k === 'ui.menu.tutorial_td') return 'TDチュートリアル';
  if (k === 'ui.menu.manual') return '[ マニュアル・操作方法 ]';
  if (k === 'ui.menu.shop') return '[ クリニック / インプラント ]';
  if (k === 'ui.menu.online') return 'P2Pマルチプレイ';
  if (k === 'ui.menu.dossier_title') return '軍歴調書';
  if (k === 'ui.menu.dossier_mode_td') return '調書 // タワーディフェンス';
  if (k === 'ui.menu.dossier_mode_surv') return '調書 // サバイバル';
  if (k === 'ui.menu.dossier_directive_title') return '戦術指令：';
  if (k === 'ui.menu.dossier_directive_td') return '工業ルートにタレットを配備し、12の猛攻を耐え抜き、バイオ生体リアクターを防衛せよ。';
  if (k === 'ui.menu.dossier_directive_surv') return '高速アクションモード：タレットなしの直接戦闘。血清を回収し、工場の5体のボスを討伐せよ。';
  if (k === 'ui.menu.dossier_metric_td') return '最高突破ウェーブ：';
  if (k === 'ui.menu.dossier_metric_surv') return '最高生存時間：';
  if (k === 'ui.menu.dossier_runs') return '出撃記録数：';
  if (k === 'ui.menu.dossier_kills') return '撃破した敵性体：';
  if (k === 'ui.menu.dossier_bosses') return '討伐した工場ボス：';
  if (k === 'ui.menu.dossier_upgrades') return '獲得インプラント数：';
  if (k === 'ui.menu.controls_title') return '戦闘操作：';
  if (k === 'ui.menu.controls_desc') return 'WASD - 移動 · マウス - 照準 · スペース - 跳躍 · Shift - 回避 · F - ウェーブ開始 · E - タレット · Tab - マップ';

  if (k === 'ui.settings.title') return '戦術設定';
  if (k === 'ui.settings.save_return') return '[ 保存して戻る ]';
  if (k === 'ui.settings.audio_section') return '音響設定';
  if (k === 'ui.settings.master_vol') return '主音量：';
  if (k === 'ui.settings.sfx_vol') return '効果音・戦闘音（SFX）：';
  if (k === 'ui.settings.music_vol') return 'BGM音量：';
  if (k === 'ui.settings.amb_vol') return '環境音：';
  if (k === 'ui.settings.mute_global') return '全音ミュート：';
  if (k === 'ui.settings.video_section') return '映像設定';
  if (k === 'ui.settings.res_scale') return 'レンダリング解像度：';
  if (k === 'ui.settings.res_03') return '0.30x (ドット絵 · レトロ)';
  if (k === 'ui.settings.res_044') return '0.44x (標準 · 高速)';
  if (k === 'ui.settings.res_065') return '0.65x (高精細 · 720p)';
  if (k === 'ui.settings.res_10') return '1.00x (ネイティブ解像度)';
  if (k === 'ui.settings.ui_scale') return 'UI表示倍率：';
  if (k === 'ui.settings.ui_scale_1x') return 'x1 (コンパクト)';
  if (k === 'ui.settings.ui_scale_2x') return 'x2 (レトロ小)';
  if (k === 'ui.settings.ui_scale_3x') return 'x3 (標準HUD)';
  if (k === 'ui.settings.ui_scale_4x') return 'x4 (大型HUD)';
  if (k === 'ui.settings.fullscreen') return '排他全画面表示：';
  if (k === 'ui.settings.crt') return 'CRTフィルター＆フィルム粒子：';
  if (k === 'ui.settings.crt_grain') return 'CRTフィルター＆フィルム粒子：';
  if (k === 'ui.settings.shadows') return '動的シャドウ：';
  if (k === 'ui.settings.shadows_lantern') return 'フラッシュライトの動的影：';
  if (k === 'ui.settings.fps') return 'FPS表示：';
  if (k === 'ui.settings.fov') return '視野角 (FOV)：';
  if (k === 'ui.settings.controls_section') return '操作と視点';
  if (k === 'ui.settings.mouse_sens') return 'マウス感度：';
  if (k === 'ui.settings.cam_shake') return '画面振動：';
  if (k === 'ui.settings.reset_section') return 'データ管理';
  if (k === 'ui.settings.btn_reset_defaults') return '[ 設定を初期化 ]';
  if (k === 'ui.settings.btn_wipe_save') return '[ セーブデータを全消去 ]';
  if (k === 'ui.settings.language') return '言語：';
  if (k === 'ui.settings.language_auto') return '自動（システム設定）';

  if (k === 'ui.common.enabled') return '有効';
  if (k === 'ui.common.disabled') return '無効';
  if (k === 'ui.common.fullscreen_on') return '全画面';
  if (k === 'ui.common.fullscreen_off') return 'ウィンドウ';
  if (k === 'ui.common.visible') return '表示';
  if (k === 'ui.common.hidden') return '非表示';
  if (k === 'ui.common.none') return 'なし';
  if (k === 'ui.common.weapons') return '武器：';
  if (k === 'ui.common.passives') return 'パッシブ：';

  if (k === 'ui.pause.title') return 'シミュレーション停止';
  if (k === 'ui.pause.sub') return '戦術ポーズ中';
  if (k === 'ui.pause.resume') return '[ 作戦再開 ]';
  if (k === 'ui.pause.settings') return '[ 設定 ]';
  if (k === 'ui.pause.to_menu') return '[ メインメニューへ撤退 ]';

  if (k === 'ui.shop.title') return '外科医の診察台';
  if (k === 'ui.shop.reserve') return '所持歯数：';
  if (k === 'ui.shop.sub') return '抜去された歯による永続的バイオインプラント強化';
  if (k === 'ui.shop.play_now') return '[ 工場へ直接突入 ]';
  if (k === 'ui.shop.back') return '[ 戻る ]';
  if (k === 'ui.shop.max') return '最大';
  if (k === 'ui.shop.buy') return '購入 ({cost})';
  if (k === 'ui.shop.level_tag') return 'レベル {lvl}/{max}';

  if (k === 'ui.levelup.title') return 'レベルアップ';
  if (k === 'ui.levelup.slots') return '枠：武器 {weapons} | パッシブ {passives}';
  if (k === 'ui.levelup.sub') return '神経再構築プロトコル // 強化を選択せよ';
  if (k === 'ui.levelup.charges') return 'チャージ：';
  if (k === 'ui.levelup.reroll_btn') return '[ リロール ]';
  set("ui.levelup.rerolls_remaining.one", "(残り {count} 回)");
  set("ui.levelup.rerolls_remaining.other", "(残り {count} 回)");
  if (k === 'ui.levelup.rerolls_exhausted') return '(使用不可)';
  if (k === 'ui.levelup.new_weapon') return '新規武器';
  if (k === 'ui.levelup.upgrade_weapon') return '武器強化';
  if (k === 'ui.levelup.new_passive') return '新規インプラント';
  if (k === 'ui.levelup.upgrade_passive') return 'インプラント強化';
  if (k === 'ui.levelup.emergency_supply') return '緊急補給品';
  if (k === 'ui.levelup.new_tag') return 'NEW';
  if (k === 'ui.levelup.supply_tag') return '補給';
  if (k === 'ui.levelup.affects_player') return '効果対象：オペレーター生体情報';
  if (k === 'ui.levelup.affects_label') return '効果対象：';
  if (k === 'ui.levelup.affected_weapons') return '対応武器：';
  if (k === 'ui.levelup.no_compatible_weapons') return '対応する武器を所持していません';

  if (k === 'ui.results.report_title_victory') return '作戦完了報告 // 防衛成功';
  if (k === 'ui.results.report_title_td_defeat') return '封鎖線崩壊 // 脱出失敗';
  if (k === 'ui.results.report_title_surv_defeat') return '死亡診断書 // 記録凍結';
  if (k === 'ui.results.victory_headline') return 'コア防衛達成';
  if (k === 'ui.results.defeat_headline') return '生体反応停止';
  if (k === 'ui.results.cause_default') return '死因：工場内での切断・破砕';
  if (k === 'ui.results.time_label') return '生存時間：';
  if (k === 'ui.results.bosses_label') return '討伐ボス数：';
  if (k === 'ui.results.kills_label') return '撃破敵数：';
  if (k === 'ui.results.run_teeth_label') return '今回の回収歯数：';
  if (k === 'ui.results.total_teeth_label') return '累計所持歯数：';
  if (k === 'ui.results.cycle_label') return '最終到達サイクル：';
  if (k === 'ui.results.cycle_val') return 'サイクル {level}';
  if (k === 'ui.results.td_status_label') return '防衛ウェーブ / 残存ライフ：';
  if (k === 'ui.results.td_status_val') return '{waves}/{totalWaves} ウェーブ · ライフ：{coreHp}/{coreMaxHp}';
  if (k === 'ui.results.surv_status_label') return '最終フェーズ状況：';
  if (k === 'ui.results.surv_endgame_won') return '突破（15分プロトコル達成）';
  if (k === 'ui.results.surv_endgame_lost') return '15分到達前に死亡';
  if (k === 'ui.results.surv_endgame_not_reached') return '未到達';
  if (k === 'ui.results.btn_restart') return '[ 再出撃 ]';
  if (k === 'ui.results.btn_menu') return '[ メインメニュー ]';
  if (k === 'ui.results.btn_shop') return '[ 永続強化を購入 ]';

  if (k === 'ui.map_select.header_tape') return '戦術調書 // 工場区画';
  if (k === 'ui.map_select.title') return '出撃セクター選択';
  if (k === 'ui.map_select.back') return '[ ◄ メニューへ戻る ]';
  if (k === 'ui.map_select.tab_easy_badge') return '導入セクター';
  if (k === 'ui.map_select.tab_easy') return 'イージー';
  if (k === 'ui.map_select.tab_easy_sub') return '150 ライフ · 1 入口';
  if (k === 'ui.map_select.tab_norm_badge') return '標準セクター';
  if (k === 'ui.map_select.tab_norm') return 'ノーマル';
  if (k === 'ui.map_select.tab_norm_sub') return '100 ライフ · 2 入口';
  if (k === 'ui.map_select.tab_hard_badge') return '危険セクター';
  if (k === 'ui.map_select.tab_hard') return 'ハード';
  if (k === 'ui.map_select.tab_hard_sub') return '75 ライフ · 2 出口';
  if (k === 'ui.map_select.status_completed') return '制圧完了';
  if (k === 'ui.map_select.status_record') return '記録：{bestWave}/12';
  if (k === 'ui.map_select.status_no_data') return '記録なし';
  set("ui.map_select.entrances.one", "入口 1箇所");
  set("ui.map_select.entrances.other", "入口 {count}箇所");
  set("ui.map_select.exits.one", "出口 1箇所");
  set("ui.map_select.exits.other", "出口 {count}箇所");
  if (k === 'ui.map_select.diff_label') return '難易度：';
  if (k === 'ui.map_select.lives_label') return '初期コア耐久：';
  if (k === 'ui.map_select.lives_val') return '{count} ライフ';
  if (k === 'ui.map_select.scrap_label') return '初期物資：';
  if (k === 'ui.map_select.scrap_val') return '{count} スクラップ';
  if (k === 'ui.map_select.layout_label') return '構造：';
  if (k === 'ui.map_select.layout_val') return '入口 {entrances} / 出口 {exits}';
  if (k === 'ui.map_select.deploy_btn') return '[ このセクターに出撃 ► ]';
  if (k === 'ui.map_select.deploy_sub') return '作戦開始 // 12ウェーブ';

  if (k === 'ui.char_modal.title') return 'オペレーター選択';
  if (k === 'ui.char_modal.sub') return '独自の初期武器・パッシブ・生体情報を持つオペレーターを選択せよ';
  if (k === 'ui.char_modal.close') return '[X] 閉じる';
  if (k === 'ui.char_modal.weapon') return '武器：{name}';
  if (k === 'ui.char_modal.confirm') return '[ オペレーター確定・出撃準備 ]';
  if (k === 'ui.char_modal.active') return '選択中';
  if (k === 'ui.char_modal.btn_assigned') return '[ 割当済 ]';
  if (k === 'ui.char_modal.btn_select') return '[ 選択 ]';
  if (k === 'ui.char_modal.waiting_peer') return '仲間がオペレーターを選択中...';
  if (k === 'ui.char_modal.assigned_waiting') return '[ 選択完了 // 待機中 ]';
  if (k === 'ui.char_modal.peer_ready') return '仲間が準備完了！ 出撃するオペレーターを選べ。';
  if (k === 'ui.char_modal.all_ready') return '全員準備完了！ 作戦を開始せよ...';
  if (k === 'ui.char_modal.deploying') return '[ 出撃中！ ]';

  if (k === 'ui.turret_modal.title_place') return '配備端末 // タレット';
  if (k === 'ui.turret_modal.title_turret') return 'タレット // {name}';
  if (k === 'ui.turret_modal.scrap_pill') return 'スクラップ';
  if (k === 'ui.turret_modal.skip_prep') return '[ ウェーブ開始 (F) ]';
  if (k === 'ui.turret_modal.close') return '[ 閉じる (E) ]';
  if (k === 'ui.turret_modal.footer_tip') return '敵から集めたスクラップで建造・強化。レベル2を超えられるのは1ルートのみ。';
  if (k === 'ui.turret_modal.place_instructions_html') return 'タレットを選択して自由に配備。パネルを閉じ床を照準：<b>緑</b>＝可、<b>赤</b>＝不可。左クリックまたは<b>E</b>で建造、<b>ESC</b>でキャンセル。';
  if (k === 'ui.turret_modal.not_enough_scrap') return 'スクラップ不足';
  if (k === 'ui.turret_modal.max_level') return '最大レベル到達';
  if (k === 'ui.turret_modal.upgrade_btn') return '強化 ({cost})';
  if (k === 'ui.turret_modal.integrity') return '耐久度 {hp} / {maxHp}';
  if (k === 'ui.turret_modal.btn_switch_build') return '別のタレットを建造';
  if (k === 'ui.turret_modal.btn_sell') return '売却 (+{refund} スクラップ)';

  if (k === 'ui.tutorial_prompt.tape') return '訓練プロトコル';
  if (k === 'ui.tutorial_prompt.title') return 'チュートリアルを実行しますか？';
  if (k === 'ui.tutorial_prompt.desc1') return '初任務です。インタラクティブな訓練を受けられます：自由なタレット配置、BTD6形式の分岐強化、スクラップ回収、フロスト＋ボンバーの強力シナジーなどを体験できます。';
  if (k === 'ui.tutorial_prompt.desc2') return 'この選択肢は初回のみ表示されます。後からメインメニューで再挑戦可能です。';
  if (k === 'ui.tutorial_prompt.yes') return '[ はい、訓練を開始する ]';
  if (k === 'ui.tutorial_prompt.no') return '[ いいえ、直ちに出撃する ]';

  if (k === 'ui.lang_screen.title') return '言語を選択してください';
  if (k === 'ui.lang_screen.subtitle') return 'SELECT YOUR LANGUAGE';
  if (k === 'ui.lang_screen.confirm') return '[ 決定して次へ ]';

  return enVal || esVal;
}
