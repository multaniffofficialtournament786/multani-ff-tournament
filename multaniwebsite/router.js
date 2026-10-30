
import { state, Loader, Sound } from './config.js';
import { syncAuthAndProfile, renderAuth, renderProfile } from './auth.js';

// Prevent old navigation requests from overwriting new pages
let navigationId = 0;

// Show error instead of leaving a black screen
function showAppError(error, page) {
  console.error("App rendering error:", error);

  let screen = document.getElementById('app-error-screen');

  if (!screen) {
    screen = document.createElement('div');
    screen.id = 'app-error-screen';

    screen.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 999999;
      background: #06070a;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 25px;
      text-align: center;
      font-family: Arial, sans-serif;
    `;

    document.body.appendChild(screen);
  }

  screen.innerHTML = `
    <div style="max-width:360px;width:100%">
      <div style="font-size:48px;margin-bottom:15px">⚠️</div>

      <h2 style="color:#ff4624;margin:0 0 12px">
        Page Load Nahi Hua
      </h2>

      <p style="color:#bbb;line-height:1.6">
        App mein temporary masla aa gaya hai.
        Internet check karein aur dobara koshish karein.
      </p>

      <button id="app-error-retry"
        style="
          background:#ff4624;
          color:white;
          border:0;
          padding:13px 28px;
          border-radius:9px;
          font-size:15px;
          font-weight:bold;
          margin-top:15px;
          cursor:pointer;
        ">
        TRY AGAIN
      </button>
    </div>
  `;

  const retryButton = document.getElementById('app-error-retry');

  if (retryButton) {
    retryButton.onclick = () => {
      screen.remove();
      Router.navigate(page, null, false);
    };
  }
}

// Drawer Controls
export const Drawer = {
  open() {
    try {
      Sound?.playBrandName?.();
    } catch (error) {
      console.warn("Drawer sound error:", error);
    }

    document.getElementById('side-drawer')
      ?.classList.add('open');

    document.getElementById('drawer-overlay')
      ?.classList.remove('hidden');
  },

  close() {
    document.getElementById('side-drawer')
      ?.classList.remove('open');

    document.getElementById('drawer-overlay')
      ?.classList.add('hidden');
  }
};

// Main Router
export const Router = {
  history: [],

  async navigate(page, id = null, pushHistory = true) {
    const thisNavigation = ++navigationId;

    Drawer.close();

    try {
      Loader.show("Loading...");

      // Sync authentication with timeout protection
      await Promise.race([
        syncAuthAndProfile(),
        new Promise((_, reject) => {
          setTimeout(
            () => reject(new Error("Authentication timeout")),
            15000
          );
        })
      ]);

      // Ignore old navigation
      if (thisNavigation !== navigationId) return;

      // Redirect guests to login
      if (
        !state.currentUser &&
        page !== 'login' &&
        page !== 'register'
      ) {
        page = 'login';
      }

      // Update browser history
      if (
        pushHistory &&
        (
          this.history.length === 0 ||
          this.history[this.history.length - 1] !== page
        )
      ) {
        this.history.push(page);
        window.history.pushState(
          { page, id },
          '',
          '#' + page
        );
      }

      const isAuthView =
        page === 'login' || page === 'register';

      const masterHeader =
        document.getElementById('master-header-bar');

      const subHeader =
        document.getElementById('sub-header-bar');

      const bottomNav =
        document.getElementById('bottom-nav');

      // Header and navigation visibility
      if (isAuthView) {
        masterHeader?.classList.add('hidden');
        subHeader?.classList.add('hidden');
        bottomNav?.classList.add('hidden');
      } else {
        const isSub = page !== 'home';

        if (isSub) {
          masterHeader?.classList.add('hidden');
          subHeader?.classList.remove('hidden');

          const subTitle =
            document.getElementById('sub-header-title');

          if (subTitle) {
            subTitle.innerText =
              page.toUpperCase().replace('_', ' ');
          }
        } else {
          masterHeader?.classList.remove('hidden');
          subHeader?.classList.add('hidden');
        }

        bottomNav?.classList.remove('hidden');
      }

      // Active navigation item
      document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.toggle(
          'active',
          el.getAttribute('data-page') === page
        );
      });

      // Page render functions
      const renderers = {
        home: () => window.renderHome?.(),

        games: () => window.renderGamesList?.(),

        spin: () => window.renderDailySpin?.(),

        tournaments: () => window.renderTournaments?.(),

        tournament_detail: () =>
          window.renderTournamentDetail?.(id),

        wallet: () => window.renderWallet?.(),

        withdrawal: () => window.renderWithdrawal?.(),

        deposit: () => window.renderDeposit?.(),

        diamonds: () => window.renderDiamondsShop?.(),

        diamond_history: () =>
          window.renderDiamondHistoryPage?.('my'),

        diamond_public_deliveries: () =>
          window.renderDiamondHistoryPage?.('public'),

        invite: () => window.renderInvite?.(),

        winners: () => window.renderWinners?.(),

        leaderboard: () => window.renderLeaderboard?.(),

        notifications: () =>
          window.renderNotifications?.(),

        rules: () => window.renderRules?.(),

        about: () => window.renderAbout?.()
      };

      // Render selected page
      if (page === 'login' || page === 'register') {
        renderAuth(page);

      } else if (page === 'profile') {
        renderProfile();

      } else {
        const renderer = renderers[page];

        if (!renderer) {
          throw new Error(
            "Page renderer not found: " + page
          );
        }

        const result = renderer();

        if (
          result &&
          typeof result.then === 'function'
        ) {
          await result;
        }
      }

      // Ignore outdated navigation results
      if (thisNavigation !== navigationId) return;

      // Clear previous error screen
      document.getElementById('app-error-screen')
        ?.remove();

    } catch (error) {
      if (thisNavigation === navigationId) {
        showAppError(error, page);
      }

    } finally {
      // Always hide loader for the latest navigation
      if (thisNavigation === navigationId) {
        try {
          Loader.hide();
        } catch (loaderError) {
          console.error("Loader hide error:", loaderError);
        }
      }
    }
  },

  // Back navigation
  async back() {
    if (this.history.length > 1) {
      this.history.pop();

      const previousPage =
        this.history[this.history.length - 1];

      await this.navigate(
        previousPage,
        null,
        false
      );

    } else {
      const defaultPage =
        state.currentUser ? 'home' : 'login';

      await this.navigate(
        defaultPage,
        null,
        false
      );
    }
  }
};

// Browser back/forward events
export function setupRouterEvents() {
  window.addEventListener('popstate', () => {
    if (Router.history.length > 1) {
      Router.history.pop();

      const previousPage =
        Router.history[Router.history.length - 1] ||
        (state.currentUser ? 'home' : 'login');

      Router.navigate(
        previousPage,
        null,
        false
      );
    }
  });
}
