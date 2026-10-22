// Módulo de interfaz y lógica para salas multijugador: Steamworks (AppID 480 /
// Spacewar) en Electron y adaptador WebRTC P2P en navegador.
// Exports: setupSteamLobbyUI, openSteamOnlineModal, closeSteamOnlineModal, updateSteamStatus, getCurrentLobbyData, getLocalPlayerSteamId, handleRemoteStageMatch, handleRemoteCharReady, handleRemoteCancelStage, startCoopCharacterSelectionFlow.

import { AudioSys } from '../audio.js';
import { ModeManager } from '../modes/gameModeManager.js';
import { openMapSelector } from '../ui/mapSelectorModal.js';
import { MultiplayerSync } from './multiplayerSync.js';
import { normalizeRoomCode } from './webRtcAdapter.js';
import {
  openCharacterSelectorModal,
  closeCharacterSelectorModal,
  setCoopCharSelectionStatus
} from '../ui/characterSelectorModal.js';
import { getMapById } from '../defense/mapGenerator.js';
import { t } from '../core/i18n.js';
import { GameEvents } from '../core/eventBus.js';

let modalEl = null;
let currentLobbyData = null;
let lobbyPollTimer = null;
let gameFlowRuntime = null;
let localPlayerSteamId = null;
let lastLaunchedMatchTimestamp = 0;
let isWebRtcMode = false;
let autoJoinAttempted = false;

export function getLastLaunchedMatchTimestamp() {
  return lastLaunchedMatchTimestamp;
}

export function setLastLaunchedMatchTimestamp(ts) {
  lastLaunchedMatchTimestamp = ts;
}

export function getCurrentLobbyData() {
  return currentLobbyData;
}

export function getLocalPlayerSteamId() {
  return localPlayerSteamId;
}

export function setupSteamLobbyUI(runtime = {}) {
  gameFlowRuntime = runtime;
  modalEl = document.getElementById('steam-online-modal');
  isWebRtcMode = !!(window.steamOnline && window.steamOnline.isWebRtc);
  applyOnlineModeCopy();

  const btnOpenSub = document.getElementById('btn-open-steam-modal');
  if (btnOpenSub) {
    btnOpenSub.onclick = openSteamOnlineModal;
  }

  const btnClose = document.getElementById('btn-close-steam-modal');
  if (btnClose) {
    btnClose.onclick = closeSteamOnlineModal;
  }

  const btnCreate = document.getElementById('btn-create-lobby');
  if (btnCreate) {
    btnCreate.onclick = handleCreateLobby;
  }

  const btnLeave = document.getElementById('btn-leave-lobby');
  if (btnLeave) {
    btnLeave.onclick = handleLeaveLobby;
  }

  const btnCopyId = document.getElementById('btn-copy-lobby-id');
  if (btnCopyId) {
    btnCopyId.onclick = handleCopyLobbyId;
  }

  const btnJoinId = document.getElementById('btn-join-by-id');
  if (btnJoinId) {
    btnJoinId.onclick = handleJoinById;
  }

  const btnStartMatch = document.getElementById('btn-start-coop-match');
  if (btnStartMatch) {
    btnStartMatch.onclick = handleHostStartCoopMatch;
  }

  const btnOverlay = document.getElementById('btn-steam-overlay');
  if (btnOverlay) {
    btnOverlay.onclick = () => {
      AudioSys.playUISelect();
      if (isWebRtcMode) {
        handleInviteFriends();
        return;
      }
      if (window.steamOnline && window.steamOnline.openOverlay) {
        window.steamOnline.openOverlay();
      }
    };
  }

  // Escuchar eventos de Steam/WebRTC en tiempo real
  if (window.steamOnline) {
    if (window.steamOnline.onLobbyUpdated) {
      window.steamOnline.onLobbyUpdated((details) => {
        applyLobbyUpdate(details);
      });
    }

    if (window.steamOnline.onJoinRequested) {
      window.steamOnline.onJoinRequested(async (lobbyId) => {
        openSteamOnlineModal();
        await joinLobbyDirect(lobbyId);
      });
    }

    if (window.steamOnline.onLobbyClosed) {
      window.steamOnline.onLobbyClosed(() => {
        resetLobbyView();
      });
    }
  }

  // Comprueba estado inicial silenciosamente
  checkInitialSteamStatus();

  // Escuchar cambio dinámico de idioma para refrescar títulos y estados
  GameEvents.on('i18n:change', () => {
    applyOnlineModeCopy();
    refreshSteamUserCard();
    if (currentLobbyData) applyLobbyUpdate(currentLobbyData);
  });

  // Enlace directo `?room=CODIGO` para partidas WebRTC compartidas por chat.
  if (isWebRtcMode) {
    setTimeout(() => { autoJoinFromUrl(); }, 0);
  }
}

function applyOnlineModeCopy() {
  if (!isWebRtcMode) return;
  const modal = document.getElementById('steam-online-modal');
  if (!modal) return;

  const title = modal.querySelector('.plate-header .tape-label span:last-child');
  if (title) title.textContent = t('ui.online.title');

  const subtitle = modal.querySelector('.plate-sub');
  if (subtitle) {
    subtitle.textContent = t('ui.online.sub');
  }

  const overlayBtn = document.getElementById('btn-steam-overlay');
  if (overlayBtn) overlayBtn.innerHTML = `<span>${t('ui.online.btn_copy_link')}</span>`;

  const copyBtn = document.getElementById('btn-copy-lobby-id');
  if (copyBtn) copyBtn.innerHTML = `<span>${t('ui.online.btn_copy_link')}</span>`;

  const joinInput = document.getElementById('steam-join-input');
  if (joinInput) joinInput.placeholder = t('ui.online.join_placeholder');

  const privateText = modal.querySelector('.steam-private-info-box p');
  if (privateText) {
    privateText.textContent = t('ui.online.private_tip');
  }
}

function resetLobbyView() {
  if (lobbyPollTimer) {
    clearInterval(lobbyPollTimer);
    lobbyPollTimer = null;
  }
  currentLobbyData = null;

  const noLobbyView = document.getElementById('steam-no-lobby-view');
  const activeLobbyView = document.getElementById('steam-active-lobby-view');
  if (noLobbyView) noLobbyView.classList.remove('hidden');
  if (activeLobbyView) activeLobbyView.classList.add('hidden');
}

async function autoJoinFromUrl() {
  if (!isWebRtcMode || autoJoinAttempted) return;
  let roomCode = '';
  try {
    roomCode = normalizeRoomCode(new URLSearchParams(window.location.search).get('room') || '');
  } catch (e) {}

  // Limpia inmediatamente el parámetro ?room=CODIGO de la URL tras procesarlo para que no se reintente en bucle
  if (typeof window !== 'undefined' && window.history && typeof window.history.replaceState === 'function') {
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) {}
  }

  if (!roomCode) return;
  autoJoinAttempted = true;

  const input = document.getElementById('steam-join-input');
  if (input) input.value = roomCode;

  // Un jugador que entra por URL SOLO intenta hacer joinLobby como Cliente;
  // NUNCA debe iniciar partida por su cuenta ni convertirse en Host si la sala no existe.
  await openSteamOnlineModal();
  await joinLobbyDirect(roomCode);
}

async function checkInitialSteamStatus() {
  if (!window.steamOnline) return;

  try {
    const status = await window.steamOnline.getStatus();
    if (status && status.connected) {
      localPlayerSteamId = status.steamId;
      
    }
  } catch (e) {
    console.warn('[Steam UI] Error al consultar estado inicial:', e);
  }
}

export async function openSteamOnlineModal() {
  AudioSys.playUISelect();
  if (!modalEl) modalEl = document.getElementById('steam-online-modal');
  if (!modalEl) return;

  modalEl.classList.remove('hidden');
  await refreshSteamUserCard();

  // Si ya hay sala activa, refrescar su información
  if (currentLobbyData && window.steamOnline && window.steamOnline.getLobbyInfo) {
    const info = await window.steamOnline.getLobbyInfo();
    if (info) applyLobbyUpdate(info);
  }
}

export function closeSteamOnlineModal() {
  AudioSys.playUISelect();
  if (!modalEl) modalEl = document.getElementById('steam-online-modal');
  if (modalEl) modalEl.classList.add('hidden');
}

async function refreshSteamUserCard() {
  const badgeEl = document.getElementById('steam-status-badge');
  const nameEl = document.getElementById('steam-player-name');
  const idEl = document.getElementById('steam-player-id');

  if (!window.steamOnline) {
    if (badgeEl) {
      badgeEl.textContent = t('ui.online.status_offline');
      badgeEl.style.color = '#e67828';
    }
    if (nameEl) nameEl.textContent = t('ui.online.local_operator');
    if (idEl) idEl.textContent = t('ui.online.offline_tip');
    return;
  }

  try {
    const status = await window.steamOnline.getStatus();
    if (status && status.connected) {
      localPlayerSteamId = status.steamId;
      const webMode = !!(status.isWebRtc || status.mode === 'WEBRTC');
      if (badgeEl) {
        badgeEl.textContent = t('ui.online.status_connected');
        badgeEl.style.color = '#55de3e';
      }
      if (nameEl) nameEl.textContent = status.playerName;
      if (idEl) {
        idEl.textContent = t('ui.online.ready_tip');
      }
    } else {
      if (badgeEl) {
        badgeEl.textContent = t('ui.online.status_offline');
        badgeEl.style.color = '#ff6b6b';
      }
      if (nameEl) nameEl.textContent = t('ui.online.local_operator');
      if (idEl) idEl.textContent = status.message || t('ui.online.offline_tip');
    }
  } catch (err) {
    if (badgeEl) {
      badgeEl.textContent = t('ui.online.status_error');
      badgeEl.style.color = '#ff6b6b';
    }
  }
}

function applyLobbyUpdate(details) {
  if (!details) return;
  currentLobbyData = details;

  const noLobbyView = document.getElementById('steam-no-lobby-view');
  const activeLobbyView = document.getElementById('steam-active-lobby-view');
  const idEl = document.getElementById('steam-active-lobby-id');
  const countEl = document.getElementById('steam-lobby-members-count');
  const membersListEl = document.getElementById('steam-lobby-members-list');
  const hostGroupEl = document.getElementById('steam-host-launch-group');
  const clientWaitEl = document.getElementById('steam-client-wait-msg');

  if (noLobbyView) noLobbyView.classList.add('hidden');
  if (activeLobbyView) activeLobbyView.classList.remove('hidden');
  if (idEl) idEl.textContent = details.lobbyId;

  const memberCount = details.memberCount || (details.members ? details.members.length : 1);
  const memberLimit = details.memberLimit || 4;
  if (countEl) countEl.textContent = t('ui.online.members_count', { count: memberCount, max: memberLimit });

  // Renderizar la lista de operadores en la sala
  if (membersListEl) {
    membersListEl.innerHTML = '';
    const members = details.members || [];
    if (members.length === 0) {
      membersListEl.innerHTML = `<div style="font-size:11px; color:#888;">${t('ui.online.waiting_coop')}</div>`;
    } else {
      members.forEach((m, idx) => {
        const row = document.createElement('div');
        row.style.cssText = 'font-size:11px; padding:3px 6px; background:rgba(255,255,255,0.05); border-left:3px solid #55de3e; display:flex; justify-content:space-between; align-items:center;';

        const label = document.createElement('span');
        const roleSpan = document.createElement('span');
        if (m.isOwner) {
          roleSpan.innerHTML = `<b style="color:#f0c954">${t('ui.online.host_badge')}</b>`;
        } else {
          roleSpan.innerHTML = `<span style="color:#8ef77b">${t('ui.online.client_badge')}</span>`;
        }
        label.appendChild(roleSpan);
        label.appendChild(document.createTextNode(` ${m.playerName || `Operador #${idx + 1}`} `));

        const codeEl = document.createElement('code');
        codeEl.style.color = '#aaa';
        const steamId = String(m.steamId || '');
        codeEl.textContent = `...${steamId.slice(-6)}`;
        label.appendChild(codeEl);

        const onlineEl = document.createElement('span');
        onlineEl.style.color = '#55de3e';
        onlineEl.textContent = t('ui.online.online_indicator');

        row.appendChild(label);
        row.appendChild(onlineEl);
        membersListEl.appendChild(row);
      });
    }
  }

  // Determinar rol: Host vs Cliente para mostrar u ocultar botón de lanzamiento
  const isHost = details.ownerSteamId && localPlayerSteamId && (details.ownerSteamId === localPlayerSteamId);
  if (isHost) {
    if (hostGroupEl) hostGroupEl.classList.remove('hidden');
    if (clientWaitEl) clientWaitEl.classList.add('hidden');
  } else {
    if (hostGroupEl) hostGroupEl.classList.add('hidden');
    if (clientWaitEl) clientWaitEl.classList.remove('hidden');
  }

  // Si el Host ha emitido la orden de inicio mediante los datos de la sala
  if (details.matchState) {
    try {
      const matchObj = typeof details.matchState === 'string' ? JSON.parse(details.matchState) : details.matchState;
      if (matchObj && matchObj.action === 'START' && matchObj.timestamp > lastLaunchedMatchTimestamp) {
        lastLaunchedMatchTimestamp = matchObj.timestamp;
        launchClientMatch(matchObj);
      }
    } catch (e) {
      console.warn('[Steam UI] Error al procesar matchState:', e);
    }
  }

  // Activar polling de seguridad cada 1.5s mientras la sala esté activa
  if (!lobbyPollTimer) {
    lobbyPollTimer = setInterval(async () => {
      if (currentLobbyData && window.steamOnline) {
        try {
          if (window.steamOnline.getLobbyInfo) {
            const fresh = await window.steamOnline.getLobbyInfo();
            if (fresh) applyLobbyUpdate(fresh);
          }
        } catch (e) {}
      }
    }, 1500);
  }
}

export async function broadcastMatchStart(payload) {
  if (!currentLobbyData || !window.steamOnline) return;
  const matchData = {
    action: 'START',
    ...payload,
    timestamp: Date.now()
  };
  lastLaunchedMatchTimestamp = matchData.timestamp;

  // 1. Notificar vía Lobby Data (llega automáticamente por LobbyDataUpdate a todos)
  try {
    if (window.steamOnline.setLobbyData) {
      await window.steamOnline.setLobbyData('matchState', matchData);
    }
  } catch (e) {
    console.warn('[Steam UI] Error al publicar matchState en sala:', e);
  }

  // 2. Enviar por P2P directo a cada miembro con Reliable (garantiza entrega)
  try {
    if (currentLobbyData.members && window.steamOnline.sendP2P) {
      for (const m of currentLobbyData.members) {
        if (m.steamId && m.steamId !== localPlayerSteamId) {
          window.steamOnline.sendP2P(m.steamId, { type: 'START_MATCH', ...matchData }, true);
        }
      }
    }
  } catch (e) {
    console.warn('[Steam P2P] Error al enviar señal de inicio P2P:', e);
  }
  return matchData;
}

export function launchClientMatch(stateObj) {
  console.log('[Steam UI] Señal de inicio recibida del Host:', stateObj);
  closeSteamOnlineModal();

  if (stateObj.mode === 'core_defense') {
    ModeManager.selectMode('core_defense');
    if (stateObj.mapId) localStorage.setItem('traces_td_selected_map', stateObj.mapId);
    if (stateObj.diff) localStorage.setItem('traces_td_difficulty', stateObj.diff);
  } else if (stateObj.mode === 'survival') {
    ModeManager.selectMode('survival');
  }

  AudioSys.play(600, 0.25, 'triangle', 0.15);

  MultiplayerSync.onMatchStarted({ ...stateObj, isHost: false });

  if (gameFlowRuntime && typeof gameFlowRuntime.startGame === 'function') {
    gameFlowRuntime.startGame({ tutorial: false, onlineMatch: stateObj });
  } else {
    document.getElementById('btn-start')?.click();
  }
}

let coopMatchStage = null;

export function handleRemoteStageMatch(data) {
  console.log('[Steam UI] STAGE_MATCH recibido del Host:', data);
  startCoopCharacterSelectionFlow(data, false);
}

export function handleRemoteCharReady(data) {
  console.log('[Steam UI] CHAR_READY recibido de peer:', data);
  if (!coopMatchStage) return;
  coopMatchStage.peerReady = true;
  coopMatchStage.peerCharId = data.charId;

  if (coopMatchStage.localReady) {
    finalizeAndLaunchCoopMatch();
  } else {
    setCoopCharSelectionStatus('peer_ready', '¡Compañero listo! Selecciona tu operador para comenzar.');
  }
}

export function handleRemoteCancelStage() {
  console.log('[Steam UI] CANCEL_STAGE recibido de peer');
  if (coopMatchStage) {
    coopMatchStage = null;
    closeCharacterSelectorModal();
    openSteamOnlineModal();
    alert(t('ui.online.stage_cancelled'));
  }
}

export function startCoopCharacterSelectionFlow(matchData, isHost) {
  coopMatchStage = {
    matchData,
    isHost,
    localReady: false,
    peerReady: false,
    localCharId: null,
    peerCharId: null,
    finalizing: false
  };

  closeSteamOnlineModal();
  const mapScreen = document.getElementById('map-select-screen');
  if (mapScreen) mapScreen.classList.add('hidden');

  if (isHost) {
    MultiplayerSync.broadcast('STAGE_MATCH', matchData, true);
    try {
      if (window.steamOnline?.setLobbyData) {
        window.steamOnline.setLobbyData('matchStage', matchData);
      }
    } catch (e) {}
  }

  const mapObj = matchData.mapId ? getMapById(matchData.mapId) : null;
  const mapTitle = mapObj ? mapObj.name : (matchData.mode === 'core_defense' ? 'DEFENSA DE NÚCLEO' : 'SUPERVIVENCIA');

  openCharacterSelectorModal({
    isCoop: true,
    title: 'MESA DE ASIGNACIÓN // SELECCIÓN COOPERATIVA',
    sub: `Selecciona tu operador para la misión cooperativa en ${mapTitle}. Ambos jugadores deben confirmar su personaje:`,
    confirmText: '[ ASIGNAR OPERADOR Y LISTO ]',
    onConfirm: (chosenChar) => {
      handleCoopPlayerConfirmed(chosenChar.id);
    },
    onClose: () => {
      handleCoopCancelStage();
    }
  });
}

function handleCoopPlayerConfirmed(charId) {
  if (!coopMatchStage) return;
  coopMatchStage.localReady = true;
  coopMatchStage.localCharId = charId;

  MultiplayerSync.broadcast('CHAR_READY', { charId }, true);

  if (!coopMatchStage.peerReady) {
    setCoopCharSelectionStatus('waiting', 'El otro jugador aún está seleccionando personaje...');
    AudioSys.play(360, 0.12, 'square', 0.05);
  } else {
    finalizeAndLaunchCoopMatch();
  }
}

function finalizeAndLaunchCoopMatch() {
  if (!coopMatchStage || coopMatchStage.finalizing) return;
  coopMatchStage.finalizing = true;
  setCoopCharSelectionStatus('ready', '¡AMBOS OPERADORES LISTOS! INICIANDO DESPLIEGUE...');
  AudioSys.play(600, 0.25, 'triangle', 0.15);

  const stage = { ...coopMatchStage };
  coopMatchStage = null;

  if (stage.isHost) {
    broadcastMatchStart(stage.matchData);
  }

  setTimeout(() => {
    closeCharacterSelectorModal();
    MultiplayerSync.onMatchStarted({ ...stage.matchData, isHost: stage.isHost });
    if (gameFlowRuntime && typeof gameFlowRuntime.startGame === 'function') {
      gameFlowRuntime.startGame({ tutorial: false, onlineMatch: stage.matchData });
    }
  }, 600);
}

function handleCoopCancelStage() {
  if (!coopMatchStage) return;
  coopMatchStage = null;
  MultiplayerSync.broadcast('CANCEL_STAGE', {}, true);
  closeCharacterSelectorModal();
  openSteamOnlineModal();
}

async function handleHostStartCoopMatch() {
  AudioSys.playUISelect();

  if (!currentLobbyData) {
    alert(t('ui.online.no_active_room'));
    return;
  }

  const selectedMode = ModeManager.getSelectedModeId();

  if (selectedMode === 'core_defense') {
    closeSteamOnlineModal();
    const currentDiff = localStorage.getItem('traces_td_difficulty') || 'normal';
    openMapSelector(currentDiff, async (selectedMapId, chosenDiff) => {
      const matchData = {
        mode: 'core_defense',
        mapId: selectedMapId,
        diff: chosenDiff
      };
      startCoopCharacterSelectionFlow(matchData, true);
    });
  } else {
    closeSteamOnlineModal();
    const matchData = {
      mode: 'survival'
    };
    startCoopCharacterSelectionFlow(matchData, true);
  }
}

async function handleCreateLobby() {
  AudioSys.play(440, 0.15, 'square', 0.08);

  if (!window.steamOnline) {
    alert(t('ui.online.err_need_steam_create'));
    return;
  }

  try {
    const res = await window.steamOnline.createLobby();
    if (res && res.success) {
      applyLobbyUpdate(res);
      AudioSys.play(660, 0.2, 'triangle', 0.1);
    } else {
      alert(`${isWebRtcMode ? 'Error al crear la sala WebRTC' : 'Error al crear sala en Steam'}: ${res.error || 'Desconocido'}`);
    }
  } catch (err) {
    alert('Error al crear sala: ' + err.message);
  }
}

async function handleLeaveLobby() {
  AudioSys.playUISelect();
  if (lobbyPollTimer) {
    clearInterval(lobbyPollTimer);
    lobbyPollTimer = null;
  }
  if (window.steamOnline) {
    try { await window.steamOnline.setLobbyData?.('status', 'ENDED'); } catch (e) {}
    await window.steamOnline.leaveLobby();
  }
  MultiplayerSync.reset();
  resetLobbyView();
}

async function handleCopyLobbyId() {
  AudioSys.playUISelect();
  if (window.steamOnline && window.steamOnline.openInviteDialog) {
    const res = await window.steamOnline.openInviteDialog();
    const copyBtn = document.getElementById('btn-copy-lobby-id');
    if (copyBtn) {
      const orig = copyBtn.innerHTML;
      copyBtn.innerHTML = `<span>${t('ui.online.btn_link_copied')}</span>`;
      setTimeout(() => { copyBtn.innerHTML = orig; }, 1800);
    }
    return;
  }
  const idEl = document.getElementById('steam-active-lobby-id');
  if (!idEl) return;
  const id = idEl.textContent.trim();
  if (id && id !== '---') {
    const url = `${window.location.origin}${window.location.pathname}?room=${id}`;
    try {
      await navigator.clipboard.writeText(url);
      AudioSys.play(800, 0.1, 'sine', 0.05);
      const copyBtn = document.getElementById('btn-copy-lobby-id');
      if (copyBtn) {
        const orig = copyBtn.innerHTML;
        copyBtn.innerHTML = `<span>${t('ui.online.btn_link_copied')}</span>`;
        setTimeout(() => { copyBtn.innerHTML = orig; }, 1800);
      }
    } catch (e) {
      prompt('Copia el enlace de la sala:', url);
    }
  }
}

async function handleInviteFriends() {
  return handleCopyLobbyId();
}


function showLobbyNotice(msg, tone = 'error') {
  const noticeEl = document.getElementById('steam-lobby-notice');
  if (noticeEl) {
    noticeEl.textContent = msg;
    noticeEl.style.color = tone === 'error' ? '#ff8a7a' : '#f0c954';
    noticeEl.style.borderColor = tone === 'error' ? '#ff4444' : '#b89c46';
    noticeEl.classList.remove('hidden');
  }
  if (window.steamOnline && typeof window.steamOnline.showToast === 'function') {
    window.steamOnline.showToast(msg, tone);
  }
}

async function joinLobbyDirect(lobbyId) {
  if (!window.steamOnline) return;
  try {
    AudioSys.playUISelect();
    const res = await window.steamOnline.joinLobby(lobbyId);
    if (res && res.success) {
      applyLobbyUpdate(res);
      const displayId = isWebRtcMode ? String(res.lobbyId || lobbyId).toUpperCase() : lobbyId.slice(-6);
      const notice = document.getElementById('steam-lobby-notice');
      if (notice) notice.classList.add('hidden');
      alert(t('ui.online.connected_success', { id: displayId }));
    } else {
      await openSteamOnlineModal();
      const err = res?.error || '';
      const isClosedOrEnded = (
        err.includes('finalizado') ||
        err.includes('cerrado') ||
        err.includes('peer-unavailable') ||
        err.includes('no disponible') ||
        err.includes('no existe') ||
        err.includes('ended') ||
        err.includes('cancelada')
      );
      const msg = isClosedOrEnded
        ? 'Esta partida ya ha finalizado o la sala se ha cerrado.'
        : ('No se pudo conectar a la sala: ' + (err || 'La sala no existe o está llena.'));

      showLobbyNotice(msg, 'error');
      alert(msg);
    }
  } catch (err) {
    await openSteamOnlineModal();
    const msg = 'Esta partida ya ha finalizado o la sala se ha cerrado.';
    showLobbyNotice(msg, 'error');
    alert(msg);
  }
}

async function handleJoinById() {
  const input = document.getElementById('steam-join-input');
  if (!input) return;
  let lobbyId = input.value.trim();
  if (!lobbyId) {
    alert(t('ui.online.err_invalid_id'));
    return;
  }

  if (!window.steamOnline) {
    alert(t('ui.online.err_need_steam'));
    return;
  }

  if (isWebRtcMode) {
    lobbyId = normalizeRoomCode(lobbyId);
    if (!lobbyId) {
      alert(t('ui.online.err_invalid_code'));
      return;
    }
    input.value = lobbyId;
  }

  await joinLobbyDirect(lobbyId);
}
