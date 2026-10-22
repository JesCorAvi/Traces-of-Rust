const fs = require('fs');
const es = require('../../temp-es-dict.json');

const ru = {};

function set(k, v) {
  if (k in es) {
    ru[k] = v;
  }
}

import('../../locales/en.js').then(enMod => {
  const en = enMod.default;

  // Modes
  set("mode.core_defense.title", "TOWER DEFENSE");
  set("mode.core_defense.subtitle", "ЗАЩИТА ЯДРА");
  set("mode.core_defense.badge", "★ ОСНОВНАЯ КАМПАНИЯ // 12 ВОЛН");
  set("mode.core_defense.shortTitle", "TOWER DEFENSE");
  set("mode.core_defense.tagline", "Стройте турели на заводских путях, переживите 12 смертоносных волн и защитите биомеханический реактор.");
  set("mode.core_defense.objectiveTitle", "ПРОТОКОЛ ОБОРОНЫ");
  set("mode.core_defense.objectiveDefault", "Не дайте сущностям прорваться к шлюзу Ядра");
  set("mode.survival.title", "ВЫЖИВАНИЕ");
  set("mode.survival.subtitle", "ЗАЧИСТКА ОРДЫ");
  set("mode.survival.badge", "ДОПОЛНИТЕЛЬНЫЙ РЕЖИМ // АРКАДА");
  set("mode.survival.shortTitle", "ВЫЖИВАНИЕ");
  set("mode.survival.tagline", "Динамичный режим: прямой бой без турелей, сбор сыворотки и уничтожение 5 боссов комплекса.");
  set("mode.survival.objectiveTitle", "ЗАДАЧА СЕКТОРА");
  set("mode.survival.objectiveDefault", "Найдите и уничтожьте боссов комплекса");

  // Diff
  set("diff.facil", "ЛЕГКО");
  set("diff.normal", "НОРМАЛЬНО");
  set("diff.dificil", "СЛОЖНО");

  // Bosses & Enemies
  set("boss.boss_butcher.name", "АМПУТАТОР ЦЕХА");
  set("boss.boss_siren.name", "ПРОВОЛОЧНАЯ МАТЬ");
  set("boss.boss_furnace.name", "КРЕМАТОРНЫЙ АВТОМАТ № 09");
  set("boss.boss_apostle.name", "АПОСТОЛ ШЕСТЕРНИ");
  set("boss.boss_warden.name", "СМОТРИТЕЛЬ СЕКТОРА");

  set("enemy.runner.name", "ПУТЕВОЙ БЕГУН");
  set("enemy.hulk.name", "МЯСНОЙ ПРЕСС");
  set("enemy.nest.name", "ХОДЯЧЕЕ ГНЕЗДО");
  set("enemy.regenerator.name", "ЧУМНОЙ СШИВАТЕЛЬ");
  set("enemy.splitter.name", "АБЕРРАНТНЫЙ ДЕЛИК");

  // Rewards
  set("reward.heal_pack.name", "Экстренное переливание");
  set("reward.heal_pack.desc", "Мгновенно восстанавливает +75 Пульса.");
  set("reward.teeth_bag.name", "Мешок вырванных зубов");
  set("reward.teeth_bag.desc", "Дает +15 дополнительных Зубов для Стола хирурга.");

  // Shop
  set("shop.dmg.name", "Очищенный порох");
  set("shop.dmg.desc", "+3% постоянного базового урона за уровень");
  set("shop.hp.name", "Хирургические швы");
  set("shop.hp.desc", "+5 постоянного максимального Пульса за уровень");
  set("shop.spd.name", "Микродоза эфедрина");
  set("shop.spd.desc", "+2% постоянной скорости передвижения за уровень");
  set("shop.atkSpd.name", "Оружейная смазка");
  set("shop.atkSpd.desc", "+2,5% постоянной скорострельности за уровень");
  set("shop.mag.name", "Экстракционные щипцы");
  set("shop.mag.desc", "+0,35м радиуса магнита за уровень");
  set("shop.reroll.name", "Подкуп крупье");
  set("shop.reroll.desc", "+1 использование кнопки обновления (Макс +3)");

  // Characters
  set("char.otto.title", "Д-р В. Рихтер");
  set("char.otto.role", "Тактический хирург");
  set("char.otto.desc", "Бывший военный врач, одержимый протезированием. Мастер контроля толпы и сбора биометрии.");
  set("char.otto.passive", "Протокол препарирования");
  set("char.otto.passiveDesc", "+25% к шансу выпадения зубов и душ с элитных врагов. Начинает с 1 дополнительным обновлением.");
  set("char.otto.weaponTitle", "Дисковая пила");

  set("char.mack.title", "Мэк \"Молот\"");
  set("char.mack.role", "Тяжелый подрывник");
  set("char.mack.desc", "Ветеран цеха с усиленным кибер-шасси. Сокрушителен вблизи, неповоротлив на дистанции.");
  set("char.mack.passive", "Баллистическая инерция");
  set("char.mack.passiveDesc", "+30% к базовой площади всего оружия. Отбрасывание тяжелыми снарядами увеличено на 50%.");
  set("char.mack.weaponTitle", "Дробовик 12-го калибра");

  set("char.pepe.title", "Пепе \"Искра\"");
  set("char.pepe.role", "Дуговой сварщик");
  set("char.pepe.desc", "Подпольный электрик, привыкший к высоковольтным разрядам и экстремальному жару.");
  set("char.pepe.passive", "Дуга перегрузки");
  set("char.pepe.passiveDesc", "Атаки с шансом 20% пускают молнию в 2 соседних врагов, нанося 40% урона.");
  set("char.pepe.weaponTitle", "Термическая горелка");

  set("char.morbo.title", "Морбо");
  set("char.morbo.role", "Чумной вектор");
  set("char.morbo.desc", "Выживший объект хим-экспериментов. Источает едкий токсичный туман вокруг себя.");
  set("char.morbo.passive", "Едкое выделение");
  set("char.morbo.passiveDesc", "Враги в ауре замедляются на 15% и теряют 2% макс. здоровья в секунду.");
  set("char.morbo.weaponTitle", "Желчное кадило");

  set("char.bob.title", "Боб \"Масленка\"");
  set("char.bob.role", "Боевой машинист");
  set("char.bob.desc", "Специалист по механическим ловушкам, нажимным датчикам и осколочным зарядам.");
  set("char.bob.passive", "Минная сеть");
  set("char.bob.passiveDesc", "Каждые 12с автоматически сбрасывает мину, взрывающуюся на 80 урона.");
  set("char.bob.weaponTitle", "Осколочные мины");

  set("char.krauss.title", "Краусс");
  set("char.krauss.role", "Палач сектора");
  set("char.krauss.desc", "Хладнокровный стрелок, вооруженный мощным пневматическим гарпуном.");
  set("char.krauss.passive", "Пневмо-натяжение");
  set("char.krauss.passiveDesc", "Пронзающие снаряды получают +15% урона за каждого пробитого врага.");
  set("char.krauss.weaponTitle", "Пневматический гарпун");

  set("char.axel.title", "Аксель");
  set("char.axel.role", "Бегун с клеткой");
  set("char.axel.desc", "Берсерк, окруженный вращающимися крючьями и железными клетками, разрывающими орду.");
  set("char.axel.passive", "Кинетическая центрифуга");
  set("char.axel.passiveDesc", "Скорость вращения клеток возрастает до +40% при непрерывном беге.");
  set("char.axel.weaponTitle", "Клетка мясника");

  set("char.tesla.title", "Никола");
  set("char.tesla.role", "Пионер статики");
  set("char.tesla.desc", "Одержим высоковольтными цепями. Превращает металлолом в проводники электричества.");
  set("char.tesla.passive", "Статический резонанс");
  set("char.tesla.passiveDesc", "Убийство шокированных врагов вызывает ЭМИ-вспышку, оглушающую цели в радиусе 3м на 0,8с.");
  set("char.tesla.weaponTitle", "Разбитый дефибриллятор");

  // Weapons
  set("weapon.slash.name", "Ампутационная пила");
  set("weapon.slash.desc", "Зубчатая дуговая пила с кровавым следом, 3D-вспышкой и отбрасыванием. (Не зависит от +Снарядов).");
  set("weapon.shotgun.name", "Дробовик 12-го калибра");
  set("weapon.shotgun.desc", "Конусный веер свинцовой картечи со вспышкой и выбросом гильзы.");
  set("weapon.flamethrower.name", "Огнеметный резак");
  set("weapon.flamethrower.desc", "Непрерывный конус огня, освещающий коридоры и поджигающий врагов. (Не зависит от +Снарядов).");
  set("weapon.aura.name", "Желчное кадило");
  set("weapon.aura.desc", "Едкое поле вокруг оператора, наносящее урон и замедляющее толпу. (Не зависит от +Снарядов).");
  set("weapon.mines.name", "Осколочные мины");
  set("weapon.mines.desc", "Сбрасывает мины с красным датчиком, взрывающиеся при наступлении врага.");
  set("weapon.harpoon.name", "Пневматический гарпун");
  set("weapon.harpoon.desc", "Тяжелый снаряд, пробивающий нескольких врагов по прямой линии.");
  set("weapon.orbital.name", "Клетка мясника");
  set("weapon.orbital.desc", "Вращающиеся железные клетки с черепами и крючьями, разрывающие строй врага.");
  set("weapon.bolt.name", "Разбитый дефибриллятор");
  set("weapon.bolt.desc", "Высоковольтный электроразряд, прыгающий по цепочке тел. (Не зависит от +Снарядов).");
  set("weapon.chakram.name", "Бумеранг из металлолома");
  set("weapon.chakram.desc", "Диск от циркулярной пилы, летящий вперед с пробитием и возвращающийся обратно с двойным уроном.");
  set("weapon.welder.name", "Дуговой сварочник");
  set("weapon.welder.desc", "Заряжается 2,4с и выпускает концентрированный луч на 1,6с в скопление врагов. (Не зависит от +Снарядов).");
  set("weapon.grenade.name", "Гранатомет паломника");
  set("weapon.grenade.desc", "Баллистическая граната, взрывающаяся по площади и распадающаяся на кассеты.");
  set("weapon.hammer.name", "Поршневой молот");
  set("weapon.hammer.desc", "Ударная волна сжатого воздуха с мощным отбрасыванием и оглушением. (Не зависит от +Снарядов).");
  set("weapon.acid.name", "Склянка с кислотой");
  set("weapon.acid.desc", "Склянка разбивается в едкое облако, разъедающее броню и замедляющее врагов.");

  set("weapon.short.slash", "Пила");
  set("weapon.short.shotgun", "Дробовик");
  set("weapon.short.flamethrower", "Резак");
  set("weapon.short.aura", "Кадило");
  set("weapon.short.mines", "Мины");
  set("weapon.short.harpoon", "Гарпун");
  set("weapon.short.orbital", "Клетка");
  set("weapon.short.bolt", "Дефибрил.");
  set("weapon.short.chakram", "Бумеранг");
  set("weapon.short.welder", "Сварка");
  set("weapon.short.grenade", "Гранаты");
  set("weapon.short.hammer", "Молот");
  set("weapon.short.acid", "Кислота");

  // Passives
  set("passive.multishot.name", "Модифицированный патронник");
  set("passive.multishot.desc", "Добавляет +1 снаряд для оружия с поддержкой мульти-выстрела.");
  set("passive.dmg.name", "Прессованный порох");
  set("passive.dmg.desc", "Увеличивает урон всего оружия на +15% за уровень.");
  set("passive.atkSpd.name", "Ржавый сервопривод");
  set("passive.atkSpd.desc", "Повышает скорострельность и скорость поворота на +10% за уровень.");
  set("passive.maxHp.name", "Хирургические пластины");
  set("passive.maxHp.desc", "Увеличивает максимальный Пульс на +25 и мгновенно восполняет здоровье.");
  set("passive.regen.name", "Внутривенная капельница");
  set("passive.regen.desc", "Восстанавливает +0,9 Пульса в секунду непрерывно.");
  set("passive.moveSpd.name", "Технический эфедрин");
  set("passive.moveSpd.desc", "Увеличивает скорость передвижения на +8% за уровень.");
  set("passive.area.name", "Широкий осколок");
  set("passive.area.desc", "Увеличивает радиус и зону атак на +12% за уровень.");
  set("passive.crit.name", "Линза мясника");
  set("passive.crit.desc", "Дает +7% шанс нанести удвоенный критический урон (x2).");
  set("passive.magnet.name", "Крановый магнит");
  set("passive.magnet.desc", "Увеличивает радиус притягивания сыворотки и зубов.");

  set("passive.format.multishot", "+{lvl} СНАР.");
  set("passive.format.dmg", "+{pct}% УРОН");
  set("passive.format.atkSpd", "+{pct}% СКОР.");
  set("passive.format.maxHp", "+{hp} ПУЛЬС");
  set("passive.format.regen", "+{val} ХП/С");
  set("passive.format.moveSpd", "+{pct}% БЕГ");
  set("passive.format.area", "+{pct}% ЗОНА");
  set("passive.format.crit", "+{pct}% КРИТ");
  set("passive.format.magnet", "+{val}М МАГНИТ");

  // Maps
  set("map.easy_plaza.name", "Центральная площадь");
  set("map.easy_plaza.badge", "ЛЕГКО // ПЕТЛЯ 360°");
  set("map.easy_plaza.desc", "Круглая арена с отличным обзором. Враги обходят периметр, прежде чем свернуть к ядру.");

  set("map.easy_spiral.name", "Спиральный спуск");
  set("map.easy_spiral.badge", "ЛЕГКО // НЕПРЕРЫВНАЯ СПИРАЛЬ");
  set("map.easy_spiral.desc", "Одиночная спиральная трасса с высокой плотностью турелей. Идеальна для дальнобойного оружия и заморозки.");

  set("map.easy_serpentine.name", "Извилистая траншея");
  set("map.easy_serpentine.badge", "ЛЕГКО // S-ОБРАЗНЫЕ ПОВОРОТЫ");
  set("map.easy_serpentine.desc", "Траншея с 5 резкими шпильками. Великолепна для сплеш-урона и огнеметов.");

  set("map.easy_ramps.name", "Погрузочные эстакады");
  set("map.easy_ramps.badge", "ЛЕГКО // ВЫСОКИЕ РАМПЫ");
  set("map.easy_ramps.desc", "Две наклонные эстакады, сходящиеся на укрепленном центральном мосту.");

  set("map.easy_cooling.name", "Охлаждающий контур");
  set("map.easy_cooling.badge", "ЛЕГКО // ДВОЙНОЕ КОЛЬЦО");
  set("map.easy_cooling.desc", "Концентрические каналы охлаждения. Враги огибают внешнее кольцо перед прорывом к реактору.");

  set("map.easy_horseshoe.name", "Стальная подкова");
  set("map.easy_horseshoe.badge", "ЛЕГКО // U-ОБРАЗНОЕ ГОРЛЫШКО");
  set("map.easy_horseshoe.desc", "Широкая подкова с приподнятыми внутренними позициями для перекрестного огня.");

  set("map.norm_twins.name", "Коридоры-близнецы");
  set("map.norm_twins.badge", "НОРМАЛЬНО // ПАРАЛЛЕЛЬНЫЙ ВХОД");
  set("map.norm_twins.desc", "Два параллельных коридора, требующих одновременного распределения обороны на обоих флангах.");

  set("map.norm_pincer.name", "Гидравлические клещи");
  set("map.norm_pincer.badge", "НОРМАЛЬНО // АТАКА В КЛЕЩИ");
  set("map.norm_pincer.desc", "Два противоположных прорыва, сходящихся под 90° к центральному ядру.");

  set("map.norm_cross.name", "Заводской перекресток");
  set("map.norm_cross.badge", "НОРМАЛЬНО // КРЕСТООБРАЗНЫЙ ПРОРЫВ");
  set("map.norm_cross.desc", "Четырехсторонний перекресток. Враги нападают поочередными волнами с четырех сторон света.");

  set("map.norm_funnel.name", "Шлаковая воронка");
  set("map.norm_funnel.badge", "НОРМАЛЬНО // СУЖАЮЩИЙСЯ КОРИДОР");
  set("map.norm_funnel.desc", "Три широких входа, резко сходящихся в узкий укрепленный тоннель.");

  set("map.norm_braid.name", "Плетеный путепровод");
  set("map.norm_braid.badge", "НОРМАЛЬНО // ПЕРЕСЕКАЮЩИЕСЯ ПУТИ");
  set("map.norm_braid.desc", "Два переплетенных моста, проходящих друг над другом. Требуется гибкая расстановка турелей.");

  set("map.norm_pit.name", "Литейная яма");
  set("map.norm_pit.badge", "НОРМАЛЬНО // ВУЛКАНИЧЕСКИЙ КРАТЕР");
  set("map.norm_pit.desc", "Круговая эстакада, спускающаяся к кипящему тиглю, где заякорено ядро.");

  set("map.hard_isolated.name", "Изолированный сектор 9");
  set("map.hard_isolated.badge", "СЛОЖНО // ДВА РАЗДЕЛЬНЫХ ЯДРА");
  set("map.hard_isolated.desc", "Два раздельных ядра, требующих двух независимых укрепрайонов без перекрытия радиусов.");

  set("map.hard_diagonal.name", "Диагональный прорыв");
  set("map.hard_diagonal.badge", "СЛОЖНО // СВЕРХБЫСТРЫЙ СПРИНТ");
  set("map.hard_diagonal.desc", "Прямая короткая диагональ. Враги добегают до ядра менее чем за 20 секунд без замедления.");

  set("map.hard_express.name", "Скоростная ветка");
  set("map.hard_express.badge", "СЛОЖНО // СКОРОСТНОЙ ПОЕЗД");
  set("map.hard_express.desc", "Железнодорожная магистраль со сверхбыстрыми мутантами. Замедление строго обязательно.");

  set("map.hard_split_level.name", "Вертикальная развилка");
  set("map.hard_split_level.badge", "СЛОЖНО // МНОГОЯРУСНЫЙ ЦЕХ");
  set("map.hard_split_level.desc", "Многоярусный завод, где враги спрыгивают из вентиляционных шахт прямо на защитные платформы.");

  set("map.hard_blind_alleys.name", "Лабиринт тупиков");
  set("map.hard_blind_alleys.badge", "СЛОЖНО // СЛЕПЫЕ УГЛЫ");
  set("map.hard_blind_alleys.desc", "Лабиринт из стальных переборок, перекрывающий линию огня дальнобойным орудиям.");

  set("map.hard_dual_breach.name", "Двойной прорыв Омега");
  set("map.hard_dual_breach.badge", "СЛОЖНО // ОДНОВРЕМЕННЫЙ ШТУРМ");
  set("map.hard_dual_breach.desc", "Финальный сектор. Гигантские орды атакуют с двух сторон синхронно с элитными боссами.");

  // Stats
  set("turret.stat.damage", "УРОН");
  set("turret.stat.fireRate", "СКОР");
  set("turret.stat.range", "ДАЛЬН");
  set("turret.stat.aoe", "ЗОНА");
  set("turret.stat.slow", "ЗАМЕДЛ");
  set("turret.stat.radius", "РАДИУС");
  set("turret.stat.allies", "СОЮЗН");
  set("turret.stat.every", "КАЖДЫЕ");
  set("turret.stat.buffDamage", "БАФФ");
  set("turret.stat.chain", "ЦЕПЬ");
  set("turret.stat.burn", "ГОЕНИЕ");
  set("turret.stat.singleTarget", "ОДНА ЦЕЛЬ");
  set("turret.stat.scrapPerWave", "ЛОМ");
  set("turret.stat.push", "СИЛА");
  set("turret.stat.stun", "ОГЛУШ");

  // Tutorials
  set("tutorial.step.intro.title", "ПРОТОКОЛ ТАКТИЧЕСКОГО ОБУЧЕНИЯ");
  set("tutorial.step.intro.text", "Ваша задача: защитить ЯДРО в течение 12 волн. Враги идут по трем путям. Собирайте МЕТАЛЛОЛОМ с поверженных врагов, стройте турели и прокачивайте ветки для выживания. Нажмите [ПРОБЕЛ], чтобы начать.");
  set("tutorial.step.intro.hint", "Нажмите [ПРОБЕЛ] или щелкните здесь для продолжения.");

  set("tutorial.step.build.title", "ШАГ 1 · СТРОИТЕЛЬСТВО");
  set("tutorial.step.build.text", "Нажмите [E], чтобы открыть терминал турелей, и выберите ГВОЗДОМЕТ. Затем наведите камеру на пол: зеленое кольцо указывает доступную позицию, красное — заблокированную. Разместите щелчком ЛКМ или клавишей [E].");
  set("tutorial.step.build.hint", "Зеленое кольцо у Ядра · [E] открывает терминал");

  set("tutorial.step.upgrade.title", "ШАГ 2 · УЛУЧШЕНИЕ");
  set("tutorial.step.upgrade.text", "Подойдите к турели и нажмите [E]. У нее есть 3 ветки прокачки по 4 уровня. Прокачайте СКОРОСТРЕЛЬНОСТЬ до 2-го уровня, чтобы открыть СПАРЕННЫЙ СТВОЛ. Только одна ветка может быть выше 2-го уровня: выбирайте специализацию с умом.");
  set("tutorial.step.upgrade.hint", "Подойдите к турели и нажмите [E]");

  set("tutorial.step.synergy.title", "ШАГ 3 · СИНЕРГИЯ");
  set("tutorial.step.synergy.text", "Совмещайте роли. МОРОЗ замедляет и сбивает врагов в плотные группы, а БОМБАРДА наносит колоссальный урон по площади. Постройте обе турели рядом с тропой. Голубое и оранжевое кольца — подсказки: ставьте там, где считаете нужным.");
  set("tutorial.step.synergy.hint", "Постройте МОРОЗ + БОМБАРДУ");

  set("tutorial.step.practice.title", "ШАГ 4 · БОЕВАЯ ПРОВЕРКА");
  set("tutorial.step.practice.text", "Приближается авангард врагов. Посмотрите, как Мороз сдерживает толпу, пока Бомбарда разносит ее снарядами. Из убитых мутантов вылетает МЕТАЛЛОЛОМ, летящий прямо к вам.");
  set("tutorial.step.practice.hint", "Защитите ядро");

  set("tutorial.step.done.title", "ОБУЧЕНИЕ ЗАВЕРШЕНО");
  set("tutorial.step.done.text", "Продвинутые связки: МОРОЗ (Раскол) + урон по площади/огонь (+40%); КАЗАРМА (Джаггернаут) + ЦЕХ (Щит/Ремонт); ЦЕХ (Разгон) + ГВОЗДОМЕТ (Шквал). Продажа турели возвращает 50% затрат. Нажмите [ПРОБЕЛ], чтобы начать настоящий бой.");
  set("tutorial.step.done.hint", "[ПРОБЕЛ] НАЧАТЬ ШТУРМ");

  // HUD & Wave
  set("hud.objective.title", "ТЕКУЩАЯ ЗАДАЧА:");
  set("hud.objective.default_td", "Удерживайте прорыв ({diff})");
  set("hud.objective.default_surv", "Выживайте в орде: {time}");
  set("hud.objective.purge_boss", "УНИЧТОЖЬТЕ {name}");
  set("hud.objective.hostiles_left", "Осталось врагов: {count}");
  set("hud.objective.next_wave_in", "Следующая волна через {time}");
  set("hud.objective.first_wave_prep", "Подготовьте оборону // Нажмите [F] для старта");
  set("hud.objective.rebuilding_operator", "ПЕРЕСБОРКА ОПЕРАТОРА... ДЕРЖИТЕ СТРОЙ");
  set("hud.objective.tutorial_active", "ОБУЧЕНИЕ // {step}");
  set("hud.objective.next_boss_in", "След. босс: {time}");
  set("hud.objective.endgame_active", "АКТИВНАЯ ЗАЧИСТКА: ДОБЕЙТЕ ОСТАВШИХСЯ ВРАГОВ");

  set("hud.wave.prep", "ПОДГОТОВКА");
  set("hud.wave.in_progress", "ВОЛНА {current}/{total}");
  set("hud.wave.event_badge", "СОБЫТИЕ // {title}");
  set("hud.wave.surv_endgame", "ЗАЧИСТКА АКТИВНА");
  set("hud.wave.surv_horde", "ОРДА АКТИВНА");
  set("hud.wave.skip_prompt", "НАЖМИТЕ [F] ДЛЯ СТАРТА");
  set("hud.wave.announcement_boss", "ВОЛНА {wave} // ПРИБЛИЖАЕТСЯ БОСС: {boss}");
  set("hud.wave.announcement_progress", "ВОЛНА {wave} / {total} В ПРОЦЕССЕ");
  set("hud.wave.announcement_completed", "ВОЛНА {wave} ЗАВЕРШЕНА");
  set("hud.wave.start_wave", "НАЧАТЬ ВОЛНУ");
  set("hud.wave.skip_pause", "ПРОПУСТИТЬ ПАУЗУ");

  set("hud.turret.interact_prompt", "НАЖМИТЕ [E] ДЛЯ УЛУЧШЕНИЯ / ПРОДАЖИ");
  set("hud.turret.place_valid", "УСТАНОВИТЬ {name} · {cost} ЛОМА · [ESC] ОТМЕНА");
  set("hud.turret.place_invalid", "{reason} · [ESC] ОТМЕНА");
  set("hud.turret.upgrade_sell", "УЛУЧШИТЬ / ПРОДАТЬ · {name}");
  set("hud.turret.build_turret", "ПОСТРОИТЬ ТУРЕЛЬ");

  set("hud.slot.level_short", "УР.{lvl}");
  set("hud.slot.weapon_empty", "Доступен слот оружия");
  set("hud.slot.passive_empty", "Доступен слот импланта");
  set("hud.slot.weapon_title", "{name} (Уровень +{lvl}) — {desc}");
  set("hud.slot.passive_title", "{name} (Уровень +{lvl}): {stat} — {desc}");

  set("hud.player_down.title", "[ ОПЕРАТОР ВЫВЕДЕН ИЗ СТРОЯ // ПЕРЕГРУЗКА ЯДРА -{penalty} ЖИЗНЕЙ ]");
  set("hud.player_down.countdown", "ПЕРЕСБОРКА ЧЕРЕЗ {seconds}с...");
  set("hud.player_down.announcement", "ОПЕРАТОР ПОВЕРЖЕН // ПЕРЕГРУЗКА ЯДРА (-{penalty} ЖИЗНЕЙ)");

  set("hud.core.under_attack", "¡ЯДРО ПОД АТАКОЙ! // {state}");
  // Russian plurals for leaks
  set("hud.core.leak_detected.one", "¡ПРОРЫВ К ЯДРУ! -1 ЖИЗНЬ");
  set("hud.core.leak_detected.few", "¡ПРОРЫВ К ЯДРУ! -{count} ЖИЗНИ");
  set("hud.core.leak_detected.many", "¡ПРОРЫВ К ЯДРУ! -{count} ЖИЗНЕЙ");
  set("hud.core.leak_detected.other", "¡ПРОРЫВ К ЯДРУ! -{count} ЖИЗНЕЙ");

  set("hud.core.state_stable", "СТАБИЛЬНО");
  set("hud.core.state_alert", "ТРЕВОГА");
  set("hud.core.state_critical", "КРИТИЧЕСКИ");
  set("hud.core.integrity", "{hp}/{max} ЦЕЛОСТНОСТЬ");
  set("hud.core.hostiles_counter", "ВРАГИ: {count}");
  set("hud.core.state_free_exploration", "СВОБОДНЫЙ ОБХОД");
  set("hud.core.state_pause", "ПАУЗА: {seconds}С");

  set("hud.boss.alert", "ТРЕВОГА: {name} В ЦЕХУ");
  set("hud.boss.phase1", "ФАЗА I");
  set("hud.boss.phase2", "ФАЗА II // ЯРОСТЬ");

  set("hud.teammate_down.tag", "¡НАПАРНИК ПОВЕРЖЕН!");
  set("hud.teammate_down.title", "¡НАПАРНИК ПОВЕРЖЕН! -10 ЖИЗНЕЙ ЯДРУ");
  set("hud.teammate_down.sub", "УРОН ПО ЯДРУ // ПРИКРОЙТЕ ЕГО ПОЗИЦИЮ");

  set("hud.kinetic.sector_alert", "ТРЕВОГА В СЕКТОРЕ");
  set("hud.kinetic.event_started", "СОБЫТИЕ НАЧАЛОСЬ");

  set("hud.event.emergency_detected", "ОБНАРУЖЕНА АВАРИЯ");
  set("hud.event.completed_title", "СЕКТОР ОБЕЗВРЕЖЕН");
  set("hud.event.leak_banner_tag", "УТЕЧКА ИЗ ЯДРА");
  set("hud.event.sector_alert_tag", "ТРЕВОГА СЕКТОРА");
  set("hud.event.started_title", "СОБЫТИЕ АКТИВИРОВАНО");
  set("hud.event.survive_sub", "ПРОДЕРЖИТЕСЬ 75 СЕКУНД В ПЕРИМЕТРЕ");
  set("hud.event.climax_tag", "КУЛЬМИНАЦИЯ");
  set("hud.event.phase3_title", "ПРОРЫВ ИЗОЛЯЦИИ");
  set("hud.event.phase3_sub", "КРИТИЧЕСКИЕ МУТАНТЫ НА ПОДХОДЕ");
  set("hud.event.secured_tag", "СЕКТОР В БЕЗОПАСНОСТИ");
  set("hud.event.secured_title", "КОНТРОЛЬ ВОССТАНОВЛЕН");
  set("hud.event.secured_sub", "ШТРАФ ЯДРА ПРЕДОТВРАЩЕН");
  set("hud.event.swarm_growing", "ПЛОТНОСТЬ РОЯ ВОЗРАСТАЕТ");
  set("hud.event.defend_prefix", "ЗАЩИТИТЕ ");
  set("hud.event.survive_prefix", "ПРОДЕРЖИТЕСЬ ");
  set("hud.event.loc_substation_east", "ВОСТОЧНАЯ ПОДСТАНЦИЯ");
  set("hud.event.loc_generator_west", "ЗАПАДНЫЙ ГЕНЕРАТОР");
  set("hud.event.loc_console_north", "СЕВЕРНЫЙ ПУЛЬТ ЛОГИСТИКИ");
  set("hud.event.loc_relay_south", "ЮЖНЫЙ РЕТРАНСЛЯТОР");
  set("hud.event.loc_containment_zone", "ЗОНА ИЗОЛЯЦИИ АЛЬФА");
  set("hud.event.title_substation_defended", "ПОДСТАНЦИЯ УДЕРЖАНА");
  set("hud.event.title_sector_purged", "СЕКТОР ЗАЧИЩЕН");
  set("hud.event.phase_format", "ФАЗА {phase}: {title}");
  set("hud.event.inside_perimeter", "● ВНУТРИ ПЕРИМЕТРА (РАДИУС 15М)");
  set("hud.event.outside_perimeter", "▲ ВНЕ ПЕРИМЕТРА ({dist}м ДО ЗОНЫ) - ВЕРНИТЕСЬ!");

  // Fill in other keys
  for (const k of Object.keys(es)) {
    if (!ru[k]) {
      if (k.startsWith('turret.')) {
        ru[k] = translateTurretKeyRu(k, es[k], en[k]);
      } else if (k.startsWith('ui.')) {
        ru[k] = translateUiKeyRu(k, es[k], en[k]);
      } else {
        ru[k] = en[k] || es[k];
      }
    }
  }

  // Write locales/ru.js
  const outLines = ['// Russian localization dictionary for Traces of Rust.', 'export default {'];
  const keys = Object.keys(es);
  keys.forEach((k, idx) => {
    const isLast = idx === keys.length - 1;
    outLines.push(`  ${JSON.stringify(k)}: ${JSON.stringify(ru[k] || es[k])}${isLast ? '' : ','}`);
  });
  outLines.push('};');
  outLines.push('');

  fs.writeFileSync('locales/ru.js', outLines.join('\n'), 'utf8');
  console.log(`Generated locales/ru.js with ${keys.length} keys!`);
});

function translateTurretKeyRu(k, esVal, enVal) {
  if (k.endsWith('.role')) {
    if (esVal === 'DAÑO DIRECTO') return 'ПРЯМОЙ УРОН';
    if (esVal === 'ÁREA') return 'УРОН ПО ПЛОЩАДИ';
    if (esVal === 'CONTROL') return 'КОНТРОЛЬ ТОЛПЫ';
    if (esVal === 'TROPAS ALIADAS') return 'СОЮЗНЫЙ ОТРЯД';
    if (esVal === 'AMPLIFICADOR') return 'УСИЛИТЕЛЬ';
    if (esVal === 'CADENA ELÉCTRICA') return 'ЦЕПНАЯ МОЛНИЯ';
    if (esVal === 'ÁREA INCENDIARIA') return 'ЗОНА ПОДЖОГА';
    if (esVal === 'FRANCOTIRADOR') return 'СНАЙПЕР';
    if (esVal === 'ECONOMÍA') return 'ЭКОНОМИКА';
    if (esVal === 'CONTROL A CORTA DISTANCIA') return 'БЛИЖНИЙ КОНТРОЛЬ';
    if (esVal === 'DESPLAZAMIENTO') return 'ОТБРАСЫВАНИЕ';
  }

  if (k === 'turret.gunner.name') return 'ГВОЗДОМЕТ';
  if (k === 'turret.mortar.name') return 'БОМБАРДА';
  if (k === 'turret.cryo.name') return 'МОРОЗ';
  if (k === 'turret.barracks.name') return 'КАЗАРМА';
  if (k === 'turret.support.name') return 'ЦЕХ ПОДДЕРЖКИ';
  if (k === 'turret.tesla.name') return 'КАТУШКА ТЕСЛА';
  if (k === 'turret.incinerator.name') return 'ТРАНШЕЙНЫЙ ОГНЕМЕТ';
  if (k === 'turret.railgun.name') return 'РЕЛЬСОТРОН';
  if (k === 'turret.collector.name') return 'СБОРЩИК ЛОМА';
  if (k === 'turret.press.name') return 'ПУТЕВОЙ ПРЕСС';
  if (k === 'turret.ejector.name') return 'ГИДРО-ЭЖЕКТОР';

  // Replace common terms
  return esVal
    .replace(/\bdaño\b/gi, 'урон')
    .replace(/\bcadencia\b/gi, 'скорострельность')
    .replace(/\balcance\b/gi, 'дальность')
    .replace(/\brango\b/gi, 'дальность')
    .replace(/\bchatarra\b/gi, 'металлолом')
    .replace(/\bnúcleo\b/gi, 'ядро')
    .replace(/\boleada\b/gi, 'волна')
    .replace(/\boleadas\b/gi, 'волн')
    .replace(/\benemigo\b/gi, 'враг')
    .replace(/\benemigos\b/gi, 'враги')
    .replace(/\bataque\b/gi, 'атака')
    .replace(/\bataques\b/gi, 'атаки')
    .replace(/\bquemadura\b/gi, 'горение')
    .replace(/\bperforación\b/gi, 'пробитие')
    .replace(/\bárea\b/gi, 'площадь')
    .replace(/\bradio\b/gi, 'радиус')
    .replace(/\bvelocidad\b/gi, 'скорость')
    .replace(/\bempuje\b/gi, 'отбрасывание')
    .replace(/\baturdimiento\b/gi, 'оглушение')
    .replace(/\baturde\b/gi, 'оглушает')
    .replace(/\bralentiza\b/gi, 'замедляет')
    .replace(/\bmejora\b/gi, 'улучшение')
    .replace(/\bmejoras\b/gi, 'улучшения')
    .replace(/\bcoloca\b/gi, 'устанавливает')
    .replace(/\bdispara\b/gi, 'стреляет')
    .replace(/\bráfaga\b/gi, 'очередь')
    .replace(/\bbalas\b/gi, 'пули')
    .replace(/\bmunición\b/gi, 'снаряды')
    .replace(/\bhóstiles\b/gi, 'враги')
    .replace(/\bhostiles\b/gi, 'врагов');
}

function translateUiKeyRu(k, esVal, enVal) {
  if (k === 'ui.topbar.sector') return 'СЕКТОР 07-B // ПУТИ ИЗОЛЯЦИИ';
  if (k === 'ui.topbar.teeth') return 'ЗУБЫ:';
  if (k === 'ui.topbar.settings') return 'НАСТРОЙКИ';
  if (k === 'ui.menu.campaign_badge') return '★ ОСНОВНАЯ КАМПАНИЯ // 12 ВОЛН';
  if (k === 'ui.menu.arcade_badge') return 'ДОП. РЕЖИМ // ДИНАМИЧНЫЙ БОЙ · БЕСКОНЕЧНАЯ ОРДА';
  if (k === 'ui.menu.play') return '[ ИГРАТЬ ]';
  if (k === 'ui.menu.play_td') return '[ ИГРАТЬ : TOWER DEFENSE ]';
  if (k === 'ui.menu.play_surv') return '[ ИГРАТЬ : ВЫЖИВАНИЕ ]';
  if (k === 'ui.menu.tutorial_td') return 'ОБУЧЕНИЕ TD';
  if (k === 'ui.menu.manual') return '[ РУКОВОДСТВО И УПРАВЛЕНИЕ ]';
  if (k === 'ui.menu.shop') return '[ КЛИНИКА / ИМПЛАНТЫ ]';
  if (k === 'ui.menu.online') return 'СЕТЕВАЯ ИГРА P2P';
  if (k === 'ui.menu.dossier_title') return 'ЛИЧНОЕ ДЕЛО';
  if (k === 'ui.menu.dossier_mode_td') return 'ДЕЛО // TOWER DEFENSE';
  if (k === 'ui.menu.dossier_mode_surv') return 'ДЕЛО // ВЫЖИВАНИЕ';
  if (k === 'ui.menu.dossier_directive_title') return 'ТАКТИЧЕСКАЯ ДИРЕКТИВА:';
  if (k === 'ui.menu.dossier_directive_td') return 'Стройте турели на заводских путях, переживите 12 смертоносных волн и защитите биомеханический реактор.';
  if (k === 'ui.menu.dossier_directive_surv') return 'Динамичный режим: прямой бой без турелей, сбор сыворотки и уничтожение 5 боссов комплекса.';
  if (k === 'ui.menu.dossier_metric_td') return 'ЛУЧШАЯ ВОЛНА:';
  if (k === 'ui.menu.dossier_metric_surv') return 'ЛУЧШЕЕ ВРЕМЯ:';
  if (k === 'ui.menu.dossier_runs') return 'ЭКСПЕДИЦИЙ:';
  if (k === 'ui.menu.dossier_kills') return 'ВРАГОВ УНИЧТОЖЕНО:';
  if (k === 'ui.menu.dossier_bosses') return 'БОССОВ ПОВЕРЖЕНО:';
  if (k === 'ui.menu.dossier_upgrades') return 'ИМПЛАНТОВ ПРИОБРЕТЕНО:';
  if (k === 'ui.menu.controls_title') return 'УПРАВЛЕНИЕ В БОЮ:';
  if (k === 'ui.menu.controls_desc') return 'WASD - Движение · Мышь - Прицел · Пробел - Прыжок · Shift - Рывок · F - Начать волну · E - Турели · Tab - Карта';

  if (k === 'ui.settings.title') return 'НАСТРОЙКИ';
  if (k === 'ui.settings.save_return') return '[ СОХРАНИТЬ И ВЫЙТИ ]';
  if (k === 'ui.settings.audio_section') return 'ЗВУКОВОЙ ТРАКТ';
  if (k === 'ui.settings.master_vol') return 'ОБЩАЯ ГРОМКОСТЬ:';
  if (k === 'ui.settings.sfx_vol') return 'ЭФФЕКТЫ И БОЙ (SFX):';
  if (k === 'ui.settings.music_vol') return 'МУЗЫКАЛЬНОЕ СОПРОВОЖДЕНИЕ:';
  if (k === 'ui.settings.amb_vol') return 'ФОН КОМПЛЕКСА:';
  if (k === 'ui.settings.mute_global') return 'ОТКЛЮЧИТЬ ЗВУК:';
  if (k === 'ui.settings.video_section') return 'ВИДЕОСИСТЕМА';
  if (k === 'ui.settings.res_scale') return 'МАСШТАБ РЕНДЕРА:';
  if (k === 'ui.settings.res_03') return '0,30x (ПИКСЕЛЬ-АРТ · РЕТРО)';
  if (k === 'ui.settings.res_044') return '0,44x (СБАЛАНСИРОВАННО · БЫСТРО)';
  if (k === 'ui.settings.res_065') return '0,65x (ЧЕТКО · 720p)';
  if (k === 'ui.settings.res_10') return '1,00x (РОДНОЕ РАЗРЕШЕНИЕ)';
  if (k === 'ui.settings.ui_scale') return 'МАСШТАБ ИНТЕРФЕЙСА:';
  if (k === 'ui.settings.ui_scale_1x') return 'x1 (КОМПАКТНЫЙ)';
  if (k === 'ui.settings.ui_scale_2x') return 'x2 (РЕТРО-ИНТЕРФЕЙС)';
  if (k === 'ui.settings.ui_scale_3x') return 'x3 (СТАНДАРТНЫЙ)';
  if (k === 'ui.settings.ui_scale_4x') return 'x4 (УВЕЛИЧЕННЫЙ)';
  if (k === 'ui.settings.fullscreen') return 'ПОЛНОЭКРАННЫЙ РЕЖИМ:';
  if (k === 'ui.settings.crt') return 'ЭЛТ-ФИЛЬТР И ЗЕРНИСТОСТЬ:';
  if (k === 'ui.settings.crt_grain') return 'ЭЛТ-ФИЛЬТР И ЗЕРНИСТОСТЬ ПЛЕНКИ:';
  if (k === 'ui.settings.shadows') return 'ДИНАМИЧЕСКИЕ ТЕНИ:';
  if (k === 'ui.settings.shadows_lantern') return 'ДИНАМИЧЕСКИЕ ТЕНИ ФОНАРЯ:';
  if (k === 'ui.settings.fps') return 'СЧЕТЧИК FPS:';
  if (k === 'ui.settings.fov') return 'ПОЛЕ ЗРЕНИЯ (FOV):';
  if (k === 'ui.settings.controls_section') return 'УПРАВЛЕНИЕ И КАМЕРА';
  if (k === 'ui.settings.mouse_sens') return 'ЧУВСТВИТЕЛЬНОСТЬ МЫШИ:';
  if (k === 'ui.settings.cam_shake') return 'ТРЯСКА ЭКРАНА:';
  if (k === 'ui.settings.reset_section') return 'УПРАВЛЕНИЕ ДАННЫМИ';
  if (k === 'ui.settings.btn_reset_defaults') return '[ СБРОСИТЬ НАСТРОЙКИ ]';
  if (k === 'ui.settings.btn_wipe_save') return '[ СТЕРЕТЬ СОХРАНЕНИЯ ]';
  if (k === 'ui.settings.language') return 'ЯЗЫК:';
  if (k === 'ui.settings.language_auto') return 'АВТО (СИСТЕМНЫЙ)';

  if (k === 'ui.common.enabled') return 'ВКЛ';
  if (k === 'ui.common.disabled') return 'ВЫКЛ';
  if (k === 'ui.common.fullscreen_on') return 'ПОЛНЫЙ ЭКРАН';
  if (k === 'ui.common.fullscreen_off') return 'В ОКНЕ';
  if (k === 'ui.common.visible') return 'ВИДИМО';
  if (k === 'ui.common.hidden') return 'СКРЫТО';
  if (k === 'ui.common.none') return 'Нет';
  if (k === 'ui.common.weapons') return 'ОРУЖИЕ:';
  if (k === 'ui.common.passives') return 'ПАССИВКИ:';

  if (k === 'ui.pause.title') return 'СИМУЛЯЦИЯ ПРИОСТАНОВЛЕНА';
  if (k === 'ui.pause.sub') return 'ТАКТИЧЕСКАЯ ПАУЗА';
  if (k === 'ui.pause.resume') return '[ ПРОДОЛЖИТЬ МИССИЮ ]';
  if (k === 'ui.pause.settings') return '[ НАСТРОЙКИ ]';
  if (k === 'ui.pause.to_menu') return '[ В ГЛАВНОЕ МЕНЮ ]';

  if (k === 'ui.shop.title') return 'СТОЛ ХИРУРГА';
  if (k === 'ui.shop.reserve') return 'ЗАПАС:';
  if (k === 'ui.shop.sub') return 'ПОСТОЯННЫЕ ИМПЛАНТЫ ЗА ВЫРВАННЫЕ ЗУБЫ';
  if (k === 'ui.shop.play_now') return '[ ВЫСАДИТЬСЯ В ЦЕХ ]';
  if (k === 'ui.shop.back') return '[ НАЗАД ]';
  if (k === 'ui.shop.max') return 'МАКСИМУМ';
  if (k === 'ui.shop.buy') return 'КУПИТЬ ({cost})';
  if (k === 'ui.shop.level_tag') return 'УРОВЕНЬ {lvl}/{max}';

  if (k === 'ui.levelup.title') return 'ПОВЫШЕНИЕ УРОВНЯ';
  if (k === 'ui.levelup.slots') return 'СЛОТЫ: {weapons} ОРУЖИЯ | {passives} ПАССИВОК';
  if (k === 'ui.levelup.sub') return 'ПРОТОКОЛ ПЕРЕСТРОЙКИ // ВЫБЕРИТЕ УЛУЧШЕНИЕ';
  if (k === 'ui.levelup.charges') return 'ЗАРЯДЫ: ';
  if (k === 'ui.levelup.reroll_btn') return '[ СБРОСИТЬ ]';
  // Russian plurals for rerolls
  set("ui.levelup.rerolls_remaining.one", "(остался {count} сброс)");
  set("ui.levelup.rerolls_remaining.few", "(осталось {count} сброса)");
  set("ui.levelup.rerolls_remaining.many", "(осталось {count} сбросов)");
  set("ui.levelup.rerolls_remaining.other", "(осталось {count} сбросов)");
  if (k === 'ui.levelup.rerolls_exhausted') return '(Исчерпано)';
  if (k === 'ui.levelup.new_weapon') return 'НОВОЕ ОРУЖИЕ';
  if (k === 'ui.levelup.upgrade_weapon') return 'УЛУЧШЕНИЕ ОРУЖИЯ';
  if (k === 'ui.levelup.new_passive') return 'НОВЫЙ ИМПЛАНТ';
  if (k === 'ui.levelup.upgrade_passive') return 'УЛУЧШЕНИЕ ИМПЛАНТА';
  if (k === 'ui.levelup.emergency_supply') return 'АВАРИЙНЫЙ ПРИПАС';
  if (k === 'ui.levelup.new_tag') return 'НОВОЕ';
  if (k === 'ui.levelup.supply_tag') return 'ПРИПАС';
  if (k === 'ui.levelup.affects_player') return 'Влияет на: Биометрию оператора';
  if (k === 'ui.levelup.affects_label') return 'Влияет на: ';
  if (k === 'ui.levelup.affected_weapons') return 'Совместимое оружие: ';
  if (k === 'ui.levelup.no_compatible_weapons') return 'В инвентаре пока нет совместимого оружия';

  if (k === 'ui.results.report_title_victory') return 'ОТЧЕТ ОБ ОПЕРАЦИИ // УСПЕХ';
  if (k === 'ui.results.report_title_td_defeat') return 'ПРОРЫВ ИЗОЛЯЦИИ // ОПЕРАТОР ПОГИБ';
  if (k === 'ui.results.report_title_surv_defeat') return 'СВИДЕТЕЛЬСТВО О СМЕРТИ // ДЕЛО ЗАКРЫТО';
  if (k === 'ui.results.victory_headline') return 'ЯДРО В БЕЗОПАСНОСТИ';
  if (k === 'ui.results.defeat_headline') return 'ПАЦИЕНТ СКОНЧАЛСЯ';
  if (k === 'ui.results.cause_default') return 'ПРИЧИНА: РАСЧЛЕНЕНИЕ НА ЗАВОДЕ';
  if (k === 'ui.results.time_label') return 'ВРЕМЯ МИССИИ:';
  if (k === 'ui.results.bosses_label') return 'БОССОВ ПОВЕРЖЕНО:';
  if (k === 'ui.results.kills_label') return 'ВРАГОВ УНИЧТОЖЕНО:';
  if (k === 'ui.results.run_teeth_label') return 'ЗУБОВ ДОБЫТО В РЕЙДЕ:';
  if (k === 'ui.results.total_teeth_label') return 'ОБЩИЙ ЗАПАС ЗУБОВ:';
  if (k === 'ui.results.cycle_label') return 'ФИНАЛЬНЫЙ ЦИКЛ:';
  if (k === 'ui.results.cycle_val') return 'ЦИКЛ {level}';
  if (k === 'ui.results.td_status_label') return 'ОТРАЖЕНО ВОЛН / ОСТАЛОСЬ ЖИЗНЕЙ:';
  if (k === 'ui.results.td_status_val') return '{waves}/{totalWaves} ВОЛН · ЖИЗНЕЙ: {coreHp}/{coreMaxHp}';
  if (k === 'ui.results.surv_status_label') return 'СТАТУС ФИНАЛА:';
  if (k === 'ui.results.surv_endgame_won') return 'ВЫПОЛНЕНО (ПРОТОКОЛ 15:00 ПРЕОДОЛЕН)';
  if (k === 'ui.results.surv_endgame_lost') return 'ПОГИБ ДО 15:00';
  if (k === 'ui.results.surv_endgame_not_reached') return 'НЕ ДОСТИГНУТО';
  if (k === 'ui.results.btn_restart') return '[ НОВАЯ ВЫСАДКА ]';
  if (k === 'ui.results.btn_menu') return '[ В ГЛАВНОЕ МЕНЮ ]';
  if (k === 'ui.results.btn_shop') return '[ ПОСТОЯННЫЕ УЛУЧШЕНИЯ ]';

  if (k === 'ui.map_select.header_tape') return 'ТАКТИЧЕСКИЙ АРХИВ // ЗАВОДСКИЕ СЕКТОРЫ';
  if (k === 'ui.map_select.title') return 'ВЫБОР СЕКТОРА ДЛЯ ВЫСАДКИ';
  if (k === 'ui.map_select.back') return '[ ◄ В ГЛАВНОЕ МЕНЮ ]';
  if (k === 'ui.map_select.tab_easy_badge') return 'НАЧАЛЬНЫЙ СЕКТОР';
  if (k === 'ui.map_select.tab_easy') return 'ЛЕГКО';
  if (k === 'ui.map_select.tab_easy_sub') return '150 ЖИЗНЕЙ · 1 ВХОД';
  if (k === 'ui.map_select.tab_norm_badge') return 'СТАНДАРТНЫЙ СЕКТОР';
  if (k === 'ui.map_select.tab_norm') return 'НОРМАЛЬНО';
  if (k === 'ui.map_select.tab_norm_sub') return '100 ЖИЗНЕЙ · 2 ВХОДА';
  if (k === 'ui.map_select.tab_hard_badge') return 'ОПАСНЫЙ СЕКТОР';
  if (k === 'ui.map_select.tab_hard') return 'СЛОЖНО';
  if (k === 'ui.map_select.tab_hard_sub') return '75 ЖИЗНЕЙ · 2 ВЫХОДА';
  if (k === 'ui.map_select.status_completed') return 'ПРОЙДЕНО';
  if (k === 'ui.map_select.status_record') return 'РЕК: {bestWave}/12';
  if (k === 'ui.map_select.status_no_data') return 'НЕТ ДАННЫХ';
  // Russian plurals for entrances/exits
  set("ui.map_select.entrances.one", "1 ВХОД");
  set("ui.map_select.entrances.few", "{count} ВХОДА");
  set("ui.map_select.entrances.many", "{count} ВХОДОВ");
  set("ui.map_select.entrances.other", "{count} ВХОДОВ");
  set("ui.map_select.exits.one", "1 ВЫХОД");
  set("ui.map_select.exits.few", "{count} ВЫХОДА");
  set("ui.map_select.exits.many", "{count} ВЫХОДОВ");
  set("ui.map_select.exits.other", "{count} ВЫХОДОВ");
  if (k === 'ui.map_select.diff_label') return 'СЛОЖНОСТЬ:';
  if (k === 'ui.map_select.lives_label') return 'ЖИЗНЕЙ ЯДРА:';
  if (k === 'ui.map_select.lives_val') return '{count} ЖИЗНЕЙ';
  if (k === 'ui.map_select.scrap_label') return 'ПРИПАСЫ:';
  if (k === 'ui.map_select.scrap_val') return '{count} ЛОМА';
  if (k === 'ui.map_select.layout_label') return 'СХЕМА:';
  if (k === 'ui.map_select.layout_val') return '{entrances} ВХОД. / {exits} ВЫХОД.';
  if (k === 'ui.map_select.deploy_btn') return '[ ВЫСАДИТЬСЯ В ЭТОТ СЕКТОР ► ]';
  if (k === 'ui.map_select.deploy_sub') return 'НАЧАТЬ ОПЕРАЦИЮ // 12 ВОЛН';

  if (k === 'ui.char_modal.title') return 'ВЫБОР ОПЕРАТОРА';
  if (k === 'ui.char_modal.sub') return 'ВЫБЕРИТЕ ОПЕРАТОРА С УНИКАЛЬНЫМ ОРУЖИЕМ, ПАССИВКОЙ И БИОМЕТРИЕЙ';
  if (k === 'ui.char_modal.close') return '[X] ЗАКРЫТЬ';
  if (k === 'ui.char_modal.weapon') return 'ОРУЖИЕ: {name}';
  if (k === 'ui.char_modal.confirm') return '[ ПОДТВЕРДИТЬ ВЫБОР И НАЧАТЬ ]';
  if (k === 'ui.char_modal.active') return 'ВЫБРАН';
  if (k === 'ui.char_modal.btn_assigned') return '[ НАЗНАЧЕН ]';
  if (k === 'ui.char_modal.btn_select') return '[ ВЫБРАТЬ ]';
  if (k === 'ui.char_modal.waiting_peer') return 'Напарник все еще выбирает оператора...';
  if (k === 'ui.char_modal.assigned_waiting') return '[ ОПЕРАТОР ВЫБРАН // ОЖИДАНИЕ ]';
  if (k === 'ui.char_modal.peer_ready') return 'Напарник готов! Выберите оператора для старта.';
  if (k === 'ui.char_modal.all_ready') return 'ОБА ОПЕРАТОРА ГОТОВЫ! НАЧИНАЕМ ВЫСАДКУ...';
  if (k === 'ui.char_modal.deploying') return '[ ВЫСАДКА! ]';

  if (k === 'ui.turret_modal.title_place') return 'ТАКТИЧЕСКИЙ ТЕРМИНАЛ // ТУРЕЛИ';
  if (k === 'ui.turret_modal.title_turret') return 'ТУРЕЛЬ // {name}';
  if (k === 'ui.turret_modal.scrap_pill') return 'МЕТАЛЛОЛОМ';
  if (k === 'ui.turret_modal.skip_prep') return '[ НАЧАТЬ ВОЛНУ (F) ]';
  if (k === 'ui.turret_modal.close') return '[ ЗАКРЫТЬ (E) ]';
  if (k === 'ui.turret_modal.footer_tip') return 'СТРОЙТЕ И УЛУЧШАЙТЕ ТУРЕЛИ ЗА СОБРАННЫЙ ЛОМ. ТОЛЬКО ОДНА ВЕТКА МОЖЕТ БЫТЬ ВЫШЕ 2-ГО УРОВНЯ.';
  if (k === 'ui.turret_modal.place_instructions_html') return 'Выберите турель. После закрытия окна наведите прицел на пол: <b>зеленый</b> = доступно, <b>красный</b> = занято. ЛКМ или <b>E</b> — разместить; <b>ESC</b> — отмена.';
  if (k === 'ui.turret_modal.not_enough_scrap') return 'НЕДОСТАТОЧНО ЛОМА';
  if (k === 'ui.turret_modal.max_level') return 'МАКСИМАЛЬНЫЙ УРОВЕНЬ';
  if (k === 'ui.turret_modal.upgrade_btn') return 'УЛУЧШИТЬ ({cost})';
  if (k === 'ui.turret_modal.integrity') return 'ПРОЧНОСТЬ {hp} / {maxHp}';
  if (k === 'ui.turret_modal.btn_switch_build') return 'ПОСТРОИТЬ ДРУГУЮ ТУРЕЛЬ';
  if (k === 'ui.turret_modal.btn_sell') return 'ПРОДАТЬ (+{refund} ЛОМА)';

  if (k === 'ui.tutorial_prompt.tape') return 'ИНСТРУКТАЖ';
  if (k === 'ui.tutorial_prompt.title') return 'ПРОЙТИ ОБУЧЕНИЕ?';
  if (k === 'ui.tutorial_prompt.desc1') return 'Это ваш первый контракт на оборону. Вы можете пройти интерактивное обучение: научитесь свободно ставить турели, улучшать их ветки в стиле BTD6, собирать МЕТАЛЛОЛОМ и комбинировать связки вроде Мороз + Бомбарда.';
  if (k === 'ui.tutorial_prompt.desc2') return 'Этот выбор предлагается только при первом запуске. Позже обучение можно запустить из главного меню.';
  if (k === 'ui.tutorial_prompt.yes') return '[ ДА, НАЧАТЬ ОБУЧЕНИЕ ]';
  if (k === 'ui.tutorial_prompt.no') return '[ НЕТ, СРАЗУ В БОЙ ]';

  if (k === 'ui.lang_screen.title') return 'ВЫБЕРИТЕ ЯЗЫК';
  if (k === 'ui.lang_screen.subtitle') return 'SELECT YOUR LANGUAGE';
  if (k === 'ui.lang_screen.confirm') return '[ ПРОДОЛЖИТЬ ]';

  return enVal || esVal;
}
