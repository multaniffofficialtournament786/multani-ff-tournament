import { sbClient } from './config.js';

export async function loadDashboardStats() {
  const [allDeps, allWds, allDiamonds, userCountRes, supportCountRes] = await Promise.all([
    sbClient.from('deposit_requests').select('*'),
    sbClient.from('withdrawals').select('*'),
    sbClient.from('diamond_requests').select('*'),
    sbClient.from('profiles').select('*', { count: 'exact', head: true }),
    sbClient.from('support_messages').select('*', { count: 'exact', head: true }).eq('sender_role', 'player').eq('is_read', false)
  ]);

  const safeDeps = allDeps.data || [];
  const safeWds = allWds.data || [];
  const safeDiamonds = allDiamonds.data || [];

  const totalDeposits = safeDeps
    .filter(r => r.status && r.status.toString().toLowerCase() === 'approved')
    .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
  
  const totalDepEl = document.getElementById('stat-total-deposits');
  if (totalDepEl) totalDepEl.innerText = `PKR ${totalDeposits}`;

  const pendingList = safeDeps.filter(r => r.status && r.status.toString().toLowerCase() === 'pending');
  const pendingCount = pendingList.length;
  
  const statPendingDep = document.getElementById('stat-pending-deposits');
  if (statPendingDep) statPendingDep.innerText = `${pendingCount}`;
  
  ['badge-deposits', 'quick-badge-deposits'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.innerText = pendingCount;
      el.classList.toggle('hidden', pendingCount === 0);
    }
  });

  const pendingWdCount = safeWds.filter(w => (w.status || '').toLowerCase() === 'pending').length;
  ['badge-withdrawals', 'quick-badge-withdrawals'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.innerText = pendingWdCount;
      el.classList.toggle('hidden', pendingWdCount === 0);
    }
  });

  const pendingDiamonds = safeDiamonds.filter(r => r.status && r.status.toString().toLowerCase() === 'pending').length;
  ['badge-diamond_requests', 'quick-badge-diamond_requests'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.innerText = pendingDiamonds;
      el.classList.toggle('hidden', pendingDiamonds === 0);
    }
  });

  const totalPlayersEl = document.getElementById('stat-total-players');
  if (totalPlayersEl) totalPlayersEl.innerText = userCountRes.count || 0;

  const supCount = supportCountRes.count || 0;
  const badgeSup = document.getElementById('badge-support');
  if (badgeSup) {
    badgeSup.innerText = supCount;
    badgeSup.classList.toggle('hidden', supCount === 0);
  }

  document.querySelectorAll('#nav-badge-support').forEach(el => {
    el.innerText = supCount;
    el.classList.toggle('hidden', supCount === 0);
  });
}
