// ==========================================
// MULTANI FF OFFICIAL - MASTER MODULE LOADER
// ==========================================

import { state, Sound, Toast, Loader } from './config.js';
import { syncAuthAndProfile, renderAuth, renderForgotPassword, renderProfile, uploadAvatarPhoto, saveUserProfile } from './auth.js';
import { Router, Drawer, setupRouterEvents } from './router.js';
import { renderHome } from './home.js';
import { renderGamesList, launchGame, closeGamePlayer } from './games.js';
import { openDailyMissionsModal, closeDailyMissionsModal, toggleMissionsRulesDropdown, claimMissionReward } from './missions.js';
import { renderTournaments, renderTournamentDetail, filterTournaments, toggleRulesDropdown } from './tournaments.js';
import { renderDailySpin, triggerDailySpin } from './spin.js';
import { renderWallet, renderDeposit, filterWalletHistory, toggleTransactionHistory, updatePaymentDetailsDisplay } from './wallet.js';
import { renderWithdrawal, calculateWithdrawalNet } from './withdrawal.js';
import { renderDiamondsShop, renderDiamondHistoryPage, requestDiamondPurchase } from './diamonds.js';
import { renderWinners, renderLeaderboard, renderNotifications, renderInvite, renderRules, renderAbout } from './extras.js';

// گلوبل ونڈو ابجیکٹ پر بنیادی کنٹرولز اٹیچ کرنا
window.Router = Router;
window.Drawer = Drawer;
window.Sound = Sound;
window.Toast = Toast;
window.Loader = Loader;

// Pages Render Functions
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

// Profile & Auth Functions
window.renderForgotPassword = renderForgotPassword;
window.uploadAvatarPhoto = uploadAvatarPhoto;
window.saveUserProfile = saveUserProfile;

// Interactivity & Actions
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

// App Refresh Handler
window.hardRefreshApp = async () => {
  Loader.show("Refreshing...");
  await syncAuthAndProfile();
  await Router.navigate('home', null, false);
  Loader.hide();
  Toast.show("App Refreshed!", "success");
};

// ==========================================
// 1. HAMBURGER (3 LINES) & SIDE DRAWER
// ==========================================
window.Drawer = {
  open: () => {
    document.getElementById('side-drawer')?.classList.add('open');
    document.getElementById('drawer-overlay')?.classList.remove('hidden');
  },
  close: () => {
    document.getElementById('side-drawer')?.classList.remove('open');
    document.getElementById('drawer-overlay')?.classList.add('hidden');
  }
};

// ==========================================
// 2. SHARE BUTTON & SHARE MODAL CONTROLS
// ==========================================
const APK_DOWNLOAD_URL = "https://www.mediafire.com/file/9rz2av8v75uoo7q/_MULTANI_FF_OFFICIAL_TOURNAMENT_20171925+%281%29.apk/file?dkey=4ejqto951zi&r=1369";

window.openShareModal = () => {
  const modal = document.getElementById('share-modal-overlay');
  if (modal) {
    const userUid = state.currentProfile?.free_fire_uid || state.currentUser?.id?.slice(0, 8) || '3239454397';
    const shareMessage = `🔥 Join Multani FF Tournaments & Win Real Cash! Download App: ${APK_DOWNLOAD_URL}\n\nUse my Referral UID: *${userUid}* when registering!`;

    const wa = document.getElementById('share-whatsapp');
    const fb = document.getElementById('share-facebook');
    const tg = document.getElementById('share-telegram');

    if (wa) wa.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
    if (fb) fb.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(APK_DOWNLOAD_URL)}`;
    if (tg) tg.href = `https://t.me/share/url?url=${encodeURIComponent(APK_DOWNLOAD_URL)}&text=${encodeURIComponent(shareMessage)}`;

    modal.classList.remove('hidden');
  }
};

window.closeShareModal = () => {
  document.getElementById('share-modal-overlay')?.classList.add('hidden');
};

window.copyShareText = () => {
  const userUid = state.currentProfile?.free_fire_uid || state.currentUser?.id?.slice(0, 8) || '3239454397';
  const shareMessage = `🔥 Join Multani FF Tournaments & Win Real Cash! Download App: ${APK_DOWNLOAD_URL}\n\nUse my Referral UID: *${userUid}* when registering!`;
  navigator.clipboard.writeText(shareMessage);
  Toast.show("App link & referral code copied!", "success");
  window.closeShareModal();
};

window.closeCommunityPopup = () => {
  document.getElementById('community-popup-overlay')?.classList.add('hidden');
};

// ==========================================
// 3. DRAGGABLE FLOATING ROBOT SPEED-DIAL
// ==========================================
window.toggleSupportMenu = (forceState) => {
  const menu = document.getElementById('support-popup-menu');
  if (!menu) return;
  const shouldShow = typeof forceState === 'boolean' ? forceState : !menu.classList.contains('show');
  menu.classList.toggle('show', shouldShow);
};

function setupFloatingBotWidget() {
  const widget = document.getElementById('admin-float-widget');
  const mainBtn = document.getElementById('float-main-btn');

  if (!widget || !mainBtn || widget.dataset.dragReady === 'true') return;
  widget.dataset.dragReady = 'true';

  let isDragging = false;
  let startX = 0, startY = 0;
  let origX = 0, origY = 0;
  let hasMoved = false;

  function onStart(e) {
    isDragging = true;
    hasMoved = false;
    const touch = e.touches ? e.touches[0] : e;
    startX = touch.clientX;
    startY = touch.clientY;
    const rect = widget.getBoundingClientRect();
    origX = rect.left;
    origY = rect.top;
  }

  function onMove(e) {
    if (!isDragging) return;
    const touch = e.touches ? e.touches[0] : e;
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      hasMoved = true;
    }

    let newX = origX + dx;
    let newY = origY + dy;

    // Mobile screen bounds protection
    const maxX = window.innerWidth - widget.offsetWidth - 10;
    const maxY = window.innerHeight - widget.offsetHeight - 75;

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

  widget.addEventListener('touchstart', onStart, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: true });
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
// INITIALIZATION & EVENT BINDINGS
// ==========================================
function bindHeaderAndUIEvents() {
  const btnHam = document.getElementById('btn-hamburger');
  if (btnHam) {
    btnHam.onclick = (e) => {
      e.stopPropagation();
      window.Drawer.open();
    };
  }

  const btnShare = document.getElementById('btn-header-share');
  if (btnShare) {
    btnShare.onclick = (e) => {
      e.stopPropagation();
      window.openShareModal();
    };
  }

  setupFloatingBotWidget();
}

document.addEventListener('DOMContentLoaded', async () => {
  setupRouterEvents();
  bindHeaderAndUIEvents();
  await syncAuthAndProfile();

  // براؤزر URL ہیش کی بنیاد پر پیج اوپن کرنا
  const initialHash = window.location.hash.replace('#', '') || 'home';
  if (!state.currentUser && initialHash !== 'login' && initialHash !== 'register') {
    Router.navigate('login', null, false);
  } else {
    Router.navigate(initialHash, null, false);
  }
});

// Fallback init
setTimeout(() => {
  bindHeaderAndUIEvents();
}, 500);
