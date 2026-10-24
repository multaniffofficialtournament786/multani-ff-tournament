import { sbClient, state, Toast, Loader, Sound, escapeHTML } from './config.js';
import { syncAuthAndProfile } from './auth.js';

export async function renderDiamondsShop() {
  if (!state.currentUser) { 
    window.Router.navigate('login'); 
    return; 
  }
  
  let packages = [];
  try {
    const { data } = await sbClient.from('diamond_packages').select('*').eq('is_active', true).order('diamond_count', { ascending: true });
    packages = data || [];
  } catch (e) {
    console.error(e);
  }

  const packagesGridHtml = packages.length ? packages.map(pkg => `
    <div style="background:var(--bg-card); border:1.5px solid #ff770044; border-radius:var(--radius); padding:14px; text-align:center; display:flex; flex-direction:column; justify-content:space-between;">
      <div>
        <div style="font-family:var(--font-gaming); font-size:24px; font-weight:800; color:var(--accent-gold); margin-bottom:4px;">${pkg.diamond_count} 💎</div>
        <div style="font-size:12px; color:var(--text-muted); margin-bottom:12px;">Price: <strong style="color:#fff;">${pkg.coin_price} Coins</strong></div>
      </div>
      <button onclick="window.requestDiamondPurchase(${pkg.id})" class="btn btn-primary" style="padding:8px; font-size:12px; background:linear-gradient(135deg, #ff7700, #ff4624);">
        BUY NOW
      </button>
    </div>
  `).join('') : '<p style="color:var(--text-dim); text-align:center;">No diamond packages available.</p>';

  document.getElementById('app-view').innerHTML = `
    <div class="view-container">
      <div style="background:linear-gradient(135deg, rgba(255,190,0,0.15), rgba(255,70,36,0.1)); border:1.5px solid var(--accent-gold); border-radius:var(--radius); padding:14px; margin-bottom:16px; box-shadow:0 4px 15px rgba(255,190,0,0.2);">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
          <i class="fa-solid fa-triangle-exclamation" style="color:var(--accent-gold); font-size:16px;"></i>
          <span style="font-family:var(--font-gaming); font-size:14px; font-weight:800; color:var(--accent-gold); text-transform:uppercase;">VIP Important Notice</span>
        </div>
        <p style="font-size:11px; color:#fff; line-height:1.5;">
          Diamond purchase karne se pehle apni profile mein <strong>Free Fire UID aur Game Name (IGN)</strong> bilkul drust check kar lein. Agar details ghalat hui aur diamonds kisi aur account mein chale gaye, toh <strong>admin ki koi zimedari nahi hogi</strong>.
        </p>
      </div>

      <div class="section-title"><span><i class="fa-solid fa-gem text-gold"></i> Buy Free Fire Diamonds</span></div>
      <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:10px; margin-bottom:20px;">
        ${packagesGridHtml}
      </div>

      <div class="section-title"><span>📜 Diamond History Center</span></div>
      <div style="display:flex; gap:16px; justify-content:center; margin-top:10px;">
        <div id="action-btn-my" class="cat-item" onclick="window.Router.navigate('diamond_history')">
          <div class="cat-circle" style="background:linear-gradient(135deg, #1f293d, #0f131a); border-color:var(--accent-gold);"><i class="fa-solid fa-clock-rotate-left text-gold"></i></div>
          <span class="cat-label">My History</span>
        </div>
        <div id="action-btn-public" class="cat-item" onclick="window.Router.navigate('diamond_public_deliveries')">
          <div class="cat-circle" style="background:linear-gradient(135deg, #1f293d, #0f131a); border-color:var(--accent-cyan);"><i class="fa-solid fa-globe text-accent"></i></div>
          <span class="cat-label">Public Deliveries</span>
        </div>
      </div>
    </div>
  `;
}

export async function renderDiamondHistoryPage(type) {
  if (!state.currentUser) { 
    window.Router.navigate('login'); 
    return; 
  }

  const titleText = type === 'my' ? "My Diamond History" : "Public Diamond Deliveries";
  let contentHtml = '';

  if (type === 'my') {
    const { data } = await sbClient.from('diamond_requests').select('*').eq('user_id', state.currentUser.id).order('created_at', { ascending: false });
    const list = data || [];
    contentHtml = list.length ? list.map(req => `
      <div class="tx-item" style="border-left: 3px solid ${req.status === 'delivered' ? 'var(--success)' : (req.status === 'rejected' ? 'var(--danger)' : 'var(--accent-gold)')};">
        <div class="tx-info">
          <h4>${req.diamonds} Diamonds 💎</h4>
          <span>UID: ${escapeHTML(req.free_fire_uid)} (${escapeHTML(req.game_name)})<br>${new Date(req.created_at).toLocaleString()}</span>
        </div>
        <div style="text-align:right;">
          <div style="font-family:var(--font-gaming); font-size:14px; color:var(--danger); font-weight:bold;">-${req.coins_deducted} Coins</div>
          <span style="font-size:10px; padding:2px 8px; border-radius:6px; font-weight:bold; text-transform:uppercase; background:${req.status === 'delivered' ? 'rgba(0,230,118,0.2)' : (req.status === 'rejected' ? 'rgba(255,23,68,0.2)' : 'rgba(255,190,0,0.2)')}; color:${req.status === 'delivered' ? 'var(--success)' : (req.status === 'rejected' ? 'var(--danger)' : 'var(--accent-gold)')};">${req.status}</span>
        </div>
      </div>
    `).join('') : '<p style="font-size:12px; color:var(--text-dim); text-align:center; padding:30px;">No diamond requests yet.</p>';
  } else {
    const { data } = await sbClient.from('diamond_requests').select('game_name, diamonds, updated_at, delivery_screenshot_url').eq('status', 'delivered').order('updated_at', { ascending: false }).limit(30);
    const list = data || [];
    contentHtml = list.length ? list.map(item => `
      <div class="tx-item" style="border-left: 3px solid var(--success);">
        <div class="tx-info">
          <h4 style="color:var(--accent-cyan);">${escapeHTML(item.game_name)}</h4>
          <span>Delivered +${item.diamonds} Diamonds 💎<br>${new Date(item.updated_at).toLocaleString()}</span>
        </div>
        <div>
          ${item.delivery_screenshot_url ? `<a href="${item.delivery_screenshot_url}" target="_blank" class="btn btn-secondary btn-sm" style="font-size:10px; padding:4px 8px; color:var(--accent-cyan);">View Proof</a>` : '<span style="font-size:10px; color:var(--text-dim);">Delivered</span>'}
        </div>
      </div>
    `).join('') : '<p style="font-size:12px; color:var(--text-dim); text-align:center; padding:30px;">No public deliveries yet.</p>';
  }

  document.getElementById('app-view').innerHTML = `
    <div class="view-container">
      <div class="section-title"><span><i class="fa-solid fa-clock-rotate-left text-gold"></i> ${titleText}</span></div>
      <div style="margin-top:10px;">${contentHtml}</div>
    </div>
  `;
}

export async function requestDiamondPurchase(packageId) {
  if (!state.currentUser) return;
  
  if (!state.currentProfile || !state.currentProfile.free_fire_uid || !state.currentProfile.free_fire_name) {
    Toast.show("Please update your Free Fire UID and Game Name in your profile before purchasing.", "error");
    window.Router.navigate('profile');
    return;
  }

  if (!confirm("Are you sure you want to purchase diamonds using your wallet coins?")) return;

  Loader.show("Processing diamond request securely...");
  const { data, error } = await sbClient.rpc('request_free_fire_diamonds', {
    p_package_id: packageId
  });
  Loader.hide();

  if (error) {
    Toast.show(error.message, "error");
  } else if (data && data.success) {
    try {
      const ntfyTopic = 'stuntff_notifications';
      const ntfyMessage = `💎 *NEW DIAMOND BUY REQUEST* 💎\n` +
                          `👤 Username: ${data.username || state.currentProfile.free_fire_name}\n` +
                          `🆔 Free Fire UID: ${data.uid || state.currentProfile.free_fire_uid}\n` +
                          `🎮 Game Name: ${data.ign || state.currentProfile.free_fire_name}\n` +
                          `💎 Diamonds: ${data.diamonds}\n` +
                          `🪙 Coins Used: ${data.coins}\n` +
                          `🔢 Request ID: #${data.request_id || 'N/A'}`;

      await fetch(`https://ntfy.sh/${ntfyTopic}`, {
        method: 'POST',
        body: ntfyMessage
      });
    } catch (notifErr) {
      console.error("Ntfy notification error:", notifErr);
    }

    Sound.playBrandName();
    Toast.show(data.message, "success");
    await syncAuthAndProfile();
    renderDiamondsShop();
  } else {
    Toast.show(data.message || "Failed to process request.", "error");
  }
}
