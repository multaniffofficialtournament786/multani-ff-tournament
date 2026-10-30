// Multani FF Official Background Image & Logo
export const MULTANI_BG_IMG = "./multani-runner/multani-runner/multani-runner/sounds/1792388836123.jpg";
export const MULTANI_FF_LOGO = "./multaniwebsite/1793357792725.png";

function injectVIPLoaderStyles() {
  if (document.getElementById('mff-loader-styles')) return;
  const style = document.createElement('style');
  style.id = 'mff-loader-styles';
  style.innerHTML = `
    .mff-splash-overlay {
      position: fixed;
      inset: 0;
      background: #0d0907;
      background: linear-gradient(rgba(5, 5, 10, 0.85), rgba(5, 5, 10, 0.9)), url('${MULTANI_BG_IMG}') center/cover no-repeat;
      z-index: 999999;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: sans-serif;
      color: #ffffff;
      pointer-events: none; /* Screen kabhi freeze nahi hogi */
    }
    .mff-corner {
      position: absolute;
      width: 24px;
      height: 24px;
      border-color: #00f0ff;
      filter: drop-shadow(0 0 6px #00f0ff);
      border-style: solid;
      pointer-events: none;
    }
    .mff-corner.top-left { top: 20px; left: 20px; border-width: 3px 0 0 3px; }
    .mff-corner.top-right { top: 20px; right: 20px; border-width: 3px 3px 0 0; }
    .mff-corner.bottom-left { bottom: 20px; left: 20px; border-width: 0 0 3px 3px; }
    .mff-corner.bottom-right { bottom: 20px; right: 20px; border-width: 0 3px 3px 0; }

    .mff-dp-wrapper {
      position: relative;
      width: 150px;
      height: 150px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
    }
    .mff-rotate-ring {
      position: absolute;
      inset: -5px;
      border-radius: 50%;
      border: 3px solid transparent;
      border-top: 4px solid #00f0ff;
      border-right: 4px solid #ff0055;
      box-shadow: 0 0 20px rgba(0, 240, 255, 0.4);
      animation: mffSpinDP 1.8s linear infinite;
    }
    @keyframes mffSpinDP {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .mff-user-dp {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid #00f0ff;
      background: #111;
      z-index: 2;
    }
    .mff-loader-title {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 2px;
      color: #ffffff;
      margin: 0;
      text-transform: uppercase;
    }
    .mff-loader-subtitle {
      font-size: 11px;
      letter-spacing: 2px;
      color: #00f0ff;
      font-weight: 600;
      margin-top: 6px;
      margin-bottom: 40px;
      text-transform: uppercase;
    }
    .mff-loader-bottom {
      position: absolute;
      bottom: 50px;
      width: 80%;
      max-width: 260px;
      text-align: center;
    }
    .mff-loader-status {
      font-size: 12px;
      color: #d1d5db;
      margin-bottom: 8px;
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
      box-shadow: 0 0 10px #00f0ff;
      border-radius: 6px;
      animation: mffProgressAnim 1.4s ease-in-out infinite alternate;
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
          <img src="${MULTANI_FF_LOGO}" class="mff-user-dp" id="mff-splash-dp" alt="Logo" onerror="this.src='https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120'" />
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
    }

    overlay.style.display = 'flex';
    overlay.style.pointerEvents = 'auto'; // Load hote waqt clicks rokay

    // Agar slow internet ya crash ho to 3 second baad khud ba khud hata dega
    if (window._vipLoaderTimeout) clearTimeout(window._vipLoaderTimeout);
    window._vipLoaderTimeout = setTimeout(() => {
      this.hide();
    }, 3000);
  },

  hide() {
    if (window._vipLoaderTimeout) clearTimeout(window._vipLoaderTimeout);
    const overlay = document.getElementById('mff-vip-splash');
    if (overlay) {
      overlay.style.display = 'none';
      overlay.style.pointerEvents = 'none';
    }
    const oldLoader = document.getElementById('global-loader');
    if (oldLoader) oldLoader.classList.add('hidden');
  }
};
