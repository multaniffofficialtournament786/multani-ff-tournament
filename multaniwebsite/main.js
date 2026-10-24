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

// گلوبل ونڈو ابجیکٹ پر فنکشنز اٹیچ کرنا تاکہ HTML کلکس پر کام کریں
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
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  setupRouterEvents();
  await syncAuthAndProfile();

  // براؤزر URL ہیش کی بنیاد پر پیج اوپن کرنا
  const initialHash = window.location.hash.replace('#', '') || 'home';
  if (!state.currentUser && initialHash !== 'login' && initialHash !== 'register') {
    Router.navigate('login', null, false);
  } else {
    Router.navigate(initialHash, null, false);
  }
});
