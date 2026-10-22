// scripts/fix-placeholders.mjs
// Sincroniza al 100% los nombres de variables interpolables {param} en todos los idiomas.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LOCALES_DIR = path.join(ROOT, 'locales');

const FIXES = {
  en: {
    'hud.objective.default_surv': 'Find and purge the facility bosses',
    'hud.objective.tutorial_active': 'INTERACTIVE TUTORIAL IN PROGRESS',
    'ui.levelup.rerolls_remaining.one': '1 REMAINING',
    'hud.objective.next_wave_in': 'Next wave in: {seconds}s',
    'hud.objective.rebuilding_operator': 'REBUILDING OPERATOR: {seconds}S',
    'hud.objective.next_boss_in': 'NEXT BOSS: {min}:{sec}',
    'hud.event.completed_title': '{title}! +{scrap} SCRAP',
    'hud.event.started_title': 'SPECIAL EVENT STARTED! ({seconds}s)',
    'hud.event.survive_sub': 'SURVIVE THE ASSAULT AT {location}',
    'hud.event.secured_title': 'CONTAINMENT EVENT CLEARED! +{scrap} SCRAP',
    'hud.event.defend_prefix': 'Defend {article} {name}',
    'hud.event.survive_prefix': 'Survive the purge in {name}',
    'ui.shop.buy': 'BUY ({cost})',
    'ui.shop.level_tag': 'LV. {level}',
    'ui.levelup.slots': 'WEAPONS: {weapons}/{maxWeapons} | PASSIVES: {passives}/{maxPassives}',
    'ui.levelup.affected_weapons': 'AFFECTED WEAPONS ({count}):'
  },
  'pt-BR': {
    'hud.objective.default_surv': 'Encontre e expurgue os chefes da instalação',
    'hud.objective.tutorial_active': 'TUTORIAL INTERATIVO EM ANDAMENTO',
    'ui.levelup.rerolls_remaining.one': '1 RESTANTE',
    'hud.objective.next_wave_in': 'Próxima onda em: {seconds}s',
    'hud.objective.rebuilding_operator': 'RECONSTRUINDO OPERADOR: {seconds}S',
    'hud.objective.next_boss_in': 'PRÓX. CHEFE: {min}:{sec}',
    'hud.event.completed_title': '{title}! +{scrap} SUCATA',
    'hud.event.started_title': 'EVENTO ESPECIAL INICIADO! ({seconds}s)',
    'hud.event.survive_sub': 'SOBREVIVA AO ASSALTO EM {location}',
    'hud.event.secured_title': 'EVENTO DE CONTENÇÃO SUPERADO! +{scrap} SUCATA',
    'hud.event.defend_prefix': 'Defenda {article} {name}',
    'hud.event.survive_prefix': 'Sobreviva ao expurgo em {name}',
    'ui.shop.buy': 'COMPRAR ({cost})',
    'ui.shop.level_tag': 'NÍVEL {level}',
    'ui.levelup.slots': 'ARMAS: {weapons}/{maxWeapons} | PASSIVAS: {passives}/{maxPassives}',
    'ui.levelup.affected_weapons': 'ARMAS AFETADAS ({count}):'
  },
  fr: {
    'hud.objective.default_surv': "Trouvez et purgez les boss de l'installation",
    'hud.objective.tutorial_active': 'TUTORIEL INTERACTIF EN COURS',
    'ui.levelup.rerolls_remaining.one': '1 RESTANTE',
    'hud.objective.next_wave_in': 'Prochaine vague dans : {seconds} s',
    'hud.objective.rebuilding_operator': "RECONSTRUCTION DE L'OPÉRATEUR : {seconds} S",
    'hud.objective.next_boss_in': 'PROCHAIN BOSS : {min}:{sec}',
    'hud.event.completed_title': '{title} ! +{scrap} FERRAILLE',
    'hud.event.started_title': 'ÉVÉNEMENT SPÉCIAL DÉCLENCHÉ ! ({seconds} s)',
    'hud.event.survive_sub': "SURVIVEZ À L'ASSAUT À {location}",
    'hud.event.secured_title': 'ÉVÉNEMENT DE CONFINEMENT RÉUSSI ! +{scrap} FERRAILLE',
    'hud.event.defend_prefix': 'Défendez {article} {name}',
    'hud.event.survive_prefix': 'Survivez à la purge dans {name}',
    'ui.shop.buy': 'ACHETER ({cost})',
    'ui.shop.level_tag': 'NIV. {level}',
    'ui.levelup.slots': 'ARMES : {weapons}/{maxWeapons} | PASSIVES : {passives}/{maxPassives}',
    'ui.levelup.affected_weapons': 'ARMES AFFECTÉES ({count}) :'
  },
  ja: {
    'hud.objective.default_surv': '施設内のボスを発見して粛清せよ',
    'hud.objective.tutorial_active': 'チュートリアル進行中',
    'ui.levelup.rerolls_remaining.one': '残り 1 回',
    'hud.objective.next_wave_in': '次の襲来まで：{seconds}秒',
    'hud.objective.rebuilding_operator': 'オペレーター再構築中：{seconds}秒',
    'hud.objective.next_boss_in': '次のボス：{min}:{sec}',
    'hud.event.completed_title': '{title}！ +{scrap} スクラップ',
    'hud.event.started_title': '特別イベント発生！（{seconds}秒）',
    'hud.event.survive_sub': '{location}での強襲を生き延びろ',
    'hud.event.secured_title': '封じ込めイベント制覇！ +{scrap} スクラップ',
    'hud.event.defend_prefix': '{article}{name}を防衛せよ',
    'hud.event.survive_prefix': '{name}での粛清を生き延びろ',
    'ui.shop.buy': '購入 ({cost})',
    'ui.shop.level_tag': 'Lv. {level}',
    'ui.levelup.slots': '武器：{weapons}/{maxWeapons} | パッシブ：{passives}/{maxPassives}',
    'ui.levelup.affected_weapons': '対象武器（{count}）：'
  },
  'zh-Hans': {
    'hud.objective.default_surv': '搜寻并肃清设施首领',
    'hud.objective.tutorial_active': '互动教程进行中',
    'ui.levelup.rerolls_remaining.one': '剩余刷新：1次',
    'hud.objective.next_wave_in': '下一次攻势倒计时：{seconds}秒',
    'hud.objective.rebuilding_operator': '特勤干员重构中：{seconds}秒',
    'hud.objective.next_boss_in': '下一首领：{min}:{sec}',
    'hud.event.completed_title': '{title}！+{scrap} 废料',
    'hud.event.started_title': '特别事件已触发！（{seconds}秒）',
    'hud.event.survive_sub': '在{location}突袭中存活',
    'hud.event.secured_title': '收容事件完成！+{scrap} 废料',
    'hud.event.defend_prefix': '防守{article}{name}',
    'hud.event.survive_prefix': '在{name}的肃清中存活',
    'ui.shop.buy': '购买 ({cost})',
    'ui.shop.level_tag': '等级 {level}',
    'ui.levelup.slots': '武器：{weapons}/{maxWeapons} | 被动：{passives}/{maxPassives}',
    'ui.levelup.affected_weapons': '受影响武器（{count}）：'
  },
  'zh-Hant': {
    'hud.objective.default_surv': '搜尋並肅清設施首領',
    'hud.objective.tutorial_active': '互動教學進行中',
    'ui.levelup.rerolls_remaining.one': '剩餘重抽：1次',
    'hud.objective.next_wave_in': '下一次攻勢倒數：{seconds}秒',
    'hud.objective.rebuilding_operator': '特勤幹員重構中：{seconds}秒',
    'hud.objective.next_boss_in': '下一首領：{min}:{sec}',
    'hud.event.completed_title': '{title}！+{scrap} 廢料',
    'hud.event.started_title': '特別事件已觸發！（{seconds}秒）',
    'hud.event.survive_sub': '在{location}突襲中存活',
    'hud.event.secured_title': '收容事件完成！+{scrap} 廢料',
    'hud.event.defend_prefix': '防守{article}{name}',
    'hud.event.survive_prefix': '在{name}的肅清中存活',
    'ui.shop.buy': '購買 ({cost})',
    'ui.shop.level_tag': '等級 {level}',
    'ui.levelup.slots': '武器：{weapons}/{maxWeapons} | 被動：{passives}/{maxPassives}',
    'ui.levelup.affected_weapons': '受影響武器（{count}）：'
  },
  ko: {
    'hud.objective.default_surv': '시설의 보스를 찾아 숙청하십시오',
    'hud.objective.tutorial_active': '인터랙티브 튜토리얼 진행 중',
    'ui.levelup.rerolls_remaining.one': '새로고침 남음: 1회',
    'hud.objective.next_wave_in': '다음 웨이브까지: {seconds}초',
    'hud.objective.rebuilding_operator': '대원 재구축 중: {seconds}초',
    'hud.objective.next_boss_in': '다음 보스: {min}:{sec}',
    'hud.event.completed_title': '{title}! +{scrap} 고철',
    'hud.event.started_title': '특별 이벤트 개시! ({seconds}초)',
    'hud.event.survive_sub': '{location}의 습격에서 생존하십시오',
    'hud.event.secured_title': '격리 이벤트 완료! +{scrap} 고철',
    'hud.event.defend_prefix': '{article} {name}을(를) 방어하십시오',
    'hud.event.survive_prefix': '{name}의 숙청에서 생존하십시오',
    'ui.shop.buy': '구매 ({cost})',
    'ui.shop.level_tag': '레벨 {level}',
    'ui.levelup.slots': '무기: {weapons}/{maxWeapons} | 패시브: {passives}/{maxPassives}',
    'ui.levelup.affected_weapons': '영향 받는 무기 ({count}):'
  },
  ru: {
    'hud.objective.default_surv': 'Найдите и зачистите боссов комплекса',
    'hud.objective.tutorial_active': 'ИНТЕРАКТИВНОЕ ОБУЧЕНИЕ В ПРОЦЕССЕ',
    'ui.levelup.rerolls_remaining.one': 'ОСТАЛСЯ 1 СБРОС',
    'hud.objective.next_wave_in': 'Следующая волна через: {seconds} с',
    'hud.objective.rebuilding_operator': 'ВОССТАНОВЛЕНИЕ ОПЕРАТОРА: {seconds} С',
    'hud.objective.next_boss_in': 'СЛЕД. БОСС: {min}:{sec}',
    'hud.event.completed_title': '{title}! +{scrap} ЛОМА',
    'hud.event.started_title': 'СПЕЦИАЛЬНОЕ СОБЫТИЕ НАЧАЛОСЬ! ({seconds} с)',
    'hud.event.survive_sub': 'ПЕРЕЖИВИТЕ ШТУРМ: {location}',
    'hud.event.secured_title': 'СОБЫТИЕ СДЕРЖИВАНИЯ ЗАВЕРШЕНО! +{scrap} ЛОМА',
    'hud.event.defend_prefix': 'Защитите {article} {name}',
    'hud.event.survive_prefix': 'Переживите зачистку в: {name}',
    'ui.shop.buy': 'КУПИТЬ ({cost})',
    'ui.shop.level_tag': 'УР. {level}',
    'ui.levelup.slots': 'ОРУЖИЕ: {weapons}/{maxWeapons} | ПАССИВКИ: {passives}/{maxPassives}',
    'ui.levelup.affected_weapons': 'ЗАТРОНУТОЕ ОРУЖИЕ ({count}):'
  }
};

for (const [langCode, fixMap] of Object.entries(FIXES)) {
  const filePath = path.join(LOCALES_DIR, `${langCode}.js`);
  let content = fs.readFileSync(filePath, 'utf8');

  for (const [key, replacementVal] of Object.entries(fixMap)) {
    const re = new RegExp(`("${key.replace(/\./g, '\\.')}"\\s*:\\s*)"(?:[^"\\\\]|\\\\.)*"`);
    if (re.test(content)) {
      content = content.replace(re, `$1${JSON.stringify(replacementVal)}`);
    } else {
      console.warn(`No se encontró clave ${key} en ${langCode}`);
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✓ Actualizado ${langCode}.js con placeholders unificados.`);
}
