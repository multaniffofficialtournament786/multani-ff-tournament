import { sbClient, state, escapeHTML } from './config.js';

export async function loadTutorialsManager() {
  const container = document.getElementById('admin-tutorials-list');
  if (!container) return;
  container.innerHTML = `<p class="text-gray-400 text-xs text-center py-4">Loading cards...</p>`;

  try {
    const { data, error } = await sbClient
      .from('site_tutorials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    state.existingTutorialsCache = data || [];

    if (!state.existingTutorialsCache.length) {
      container.innerHTML = `<p class="text-gray-500 text-xs text-center py-6">No carousel cards found.</p>`;
      return;
    }

    container.innerHTML = state.existingTutorialsCache.map(tut => `
      <div class="bg-[#151922] border border-[#262f40] rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
        <div class="flex items-center gap-3 min-w-0">
          <img src="${tut.photo_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200'}" class="w-14 h-14 object-cover rounded-lg border border-[#262f40] shrink-0" />
          <div class="min-w-0">
            <h4 class="font-bold text-white text-sm truncate">${escapeHTML(tut.title)}</h4>
            <p class="text-gray-400 text-[11px] truncate mt-0.5">${escapeHTML(tut.line_1 || '')}</p>
            <a href="${tut.link || '#'}" target="_blank" class="text-cyan-400 text-[10px] underline truncate block mt-0.5">${escapeHTML(tut.link || '')}</a>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button onclick="editTutorialCard('${tut.id}')" class="bg-yellow-600 hover:bg-yellow-500 text-white px-2.5 py-1.5 rounded font-bold text-xs"><i class="fa-solid fa-pen"></i></button>
          <button onclick="deleteTutorialCard('${tut.id}')" class="bg-red-600 hover:bg-red-500 text-white px-2.5 py-1.5 rounded font-bold text-xs"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p class="text-red-500 text-xs text-center py-4">Error loading tutorials: ${escapeHTML(err.message)}</p>`;
  }
}

export async function saveTutorialCard() {
  const editId = document.getElementById('edit-tutorial-id')?.value;
  const title = document.getElementById('tut-title')?.value.trim();
  const link = document.getElementById('tut-link')?.value.trim();
  const line1 = document.getElementById('tut-line1')?.value.trim();
  const line2 = document.getElementById('tut-line2')?.value.trim();
  const fileInput = document.getElementById('tut-file');
  const btn = document.getElementById('btn-save-tut');

  if (!title || !link) {
    alert("Video / Ad Title aur Target Link dono zaroori hain!");
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerText = "SAVING...";
  }

  try {
    let imageUrl = null;
    if (fileInput && fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      const path = `tutorials/${Date.now()}_${file.name}`;
      const { error: upErr } = await sbClient.storage.from('deposit-screenshots').upload(path, file);
      if (!upErr) {
        const { data: { publicUrl } } = sbClient.storage.from('deposit-screenshots').getPublicUrl(path);
        imageUrl = publicUrl;
      }
    }

    let detectedPlatform = 'Website';
    const lowerLink = link.toLowerCase();
    if (lowerLink.includes('youtube') || lowerLink.includes('youtu.be')) detectedPlatform = 'YouTube';
    else if (lowerLink.includes('tiktok')) detectedPlatform = 'TikTok';
    else if (lowerLink.includes('whatsapp') || lowerLink.includes('chat.whatsapp')) detectedPlatform = 'Website';
    else if (lowerLink.includes('facebook') || lowerLink.includes('fb.watch')) detectedPlatform = 'Facebook';

    const payload = {
      title,
      link,
      line_1: line1 || '.',
      line_2: line2 || '.',
      platform: detectedPlatform
    };

    if (imageUrl) payload.photo_url = imageUrl;

    if (editId) {
      const { error } = await sbClient.from('site_tutorials').update(payload).eq('id', editId);
      if (error) throw error;
      alert("Card updated successfully!");
    } else {
      payload.created_at = new Date().toISOString();
      const { error } = await sbClient.from('site_tutorials').insert([payload]);
      if (error) throw error;
      alert("New tutorial / ad card saved successfully!");
    }

    resetTutorialForm();
    loadTutorialsManager();
  } catch (err) {
    alert("Failed to save card: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = "SAVE TUTORIAL / AD CARD";
    }
  }
}

export function editTutorialCard(id) {
  const tut = state.existingTutorialsCache.find(x => String(x.id) === String(id));
  if (!tut) return;

  const editIdEl = document.getElementById('edit-tutorial-id');
  if (editIdEl) editIdEl.value = tut.id;

  const titleEl = document.getElementById('tut-title');
  if (titleEl) titleEl.value = tut.title || '';

  const linkEl = document.getElementById('tut-link');
  if (linkEl) linkEl.value = tut.link || '';

  const line1El = document.getElementById('tut-line1');
  if (line1El) line1El.value = (tut.line_1 === '.' ? '' : tut.line_1) || '';

  const line2El = document.getElementById('tut-line2');
  if (line2El) line2El.value = (tut.line_2 === '.' ? '' : tut.line_2) || '';

  document.getElementById('btn-cancel-tut')?.classList.remove('hidden');
  const saveBtn = document.getElementById('btn-save-tut');
  if (saveBtn) saveBtn.innerText = "UPDATE TUTORIAL / AD CARD";
}

export function resetTutorialForm() {
  const editIdEl = document.getElementById('edit-tutorial-id');
  if (editIdEl) editIdEl.value = '';

  const titleEl = document.getElementById('tut-title');
  if (titleEl) titleEl.value = '';

  const linkEl = document.getElementById('tut-link');
  if (linkEl) linkEl.value = '';

  const line1El = document.getElementById('tut-line1');
  if (line1El) line1El.value = '';

  const line2El = document.getElementById('tut-line2');
  if (line2El) line2El.value = '';

  const fileEl = document.getElementById('tut-file');
  if (fileEl) fileEl.value = '';

  document.getElementById('btn-cancel-tut')?.classList.add('hidden');
  const saveBtn = document.getElementById('btn-save-tut');
  if (saveBtn) saveBtn.innerText = "SAVE TUTORIAL / AD CARD";
}

export async function deleteTutorialCard(id) {
  if (!confirm("Are you sure you want to delete this card?")) return;

  try {
    const { error } = await sbClient.from('site_tutorials').delete().eq('id', id);
    if (error) throw error;
    alert("Card deleted successfully!");
    loadTutorialsManager();
  } catch (err) {
    alert("Failed to delete card: " + err.message);
  }
}
