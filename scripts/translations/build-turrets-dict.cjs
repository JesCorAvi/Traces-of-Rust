// Complete Turret Translations for all 7 languages (fr, pt, ru, ja, ko, zhHans, zhHant)
// Total 345 keys (11 turrets * 30 keys + 15 stat keys)

const fs = require('fs');

const data = {
  stat: {
    damage: { fr: "Dégâts", pt: "Dano", ru: "Урон", ja: "威力", ko: "피해량", zhHans: "伤害", zhHant: "傷害" },
    fireRate: { fr: "Cadence", pt: "Cadência", ru: "Скорострельность", ja: "攻撃速度", ko: "공격 속도", zhHans: "攻速", zhHant: "攻速" },
    range: { fr: "Portée", pt: "Alcance", ru: "Дальность", ja: "射程", ko: "사거리", zhHans: "射程", zhHant: "射程" },
    aoe: { fr: "Zone", pt: "Área", ru: "Область", ja: "爆発範囲", ko: "폭발 범위", zhHans: "爆炸范围", zhHant: "爆炸範圍" },
    slow: { fr: "Ralentissement", pt: "Lentidão", ru: "Замедление", ja: "減速", ko: "감속", zhHans: "减速", zhHant: "減速" },
    radius: { fr: "Rayon", pt: "Raio", ru: "Радиус", ja: "効果半径", ko: "효과 반경", zhHans: "作用半径", zhHant: "作用半徑" },
    allies: { fr: "Soldats", pt: "Tropas", ru: "Бойцы", ja: "兵力", ko: "병력 수", zhHans: "部队人数", zhHant: "部隊人數" },
    every: { fr: "Intervalle", pt: "Intervalo", ru: "Интервал", ja: "間隔", ko: "주기", zhHans: "间隔", zhHant: "間隔" },
    buffDamage: { fr: "Bonus dégâts", pt: "Bônus de Dano", ru: "Бонус урона", ja: "ダメージ強化", ko: "피해 강화", zhHans: "伤害增益", zhHant: "傷害增益" },
    chain: { fr: "Rebonds", pt: "Ricochetes", ru: "Цепь", ja: "連鎖数", ko: "연쇄 횟수", zhHans: "连锁次数", zhHant: "連鎖次數" },
    burn: { fr: "Brûlure", pt: "Queimadura", ru: "Горение", ja: "燃焼ダメージ", ko: "화상 피해", zhHans: "燃烧伤害", zhHant: "燃燒傷害" },
    singleTarget: { fr: "Cible unique", pt: "Alvo Único", ru: "Одна цель", ja: "単体特化", ko: "단일 대상", zhHans: "单体目标", zhHant: "單體目標" },
    scrapPerWave: { fr: "Ferraille/Vague", pt: "Sucata/Onda", ru: "Лом за волну", ja: "ウェーブ毎スクラップ", ko: "웨이브당 고철", zhHans: "每波废料", zhHant: "每波廢料" },
    push: { fr: "Poussée", pt: "Empurrão", ru: "Откидывание", ja: "ノックバック", ko: "넉백", zhHans: "击退", zhHant: "擊退" },
    stun: { fr: "Étourdissement", pt: "Atordoamento", ru: "Оглушение", ja: "気絶時間", ko: "기절 시간", zhHans: "眩晕", zhHant: "暈眩" }
  },

  turrets: {
    gunner: {
      name: { fr: "CLOUEUSE", pt: "PREGADORA", ru: "ГВОЗДОМЕТ", ja: "ネイルガン", ko: "센트리 기관총", zhHans: "铆钉机", zhHant: "鉚釘機" },
      role: { fr: "DÉGÂTS DIRECTS", pt: "DANO DIRETO", ru: "ПРЯМОЙ УРОН", ja: "単体火力", ko: "단일 피해", zhHans: "直接伤害", zhHant: "直接傷害" },
      desc: {
        fr: "Fusil pneumatique industriel à haute cadence. Bon marché et fiable contre les cibles isolées.",
        pt: "Rifle pneumático industrial de alta cadência. Barato e confiável contra alvos únicos.",
        ru: "Скорострельный пневматический карабин. Дешевый и надежный против одиночных целей.",
        ja: "高速連射の空圧式ネイルライフル。単体目標に対して安価かつ高信頼性。",
        ko: "빠른 연사력을 지닌 공압식 기관총. 저렴하며 단일 대상에게 효과적입니다.",
        zhHans: "高射速工业气动枪。造价低廉，应对单体目标极其可靠。",
        zhHant: "高射速工業氣動槍。造價低廉，應對單體目標極其可靠。"
      },
      paths: {
        rate: {
          name: { fr: "CADENCE", pt: "CADÊNCIA", ru: "СКОРОСТРЕЛЬНОСТЬ", ja: "連射速度", ko: "연사 속도", zhHans: "射速", zhHant: "射速" },
          upgrades: [
            {
              name: { fr: "Détente sensible", pt: "Gatilho leve", ru: "Легкий спуск", ja: "軽量トリガー", ko: "경량 방아쇠", zhHans: "轻触扳机", zhHant: "輕觸扳機" },
              desc: { fr: "+25% de cadence de tir.", pt: "+25% de cadência de tiro.", ru: "+25% к скорострельности.", ja: "連射速度+25%。", ko: "연사 속도 +25%.", zhHans: "射速+25%。", zhHant: "射速+25%。" }
            },
            {
              name: { fr: "Double canon", pt: "Cano duplo", ru: "Сдвоенный ствол", ja: "ツインバレル", ko: "트윈 배럴", zhHans: "双联枪管", zhHant: "雙聯槍管" },
              desc: { fr: "Tire sur 2 cibles simultanément.", pt: "Dispara em 2 alvos simultaneamente.", ru: "Стреляет по 2 целям одновременно.", ja: "同時に2体の敵を射撃。", ko: "동시에 2개의 대상을 사격합니다.", zhHans: "同时攻击2个目标。", zhHant: "同時攻擊2個目標。" }
            },
            {
              name: { fr: "Moteur suralimenté", pt: "Motor sobrecarregado", ru: "Форсированный мотор", ja: "過給モーター", ko: "과급 모터", zhHans: "增压马达", zhHant: "增壓馬達" },
              desc: { fr: "+30% de cadence de tir.", pt: "+30% de cadência de tiro.", ru: "+30% к скорострельности.", ja: "連射速度+30%。", ko: "연사 속도 +30%.", zhHans: "射速+30%。", zhHant: "射速+30%。" }
            },
            {
              name: { fr: "Tempête de plomb", pt: "Tempestade de chumbo", ru: "Свинцовый шторм", ja: "レッドストーム", ko: "납빛 폭풍", zhHans: "铅弹风暴", zhHant: "鉛彈風暴" },
              desc: { fr: "Chaque attaque tire une rafale dense de 6 balles.", pt: "Cada ataque dispara uma rajada densa de 6 projéteis.", ru: "Каждая атака выпускает плотную очередь из 6 пуль.", ja: "攻撃毎に強力な6点バースト射撃を斉射。", ko: "공격마다 집중된 6연발 점사를 퍼붓습니다.", zhHans: "每次攻击发射密集的6发连击。", zhHant: "每次攻擊發射密集的6發連擊。" }
            }
          ]
        },
        pierce: {
          name: { fr: "TRANSPERCEMENT", pt: "PERFURAÇÃO", ru: "ПРОБИТИЕ", ja: "貫通", ko: "관통", zhHans: "穿透", zhHant: "穿透" },
          upgrades: [
            {
              name: { fr: "Cœur d'acier", pt: "Núcleo de aço", ru: "Стальной сердечник", ja: "スチールコア", ko: "강철 코어", zhHans: "钢制弹芯", zhHant: "鋼製彈芯" },
              desc: { fr: "+2 de dégâts.", pt: "+2 de dano.", ru: "+2 к урону.", ja: "威力+2。", ko: "피해량 +2.", zhHans: "伤害+2。", zhHant: "傷害+2。" }
            },
            {
              name: { fr: "Clous perforants", pt: "Pregos perfurantes", ru: "Бронебойные гвозди", ja: "アーマーピアシングネイル", ko: "철갑 못", zhHans: "穿甲钉", zhHant: "穿甲釘" },
              desc: { fr: "Les clous transpercent 2 ennemis.", pt: "Os pregos perfuram 2 inimigos.", ru: "Гвозди пробивают 2 врагов насквозь.", ja: "釘が敵2体を貫通。", ko: "못이 적 2명을 관통합니다.", zhHans: "铆钉可穿透2个敌人。", zhHant: "鉚釘可穿透2個敵人。" }
            },
            {
              name: { fr: "Canon renforcé", pt: "Cano reforçado", ru: "Усиленный ствол", ja: "強化バレル", ko: "강화 총열", zhHans: "强化枪管", zhHant: "強化槍管" },
              desc: { fr: "+3 de dégâts et +10% de portée.", pt: "+3 de dano e +10% de alcance.", ru: "+3 к урону и +10% к дальности.", ja: "威力+3、射程+10%。", ko: "피해량 +3, 사거리 +10%.", zhHans: "伤害+3，射程+10%。", zhHant: "傷害+3，射程+10%。" }
            },
            {
              name: { fr: "Rail électromagnétique", pt: "Trilho eletromagnético", ru: "Рельсотрон", ja: "電磁レール", ko: "전자기 레일", zhHans: "电磁轨道", zhHant: "電磁軌道" },
              desc: { fr: "Tire des cartouches perforant tous les ennemis en ligne droite (+50% dégâts).", pt: "Dispara projéteis magnéticos que perfuram todos os inimigos em linha (+50% de dano).", ru: "Выпускает рельсовые снаряды, пробивающие всех врагов по линии с +50% урона.", ja: "直線上の全敵を貫通する高速弾を射出（ダメージ+50%）。", ko: "직선상의 모든 적을 관통하는 레일 탄환을 발사합니다 (피해량 +50%).", zhHans: "发射穿透直线所有敌人的轨道弹，伤害+50%。", zhHant: "發射穿透直線所有敵人的軌道彈，傷害+50%。" }
            }
          ]
        },
        incendiary: {
          name: { fr: "INCENDIAIRE", pt: "INCENDIÁRIO", ru: "ЗАЖИГАТЕЛЬНЫЙ", ja: "焼夷", ko: "소이", zhHans: "燃烧", zhHant: "燃燒" },
          upgrades: [
            {
              name: { fr: "Poudre thermite", pt: "Pó de termite", ru: "Термитный порошок", ja: "テルミット火薬", ko: "테르밋 분말", zhHans: "铝热剂粉末", zhHant: "鋁熱劑粉末" },
              desc: { fr: "+15% de dégâts.", pt: "+15% de dano.", ru: "+15% к урону.", ja: "威力+15%。", ko: "피해량 +15%.", zhHans: "伤害+15%。", zhHant: "傷害+15%。" }
            },
            {
              name: { fr: "Munitions incendiaires", pt: "Munição incendiária", ru: "Зажигательные патроны", ja: "焼夷弾", ko: "소이탄", zhHans: "燃烧弹药", zhHant: "燃燒彈藥" },
              desc: { fr: "Applique Brûlure (4 dps pendant 3s).", pt: "Aplica Queimadura (4 dps por 3s).", ru: "Накладывает горение (4 урона/с в течение 3 с).", ja: "燃焼効果を付与（3秒間、毎秒4ダメージ）。", ko: "화상을 적용합니다 (3초간 초당 4 피해).", zhHans: "造成燃烧效果（每秒4点伤害，持续3秒）。", zhHant: "造成燃燒效果（每秒4點傷害，持續3秒）。" }
            },
            {
              name: { fr: "Carburant visqueux", pt: "Combustível denso", ru: "Плотное топливо", ja: "濃縮燃料", ko: "고농도 연료", zhHans: "稠化燃料", zhHant: "稠化燃料" },
              desc: { fr: "+50% de dégâts de brûlure.", pt: "+50% de dano de queimadura.", ru: "+50% к урону от горения.", ja: "燃焼ダメージ+50%。", ko: "화상 피해량 +50%.", zhHans: "燃烧伤害+50%。", zhHant: "燃燒傷害+50%。" }
            },
            {
              name: { fr: "Munitions explosives", pt: "Munição explosiva", ru: "Осколочно-фугасные патроны", ja: "爆裂弾", ko: "폭발 탄약", zhHans: "爆破弹药", zhHant: "爆破彈藥" },
              desc: { fr: "L'impact explose en zone avec une brûlure considérablement renforcée.", pt: "O impacto explode em área com queimadura muito mais forte.", ru: "Попадания вызывают взрыв по площади с усиленным горением.", ja: "着弾時に範囲爆発し、強力な燃焼を拡散。", ko: "착탄 시 폭발하며 더욱 강력한 화상을 남깁니다.", zhHans: "击中时造成范围爆炸，大幅强化燃烧效果。", zhHant: "擊中時造成範圍爆炸，大幅強化燃燒效果。" }
            }
          ]
        }
      }
    },

    mortar: {
      name: { fr: "BOMBARDE", pt: "BOMBARDA", ru: "БОМБАРДА", ja: "ボンバー", ko: "중박격포", zhHans: "重击迫击炮", zhHant: "重擊迫擊砲" },
      role: { fr: "ZONE", pt: "ÁREA", ru: "УРОН ПО ПЛОЩАДИ", ja: "範囲制圧", ko: "범위 피해", zhHans: "范围伤害", zhHant: "範圍傷害" },
      desc: {
        fr: "Mortier lourd à cadence lente. Inflige d'immenses dégâts explosifs de zone.",
        pt: "Morteiro pesado de cadência lenta. Causa dano explosivo massivo em área.",
        ru: "Тяжелый навесной миномет. Низкая скорострельность, огромный взрывной урон по площади.",
        ja: "低連射・高威力の重量級迫撃砲。広範囲の敵群をまとめて爆砕。",
        ko: "느린 발사 속도를 지닌 중형 박격포. 막대한 범위 폭발 피해를 입힙니다.",
        zhHans: "慢速重型迫击炮。造成大范围毁灭性爆炸伤害。",
        zhHant: "慢速重型迫擊砲。造成大範圍毀滅性爆炸傷害。"
      },
      paths: {
        caliber: {
          name: { fr: "CALIBRE", pt: "CALIBRE", ru: "КАЛИБР", ja: "口径強化", ko: "구경 강화", zhHans: "口径", zhHant: "口徑" },
          upgrades: [
            {
              name: { fr: "Obus lourd", pt: "Carcassa pesada", ru: "Усиленный заряд", ja: "重装外殻", ko: "헤비 케이싱", zhHans: "重型弹壳", zhHant: "重型彈殼" },
              desc: { fr: "+8 de dégâts.", pt: "+8 de dano.", ru: "+8 к урону.", ja: "威力+8。", ko: "피해량 +8.", zhHans: "伤害+8。", zhHant: "傷害+8。" }
            },
            {
              name: { fr: "Rayon étendu", pt: "Raio ampliado", ru: "Увеличенный радиус", ja: "爆風拡大", ko: "폭발 반경 확장", zhHans: "扩大爆炸范围", zhHant: "擴大爆炸範圍" },
              desc: { fr: "+30% de rayon d'explosion.", pt: "+30% de raio de explosão.", ru: "+30% к радиусу взрыва.", ja: "爆発半径+30%。", ko: "폭발 반경 +30%.", zhHans: "爆炸半径+30%。", zhHant: "爆炸半徑+30%。" }
            },
            {
              name: { fr: "Composé explosif", pt: "Composto altamente explosivo", ru: "Бризантная смесь", ja: "高爆薬化合物", ko: "고폭약 합성물", zhHans: "高效炸药", zhHant: "高效炸藥" },
              desc: { fr: "+15 de dégâts.", pt: "+15 de dano.", ru: "+15 к урону.", ja: "威力+15。", ko: "피해량 +15.", zhHans: "伤害+15。", zhHant: "傷害+15。" }
            },
            {
              name: { fr: "Ogive de siège", pt: "Ogiva de cerco", ru: "Осадная боеголовка", ja: "シージ弾頭", ko: "공성 탄두", zhHans: "攻城弹头", zhHant: "攻城彈頭" },
              desc: { fr: "Obus massifs infligeant +100% de dégâts avec une zone d'impact dévastatrice.", pt: "Projéteis massivos causando +100% de dano com imensa área de impacto.", ru: "Сверхмощные снаряды: +100% к урону и сокрушительная площадь поражения.", ja: "威力+100%の巨大弾頭。超広範囲を一撃で壊滅。", ko: "피해량이 +100% 증가하고 파괴적인 폭발 범위를 지닌 거대 탄두를 발사합니다.", zhHans: "巨大炮弹造成+100%伤害并具有毁灭性爆炸范围。", zhHant: "巨大砲彈造成+100%傷害並具有毀滅性爆炸範圍。" }
            }
          ]
        },
        barrage: {
          name: { fr: "CADENCE", pt: "CADÊNCIA", ru: "СКОРОСТРЕЛЬНОСТЬ", ja: "射撃速度", ko: "발사 속도", zhHans: "射速", zhHant: "射速" },
          upgrades: [
            {
              name: { fr: "Chargeur rapide", pt: "Municiador rápido", ru: "Быстрое заряжание", ja: "高速装填", ko: "고속 장전기", zhHans: "快速装填", zhHant: "快速裝填" },
              desc: { fr: "+20% de cadence de tir.", pt: "+20% de cadência de tiro.", ru: "+20% к скорострельности.", ja: "発射速度+20%。", ko: "발사 속도 +20%.", zhHans: "射速+20%。", zhHant: "射速+20%。" }
            },
            {
              name: { fr: "Barillet automatique", pt: "Carrossel automatizado", ru: "Автоматический барабан", ja: "自動カルーセル", ko: "자동 캐러셀", zhHans: "自动弹盘", zhHant: "自動彈盤" },
              desc: { fr: "+25% de cadence de tir.", pt: "+25% de cadência de tiro.", ru: "+25% к скорострельности.", ja: "発射速度+25%。", ko: "발사 속도 +25%.", zhHans: "射速+25%。", zhHant: "射速+25%。" }
            },
            {
              name: { fr: "Tubes de tir jumelés", pt: "Tubos duplos de lançamento", ru: "Двойные мортиры", ja: "連装発射管", ko: "연장 발사관", zhHans: "双联发射管", zhHant: "雙聯發射管" },
              desc: { fr: "Tire 2 obus par salve.", pt: "Dispara 2 projéteis por salva.", ru: "Выпускает по 2 снаряда за залп.", ja: "1回の攻撃で2発の砲弾を斉射。", ko: "한 번에 2발의 포탄을 동시 발사합니다.", zhHans: "每次攻击齐射2发炮弹。", zhHant: "每次攻擊齊射2發砲彈。" }
            },
            {
              name: { fr: "Barrage à sous-munitions", pt: "Bombardeio de fragmentação", ru: "Кассетный шквал", ja: "クラスター弾幕", ko: "집속 폭격", zhHans: "集束弹幕", zhHant: "集束彈幕" },
              desc: { fr: "Chaque obus se divise en 4 sous-munitions explosives à l'impact.", pt: "Cada projétil se fragmenta em 4 submunições explosivas secundárias.", ru: "Каждый снаряд распадается на 4 вторичные разрывные бомбы.", ja: "各砲弾が着弾時に4個の小型子爆弾に分裂。", ko: "각 포탄이 폭발 시 4개의 2차 집속 자탄으로 분열합니다.", zhHans: "每发炮弹爆炸分裂为4枚二次爆破子炸弹。", zhHant: "每發砲彈爆炸分裂為4枚二次爆破子炸彈。" }
            }
          ]
        },
        napalm: {
          name: { fr: "NAPALM", pt: "NAPALM", ru: "НАПАЛМ", ja: "ナパーム", ko: "네이팜", zhHans: "凝固汽油", zhHant: "凝固汽油" },
          upgrades: [
            {
              name: { fr: "Résidu incendiaire", pt: "Resíduo incendiário", ru: "Зажигательный осадок", ja: "燃焼残留物", ko: "소이 잔류물", zhHans: "燃烧残渣", zhHant: "燃燒殘渣" },
              desc: { fr: "Les explosions embrasent les cibles pendant 2s.", pt: "As explosões incendeiam os alvos por 2s.", ru: "Взрывы поджигают цели на 2 с.", ja: "爆発が敵を2秒間炎上させる。", ko: "폭발이 적을 2초간 불태웁니다.", zhHans: "爆炸使目标着火2秒。", zhHant: "爆炸使目標著火2秒。" }
            },
            {
              name: { fr: "Mâchefer napalm", pt: "Escória de napalm", ru: "Напалмовая жижа", ja: "ナパームスラッグ", ko: "네이팜 슬래그", zhHans: "燃烧熔渣", zhHant: "燃燒熔渣" },
              desc: { fr: "Laisse une flaque enflammée au sol pendant 4s.", pt: "Deixa uma poça de fogo no chão por 4s.", ru: "Оставляет на земле пылающую лужу на 4 с.", ja: "地面に4秒間炎の海を形成。", ko: "지면에 4초간 불타는 웅덩이를 남깁니다.", zhHans: "在地面留存燃烧火海持续4秒。", zhHant: "在地面留存燃燒火海持續4秒。" }
            },
            {
              name: { fr: "Gel visqueux", pt: "Gel viscoso", ru: "Липкий гель", ja: "粘性ゲル", ko: "점착 젤", zhHans: "粘性凝胶", zhHant: "粘性凝膠" },
              desc: { fr: "Les flammes au sol ralentissent les ennemis de 25%.", pt: "O fogo no chão desacelera os inimigos em 25%.", ru: "Огонь на земле замедляет врагов на 25%.", ja: "炎の中の敵の移動速度を25%低下。", ko: "지면의 불길이 적의 이동 속도를 25% 늦춥니다.", zhHans: "地面火海使敌人减速25%。", zhHant: "地面火海使敵人減速25%。" }
            },
            {
              name: { fr: "Bassin d'enfer", pt: "Cratera do inferno", ru: "Пекло", ja: "ヘルファイアベースン", ko: "지옥불 분지", zhHans: "炼狱火海", zhHant: "煉獄火海" },
              desc: { fr: "Tempête de feu persistante brûlant continuellement les vagues ennemies.", pt: "Tempestade de fogo persistente que queima os inimigos continuamente.", ru: "Неугасающая огненная буря непрерывно сжигает толпы врагов.", ja: "巨大な持続火炎嵐が押し寄せる敵群を焼き尽くす。", ko: "통로 전체를 집어삼키는 거대한 화염 폭풍으로 지속 소각합니다.", zhHans: "巨大持久火海风暴持续焚烧所有涌来的敌人。", zhHant: "巨大持久火海風暴持續焚燒所有湧來的敵人。" }
            }
          ]
        }
      }
    },

    cryo: {
      name: { fr: "RELAIS DE GLACE", pt: "RELÉ DE GELO", ru: "КРИО-ИЗЛУЧАТЕЛЬ", ja: "フロスト", ko: "극저온 투사기", zhHans: "冷冻中继站", zhHant: "冷凍中繼站" },
      role: { fr: "CONTRÔLE", pt: "CONTROLE", ru: "ЗАМЕДЛЕНИЕ", ja: "敵足止め", ko: "군중 제어", zhHans: "群体控制", zhHant: "群體控制" },
      desc: {
        fr: "Émetteur cryogénique projetant de l'azote liquide pour ralentir les hordes.",
        pt: "Emissor criogênico projetando nitrogênio líquido para desacelerar as hordas.",
        ru: "Криогенный распылитель жидкого азота. Замедляет наступающие орды врагов.",
        ja: "極低温の液体窒素を噴射し、迫り来る敵群の進軍を麻痺させる。",
        ko: "액체 질소를 분사하여 쇄도하는 적 무리를 지연시키는 냉각 터렛.",
        zhHans: "低温发射器，喷射液氮以极大减缓敌潮的推进速度。",
        zhHant: "低溫發射器，噴射液氮以極大減緩敵潮的推進速度。"
      },
      paths: {
        refrigerant: {
          name: { fr: "RÉFRIGÉRANT", pt: "REFRIGERANTE", ru: "ХЛАДАГЕНТ", ja: "冷媒濃縮", ko: "냉각제", zhHans: "制冷剂", zhHant: "製冷劑" },
          upgrades: [
            {
              name: { fr: "Azote concentré", pt: "Nitrogênio concentrado", ru: "Концентрированный азот", ja: "濃縮窒素", ko: "농축 질소", zhHans: "浓缩液氮", zhHant: "濃縮液氮" },
              desc: { fr: "+10% d'intensité de ralentissement.", pt: "+10% na intensidade de lentidão.", ru: "+10% к силе замедления.", ja: "減速効果+10%。", ko: "감속 효과 +10%.", zhHans: "减速强度+10%。", zhHant: "減速強度+10%。" }
            },
            {
              name: { fr: "Choc thermique", pt: "Choque térmico", ru: "Термошок", ja: "熱衝撃", ko: "열충격", zhHans: "热冲击", zhHant: "熱衝擊" },
              desc: { fr: "Les ennemis ralentis subissent +15% de dégâts de toutes sources.", pt: "Inimigos lentos sofrem +15% de dano de todas as fontes.", ru: "Замедленные враги получают +15% урона из всех источников.", ja: "減速中の敵が全攻撃から受けるダメージ+15%。", ko: "감속된 적이 받는 모든 피해량이 +15% 증가합니다.", zhHans: "被减速的敌人受到来自所有来源的伤害+15%。", zhHant: "被減速的敵人受到來自所有來源的傷害+15%。" }
            },
            {
              name: { fr: "Gel profond", pt: "Congelamento profundo", ru: "Глубокая заморозка", ja: "ディープフリーズ", ko: "심층 동결", zhHans: "深度冻结", zhHant: "深度凍結" },
              desc: { fr: "Intensité de ralentissement portée à 60%.", pt: "Intensidade de lentidão aumentada para 60%.", ru: "Сила замедления увеличена до 60%.", ja: "減速効果が60%まで上昇。", ko: "감속 수치가 60%로 증가합니다.", zhHans: "减速效果提升至60%。", zhHant: "減速效果提升至60%。" }
            },
            {
              name: { fr: "Zéro absolu", pt: "Zero absoluto", ru: "Абсолютный ноль", ja: "絶対零度", ko: "절대 영도", zhHans: "绝对零度", zhHant: "絕對零度" },
              desc: { fr: "Les ennemis à portée sont entièrement gelés et immobilisés pendant 1.5s périodiquement.", pt: "Inimigos no alcance são completamente congelados por 1.5s periodicamente.", ru: "Враги в радиусе действия периодически намертво замерзают на 1.5 с.", ja: "範囲内の敵を周期的に1.5秒間完全凍結。", ko: "사거리 내 적들을 주기적으로 1.5초간 완전히 결빙시킵니다.", zhHans: "范围内的敌人会周期性被彻底冻结定身1.5秒。", zhHant: "範圍內的敵人會週期性被徹底凍結定身1.5秒。" }
            }
          ]
        },
        radius: {
          name: { fr: "RAYON", pt: "RAIO", ru: "РАДИУС", ja: "放射範囲", ko: "방사 범위", zhHans: "范围", zhHant: "範圍" },
          upgrades: [
            {
              name: { fr: "Diffuseur large", pt: "Difusor amplo", ru: "Широкий диффузор", ja: "広角ノズル", ko: "광각 디퓨저", zhHans: "广角喷口", zhHant: "廣角噴口" },
              desc: { fr: "+20% de zone de couverture.", pt: "+20% na área de cobertura.", ru: "+20% к площади покрытия.", ja: "効果範囲+20%。", ko: "적용 범위 +20%.", zhHans: "覆盖范围+20%。", zhHant: "覆蓋範圍+20%。" }
            },
            {
              name: { fr: "Jet sous pression", pt: "Jato pressurizado", ru: "Напорная струя", ja: "加圧ジェット", ko: "가압 제트", zhHans: "加压射流", zhHant: "加壓射流" },
              desc: { fr: "+25% de zone de couverture.", pt: "+25% na área de cobertura.", ru: "+25% к площади покрытия.", ja: "効果範囲+25%。", ko: "적용 범위 +25%.", zhHans: "覆盖范围+25%。", zhHant: "覆蓋範圍+25%。" }
            },
            {
              name: { fr: "Dispersion vortex", pt: "Dispersão em vórtice", ru: "Вихревое распыление", ja: "渦流拡散", ko: "소용돌이 분산", zhHans: "涡流扩散", zhHant: "渦流擴散" },
              desc: { fr: "+30% de zone de couverture.", pt: "+30% na área de cobertura.", ru: "+30% к площади покрытия.", ja: "効果範囲+30%。", ko: "적용 범위 +30%.", zhHans: "覆盖范围+30%。", zhHant: "覆蓋範圍+30%。" }
            },
            {
              name: { fr: "Dôme de blizzard", pt: "Cúpula de nevasca", ru: "Купол метели", ja: "ブリザードドーム", ko: "눈보라 돔", zhHans: "暴风雪穹顶", zhHant: "暴風雪穹頂" },
              desc: { fr: "Gigantesque blizzard englobant l'intégralité du carrefour.", pt: "Nevasca massiva cobrindo todo o cruzamento.", ru: "Колоссальная снежная буря, накрывающая весь перекресток целиком.", ja: "交差点全体を覆い尽くす巨大な猛吹雪を展開。", ko: "교차로 구역 전체를 뒤덮는 영구적인 한파 돔을 형성합니다.", zhHans: "笼罩整个十字路口的巨型暴风雪极寒领域。", zhHant: "籠罩整個十字路口的巨型暴風雪極寒領域。" }
            }
          ]
        },
        lethal: {
          name: { fr: "FROID MORTEL", pt: "FRIO LETAL", ru: "СМЕРТЕЛЬНЫЙ МОРОЗ", ja: "致死冷却", ko: "치명 냉각", zhHans: "致死严寒", zhHant: "致死嚴寒" },
          upgrades: [
            {
              name: { fr: "Cristaux de glace", pt: "Cristais de gelo", ru: "Ледяные осколки", ja: "氷晶破片", ko: "얼음 파편", zhHans: "冰晶碎屑", zhHant: "冰晶碎屑" },
              desc: { fr: "Le jet inflige 3 dégâts par seconde.", pt: "O spray criogênico causa 3 de dano por segundo.", ru: "Криоспрей наносит 3 урона в секунду.", ja: "冷却噴射が毎秒3ダメージを与える。", ko: "냉각 분사가 초당 3의 피해를 줍니다.", zhHans: "冷冻喷雾每秒造成3点伤害。", zhHant: "冷凍噴霧每秒造成3點傷害。" }
            },
            {
              name: { fr: "Siphon cassant", pt: "Sifão quebradiço", ru: "Хрупкий сифон", ja: "脆化抽出", ko: "취약 사이펀", zhHans: "脆化吸取", zhHant: "脆化吸取" },
              desc: { fr: "+5 dps ; les ennemis ralentis libèrent de la ferraille à leur mort.", pt: "+5 dps; inimigos lentos soltam sucata extra ao morrer.", ru: "+5 урона/с; замедленные враги роняют больше металлолома при гибели.", ja: "毎秒威力+5。減速中の敵死亡時にスクラップを放出。", ko: "초당 피해 +5; 감속된 적 처치 시 추가 고철을 떨어뜨립니다.", zhHans: "秒伤+5；被减速的敌人死亡时掉落额外废料。", zhHant: "秒傷+5；被減速的敵人死亡時掉落額外廢料。" }
            },
            {
              name: { fr: "Rupture hypothermique", pt: "Ruptura hipotérmica", ru: "Гипотермический разрыв", ja: "低体温崩壊", ko: "저체온 파열", zhHans: "低温破裂", zhHant: "低溫破裂" },
              desc: { fr: "+10 dps ; les hostiles givrés perdent toute armure.", pt: "+10 dps; inimigos congelados perdem a armadura.", ru: "+10 урона/с; обмороженные враги полностью теряют броню.", ja: "毎秒威力+10。凍てついた敵の装甲を粉砕。", ko: "초당 피해 +10; 빙결된 적의 방어력을 완전히 파괴합니다.", zhHans: "秒伤+10；受冻结的敌对目标彻底丧失护甲防护。", zhHant: "秒傷+10；受凍結的敵對目標徹底喪失護甲防護。" }
            },
            {
              name: { fr: "Éclatement glacial", pt: "Extinção por fragmentação", ru: "Осколочный коллапс", ja: "シャッター爆砕", ko: "빙결 분쇄", zhHans: "粉碎灭绝", zhHant: "粉碎滅絕" },
              desc: { fr: "Les ennemis gelés éclatent à leur mort, déclenchant des explosions de glace.", pt: "Inimigos congelados estilhaçam ao morrer, gerando explosões de gelo.", ru: "Замерзшие враги раскалываются на куски при смерти, вызывая ледяные взрывы.", ja: "凍結した敵が死亡時に破裂し、連鎖氷結爆発を誘発。", ko: "결빙된 적이 사망 시 산산조각 나며 2차 얼음 폭발을 일으킵니다.", zhHans: "被冻结的敌人死亡时粉碎，引发冰晶连环大爆炸。", zhHant: "被凍結的敵人死亡時粉碎，引發冰晶連環大爆炸。" }
            }
          ]
        }
      }
    }
  }
};

module.exports = data;
console.log("Loaded partial data, writing full data generator...");
