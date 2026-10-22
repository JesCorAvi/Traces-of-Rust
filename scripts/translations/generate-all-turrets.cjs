const fs = require('fs');
const path = require('path');

const turrets = {
  barracks: {
    name: { fr: "POSTE DE GARDE", pt: "POSTO DA GUARDA", ru: "КАЗАРМА", ja: "警備詰所", ko: "방어 초소", zhHans: "哨戒站", zhHant: "哨戒站" },
    role: { fr: "ESCOUADE ALLIÉE", pt: "ESQUADRÃO ALIADO", ru: "СОЮЗНЫЕ БОЙЦЫ", ja: "友軍歩兵", ko: "아군 분대", zhHans: "友军步兵", zhHant: "友軍步兵" },
    desc: {
      fr: "Déploie des unités synthétiques de combat pour intercepter et bloquer les ennemis sur la voie.",
      pt: "Posiciona unidades sintéticas de combate para interceptar e bloquear os inimigos no caminho.",
      ru: "Высаживает вооруженных синтетических бойцов для перехвата и блокирования врагов на пути.",
      ja: "戦闘用サイバネ兵を配置し、通路上の敵の進軍を肉弾阻止する。",
      ko: "통로에 합성 보병을 배치하여 적의 진격을 저지하고 교전합니다.",
      zhHans: "部署武装合成作战单位，在行进路线上拦截并阻滞敌人。",
      zhHant: "部署武裝合成作戰單位，在行進路線上攔截並阻滯敵人。"
    },
    paths: {
      recruitment: {
        name: { fr: "RECRUTEMENT", pt: "RECRUTAMENTO", ru: "ПОДГОТОВКА", ja: "増援配備", ko: "충원", zhHans: "动员招募", zhHant: "動員招募" },
        upgrades: [
          {
            name: { fr: "Clonage rapide", pt: "Clonagem rápida", ru: "Ускоренное клонирование", ja: "高速クローン", ko: "신속 복제", zhHans: "快速克隆", zhHant: "快速克隆" },
            desc: { fr: "Les synthétiques réapparaissent 25% plus vite.", pt: "Sintéticos ressurgem 25% mais rápido.", ru: "Синтетики возрождаются на 25% быстрее.", ja: "兵士の再出撃速度+25%。", ko: "합성병의 부활 속도가 25% 빨라집니다.", zhHans: "合成士兵的重生速度加快25%。", zhHant: "合成士兵的重生速度加快25%。" }
          },
          {
            name: { fr: "Escouade renforcée", pt: "Esquadrão reforçado", ru: "Усиленный взвод", ja: "部隊増員", ko: "분대 보강", zhHans: "编制扩充", zhHant: "編制擴充" },
            desc: { fr: "Déploie 3 soldats au lieu de 2.", pt: "Posiciona 3 soldados em vez de 2.", ru: "Высаживает 3 бойцов вместо 2.", ja: "出撃兵士数が2体から3体に増加。", ko: "배치되는 보병이 2명에서 3명으로 증가합니다.", zhHans: "部署3名士兵代替原有的2名。", zhHant: "部署3名士兵代替原有的2名。" }
          },
          {
            name: { fr: "Armure bio-alliage", pt: "Armadura de bio-liga", ru: "Био-сплавная броня", ja: "生体合金装甲", ko: "생체 합금 장갑", zhHans: "生物合金护甲", zhHant: "生物合金護甲" },
            desc: { fr: "Les unités alliées gagnent +50% de PV max.", pt: "Unidades aliadas ganham +50% de vida máxima.", ru: "Союзники получают +50% к максимальному запасу здоровья.", ja: "友軍兵士の最大HP+50%。", ko: "아군 유닛의 최대 생명력이 +50% 증가합니다.", zhHans: "友军单位获得+50%最大生命值。", zhHant: "友軍單位獲得+50%最大生命值。" }
          },
          {
            name: { fr: "Garde de fer", pt: "Divisão da guarda de ferro", ru: "Железная гвардия", ja: "アイアンガード師団", ko: "철갑 근위대", zhHans: "铁卫军团", zhHant: "鐵衛軍團" },
            desc: { fr: "Déploie 4 unités lourdement blindées capables de bloquer les mastodontes.", pt: "Posiciona 4 unidades com armadura pesada capazes de bloquear gigantes.", ru: "Высаживает 4 тяжелых штурмовика, способных сдерживать исполинов.", ja: "重装甲兵4体を配備。大型敵も完全に足止め。", ko: "대형 적도 완벽히 막아내는 4명의 중장갑 정예병을 배치합니다.", zhHans: "部署4名重装精锐装甲单位，能够阻挡巨型敌人。", zhHant: "部署4名重裝精銳裝甲單位，能夠阻擋巨型敵人。" }
          }
        ]
      },
      weaponry: {
        name: { fr: "ARMEMENT", pt: "ARMAMENTO", ru: "ВООРУЖЕНИЕ", ja: "兵装強化", ko: "무장 강화", zhHans: "军备", zhHant: "軍備" },
        upgrades: [
          {
            name: { fr: "Baïonnettes", pt: "Baionetas", ru: "Штыки", ja: "銃剣", ko: "총검", zhHans: "刺刀", zhHant: "刺刀" },
            desc: { fr: "+20% de dégâts de mêlée.", pt: "+20% de dano corpo a corpo.", ru: "+20% к урону в ближнем бою.", ja: "近接攻撃威力+20%。", ko: "근접 공격 피해량 +20%.", zhHans: "近战伤害+20%。", zhHant: "近戰傷害+20%。" }
          },
          {
            name: { fr: "Boucliers anti-émeute", pt: "Escudos de choque", ru: "Баллистические щиты", ja: "暴動鎮圧シールド", ko: "진압 방패", zhHans: "防暴盾牌", zhHant: "防暴盾牌" },
            desc: { fr: "Réduction des dégâts subis de 30%.", pt: "Redução de dano recebido em 30%.", ru: "Снижает получаемый урон на 30%.", ja: "被ダメージを30%軽減。", ko: "받는 피해량이 30% 감소합니다.", zhHans: "承受的伤害减免30%。", zhHant: "承受的傷害減免30%。" }
          },
          {
            name: { fr: "Matraques énergétiques", pt: "Bastões de choque", ru: "Шоковые дубинки", ja: "ショックバトン", ko: "충격 진압봉", zhHans: "高压电击棍", zhHant: "高壓電擊棍" },
            desc: { fr: "Les attaques étourdissent les ennemis pendant 0.8s.", pt: "Ataques atordoam inimigos por 0.8s.", ru: "Атаки оглушают врагов на 0.8 с.", ja: "攻撃命中時に敵を0.8秒間気絶。", ko: "공격 시 적을 0.8초간 기절시킵니다.", zhHans: "攻击命中时击晕敌人0.8秒。", zhHant: "攻擊命中時擊暈敵人0.8秒。" }
          },
          {
            name: { fr: "Lames nanites", pt: "Lâminas de nanites", ru: "Нано-клинки", ja: "ナノマシンブレード", ko: "나노 블레이드", zhHans: "纳米撕裂刃", zhHant: "奈米撕裂刃" },
            desc: { fr: "+60% de dégâts de mêlée et inflige un saignement violent.", pt: "+60% de dano corpo a corpo e inflige sangramento violento.", ru: "+60% к урону в ближнем бою и тяжелое кровотечение.", ja: "近接威力+60%。致命的な出血ダメージを付与。", ko: "근접 피해량 +60% 및 극심한 출혈 효과를 부여합니다.", zhHans: "近战伤害+60%并附加剧烈流血伤害。", zhHant: "近戰傷害+60%並附加劇烈流血傷害。" }
          }
        ]
      },
      fabrication: {
        name: { fr: "FABRICATION", pt: "FABRICAÇÃO", ru: "ПРОИЗВОДСТВО", ja: "自己補修", ko: "제조 프로토콜", zhHans: "装配制造", zhHant: "裝配製造" },
        upgrades: [
          {
            name: { fr: "Auto-sutureur", pt: "Auto-suturador", ru: "Авто-сшиватель", ja: "自動修復ナノマシン", ko: "자동 봉합기", zhHans: "自动缝合器", zhHant: "自動縫合器" },
            desc: { fr: "Les soldats régénèrent 5 PV par seconde.", pt: "Soldados regeneram 5 de vida por segundo.", ru: "Бойцы восстанавливают 5 ОЗ в секунду.", ja: "兵士が毎秒5HPを自動回復。", ko: "보병 유닛이 초당 5의 생명력을 재생합니다.", zhHans: "士兵每秒恢复5点生命值。", zhHant: "士兵每秒恢復5點生命值。" }
          },
          {
            name: { fr: "Injecteurs d'adrénaline", pt: "Injetores de adrenalina", ru: "Инъекторы адреналина", ja: "興奮剤インジェクター", ko: "아드레날린 주입기", zhHans: "肾上腺素注射器", zhHant: "腎上腺素注射器" },
            desc: { fr: "+25% de vitesse d'attaque.", pt: "+25% de velocidade de ataque.", ru: "+25% к скорости атаки.", ja: "攻撃速度+25%。", ko: "공격 속도 +25%.", zhHans: "攻击速度+25%。", zhHant: "攻擊速度+25%。" }
          },
          {
            name: { fr: "Épaulières à pointes", pt: "Ombreiras de espinhos", ru: "Шипастые наплечники", ja: "スパイクショルダー", ko: "가시 견갑", zhHans: "尖刺肩甲", zhHant: "尖刺肩甲" },
            desc: { fr: "Renvoie 30% des dégâts de mêlée subis à l'attaquant.", pt: "Reflete 30% do dano corpo a corpo recebido de volta ao atacante.", ru: "Отражает 30% полученного урона обратно во врага.", ja: "受けた近接ダメージの30%を敵に反射。", ko: "받은 근접 피해의 30%를 공격자에게 반사합니다.", zhHans: "将受到的近战伤害的30%反弹给攻击者。", zhHant: "將受到的近戰傷害的30%反彈給攻擊者。" }
          },
          {
            name: { fr: "Défibrillateur d'urgence", pt: "Desfibrilador de emergência", ru: "Аварийный дефибриллятор", ja: "緊急除細動器", ko: "긴급 제세동기", zhHans: "应急除颤仪", zhHant: "應急除顫儀" },
            desc: { fr: "Ressuscite instantanément les soldats tombés au combat une fois par vague.", pt: "Ressuscita soldados abatidos instantaneamente uma vez por onda.", ru: "Мгновенно воскрешает погибших бойцов один раз за волну.", ja: "ウェーブ毎に1度、倒れた兵士全員を即座に完全蘇生。", ko: "웨이브당 1회, 전사한 모든 보병을 즉시 전원 부활시킵니다.", zhHans: "每波战斗中可瞬间复活所有阵亡的士兵一次。", zhHant: "每波戰鬥中可瞬間復活所有陣亡的士兵一次。" }
          }
        ]
      }
    }
  },

  support: {
    name: { fr: "ATELIER TACTIQUE", pt: "OFICINA TÁTICA", ru: "МАСТЕРСКАЯ", ja: "戦術工房", ko: "전술 정비소", zhHans: "战术工坊", zhHant: "戰術工坊" },
    role: { fr: "AMPLIFICATEUR", pt: "AMPLIFICADOR", ru: "ПОДДЕРЖКА", ja: "戦術支援", ko: "증폭 지원", zhHans: "战术增益", zhHant: "戰術增益" },
    desc: {
      fr: "Tour de soutien augmentant la cadence, la puissance et la portée des tourelles adjacentes.",
      pt: "Torre de suporte que amplia a cadência, alcance e poder das torretas próximas.",
      ru: "Башня поддержки. Увеличивает скорострельность, урон и дальность соседних турелей.",
      ja: "周囲の全タレットの攻撃速度・威力・射程を強化する後方支援拠点。",
      ko: "주변 모든 터렛의 공격 속도, 피해량 및 사거리를 증폭시키는 지원 터렛.",
      zhHans: "战术后勤中心，大幅提升周围临近防御塔的射速、威力和射程。",
      zhHant: "戰術後勤中心，大幅提升周圍鄰近防禦塔的射速、威力和射程。"
    },
    paths: {
      overclock: {
        name: { fr: "SURCADENÇAGE", pt: "OVERCLOCK", ru: "РАЗГОН", ja: "オーバークロック", ko: "오버클럭", zhHans: "超频驱动", zhHant: "超頻驅動" },
        upgrades: [
          {
            name: { fr: "Refroidissement liquide", pt: "Refrigeração líquida", ru: "Жидкостное охлаждение", ja: "水冷クーラー", ko: "수랭 냉각", zhHans: "水冷装置", zhHant: "水冷裝置" },
            desc: { fr: "+15% de cadence pour les tourelles à portée.", pt: "+15% de cadência para torretas no alcance.", ru: "+15% к скорострельности соседних турелей.", ja: "範囲内タレットの攻撃速度+15%。", ko: "범위 내 터렛의 공격 속도 +15%.", zhHans: "范围内防御塔射速+15%。", zhHant: "範圍內防禦塔射速+15%。" }
          },
          {
            name: { fr: "Câblage en cuivre pur", pt: "Fiação de cobre", ru: "Медная проводка", ja: "超伝導配線", ko: "구리 배선", zhHans: "纯铜线缆", zhHant: "純銅線纜" },
            desc: { fr: "+20% de cadence pour les tourelles à portée.", pt: "+20% de cadência para torretas no alcance.", ru: "+20% к скорострельности соседних турелей.", ja: "範囲内タレットの攻撃速度+20%。", ko: "범위 내 터렛의 공격 속도 +20%.", zhHans: "范围内防御塔射速+20%。", zhHant: "範圍內防禦塔射速+20%。" }
          },
          {
            name: { fr: "Fréquence de résonance", pt: "Frequência de ressonância", ru: "Резонансная частота", ja: "共振パルス", ko: "공진 주파수", zhHans: "共振频率", zhHant: "共振頻率" },
            desc: { fr: "+25% de cadence pour les tourelles à portée.", pt: "+25% de cadência para torretas no alcance.", ru: "+25% к скорострельности соседних турелей.", ja: "範囲内タレットの攻撃速度+25%。", ko: "범위 내 터렛의 공격 속도 +25%.", zhHans: "范围内防御塔射速+25%。", zhHant: "範圍內防禦塔射速+25%。" }
          },
          {
            name: { fr: "Cœur de surcadençage", pt: "Núcleo de overclock", ru: "Ядро гиперразгона", ja: "オーバークロックコア", ko: "오버클럭 코어", zhHans: "终极超频核心", zhHant: "終極超頻核心" },
            desc: { fr: "+40% de cadence de tir pour toutes les tourelles dans l'aura.", pt: "+40% de cadência para todas as torretas na aura.", ru: "+40% к скорострельности всех турелей в ауре.", ja: "オーラ内の全タレットの攻撃速度が破格の+40%。", ko: "오라 안의 모든 터렛의 공격 속도가 대폭 +40% 증가합니다.", zhHans: "光环内所有防御塔射速激增+40%。", zhHant: "光環內所有防禦塔射速激增+40%。" }
          }
        ]
      },
      power: {
        name: { fr: "PUISSANCE", pt: "POTÊNCIA", ru: "МОЩНОСТЬ", ja: "火力増幅", ko: "출력 증폭", zhHans: "强攻增幅", zhHant: "強攻增幅" },
        upgrades: [
          {
            name: { fr: "Ravitaillement lourd", pt: "Munição de alto calibre", ru: "Крупнокалиберный патронташ", ja: "高威嚇弾薬補給", ko: "대구경 탄약 공급", zhHans: "重型弹药配给", zhHant: "重型彈藥配給" },
            desc: { fr: "+15% de dégâts pour les tourelles adjacentes.", pt: "+15% de dano para torretas adjacentes.", ru: "+15% к урону соседних турелей.", ja: "隣接タレットのダメージ+15%。", ko: "인접 터렛의 피해량 +15%.", zhHans: "邻近防御塔伤害+15%。", zhHant: "鄰近防禦塔傷害+15%。" }
          },
          {
            name: { fr: "Amplificateur cinétique", pt: "Amplificador cinético", ru: "Кинетический усилитель", ja: "運動エネルギー増幅器", ko: "운동 에너지 증폭기", zhHans: "动能放大器", zhHant: "動能放大器" },
            desc: { fr: "+20% de dégâts pour les tourelles adjacentes.", pt: "+20% de dano para torretas adjacentes.", ru: "+20% к урону соседних турелей.", ja: "隣接タレットのダメージ+20%。", ko: "인접 터렛의 피해량 +20%.", zhHans: "邻近防御塔伤害+20%。", zhHant: "鄰近防禦塔傷害+20%。" }
          },
          {
            name: { fr: "Perforateurs cinétiques", pt: "Munição perfurante", ru: "Бронебойные присадки", ja: "徹甲弾頭供給", ko: "철갑 공급선", zhHans: "全自动穿甲组件", zhHant: "全自動穿甲組件" },
            desc: { fr: "+1 transpercement pour toutes les armes balistiques à portée.", pt: "+1 de perfuração para todas as armas balísticas no alcance.", ru: "+1 к пробитию для всего стрелкового оружия в радиусе.", ja: "範囲内の全実弾兵器に貫通+1を付与。", ko: "사거리 내 모든 실탄 무기에 관통 +1을 부여합니다.", zhHans: "使范围内所有弹道防御塔穿透+1。", zhHant: "使範圍內所有彈道防禦塔穿透+1。" }
          },
          {
            name: { fr: "Résonance létale", pt: "Ressonância letal", ru: "Смертельный резонанс", ja: "致死共鳴フィールド", ko: "치명적 공명", zhHans: "致死共振裂变", zhHant: "致死共振裂變" },
            desc: { fr: "+35% de dégâts et +15% de chances de coup critique dans l'aura.", pt: "+35% de dano e +15% de chance de crítico na aura.", ru: "+35% к урону и +15% к шансу крита для всех турелей в ауре.", ja: "オーラ内の全タレットの威力+35%、会心率+15%。", ko: "오라 내 모든 터렛의 피해량 +35% 및 치명타 확률 +15% 증가.", zhHans: "光环内全塔伤害+35%且暴击率+15%。", zhHant: "光環內全塔傷害+35%且暴擊率+15%。" }
          }
        ]
      },
      radar: {
        name: { fr: "RADAR", pt: "RADAR", ru: "РАДАР", ja: "索敵レーダー", ko: "탐지 레이더", zhHans: "雷达探测", zhHant: "雷達探測" },
        upgrades: [
          {
            name: { fr: "Réseau de capteurs", pt: "Conjunto de sensores", ru: "Сенсорная решетка", ja: "センサーアレイ", ko: "센서 어레이", zhHans: "传感器阵列", zhHant: "傳感器陣列" },
            desc: { fr: "+20% de portée pour les tourelles environnantes.", pt: "+20% de alcance para torretas ao redor.", ru: "+20% к дальности окружающих турелей.", ja: "周囲のタレットの射程+20%。", ko: "주변 터렛의 사거리 +20%.", zhHans: "周围防御塔射程+20%。", zhHant: "周圍防禦塔射程+20%。" }
          },
          {
            name: { fr: "Calculateur de tir", pt: "Computador de mira", ru: "Баллистический вычислитель", ja: "射撃管制コンピュータ", ko: "사격 통제 컴퓨터", zhHans: "火控计算终端", zhHant: "火控計算終端" },
            desc: { fr: "+25% de portée pour les tourelles environnantes.", pt: "+25% de alcance para torretas ao redor.", ru: "+25% к дальности окружающих турелей.", ja: "周囲のタレットの射程+25%。", ko: "주변 터렛의 사거리 +25%.", zhHans: "周围防御塔射程+25%。", zhHant: "周圍防禦塔射程+25%。" }
          },
          {
            name: { fr: "Pistage prédictif", pt: "Rastreamento preditivo", ru: "Упреждающий захват", ja: "弾道予測システム", ko: "예측 조준 연동", zhHans: "预判弹道索敌", zhHant: "預判彈道索敵" },
            desc: { fr: "Les tirs ne manquent jamais leur cible et révèlent les ennemis invisibles.", pt: "Tiros nunca erram e revelam inimigos camuflados.", ru: "Турели никогда не промахиваются и видят замаскированных врагов.", ja: "タレットの命中率が100%になり、隠蔽された敵も捕捉。", ko: "사격이 빗나가지 않으며 은신한 적을 즉시 탐지합니다.", zhHans: "所有攻击绝对命中且可自动勘破伪装隐形敌人。", zhHant: "所有攻擊絕對命中且可自動勘破偽裝隱形敵人。" }
          },
          {
            name: { fr: "Liaison orbitale", pt: "Enlace orbital", ru: "Орбитальный канал", ja: "衛星リンク中継", ko: "궤도 위성 링크", zhHans: "轨道卫星直连", zhHant: "軌道衛星直連" },
            desc: { fr: "+40% de portée et +20% de chances de coup critique pour tout le secteur.", pt: "+40% de alcance e +20% de chance de crítico para todo o setor.", ru: "+40% к дальности и +20% к шансу крита для всего сектора.", ja: "区画全体のタレット射程+40%、会心率+20%。", ko: "해당 구역 터렛 사거리 +40% 및 치명타 확률 +20% 부여.", zhHans: "防区内全塔射程+40%且暴击率+20%。", zhHant: "防區內全塔射程+40%且暴擊率+20%。" }
          }
        ]
      }
    }
  },

  tesla: {
    name: { fr: "BOBINE TESLA", pt: "BOBINA DE TESLA", ru: "КАТУШКА ТЕСЛА", ja: "テスラコイル", ko: "테슬라 코일", zhHans: "特斯拉电圈", zhHant: "特斯拉電圈" },
    role: { fr: "CHAÎNE ÉLECTRIQUE", pt: "CADEIA ELÉTRICA", ru: "ЦЕПНАЯ МОЛНИЯ", ja: "連鎖電撃", ko: "연쇄 전격", zhHans: "连锁电击", zhHant: "連鎖電擊" },
    desc: {
      fr: "Projette des arcs électriques à haute tension ricochant entre de multiples cibles.",
      pt: "Dispara arcos elétricos de alta tensão que ricocheteiam entre múltiplos alvos.",
      ru: "Высоковольтная катушка. Поражает врагов ветвящимися разрядами молний.",
      ja: "高電圧のアーク放電を発生させ、密集する敵群へ電撃を連鎖させる。",
      ko: "고전압 전격을 방출하여 다수의 적에게 번개를 연쇄시킵니다.",
      zhHans: "释放高压电弧，在群聚的敌对目标之间跳跃传导连环电击。",
      zhHant: "釋放高壓電弧，在群聚的敵對目標之間跳躍傳導連環電擊。"
    },
    paths: {
      chain: {
        name: { fr: "REBONDS", pt: "RICOCHETES", ru: "ВЕТВЛЕНИЕ", ja: "連鎖拡大", ko: "연쇄 도약", zhHans: "连锁传导", zhHant: "連鎖傳導" },
        upgrades: [
          {
            name: { fr: "Nœud supplémentaire", pt: "Nó adicional", ru: "Дополнительный узел", ja: "補助電極", ko: "추가 전극", zhHans: "额外导电节点", zhHant: "額外導電節點" },
            desc: { fr: "+2 rebonds d'arc électrique.", pt: "+2 saltos de arco elétrico.", ru: "+2 отскока дуги молнии.", ja: "電撃の連鎖数+2。", ko: "전격 연쇄 횟수 +2.", zhHans: "电弧跳跃目标+2。", zhHant: "電弧跳躍目標+2。" }
          },
          {
            name: { fr: "Diviseur d'arc", pt: "Divisor de arco", ru: "Расщепитель дуги", ja: "アークスプリッター", ko: "아크 분할기", zhHans: "电弧分流器", zhHant: "電弧分流器" },
            desc: { fr: "+3 rebonds d'arc électrique.", pt: "+3 saltos de arco elétrico.", ru: "+3 отскока дуги молнии.", ja: "電撃の連鎖数+3。", ko: "전격 연쇄 횟수 +3.", zhHans: "电弧跳跃目标+3。", zhHant: "電弧跳躍目標+3。" }
          },
          {
            name: { fr: "Bobine supra-conductrice", pt: "Bobina supercondutora", ru: "Сверхпроводящая катушка", ja: "超伝導コイル", ko: "초전도 코일", zhHans: "超导线圈", zhHant: "超導線圈" },
            desc: { fr: "+4 rebonds et +15% de dégâts par saut.", pt: "+4 saltos e +15% de dano por salto.", ru: "+4 отскока и +15% урона за каждый перескок.", ja: "連鎖数+4、跳躍毎にダメージ+15%増加。", ko: "연쇄 횟수 +4 및 도약할 때마다 피해량 +15% 증가.", zhHans: "跳跃+4次，且每次跳跃伤害递增15%。", zhHant: "跳躍+4次，且每次跳躍傷害遞增15%。" }
          },
          {
            name: { fr: "Tempête d'éclairs", pt: "Tempestade de relâmpagos", ru: "Грозовой шторм", ja: "ライトニングストーム", ko: "번개 폭풍", zhHans: "雷霆万钧风暴", zhHant: "雷霆萬鈞風暴" },
            desc: { fr: "L'arc se propage à 12 ennemis sans aucune perte de puissance.", pt: "O arco se propaga para até 12 inimigos sem perda de dano.", ru: "Молния поражает до 12 врагов подряд без снижения мощности.", ja: "最大12体の敵へ威力衰減なしで連鎖電撃を炸裂。", ko: "피해량 감소 없이 최대 12명의 적에게 번개가 연쇄됩니다.", zhHans: "电弧最多传导至12个目标，且无任何伤害衰减。", zhHant: "電弧最多傳導至12個目標，且無任何傷害衰減。" }
          }
        ]
      },
      voltage: {
        name: { fr: "TENSION", pt: "VOLTAGEM", ru: "НАПРЯЖЕНИЕ", ja: "電圧出力", ko: "전압 상승", zhHans: "高压电势", zhHant: "高壓電勢" },
        upgrades: [
          {
            name: { fr: "Transformateur élévateur", pt: "Transformador elevador", ru: "Повышающий трансформатор", ja: "昇圧変圧器", ko: "승압 변압기", zhHans: "升压变压器", zhHant: "升壓變壓器" },
            desc: { fr: "+20% de dégâts électriques.", pt: "+20% de dano elétrico.", ru: "+20% к урону электричеством.", ja: "電撃威力+20%。", ko: "전격 피해량 +20%.", zhHans: "电击伤害+20%。", zhHant: "電擊傷害+20%。" }
          },
          {
            name: { fr: "Diélectrique lourd", pt: "Dielétrico pesado", ru: "Тяжелый диэлектрик", ja: "高耐圧絶縁体", ko: "고내압 유전체", zhHans: "高强介质板", zhHant: "高強介質板" },
            desc: { fr: "+35% de dégâts électriques.", pt: "+35% de dano elétrico.", ru: "+35% к урону электричеством.", ja: "電撃威力+35%。", ko: "전격 피해량 +35%.", zhHans: "电击伤害+35%。", zhHant: "電擊傷害+35%。" }
          },
          {
            name: { fr: "Décharge plasma", pt: "Descarga de plasma", ru: "Плазменный разряд", ja: "プラズマ放電", ko: "플라스마 방전", zhHans: "等离子释放", zhHant: "等離子釋放" },
            desc: { fr: "+50% de dégâts électriques.", pt: "+50% de dano elétrico.", ru: "+50% к урону электричеством.", ja: "電撃威力+50%。", ko: "전격 피해량 +50%.", zhHans: "电击伤害+50%。", zhHant: "電擊傷害+50%。" }
          },
          {
            name: { fr: "Cataclysme haute tension", pt: "Cataclismo de alta tensão", ru: "Высоковольтный катаклизм", ja: "高電圧カタクリズム", ko: "초고전압 파멸", zhHans: "高压绝灭天劫", zhHant: "高壓絕滅天劫" },
            desc: { fr: "Frappes d'éclairs cataclysmiques infligeant 300% de dégâts.", pt: "Golpes de relâmpago cataclísmicos causando 300% de dano.", ru: "Сокрушительные удары молний, наносящие 300% урона.", ja: "超高圧の雷撃が300%の破滅的ダメージを炸裂。", ko: "300%의 막대한 번개 강타로 적들을 소멸시킵니다.", zhHans: "降下造成300%伤害的毁灭性终极天雷神罚。", zhHant: "降下造成300%傷害的毀滅性終極天雷神罰。" }
          }
        ]
      },
      overcharge: {
        name: { fr: "SURCHARGE", pt: "SOBRECARGA", ru: "ПЕРЕГРУЗКА", ja: "過負荷放電", ko: "과부하", zhHans: "超载脉冲", zhHant: "超載脈衝" },
        upgrades: [
          {
            name: { fr: "Champ statique", pt: "Campo estático", ru: "Статическое поле", ja: "静電場", ko: "정전기장", zhHans: "静电场域", zhHant: "靜電場域" },
            desc: { fr: "Ralentit les ennemis électrocutés de 20%.", pt: "Desacelera inimigos eletrocutados em 20%.", ru: "Замедляет пораженных врагов на 20%.", ja: "感電した敵の移動速度を20%低下。", ko: "감전된 적을 20% 감속시킵니다.", zhHans: "触电敌人移动速度降低20%。", zhHant: "觸電敵人移動速度降低20%。" }
          },
          {
            name: { fr: "Décharge capacitive", pt: "Descarga capacitiva", ru: "Емкостной взрыв", ja: "蓄電爆発", ko: "축전 방전", zhHans: "电容爆散", zhHant: "電容爆散" },
            desc: { fr: "Les cibles explosent à leur mort en une décharge électrique de zone.", pt: "Inimigos explodem ao morrer gerando dano elétrico em área.", ru: "Враги взрываются при смерти, создавая электрическую волну.", ja: "倒された敵が放電爆発を起こし周囲を巻き込む。", ko: "감전된 적 사망 시 폭발하여 주변에 전격 범위 피해를 입힙니다.", zhHans: "被电击目标死亡时发生爆炸造成电能范围伤害。", zhHant: "被電擊目標死亡時發生爆炸造成電能範圍傷害。" }
          },
          {
            name: { fr: "Impulsion EMP", pt: "Pulso EMP", ru: "ЭМИ-импульс", ja: "EMPパルス", ko: "EMP 펄스", zhHans: "电磁脉冲EMP", zhHant: "電磁脈衝EMP" },
            desc: { fr: "Les décharges étourdissent les ennemis pendant 1.0s.", pt: "Choques atordoam os inimigos por 1.0s.", ru: "Разряды оглушают врагов на 1.0 с.", ja: "電撃が敵を1秒間麻痺・気絶させる。", ko: "전격 공격이 적을 1.0초간 기절시킵니다.", zhHans: "所有电击命中时击晕敌人1.0秒。", zhHant: "所有電擊命中時擊暈敵人1.0秒。" }
          },
          {
            name: { fr: "Foudre globulaire", pt: "Relâmpago globular", ru: "Шаровая молния", ja: "球状稲妻", ko: "구상 번개", zhHans: "球状闪电核心", zhHant: "球狀閃電核心" },
            desc: { fr: "Émet périodiquement des orbes électriques flottants qui foudroient tout le couloir.", pt: "Emite periodicamente esferas elétricas flutuantes que eletrocutam o corredor.", ru: "Периодически выпускает парящие шаровые молнии, зачищающие весь проход.", ja: "通路を浮遊し周囲を焼き尽くす高密度プラズマ球を継続放出。", ko: "통로를 부유하며 지속적으로 번개를 방출하는 구상 번개를 생성합니다.", zhHans: "周期性释放悬浮漫步电球，持续轰杀行进路线上的所有敌人。", zhHant: "週期性釋放懸浮漫步電球，持續轟殺行進路線上的所有敵人。" }
          }
        ]
      }
    }
  },

  incinerator: {
    name: { fr: "INCINÉRATEUR DE FOSSE", pt: "INCINERADOR DE VALA", ru: "ТРАНШЕЙНЫЙ ОГНЕМЕТ", ja: "塹壕焼却炉", ko: "참호 소각포", zhHans: "壕沟焚化炉", zhHant: "壕溝焚化爐" },
    role: { fr: "LANCE-FLAMMES", pt: "LANÇA-CHAMAS", ru: "ОГНЕВОЙ ЗАСЛОН", ja: "火炎放射", ko: "화염 방사", zhHans: "喷火覆盖", zhHant: "噴火覆蓋" },
    desc: {
      fr: "Projette un cône de flammes continues calcinant les vagues ennemies compactes.",
      pt: "Projeta um cone contínuo de fogo calcinando grupos densos de inimigos.",
      ru: "Выпускает непрерывный конус бушующего пламени, сжигая плотные толпы врагов.",
      ja: "高温の業火を前方に放射し、密集した敵群をまとめて焼き払う。",
      ko: "전방 부채꼴 범위에 고열 화염을 방사하여 몰려오는 적들을 불태웁니다.",
      zhHans: "持续喷射高热锥形烈焰，无情焦化密集涌来的敌潮。",
      zhHant: "持續噴射高熱錐形烈焰，無情焦化密集湧來的敵潮。"
    },
    paths: {
      fuel: {
        name: { fr: "CARBURANT", pt: "COMBUSTÍVEL", ru: "ТОПЛИВО", ja: "高熱燃料", ko: "연료 혼합", zhHans: "燃料调配", zhHant: "燃料調配" },
        upgrades: [
          {
            name: { fr: "Pétrole lourd", pt: "Petróleo pesado", ru: "Тяжелая нефть", ja: "重質原油", ko: "중유 공급", zhHans: "重质原油", zhHant: "重質原油" },
            desc: { fr: "+15% de dégâts de flammes.", pt: "+15% de dano de fogo.", ru: "+15% к урону пламени.", ja: "火炎ダメージ+15%。", ko: "화염 피해량 +15%.", zhHans: "火焰伤害+15%。", zhHant: "火焰傷害+15%。" }
          },
          {
            name: { fr: "Additif magnésium", pt: "Aditivo de magnésio", ru: "Магниевая присадка", ja: "マグネシウム配合", ko: "마그네슘 첨가제", zhHans: "镁粉添加剂", zhHant: "鎂粉添加劑" },
            desc: { fr: "+25% de dégâts de flammes.", pt: "+25% de dano de fogo.", ru: "+25% к урону пламени.", ja: "火炎ダメージ+25%。", ko: "화염 피해량 +25%.", zhHans: "火焰伤害+25%。", zhHant: "火焰傷害+25%。" }
          },
          {
            name: { fr: "Bouillie pyrophorique", pt: "Mistura pirofórica", ru: "Пирофорная суспензия", ja: "自然発火スラリー", ko: "발화성 슬러리", zhHans: "发火油胶", zhHant: "發火油膠" },
            desc: { fr: "+40% de dégâts de flammes.", pt: "+40% de dano de fogo.", ru: "+40% к урону пламени.", ja: "火炎ダメージ+40%。", ko: "화염 피해량 +40%.", zhHans: "火焰伤害+40%。", zhHant: "火焰傷害+40%。" }
          },
          {
            name: { fr: "Phosphore blanc pur", pt: "Fósforo branco puro", ru: "Белый фосфор", ja: "純白リン火", ko: "순수 백린", zhHans: "绝密白磷", zhHant: "絕密白磷" },
            desc: { fr: "Les flammes dissolvent la santé ennemie en ignorant entièrement l'armure.", pt: "As chamas dissolvem a vida do inimigo, ignorando totalmente a armadura.", ru: "Пламя прожигает врагов насквозь, полностью игнорируя броню.", ja: "装甲を完全無視し、敵の生命力を直接溶かし尽くす。", ko: "적의 방어력을 100% 무시하고 체력을 직접 증발시킵니다.", zhHans: "完全无视敌人护甲防护，直接溶解蒸发生命值。", zhHant: "完全無視敵人護甲防護，直接溶解蒸發生命值。" }
          }
        ]
      },
      pressure: {
        name: { fr: "PRESSION", pt: "PRESSÃO", ru: "ДАВЛЕНИЕ", ja: "噴射圧力", ko: "분사 압력", zhHans: "射流压力", zhHant: "射流壓力" },
        upgrades: [
          {
            name: { fr: "Buse étroite", pt: "Bocal estreito", ru: "Узкое сопло", ja: "収束ノズル", ko: "집속 노즐", zhHans: "收束喷嘴", zhHant: "收束噴嘴" },
            desc: { fr: "+25% de portée de flammes.", pt: "+25% de alcance das chamas.", ru: "+25% к дальности струи.", ja: "火炎射程+25%。", ko: "화염 사거리 +25%.", zhHans: "火焰喷射距离+25%。", zhHant: "火焰噴射距離+25%。" }
          },
          {
            name: { fr: "Soufflerie haute puissance", pt: "Soprador de alta saída", ru: "Нагнетатель турбины", ja: "高圧ブロワー", ko: "고출력 송풍기", zhHans: "高压鼓风机", zhHant: "高壓鼓風機" },
            desc: { fr: "+35% de portée de flammes.", pt: "+35% de alcance das chamas.", ru: "+35% к дальности струи.", ja: "火炎射程+35%。", ko: "화염 사거리 +35%.", zhHans: "火焰喷射距离+35%。", zhHant: "火焰噴射距離+35%。" }
          },
          {
            name: { fr: "Double buse large", pt: "Bocais duplos", ru: "Сдвоенные форсунки", ja: "広角ツインノズル", ko: "광각 트윈 노즐", zhHans: "双联广角喷嘴", zhHant: "雙聯廣角噴嘴" },
            desc: { fr: "Diffuse les flammes en un cône à 90 degrés.", pt: "Espalha as chamas em um cone amplo de 90 graus.", ru: "Распыляет пламя широким веером в 90 градусов.", ja: "火炎を90度の広角コーン状に一斉放射。", ko: "화염을 90도 부채꼴 범위로 넓게 분사합니다.", zhHans: "将喷射烈焰扩展为90度广角覆盖扇面。", zhHant: "將噴射烈焰擴展為90度廣角覆蓋扇面。" }
          },
          {
            name: { fr: "Canon tempête de feu", pt: "Canhão tempestade de fogo", ru: "Огнемет «Огненный смерч»", ja: "ファイアストームカノン", ko: "화염 폭풍포", zhHans: "焚天火暴巨炮", zhHant: "焚天火暴巨砲" },
            desc: { fr: "Balaie l'intégralité du couloir avec un torrent de flammes à ultra-longue portée.", pt: "Varre todo o corredor com um rio de fogo de alcance extremo.", ru: "Выжигает весь коридор гигантским потоком пламени невероятной дальности.", ja: "超長距離の劫火で回廊全域を一撃で焼き尽くす。", ko: "초장거리 화염 격류로 통로 전체를 완전히 삼켜버립니다.", zhHans: "超长射程火龙贯穿整条走廊，焦土灭绝。", zhHant: "超長射程火龍貫穿整條走廊，焦土滅絕。" }
          }
        ]
      },
      napalm: {
        name: { fr: "NAPALM", pt: "NAPALM", ru: "НАПАЛМ", ja: "ナパーム粘着", ko: "지면 잔류", zhHans: "粘滞火海", zhHant: "粘滯火海" },
        upgrades: [
          {
            name: { fr: "Résidu de goudron", pt: "Resíduo de alcatrão", ru: "Смоляной осадок", ja: "タール残留物", ko: "타르 잔류물", zhHans: "焦油残存", zhHant: "焦油殘存" },
            desc: { fr: "Les flammes persistent au sol pendant 3s.", pt: "As chamas permanecem no chão por 3s.", ru: "Огонь горит на земле в течение 3 с.", ja: "地面が3秒間炎上し続ける。", ko: "지면에 불길이 3초간 잔류합니다.", zhHans: "烈焰在地面留存燃烧3秒。", zhHant: "烈焰在地面留存燃燒3秒。" }
          },
          {
            name: { fr: "Carburant gélifié", pt: "Combustível viscoso", ru: "Вязкое горючее", ja: "高粘度ゲル燃料", ko: "점성 젤 연료", zhHans: "稠化胶质燃料", zhHant: "稠化膠質燃料" },
            desc: { fr: "+50% de durée des flaques et ralentit les ennemis de 20%.", pt: "+50% de duração da poça e desacelera inimigos em 20%.", ru: "+50% к длительности луж и замедление врагов на 20%.", ja: "炎上時間が50%延長し、通過する敵を20%減速。", ko: "불길 지속 시간 +50% 및 통과하는 적 20% 감속.", zhHans: "地面火海持续时间+50%，且使敌人减速20%。", zhHant: "地面火海持續時間+50%，且使敵人減速20%。" }
          },
          {
            name: { fr: "Terre brûlée", pt: "Terra arrasada", ru: "Выжженная земля", ja: "焦土作戦", ko: "초토화", zhHans: "焦土炼狱", zhHant: "焦土煉獄" },
            desc: { fr: "Les flaques enflamment des sections entières de passage.", pt: "Poças de fogo cobrem seções inteiras de passagem.", ru: "Огненные лужи покрывают целые участки прохода.", ja: "通過ルート全域を逃げ場のない火炎地獄へと変貌させる。", ko: "이동 경로 전체를 영구적인 불길 구역으로 덮어버립니다.", zhHans: "燃烧火海连成一片，彻底封锁大段通道。", zhHant: "燃燒火海連成一片，徹底封鎖大段通道。" }
          },
          {
            name: { fr: "Zone de conflagration", pt: "Zona de conflagração", ru: "Зона всесожжения", ja: "恒久火炎地帯", ko: "영구 발화 지대", zhHans: "绝对焦土禁区", zhHant: "絕對焦土禁區" },
            desc: { fr: "Le sol reste perpétuellement en feu pendant toute la durée de la vague.", pt: "O chão permanece em chamas permanentemente durante toda a onda.", ru: "Земля горит непрерывно на протяжении всей волны.", ja: "ウェーブ終了まで地面が永遠に燃え盛り続ける。", ko: "웨이브가 끝날 때까지 지면의 불길이 절대 꺼지지 않습니다.", zhHans: "整波防御期间地面永不熄灭，化作绝对死亡陷阱。", zhHant: "整波防禦期間地面永不熄滅，化作絕對死亡陷阱。" }
          }
        ]
      }
    }
  },

  railgun: {
    name: { fr: "CANON ÉLECTROMAGNÉTIQUE", pt: "CANHÃO ELÉTRICO", ru: "РЕЛЬСОТРОН", ja: "レールガン", ko: "키네틱 레일건", zhHans: "磁轨电磁炮", zhHant: "磁軌電磁砲" },
    role: { fr: "TIREUR D'ÉLITE", pt: "ATIRADOR DE ELITE", ru: "СНАЙПЕР", ja: "長距離狙撃", ko: "저격 관통", zhHans: "穿甲狙击", zhHant: "穿甲狙擊" },
    desc: {
      fr: "Accélérateur magnétique longue portée tirant des projectiles cinétiques dévastateurs en ligne droite.",
      pt: "Acelerador magnético de longo alcance que dispara projéteis cinéticos em linha reta.",
      ru: "Дальнобойный электромагнитный ускоритель. Пробивает врагов по прямой линии.",
      ja: "超音速の電磁投射弾で直線の全敵を一撃で貫通する長距離砲。",
      ko: "초장거리에서 직선상의 모든 적을 일격에 꿰뚫는 강력한 레일건.",
      zhHans: "超远射程电磁加速巨炮，发射高能动能弹穿透直线所有目标。",
      zhHant: "超遠射程電磁加速巨砲，發射高能動能彈穿透直線所有目標。"
    },
    paths: {
      caliber: {
        name: { fr: "CALIBRE", pt: "CALIBRE", ru: "КАЛИБР", ja: "弾頭重量", ko: "탄두 구경", zhHans: "重型穿甲弹", zhHant: "重型穿甲彈" },
        upgrades: [
          {
            name: { fr: "Tungstène appauvri", pt: "Tungstênio empobrecido", ru: "Обедненный вольфрам", ja: "タングステン弾頭", ko: "열화 텅스텐", zhHans: "贫铀钨合金", zhHant: "貧鈾鎢合金" },
            desc: { fr: "+25% de dégâts.", pt: "+25% de dano.", ru: "+25% к урону.", ja: "威力+25%。", ko: "피해량 +25%.", zhHans: "伤害+25%。", zhHant: "傷害+25%。" }
          },
          {
            name: { fr: "Projectiles hyper-véloces", pt: "Projéteis hipervelozes", ru: "Гиперзвуковые снаряды", ja: "超音速弾", ko: "극초음속 탄환", zhHans: "高超音速重弹", zhHant: "高超音速重彈" },
            desc: { fr: "+40% de dégâts.", pt: "+40% de dano.", ru: "+40% к урону.", ja: "威力+40%。", ko: "피해량 +40%.", zhHans: "伤害+40%。", zhHant: "傷害+40%。" }
          },
          {
            name: { fr: "Pénétrateur lourd", pt: "Penetrador pesado", ru: "Тяжелый бронебой", ja: "重装甲貫通弾", ko: "헤비 관통자", zhHans: "重型动能穿甲针", zhHant: "重型動能穿甲針" },
            desc: { fr: "+60% de dégâts et perfore les blindages les plus résistants.", pt: "+60% de dano e perfura as blindagens mais pesadas.", ru: "+60% к урону и пробитие любой тяжелой брони.", ja: "威力+60%。重装甲の敵も一撃で貫徹。", ko: "피해량 +60% 및 최중장갑 적도 관통합니다.", zhHans: "伤害+60%且无视任何重装甲护板。", zhHant: "傷害+60%且無視任何重裝甲護板。" }
          },
          {
            name: { fr: "Tige Titan", pt: "Haste de Titã", ru: "Титановый стержень", ja: "タイタンロッド", ko: "타이탄 철심", zhHans: "泰坦钨棒", zhHant: "泰坦鎢棒" },
            desc: { fr: "Anéantit tous les ennemis en ligne droite avec +150% de dégâts.", pt: "Aniquila todos os inimigos em linha com +150% de dano.", ru: "Стирает в пыль всех врагов на линии выстрела с +150% урона.", ja: "威力+150%。射線上の敵性体を跡形もなく蒸発させる。", ko: "피해량이 +150% 증가하며 직선상의 모든 적을 즉시 분쇄합니다.", zhHans: "造成+150%伤害，彻底抹杀射线上的一切目标。", zhHant: "造成+150%傷害，徹底抹殺射線上的一切目標。" }
          }
        ]
      },
      coils: {
        name: { fr: "BOBINES", pt: "BOBINAS", ru: "КАТУШКИ", ja: "加速コイル", ko: "코일 충전", zhHans: "加速线圈", zhHant: "加速線圈" },
        upgrades: [
          {
            name: { fr: "Condensateurs rapides", pt: "Capacitores rápidos", ru: "Быстрые конденсаторы", ja: "急速放電コンデンサ", ko: "급속 방전 축전기", zhHans: "快充储能电容", zhHant: "快充儲能電容" },
            desc: { fr: "+20% de cadence de tir.", pt: "+20% de cadência de tiro.", ru: "+20% к скорострельности.", ja: "射撃速度+20%。", ko: "발사 속도 +20%.", zhHans: "射速+20%。", zhHant: "射速+20%。" }
          },
          {
            name: { fr: "Aimants supraconducteurs", pt: "Ímãs supercondutores", ru: "Сверхпроводящие магниты", ja: "超伝導磁石", ko: "초전도 자석", zhHans: "超导电磁体", zhHant: "超導電磁體" },
            desc: { fr: "+25% de cadence de tir.", pt: "+25% de cadência de tiro.", ru: "+25% к скорострельности.", ja: "射撃速度+25%。", ko: "발사 속도 +25%.", zhHans: "射速+25%。", zhHant: "射速+25%。" }
          },
          {
            name: { fr: "Système à double bobine", pt: "Sistema de bobina dupla", ru: "Двухконтурная система", ja: "デュアルコイル機構", ko: "이중 코일 시스템", zhHans: "双回路加速系统", zhHant: "雙迴路加速系統" },
            desc: { fr: "+30% de cadence de tir.", pt: "+30% de cadência de tiro.", ru: "+30% к скорострельности.", ja: "射撃速度+30%。", ko: "발사 속도 +30%.", zhHans: "射速+30%。", zhHant: "射速+30%。" }
          },
          {
            name: { fr: "Rechargeur cinétique continu", pt: "Recarregador cinético contínuo", ru: "Кинетический автозарядник", ja: "超高速キネティック給弾", ko: "키네틱 연속 자동장전", zhHans: "全自动动能重装终端", zhHant: "全自動動能重裝終端" },
            desc: { fr: "Tire un projectile hyper-pénétrant toutes les 1.8 secondes.", pt: "Dispara um projétil de alta penetração a cada 1.8 segundos.", ru: "Выпускает тяжелые пробивающие снаряды каждые 1.8 секунды.", ja: "超高威力の貫通徹甲弾をわずか1.8秒毎に乱射。", ko: "강력한 관통 탄환을 1.8초마다 연속으로 발사합니다.", zhHans: "每隔1.8秒即可发射一枚贯穿毁灭性极速重弹。", zhHant: "每隔1.8秒即可發射一枚貫穿毀滅性極速重彈。" }
          }
        ]
      },
      scope: {
        name: { fr: "OPTIQUE", pt: "ÓPTICA", ru: "ОПТИКА", ja: "照準光学", ko: "조준경", zhHans: "光学锁敌", zhHant: "光學鎖敵" },
        upgrades: [
          {
            name: { fr: "Radar longue portée", pt: "Radar de longo alcance", ru: "Дальнобойный радар", ja: "長距離レーダー", ko: "장거리 레이더", zhHans: "超视距雷达", zhHant: "超視距雷達" },
            desc: { fr: "+25% de portée de visée.", pt: "+25% de alcance de mira.", ru: "+25% к дальности обнаружения.", ja: "照準射程+25%。", ko: "조준 사거리 +25%.", zhHans: "锁定射程+25%。", zhHant: "鎖定射程+25%。" }
          },
          {
            name: { fr: "Analyse des points faibles", pt: "Análise de pontos fracos", ru: "Анализ уязвимостей", ja: "急所解析アルゴリズム", ko: "약점 분석", zhHans: "弱点弱项解构", zhHant: "弱點弱項解構" },
            desc: { fr: "+20% de chances de coup critique.", pt: "+20% de chance de crítico.", ru: "+20% к шансу крита.", ja: "会心率+20%。", ko: "치명타 확률 +20%.", zhHans: "暴击几率+20%。", zhHant: "暴擊機率+20%。" }
          },
          {
            name: { fr: "Viseur thermique", pt: "Mira térmica", ru: "Тепловизор", ja: "熱源センサー照準器", ko: "열화상 조준경", zhHans: "热成像瞄具", zhHant: "熱成像瞄具" },
            desc: { fr: "+35% de portée de visée.", pt: "+35% de alcance de mira.", ru: "+35% к дальности обнаружения.", ja: "照準射程+35%。", ko: "조준 사거리 +35%.", zhHans: "锁定射程+35%。", zhHant: "鎖定射程+35%。" }
          },
          {
            name: { fr: "Matrice de verrouillage absolu", pt: "Matriz de trava de mira", ru: "Матрица захвата целей", ja: "絶対ロックオンアレイ", ko: "타겟 락 어레이", zhHans: "全景锁定阵列", zhHant: "全景鎖定陣列" },
            desc: { fr: "Coups critiques garantis à 100% contre les boss et les cibles blindées prioritaires.", pt: "Críticos garantidos contra chefes e alvos blindados prioritários.", ru: "100% гарантированные криты по боссам и бронированным целям.", ja: "ボスおよび最重要装甲目標に対し100%クリティカル確定。", ko: "보스 및 최우선 장갑 목표에게 100% 확정 치명타가 적중합니다.", zhHans: "对首领与高优先级重装甲目标绝对100%触发暴击。", zhHant: "對首領與高優先級重裝甲目標絕對100%觸發暴擊。" }
          }
        ]
      }
    }
  },

  collector: {
    name: { fr: "CONDENSEUR DE FERRAILLE", pt: "CONDENSADOR DE SUCATA", ru: "СБОРЩИК ЛОМА", ja: "スクラップ濃縮機", ko: "고철 수집기", zhHans: "废料冷凝回收站", zhHant: "廢料冷凝回收站" },
    role: { fr: "ÉCONOMIE", pt: "ECONOMIA", ru: "ДОБЫЧА", ja: "資源回収", ko: "경제 지원", zhHans: "经济支持", zhHant: "經濟支持" },
    desc: {
      fr: "Condenseur à vide aspirant la ferraille et générant des dividendes passifs.",
      pt: "Condensador a vácuo que puxa sucata e gera dividendos passivos.",
      ru: "Промышленный пылесос-накопитель. Собирает металлолом и пассивно генерирует прибыль.",
      ja: "戦場のスクラップを自動吸引し、波次終了時に莫大なボーナス物資を供給する。",
      ko: "주변 고철을 진공 흡입하고 주기적으로 추가 자원을 생산하는 경제 시설.",
      zhHans: "工业强力真空冷凝塔，自动吸纳周边废料并被动提供持续资金收益。",
      zhHant: "工業強力真空冷凝塔，自動吸納周邊廢料並被動提供持續資金收益。"
    },
    paths: {
      yield: {
        name: { fr: "RENDEMENT", pt: "RENDIMENTO", ru: "ДОБЫЧА", ja: "回収効率", ko: "수확량", zhHans: "产能收益", zhHant: "產能收益" },
        upgrades: [
          {
            name: { fr: "Siphon magnétique", pt: "Sifão magnético", ru: "Магнитный сифон", ja: "磁気吸引サイフォン", ko: "자석 사이펀", zhHans: "磁吸分流器", zhHant: "磁吸分流器" },
            desc: { fr: "+25% de rayon de ramassage de ferraille.", pt: "+25% de raio de coleta de sucata.", ru: "+25% к радиусу сбора лома.", ja: "スクラップ吸引範囲+25%。", ko: "고철 획득 반경 +25%.", zhHans: "废料吸取半径+25%。", zhHant: "廢料吸取半徑+25%。" }
          },
          {
            name: { fr: "Trieur centrifuge", pt: "Separador centrífugo", ru: "Центробежный сортировщик", ja: "遠心分離ソーター", ko: "원심 분리기", zhHans: "离心分选机", zhHant: "離心分選機" },
            desc: { fr: "+10% de ferraille gagnée par butin.", pt: "+10% de sucata obtida por item caído.", ru: "+10% лома за каждый трофей.", ja: "ドロップ毎のスクラップ獲得量+10%。", ko: "드롭당 획득 고철 +10%.", zhHans: "每次拾取获得的废料+10%。", zhHant: "每次拾取獲得的廢料+10%。" }
          },
          {
            name: { fr: "Chambre de compression", pt: "Câmara de compressão", ru: "Компрессионная камера", ja: "高圧コンプレッサー室", ko: "압축 챔버", zhHans: "加压压缩舱", zhHant: "加壓壓縮艙" },
            desc: { fr: "+20% de ferraille gagnée par butin.", pt: "+20% de sucata obtida por item caído.", ru: "+20% лома за каждый трофей.", ja: "ドロップ毎のスクラップ獲得量+20%。", ko: "드롭당 획득 고철 +20%.", zhHans: "每次拾取获得的废料+20%。", zhHant: "每次拾取獲得的廢料+20%。" }
          },
          {
            name: { fr: "Fonderie moléculaire", pt: "Fundição molecular", ru: "Молекулярный переплавщик", ja: "分子製錬炉", ko: "분자 제련소", zhHans: "分子重组重熔炉", zhHant: "分子重組重熔爐" },
            desc: { fr: "Double la valeur de toute la ferraille et aspire automatiquement les butins sur toute la carte.", pt: "Dobra o valor de toda a sucata e suga automaticamente itens de todo o mapa.", ru: "Удваивает весь добываемый лом и автоматически собирает его по всей карте.", ja: "全スクラップの価値が2倍になり、全マップのドロップを自動全回収。", ko: "모든 고철 가치가 2배가 되며 맵 전체의 고철을 자동 진공 수거합니다.", zhHans: "所有废料价值翻倍，且自动全图瞬间吸附所有战利品。", zhHant: "所有廢料價值翻倍，且自動全圖瞬間吸附所有戰利品。" }
          }
        ]
      },
      logistics: {
        name: { fr: "LOGISTIQUE", pt: "LOGÍSTICA", ru: "ЛОГИСТИКА", ja: "自動搬送", ko: "물류", zhHans: "物流运输", zhHant: "物流運輸" },
        upgrades: [
          {
            name: { fr: "Drones coursiers", pt: "Drones mensageiros", ru: "Дроны-курьеры", ja: "運搬ドローン", ko: "운반 드론", zhHans: "无人机货运", zhHant: "無人機貨運" },
            desc: { fr: "Augmente la portée de collecte de 30%.", pt: "Aumenta o alcance de coleta em 30%.", ru: "Увеличивает дальность сбора на 30%.", ja: "スクラップ吸引範囲+30%。", ko: "수집 반경이 30% 증가합니다.", zhHans: "拾取范围扩大30%。", zhHant: "拾取範圍擴大30%。" }
          },
          {
            name: { fr: "Convoyeur rapide", pt: "Esteira rápida", ru: "Скоростной конвейер", ja: "高速コンベア", ko: "고속 컨베이어", zhHans: "高速传送带", zhHant: "高速傳送帶" },
            desc: { fr: "Génère passivement +1 ferraille toutes les 5s.", pt: "Gera passivamente +1 de sucata a cada 5s.", ru: "Пассивно производит +1 лом каждые 5 с.", ja: "5秒毎に+1スクラップを自動生成。", ko: "5초마다 자동으로 고철 +1을 생산합니다.", zhHans: "每5秒被动产出+1废料。", zhHant: "每5秒被動產出+1廢料。" }
          },
          {
            name: { fr: "Distribution pneumatique", pt: "Distribuição pneumática", ru: "Пневмопочта", ja: "空気圧配管輸送", ko: "공압 배송망", zhHans: "气动管道网络", zhHant: "氣動管道網絡" },
            desc: { fr: "Génère passivement +2 ferraille toutes les 4s.", pt: "Gera passivamente +2 de sucata a cada 4s.", ru: "Пассивно производит +2 лома каждые 4 с.", ja: "4秒毎に+2スクラップを自動生成。", ko: "4초마다 자동으로 고철 +2를 생산합니다.", zhHans: "每4秒被动产出+2废料。", zhHant: "每4秒被動產出+2廢料。" }
          },
          {
            name: { fr: "Fonderie automatisée", pt: "Fundição automatizada", ru: "Автоматический литейный цех", ja: "自動製錬プラント", ko: "전자동 제련 파운드리", zhHans: "全自动重工业铸造厂", zhHant: "全自動重工業鑄造廠" },
            desc: { fr: "Produit un flux continu de ferraille et réduit le coût de toutes les améliorations de 15%.", pt: "Produz sucata continuamente e dá 15% de desconto em melhorias.", ru: "Непрерывно производит лом и дает скидку 15% на все улучшения.", ja: "スクラップを常時大量生成し、全タレットの強化費用を15%割引。", ko: "지속적으로 고철을 생성하며 모든 터렛 업그레이드 비용을 15% 할인합니다.", zhHans: "不间断提供大量废料流，并使全场防御塔升级费用降低15%。", zhHant: "不間斷提供大量廢料流，並使全場防禦塔升級費用降低15%。" }
          }
        ]
      },
      reserve: {
        name: { fr: "RÉSERVE", pt: "RESERVA", ru: "РЕЗЕРВ", ja: "緊急備蓄", ko: "비축 자원", zhHans: "战略储备", zhHant: "戰略儲備" },
        upgrades: [
          {
            name: { fr: "Trémie renforcée", pt: "Tremonha reforçada", ru: "Укрепленный бункер", ja: "強化ホッパー", ko: "강화 호퍼", zhHans: "加固料斗", zhHant: "加固料斗" },
            desc: { fr: "Remboursement des tourelles vendues augmenté de 10%.", pt: "Reembolso ao vender torretas aumentado em 10%.", ru: "Возврат средств при продаже турелей увеличен на 10%.", ja: "タレット売却時の返還率+10%。", ko: "터렛 판매 시 환급률이 10% 증가합니다.", zhHans: "出售防御塔时获得的折价返还增加10%。", zhHant: "出售防禦塔時獲得的折價返還增加10%。" }
          },
          {
            name: { fr: "Batterie d'urgence", pt: "Bateria de emergência", ru: "Аварийная батарея", ja: "非常用キャパシタ", ko: "비상 배터리", zhHans: "备用应急电池", zhHant: "備用應急電池" },
            desc: { fr: "Octroie +50 ferraille à la fin de chaque vague.", pt: "Concede +50 de sucata ao concluir cada onda.", ru: "Дает +50 лома по завершении каждой волны.", ja: "ウェーブ防衛成功毎に追加スクラップ+50。", ko: "웨이브 클리어 시마다 고철 +50을 추가 지급합니다.", zhHans: "每顺利完成一波防守即奖励+50废料。", zhHant: "每順利完成一波防守即獎勵+50廢料。" }
          },
          {
            name: { fr: "Silo en titane", pt: "Silo de titânio", ru: "Титановый силос", ja: "チタンサイロ", ko: "티타늄 격납고", zhHans: "钛金战略储藏仓", zhHant: "鈦金戰略儲藏倉" },
            desc: { fr: "Octroie +100 ferraille à la fin de chaque vague.", pt: "Concede +100 de sucata ao concluir cada onda.", ru: "Дает +100 лома по завершении каждой волны.", ja: "ウェーブ防衛成功毎に追加スクラップ+100。", ko: "웨이브 클리어 시마다 고철 +100을 추가 지급합니다.", zhHans: "每顺利完成一波防守即奖励+100废料。", zhHant: "每順利完成一波防守即獎勵+100廢料。" }
          },
          {
            name: { fr: "Chambre forte stratégique", pt: "Cofre de reserva estratégica", ru: "Стратегическое хранилище", ja: "戦略金庫プロトコル", ko: "전략 비축 금고", zhHans: "中央储备金库", zhHant: "中央儲備金庫" },
            desc: { fr: "Donne immédiatement 250 ferraille et +25% d'intérêts en fin de vague.", pt: "Concede instantaneamente 250 de sucata e +25% de juros no fim da onda.", ru: "Мгновенно дает 250 лома и +25% дивидендов в конце каждой волны.", ja: "即座に250スクラップを獲得し、ウェーブ毎に所持金25%の利息配当を獲得。", ko: "즉시 고철 250을 획득하며 매 웨이브마다 25%의 이자 배당을 지급합니다.", zhHans: "立即到账250废料，且每波结束结算时获得25%的高额利息分红。", zhHant: "立即到賬250廢料，且每波結束結算時獲得25%的高額利息分紅。" }
          }
        ]
      }
    }
  },

  press: {
    name: { fr: "PRESSE À PISTON", pt: "PRENSA DE PISTÃO", ru: "ПРЕСС", ja: "レールプレス", ko: "피스톤 프레스", zhHans: "轨道重压机", zhHant: "軌道重壓機" },
    role: { fr: "CONTRÔLE AU SOL", pt: "CONTROLE DE CURTO ALCANCE", ru: "РАЗДАВЛИВАНИЕ", ja: "近接粉砕", ko: "근접 압쇄", zhHans: "近程碾碎", zhHant: "近程碾碎" },
    desc: {
      fr: "Lourd marteau mécanique s'abattant sur les ennemis qui passent avec d'immenses dégâts d'écrasement.",
      pt: "Martelo mecânico pesado que esmaga os inimigos que passam com dano brutal.",
      ru: "Тяжелый молот-трамбовщик. Обрушивается на проходящих врагов с сокрушительной силой.",
      ja: "通過する敵の上から超重量油圧ハンマーを叩きつけ、骨肉ごと圧砕する。",
      ko: "통과하는 적의 머리 위로 거대한 기계 해머를 내리쳐 짓밟습니다.",
      zhHans: "沉重的机械锻压重锤，猛烈下砸将途经的敌人彻底碾碎粉身碎骨。",
      zhHant: "沉重的機械鍛壓重錘，猛烈下砸將途經的敵人徹底碾碎粉身碎骨。"
    },
    paths: {
      pressure: {
        name: { fr: "PRESSION", pt: "PRESSÃO", ru: "ДАВЛЕНИЕ", ja: "油圧強化", ko: "압쇄력", zhHans: "压强冲击", zhHant: "壓強衝擊" },
        upgrades: [
          {
            name: { fr: "Pistons pneumatiques", pt: "Pistões pneumáticos", ru: "Пневмопоршни", ja: "空圧ピストン", ko: "공압 피스톤", zhHans: "气动活塞", zhHant: "氣動活塞" },
            desc: { fr: "+20% de dégâts d'écrasement.", pt: "+20% de dano de esmagamento.", ru: "+20% к урону раздавливания.", ja: "圧砕威力+20%。", ko: "압쇄 피해량 +20%.", zhHans: "碾压伤害+20%。", zhHant: "碾壓傷害+20%。" }
          },
          {
            name: { fr: "Surmultiplication hydraulique", pt: "Sobrecarga hidráulica", ru: "Гидравлический форсаж", ja: "高圧油圧ブースト", ko: "유압 오버드라이브", zhHans: "液压强袭增压", zhHant: "液壓強襲增壓" },
            desc: { fr: "+35% de dégâts d'écrasement.", pt: "+35% de dano de esmagamento.", ru: "+35% к урону раздавливания.", ja: "圧砕威力+35%。", ko: "압쇄 피해량 +35%.", zhHans: "碾压伤害+35%。", zhHant: "碾壓傷害+35%。" }
          },
          {
            name: { fr: "Enclume renforcée", pt: "Bigorna reforçada", ru: "Усиленная наковальня", ja: "強化アンビル", ko: "강화 모루", zhHans: "重铸硬砧", zhHant: "重鑄硬砧" },
            desc: { fr: "+50% de dégâts d'écrasement.", pt: "+50% de dano de esmagamento.", ru: "+50% к урону раздавливания.", ja: "圧砕威力+50%。", ko: "압쇄 피해량 +50%.", zhHans: "碾压伤害+50%。", zhHant: "碾壓傷害+50%。" }
          },
          {
            name: { fr: "Broyeur industriel", pt: "Triturador industrial", ru: "Промышленный крушитель", ja: "インダストリアルクラッシャー", ko: "산업용 분쇄기", zhHans: "重工业碎裂巨砧", zhHant: "重工業碎裂巨砧" },
            desc: { fr: "Écrase instantanément les ennemis ayant moins de 30% de PV ; dégâts colossaux contre les boss.", pt: "Esmaga instantaneamente inimigos com menos de 30% de vida; dano massivo contra chefes.", ru: "Мгновенно давит врагов с менее чем 30% ОЗ; колоссальный урон боссам.", ja: "HP30%以下の敵を一撃即死。ボスに対しても致命的な特大ダメージ。", ko: "체력 30% 미만 적 즉사 처형; 보스에게 막대한 추가 피해.", zhHans: "瞬间碾碎秒杀生命低于30%的普通敌人；对首领造成毁天灭地的巨额伤害。", zhHant: "瞬間碾碎秒殺生命低於30%的普通敵人；對首領造成毀天滅地的巨額傷害。" }
          }
        ]
      },
      cadence: {
        name: { fr: "CADENCE", pt: "CADÊNCIA", ru: "СКОРОСТЬ", ja: "打撃頻度", ko: "타격 주기", zhHans: "重砸速率", zhHant: "重砸速率" },
        upgrades: [
          {
            name: { fr: "Contrepoids équilibré", pt: "Contrapeso equilibrado", ru: "Балансировочный противовес", ja: "カウンターウェイト", ko: "평형추", zhHans: "配重平衡锤", zhHant: "配重平衡錘" },
            desc: { fr: "+20% de vitesse d'abattement.", pt: "+20% de velocidade de batida.", ru: "+20% к частоте ударов.", ja: "叩きつけ速度+20%。", ko: "강타 속도 +20%.", zhHans: "下砸频率+20%。", zhHant: "下砸頻率+20%。" }
          },
          {
            name: { fr: "Double cylindre hydraulique", pt: "Cilindro hidráulico duplo", ru: "Двойной гидроцилиндр", ja: "デュアル油圧シリンダー", ko: "이중 유압 실린더", zhHans: "双联液压油缸", zhHant: "雙聯液壓油缸" },
            desc: { fr: "+25% de vitesse d'abattement.", pt: "+25% de velocidade de batida.", ru: "+25% к частоте ударов.", ja: "叩きつけ速度+25%。", ko: "강타 속도 +25%.", zhHans: "下砸频率+25%。", zhHant: "下砸頻率+25%。" }
          },
          {
            name: { fr: "Soupape à retour rapide", pt: "Válvula de retorno rápido", ru: "Клапан быстрого сброса", ja: "高速復帰バルブ", ko: "고속 복귀 밸브", zhHans: "快速回位阀", zhHant: "快速回位閥" },
            desc: { fr: "+30% de vitesse d'abattement.", pt: "+30% de velocidade de batida.", ru: "+30% к частоте ударов.", ja: "叩きつけ速度+30%。", ko: "강타 속도 +30%.", zhHans: "下砸频率+30%。", zhHant: "下砸頻率+30%。" }
          },
          {
            name: { fr: "Ouragan de pistons", pt: "Furacão de pistões", ru: "Поршневой ураган", ja: "ピストンハリケーン", ko: "피스톤 허리케인", zhHans: "连续冲击风暴", zhHant: "連續衝擊風暴" },
            desc: { fr: "S'abat en continu avec de violentes ondes de choc sismiques.", pt: "Bate continuamente com violentas ondas de choque sísmicas.", ru: "Бьет без остановки, вызывая непрерывные сейсмические волны.", ja: "絶え間なくピストン連打を浴びせ、地鳴りの衝撃波を連発。", ko: "지진급 충격파와 함께 쉬지 않고 연속으로 짓밟습니다.", zhHans: "如狂风暴雨般极速连续轰击，并向外释放大范围地震冲击波。", zhHant: "如狂風暴雨般極速連續轟擊，並向外釋放大範圍地震衝擊波。" }
          }
        ]
      },
      weight: {
        name: { fr: "MASSE & IMPACT", pt: "PESO E ATORDOAMENTO", ru: "МАССА И СТАН", ja: "重量気絶", ko: "충격 기절", zhHans: "重量震慑", zhHant: "重量震懾" },
        upgrades: [
          {
            name: { fr: "Base en plomb", pt: "Base de chumbo", ru: "Свинцовая плита", ja: "鉛ベース", ko: "납 베이스", zhHans: "铅铸底座", zhHant: "鉛鑄底座" },
            desc: { fr: "Les écrasements étourdissent les ennemis pendant 0.5s.", pt: "Batidas atordoam inimigos por 0.5s.", ru: "Удары оглушают врагов на 0.5 с.", ja: "叩きつけ命中時に敵を0.5秒間気絶。", ko: "내리칠 때마다 적을 0.5초간 기절시킵니다.", zhHans: "每次重击使受击敌人眩晕0.5秒。", zhHant: "每次重擊使受擊敵人眩暈0.5秒。" }
          },
          {
            name: { fr: "Secousse sismique", pt: "Tremor sísmico", ru: "Сейсмический толчок", ja: "サイズミックショック", ko: "지진 진동", zhHans: "震荡地波", zhHant: "震盪地波" },
            desc: { fr: "Durée d'étourdissement portée à 1.0s sur une zone plus étendue.", pt: "Duração do atordoamento aumentada para 1.0s em área mais ampla.", ru: "Оглушение увеличено до 1.0 с в более широкой области.", ja: "広範囲の敵を1秒間気絶。", ko: "더 넓은 범위의 적을 1.0초간 기절시킵니다.", zhHans: "眩晕时长提升至1.0秒，并扩大影响范围。", zhHant: "眩暈時長提升至1.0秒，並擴大影響範圍。" }
          },
          {
            name: { fr: "Masse en tungstène", pt: "Peso de tungstênio", ru: "Вольфрамовый груз", ja: "タングステンウェイト", ko: "텅스텐 추", zhHans: "致密钨块", zhHant: "緻密鎢塊" },
            desc: { fr: "Durée d'étourdissement portée à 1.5s ; repousse les ennemis en arrière.", pt: "Duração do atordoamento para 1.5s; empurra inimigos para trás.", ru: "Оглушение увеличено до 1.5 с; отталкивает врагов назад.", ja: "気絶時間1.5秒。強烈な衝撃で敵を後退させる。", ko: "기절 시간 1.5초 증가; 적을 뒤로 강하게 밀쳐냅니다.", zhHans: "眩晕时长增至1.5秒，并将敌人向后强力击退。", zhHant: "眩暈時長增至1.5秒，並將敵人向後強力擊退。" }
          },
          {
            name: { fr: "Impact tectonique", pt: "Impacto tectônico", ru: "Тектонический удар", ja: "テクトニックインパクト", ko: "지각 격돌", zhHans: "板块断层冲击", zhHant: "板塊斷層衝擊" },
            desc: { fr: "Déclenche un étourdissement dévastateur de 3s et pulvérise définitivement l'armure.", pt: "Desencadeia atordoamento devastador de 3s e destrói a armadura permanentemente.", ru: "Вызывает мощнейший 3-секундный стан и навсегда сдирает броню.", ja: "破滅的な3秒間気絶を叩き込み、敵の装甲を永久粉砕。", ko: "파괴적인 3초 기절을 부여하고 적의 방어력을 영구 분쇄합니다.", zhHans: "引发毁灭性的3秒长效眩晕，并彻底永久剥夺目标护甲防护。", zhHant: "引發毀滅性的3秒長效眩暈，並徹底永久剝奪目標護甲防護。" }
          }
        ]
      }
    }
  },

  ejector: {
    name: { fr: "ÉJECTEUR HYDRAULIQUE", pt: "EJETOR HIDRÁULICO", ru: "ГИДРОТОЛКАТЕЛЬ", ja: "油圧エジェクター", ko: "유압식 사출기", zhHans: "液压斥力发射机", zhHant: "液壓斥力發射機" },
    role: { fr: "RÉPULSION", pt: "DESLOCAMENTO", ru: "ОТБРАСЫВАНИЕ", ja: "敵吹き飛ばし", ko: "위치 밀치기", zhHans: "强制位移", zhHant: "強制位移" },
    desc: {
      fr: "Répulseur à ondes pneumatiques projetant violemment les ennemis en arrière sur la voie.",
      pt: "Repulsor pneumático de ondas que arremessa os inimigos para trás no trajeto.",
      ru: "Пневматический импульсный излучатель. Отбрасывает врагов назад по рельсам.",
      ja: "強力な圧縮衝撃波を放ち、侵入してきた敵群をまとめて通路の奥へと吹き飛ばす。",
      ko: "압축 충격파를 발사하여 통로의 적들을 뒤로 거세게 날려버리는 밀치기 터렛.",
      zhHans: "气动冲击斥力发射器，将通路上的敌人狂暴地轰退推回起点方向。",
      zhHant: "氣動衝擊斥力發射器，將通路上的敵人狂暴地轟退推回起點方向。"
    },
    paths: {
      pressure: {
        name: { fr: "PRESSION", pt: "PRESSÃO", ru: "ДАВЛЕНИЕ", ja: "噴射推力", ko: "사출 압력", zhHans: "冲击推力", zhHant: "衝擊推力" },
        upgrades: [
          {
            name: { fr: "Réservoir grand volume", pt: "Reservatório de alto volume", ru: "Ресивер повышенного объема", ja: "大容量タンク", ko: "대용량 압축 탱크", zhHans: "高容量储压罐", zhHant: "高容量儲壓罐" },
            desc: { fr: "+25% de force de poussée.", pt: "+25% de força de repulsão.", ru: "+25% к силе отталкивания.", ja: "吹き飛ばし力+25%。", ko: "넉백 거리 +25%.", zhHans: "击退力度+25%。", zhHant: "擊退力度+25%。" }
          },
          {
            name: { fr: "Déflagration comprimée", pt: "Rajada comprimida", ru: "Сжатый выброс", ja: "圧縮ブラスト", ko: "압축 폭발", zhHans: "高压爆冲", zhHant: "高壓爆衝" },
            desc: { fr: "+40% de force de poussée.", pt: "+40% de força de repulsão.", ru: "+40% к силе отталкивания.", ja: "吹き飛ばし力+40%。", ko: "넉백 거리 +40%.", zhHans: "击退力度+40%。", zhHant: "擊退力度+40%。" }
          },
          {
            name: { fr: "Expulsion supersonique", pt: "Expulsão supersônica", ru: "Сверхзвуковое выталкивание", ja: "超音速バースト", ko: "초음속 방출", zhHans: "超音速强排斥", zhHant: "超音速強排斥" },
            desc: { fr: "+60% de force de poussée.", pt: "+60% de força de repulsão.", ru: "+60% к силе отталкивания.", ja: "吹き飛ばし力+60%。", ko: "넉백 거리 +60%.", zhHans: "击退力度+60%。", zhHant: "擊退力度+60%。" }
          },
          {
            name: { fr: "Canon atmosphérique", pt: "Canhão atmosférico", ru: "Атмосферная пушка", ja: "大気震盪砲", ko: "대기 충격포", zhHans: "大气震爆天炮", zhHant: "大氣震爆天砲" },
            desc: { fr: "Projette des escouades entières d'ennemis jusqu'au point d'apparition initial.", pt: "Arremessa esquadrões inteiros de volta para a entrada de invasão.", ru: "Швыряет целые отряды врагов обратно к самому входу в сектор.", ja: "敵の大群を一網打尽にし、侵入口の最奥部まで強引に吹き飛ばす。", ko: "적 무리 전체를 진입로 입구 끝까지 단숨에 날려버립니다.", zhHans: "爆发狂澜气浪，将整支敌群一路狂轰回最初的入侵起点口。", zhHant: "爆發狂瀾氣浪，將整支敵群一路狂轟回最初的入侵起點口。" }
          }
        ]
      },
      valve: {
        name: { fr: "SOUPAPES & RECHARGE", pt: "VÁLVULAS E RECARGA", ru: "КЛАПАНЫ И СБРОС", ja: "急速排気", ko: "밸브 및 재충전", zhHans: "阀门循环", zhHant: "閥門循環" },
        upgrades: [
          {
            name: { fr: "Échappement rapide", pt: "Exaustão rápida", ru: "Быстрый выхлоп", ja: "高速排気ベント", ko: "빠른 배기", zhHans: "快速排气", zhHant: "快速排氣" },
            desc: { fr: "+20% de vitesse de recharge.", pt: "+20% de velocidade de recarga.", ru: "+20% к скорости перезарядки.", ja: "再装填速度+20%。", ko: "재충전 속도 +20%.", zhHans: "充能速率+20%。", zhHant: "充能速率+20%。" }
          },
          {
            name: { fr: "Vanne rotative", pt: "Válvula rotativa", ru: "Роторный клапан", ja: "ロータリーバルブ", ko: "로터리 밸브", zhHans: "旋转回流阀", zhHant: "旋轉迴流閥" },
            desc: { fr: "+25% de vitesse de recharge.", pt: "+25% de velocidade de recarga.", ru: "+25% к скорости перезарядки.", ja: "再装填速度+25%。", ko: "재충전 속도 +25%.", zhHans: "充能速率+25%。", zhHant: "充能速率+25%。" }
          },
          {
            name: { fr: "Compresseur double étage", pt: "Compressor duplo", ru: "Двойной компрессор", ja: "デュアルコンプレッサー", ko: "이중 컴프레서", zhHans: "双级压缩泵", zhHant: "雙級壓縮泵" },
            desc: { fr: "+30% de vitesse de recharge.", pt: "+30% de velocidade de recarga.", ru: "+30% к скорости перезарядки.", ja: "再装填速度+30%。", ko: "재충전 속도 +30%.", zhHans: "充能速率+30%。", zhHant: "充能速率+30%。" }
          },
          {
            name: { fr: "Moteur à impulsion continue", pt: "Motor de pulso contínuo", ru: "Импульсный генератор", ja: "連続パルスエンジン", ko: "연속 펄스 엔진", zhHans: "连续脉冲引擎", zhHant: "連續脈衝引擎" },
            desc: { fr: "Projette des ondes de choc soniques toutes les 1.5 secondes.", pt: "Dispara ondas de choque a cada 1.5 segundos.", ru: "Выпускает мощные звуковые волны каждые 1.5 секунды.", ja: "わずか1.5秒毎に超音波衝撃波を間髪入れず連射。", ko: "1.5초마다 파괴적인 음파 충격파를 쉴 새 없이 발사합니다.", zhHans: "每隔1.5秒高频连续发射致命震荡声波冲击波。", zhHant: "每隔1.5秒高頻連續發射致命震盪聲波衝擊波。" }
          }
        ]
      },
      reflux: {
        name: { fr: "CONTRE-COUP", pt: "REFLUXO E CHOQUE", ru: "ОБРАТНЫЙ УДАР", ja: "衝撃波破砕", ko: "반작용 충격", zhHans: "回流震爆", zhHant: "迴流震爆" },
        upgrades: [
          {
            name: { fr: "Commotion acoustique", pt: "Concussão acústica", ru: "Акустическая контузия", ja: "音響震盪", ko: "음향 뇌진탕", zhHans: "声学震荡", zhHant: "聲學震盪" },
            desc: { fr: "Les ennemis repoussés sont étourdis pendant 1s.", pt: "Inimigos repelidos ficam atordoados por 1s.", ru: "Отброшенные враги оглушаются на 1 с.", ja: "吹き飛ばされた敵が1秒間スタン。", ko: "밀쳐진 적이 1초간 혼미 상태에 빠집니다.", zhHans: "被击退的目标晕眩失衡1秒。", zhHant: "被擊退的目標暈眩失衡1秒。" }
          },
          {
            name: { fr: "Poussière d'éclats", pt: "Poeira de estilhaços", ru: "Осколочная пыль", ja: "破片散布", ko: "파편 분진", zhHans: "撕裂破片霰尘", zhHant: "撕裂破片霰塵" },
            desc: { fr: "Inflige 12 dégâts physiques lors de l'expulsion.", pt: "Causa 12 de dano físico no momento da repulsão.", ru: "Наносит 12 физ. урона при отталкивании.", ja: "吹き飛ばしと同時に物理ダメージ12を与える。", ko: "사출 시 12의 물리 피해를 입힙니다.", zhHans: "喷射推开的同时造成12点物理伤害。", zhHant: "噴射推開的同時造成12點物理傷害。" }
          },
          {
            name: { fr: "Cavitation tourbillonnaire", pt: "Cavitação em vórtice", ru: "Вихревая кавитация", ja: "渦流キャビテーション", ko: "와류 공동현상", zhHans: "涡流空化坍缩", zhHant: "渦流空化坍縮" },
            desc: { fr: "Inflige 25 dégâts et étourdit pendant 2s.", pt: "Causa 25 de dano e atordoa por 2s.", ru: "Наносит 25 урона и оглушает на 2 с.", ja: "ダメージ25を与え、2秒間スタン。", ko: "25의 피해를 입히고 2초간 혼미 상태로 만듭니다.", zhHans: "造成25点伤害并击晕目标2秒。", zhHant: "造成25點傷害並擊暈目標2秒。" }
          },
          {
            name: { fr: "Singularité cinétique", pt: "Singularidade cinética", ru: "Кинетическая сингулярность", ja: "キネティックシンギュラリティ", ko: "키네틱 특이점", zhHans: "动能引力奇点", zhHant: "動能引力奇點" },
            desc: { fr: "Repousse puis implose les ennemis en un point pour d'immenses dégâts de combo.", pt: "Empurra e depois implode os inimigos juntos causando dano massivo em combo.", ru: "Отбрасывает врагов, а затем схлопывает их в одну точку с колоссальным уроном.", ja: "吹き飛ばした後に敵群を1点に強烈吸引・爆縮させ大打撃。", ko: "적들을 뒤로 밀어낸 뒤 중심부로 강제 흡입 폭축시켜 치명적인 콤보 피해를 입힙니다.", zhHans: "狂轰击退后迅速引爆微型奇点吸聚敌人，造成巨额连携爆裂伤害。", zhHant: "狂轟擊退後迅速引爆微型奇點吸聚敵人，造成巨額連攜爆裂傷害。" }
          }
        ]
      }
    }
  }
};

const base = require('./build-turrets-dict.cjs');
Object.assign(base.turrets, turrets);

// Function to generate the map for a given lang
function getTurretsDict(langKey) {
  const result = {};
  
  // Stats
  for (const [k, v] of Object.entries(base.stat)) {
    result[`turret.stat.${k}`] = v[langKey];
  }

  // Turrets
  for (const [tKey, tData] of Object.entries(base.turrets)) {
    result[`turret.${tKey}.name`] = tData.name[langKey];
    result[`turret.${tKey}.role`] = tData.role[langKey];
    result[`turret.${tKey}.desc`] = tData.desc[langKey];

    for (const [pKey, pData] of Object.entries(tData.paths)) {
      result[`turret.${tKey}.path.${pKey}.name`] = pData.name[langKey];
      pData.upgrades.forEach((u, idx) => {
        const lvl = idx + 1;
        result[`turret.${tKey}.upgrade.${pKey}.${lvl}.name`] = u.name[langKey];
        result[`turret.${tKey}.upgrade.${pKey}.${lvl}.desc`] = u.desc[langKey];
      });
    }
  }

  return result;
}

const langs = ['fr', 'pt', 'ru', 'ja', 'ko', 'zhHans', 'zhHant'];
const allDicts = {};
for (const l of langs) {
  allDicts[l] = getTurretsDict(l);
  console.log(`Generated ${Object.keys(allDicts[l]).length} turret keys for ${l}`);
}

fs.writeFileSync(path.resolve(__dirname, 'turrets-complete.json'), JSON.stringify(allDicts, null, 2), 'utf-8');
console.log('Saved turrets-complete.json successfully!');
