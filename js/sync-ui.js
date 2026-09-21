// Wires the header chip and the token dialog (markup lives in index.html) to the sync engine.

const $ = (id) => document.getElementById(id);

const LABELS = {
  local: () => 'Local only',
  syncing: () => 'Syncing…',
  synced: (s) => `Synced ${new Date(s.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
  offline: () => 'Offline · will retry',
  rejected: () => 'Token rejected',
  error: () => 'Sync error',
};

export function initSyncUi(sync) {
  const chip = $('sync-chip');
  const label = $('sync-label');
  const dialog = $('sync-dialog');
  const form = $('sync-form');
  const input = $('sync-token');
  const status = $('sync-status');
  const connect = $('sync-connect');
  const syncNowBtn = $('sync-now');
  const disconnect = $('sync-disconnect');

  function paint(s) {
    const linked = sync.hasToken();
    chip.dataset.state = s.state;
    label.textContent = LABELS[s.state](s);
    connect.textContent = linked ? 'Replace token' : 'Connect';
    syncNowBtn.hidden = !linked;
    disconnect.hidden = !linked;

    const bad = s.state === 'rejected' || s.state === 'error';
    status.dataset.tone = s.state === 'synced' ? 'ok' : bad ? 'bad' : '';
    status.textContent = {
      local: 'Not connected. Your progress stays in this browser.',
      syncing: 'Syncing…',
      synced: `Connected. Last synced ${LABELS.synced(s).slice('Synced '.length)}.`,
    }[s.state] ?? s.message ?? '';
  }
  sync.subscribe(paint);

  const open = () => {
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  };
  chip.addEventListener('click', open);
  $('sync-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close(); // click on the backdrop
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    connect.disabled = true;
    await sync.connect(input.value);
    input.value = '';
    connect.disabled = false;
    paint(sync.status());
  });
  syncNowBtn.addEventListener('click', () => sync.syncNow());
  disconnect.addEventListener('click', () => sync.disconnect());
}
