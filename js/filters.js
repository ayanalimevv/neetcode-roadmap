// Search and filters on the All problems page. Rows are hidden, not re-rendered, so ticks and notes stay put.

export function applyFilters(blocks, { text = '', topic = '', diff = '', status = '' }) {
  const needle = text.trim().toLowerCase();
  let shown = 0;
  for (const block of blocks) {
    let any = 0;
    for (const row of block.querySelectorAll('.prob')) {
      const ok =
        (!topic || block.dataset.topic === topic) &&
        (!diff || row.dataset.diff === diff) &&
        (!status || (status === 'done') === row.classList.contains('done')) &&
        (!needle || row.dataset.q.includes(needle));
      row.hidden = !ok;
      if (ok) any++;
    }
    block.hidden = any === 0;
    shown += any;
  }
  return shown;
}

export function bindFilters(root) {
  const q = root.querySelector('#f-q');
  const topic = root.querySelector('#f-topic');
  const hints = root.querySelector('#f-hints');
  const count = root.querySelector('#f-count');
  const empty = root.querySelector('#f-empty');
  const blocks = [...root.querySelectorAll('.grp-block')];
  const rows = root.querySelectorAll('.prob');
  const state = { diff: '', status: '' };

  function apply() {
    const shown = applyFilters(blocks, { text: q.value, topic: topic.value, diff: state.diff, status: state.status });
    count.textContent = `${shown} of ${rows.length}`;
    empty.hidden = shown !== 0;
  }

  q.addEventListener('input', apply);
  topic.addEventListener('change', apply);
  hints.addEventListener('change', () => root.classList.toggle('no-hints', !hints.checked));
  root.querySelector('.filters').addEventListener('click', (e) => {
    const btn = e.target.closest('.seg button');
    if (!btn) return;
    state[btn.dataset.f] = btn.dataset.v;
    for (const b of btn.parentElement.querySelectorAll('button')) b.setAttribute('aria-pressed', String(b === btn));
    apply();
  });
  apply();
}
