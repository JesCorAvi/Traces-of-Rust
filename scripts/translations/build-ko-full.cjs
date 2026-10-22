const fs = require('fs');
const path = require('path');
const turretsData = require('./turrets-complete.json');
const es = require('../../temp-es-dict.json');

const ko = {};

// 1. Load 345 turret keys for Korean
const koTurrets = turretsData.ko;
for (const [k, v] of Object.entries(koTurrets)) {
  ko[k] = v;
}

// Helper to set
function set(k, v) {
  if (k in es) {
    ko[k] = v;
  }
}

// 2. Modes & Diffs
set("mode.core_defense.title", "타워 디펜스");
set("mode.core_defense.subtitle", "코어 방어");
set("mode.core_defense.badge", "★ 메인 캠페인 // 12웨이브");
set("mode.core_defense.shortTitle", "타워 디펜스");
set("mode.core_defense.tagline", "산업 구역 통로에 방어선을 구축하고, 12번의 치명적인 공세를 견뎌 생체 반응로를 사수하십시오.");
set("mode.core_defense.objectiveTitle", "방어 프로토콜");
set("mode.core_defense.objectiveDefault", "적들이 코어 격벽에 도달하는 것을 저지하십시오");
set("mode.survival.title", "서바이벌");
set("mode.survival.subtitle", "무리 섬멸");
set("mode.survival.badge", "보조 모드 // 아케이드");
set("mode.survival.shortTitle", "서바이벌");
set("mode.survival.tagline", "초고속 액션: 터렛 없는 직접 전투. 혈청을 수집하고 공장의 5대 보스를 격파하십시오.");
set("mode.survival.objectiveTitle", "공장 작전 목표");
set("mode.survival.objectiveDefault", "공장 보스를 추적하여 격파하십시오");

set("diff.facil", "쉬움");
set("diff.normal", "보통");
set("diff.dificil", "어려움");

// 3. Bosses & Enemies
set("boss.boss_butcher.name", "공장 해체자");
set("boss.boss_siren.name", "가시철사의 모후");
set("boss.boss_furnace.name", "소각 오토마타 09호");
set("boss.boss_apostle.name", "톱니바퀴의 사도");
set("boss.boss_warden.name", "구역 간수");

set("enemy.runner.name", "레일 러너");
set("enemy.hulk.name", "미트 프레스");
set("enemy.nest.name", "배회하는 둥지");
set("enemy.regenerator.name", "역병 봉합사");
set("enemy.splitter.name", "변이 분열체");

// 4. Rewards & Shop
set("reward.heal_pack.name", "응급 수혈 팩");
set("reward.heal_pack.desc", "맥박을 즉시 +75 회복합니다.");
set("reward.teeth_bag.name", "적출된 이빨 자루");
set("reward.teeth_bag.desc", "외과의사의 수술대에서 사용할 수 있는 이빨 +15개를 획득합니다.");

set("shop.dmg.name", "정제 화약");
set("shop.dmg.desc", "레벨당 기본 피해량 +3% (영구)");
set("shop.hp.name", "외과용 봉합사");
set("shop.hp.desc", "레벨당 최대 맥박 +5 (영구)");
set("shop.spd.name", "미량 에페드린");
set("shop.spd.desc", "레벨당 이동 속도 +2% (영구)");
set("shop.atkSpd.name", "기구 윤활유");
set("shop.atkSpd.desc", "레벨당 공격 속도 +2.5% (영구)");
set("shop.mag.name", "적출용 핀셋");
set("shop.mag.desc", "레벨당 자석 획득 반경 +0.35m (영구)");
set("shop.reroll.name", "딜러 매수");
set("shop.reroll.desc", "새로고침 횟수 +1 (최대 +3)");

// 5. Characters
set("char.otto.title", "V. 리히터 박사");
set("char.otto.role", "전술 외과의");
set("char.otto.desc", "생체 사이버네틱스에 집착하는 전직 군의관. 이빨 회수와 군중 제어의 전문가.");
set("char.otto.passive", "해부 프로토콜");
set("char.otto.passiveDesc", "엘리트로부터 이빨 및 영혼 드롭률 +25%. 추가 새로고침 1회를 보유하고 시작.");
set("char.otto.weaponTitle", "회전 톱날");

set("char.mack.title", "맥 \"망치\"");
set("char.mack.role", "중장갑 분쇄병");
set("char.mack.desc", "강화된 사이버네틱스 골격을 지닌 공장의 베테랑. 근접 화력은 막강하지만 기동력이 낮습니다.");
set("char.mack.passive", "탄도 관성");
set("char.mack.passiveDesc", "모든 무기의 기본 범위 +30%. 중발사체의 넉백 +50%.");
set("char.mack.weaponTitle", "12게이지 산탄총");

set("char.pepe.title", "페페 \"불꽃\"");
set("char.pepe.role", "아크 용접공");
set("char.pepe.desc", "고전압 방전과 산업용 극열에 단련된 음지의 전기 기술자.");
set("char.pepe.passive", "과부하 아크");
set("char.pepe.passiveDesc", "공격 시 20% 확률로 인접한 적 2명에게 연쇄 번개를 발사하여 40%의 피해를 입힙니다.");
set("char.pepe.weaponTitle", "열선 버너");

set("char.morbo.title", "모르보");
set("char.morbo.role", "역병 보균자");
set("char.morbo.desc", "화학 실험에서 살아남은 생존자. 주변에 치명적인 부식성 안개를 지속 방출합니다.");
set("char.morbo.passive", "부식성 분비물");
set("char.morbo.passiveDesc", "오라 내 적들의 이동 속도가 15% 감소하며 매초 최대 HP의 2%를 잃습니다.");
set("char.morbo.weaponTitle", "담즙 향로");

set("char.bob.title", "밥 \"기름쟁이\"");
set("char.bob.role", "전투 기관사");
set("char.bob.desc", "자율 기계 장치, 압력 센서 및 파편 폭약 전문가.");
set("char.bob.passive", "지뢰 네트워크");
set("char.bob.passiveDesc", "12초마다 80 피해를 주는 파편 지뢰를 자동으로 매설합니다.");
set("char.bob.weaponTitle", "파편 지뢰");

set("char.krauss.title", "크라우스");
set("char.krauss.role", "구역 집행관");
set("char.krauss.desc", "고압 공압 작살을 장비한 냉혹한 사이보그 저격수.");
set("char.krauss.passive", "공압 장력");
set("char.krauss.passiveDesc", "관통 발사체가 적을 꿰뚫을 때마다 피해량이 +15% 증가합니다.");
set("char.krauss.weaponTitle", "공압식 작살");

set("char.axel.title", "악셀");
set("char.axel.role", "케이지 러너");
set("char.axel.desc", "회전하는 강철 갈고리 케이지로 접근하는 적들을 갈아버리는 광전사.");
set("char.axel.passive", "원심 운동");
set("char.axel.passiveDesc", "지속 이동 시 케이지 회전 속도가 최대 +40%까지 증가합니다.");
set("char.axel.weaponTitle", "고기잡이 케이지");

set("char.tesla.title", "니콜라");
set("char.tesla.role", "정전기 선구자");
set("char.tesla.desc", "고전압 회로에 매료된 광기의 발명가. 고철을 도체로 재구성합니다.");
set("char.tesla.passive", "정전기 공명");
set("char.tesla.passiveDesc", "감전된 적 처치 시 EMP가 폭발하여 3m 이내의 적을 0.8초간 기절시킵니다.");
set("char.tesla.weaponTitle", "고장 난 제세동기");

// 6. Weapons
set("weapon.slash.name", "절단 톱날");
set("weapon.slash.desc", "선혈을 튀기는 회전 톱날. 3D 플래시와 강력한 넉백 효과. (투사체 증가 불가).");
set("weapon.shotgun.name", "12게이지 산탄총");
set("weapon.shotgun.desc", "총구 화염과 탄피 배출을 동반하는 실탄 산탄 사격.");
set("weapon.flamethrower.name", "소각 화염방사기");
set("weapon.flamethrower.desc", "어둠을 밝히며 초당 화상 피해를 주는 지속 화염 방사. (투사체 증가 불가).");
set("weapon.aura.name", "담즙 향로");
set("weapon.aura.desc", "주변에 부식 영역을 형성하여 지속 피해와 감속을 부여. (투사체 증가 불가).");
set("weapon.mines.name", "파편 지뢰");
set("weapon.mines.desc", "밟는 즉시 광범위 폭발을 일으키는 붉은색 센서 지뢰 살포.");
set("weapon.harpoon.name", "공압식 작살");
set("weapon.harpoon.desc", "직선상의 여러 적을 관통하는 고위력 볼트.");
set("weapon.orbital.name", "고기잡이 케이지");
set("weapon.orbital.desc", "갈고리와 두개골로 엮인 강철 케이지가 주위를 선회하며 적을 분쇄.");
set("weapon.bolt.name", "고장 난 제세동기");
set("weapon.bolt.desc", "여러 적에게 연쇄 번개를 튀겨 감전시키는 고압 전기 충격. (투사체 증가 불가).");
set("weapon.chakram.name", "고철 부메랑");
set("weapon.chakram.desc", "적을 베며 날아갔다가 되돌아오며 연속 피해를 주는 원형 톱날.");
set("weapon.welder.name", "아크 용접기");
set("weapon.welder.desc", "2.4초 충전 후 가장 밀집된 적을 향해 1.6초간 고출력 광선 조사. (투사체 증가 불가).");
set("weapon.grenade.name", "순례자 수류탄");
set("weapon.grenade.desc", "착탄 시 폭발하며 강화를 통해 자탄 클러스터로 분열하는 유탄.");
set("weapon.hammer.name", "피스톤 해머");
set("weapon.hammer.desc", "강력한 넉백과 기절을 유발하는 방사형 충격파. (투사체 증가 불가).");
set("weapon.acid.name", "산성 플라스크");
set("weapon.acid.desc", "착탄 시 깨져 적을 녹이고 감속시키는 부식성 웅덩이 생성.");

set("weapon.short.slash", "톱날");
set("weapon.short.shotgun", "산탄총");
set("weapon.short.flamethrower", "방사기");
set("weapon.short.aura", "향로");
set("weapon.short.mines", "지뢰");
set("weapon.short.harpoon", "작살");
set("weapon.short.orbital", "케이지");
set("weapon.short.bolt", "제세동기");
set("weapon.short.chakram", "부메랑");
set("weapon.short.welder", "용접기");
set("weapon.short.grenade", "수류탄");
set("weapon.short.hammer", "해머");
set("weapon.short.acid", "산성액");

// 7. Passives
set("passive.multishot.name", "개량 약실");
set("passive.multishot.desc", "지원되는 무기의 발사체 수를 +1 추가합니다.");
set("passive.dmg.name", "압축 화약");
set("passive.dmg.desc", "모든 무기의 피해량이 레벨당 +15% 증가합니다.");
set("passive.atkSpd.name", "녹슨 서보");
set("passive.atkSpd.desc", "공격 속도와 선회 속도가 레벨당 +10% 증가합니다.");
set("passive.maxHp.name", "외과용 장갑판");
set("passive.maxHp.desc", "최대 맥박을 +25 증가시키고 즉시 동량을 회복합니다.");
set("passive.regen.name", "점적 튜브");
set("passive.regen.desc", "매초 맥박을 +0.9 자동으로 회복합니다.");
set("passive.moveSpd.name", "공업용 에페드린");
set("passive.moveSpd.desc", "이동 속도가 레벨당 +8% 증가합니다.");
set("passive.area.name", "확산 파편");
set("passive.area.desc", "공격의 범위와 효과 면적이 레벨당 +12% 증가합니다.");
set("passive.crit.name", "해체용 렌즈");
set("passive.crit.desc", "2배 피해를 입히는 치명타 확률이 +7% 증가합니다.");
set("passive.magnet.name", "크레인 자석");
set("passive.magnet.desc", "혈청과 이빨의 자석 수집 반경을 넓힙니다.");

set("passive.format.multishot", "+{lvl} 투사체");
set("passive.format.dmg", "+{pct}% 피해");
set("passive.format.atkSpd", "+{pct}% 공격 속도");
set("passive.format.maxHp", "+{hp} 맥박");
set("passive.format.regen", "+{val} HP/초");
set("passive.format.moveSpd", "+{pct}% 이동 속도");
set("passive.format.area", "+{pct}% 범위");
set("passive.format.crit", "+{pct}% 치명타");
set("passive.format.magnet", "+{val}M 자석");

// 8. Maps (18 maps)
set("map.easy_plaza.name", "중앙 광장");
set("map.easy_plaza.badge", "쉬움 // 360° 순환로");
set("map.easy_plaza.desc", "시야가 탁 트인 원형 광장. 적들이 외곽을 순환한 뒤 코어로 진입합니다.");

set("map.easy_spiral.name", "나선 하강로");
set("map.easy_spiral.badge", "쉬움 // 연속 나선");
set("map.easy_spiral.desc", "터렛 밀도가 높은 나선형 하강 코스. 장거리포와 냉기 터렛에 최적입니다.");

set("map.easy_serpentine.name", "사행 참호");
set("map.easy_serpentine.badge", "쉬움 // 연속 S자 커브");
set("map.easy_serpentine.desc", "5개의 급커브가 이어지는 참호. 범위 공격과 화염 터렛에 유리합니다.");

set("map.easy_ramps.name", "고가 반입 램프");
set("map.easy_ramps.badge", "쉬움 // 고가 경사로");
set("map.easy_ramps.desc", "중앙의 강화 교량으로 합류하는 2개의 하강 경사로.");

set("map.easy_cooling.name", "냉각 회로");
set("map.easy_cooling.badge", "쉬움 // 이중 링");
set("map.easy_cooling.desc", "동심원 구조의 냉각 수로. 적들은 외곽 수로를 통과한 후 반응로로 향합니다.");

set("map.easy_horseshoe.name", "강철 편자");
set("map.easy_horseshoe.badge", "쉬움 // U자형 초크포인트");
set("map.easy_horseshoe.desc", "고지대로 둘러싸인 U자형 급커브. 중앙에 막강한 십자포화를 구축할 수 있습니다.");

set("map.norm_twins.name", "쌍둥이 회랑");
set("map.norm_twins.badge", "보통 // 평행 침투로");
set("map.norm_twins.desc", "양쪽에서 동시에 쳐들어오는 2개의 대칭 회랑. 균등한 화력 배치가 필요합니다.");

set("map.norm_pincer.name", "유압 집게발");
set("map.norm_pincer.badge", "보통 // 협공 돌파");
set("map.norm_pincer.desc", "직각으로 교차하는 2방향 침투로가 좁은 중앙 코어로 수렴합니다.");

set("map.norm_cross.name", "공장 십자로");
set("map.norm_cross.badge", "보통 // 십자 진입로");
set("map.norm_cross.desc", "동서남북 4방향에서 교대로 적들이 몰려오는 위험한 교차로.");

set("map.norm_funnel.name", "광재 깔때기");
set("map.norm_funnel.badge", "보통 // 수렴형 깔때기");
set("map.norm_funnel.desc", "3개의 넓은 입구가 하나의 좁은 방어 통로로 급격히 좁아집니다.");

set("map.norm_braid.name", "교차 고가교");
set("map.norm_braid.badge", "보통 // 입체 교차");
set("map.norm_braid.desc", "입체적으로 얽힌 2개의 진격로. 전방위를 방어할 수 있는 배치가 필수적입니다.");

set("map.norm_pit.name", "용광로 피트");
set("map.norm_pit.badge", "보통 // 분화구 피트");
set("map.norm_pit.desc", "코어가 자리 잡은 피트 바닥으로 내려가는 나선형 주로.");

set("map.hard_isolated.name", "격리 구역 9");
set("map.hard_isolated.badge", "어려움 // 분할 코어");
set("map.hard_isolated.desc", "완전히 격리된 2개의 코어. 상호 지원이 불가능한 독립된 2개 진지를 사수하십시오.");

set("map.hard_diagonal.name", "대각 강습로");
set("map.hard_diagonal.badge", "어려움 // 고속 단거리 주파");
set("map.hard_diagonal.desc", "최단 대각선 돌파 경로. 감속 없이는 적들이 20초 만에 코어에 도달합니다.");

set("map.hard_express.name", "특급 화물 라인");
set("map.hard_express.badge", "어려움 // 쾌속 질주로");
set("map.hard_express.desc", "초고속으로 적들이 돌진해 오는 철도 라인. 강력한 저지 수단이 필수입니다.");

set("map.hard_split_level.name", "수직 분기 갱도");
set("map.hard_split_level.badge", "어려움 // 다층 단차");
set("map.hard_split_level.desc", "환기 샤프트에서 방어 플랫폼으로 적들이 수직 낙하하는 입체 구조.");

set("map.hard_blind_alleys.name", "철의 미로");
set("map.hard_blind_alleys.badge", "어려움 // 시야 차단 미로");
set("map.hard_blind_alleys.desc", "철판으로 둘러싸인 폐쇄형 미궁. 장거리 터렛의 사선이 가로막힙니다.");

set("map.hard_dual_breach.name", "오메가 이중 돌파구");
set("map.hard_dual_breach.badge", "어려움 // 동시 대규모 침공");
set("map.hard_dual_breach.desc", "공장의 가장 깊은 구역. 엘리트 보스와 함께 양 측면에서 규격 외의 대군이 쏟아집니다.");

// 9. Tutorials
set("tutorial.step.intro.title", "방어 훈련 프로토콜");
set("tutorial.step.intro.text", "임무: 총 12웨이브 동안 코어를 방어하십시오. 적들은 3개의 산업 경로를 따라 진격합니다. 쓰러진 적에게서 고철을 회수하고 터렛을 건설·강화하여 버텨내십시오. [스페이스바]로 시작.");
set("tutorial.step.intro.hint", "[스페이스바] 키 또는 여기를 클릭하여 계속 진행.");

set("tutorial.step.build.title", "1단계 · 건설");
set("tutorial.step.build.text", "[E] 키로 터렛 단말기를 열고 센트리 기관총을 선택하십시오. 바닥을 조준하면 가이드 링이 표시됩니다 (초록색 = 배치 가능, 빨간색 = 배치 불가). 좌클릭 또는 [E]로 배치.");
set("tutorial.step.build.hint", "코어 근처 초록색 링 · [E]로 단말기 열기");

set("tutorial.step.upgrade.title", "2단계 · 업그레이드");
set("tutorial.step.upgrade.text", "건설한 터렛에 다가가 [E]를 누르십시오. 각 터렛에는 4단계의 강화 경로가 3개 있습니다. 연사 속도를 레벨 2로 올려 트윈 배럴을 잠금 해제하십시오. 2단계를 초과할 수 있는 경로는 하나뿐입니다.");
set("tutorial.step.upgrade.hint", "터렛에 접근하여 [E] 누르기");

set("tutorial.step.synergy.title", "3단계 · 시너지");
set("tutorial.step.synergy.text", "역할을 조합하십시오. 극저온 투사기는 적들을 느리게 묶어두고, 박격포는 뭉친 무리를 폭발로 분쇄합니다. 파란색과 주황색 링은 권장 위치이며 자유롭게 배치해도 좋습니다.");
set("tutorial.step.synergy.hint", "극저온 투사기 + 중박격포 건설");

set("tutorial.step.practice.title", "4단계 · 실전 연습");
set("tutorial.step.practice.text", "적의 선발대가 접근 중입니다. 냉기가 진격을 늦추고 박격포가 쓸어버리는 과정을 확인하십시오. 쓰러진 적이 떨어뜨린 고철을 수거하십시오.");
set("tutorial.step.practice.hint", "코어를 사수하십시오");

set("tutorial.step.done.title", "훈련 수료");
set("tutorial.step.done.text", "고급 시너지: 냉기(감속) + 폭발/화염(+40%); 초소(근위병) + 정비소(보호막/수리); 정비소(과부하) + 기관총(탄막 폭풍). 판매 시 50% 환불. [스페이스바]로 본전투 시작.");
set("tutorial.step.done.hint", "[스페이스바] 요격 개시");

// 10. HUD
set("hud.objective.title", "현재 목표:");
set("hud.objective.default_td", "방어선을 사수하라 ({diff})");
set("hud.objective.default_surv", "군단으로부터 생존: {time}");
set("hud.objective.purge_boss", "{name} 격파");
set("hud.objective.hostiles_left", "잔존 적성체: {count}");
set("hud.objective.next_wave_in", "다음 웨이브까지 {time}");
set("hud.objective.first_wave_prep", "방어 준비 완료 // [F]로 시작");
set("hud.objective.rebuilding_operator", "오퍼레이터 재구축 중... 진지를 유지하라");
set("hud.objective.tutorial_active", "튜토리얼 // {step}");
set("hud.objective.next_boss_in", "다음 보스 출현까지: {time}");
set("hud.objective.endgame_active", "최종 소탕전 발동: 잔존 적을 모두 섬멸하라");

set("hud.wave.prep", "정비 단계");
set("hud.wave.in_progress", "웨이브 {current}/{total}");
set("hud.wave.event_badge", "이벤트 // {title}");
set("hud.wave.surv_endgame", "최종 섬멸전 돌입");
set("hud.wave.surv_horde", "호드 습격 중");
set("hud.wave.skip_prompt", "[F] 로 시작");
set("hud.wave.announcement_boss", "웨이브 {wave} // 보스 접근: {boss}");
set("hud.wave.announcement_progress", "웨이브 {wave} / {total} 진행 중");
set("hud.wave.announcement_completed", "웨이브 {wave} 방어 완수");
set("hud.wave.start_wave", "웨이브 시작");
set("hud.wave.skip_pause", "대기 건너뛰기");

set("hud.turret.interact_prompt", "[E] 강화 / 판매");
set("hud.turret.place_valid", "{name} 배치 · 고철 {cost} · [ESC] 취소");
set("hud.turret.place_invalid", "{reason} · [ESC] 취소");
set("hud.turret.upgrade_sell", "강화 / 판매 · {name}");
set("hud.turret.build_turret", "터렛 건설");

set("hud.slot.level_short", "LV.{lvl}");
set("hud.slot.weapon_empty", "무기 슬롯 비어있음");
set("hud.slot.passive_empty", "임플란트 슬롯 비어있음");
set("hud.slot.weapon_title", "{name} (레벨 +{lvl}) — {desc}");
set("hud.slot.passive_title", "{name} (레벨 +{lvl}): {stat} — {desc}");

set("hud.player_down.title", "[ 오퍼레이터 대파 // 코어 과부하 -{penalty} 라이프 ]");
set("hud.player_down.countdown", "재구축 완료까지 {seconds}초...");
set("hud.player_down.announcement", "오퍼레이터 대파 // 코어 과부하 (-{penalty} 라이프)");

set("hud.core.under_attack", "코어 피격 경보! // {state}");
set("hud.core.leak_detected.one", "침투 경보! -1 라이프");
set("hud.core.leak_detected.other", "침투 경보! -{count} 라이프");

set("hud.core.state_stable", "안정");
set("hud.core.state_alert", "경계");
set("hud.core.state_critical", "위험");
set("hud.core.integrity", "{hp}/{max} 코어 내구도");
set("hud.core.hostiles_counter", "잔존 적: {count}");
set("hud.core.state_free_exploration", "자유 탐색 중");
set("hud.core.state_pause", "대기 중: {seconds}초");

set("hud.boss.alert", "경보: {name} 출현");
set("hud.boss.phase1", "제I형태");
set("hud.boss.phase2", "제II형태 // 광폭화");

set("hud.teammate_down.tag", "아군 대파!");
set("hud.teammate_down.title", "아군 대파! 코어 라이프 -10");
set("hud.teammate_down.sub", "코어 페널티 발생 // 방어선을 사수하라");

set("hud.kinetic.sector_alert", "구역 경보");
set("hud.kinetic.event_started", "이벤트 발생");

set("hud.event.emergency_detected", "긴급 사태 감지");
set("hud.event.completed_title", "방어 완수");
set("hud.event.leak_banner_tag", "코어 유출 경보");
set("hud.event.sector_alert_tag", "구역 경보");
set("hud.event.started_title", "이벤트 개시");
set("hud.event.survive_sub", "구역 내에서 75초간 생존하라");
set("hud.event.climax_tag", "클라이맥스");
set("hud.event.phase3_title", "격리 돌파");
set("hud.event.phase3_sub", "위험 변이체 접근 중");
set("hud.event.secured_tag", "구역 진압");
set("hud.event.secured_title", "격리 기능 복구");
set("hud.event.secured_sub", "코어 페널티 회피");
set("hud.event.swarm_growing", "군단 밀도 증가 중");
set("hud.event.defend_prefix", "방어 지침:");
set("hud.event.survive_prefix", "생존 지침:");
set("hud.event.loc_substation_east", "동부 변전소");
set("hud.event.loc_generator_west", "서부 보조 발전기");
set("hud.event.loc_console_north", "북부 물류 콘솔");
set("hud.event.loc_relay_south", "남부 중계탑");
set("hud.event.loc_containment_zone", "알파 격리 구역");
set("hud.event.title_substation_defended", "변전소 방어 완료");
set("hud.event.title_sector_purged", "구역 섬멸 완료");
set("hud.event.phase_format", "단계 {phase}: {title}");
set("hud.event.inside_perimeter", "● 방어선 내부 (반경 15M)");
set("hud.event.outside_perimeter", "▲ 방어선 이탈 ({dist}m) - 복귀하라!");

// 11. UI Elements (Topbar, Menus, Settings, Dossier, Modals, Results, Online, Manual)
set("ui.topbar.sector", "섹터 07-B // 봉쇄 경로");
set("ui.topbar.teeth", "이빨:");
set("ui.topbar.settings", "설정");

set("ui.menu.campaign_badge", "★ 메인 캠페인 // 12웨이브");
set("ui.menu.arcade_badge", "보조 모드 // 초고속 액션 · 무한 호드");
set("ui.menu.play", "[ 출격 ]");
set("ui.menu.play_td", "[ 출격: 타워 디펜스 ]");
set("ui.menu.play_surv", "[ 출격: 서바이벌 ]");
set("ui.menu.tutorial_td", "TD 튜토리얼");
set("ui.menu.manual", "[ 매뉴얼 / 조작 방법 ]");
set("ui.menu.shop", "[ 클리닉 / 임플란트 ]");
set("ui.menu.online", "P2P 멀티플레이");
set("ui.menu.dossier_title", "군력 조서");
set("ui.menu.dossier_mode_td", "조서 // 타워 디펜스");
set("ui.menu.dossier_mode_surv", "조서 // 서바이벌");
set("ui.menu.dossier_directive_title", "전술 지침:");
set("ui.menu.dossier_directive_td", "산업 통로에 터렛을 배치하고, 12번의 공세를 견뎌내어 바이오 생체 반응로를 사수하십시오.");
set("ui.menu.dossier_directive_surv", "초고속 액션 모드: 터렛 없는 직접 전투. 혈청을 수집하고 공장의 5대 보스를 격파하십시오.");
set("ui.menu.dossier_metric_td", "최고 돌파 웨이브:");
set("ui.menu.dossier_metric_surv", "최고 생존 시간:");
set("ui.menu.dossier_runs", "출격 기록 수:");
set("ui.menu.dossier_kills", "처치한 적성체:");
set("ui.menu.dossier_bosses", "격파한 공장 보스:");
set("ui.menu.dossier_upgrades", "획득한 임플란트 수:");
set("ui.menu.controls_title", "전투 조작:");
set("ui.menu.controls_desc", "WASD - 이동 · 마우스 - 조준 · 스페이스 - 도약 · Shift - 회피 · F - 웨이브 시작 · E - 터렛 · Tab - 목표");

set("ui.settings.title", "전술 설정");
set("ui.settings.save_return", "[ 저장하고 돌아가기 ]");
set("ui.settings.audio_section", "음향 설정");
set("ui.settings.master_vol", "전체 음량:");
set("ui.settings.sfx_vol", "효과음/전투음 (SFX):");
set("ui.settings.music_vol", "배경음악 음량:");
set("ui.settings.amb_vol", "환경음:");
set("ui.settings.mute_global", "전체 음소거:");
set("ui.settings.video_section", "화면 설정");
set("ui.settings.res_scale", "렌더링 해상도:");
set("ui.settings.res_03", "0.30x (픽셀 아트 · 레트로)");
set("ui.settings.res_044", "0.44x (표준 · 고속)");
set("ui.settings.res_06", "0.60x (선명함 · 권장)");
set("ui.settings.res_08", "0.80x (고해상도)");
set("ui.settings.res_10", "1.00x (네이티브 1080p)");
set("ui.settings.damage_text", "피해량 숫자 표시:");
set("ui.settings.pixel_filter", "픽셀 스무딩 필터:");
set("ui.settings.post_proc", "포스트 프로세싱 효과:");
set("ui.settings.blood_splats", "바닥 선혈 이펙트:");
set("ui.settings.shake_section", "화면 흔들림 및 접근성");
set("ui.settings.shake_int", "화면 흔들림 강도:");
set("ui.settings.shake_0", "0% (비활성화)");
set("ui.settings.shake_50", "50% (감소)");
set("ui.settings.shake_100", "100% (기본값)");
set("ui.settings.shake_150", "150% (격렬함)");
set("ui.settings.gameplay_section", "게임플레이 설정");
set("ui.settings.auto_aim", "근접 대상 자동 조준 보정:");
set("ui.settings.show_turret_range", "배치 시 터렛 사거리 표시:");
set("ui.settings.quick_cast", "스킬 즉시 시전:");
set("ui.settings.lang_section", "언어 / Language");
set("ui.settings.lang_select", "게임 표시 언어:");

set("ui.shop.title", "외과의사의 수술대");
set("ui.shop.subtitle", "적출된 이빨로 영구 생체 사이버네틱스 임플란트를 이식하십시오");
set("ui.shop.teeth_count", "보유 이빨: {count}");
set("ui.shop.cost", "비용: {cost} 이빨");
set("ui.shop.max", "최대 레벨");
set("ui.shop.buy", "[ 이식 ]");
set("ui.shop.respec_btn", "[ 임플란트 초기화 // 이빨 환불 ]");
set("ui.shop.respec_confirm", "모든 영구 업그레이드를 초기화하고 소모된 이빨을 100% 돌려받으시겠습니까?");
set("ui.shop.close", "[ 닫기 ]");

set("ui.map_select.title", "작전 구역 선택");
set("ui.map_select.subtitle", "방어할 산업 구역을 선택하십시오");
set("ui.map_select.tab_norm", "일반 구역");
set("ui.map_select.tab_norm_sub", "100 라이프 · 2개 진입로");
set("ui.map_select.tab_hard_badge", "위험 구역");
set("ui.map_select.tab_hard", "위험 구역");
set("ui.map_select.tab_hard_sub", "75 라이프 · 2개 출구");
set("ui.map_select.status_completed", "작전 완수");
set("ui.map_select.status_record", "최고 기록: {bestWave}/12");
set("ui.map_select.status_no_data", "기록 없음");
set("ui.map_select.entrances.one", "진입로 1개");
set("ui.map_select.entrances.other", "진입로 {count}개");
set("ui.map_select.exits.one", "출구 1개");
set("ui.map_select.exits.other", "출구 {count}개");
set("ui.map_select.diff_label", "난이도:");
set("ui.map_select.lives_label", "초기 코어 내구도:");
set("ui.map_select.lives_val", "{count} 라이프");
set("ui.map_select.scrap_label", "초기 보급 자원:");
set("ui.map_select.scrap_val", "{count} 고철");
set("ui.map_select.layout_label", "통로 구조:");
set("ui.map_select.layout_val", "진입로 {entrances}개 / 출구 {exits}개");
set("ui.map_select.deploy_btn", "[ 이 구역으로 출격 ► ]");
set("ui.map_select.deploy_sub", "방어 작전 개시 // 12웨이브");

set("ui.char_modal.title", "오퍼레이터 배치");
set("ui.char_modal.sub", "고유 시작 무기와 지속 효과를 보유한 오퍼레이터를 선택하십시오");
set("ui.char_modal.close", "[X] 닫기");
set("ui.char_modal.weapon", "시작 무기: {name}");
set("ui.char_modal.confirm", "[ 오퍼레이터 확정 // 출격 대기 ]");
set("ui.char_modal.active", "선택 중");
set("ui.char_modal.btn_assigned", "[ 배정 완료 ]");
set("ui.char_modal.btn_select", "[ 선택 ]");
set("ui.char_modal.waiting_peer", "팀원이 오퍼레이터를 선택하는 중입니다...");
set("ui.char_modal.assigned_waiting", "[ 선택 완료 // 대기 중 ]");
set("ui.char_modal.peer_ready", "팀원 준비 완료! 출격할 오퍼레이터를 결정하십시오.");
set("ui.char_modal.all_ready", "전원 출격 준비 완료! 방어선을 전개하십시오...");
set("ui.char_modal.deploying", "[ 출격 중! ]");

set("ui.turret_modal.title_place", "배치 단말기 // 터렛");
set("ui.turret_modal.title_turret", "터렛 // {name}");
set("ui.turret_modal.scrap_pill", "고철");
set("ui.turret_modal.skip_prep", "[ 웨이브 시작 (F) ]");
set("ui.turret_modal.close", "[ 닫기 (E) ]");
set("ui.turret_modal.footer_tip", "적을 처치하고 수집한 고철로 건설 및 업그레이드합니다. 2단계를 초과하는 강화 경로는 하나만 선택할 수 있습니다.");
set("ui.turret_modal.place_instructions_html", "터렛을 선택해 자유롭게 배치하십시오. 패널을 닫고 지면을 조준: <b>초록색</b>=배치 가능, <b>빨간색</b>=배치 불가. 좌클릭 또는 <b>E</b>키로 건설, <b>ESC</b>로 취소합니다.");
set("ui.turret_modal.not_enough_scrap", "고철 부족");
set("ui.turret_modal.max_level", "최고 레벨 도달");
set("ui.turret_modal.upgrade_btn", "업그레이드 ({cost})");
set("ui.turret_modal.integrity", "내구도 {hp} / {maxHp}");
set("ui.turret_modal.btn_switch_build", "다른 터렛 건설");
set("ui.turret_modal.btn_sell", "판매 (+{refund} 고철)");

set("ui.levelup.title", "생체 신경망 강화");
set("ui.levelup.subtitle", "새로운 업그레이드 또는 무기를 선택하십시오");
set("ui.levelup.reroll", "새로고침");
set("ui.levelup.rerolls_remaining.one", "새로고침 남음: 1회");
set("ui.levelup.rerolls_remaining.other", "새로고침 남음: {count}회");
set("ui.levelup.skip", "선택 건너뛰기 (+50 고철)");

set("ui.results.title_victory", "구역 정화 완료 // 작전 성공");
set("ui.results.title_defeat", "작전 실패 // 신호 끊김");
set("ui.results.subtitle_victory", "모든 위협을 제거하고 원자로를 안전하게 사수했습니다.");
set("ui.results.subtitle_defeat", "코어가 파괴되었거나 맥박이 정지했습니다.");
set("ui.results.time_survived", "생존 시간: {time}");
set("ui.results.waves_cleared", "돌파 웨이브: {waves} / 12");
set("ui.results.enemies_killed", "처치한 적성체: {kills}");
set("ui.results.scrap_earned", "수집한 고철: {scrap}");
set("ui.results.teeth_earned", "적출된 이빨: {teeth}");
set("ui.results.btn_retry", "[ 다시 도전 ]");
set("ui.results.btn_menu", "[ 기지로 복귀 ]");

set("ui.tutorial_prompt.tape", "훈련 프로토콜");
set("ui.tutorial_prompt.title", "훈련 튜토리얼을 진행하시겠습니까?");
set("ui.tutorial_prompt.desc1", "첫 임무입니다. 자유로운 터렛 배치, BTD6 방식의 분기형 업그레이드, 고철 회수, 냉기+폭발 시너지 등을 체험할 수 있는 인터랙티브 훈련이 준비되어 있습니다.");
set("ui.tutorial_prompt.desc2", "이 안내는 최초 1회만 표시됩니다. 나중에 메인 메뉴에서 언제든 다시 플레이할 수 있습니다.");
set("ui.tutorial_prompt.yes", "[ 예, 훈련을 시작합니다 ]");
set("ui.tutorial_prompt.no", "[ 아니오, 즉시 실전에 투입합니다 ]");

set("ui.lang_screen.title", "언어를 선택하십시오");
set("ui.lang_screen.subtitle", "SELECT YOUR LANGUAGE");
set("ui.lang_screen.confirm", "[ 결정하고 계속하기 ]");

// Fill in from cjkUi and ja/en mapping
const cjkUi = require('./cjk-ui-translations.cjs');
for (const [k, v] of Object.entries(cjkUi)) {
  if (v.ko) {
    ko[k] = v.ko;
  }
}

import('../../locales/ja.js').then(jaMod => {
  const ja = jaMod.default;
  for (const k of Object.keys(es)) {
    if (!ko[k]) {
      ko[k] = ja[k] || es[k];
    }
  }

  // Save locales/ko.js
  const outputPath = path.resolve(__dirname, '../../locales/ko.js');
  const outLines = ['// Korean localization dictionary for Traces of Rust.', 'export default {'];
  const keys = Object.keys(es);
  keys.forEach((k, idx) => {
    const isLast = idx === keys.length - 1;
    outLines.push(`  ${JSON.stringify(k)}: ${JSON.stringify(ko[k] || es[k])}${isLast ? '' : ','}`);
  });
  outLines.push('};');
  outLines.push('');

  fs.writeFileSync(outputPath, outLines.join('\n'), 'utf-8');
  console.log(`Generated locales/ko.js with ${keys.length} keys!`);
});
