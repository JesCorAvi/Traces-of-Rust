const fs = require('fs');
const path = require('path');
const es = require('../../temp-es-dict.json');

const ko = {};

function set(k, v) {
  if (k in es) {
    ko[k] = v;
  }
}

async function run() {
  const enMod = await import('../../locales/en.js');
  const en = enMod.default;

  // 1. MODES & DIFFICULTY
  set("mode.core_defense.title", "타워 디펜스");
  set("mode.core_defense.subtitle", "코어 방어");
  set("mode.core_defense.badge", "★ 메인 캠페인 // 12 웨이브");
  set("mode.core_defense.shortTitle", "타워 디펜스");
  set("mode.core_defense.tagline", "산업 구역 경로에 터렛을 배치하고, 12번의 공세를 견뎌내어 바이오 원자로를 사수하십시오.");
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

  // 2. BOSSES & ENEMIES
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

  // 3. REWARDS & SHOP
  set("reward.heal_pack.name", "응급 수혈 팩");
  set("reward.heal_pack.desc", "맥박을 즉시 +75 회복합니다.");
  set("reward.teeth_bag.name", "적출된 이빨 자루");
  set("reward.teeth_bag.desc", "외과의사의 수술대에서 사용할 수 있는 이빨 +15개를 획득합니다.");

  set("shop.dmg.name", "정제 화약");
  set("shop.dmg.desc", "레벨당 기본 피해량 +3% (영구)");
  set("shop.hp.name", "외과용 봉합사");
  set("shop.hp.desc", "레벨당 최대 맥박 +5 (영구)");
  set("shop.spd.name", "미량 에페드린");
  set("shop.spd.desc", "레벨당 이동 속도 +2.5% (영구)");
  set("shop.pickup.name", "생체 자석");
  set("shop.pickup.desc", "레벨당 수집 반경 +8% (영구)");
  set("shop.scrap.name", "고철 회수 갈고리");
  set("shop.scrap.desc", "적 처치 시 추가 고철 획득 확률 +5% (영구)");
  set("shop.luck.name", "피 묻은 토끼 발");
  set("shop.luck.desc", "레벨당 행운 +4% (치명타 및 희귀 선택지 확률 증가)");
  set("shop.armor.name", "피하 장갑판");
  set("shop.armor.desc", "모든 피격 시 받는 피해 -1 고정 감소 (영구)");
  set("shop.crit.name", "약점 감지 렌즈");
  set("shop.crit.desc", "레벨당 치명타 확률 +2.5% (영구)");
  set("shop.regen.name", "재생 혈청 점적기");
  set("shop.regen.desc", "5초마다 맥박 1 회복 (영구)");
  set("shop.starting_scrap.name", "밀수품 은닉처");
  set("shop.starting_scrap.desc", "모든 방어전 시작 시 고철 +15 추가 지급 (영구)");
  set("shop.overdrive_duration.name", "신경 과열 전극");
  set("shop.overdrive_duration.desc", "오버드라이브 지속 시간 +0.8초 (영구)");
  set("shop.core_shield.name", "코어 보강 격벽");
  set("shop.core_shield.desc", "코어의 최대 내구도 +15 (영구)");
  set("shop.respec.name", "신경망 초기화");
  set("shop.respec.desc", "모든 영구 업그레이드를 초기화하고 소모된 이빨을 100% 환불받습니다.");

  // 4. MAPS
  set("map.canal.name", "수로 A-01");
  set("map.canal.desc", "단일 통로. 터렛을 테스트하기에 이상적인 직선 킬존.");
  set("map.perimetro.name", "외곽 순환로 02");
  set("map.perimetro.desc", "폐쇄 루프형 통로. 적들이 코어에 닿기 전에 내부 화망을 구축하십시오.");
  set("map.bifurcacion.name", "분기 교차로 03");
  set("map.bifurcacion.desc", "두 개의 진입로가 하나의 코어로 수렴합니다. 자원을 균형 있게 분배하십시오.");
  set("map.fundicion.name", "제련소 04");
  set("map.fundicion.desc", "좁은 통로와 융해로. 근거리 화염 및 감속 터렛에 적합합니다.");
  set("map.estacion.name", "환승 터미널 05");
  set("map.estacion.desc", "넓은 플랫폼과 엄폐물. 장거리 레일건과 테슬라 코일 배치에 이상적입니다.");
  set("map.nodo.name", "신경망 노드 06");
  set("map.nodo.desc", "다중 진입로와 복잡한 회랑. 정밀한 화망 연계가 필요합니다.");
  set("map.hangar.name", "폐기 격납고 07");
  set("map.hangar.desc", "엄청난 개활지. 다방면에서 몰려오는 적들을 막기 위해 드론과 박격포가 필수적입니다.");
  set("map.laboratorio.name", "생체 실험실 08");
  set("map.laboratorio.desc", "밀폐 구역과 오염 통로. 좁은 길목에 범위 피해 화망을 집중하십시오.");
  set("map.reactor.name", "주 원자로 09");
  set("map.reactor.desc", "원형 코어 시설. 전 방향에서 쏟아지는 파상 공세를 사수하십시오.");
  set("map.fortaleza.name", "요새 구역 10");
  set("map.fortaleza.desc", "복합 방어선. 높은 난이도와 막대한 적 개체 수가 출현합니다.");
  set("map.abismo.name", "심연 통로 11");
  set("map.abismo.desc", "끝없는 어둠의 협곡. 적들의 이동 경로가 교차하는 위험 지대입니다.");
  set("map.catacumbas.name", "기계 지하묘지 12");
  set("map.catacumbas.desc", "최종 방어선. 공장의 가장 깊고 흉포한 괴물들이 코어를 노립니다.");

  // 5. CHARACTERS
  set("char.mateo.name", "마테오");
  set("char.mateo.title", "폐기공");
  set("char.mateo.passive", "고철 탐욕: 고철 수집량 +20%, 수집 반경 +15%");
  set("char.vane.name", "바네 박사");
  set("char.vane.title", "생체공학자");
  set("char.vane.passive", "세포 봉합: 이동 속도 +10%, 4초마다 맥박 1 회복");
  set("char.silas.name", "실라스");
  set("char.silas.title", "참호 보병");
  set("char.silas.passive", "중장갑 포진: 방어력 +2, 체력 50% 미만 시 피해량 +25%");
  set("char.kurtz.name", "쿠르츠");
  set("char.kurtz.title", "선봉 분쇄자");
  set("char.kurtz.passive", "과부하 추진: 폭발 범위 +30%, 넉백 저항");
  set("char.nyx.name", "닉스");
  set("char.nyx.title", "유령 정찰병");
  set("char.nyx.passive", "그림자 치명타: 치명타 확률 +15%, 치명타 피해 +40%");

  // 6. WEAPONS
  set("weapon.wrench.name", "중형 파이프 렌치");
  set("weapon.wrench.desc", "묵직한 둔기. 적을 강하게 후려쳐 밀쳐냅니다.");
  set("weapon.revolver.name", "녹슨 리볼버");
  set("weapon.revolver.desc", "6연발 대구경 권총. 높은 저지력과 관통력을 자랑합니다.");
  set("weapon.shotgun.name", "단총열 산탄총");
  set("weapon.shotgun.desc", "근거리에서 치명적인 산탄을 발사하여 전방 적들을 분쇄합니다.");
  set("weapon.nailgun.name", "공압 못총");
  set("weapon.nailgun.desc", "엄청난 연사 속도로 강철 못을 연속 발사합니다.");
  set("weapon.saw_launcher.name", "원형 톱날 발사기");
  set("weapon.saw_launcher.desc", "지면과 벽에 튕기며 적들을 연속으로 갈라버리는 톱날을 투사합니다.");
  set("weapon.acid_flask.name", "부식성 산성 플라스크");
  set("weapon.acid_flask.desc", "지면에 깨져 웅덩이를 형성하며 적들에게 지속 부식 피해를 입힙니다.");
  set("weapon.flamethrower.name", "개조 화염방사기");
  set("weapon.flamethrower.desc", "전방 부채꼴 범위에 지속적인 고열 화염을 방사합니다.");
  set("weapon.tesla_gun.name", "휴대용 테슬라 방전기");
  set("weapon.tesla_gun.desc", "주변의 여러 적에게 연쇄 번개를 발사하여 감전시킵니다.");
  set("weapon.laser_cutter.name", "산업용 레이저 절단기");
  set("weapon.laser_cutter.desc", "적들을 일렬로 관통하는 고출력 에너지 광선을 조사합니다.");
  set("weapon.grenade.name", "파편 수류탄");
  set("weapon.grenade.desc", "폭발하여 넓은 범위의 적들에게 막대한 파편 피해를 줍니다.");

  // 7. PASSIVE ITEMS
  set("item.titanium_casing.name", "티타늄 장갑 케이싱");
  set("item.titanium_casing.desc", "최대 맥박이 증가하고 받는 피해가 감소합니다.");
  set("item.adrenaline_shot.name", "아드레날린 주사기");
  set("item.adrenaline_shot.desc", "이동 속도와 긴급 회피 기동 능력이 향상됩니다.");
  set("item.expanded_magazine.name", "대용량 탄창 드럼");
  set("item.expanded_magazine.desc", "모든 원거리 무기의 공격 속도가 대폭 증가합니다.");
  set("item.hollow_points.name", "할로우 포인트 탄두");
  set("item.hollow_points.desc", "모든 공격의 치명타 확률과 치명타 피해량이 증가합니다.");
  set("item.scrap_magnet.name", "고출력 전자석");
  set("item.scrap_magnet.desc", "떨어진 고철과 아이템을 끌어당기는 자석 반경이 대폭 늘어납니다.");
  set("item.bio_reactor.name", "생체 미세 반응로");
  set("item.bio_reactor.desc", "주기적으로 맥박을 재생하며 오버드라이브 충전 시간을 단축합니다.");

  // 8. TURRETS (Names & Base Descs)
  set("turret.turret_mg.name", "센트리 기관총");
  set("turret.turret_mg.desc", "빠른 연사 속도로 전방의 적들을 견제하는 기본 방어 터렛.");
  set("turret.turret_flamer.name", "화염방사 터렛");
  set("turret.turret_flamer.desc", "근거리에서 고열 화염을 방사해 다수의 적에게 지속 화상을 입힙니다.");
  set("turret.turret_frost.name", "극저온 투사기");
  set("turret.turret_frost.desc", "적들을 얼려 이동 속도를 치명적으로 감속시키는 지원용 터렛.");
  set("turret.turret_tesla.name", "테슬라 코일");
  set("turret.turret_tesla.desc", "여러 적에게 연쇄 번개를 튕겨 무리를 일거에 감전시킵니다.");
  set("turret.turret_mortar.name", "중박격포");
  set("turret.turret_mortar.desc", "장거리 포물선 폭탄을 발사하여 광역 폭발 피해를 줍니다.");
  set("turret.turret_saw.name", "회전 톱날 발사기");
  set("turret.turret_saw.desc", "관통 톱날을 투사하여 일렬로 진격하는 적들을 연속 절단합니다.");
  set("turret.turret_railgun.name", "레일건");
  set("turret.turret_railgun.desc", "초고속 관통 탄환으로 직선상의 모든 적과 장갑 적을 꿰뚫습니다.");
  set("turret.turret_drone.name", "드론 격납고");
  set("turret.turret_drone.desc", "전장을 자유롭게 비행하며 요격하는 공격 드론을 사출합니다.");
  set("turret.turret_laser.name", "집속 레이저");
  set("turret.turret_laser.desc", "목표를 지속 조준할수록 피해량이 기하급수적으로 증폭되는 광선.");
  set("turret.turret_shotgun.name", "대구경 산탄 포탑");
  set("turret.turret_shotgun.desc", "근접한 적 무리에게 광역 산탄을 난사하여 박살 냅니다.");

  // 9. HUD & UI STATS & LABELS
  set("hud.core.health", "코어 내구도: {hp}/{max}");
  set("hud.core.warning", "경고: 코어가 공격받고 있습니다!");
  set("hud.core.critical", "위험: 코어 붕괴 임박!");
  set("hud.core.leak_detected.one", "코어 침투 경보: 적 1마리 통과!");
  set("hud.core.leak_detected.other", "코어 침투 경보: 적 {count}마리 통과!");
  set("hud.wave.number", "웨이브 {current} / {total}");
  set("hud.wave.incoming", "적 공세 접근 중!");
  set("hud.wave.cleared", "웨이브 클리어!");
  set("hud.wave.prep", "정비 시간");
  set("hud.wave.start_button", "[F] 웨이브 시작");
  set("hud.scrap.counter", "고철: {amount}");
  set("hud.teeth.counter", "이빨: {amount}");
  set("hud.pulse.counter", "맥박: {hp}/{max}");
  set("hud.overdrive.ready", "오버드라이브 준비 완료! [스페이스바]");
  set("hud.overdrive.active", "오버드라이브 활성화!");
  set("hud.turret.build_prompt", "[E] 터렛 건설");
  set("hud.turret.upgrade_prompt", "[E] 터렛 관리");
  set("hud.turret.cannot_build", "이 위치에는 건설할 수 없습니다");
  set("hud.boss.approaching", "경고: 강력한 공장 보스 출현!");
  set("hud.boss.slain", "보스 처치 완료!");

  // UI Common
  set("ui.menu.play", "작전 개시");
  set("ui.menu.modes", "게임 모드");
  set("ui.menu.upgrades", "외과의사의 수술대");
  set("ui.menu.settings", "환경 설정");
  set("ui.menu.credits", "제작진");
  set("ui.menu.exit", "게임 종료");
  set("ui.menu.back", "뒤로 가기");
  set("ui.menu.select", "선택");
  set("ui.menu.confirm", "확인");
  set("ui.menu.cancel", "취소");
  set("ui.menu.close", "닫기");
  set("ui.menu.continue", "계속하기");
  set("ui.menu.retry", "다시 시도");
  set("ui.menu.give_up", "작전 포기");

  set("ui.settings.title", "설정");
  set("ui.settings.language", "언어 / Language");
  set("ui.settings.audio", "오디오");
  set("ui.settings.master_vol", "전체 음량");
  set("ui.settings.sfx_vol", "효과음 음량");
  set("ui.settings.music_vol", "배경음 음량");
  set("ui.settings.graphics", "그래픽");
  set("ui.settings.fullscreen", "전체 화면");
  set("ui.settings.screen_shake", "화면 흔들림");
  set("ui.settings.damage_numbers", "피해량 표시");
  set("ui.settings.controls", "조작");
  set("ui.settings.keybinds", "키 설정");
  set("ui.settings.reset", "기본값으로 복원");

  set("ui.levelup.title", "생체 신경망 강화");
  set("ui.levelup.subtitle", "새로운 업그레이드 또는 무기를 선택하십시오");
  set("ui.levelup.reroll", "새로고침");
  set("ui.levelup.rerolls_remaining.one", "새로고침 남음: 1회");
  set("ui.levelup.rerolls_remaining.other", "새로고침 남음: {count}회");
  set("ui.levelup.skip", "선택 건너뛰기 (+50 고철)");

  set("ui.gameover.title", "작전 실패 // 신호 끊김");
  set("ui.gameover.subtitle", "코어가 파괴되었거나 맥박이 정지했습니다.");
  set("ui.gameover.waves_survived", "버텨낸 웨이브: {waves}");
  set("ui.gameover.enemies_killed", "처치한 적: {kills}");
  set("ui.gameover.scrap_collected", "수집한 고철: {scrap}");
  set("ui.gameover.teeth_earned", "획득한 이빨: {teeth}");
  set("ui.gameover.retry", "[ 다시 도전 ]");
  set("ui.gameover.main_menu", "[ 기지로 귀환 ]");

  set("ui.victory.title", "구역 정화 완료 // 작전 성공");
  set("ui.victory.subtitle", "모든 위협을 제거하고 원자로를 안전하게 사수했습니다.");
  set("ui.victory.rewards", "작전 완수 보상:");
  set("ui.victory.continue", "[ 본부로 복귀 ]");

  set("ui.map_select.title", "작전 구역 선택");
  set("ui.map_select.subtitle", "방어할 산업 구역을 선택하십시오");
  set("ui.map_select.tab_norm", "일반 구역");
  set("ui.map_select.tab_norm_sub", "100 라이프 · 2개 진입로");
  set("ui.map_select.tab_hard_badge", "위험 구역");
  set("ui.map_select.tab_hard", "위험 구역");
  set("ui.map_select.tab_hard_sub", "75 라이프 · 2개 출구");
  set("ui.map_select.status_completed", "작전 성공");
  set("ui.map_select.status_record", "최고 기록: {bestWave}/12");
  set("ui.map_select.status_no_data", "기록 없음");
  set("ui.map_select.entrances.one", "진입로 1개");
  set("ui.map_select.entrances.other", "진입로 {count}개");
  set("ui.map_select.exits.one", "출구 1개");
  set("ui.map_select.exits.other", "출구 {count}개");
  set("ui.map_select.diff_label", "난이도:");
  set("ui.map_select.lives_label", "초기 코어 내구도:");
  set("ui.map_select.lives_val", "{count} 라이프");
  set("ui.map_select.scrap_label", "시작 자원:");
  set("ui.map_select.scrap_val", "{count} 고철");
  set("ui.map_select.layout_label", "통로 구조:");
  set("ui.map_select.layout_val", "진입로 {entrances}개 / 출구 {exits}개");
  set("ui.map_select.deploy_btn", "[ 이 구역으로 출격 ► ]");
  set("ui.map_select.deploy_sub", "방어 작전 개시 // 12 웨이브");

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

  set("ui.tutorial_prompt.tape", "훈련 프로토콜");
  set("ui.tutorial_prompt.title", "훈련 튜토리얼을 진행하시겠습니까?");
  set("ui.tutorial_prompt.desc1", "첫 임무입니다. 자유로운 터렛 배치, BTD6 방식의 분기형 업그레이드, 고철 회수, 냉기+폭발 시너지 등을 체험할 수 있는 인터랙티브 훈련이 준비되어 있습니다.");
  set("ui.tutorial_prompt.desc2", "이 안내는 최초 1회만 표시됩니다. 나중에 메인 메뉴에서 언제든 다시 플레이할 수 있습니다.");
  set("ui.tutorial_prompt.yes", "[ 예, 훈련을 시작합니다 ]");
  set("ui.tutorial_prompt.no", "[ 아니오, 즉시 실전에 투입합니다 ]");

  set("ui.lang_screen.title", "언어를 선택하십시오");
  set("ui.lang_screen.subtitle", "SELECT YOUR LANGUAGE");
  set("ui.lang_screen.confirm", "[ 결정하고 계속하기 ]");

  // Multiplayer Lobby
  set("lobby.title", "멀티플레이 로비");
  set("lobby.subtitle", "스팀 P2P 협동 방어");
  set("lobby.create", "방 만들기");
  set("lobby.join", "방 참가");
  set("lobby.ready", "준비 완료");
  set("lobby.start", "게임 시작");
  set("lobby.waiting", "플레이어 대기 중...");
  set("lobby.connecting", "연결 중...");
  set("lobby.connected", "연결됨");
  set("lobby.disconnected", "연결 끊김");
  set("lobby.player_joined", "{name} 님이 참가했습니다.");
  set("lobby.player_left", "{name} 님이 나갔습니다.");

  // STATS
  set("stats.dmg", "피해량");
  set("stats.hp", "최대 맥박");
  set("stats.spd", "이동 속도");
  set("stats.rate", "공격 속도");
  set("stats.range", "사거리");
  set("stats.area", "폭발 반경");
  set("stats.crit", "치명타 확률");
  set("stats.armor", "피해 감소");
  set("stats.regen", "초당 재생");
  set("stats.magnet", "수집 반경");
  set("stats.luck", "행운");

  // Fill in any remaining keys dynamically based on English / Spanish patterns
  for (const k of Object.keys(es)) {
    if (ko[k]) continue;

    const enVal = en[k] || es[k];
    const esVal = es[k];

    // Turret upgrades (path_top_*, path_mid_*, path_bot_*)
    if (k.startsWith('turret.')) {
      const parts = k.split('.');
      const sub = parts[2]; // name, desc, path_top_name, path_top_desc, etc.
      if (sub && sub.endsWith('_name')) {
        ko[k] = translateTurretUpgradeName(enVal);
        continue;
      }
      if (sub && sub.endsWith('_desc')) {
        ko[k] = translateTurretUpgradeDesc(enVal);
        continue;
      }
    }

    // Weapons / Items upgrades
    if (k.startsWith('weapon.') || k.startsWith('item.')) {
      if (k.endsWith('.name')) {
        ko[k] = translateItemWeaponName(enVal);
        continue;
      }
      if (k.endsWith('.desc')) {
        ko[k] = translateItemWeaponDesc(enVal);
        continue;
      }
    }

    // Tutorial steps
    if (k.startsWith('tutorial.')) {
      ko[k] = translateTutorial(k, enVal);
      continue;
    }

    // Generic UI
    ko[k] = translateGeneric(k, enVal, esVal);
  }

  // Save locales/ko.js
  const outputPath = path.resolve(__dirname, '../../locales/ko.js');
  const fileContent = `// 한국어 (Korean) localization dictionary for Traces of Rust
export default ${JSON.stringify(ko, null, 2)};
`;

  fs.writeFileSync(outputPath, fileContent, 'utf-8');
  console.log(`Generated locales/ko.js with ${Object.keys(ko).length} keys!`);
}

function translateTurretUpgradeName(enVal) {
  const map = {
    "Twin Barrels": "쌍열 총열",
    "High-Caliber Rounds": "대구경 철갑탄",
    "Rotary Cannon": "회전식 개틀링 포탑",
    "Depleted Uranium": "열화우라늄 탄환",
    "Titan Vulcan": "타이탄 벌칸 시스템",
    "Hair Trigger": "경량화 방아쇠",
    "Overclocked Motor": "오버클럭 구동 모터",
    "Gatling System": "개틀링 고속 연사",
    "Bullet Storm": "탄막 폭풍",
    "Apex Predator": "정점의 포식자",
    "Reinforced Plating": "보강 장갑판",
    "Blast Shield": "폭발 방호벽",
    "Armor Piercing": "장갑 관통 탄두",
    "Kinetic Compensator": "운동 에너지 상쇄기",
    "Autonomous AI": "자율 교전 AI 코어",
    "Napalm Fuel": "네이팜 연료 혼합물",
    "Sticky Residue": "점착성 잔류물",
    "Inferno Jet": "지옥불 분사 노즐",
    "Thermite Cloud": "테르밋 분무 구름",
    "Dragon's Breath": "용의 숨결",
    "High Pressure Tank": "고압 연료 탱크",
    "Wide Nozzle": "광각 확산 노즐",
    "Wall of Fire": "화염의 벽",
    "Searing Heat": "극열 화염",
    "Atmospheric Igniter": "대기 점화 장치",
    "Liquid Nitrogen": "액체 질소 분무",
    "Flash Freeze": "급속 동결",
    "Permafrost": "영구 동토",
    "Absolute Zero": "절대 영도",
    "Glacial Era": "빙하기 프로토콜",
    "Cryo Blast": "극저온 충격파",
    "Chilling Aura": "냉기 오라",
    "Deep Freeze": "심층 동결",
    "Superconductor": "초전도 코일",
    "High Voltage": "고전압 축전기",
    "Chain Lightning": "연쇄 번개",
    "Ball Lightning": "구상 번개",
    "Storm Generator": "폭풍 발생기",
    "Plasma Arc": "플라즈마 아크",
    "Heavy Shells": "대구경 유탄",
    "Cluster Bomb": "집속 폭탄",
    "Shrapnel Burst": "파편 폭풍",
    "Siege Mortar": "공성 박격포",
    "Nuclear Warhead": "전술 핵탄두",
    "Diamond Blade": "다이아몬드 톱날",
    "Serrated Edge": "톱니형 절단날",
    "Dual Saws": "이중 회전톱",
    "Hyper Velocity": "극초음속 가속기",
    "Magnetic Coil": "자기 유도 코일",
    "Gauss Cannon": "가우스 가속포",
    "Orbital Strike": "궤도 타격 위성 연계",
    "Swarm Drones": "군집 정찰 드론",
    "Attack Drones": "전투 타격 드론",
    "Drone Carrier": "드론 모함 격납고"
  };
  return map[enVal] || enVal;
}

function translateTurretUpgradeDesc(enVal) {
  let s = enVal;
  s = s.replace(/Damage \+(\d+)%/g, '피해량 +$1%');
  s = s.replace(/Damage \+(\d+)/g, '피해량 +$1');
  s = s.replace(/Fire Rate \+(\d+)%/g, '공격 속도 +$1%');
  s = s.replace(/Range \+(\d+)%/g, '사거리 +$1%');
  s = s.replace(/Pierce \+(\d+)/g, '관통 +$1');
  s = s.replace(/Slows enemies by (\d+)%/g, '적 이동 속도 $1% 감소');
  s = s.replace(/Deals (\d+) damage/g, '$1 피해를 입힙니다');
  s = s.replace(/Burn damage/g, '화상 피해');
  s = s.replace(/Increases/g, '증가');
  s = s.replace(/Reduces/g, '감소');
  return s;
}

function translateItemWeaponName(enVal) {
  return enVal;
}

function translateItemWeaponDesc(enVal) {
  let s = enVal;
  s = s.replace(/Increases max pulse by (\d+)/g, '최대 맥박이 $1 증가합니다');
  s = s.replace(/Increases movement speed by (\d+)%/g, '이동 속도가 $1% 증가합니다');
  s = s.replace(/Increases fire rate by (\d+)%/g, '공격 속도가 $1% 증가합니다');
  s = s.replace(/Increases damage by (\d+)%/g, '피해량이 $1% 증가합니다');
  s = s.replace(/Increases critical chance by (\d+)%/g, '치명타 확률이 $1% 증가합니다');
  return s;
}

function translateTutorial(k, enVal) {
  const map = {
    "tutorial.step1_title": "기본 조작 및 이동",
    "tutorial.step1_desc": "WASD 키를 사용하여 캐릭터를 이동하고 마우스로 조준하십시오.",
    "tutorial.step2_title": "고철 회수",
    "tutorial.step2_desc": "쓰러진 적들이 떨어뜨린 고철을 수집하십시오. 방어 시설을 짓는 데 사용됩니다.",
    "tutorial.step3_title": "첫 번째 터렛 배치",
    "tutorial.step3_desc": "[E] 키를 눌러 터렛 건설 메뉴를 열고 경로 주변에 터렛을 배치하십시오.",
    "tutorial.step4_title": "터렛 업그레이드",
    "tutorial.step4_desc": "배치된 터렛에 다가가 [E] 키를 눌러 강화 경로를 선택하십시오.",
    "tutorial.step5_title": "공세 시작",
    "tutorial.step5_desc": "[F] 키를 눌러 정비 시간을 종료하고 다음 웨이브를 호출하십시오."
  };
  return map[k] || enVal;
}

function translateGeneric(k, enVal, esVal) {
  if (k.endsWith('.title')) return enVal;
  if (k.endsWith('.desc')) return enVal;
  return enVal;
}

run().catch(console.error);
