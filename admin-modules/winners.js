import { sbClient, state, escapeHTML } from './config.js';
import { loadDashboardStats } from './dashboard.js';

export async function loadWinnerSelectOptions() {
  const winTournamentSelect = document.getElementById('win-tournament');
  if (!winTournamentSelect) return;

  winTournamentSelect.innerHTML = `<option value="">Loading tournaments...</option>`;

  const { data, error } = await sbClient
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data || !data.length) {
    winTournamentSelect.innerHTML = `<option value="">No tournaments found</option>`;
    return;
  }

  state.tournamentsCacheMap = {};
  data.forEach(t => { state.tournamentsCacheMap[String(t.id)] = t; });

  winTournamentSelect.innerHTML = `<option value="">Choose tournament...</option>` + data.map(t => {
    const isDone = (t.status || '').toLowerCase() === 'completed';
    return `<option value="${t.id}">${escapeHTML(t.title)} (${t.status || 'upcoming'})${isDone ? ' - Finalized' : ''}</option>`;
  }).join('');
}

export async function onWinnerTournamentChange(tournamentId) {
  ['win-u1', 'win-u2', 'win-u3', 'win-u4'].forEach(id => {
    const sel = document.getElementById(id);
    if (sel) sel.innerHTML = `<option value="">Choose player...</option>`;
  });

  const amt1 = document.getElementById('win-amt1');
  const amt2 = document.getElementById('win-amt2');
  const amt3 = document.getElementById('win-amt3');
  const amt4 = document.getElementById('win-amt4');

  if (amt1) amt1.value = '';
  if (amt2) amt2.value = '';
  if (amt3) amt3.value = '';
  if (amt4) amt4.value = '';

  if (!tournamentId) return;

  const t = state.tournamentsCacheMap[String(tournamentId)];
  if (t) {
    if (t.prize_pool && amt1) amt1.value = t.prize_pool;
    if (t.prize_2 && amt2) amt2.value = t.prize_2;
    if (t.prize_3 && amt3) amt3.value = t.prize_3;
    if (t.prize_4 && amt4) amt4.value = t.prize_4;
  }

  const { data, error } = await sbClient
    .from('tournament_entries')
    .select('user_id, profiles(id, free_fire_name, free_fire_uid)')
    .eq('tournament_id', tournamentId);

  if (error || !data || !data.length) return;

  const playerOptions = `<option value="">Choose player...</option>` + data.map(e => {
    const p = e.profiles || {};
    return `<option value="${p.id}">${escapeHTML(p.free_fire_name || 'Gamer')} (UID: ${escapeHTML(p.free_fire_uid || '--')})</option>`;
  }).join('');

  ['win-u1', 'win-u2', 'win-u3', 'win-u4'].forEach(id => {
    const sel = document.getElementById(id);
    if (sel) sel.innerHTML = playerOptions;
  });
}

export async function submitAllWinnersDeclaration() {
  const tournamentSelect = document.getElementById('win-tournament');
  const tournamentId = tournamentSelect ? tournamentSelect.value : '';

  if (!tournamentId) {
    alert("Please select a tournament first.");
    return;
  }

  const matchObj = state.tournamentsCacheMap[String(tournamentId)];
  if (matchObj && (matchObj.status || '').toLowerCase() === 'completed') {
    alert("Yeh match pehle se COMPLETED aur FINALIZED hai! Iske winners announce ho chuke hain.");
    return;
  }

  const u1 = document.getElementById('win-u1')?.value;
  const amt1 = parseFloat(document.getElementById('win-amt1')?.value) || 0;

  if (!u1 || amt1 <= 0) {
    alert("1st Place Winner aur 1st Prize select karna lazmi hai.");
    return;
  }

  const u2 = document.getElementById('win-u2')?.value;
  const amt2 = parseFloat(document.getElementById('win-amt2')?.value) || 0;
  const u3 = document.getElementById('win-u3')?.value;
  const amt3 = parseFloat(document.getElementById('win-amt3')?.value) || 0;
  const u4 = document.getElementById('win-u4')?.value;
  const amt4 = parseFloat(document.getElementById('win-amt4')?.value) || 0;

  const selectedUsers = [u1, u2, u3, u4].filter(Boolean);
  if (selectedUsers.length !== new Set(selectedUsers).size) {
    alert("Ghalat Selection: Ek hi player ko 2 positions par select nahi kiya ja sakta.");
    return;
  }

  if (!confirm("Are you sure you want to announce these winners and complete the match? Prizes will be credited.")) return;

  const winnersPayload = [{ user_id: u1, position: 1, prize: amt1 }];
  if (u2 && amt2 > 0) winnersPayload.push({ user_id: u2, position: 2, prize: amt2 });
  if (u3 && amt3 > 0) winnersPayload.push({ user_id: u3, position: 3, prize: amt3 });
  if (u4 && amt4 > 0) winnersPayload.push({ user_id: u4, position: 4, prize: amt4 });

  const submitBtn = document.getElementById('btn-declare-winners-submit');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = "PROCESSING & CREDITING...";
  }

  try {
    const { data, error } = await sbClient.rpc('declare_tournament_winners', {
      p_tournament_id: tournamentId,
      p_winners: winnersPayload
    });

    if (error) throw new Error(error.message || JSON.stringify(error));

    let winSummary = "🎉 SUCCESS! MATCH COMPLETED!\n\n";
    winSummary += "Tournament: " + (data.tournament_title || (matchObj ? matchObj.title : 'Tournament')) + "\n\n";
    if (data.winners && Array.isArray(data.winners)) {
      data.winners.forEach(w => {
        winSummary += `• Position #${w.position}: ${w.name} (UID: ${w.uid}) -> PKR ${w.prize}\n`;
      });
    }
    winSummary += "\n✅ Prizes added to player wallet balances.\n✅ History permanently saved.\n✅ Public Website Winners updated.";

    alert(winSummary);
    await loadDeclaredWinners();
    await loadWinnerSelectOptions();
    await loadDashboardStats();
  } catch (err) {
    alert("Error declaring winners: " + (err.message || err));
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = "ANNOUNCE ALL WINNERS & COMPLETE MATCH";
    }
  }
}

export async function loadDeclaredWinners() {
  const container = document.getElementById('admin-declared-winners-list');
  if (!container) return;
  container.innerHTML = `<p class="text-gray-400 text-xs text-center py-4">Loading declared winners...</p>`;

  try {
    const { data: winners, error } = await sbClient
      .from('tournament_winners')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !winners || !winners.length) {
      container.innerHTML = `<p class="text-gray-500 text-xs text-center py-6">No declared winners found.</p>`;
      return;
    }

    const tIds = [...new Set(winners.map(w => w.tournament_id))];
    const uIds = [...new Set(winners.map(w => w.user_id))];

    const [tRes, uRes] = await Promise.all([
      sbClient.from('tournaments').select('id, title').in('id', tIds),
      sbClient.from('profiles').select('id, free_fire_name, free_fire_uid').in('id', uIds)
    ]);

    const tMap = {};
    (tRes.data || []).forEach(t => { tMap[String(t.id)] = t.title; });
    const uMap = {};
    (uRes.data || []).forEach(u => { uMap[String(u.id)] = u; });

    container.innerHTML = winners.map(w => {
      const tTitle = tMap[String(w.tournament_id)] || 'Tournament Match';
      const p = uMap[String(w.user_id)] || {};
      return `
        <div class="bg-[#151922] border border-[#262f40] rounded-xl p-3.5 flex items-center justify-between text-xs">
          <div>
            <h4 class="font-bold text-white text-sm">${escapeHTML(tTitle)}</h4>
            <p class="text-yellow-400 font-bold mt-0.5">Position #${w.position} • Winner: ${escapeHTML(p.free_fire_name || 'Gamer')} (UID: ${escapeHTML(p.free_fire_uid || '--')})</p>
            <span class="text-emerald-400 text-[11px]">Prize: PKR ${w.prize_amount}</span>
          </div>
          <div class="text-right">
            <span class="text-gray-400 text-[10px] font-mono">${new Date(w.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<p class="text-red-500 text-xs text-center py-4">Error loading winners: ${err.message}</p>`;
  }
}
