// Multani FF Official Background Image & Logo
export const MULTANI_BG_IMG = "https://raw.githubusercontent.com/multaniffofficialtournament786/multani-ff-tournament/main/multani-runner/multani-runner/multani-runner/sounds/1792388836123.jpg";
export const MULTANI_FF_LOGO = "https://raw.githubusercontent.com/multaniffofficialtournament786/multani-ff-tournament/main/multaniwebsite/1793357792725.png";

function injectVIPLoaderStyles() {
  if (document.getElementById('mff-loader-styles')) return;
  const style = document.createElement('style');
  style.id = 'mff-loader-styles';
  style.innerHTML = `
    .mff-splash-overlay {
      position: fixed;
      inset: 0;
      background: linear-gradient(rgba(5, 5, 10, 0.82), rgba(5, 5, 10, 0.88)), url('${MULTANI_BG_IMG}') center/cover no-repeat;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: 'Rajdhani', sans-serif, system-ui;
      color: #ffffff;
      overflow: hidden;
    }
    
    /* Neon Cyan Gaming Corners */
    .mff-corner {
      position: absolute;
      width: 26px;
      height: 26px;
      border-color: #00f0ff;
      filter: drop-shadow(0 0 6px #00f0ff);
      border-style: solid;
      pointer-events: none;
    }
    .mff-corner.top-left { top: 22px; left: 22px; border-width: 3px 0 0 3px; }
    .mff-corner.top-right { top: 22px; right: 22px; border-width: 3px 3px 0 0; }
    .mff-corner.bottom-left { bottom: 22px; left: 22px; border-width: 0 0 3px 3px; }
    .mff-corner.bottom-right { bottom: 22px; right: 22px; border-width: 0 3px 3px 0; }

    /* Full Large Glowing Circular Frame */
    .mff-dp-wrapper {
      position: relative;
      width: 170px;
      height: 170px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 28px;
    }
    .mff-rotate-ring {
      position: absolute;
      inset: -6px;
      border-radius: 50%;
      border: 3.5px solid transparent;
      border-top: 4px solid #00f0ff;
      border-right: 4px solid #ff0055;
      box-shadow: 0 0 25px rgba(0, 240, 255, 0.5);
      animation: mffSpinDP 1.8s linear infinite;
    }
    @keyframes mffSpinDP {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    /* DP Pura Gol Dayre me Fit */
    .mff-user-dp {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid #00f0ff;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.95), inset 0 0 10px rgba(0, 240, 255, 0.3);
      z-index: 2;
    }
    .mff-loader-title {
      font-size: 30px;
      font-weight: 900;
      letter-spacing: 3px;
      color: #ffffff;
      margin: 0;
      text-transform: uppercase;
      text-shadow: 0 0 15px rgba(0, 240, 255, 0.6);
    }
    .mff-loader-subtitle {
      font-size: 11px;
      letter-spacing: 2px;
      color: #00f0ff;
      font-weight: 700;
      margin-top: 6px;
      margin-bottom: 50px;
      text-transform: uppercase;
      text-shadow: 0 0 8px rgba(0, 240, 255, 0.4);
    }
    .mff-loader-bottom {
      position: absolute;
      bottom: 55px;
      width: 82%;
      max-width: 270px;
      text-align: center;
    }
    .mff-loader-status {
      font-size: 12px;
      color: #d1d5db;
      letter-spacing: 1.5px;
      margin-bottom: 10px;
    }
    .mff-progress-track {
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      overflow: hidden;
      position: relative;
    }
    .mff-progress-bar {
      width: 50%;
      height: 100%;
      background: linear-gradient(90deg, #00f0ff, #ff0055);
      box-shadow: 0 0 12px #00f0ff;
      border-radius: 6px;
      animation: mffProgressAnim 1.5s ease-in-out infinite alternate;
    }
    @keyframes mffProgressAnim {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(200%); }
    }
  `;
  document.head.appendChild(style);
}

export const Loader = {
  show(text = "Loading Arena...") {
    injectVIPLoaderStyles();
    let overlay = document.getElementById('mff-vip-splash');

    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'mff-vip-splash';
      overlay.className = 'mff-splash-overlay';
      overlay.innerHTML = `
        <div class="mff-corner top-left"></div>
        <div class="mff-corner top-right"></div>
        <div class="mff-corner bottom-left"></div>
        <div class="mff-corner bottom-right"></div>

        <div class="mff-dp-wrapper">
          <div class="mff-rotate-ring"></div>
          <img src="${MULTANI_FF_LOGO}" class="mff-user-dp" id="mff-splash-dp" alt="Logo" />
        </div>

        <h1 class="mff-loader-title">MULTANI FF ARENA</h1>
        <div class="mff-loader-subtitle">PAKISTAN'S #1 TOURNAMENT ARENA</div>

        <div class="mff-loader-bottom">
          <div class="mff-loader-status" id="mff-splash-status">${text}</div>
          <div class="mff-progress-track">
            <div class="mff-progress-bar"></div>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    } else {
      const statusEl = document.getElementById('mff-splash-status');
      if (statusEl) statusEl.innerText = text;
      overlay.style.display = 'flex';
    }

    if (window._vipLoaderTimeout) clearTimeout(window._vipLoaderTimeout);
    window._vipLoaderTimeout = setTimeout(() => {
      this.hide();
    }, 4500);
  },

  hide() {
    if (window._vipLoaderTimeout) clearTimeout(window._vipLoaderTimeout);
    const overlay = document.getElementById('mff-vip-splash');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }
};
