// Full 345 turret translations dictionary for all languages
// Traces of Rust

module.exports = {
  // Stats
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

  // 11 Turrets
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
    }
  }
};
