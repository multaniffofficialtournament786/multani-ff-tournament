import { sbClient, state } from './config.js';

// MULTANI FF OFFICIAL - SMM SERVICES MODULE (VIP MANUAL MODE + 7 RULES + FULL SCREEN FILTER + NTFY ALERT)

export function renderSMMView(container, user, walletBalance, refreshCallback) {
  container.innerHTML = `
    <div style="padding:16px;max-width:430px;margin:0 auto;font-family:Inter,sans-serif;color:#fff;">

      <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #262f40;padding-bottom:12px;margin-bottom:16px;">
        <h2 style="font-family:Rajdhani,sans-serif;font-size:18px;color:#00f0ff;margin:0;">SMM SERVICES & ORDERS</h2>
        <div style="background:#151922;border:1px solid #262f40;padding:8px 12px;border-radius:10px;color:#ffbe00;font-weight:700;">
          <i class="fa-solid fa-wallet"></i>
          <span id="smm-wallet-display">Loading...</span>
        </div>
      </div>

      <!-- VIP RULES DROPDOWN BUTTON -->
      <div style="background:linear-gradient(145deg, #101726, #0d121c);border:1px solid #00f0ff55;border-radius:14px;margin-bottom:16px;overflow:hidden;box-shadow:0 6px 20px rgba(0,240,255,0.1);">
        <div id="smm-rules-toggle" style="padding:14px 16px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;background:rgba(0,240,255,0.05);">
          <div style="display:flex;align-items:center;gap:10px;">
            <i class="fa-solid fa-shield-halved" style="color:#00f0ff;font-size:16px;"></i>
            <span style="font-family:Rajdhani,sans-serif;font-size:15px;font-weight:700;color:#00f0ff;letter-spacing:0.5px;">SMM VIP RULES & GUIDELINES (7 RULES)</span>
          </div>
          <i id="smm-rules-icon" class="fa-solid fa-chevron-down" style="color:#00f0ff;font-size:12px;transition:transform 0.3s;"></i>
        </div>
        <div id="smm-rules-content" style="display:none;padding:14px 16px;border-top:1px solid #262f40;font-size:12px;color:#cbd5e1;line-height:1.6;background:#080d14;">
          <ol style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:8px;">
            <li><strong>Order Completion Time:</strong> Aapka order <span style="color:#00f0ff;">1 se 5 ghante</span> mein complete ho jayega.</li>
            <li><strong>Order Pending Status:</strong> Aapka order Pending mein chala gaya hai, admin check kar ke complete kar dega.</li>
            <li><strong>Fast / Emergency Support:</strong> Jaldi ya emergency mein order complete karwane ke liye <a href="#" id="whatsapp-group-link" style="color:#25d366;font-weight:700;text-decoration:none;"><i class="fa-brands fa-whatsapp"></i> WhatsApp Group Join Karein</a>.</li>
            <li><strong>Correct Link Policy:</strong> Order lagate waqt link hamesha public aur sahi enter karein. Galat link ki surat mein zim dari user ki hogi.</li>
            <li><strong>Refund & Cancellation:</strong> Refund sirf order cancel hone par milta hai. Completed ya Processing orders par refund nahi hota.</li>
            <li><strong>Wallet & Balance:</strong> Wallet mein balance sirf authorized methods (EasyPaisa / SadaPay / Meezan) se add karein. Fake transaction ID par account block ho jayega.</li>
            <li><strong>Fair Play & Security:</strong> Kisi bhi kisam ki hacking ya system abuse par user ka account permanent ban kar diya jayega.</li>
          </ol>
        </div>
      </div>

      <!-- BUY SMM SERVICE CARD -->
      <div style="background:#0e1118;border:1px solid #262f40;border-radius:16px;padding:18px;margin-bottom:16px;">
        <h3 style="font-family:Rajdhani;color:#fff;margin:0 0 14px;">BUY SMM SERVICE</h3>

        <form id="app-smm-form" style="display:flex;flex-direction:column;gap:14px;">
          <div>
            <label style="display:block;font-size:11px;color:#8e9bb0;font-weight:700;margin-bottom:6px;letter-spacing:0.5px;">SELECT CATEGORY</label>
            <input type="hidden" id="smm-cat-input" required>
            <div id="smm-cat-dropdown-btn" style="${fieldStyle}cursor:pointer;display:flex;align-items:center;justify-content:space-between;">
              <span id="smm-cat-selected-text" style="color:#8e9bb0;display:flex;align-items:center;gap:8px;">-- Choose Category --</span>
              <i class="fa-solid fa-chevron-down" style="font-size:11px;color:#8e9bb0;"></i>
            </div>
          </div>

          <div>
            <label style="display:block;font-size:11px;color:#8e9bb0;font-weight:700;margin-bottom:6px;letter-spacing:0.5px;">SELECT SERVICE</label>
            <input type="hidden" id="smm-srv-input" required>
            <div id="smm-srv-dropdown-btn" style="${fieldStyle}cursor:pointer;display:flex;align-items:center;justify-content:space-between;opacity:0.6;pointer-events:none;">
              <span id="smm-srv-selected-text" style="color:#8e9bb0;display:flex;align-items:center;gap:8px;">Choose category first</span>
              <i class="fa-solid fa-chevron-down" style="font-size:11px;color:#8e9bb0;"></i>
            </div>
          </div>

          <div id="smm-info-box" style="display:none;background:#151922;border:1px solid #00f0ff44;padding:12px;border-radius:10px;font-size:12px;color:#8e9bb0;">
            <p style="margin:0 0 4px;">Rate per 1000: <strong id="smm-info-rate" style="color:#00f0ff;"></strong></p>
            <p style="margin:0 0 4px;">Minimum: <strong id="smm-info-min" style="color:#fff;"></strong></p>
            <p style="margin:0;">Maximum: <strong id="smm-info-max" style="color:#fff;"></strong></p>
          </div>

          <div>
            <label style="display:block;font-size:11px;color:#8e9bb0;font-weight:700;margin-bottom:6px;letter-spacing:0.5px;">TARGET LINK / PROFILE URL</label>
            <input id="smm-link-input" type="url" required maxlength="2000" placeholder="https://..." style="${fieldStyle}">
          </div>

          <div>
            <label style="display:block;font-size:11px;color:#8e9bb0;font-weight:700;margin-bottom:6px;letter-spacing:0.5px;">QUANTITY</label>
            <input id="smm-qty-input" type="number" min="1" required placeholder="100" style="${fieldStyle}">
          </div>

          <div style="background:#151922;padding:14px;border-radius:10px;display:flex;justify-content:space-between;border:1px solid #262f40;">
            <span style="color:#8e9bb0;">TOTAL CHARGE</span>
            <strong id="smm-total-charge" style="color:#ffbe00;">PKR 0.00</strong>
          </div>

          <button id="smm-submit-btn" type="submit" style="background:linear-gradient(135deg,#00f0ff,#0072ff);color:#000;border:0;padding:14px;border-radius:10px;font-weight:800;cursor:pointer;">
            PLACE SMM ORDER
          </button>
        </form>
      </div>

      <!-- ORDER HISTORY BUTTON TO OPEN FULL SCREEN MODAL -->
      <div style="background:#0e1118;border:1px solid #262f40;border-radius:16px;padding:18px;text-align:center;">
        <h3 style="font-family:Rajdhani;color:#ffbe00;margin:0 0 10px;">MY ORDERS MANAGEMENT</h3>
        <p style="font-size:12px;color:#8e9bb0;margin:0 0 14px;">Apne tamam orders ki history filter ke sath check karein.</p>
        <button id="open-orders-history-modal" style="width:100%;background:linear-gradient(135deg,#ffbe00,#ff6a00);color:#000;border:0;padding:14px;border-radius:12px;font-weight:800;font-size:14px;cursor:pointer;">
          <i class="fa-solid fa-clock-rotate-left"></i> OPEN SMM ORDER HISTORY
        </button>
      </div>
    </div>

    <!-- FULL SCREEN ORDER HISTORY MODAL WITH 4 FILTER BUTTONS -->
    <div id="smm-history-fullscreen-modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:#07090e;z-index:99999;flex-direction:column;overflow:hidden;">
      <div style="padding:14px 16px;border-bottom:1px solid #262f40;display:flex;align-items:center;justify-content:space-between;background:#0e1118;">
        <h3 style="font-family:Rajdhani,sans-serif;font-size:18px;color:#ffbe00;margin:0;"><i class="fa-solid fa-list-check"></i> ALL ORDERS HISTORY</h3>
        <button id="close-history-modal" style="background:#151922;border:1px solid #262f40;color:#fff;width:32px;height:32px;border-radius:50%;font-size:14px;cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
      </div>

      <!-- 4 FILTER BUTTONS -->
      <div style="display:flex;gap:6px;padding:12px;background:#090d14;border-bottom:1px solid #262f40;overflow-x:auto;">
        <button class="smm-filter-tab active-tab" data-filter="all" style="flex:1;padding:8px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;background:#00f0ff;color:#000;border:0;white-space:nowrap;">ALL</button>
        <button class="smm-filter-tab" data-filter="pending" style="flex:1;padding:8px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;background:#151922;color:#ffbe00;border:1px solid #262f40;white-space:nowrap;">PENDING</button>
        <button class="smm-filter-tab" data-filter="completed" style="flex:1;padding:8px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;background:#151922;color:#24d18b;border:1px solid #262f40;white-space:nowrap;">COMPLETE</button>
        <button class="smm-filter-tab" data-filter="cancelled" style="flex:1;padding:8px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;background:#151922;color:#ff5364;border:1px solid #262f40;white-space:nowrap;">CANCELLED</button>
      </div>

      <!-- ORDERS LIST CONTAINER -->
      <div id="smm-fullscreen-orders-list" style="flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:10px;background:#07090e;">
        Loading orders...
      </div>
    </div>

    <!-- SELECT CATEGORY/SERVICE MODAL -->
    <div id="smm-custom-modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:9999;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;">
      <div style="background:#0e1118;border:1px solid #262f40;border-radius:16px;width:100%;max-width:380px;max-height:80vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.6);">
        <div style="padding:14px 16px;border-bottom:1px solid #262f40;display:flex;align-items:center;justify-content:space-between;background:#151922;">
          <h3 id="smm-modal-title" style="font-family:Rajdhani,sans-serif;font-size:16px;color:#00f0ff;margin:0;">SELECT</h3>
          <button id="smm-modal-close" style="background:transparent;border:0;color:#8e9bb0;font-size:16px;cursor:pointer;padding:4px;"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div id="smm-modal-body" style="padding:12px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;"></div>
      </div>
    </div>
  `;

  // Rules Toggle Event
  const rulesToggle = document.getElementById('smm-rules-toggle');
  const rulesContent = document.getElementById('smm-rules-content');
  const rulesIcon = document.getElementById('smm-rules-icon');

  rulesToggle.addEventListener('click', () => {
    if (rulesContent.style.display === 'none') {
      rulesContent.style.display = 'block';
      rulesIcon.style.transform = 'rotate(180deg)';
    } else {
      rulesContent.style.display = 'none';
      rulesIcon.style.transform = 'rotate(0deg)';
    }
  });

  // WhatsApp Group Safe Link Click Handler
  document.getElementById('whatsapp-group-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    const waUrl = 'https://chat.whatsapp.com/JfF5X5kMhsgCLqA8w3vvXF?s=cl&p=a&iam=2';
    try {
      window.open(waUrl, '_system') || window.open(waUrl, '_blank');
    } catch (err) {
      window.location.href = waUrl;
    }
  });

  loadSMMData(user, refreshCallback);
}

const fieldStyle = `
  width:100%;box-sizing:border-box;background:#06070a;
  border:1px solid #262f40;border-radius:10px;
  padding:12px;color:#fff;font-size:13px;outline:none;
`;

function safeText(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function money(value) {
  return Number(value || 0).toFixed(2);
}

function getServiceIcon(text) {
  const t = String(text || '').toLowerCase();
  if (t.includes('youtube') || t.includes('yt'))
    return '<i class="fa-brands fa-youtube" style="color:#ff0000;font-size:16px;"></i>';
  if (t.includes('tiktok') || t.includes('tik tok'))
    return '<i class="fa-brands fa-tiktok" style="color:#00f0ff;font-size:16px;"></i>';
  if (t.includes('whatsapp') || t.includes('wa'))
    return '<i class="fa-brands fa-whatsapp" style="color:#25d366;font-size:16px;"></i>';
  if (t.includes('instagram') || t.includes('insta'))
    return '<i class="fa-brands fa-instagram" style="color:#e1306c;font-size:16px;"></i>';
  if (t.includes('facebook') || t.includes('fb'))
    return '<i class="fa-brands fa-facebook" style="color:#1877f2;font-size:16px;"></i>';
  if (t.includes('telegram') || t.includes('tg'))
    return '<i class="fa-brands fa-telegram" style="color:#229ed9;font-size:16px;"></i>';
  return '<i class="fa-solid fa-fire" style="color:#ffbe00;font-size:16px;"></i>';
}

async function loadSMMData(user, refreshCallback) {
  const walletDisplay = document.getElementById('smm-wallet-display');
  const catInput = document.getElementById('smm-cat-input');
  const srvInput = document.getElementById('smm-srv-input');
  const catBtn = document.getElementById('smm-cat-dropdown-btn');
  const srvBtn = document.getElementById('smm-srv-dropdown-btn');
  const catText = document.getElementById('smm-cat-selected-text');
  const srvText = document.getElementById('smm-srv-selected-text');
  
  const openHistoryBtn = document.getElementById('open-orders-history-modal');
  const historyModal = document.getElementById('smm-history-fullscreen-modal');
  const closeHistoryBtn = document.getElementById('close-history-modal');
  const fullscreenOrdersList = document.getElementById('smm-fullscreen-orders-list');
  const filterTabs = document.querySelectorAll('.smm-filter-tab');

  const modal = document.getElementById('smm-custom-modal');
  const modalTitle = document.getElementById('smm-modal-title');
  const modalBody = document.getElementById('smm-modal-body');
  const modalClose = document.getElementById('smm-modal-close');

  if (!walletDisplay || !catBtn || !srvBtn) return;

  let currentUser = state.currentUser || user || null;
  let profile = null;
  let allServices = [];
  let selectedService = null;
  let selectedCategory = '';
  let cachedOrders = [];
  let currentFilter = 'all';

  const showError = message => alert(message);

  modalClose.addEventListener('click', () => { modal.style.display = 'none'; });
  modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });

  openHistoryBtn.addEventListener('click', () => {
    historyModal.style.display = 'flex';
    renderFilteredOrders();
  });
  closeHistoryBtn.addEventListener('click', () => {
    historyModal.style.display = 'none';
  });

  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => {
        t.style.background = '#151922';
        t.style.color = '#8e9bb0';
      });
      tab.style.background = '#00f0ff';
      tab.style.color = '#000';
      currentFilter = tab.getAttribute('data-filter');
      renderFilteredOrders();
    });
  });

  try {
    const { data: authData, error: authError } = await sbClient.auth.getUser();
    if (authError) throw authError;
    currentUser = authData.user;
    if (!currentUser) {
      walletDisplay.textContent = 'Login Required';
      return;
    }
    state.currentUser = currentUser;

    const { data: profileData, error: profileError } = await sbClient
      .from('profiles')
      .select('id,wallet_balance,is_verified')
      .eq('id', currentUser.id)
      .single();

    if (profileError) throw profileError;
    profile = profileData;
    walletDisplay.textContent = 'PKR ' + money(profile.wallet_balance);

    const { data: services, error: servicesError } = await sbClient
      .from('smm_services')
      .select('id,category,name,rate,min,max,provider_id,provider_service_id,is_active')
      .eq('is_active', true)
      .order('category')
      .order('name');

    if (servicesError) throw servicesError;
    allServices = services || [];
    const categories = [...new Set(allServices.map(s => s.category).filter(Boolean))];

    catBtn.addEventListener('click', () => {
      modalTitle.textContent = 'SELECT CATEGORY';
      modalBody.innerHTML = categories.map(cat => `
        <div class="modal-cat-item" data-category="${safeText(cat)}" style="background:#06070a;border:1px solid #262f40;padding:12px;border-radius:10px;cursor:pointer;display:flex;align-items:center;gap:12px;">
          <div style="background:#151922;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;border:1px solid #262f40;">${getServiceIcon(cat)}</div>
          <div style="flex-grow:1;font-size:13px;font-weight:600;color:#fff;">${safeText(cat)}</div>
        </div>
      `).join('');
      modal.style.display = 'flex';
      modalBody.querySelectorAll('.modal-cat-item').forEach(item => {
        item.addEventListener('click', () => {
          selectedCategory = item.getAttribute('data-category');
          catInput.value = selectedCategory;
          catText.innerHTML = `${getServiceIcon(selectedCategory)} <span style="color:#fff;">${safeText(selectedCategory)}</span>`;
          selectedService = null;
          srvInput.value = '';
          srvText.innerHTML = '-- Choose Service --';
          srvBtn.style.opacity = '1';
          srvBtn.style.pointerEvents = 'auto';
          document.getElementById('smm-info-box').style.display = 'none';
          modal.style.display = 'none';
        });
      });
    });

    srvBtn.addEventListener('click', () => {
      const filtered = allServices.filter(s => s.category === selectedCategory);
      if (!filtered.length) return;
      modalTitle.textContent = 'SELECT SERVICE';
      modalBody.innerHTML = filtered.map(service => `
        <div class="modal-srv-item" data-id="${service.id}" style="background:#06070a;border:1px solid #262f40;padding:12px;border-radius:10px;cursor:pointer;display:flex;align-items:flex-start;gap:12px;">
          <div style="background:#151922;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;border:1px solid #262f40;flex-shrink:0;">${getServiceIcon(service.name)}</div>
          <div style="flex-grow:1;display:flex;flex-direction:column;gap:4px;">
            <div style="font-size:13px;font-weight:600;color:#fff;">${safeText(service.name)}</div>
            <div style="font-size:11px;color:#8e9bb0;">Rate: <strong style="color:#ffbe00;">PKR ${money(service.rate)}</strong> / 1000 | Min: ${service.min} - Max: ${service.max}</div>
          </div>
        </div>
      `).join('');
      modal.style.display = 'flex';
      modalBody.querySelectorAll('.modal-srv-item').forEach(item => {
        item.addEventListener('click', () => {
          const srvId = item.getAttribute('data-id');
          selectedService = allServices.find(s => String(s.id) === String(srvId)) || null;
          srvInput.value = selectedService ? selectedService.id : '';
          if (selectedService) {
            srvText.innerHTML = `${getServiceIcon(selectedService.name)} <span style="color:#fff;">${safeText(selectedService.name)}</span>`;
            document.getElementById('smm-info-rate').textContent = money(selectedService.rate) + ' PKR';
            document.getElementById('smm-info-min').textContent = selectedService.min;
            document.getElementById('smm-info-max').textContent = selectedService.max;
            document.getElementById('smm-info-box').style.display = 'block';
            const qtyInput = document.getElementById('smm-qty-input');
            qtyInput.min = selectedService.min;
            qtyInput.max = selectedService.max;
            qtyInput.value = selectedService.min;
          }
          modal.style.display = 'none';
        });
      });
    });

    document.getElementById('smm-qty-input').addEventListener('input', () => {
      const qty = Number(document.getElementById('smm-qty-input').value) || 0;
      const rate = Number(selectedService?.rate) || 0;
      const charge = selectedService ? Math.round((qty / 1000 * rate + Number.EPSILON) * 100) / 100 : 0;
      document.getElementById('smm-total-charge').textContent = 'PKR ' + money(charge);
    });

    await fetchOrders(currentUser.id);

    document.getElementById('app-smm-form').addEventListener('submit', async event => {
      event.preventDefault();
      const btn = document.getElementById('smm-submit-btn');
      const link = document.getElementById('smm-link-input').value.trim();
      const qty = Number(document.getElementById('smm-qty-input').value);

      if (!selectedService) return showError('Please select a service.');
      if (!link || !Number.isInteger(qty)) return showError('Please enter valid link and quantity.');

      btn.disabled = true;
      btn.textContent = 'PLACING ORDER...';

      try {
        const { data, error } = await sbClient.rpc('place_smm_order', {
          p_service_id: selectedService.id,
          p_link: link,
          p_quantity: qty
        });

        if (error) throw error;
        if (!data?.success || !data.order_id) throw new Error('Order could not be placed.');

        // Send Notification to ntfy.sh directly using the working topic
        try {
          await fetch('https://ntfy.sh/multani_ff_admin_alerts_786', {
            method: 'POST',
            body: `🚨 New SMM Order Received!\nService: ${selectedService.name}\nQty: ${qty}\nCharge: PKR ${money((qty / 1000) * selectedService.rate)}`
          });
        } catch (ntfyErr) {
          console.error('Ntfy notification failed:', ntfyErr);
        }

        alert(`Order created successfully!\nOrder ID: ${data.order_id}\nStatus: Pending (1-5 Hours)`);
        document.getElementById('smm-link-input').value = '';
        await fetchOrders(currentUser.id);
        if (typeof refreshCallback === 'function') refreshCallback();
      } catch (error) {
        showError(error.message || 'Order failed.');
      } finally {
        btn.disabled = false;
        btn.textContent = 'PLACE SMM ORDER';
      }
    });

  } catch (error) {
    console.error('SMM error:', error);
  }

  async function fetchOrders(userId) {
    const { data: orders, error } = await sbClient
      .from('smm_orders')
      .select('id,order_id,service_name,link,quantity,charge,status,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && orders) {
      cachedOrders = orders;
      renderFilteredOrders();
    }
  }

  function renderFilteredOrders() {
    if (!fullscreenOrdersList) return;
    const filtered = cachedOrders.filter(o => {
      const st = String(o.status || 'pending').toLowerCase();
      if (currentFilter === 'all') return true;
      if (currentFilter === 'pending') return st === 'pending' || st === 'processing';
      if (currentFilter === 'completed') return st === 'completed';
      if (currentFilter === 'cancelled') return st === 'cancelled' || st === 'failed';
      return true;
    });

    if (!filtered.length) {
      fullscreenOrdersList.innerHTML = '<div style="text-align:center;color:#8e9bb0;padding:30px;">No orders found in this category.</div>';
      return;
    }

    fullscreenOrdersList.innerHTML = filtered.map(order => {
      const status = String(order.status || 'pending').toLowerCase();
      const isCompleted = status === 'completed';
      let statusColor = '#ffbe00', statusBg = 'rgba(255,190,0,0.1)';
      if (isCompleted) { statusColor = '#00e676'; statusBg = 'rgba(0,230,118,0.1)'; }
      else if (status === 'processing') { statusColor = '#00d5ff'; statusBg = 'rgba(0,213,255,0.1)'; }
      else if (status === 'cancelled' || status === 'failed') { statusColor = '#ff5252'; statusBg = 'rgba(255,82,82,0.1)'; }

      return `
        <div style="background:${isCompleted ? 'linear-gradient(145deg, #0d231e, #0a1814)' : '#06070a'};border:1px solid ${isCompleted ? '#24d18b' : '#262f40'};padding:14px;border-radius:12px;display:flex;flex-direction:column;gap:8px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="background:#151922;width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;border:1px solid #262f40;">${getServiceIcon(order.service_name)}</div>
              <strong style="color:#fff;font-size:13px;">${safeText(order.service_name)}</strong>
            </div>
            <span style="color:${statusColor};background:${statusBg};border:1px solid ${statusColor}44;padding:3px 8px;border-radius:6px;font-size:10px;font-weight:700;text-transform:uppercase;">${safeText(status)}</span>
          </div>
          <div style="background:#151922;padding:8px 10px;border-radius:8px;border:1px solid #262f40;display:flex;flex-direction:column;gap:4px;">
            <div style="color:#8e9bb0;font-size:11px;display:flex;justify-content:space-between;">
              <span>Order ID: <strong style="color:#fff;">#${safeText(order.order_id ?? order.id)}</strong></span>
              <span>Qty: <strong style="color:#00f0ff;">${safeText(order.quantity)}</strong></span>
            </div>
            <div style="color:#8e9bb0;font-size:11px;word-break:break-all;">Link: <span style="color:#fff;">${safeText(order.link)}</span></div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#8e9bb0;padding-top:2px;">
            <span>${new Date(order.created_at || Date.now()).toLocaleDateString()}</span>
            <span>Charge: <strong style="color:#ffbe00;">PKR ${money(order.charge)}</strong></span>
          </div>
        </div>
      `;
    }).join('');
  }
}
