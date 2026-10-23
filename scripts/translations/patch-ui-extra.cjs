const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const uiTranslations = {
  "ui.loading.status_init": {
    fr: "CALIBRATION DES CAPTEURS DE BIO-CONFINEMENT...",
    pt: "CALIBRANDO SENSORES DE BIO-CONTENÇÃO...",
    ru: "КАЛИБРОВКА ДАТЧИКОВ БИО-ИЗОЛЯЦИИ...",
    ja: "生体格納センサー調整中..."
  },
  "ui.loading.tip": {
    fr: "CONSEIL : Placez vos tourelles près des goulots d'étranglement et ramassez rapidement la ferraille.",
    pt: "DICA: Posicione torretas perto de gargalos e colete sucata rapidamente.",
    ru: "СОВЕТ: Размещайте турели у узких проходов и вовремя собирайте лом.",
    ja: "ヒント：チョークポイント付近にタレットを配置し、スクラップを速やかに回収せよ。"
  },
  "ui.loading.step_engine": {
    fr: "INITIALISATION DU MOTEUR GRAPHIQUE & ATLAS...",
    pt: "INICIALIZANDO MOTOR GRÁFICO E ATLAS...",
    ru: "ИНИЦИАЛИЗАЦИЯ ГРАФИЧЕСКОГО ДВИЖКА И АТЛАСА...",
    ja: "グラフィックエンジン＆アトラス初期化中..."
  },
  "ui.loading.step_resources": {
    fr: "CONFIGURATION DES RESSOURCES & OPÉRATEURS...",
    pt: "CONFIGURANDO RECURSOS E OPERADORES...",
    ru: "КОНФИГУРАЦИЯ РЕСУРСОВ И ОПЕРАТОРОВ...",
    ja: "アセット＆オペレーター構成中..."
  },
  "ui.loading.step_shaders": {
    fr: "COMPILATION DES SHADERS & TAMPONS GPU...",
    pt: "COMPILANDO SHADERS E BUFFERS DE GPU...",
    ru: "КОМПИЛЯЦИЯ ШЕЙДЕРОВ И БУФЕРОВ GPU...",
    ja: "シェーダー＆GPUバッファコンパイル中..."
  },
  "ui.loading.step_vram": {
    fr: "PRÉCHARGEMENT DES TEXTURES EN VRAM...",
    pt: "PRÉ-AQUECENDO TEXTURAS NA VRAM...",
    ru: "ПРЕДВАРИТЕЛЬНАЯ ЗАГРУЗКА ТЕКСТУР В VRAM...",
    ja: "VRAMテクスチャ展開中..."
  },
  "ui.loading.step_ready": {
    fr: "SYSTÈMES OPÉRATIONNELS // ENTRÉE DANS LE COMPLEXE",
    pt: "SISTEMAS OPERACIONAIS // ENTRANDO NO COMPLEXO",
    ru: "СИСТЕМЫ ГОТОВЫ // ВХОД В КОМПЛЕКС",
    ja: "システム稼働 // 施設に進入"
  },
  "ui.topbar.teeth_title": {
    fr: "Dents extraites (monnaie de la Clinique)",
    pt: "Dentes extraídos (moeda da Clínica)",
    ru: "Вырванные зубы (валюта клиники)",
    ja: "抜去された歯（クリニック専用通貨）"
  },
  "ui.manual.title": {
    fr: "MANUEL D'OPÉRATION DE TERRAIN",
    pt: "MANUAL DO OPERADOR DE CAMPO",
    ru: "РУКОВОДСТВО ПОЛЕВОГО ОПЕРАТОРА",
    ja: "戦術オペレーター教本"
  },
  "ui.manual.close": {
    fr: "[ FERMER LE MANUEL ]",
    pt: "[ FECHAR MANUAL ]",
    ru: "[ ЗАКРЫТЬ РУКОВОДСТВО ]",
    ja: "[ 教本を閉じる ]"
  },
  "ui.manual.sec1_title": {
    fr: "1. DÉPLACEMENT & INTERACTIONS :",
    pt: "1. MOVIMENTAÇÃO E INTERAÇÃO:",
    ru: "1. ПЕРЕМЕЩЕНИЕ И ВЗАИМОДЕЙСТВИЕ:",
    ja: "1. 移動と基本操作："
  },
  "ui.manual.sec1_body": {
    fr: "<b>ZQSD / WASD</b> Se déplacer · <b>Souris</b> Viser / Regarder · <b>Espace</b> Sauter · <b>Shift</b> Esquive / Roulade · <b>E</b> Interagir / Menu Tourelles · <b>F</b> Lancer la vague en avance · <b>Tab</b> Suivi des objectifs · <b>ÉCHAP / P</b> Menu Pause · <b>F2 / F3</b> Mode Débogage.",
    pt: "<b>WASD</b> Mover · <b>Mouse</b> Mirar · <b>Espaço</b> Pular · <b>Shift</b> Esquiva · <b>E</b> Interagir / Menu de Torretas · <b>F</b> Iniciar Onda adiantada · <b>Tab</b> Objetivos · <b>ESC / P</b> Menu de Pausa · <b>F2 / F3</b> Modo Depuração.",
    ru: "<b>WASD</b> Движение · <b>Мышь</b> Прицеливание · <b>Пробел</b> Прыжок · <b>Shift</b> Рывок · <b>E</b> Взаимодействие / Меню турелей · <b>F</b> Начать волну раньше · <b>Tab</b> Цели · <b>ESC / P</b> Пауза · <b>F2 / F3</b> Отладка.",
    ja: "<b>WASD</b> 移動 · <b>マウス</b> 照準/視点 · <b>Space</b> 跳躍 · <b>Shift</b> 回避ダッシュ · <b>E</b> タレット端末/強化 · <b>F</b> ウェーブ早期開始 · <b>Tab</b> 目標確認 · <b>ESC / P</b> ポーズ · <b>F2 / F3</b> デバッグ。"
  },
  "ui.manual.sec2_title": {
    fr: "2. MODE SURVIE :",
    pt: "2. MODO SOBREVIVÊNCIA:",
    ru: "2. РЕЖИМ ВЫЖИВАНИЯ:",
    ja: "2. サバイバルモード："
  },
  "ui.manual.sec2_body": {
    fr: "Survivez aussi longtemps que possible. Un boss d'usine surgit toutes les 3 minutes.",
    pt: "Sobreviva o máximo possível. Um Chefe da Fábrica surge a cada 3 minutos.",
    ru: "Продержитесь как можно дольше. Каждые 3 минуты появляется босс комплекса.",
    ja: "可能な限り長く生き延びろ。3分毎に工場のボスが出現する。"
  },
  "ui.manual.sec3_title": {
    fr: "3. MODE TOWER DEFENSE :",
    pt: "3. MODO TOWER DEFENSE:",
    ru: "3. РЕЖИМ ЗАЩИТЫ БАЗЫ:",
    ja: "3. タワーディフェンスモード："
  },
  "ui.manual.sec3_body": {
    fr: "Protégez le réacteur biomécanique central durant 12 vagues. Les ennemis progressent le long des rails industriels vers le Cœur, mais vous traqueront si vous vous approchez trop.<br><br>Récoltez la <b>FERRAILLE</b> sur les ennemis abattus. Appuyez sur <b>E</b> pour ouvrir le terminal, sélectionnez une tourelle et placez-la librement en visant le sol avec la caméra (anneau vert = valide). Approchez-vous d'une tourelle et appuyez sur <b>E</b> pour l'améliorer ou la vendre. Chaque tourelle possède 3 branches d'amélioration et une seule peut dépasser le rang 2. Le tutoriel interactif optionnel vous enseigne tout ceci et les synergies clés.",
    pt: "Proteja o Reator Biomecânico Central ao longo de 12 ondas. Inimigos avançam pelas trilhas industriais em direção ao Núcleo, mas perseguirão você se você se aproximar demais.<br><br>Colete <b>SUCATA</b> dos inimigos abatidos. Pressione <b>E</b> para abrir o terminal, selecione uma torreta e posicione-a livremente mirando no chão com a câmera (círculo verde = válido). Aproxime-se de uma torreta e pressione <b>E</b> para melhorá-la ou vendê-la. Cada torreta tem 3 caminhos de melhoria e apenas um pode passar do nível 2. O tutorial interativo opcional ensina tudo isso e as sinergias principais.",
    ru: "Защищайте центральный биомеханический реактор в течение 12 волн. Враги движутся по промышленным путям к Ядру, но нападут на вас, если подойти слишком близко.<br><br>Собирайте <b>МЕТАЛЛОЛОМ</b> с поверженных врагов. Нажмите <b>E</b>, чтобы открыть терминал, выберите турель и свободно разместите ее на полу с помощью прицела (зеленый круг = можно строить). Подойдите к турели и нажмите <b>E</b> для улучшения или продажи. У каждой турели 3 ветки прокачки, и только одна может превысить 2-й уровень. Интерактивное обучение наглядно объясняет все синергии.",
    ja: "全12ウェーブに渡り中央バイオ生体リアクターを防衛せよ。敵は工業ルートを通ってコアへ向かうが、接近するとプレイヤーを追撃してくる。<br><br>倒した敵から<b>スクラップ</b>を回収せよ。<b>E</b>で端末を開き、タレットを選んでカメラを床に向ければ自由に配置可能（緑のリング＝配置可能）。タレットに接近して<b>E</b>を押せば強化・売却ができる。各タレットには3本の強化ルートがあり、レベル2を超えられるのは1ルートのみ。選択制チュートリアルで基本とシナジーを習得可能。"
  },
  "ui.levelup.new_tag": {
    fr: "NOUVEAU",
    pt: "NOVO",
    ru: "НОВОЕ",
    ja: "新規"
  },
  "ui.online.title": {
    fr: "TERMINAL MULTIJOUEUR // COOPÉRATIF",
    pt: "TERMINAL MULTIPLAYER // COOPERATIVO",
    ru: "СЕТЕВОЙ ТЕРМИНАЛ // КООПЕРАТИВ",
    ja: "通信端末 // CO-OPマルチプレイ"
  },
  "ui.online.sub": {
    fr: "Partagez le code de salle à 6 caractères avec votre équipier ou invitez-le via Steam.",
    pt: "Compartilhe o código de sala de 6 dígitos com seu colega ou convide via Steam.",
    ru: "Отправьте 6-значный код комнаты напарнику или пригласите его через Steam.",
    ja: "6文字のルームコードを仲間に共有するか、Steam経由で招待せよ。"
  },
  "ui.online.status_init": {
    fr: "INITIALISATION...",
    pt: "INICIALIZANDO...",
    ru: "ИНИЦИАЛИЗАЦИЯ...",
    ja: "初期化中..."
  },
  "ui.online.status_offline": {
    fr: "MODE HORS-LIGNE",
    pt: "MODO OFFLINE",
    ru: "АВТОНОМНЫЙ РЕЖИМ",
    ja: "オフラインモード"
  },
  "ui.online.status_error": {
    fr: "ERREUR DE CONNEXION",
    pt: "ERRO DE CONEXÃO",
    ru: "ОШИБКА СВЯЗИ",
    ja: "通信エラー"
  },
  "ui.online.local_operator": {
    fr: "Opérateur local",
    pt: "Operador Local",
    ru: "Локальный оператор",
    ja: "ローカルオペレーター"
  },
  "ui.online.offline_tip": {
    fr: "Lancez le jeu avec une connexion active pour accéder aux parties coopératives.",
    pt: "Inicie o jogo com conexão ativa para acessar as partidas cooperativas.",
    ru: "Запустите игру с активным подключением к сети для совместной игры.",
    ja: "協力プレイを行うにはネットワーク接続を有効にして起動してください。"
  },
  "ui.online.ready_tip": {
    fr: "Opérateur prêt // Mode Coopératif",
    pt: "Operador pronto // Modo Cooperativo",
    ru: "Оператор готов // Кооперативный режим",
    ja: "出撃準備完了 // CO-OPモード"
  },
  "ui.online.overlay_btn": {
    fr: "[ OUVRIR L'OVERLAY (SHIFT+TAB) ]",
    pt: "[ ABRIR OVERLAY (SHIFT+TAB) ]",
    ru: "[ ОТКРЫТЬ ОВЕРЛЕЙ (SHIFT+TAB) ]",
    ja: "[ オーバースチームを開く (SHIFT+TAB) ]"
  },
  "ui.online.create_box_sub": {
    fr: "Générer une salle privée. Partagez le code ou invitez vos amis directement :",
    pt: "Gere uma sala privada. Compartilhe o código ou convide amigos diretamente:",
    ru: "Создайте закрытую комнату. Отправьте код или пригласите друзей напрямую:",
    ja: "プライベートマッチを作成。コードを共有するかフレンドを直接招待："
  },
  "ui.online.btn_create": {
    fr: "[ CRÉER LA PARTIE ]",
    pt: "[ CRIAR PARTIDA ]",
    ru: "[ СОЗДАТЬ ИГРУ ]",
    ja: "[ 部屋を作成 ]"
  },
  "ui.online.members_count": {
    fr: "{count} / {max} Opérateurs",
    pt: "{count} / {max} Operadores",
    ru: "{count} / {max} Операторов",
    ja: "{count} / {max} 名のオペレーター"
  },
  "ui.online.link_code": {
    fr: "CODE DE SALLE :",
    pt: "CÓDIGO DA SALA:",
    ru: "КОД КОМНАТЫ:",
    ja: "接続コード："
  },
  "ui.online.waiting_coop": {
    fr: "Opérateur local connecté. En attente d'un coéquipier...",
    pt: "Operador local conectado. Aguardando companheiro...",
    ru: "Локальный оператор подключен. Ожидание напарника...",
    ja: "待機中。仲間が接続するのを待っています..."
  },
  "ui.online.btn_copy_link": {
    fr: "[ COPIER LE CODE ]",
    pt: "[ COPIAR CÓDIGO ]",
    ru: "[ СКОПИРОВАТЬ КОД ]",
    ja: "[ コードをコピー ]"
  },
  "ui.online.btn_link_copied": {
    fr: "[ CODE COPIÉ ! ]",
    pt: "[ CÓDIGO COPIADO! ]",
    ru: "[ КОД СКОПИРОВАН! ]",
    ja: "[ コピー完了！ ]"
  },
  "ui.online.btn_leave": {
    fr: "[ QUITTER ]",
    pt: "[ SAIR ]",
    ru: "[ ПОКИНУТЬ ]",
    ja: "[ 退出 ]"
  },
  "ui.online.join_box_sub": {
    fr: "Entrez le code fourni par votre équipier :",
    pt: "Digite o código fornecido pelo seu colega:",
    ru: "Введите код, полученный от вашего напарника:",
    ja: "仲間から受け取ったコードを入力せよ："
  },
  "ui.online.join_placeholder": {
    fr: "Collez le code de salle ici...",
    pt: "Cole o código da sala aqui...",
    ru: "Вставьте код комнаты сюда...",
    ja: "ルームコードをここに貼り付け..."
  },
  "ui.online.btn_join": {
    fr: "[ REJOINDRE LA PARTIE ]",
    pt: "[ ENTRAR NA PARTIDA ]",
    ru: "[ ВОЙТИ В ИГРУ ]",
    ja: "[ 部屋に参加 ]"
  },
  "ui.online.private_tip": {
    fr: "Partie coopérative privée. Seuls les joueurs ayant le code exact ou une invitation peuvent rejoindre.",
    pt: "Partida cooperativa privada. Apenas jogadores com o código exato ou convite podem entrar.",
    ru: "Закрытый матч. Только игроки с кодом или прямым приглашением могут войти.",
    ja: "非公開マッチ。正確なコードを持つプレイヤーまたは直接招待されたプレイヤーのみ参加可能。"
  },
  "ui.online.btn_back": {
    fr: "[ RETOUR ]",
    pt: "[ VOLTAR ]",
    ru: "[ НАЗАД ]",
    ja: "[ 戻る ]"
  },
  "ui.online.host_badge": {
    fr: "[HÔTE]",
    pt: "[ANFITRIÃO]",
    ru: "[ХОСТ]",
    ja: "[ホスト]"
  },
  "ui.online.client_badge": {
    fr: "[CLIENT]",
    pt: "[CLIENTE]",
    ru: "[КЛИЕНТ]",
    ja: "[ゲスト]"
  },
  "ui.online.err_invalid_id": {
    fr: "Veuillez entrer un ID de salle valide.",
    pt: "Insira um ID de sala válido.",
    ru: "Пожалуйста, введите корректный ID лобби.",
    ja: "有効なロビーIDを入力してください。"
  },
  "ui.online.err_need_steam": {
    fr: "Vous devez lancer la version Windows avec Steam ouvert pour rejoindre des salons.",
    pt: "Você deve executar a versão do Windows com o Steam aberto para entrar em salas.",
    ru: "Запустите сборку для Windows со включенным клиентом Steam для входа в лобби.",
    ja: "ロビーに参加するにはSteamを起動した状態でWindows版を実行してください。"
  },
  "ui.online.connected_success": {
    fr: "Connexion réussie à la salle #{id} !",
    pt: "Conectado com sucesso à sala #{id}!",
    ru: "Успешное подключение к комнате #{id}!",
    ja: "ルーム #{id} に正常に接続しました！"
  },
  "ui.online.room_closed": {
    fr: "Cette partie est terminée ou la salle a été fermée.",
    pt: "Esta partida terminou ou a sala foi fechada.",
    ru: "Матч завершен или комната была закрыта.",
    ja: "このマッチは終了したか、部屋が解散されました。"
  },
  "ui.online.room_join_error": {
    fr: "Impossible de se connecter à la salle : {error}",
    pt: "Não foi possível conectar à sala: {error}",
    ru: "Не удалось подключиться к комнате: {error}",
    ja: "部屋に接続できませんでした：{error}"
  },
  "ui.online.room_full_or_not_found": {
    fr: "La salle n'existe pas ou est complète.",
    pt: "A sala não existe ou está cheia.",
    ru: "Комната не существует или уже заполнена.",
    ja: "部屋が存在しないか、満員です。"
  },
  "ui.online.stage_cancelled": {
    fr: "Déploiement annulé par votre équipier.",
    pt: "Desdobramento cancelado pelo colega.",
    ru: "Высадка отменена напарником.",
    ja: "仲間によって出撃がキャンセルされました。"
  },
  "ui.online.no_active_room": {
    fr: "Aucune salle active.",
    pt: "Nenhuma sala ativa.",
    ru: "Нет активной комнаты.",
    ja: "アクティブな部屋がありません。"
  },
  "ui.online.err_invalid_code": {
    fr: "Code invalide. Entrez le code à 6 caractères ou collez le lien complet.",
    pt: "Código inválido. Digite o código de 6 caracteres ou cole o link completo.",
    ru: "Неверный код. Введите 6-значный код или вставьте ссылку целиком.",
    ja: "無効なコードです。6文字のコードか完全なリンクを入力してください。"
  },
  "ui.online.err_need_steam_create": {
    fr: "Pour créer des salons Steamworks, lancez le jeu depuis la version Windows avec Steam actif.",
    pt: "Para criar salas Steamworks, execute o jogo pela versão Windows com o Steam ativo.",
    ru: "Для создания лобби Steamworks запустите игру в Windows с открытым клиентом Steam.",
    ja: "Steamworksロビーを作成するにはSteamが実行中の状態で起動してください。"
  },
  "ui.online.peer_disconnected_toast": {
    fr: "Équipier déconnecté. Poursuite de la mission en solo.",
    pt: "Companheiro desconectado. Continuando missão solo.",
    ru: "Напарник отключился. Продолжение миссии в одиночку.",
    ja: "仲間が切断されました。単独で作戦を継続します。"
  },
  "ui.online.peer_disconnected_announcement": {
    fr: "ÉQUIPIER DÉCONNECTÉ // MISSION SOLO",
    pt: "COMPANHEIRO DESCONECTADO // MISSÃO SOLO",
    ru: "НАПАРНИК ОТКЛЮЧИЛСЯ // ОДИНОЧНАЯ МИССИЯ",
    ja: "仲間が切断 // 単独作戦に移行"
  },
  "ui.online.waiting_host_restart": {
    fr: "EN ATTENTE DU REDÉMARRAGE DE L'HÔTE",
    pt: "AGUARDANDO O ANFITRIÃO REINICIAR",
    ru: "ОЖИДАНИЕ ПЕРЕЗАПУСКА ХОСТОМ",
    ja: "ホストの再開を待機中"
  },
  "ui.online.waiting_host_btn": {
    fr: "EN ATTENTE DE L'HÔTE...",
    pt: "AGUARDANDO O ANFITRIÃO...",
    ru: "ОЖИДАНИЕ ХОСТА...",
    ja: "ホストを待機中..."
  },
  "ui.online.p2p_not_available": {
    fr: "STEAM P2P INDISPONIBLE",
    pt: "STEAM P2P INDISPONÍVEL",
    ru: "STEAM P2P НЕДОСТУПЕН",
    ja: "STEAM P2P利用不可"
  },
  "ui.online.no_peer_connected": {
    fr: "AUCUN ÉQUIPIER CONNECTÉ",
    pt: "NENHUM COMPANHEIRO CONECTADO",
    ru: "НЕТ ПОДКЛЮЧЕННЫХ ИГРОКОВ",
    ja: "仲間が接続されていません"
  },
  "ui.online.scrap_insufficient": {
    fr: "FERRAILLE INSUFFISANTE",
    pt: "SUCATA INSUFICIENTE",
    ru: "НЕДОСТАТОЧНО ЛОМА",
    ja: "スクラップ不足"
  },
  "ui.online.scrap_send_failed": {
    fr: "ÉCHEC DE L'ENVOI DE FERRAILLE",
    pt: "FALHA AO ENVIAR SUCATA",
    ru: "НЕ УДАЛОСЬ ОТПРАВИТЬ ЛОМ",
    ja: "スクラップの送信に失敗"
  },
  "ui.online.scrap_sent": {
    fr: "-{value} FERRAILLE ENVOYÉE",
    pt: "-{value} SUCATA ENVIADA",
    ru: "-{value} ЛОМА ОТПРАВЛЕНО",
    ja: "-{value} スクラップを転送"
  },
  "ui.online.scrap_received": {
    fr: "+{amount} FERRAILLE REÇUE",
    pt: "+{amount} SUCATA RECEBIDA",
    ru: "+{amount} ЛОМА ПОЛУЧЕНО",
    ja: "+{amount} スクラップを受信"
  },
  "ui.menu.btn_tutorial": {
    fr: "[ TUTORIEL ]",
    pt: "[ TUTORIAL ]",
    ru: "[ ОБУЧЕНИЕ ]",
    ja: "[ チュートリアル ]"
  },
  "ui.menu.btn_shop": {
    fr: "[ CLINIQUE / IMPLANTS ]",
    pt: "[ CLÍNICA / IMPLANTES ]",
    ru: "[ КЛИНИКА / ИМПЛАНТЫ ]",
    ja: "[ クリニック / インプラント ]"
  },
  "ui.menu.btn_coop": {
    fr: "[ MODE COOPÉRATIF ]",
    pt: "[ MODO COOPERATIVO ]",
    ru: "[ КООПЕРАТИВНЫЙ РЕЖИМ ]",
    ja: "[ CO-OPマルチプレイ ]"
  },
  "ui.menu.btn_manual": {
    fr: "[ MANUEL & COMMANDES ]",
    pt: "[ MANUAL E CONTROLES ]",
    ru: "[ РУКОВОДСТВО И УПРАВЛЕНИЕ ]",
    ja: "[ 教本と操作方法 ]"
  },
  "ui.dossier.expeditions": {
    fr: "EXPÉDITIONS TOTALES :",
    pt: "EXPEDIÇÕES TOTAIS:",
    ru: "ВСЕГО ЭКСПЕДИЦИЙ:",
    ja: "総出撃記録数："
  },
  "ui.dossier.kills": {
    fr: "HOSTILES PURGÉS :",
    pt: "HOSTIS PURGADOS:",
    ru: "УНИЧТОЖЕНО ВРАГОВ:",
    ja: "撃破した敵性体："
  },
  "ui.dossier.bosses": {
    fr: "BOSS ÉLIMINÉS :",
    pt: "CHEFES DERROTADOS:",
    ru: "БОССОВ ПОВЕРЖЕНО:",
    ja: "討伐した工場ボス："
  },
  "ui.dossier.implants": {
    fr: "IMPLANTS ACQUIS :",
    pt: "IMPLANTES ADQUIRIDOS:",
    ru: "ИМПЛАНТОВ ПОЛУЧЕНО:",
    ja: "獲得インプラント数："
  },
  "ui.mode.badge_arcade": {
    fr: "MODE ARCADE",
    pt: "MODO ARCADE",
    ru: "АРКАДНЫЙ РЕЖИМ",
    ja: "アーケードモード"
  },
  "ui.mode.status_choose": {
    fr: "[CHOISIR]",
    pt: "[ESCOLHER]",
    ru: "[ВЫБРАТЬ]",
    ja: "[選択]"
  },
  "ui.mode.td_sub": {
    fr: "12 VAGUES // RÉACTEUR",
    pt: "12 ONDAS // REATOR",
    ru: "12 ВОЛН // РЕАКТОР",
    ja: "12ウェーブ // リアクター"
  },
  "ui.mode.surv_sub": {
    fr: "HORDE SANS FIN",
    pt: "HORDA INFINITA",
    ru: "БЕСКОНЕЧНАЯ ОРДА",
    ja: "エンドレスホード"
  },
  "ui.mode.sector_tag": {
    fr: " // SECTEUR : {name} ({diff})",
    pt: " // SETOR: {name} ({diff})",
    ru: " // СЕКТОР: {name} ({diff})",
    ja: " // セクター：{name} ({diff})"
  }
};

const files = [
  { file: '../../locales/fr.js', langKey: 'fr', header: '// French localization dictionary for Crabs wants your food!.' },
  { file: '../../locales/pt-BR.js', langKey: 'pt', header: '// Portuguese (Brazil) localization dictionary for Crabs wants your food!.' },
  { file: '../../locales/ru.js', langKey: 'ru', header: '// Russian localization dictionary for Crabs wants your food!.' },
  { file: '../../locales/ja.js', langKey: 'ja', header: '// Japanese localization dictionary for Crabs wants your food!.' }
];

async function run() {
  for (const item of files) {
    const fullPath = path.resolve(__dirname, item.file);
    const mod = await import(pathToFileURL(fullPath).href);
    const dict = Object.assign({}, mod.default);

    for (const [k, vMap] of Object.entries(uiTranslations)) {
      if (vMap[item.langKey]) {
        dict[k] = vMap[item.langKey];
      }
    }

    const keys = Object.keys(dict);
    const outLines = [item.header, 'export default {'];
    keys.forEach((k, idx) => {
      const isLast = idx === keys.length - 1;
      outLines.push(`  ${JSON.stringify(k)}: ${JSON.stringify(dict[k])}${isLast ? '' : ','}`);
    });
    outLines.push('};');
    outLines.push('');

    fs.writeFileSync(fullPath, outLines.join('\n'), 'utf-8');
    console.log(`Updated UI extra strings in ${item.file}`);
  }
}

run().catch(console.error);
