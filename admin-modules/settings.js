import { sbClient } from './config.js';

export async function loadSettings() {
  try {
    const { data, error } = await sbClient
      .from('site_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      const tickerText = document.getElementById('set-ticker-text');
      if (tickerText) tickerText.value = data.ticker_text || '';

      const tickerEnabled = document.getElementById('set-ticker-enabled');
      if (tickerEnabled) tickerEnabled.checked = (data.ticker_enabled !== false);
    }
  } catch (err) {
    console.log("Settings load notice:", err);
  }
}

export async function saveSiteSettings() {
  const tickerText = document.getElementById('set-ticker-text')?.value.trim() || '';
  const isEnabled = document.getElementById('set-ticker-enabled')?.checked ?? true;
  const btn = document.getElementById('btn-save-ticker');

  if (btn) {
    btn.disabled = true;
    btn.innerText = "SAVING...";
  }

  try {
    const { data: existing } = await sbClient.from('site_settings').select('id').limit(1).maybeSingle();

    const payload = {
      ticker_text: tickerText,
      ticker_enabled: isEnabled,
      updated_at: new Date().toISOString()
    };

    let err = null;
    if (existing && existing.id) {
      const res = await sbClient.from('site_settings').update(payload).eq('id', existing.id);
      err = res.error;
    } else {
      payload.id = 1;
      const res = await sbClient.from('site_settings').upsert(payload);
      err = res.error;
    }

    if (err) throw err;
    alert("Announcement Ticker saved successfully!");
  } catch (err) {
    alert("Failed to save announcement: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = "Save Announcement";
    }
  }
}
