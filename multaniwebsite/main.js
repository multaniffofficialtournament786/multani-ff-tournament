
// ==========================================
// MULTANI FF OFFICIAL - MASTER MODULE LOADER
// SAFE UPDATED VERSION
// ==========================================

import {
  sbClient,
  state,
  Sound,
  Toast,
  Loader
} from './config.js';

import {
  syncAuthAndProfile,
  renderAuth,
  renderForgotPassword,
  renderProfile,
  uploadAvatarPhoto,
  saveUserProfile
} from './auth.js';

import {
  Router,
  Drawer,
  setupRouterEvents
} from './router.js';

import { renderHome } from './home.js';

import {
  renderGamesList,
  launchGame,
  closeGamePlayer
} from './games.js';

import {
  openDailyMissionsModal,
  closeDailyMissionsModal,
  toggleMissionsRulesDropdown,
  claimMissionReward
} from './missions.js';

import {
  renderTournaments,
  renderTournamentDetail,
  filterTournaments,
  toggleRulesDropdown
} from './tournaments.js';

import {
  renderDailySpin,
  triggerDailySpin
} from './spin.js';

import {
  renderWallet,
  renderDeposit,
  filterWalletHistory,
  toggleTransactionHistory,
  updatePaymentDetailsDisplay
} from './wallet.js';

import {
  renderWithdrawal,
  calculateWithdrawalNet
} from './withdrawal.js';

import {
  renderDiamondsShop,
  renderDiamondHistoryPage,
  requestDiamondPurchase
} from './diamonds.js';

import {
  renderWinners,
  renderLeaderboard,
  renderNotifications,
  renderInvite,
  renderRules,
  renderAbout
} from './extras.js';

// ==========================================
// 1. GLOBAL CONTROLS
// ==========================================

window.Router = Router;
window.Drawer = Drawer;
window.Sound = Sound;
window.Toast = Toast;
window.Loader = Loader;

// ==========================================
// 2. PAGE RENDER FUNCTIONS
// ==========================================

window.renderHome = renderHome;
window.renderGamesList = renderGamesList;
window.renderTournaments = renderTournaments;
window.renderTournamentDetail = renderTournamentDetail;
window.renderDailySpin = renderDailySpin;
window.renderWallet = renderWallet;
window.renderWithdrawal = renderWithdrawal;
window.renderDeposit = renderDeposit;
window.renderDiamondsShop = renderDiamondsShop;
window.renderDiamondHistoryPage = renderDiamondHistoryPage;
window.renderWinners = renderWinners;
window.renderLeaderboard = renderLeaderboard;
window.renderNotifications = renderNotifications;
window.renderInvite = renderInvite;
window.renderRules = renderRules;
window.renderAbout = renderAbout;

// ==========================================
// 3. AUTH & PROFILE FUNCTIONS
// ==========================================

window.renderAuth = renderAuth;
window.renderProfile = renderProfile;
window.renderForgotPassword = renderForgotPassword;
window.uploadAvatarPhoto = uploadAvatarPhoto;
window.saveUserProfile = saveUserProfile;

// ==========================================
// 4. GAME & APP ACTIONS
// ==========================================

window.launchGame = launchGame;
window.closeGamePlayer = closeGamePlayer;

window.openDailyMissionsModal = openDailyMissionsModal;
window.closeDailyMissionsModal = closeDailyMissionsModal;
window.toggleMissionsRulesDropdown = toggleMissionsRulesDropdown;
window.claimMissionReward = claimMissionReward;

window.filterTournaments = filterTournaments;
window.toggleRulesDropdown = toggleRulesDropdown;

window.triggerDailySpin = triggerDailySpin;

window.filterWalletHistory = filterWalletHistory;
window.toggleTransactionHistory = toggleTransactionHistory;
window.updatePaymentDetailsDisplay = updatePaymentDetailsDisplay;

window.calculateWithdrawalNet = calculateWithdrawalNet;
window.requestDiamondPurchase = requestDiamondPurchase;

// ==========================================
// 5. APK DOWNLOAD LINK
// ==========================================

const APK_DOWNLOAD_URL =
  "https://www.mediafire.com/file/9rz2av8v75uoo7q/_MULTANI_FF_OFFICIAL_TOURNAMENT_20171925+%281%29.apk/file?dkey=4ejqto951zi&r=1369";

// ==========================================
// 6. SAFE TEXT HELPER
// ==========================================

function safeText(value) {
  const element = document.createElement('div');
  element.textContent = String(value ?? '');
  return element.innerHTML;
}

// ==========================================
// 7. APP SHARE MODAL
// ==========================================

function getShareMessage() {
  const userUid =
    state.currentProfile?.free_fire_uid ||
    state.currentUser?.id?.slice(0, 8) ||
    '3239454397';

  return `🔥 Join Multani FF Tournaments & Win Real Cash! Download App: ${APK_DOWNLOAD_URL}

Use my Referral UID: *${userUid}* when registering!`;
}

window.openShareModal = () => {
  const modal = document.getElementById('share-modal-overlay');

  if (!modal) return;

  const shareMessage = getShareMessage();

  const wa = document.getElementById('share-whatsapp');
  const fb = document.getElementById('share-facebook');
  const tg = document.getElementById('share-telegram');

  if (wa) {
    wa.href =
      `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
  }

  if (fb) {
    fb.href =
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(APK_DOWNLOAD_URL)}`;
  }

  if (tg) {
    tg.href =
      `https://t.me/share/url?url=${encodeURIComponent(APK_DOWNLOAD_URL)}&text=${encodeURIComponent(shareMessage)}`;
  }

  modal.classList.remove('hidden');
};

window.closeShareModal = () => {
  document
    .getElementById('share-modal-overlay')
    ?.classList.add('hidden');
};

window.copyShareText = async () => {
  const shareMessage = getShareMessage();

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareMessage);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = shareMessage;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';

      document.body.appendChild(textarea);
      textarea.select();

      const copied = document.execCommand('copy');
      textarea.remove();

      if (!copied) throw new Error('Copy failed');
    }

    Toast.show('App link & referral code copied!', 'success');
    window.closeShareModal();

  } catch (error) {
    console.error('Copy error:', error);
    Toast.show('Copy nahi hua. Dobara try karein!', 'error');
  }
};

window.closeCommunityPopup = () => {
  document
    .getElementById('community-popup-overlay')
    ?.classList.add('hidden');
};

// ==========================================
// 8. SIDE DRAWER
// ==========================================

window.Drawer = {
  open: () => {
    document
      .getElementById('side-drawer')
      ?.classList.add('open');

    document
      .getElementById('drawer-overlay')
      ?.classList.remove('hidden');
  },

  close: () => {
    document
      .getElementById('side-drawer')
      ?.classList.remove('open');

    document
      .getElementById('drawer-overlay')
      ?.classList.add('hidden');
  }
};

// ==========================================
// 9. FLOATING SUPPORT ROBOT
// ==========================================

window.toggleSupportMenu = (forceState) => {
  const menu = document.getElementById('support-popup-menu');

  if (!menu) return;

  const shouldShow =
    typeof forceState === 'boolean'
      ? forceState
      : !menu.classList.contains('show');

  menu.classList.toggle('show', shouldShow);
};

function setupFloatingBotWidget() {
  const widget = document.getElementById('admin-float-widget');
  const mainBtn = document.getElementById('float-main-btn');

  if (!widget || !mainBtn) return;

  if (widget.dataset.dragReady === 'true') return;

  widget.dataset.dragReady = 'true';

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let origX = 0;
  let origY = 0;
  let hasMoved = false;

  function onStart(e) {
    const touch = e.touches?.[0] || e;

    if (typeof touch.clientX !== 'number') return;

    isDragging = true;
    hasMoved = false;

    startX = touch.clientX;
    startY = touch.clientY;

    const rect = widget.getBoundingClientRect();

    origX = rect.left;
    origY = rect.top;
  }

  function onMove(e) {
    if (!isDragging) return;

    const touch = e.touches?.[0] || e;

    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      hasMoved = true;
    }

    let newX = origX + dx;
    let newY = origY + dy;

    const maxX = Math.max(
      10,
      window.innerWidth - widget.offsetWidth - 10
    );

    const maxY = Math.max(
      50,
      window.innerHeight - widget.offsetHeight - 75
    );

    newX = Math.max(10, Math.min(newX, maxX));
    newY = Math.max(50, Math.min(newY, maxY));

    widget.style.left = `${newX}px`;
    widget.style.top = `${newY}px`;
    widget.style.right = 'auto';
    widget.style.bottom = 'auto';
  }

  function onEnd() {
    isDragging = false;
  }

  widget.addEventListener('touchstart', onStart, {
    passive: true
  });

  window.addEventListener('touchmove', onMove, {
    passive: true
  });

  window.addEventListener('touchend', onEnd);

  widget.addEventListener('mousedown', onStart);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onEnd);

  mainBtn.addEventListener('click', (e) => {
    e.stopPropagation();

    if (!hasMoved) {
      window.toggleSupportMenu();
    }
  });
}

// ==========================================
// 10. SUPPORT CHAT
// ==========================================

let supportChatSub = null;

window.ChatModal = {
  open: async () => {
    const overlay =
      document.getElementById('chat-modal-overlay');

    if (!overlay) return;

    overlay.classList.remove('hidden');

    if (!state.currentUser) {
      Toast.show(
        'Please login to contact support',
        'info'
      );
      return;
    }

    await window.ChatModal.loadMessages();

    if (supportChatSub || !sbClient) return;

    try {
      const userId = state.currentUser.id;

      supportChatSub = sbClient
        .channel(`support-chat-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'support_messages',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const newMsg = payload.new;

            if (
              newMsg &&
              newMsg.sender_role === 'admin'
            ) {
              window.ChatModal.appendMessage(
                newMsg.message,
                'theirs',
                newMsg.created_at,
                'Admin Support'
              );

              Sound?.play?.('notification');
            }
          }
        )
        .subscribe();

    } catch (error) {
      console.warn('Realtime support error:', error);
      supportChatSub = null;
    }
  },

  close: () => {
    document
      .getElementById('chat-modal-overlay')
      ?.classList.add('hidden');
  },

  loadMessages: async () => {
    if (!sbClient || !state.currentUser) return;

    const container =
      document.getElementById('chat-modal-messages');

    if (!container) return;

    try {
      const { data, error } = await sbClient
        .from('support_messages')
        .select('*')
        .eq('user_id', state.currentUser.id)
        .order('created_at', {
          ascending: true
        });

      if (error) throw error;

      container.innerHTML = `
        <div class="chat-row theirs">
          <div class="chat-bubble theirs">
            Assalam-o-Alaikum! Welcome to Multani FF Official.
            Room ID, Deposit ya kisi bhi problem k liye yahan message karein.
          </div>
          <div class="chat-time-tag"
               style="text-align:left;padding-left:4px;color:#6b7280;">
            Support Desk
          </div>
        </div>
      `;

      if (Array.isArray(data)) {
        data.forEach((msg) => {
          const type =
            msg.sender_role === 'admin'
              ? 'theirs'
              : 'mine';

          const label =
            msg.sender_role === 'admin'
              ? 'Support Desk'
              : (
                  state.currentProfile?.free_fire_name ||
                  state.currentProfile?.full_name ||
                  'You'
                );

          window.ChatModal.appendMessage(
            msg.message,
            type,
            msg.created_at,
            label
          );
        });
      }

      container.scrollTop = container.scrollHeight;

    } catch (error) {
      console.error('Support chat load error:', error);

      Toast.show(
        'Chat load nahi hui. Internet check karein!',
        'error'
      );
    }
  },

  appendMessage: (message, type, timeStr, senderLabel) => {
    const container =
      document.getElementById('chat-modal-messages');

    if (!container) return;

    const row = document.createElement('div');
    row.className = `chat-row ${type}`;

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${type}`;
    bubble.textContent = String(message ?? '');

    const timeTag = document.createElement('div');
    timeTag.className = 'chat-time-tag';

    timeTag.style.textAlign =
      type === 'mine' ? 'right' : 'left';

    timeTag.style.paddingLeft =
      type === 'mine' ? '0' : '4px';

    timeTag.style.paddingRight =
      type === 'mine' ? '4px' : '0';

    timeTag.style.color = '#6b7280';

    let formattedTime = 'Now';

    if (timeStr) {
      const date = new Date(timeStr);

      if (!Number.isNaN(date.getTime())) {
        formattedTime = date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }

    timeTag.textContent =
      `${String(senderLabel ?? 'Player')} • ${formattedTime}`;

    row.appendChild(bubble);
    row.appendChild(timeTag);

    container.appendChild(row);
    container.scrollTop = container.scrollHeight;
  },

  sendMessage: async (e) => {
    e?.preventDefault?.();

    const input =
      document.getElementById('chat-modal-input');

    if (!input) return;

    const msgText = input.value.trim();

    if (!msgText) return;

    if (!state.currentUser) {
      Toast.show('Please login first!', 'error');
      return;
    }

    if (!sbClient) {
      Toast.show('Internet connection check karein!', 'error');
      return;
    }

    const senderName =
      state.currentProfile?.free_fire_name ||
      state.currentProfile?.full_name ||
      'Player';

    const previousValue = input.value;

    input.value = '';

    window.ChatModal.appendMessage(
      msgText,
      'mine',
      new Date().toISOString(),
      senderName
    );

    try {
      const payload = {
        user_id: state.currentUser.id,
        user_name: senderName,
        user_uid:
          state.currentProfile?.free_fire_uid || 'N/A',
        message: msgText,
        sender_role: 'user',
        is_read_by_admin: false,
        created_at: new Date().toISOString()
      };

      const { error } = await sbClient
        .from('support_messages')
        .insert([payload]);

      if (error) throw error;

      Sound?.play?.('click');

    } catch (error) {
      console.error('Failed to send support message:', error);

      input.value = previousValue;

      Toast.show(
        'Message send failed. Check internet!',
        'error'
      );
    }
  }
};

// ==========================================
// 11. HEADER & UI EVENT BINDINGS
// ==========================================

function bindHeaderAndUIEvents() {
  const btnHam =
    document.getElementById('btn-hamburger');

  if (btnHam && btnHam.dataset.bound !== 'true') {
    btnHam.dataset.bound = 'true';

    btnHam.onclick = (e) => {
      e.stopPropagation();
      window.Drawer.open();
    };
  }

  const btnShare =
    document.getElementById('btn-header-share');

  if (btnShare && btnShare.dataset.bound !== 'true') {
    btnShare.dataset.bound = 'true';

    btnShare.onclick = (e) => {
      e.stopPropagation();
      window.openShareModal();
    };
  }

  const chatForm =
    document.getElementById('chat-modal-form');

  if (chatForm && chatForm.dataset.bound !== 'true') {
    chatForm.dataset.bound = 'true';
    chatForm.onsubmit = window.ChatModal.sendMessage;
  }

  setupFloatingBotWidget();
}

// ==========================================
// 12. SAFE APP INITIALIZATION
// ==========================================

let appInitialized = false;

async function initializeMultaniApp() {
  if (appInitialized) return;

  appInitialized = true;

  try {
    setupRouterEvents();
    bindHeaderAndUIEvents();

    const initialHash =
      window.location.hash
        .replace('#', '')
        .trim() || 'home';

    // Authentication sync
    try {
      await syncAuthAndProfile();
    } catch (authError) {
      console.warn(
        'Auth sync notice:',
        authError
      );
    }

    const authPages = [
      'login',
      'register'
    ];

    if (
      !state.currentUser &&
      !authPages.includes(initialHash)
    ) {
      await Router.navigate(
        'login',
        null,
        false
      );

      return;
    }

    await Router.navigate(
      initialHash,
      null,
      false
    );

  } catch (error) {
    console.error(
      'App initialization error:',
      error
    );

    Toast.show(
      'App load nahi ho saki. Internet check karein aur dobara try karein.',
      'error'
    );

  } finally {
    setTimeout(() => {
      Loader.hide();
    }, 300);
  }
}

// ==========================================
// 13. DOM READY
// ==========================================

if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    initializeMultaniApp,
    { once: true }
  );
} else {
  initializeMultaniApp();
}

// ==========================================
// 14. SAFE APP REFRESH
// ==========================================

window.hardRefreshApp = async () => {
  try {
    Loader.show('Refreshing...');

    await syncAuthAndProfile();

    const targetPage =
      state.currentUser ? 'home' : 'login';

    await Router.navigate(
      targetPage,
      null,
      false
    );

    Toast.show(
      'App Refreshed!',
      'success'
    );

  } catch (error) {
    console.error(
      'Refresh error:',
      error
    );

    Toast.show(
      'Refresh failed. Internet check karein!',
      'error'
    );

  } finally {
    Loader.hide();
  }
};

// ==========================================
// 15. GLOBAL ERROR LOGGING
// ==========================================

window.addEventListener('error', (event) => {
  console.error(
    'Global app error:',
    event.error || event.message
  );
});

window.addEventListener(
  'unhandledrejection',
  (event) => {
    console.error(
      'Unhandled promise rejection:',
      event.reason
    );
  }
);
                         
