import { state, Sound } from './config.js';
import { syncAuthAndProfile, renderAuth, renderProfile } from './auth.js';

export const Drawer = {
  open() {
    if (Sound && Sound.playBrandName) Sound.playBrandName();
    const sideDrawer = document.getElementById('side-drawer');
    const drawerOverlay = document.getElementById('drawer-overlay');
    if (sideDrawer) sideDrawer.classList.add('open');
    if (drawerOverlay) drawerOverlay.classList.remove('hidden');
  },
  close() {
    const sideDrawer = document.getElementById('side-drawer');
    const drawerOverlay = document.getElementById('drawer-overlay');
    if (sideDrawer) sideDrawer.classList.remove('open');
    if (drawerOverlay) drawerOverlay.classList.add('hidden');
  }
};

export const Router = {
  history: [],
  async navigate(page, id = null, pushHistory = true) {
    Drawer.close();

    // Background sync: User profile background mein sync hogi bina screen rokay
    syncAuthAndProfile().catch(err => console.warn("Background auth sync error:", err));

    // Agar user logged in na ho aur auth pages na hon
    if (!state.currentUser && page !== 'login' && page !== 'register') {
      page = 'login';
    }

    if (pushHistory && (this.history.length === 0 || this.history[this.history.length - 1] !== page)) {
      this.history.push(page);
      history.pushState({ page, id }, '', '#' + page);
    }

    const isAuthView = (page === 'login' || page === 'register');
    const masterHeader = document.getElementById('master-header-bar');
    const subHeader = document.getElementById('sub-header-bar');
    const bottomNav = document.getElementById('bottom-nav');

    // Headers & Nav bar updates
    if (isAuthView) {
      if (masterHeader) masterHeader.classList.add('hidden');
      if (subHeader) subHeader.classList.add('hidden');
      if (bottomNav) bottomNav.classList.add('hidden');
    } else {
      const isSub = (page !== 'home');
      if (isSub) {
        if (masterHeader) masterHeader.classList.add('hidden');
        if (subHeader) subHeader.classList.remove('hidden');
        const subTitle = document.getElementById('sub-header-title');
        if (subTitle) subTitle.innerText = page.toUpperCase().replace('_', ' ');
      } else {
        if (masterHeader) masterHeader.classList.remove('hidden');
        if (subHeader) subHeader.classList.add('hidden');
      }
      if (bottomNav) bottomNav.classList.remove('hidden');
    }

    // Active bottom-bar button toggle
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-page') === page);
    });

    // Instant Page Render (No full-screen blocking loader)
    try {
      if (page === 'home' && window.renderHome) await window.renderHome();
      else if (page === 'games' && window.renderGamesList) await window.renderGamesList();
      else if (page === 'spin' && window.renderDailySpin) await window.renderDailySpin();
      else if (page === 'tournaments' && window.renderTournaments) await window.renderTournaments();
      else if (page === 'tournament_detail' && window.renderTournamentDetail) await window.renderTournamentDetail(id);
      else if (page === 'wallet' && window.renderWallet) await window.renderWallet();
      else if (page === 'withdrawal' && window.renderWithdrawal) await window.renderWithdrawal();
      else if (page === 'deposit' && window.renderDeposit) window.renderDeposit();
      else if (page === 'diamonds' && window.renderDiamondsShop) await window.renderDiamondsShop();
      else if (page === 'diamond_history' && window.renderDiamondHistoryPage) await window.renderDiamondHistoryPage('my');
      else if (page === 'diamond_public_deliveries' && window.renderDiamondHistoryPage) await window.renderDiamondHistoryPage('public');
      else if (page === 'invite' && window.renderInvite) await window.renderInvite();
      else if (page === 'login' || page === 'register') renderAuth(page);
      else if (page === 'profile') renderProfile();
      else if (page === 'winners' && window.renderWinners) await window.renderWinners();
      else if (page === 'leaderboard' && window.renderLeaderboard) await window.renderLeaderboard();
      else if (page === 'notifications' && window.renderNotifications) await window.renderNotifications();
      else if (page === 'rules' && window.renderRules) window.renderRules();
      else if (page === 'about' && window.renderAbout) window.renderAbout();
    } catch (navErr) {
      console.error("Navigation error:", navErr);
    }
  },

  async back() {
    if (this.history.length > 1) {
      this.history.pop();
      const prev = this.history[this.history.length - 1];
      await this.navigate(prev, null, false);
    } else {
      const defaultPage = state.currentUser ? 'home' : 'login';
      await this.navigate(defaultPage, null, false);
    }
  }
};

export function setupRouterEvents() {
  window.addEventListener('popstate', (e) => {
    if (Router.history.length > 1) {
      Router.history.pop();
      const prev = Router.history[Router.history.length - 1] || (state.currentUser ? 'home' : 'login');
      Router.navigate(prev, null, false);
    }
  });
}
