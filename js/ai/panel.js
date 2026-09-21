// The study assistant panel: hints, debugging, code review and chat, answered by the user's own free API key.
// Markup lives in index.html (#ai-panel and #ai-settings). Everything the model says goes through
// renderMarkdown, which escapes first, so an answer can never add markup to the page.

import { ask, listModels, pickDefaultModel, loadSettings, saveSettings, hasKey, maskKey, ENGINES } from './engines.js';
import { SYSTEM, buildPrompt, trimHistory, HINT_LEVELS, HINT_LABELS } from './prompts.js';
import { renderMarkdown } from './markdown.js';
import { loadHistory, saveHistory, clearHistory } from './history.js';
import { esc } from '../highlight.js';

const $ = (id) => document.getElementById(id);
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

const MODE_LABEL = { hint: 'Hint', debug: 'Debug my code', review: 'Review my solution', explain: 'Explain', chat: 'Question' };
const WELCOME = {
  hint: 'Stuck? Pick a level and get a hint. It starts small, a nudge, and only shows the full solution when you ask for it.',
  debug: 'Paste your JavaScript and say what you expected and what happened. I will find the bug and explain why it fails, then show the fix if you ask.',
  review: 'Paste a working solution. I will check its complexity and missed edge cases, and suggest a cleaner version or another approach.',
  explain: 'Ask about a hint, a line of a template, or a concept. Or summarise this whole topic.',
  chat: 'Ask anything about this problem or topic.',
};
const PLACEHOLDER = {
  hint: 'Optional: what have you tried, or where are you stuck?',
  debug: 'Optional: anything else I should know?',
  review: 'Optional: anything specific to look at?',
  explain: 'What would you like explained?',
  chat: 'Ask a question…',
};
const SEND_LABEL = { hint: 'Get hint', debug: 'Debug', review: 'Review', explain: 'Explain', chat: 'Send' };

export function initAi({ topics, problemById, topicById, storage, getRoute, getCurrentProblemId, goToProblem, fetchImpl }) {
  const panel = $('ai-panel');
  const log = $('ai-log');
  const form = $('ai-form');
  const question = $('ai-question');
  const codeBox = $('ai-code');
  const expectedBox = $('ai-expected');
  const actualBox = $('ai-actual');
  const sendBtn = $('ai-send');
  const stopBtn = $('ai-stop');
  const noteEl = $('ai-note');
  const problemSel = $('ai-problem');
  const overlay = matchMedia('(max-width: 1099px)');

  const byName = new Map([...problemById.values()].map((p) => [norm(p.name), p.id]));
  const resolveProblem = (name) => byName.get(norm(name));

  let settings = loadSettings(storage);
  let mode = 'hint';
  let level = 'nudge';
  let problemId = '';
  let route = getRoute();
  let messages = [];
  let busy = false;
  let controller = null;
  let lastFocus = null;
  let noteTimer = 0;

  /* ---------- context: which topic and problem the conversation is about ---------- */

  const routeTopic = () => (route.name === 'topic' ? topics.find((t) => t.slug === route.slug) : null);
  const contextTopic = () => topicById.get(problemById.get(problemId)?.topic) ?? routeTopic() ?? null;
  const historyKey = () => contextTopic()?.id ?? 'general';

  function buildProblemSelect() {
    problemSel.innerHTML =
      '<option value=""></option>' +
      topics.map((t) => `<optgroup label="${esc(t.title)}">${t.problems.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</optgroup>`).join('');
  }

  function syncProblemSelect() {
    const t = routeTopic();
    problemSel.options[0].textContent = t ? `Just the topic: ${t.title}` : 'A general question';
    problemSel.value = problemId;
  }

  function reloadHistory() {
    messages = loadHistory(storage, historyKey());
  }

  /* ---------- note line, counter, engine chip ---------- */

  function note(text, { sticky = false } = {}) {
    noteEl.textContent = text;
    clearTimeout(noteTimer);
    if (text && !sticky) noteTimer = setTimeout(() => { noteEl.textContent = ''; updateCounter(); }, 7000);
  }

  function updateCounter() {
    const cap = ENGINES[settings.engine].maxInputChars;
    const used = codeBox.value.length + expectedBox.value.length + actualBox.value.length + question.value.length;
    if (used > cap * 0.6) {
      noteEl.textContent = `${used.toLocaleString('en-US')} / ${cap.toLocaleString('en-US')} characters${used > cap ? ': too long for this engine' : ''}`;
      noteEl.dataset.tone = used > cap ? 'bad' : '';
    } else if (noteEl.dataset.tone || /characters/.test(noteEl.textContent)) {
      noteEl.textContent = '';
      noteEl.dataset.tone = '';
    }
  }

  function paintEngine() {
    const e = ENGINES[settings.engine];
    const model = settings.models[settings.engine];
    $('ai-engine-chip').textContent = hasKey(settings) ? `${e.label}${model ? ` · ${model}` : ''}` : 'Not set up';
    $('ai-setup').hidden = hasKey(settings);
  }

  /* ---------- the conversation ---------- */

  function userHtml(m) {
    const meta = m.meta ?? {};
    const code = meta.code
      ? `<details class="ai-code"><summary>Your code (${meta.code.split('\n').length} lines)</summary><pre><code>${esc(meta.code)}</code></pre></details>`
      : '';
    return `<div class="ai-msg user"><div class="ai-who">${esc(meta.label ?? 'You')}</div>` +
      `${meta.text ? `<div class="ai-body">${esc(meta.text)}</div>` : ''}${code}</div>`;
  }

  function assistantHtml(m, isLast, prev) {
    const canFix = isLast && prev?.meta?.mode === 'debug' && !prev.meta.followUp && !busy;
    return `<div class="ai-msg assistant"><div class="ai-body">${renderMarkdown(m.content, { resolveProblem })}</div>` +
      `${canFix ? '<div class="ai-chips"><button type="button" class="btn" data-ai-fix>Show the fix</button></div>' : ''}</div>`;
  }

  function renderLog() {
    if (!messages.length) {
      log.innerHTML = `<div class="ai-empty"><p>${esc(WELCOME[mode])}</p></div>`;
      return;
    }
    log.innerHTML = messages.map((m, i) => (m.role === 'user' ? userHtml(m) : assistantHtml(m, i === messages.length - 1, messages[i - 1]))).join('');
    log.scrollTop = log.scrollHeight;
  }

  function errorHtml(e) {
    const fixable = ['auth', 'model', 'limit'].includes(e.kind);
    return `<div class="ai-msg"><div class="ai-err" role="alert"><p>${esc(e.message)}</p>` +
      `${fixable ? '<button type="button" class="btn" data-ai-settings>Open settings</button>' : ''}</div></div>`;
  }

  /* ---------- modes and the form ---------- */

  function paintForm() {
    panel.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    $('ai-hint-row').hidden = mode !== 'hint';
    $('ai-code-row').hidden = mode !== 'debug' && mode !== 'review';
    $('ai-summarize').hidden = mode !== 'explain' || !contextTopic();
    panel.querySelectorAll('#ai-levels button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.level === level)));
    question.placeholder = PLACEHOLDER[mode];
    sendBtn.textContent = mode === 'hint' && level === 'solution' ? 'Show full solution' : SEND_LABEL[mode];
    sendBtn.classList.toggle('btn-danger', mode === 'hint' && level === 'solution');
  }

  function setMode(next) {
    mode = next;
    paintForm();
    if (!messages.length) renderLog(); // the welcome text depends on the mode
  }

  function busyState(on) {
    busy = on;
    sendBtn.disabled = on;
    stopBtn.hidden = !on;
    panel.querySelectorAll('[data-mode], #ai-levels button, #ai-summarize').forEach((b) => { b.disabled = on; });
  }

  /* ---------- sending ---------- */

  async function ensureModel() {
    const engine = settings.engine;
    if (settings.models[engine]) return true;
    try {
      const ids = await listModels({ engine, key: settings.keys[engine], fetchImpl });
      settings.models[engine] = pickDefaultModel(engine, ids);
      saveSettings(storage, settings);
      paintEngine();
      return !!settings.models[engine];
    } catch {
      return false;
    }
  }

  async function send({ followUp = '', summarize = false } = {}) {
    if (busy) return;
    if (!hasKey(settings)) return openSettings('Add a free API key to start.');
    if (!(await ensureModel())) return openSettings('Could not choose a model automatically. Press "Load models" and pick one.');

    const engine = ENGINES[settings.engine];
    const problem = problemById.get(problemId) ?? null;
    const topic = contextTopic();
    const ctxKey = `${topic?.id ?? ''}|${problemId}`;
    const lastCtx = [...messages].reverse().find((m) => m.role === 'user')?.meta?.ctx;
    const raw = { code: codeBox.value, expected: expectedBox.value, actual: actualBox.value, question: question.value };

    const built = buildPrompt({
      mode, level, topic, problem, followUp, summarize, cap: engine.maxInputChars,
      hasHistory: messages.length > 0, withContext: messages.length === 0 || lastCtx !== ctxKey, ...raw,
    });
    if (built.error) return note(built.error);

    const label = followUp === 'fix' ? 'Show the fix' : summarize ? 'Summarise this topic' : mode === 'hint' ? `Hint · ${HINT_LABELS[level]}` : MODE_LABEL[mode];
    const sentCode = followUp ? '' : (mode === 'debug' || mode === 'review') ? raw.code.trim() : '';
    const userMsg = { role: 'user', content: built.content, meta: { mode, level, label, ctx: ctxKey, followUp, text: followUp || summarize ? '' : raw.question.trim(), code: sentCode } };
    messages.push(userMsg);
    if (!followUp) question.value = '';
    renderLog();

    const holder = document.createElement('div');
    holder.className = 'ai-msg assistant';
    holder.innerHTML = '<div class="ai-body"><span class="ai-cursor" aria-hidden="true"></span></div>';
    log.appendChild(holder);
    log.scrollTop = log.scrollHeight;
    const bodyEl = holder.firstElementChild;

    busyState(true);
    note('');
    controller = new AbortController();
    let text = '';
    let paintAt = 0;
    const paint = (final) => {
      const stick = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
      bodyEl.innerHTML = renderMarkdown(text, { resolveProblem }) + (final ? '' : '<span class="ai-cursor" aria-hidden="true"></span>');
      if (stick) log.scrollTop = log.scrollHeight;
    };

    try {
      const history = trimHistory(messages.map(({ role, content }) => ({ role, content })), engine.maxInputChars);
      const stream = ask({
        settings, system: SYSTEM, messages: history, signal: controller.signal, fetchImpl,
        effort: mode === 'debug' || mode === 'review' ? 'medium' : 'low',
      });
      for await (const piece of stream) {
        text += piece;
        if (Date.now() - paintAt > 60) { paintAt = Date.now(); paint(false); }
      }
      paint(true);
      if (!text.trim()) throw Object.assign(new Error('The model sent an empty answer. Try again, or pick another model in the settings.'), { kind: 'error' });
      messages.push({ role: 'assistant', content: text });
      // Each hint moves the selector one step up the ladder, but never onto "Full solution": that is always a deliberate choice.
      if (mode === 'hint' && !followUp) level = { nudge: 'pattern', pattern: 'outline' }[level] ?? level;
    } catch (e) {
      const stopped = e?.name === 'AbortError';
      if (text.trim()) {
        messages.push({ role: 'assistant', content: text + (stopped ? '\n\n(stopped)' : '') });
      } else {
        messages.pop(); // nothing came back: forget the question so history stays in turns
        holder.remove();
        if (!followUp) question.value = raw.question;
        if (!stopped) log.appendChild(Object.assign(document.createElement('div'), { innerHTML: errorHtml(e) }).firstElementChild);
      }
    } finally {
      busyState(false);
      controller = null;
      messages = saveHistory(storage, historyKey(), messages);
      if (!log.querySelector('.ai-err')) renderLog();
      paintForm();
    }
  }

  /* ---------- opening and closing ---------- */

  function open({ problemId: pid, mode: m } = {}) {
    lastFocus = document.activeElement;
    if (pid !== undefined && problemById.has(pid)) problemId = pid;
    if (m) mode = m;
    reloadHistory();
    syncProblemSelect();
    paintForm();
    paintEngine();
    renderLog();
    panel.hidden = false;
    document.body.classList.add('ai-open');
    $('ask-btn').setAttribute('aria-expanded', 'true');
    (mode === 'debug' || mode === 'review') && !codeBox.value ? codeBox.focus() : question.focus();
  }

  function close() {
    panel.hidden = true;
    document.body.classList.remove('ai-open');
    $('ask-btn').setAttribute('aria-expanded', 'false');
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }

  const isOpen = () => !panel.hidden;

  /* ---------- settings dialog ---------- */

  const dlg = $('ai-settings');
  const keyInput = $('ai-key');
  const modelInput = $('ai-model');
  const statusEl = $('ai-status');
  let draftEngine = settings.engine;

  const say = (text, tone = '') => { statusEl.textContent = text; statusEl.dataset.tone = tone; };

  function paintSettings() {
    const e = ENGINES[draftEngine];
    $('ai-engines').innerHTML = Object.values(ENGINES)
      .map((x) => `<label class="ai-engine"><input type="radio" name="ai-engine" value="${x.id}"${x.id === draftEngine ? ' checked' : ''}>` +
        `<span class="ai-engine-name">${esc(x.label)} <span class="tag">${esc(x.badge)}</span></span></label>`)
      .join('');
    $('ai-engine-blurb').textContent = e.blurb;
    const link = $('ai-key-link');
    link.href = e.keyUrl;
    keyInput.value = '';
    keyInput.placeholder = settings.keys[draftEngine] ? `Saved: ${maskKey(settings.keys[draftEngine])}` : e.keyPlaceholder;
    modelInput.value = settings.models[draftEngine];
    $('ai-models').innerHTML = '';
    $('ai-privacy').textContent = e.privacy;
    $('ai-forget').hidden = !settings.keys[draftEngine];
  }

  function openSettings(message = '') {
    document.querySelectorAll('dialog[open]').forEach((d) => { if (d !== dlg) d.close(); });
    draftEngine = settings.engine;
    paintSettings();
    say(message, message ? 'bad' : '');
    if (!dlg.open) dlg.showModal();
    keyInput.focus();
  }

  const enteredKey = () => keyInput.value.trim() || settings.keys[draftEngine];

  async function loadModels() {
    const key = enteredKey();
    if (!key) return say('Paste a key first.', 'bad');
    say('Loading models…');
    try {
      const ids = await listModels({ engine: draftEngine, key, fetchImpl });
      $('ai-models').innerHTML = ids.map((id) => `<option value="${esc(id)}"></option>`).join('');
      if (!modelInput.value) modelInput.value = pickDefaultModel(draftEngine, ids);
      say(`${ids.length} models available. Pick one, or keep the suggestion.`, 'ok');
    } catch (e) {
      say(e.message, 'bad');
    }
  }

  async function testConnection() {
    const key = enteredKey();
    if (!key) return say('Paste a key first.', 'bad');
    if (!modelInput.value.trim()) await loadModels();
    const model = modelInput.value.trim();
    if (!model) return;
    say('Testing…');
    const trial = { engine: draftEngine, keys: { ...settings.keys, [draftEngine]: key }, models: { ...settings.models, [draftEngine]: model } };
    const ctl = new AbortController();
    try {
      let got = '';
      for await (const piece of ask({ settings: trial, system: 'Reply as briefly as you can.', messages: [{ role: 'user', content: 'Reply with the single word: ready' }], signal: ctl.signal, fetchImpl })) {
        got += piece;
        if (got.length > 20) { ctl.abort(); break; }
      }
      say(got.trim() ? `Connected. The model replied: “${got.trim().slice(0, 40)}”.` : 'Connected, but the model sent nothing back.', got.trim() ? 'ok' : 'bad');
    } catch (e) {
      if (e?.name !== 'AbortError') say(e.message, 'bad');
      else say('Connected.', 'ok');
    }
  }

  function saveFromDialog() {
    const key = keyInput.value.trim();
    settings.engine = draftEngine;
    if (key) settings.keys[draftEngine] = key;
    settings.models[draftEngine] = modelInput.value.trim();
    const ok = saveSettings(storage, settings);
    paintEngine();
    paintForm();
    say(ok ? 'Saved in this browser.' : 'Could not save (storage is blocked). It will work until you close the page.', ok ? 'ok' : 'bad');
    keyInput.value = '';
    keyInput.placeholder = settings.keys[draftEngine] ? `Saved: ${maskKey(settings.keys[draftEngine])}` : ENGINES[draftEngine].keyPlaceholder;
    $('ai-forget').hidden = !settings.keys[draftEngine];
  }

  $('ai-engines').addEventListener('change', (e) => {
    if (e.target.name !== 'ai-engine') return;
    draftEngine = e.target.value;
    paintSettings();
    say('');
  });
  $('ai-settings-form').addEventListener('submit', (e) => { e.preventDefault(); saveFromDialog(); });
  $('ai-load-models').addEventListener('click', loadModels);
  $('ai-test').addEventListener('click', testConnection);
  $('ai-forget').addEventListener('click', () => {
    settings.keys[draftEngine] = '';
    settings.models[draftEngine] = '';
    saveSettings(storage, settings);
    paintSettings();
    paintEngine();
    say('Key forgotten. It is no longer stored in this browser.', 'ok');
  });
  $('ai-settings-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });

  /* ---------- wiring ---------- */

  HINT_LEVELS.forEach((l) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.level = l;
    b.textContent = HINT_LABELS[l];
    $('ai-levels').appendChild(b);
  });

  panel.addEventListener('click', (e) => {
    const modeBtn = e.target.closest('[data-mode]');
    if (modeBtn) return setMode(modeBtn.dataset.mode);
    const levelBtn = e.target.closest('#ai-levels button');
    if (levelBtn) { level = levelBtn.dataset.level; return paintForm(); }
    if (e.target.closest('[data-ai-fix]')) return send({ followUp: 'fix' });
    if (e.target.closest('[data-ai-settings]')) return openSettings();
    const goBtn = e.target.closest('[data-goto-problem]');
    if (goBtn) { goToProblem(goBtn.dataset.gotoProblem); if (overlay.matches) close(); return; }
    const copy = e.target.closest('.copy');
    if (copy) {
      const text = copy.closest('.code').querySelector('pre code').textContent;
      navigator.clipboard?.writeText(text).then(() => { copy.textContent = 'Copied'; }, () => { copy.textContent = 'Select to copy'; }).finally(() => setTimeout(() => { copy.textContent = 'Copy'; }, 1600));
    }
  });

  form.addEventListener('submit', (e) => { e.preventDefault(); send(); });
  $('ai-summarize').addEventListener('click', () => send({ summarize: true }));
  stopBtn.addEventListener('click', () => controller?.abort());
  question.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); }
  });
  for (const el of [codeBox, expectedBox, actualBox, question]) el.addEventListener('input', updateCounter);

  problemSel.addEventListener('change', () => {
    problemId = problemSel.value;
    reloadHistory();
    renderLog();
    paintForm();
  });
  $('ai-close').addEventListener('click', close);
  $('ai-settings-btn').addEventListener('click', () => openSettings());
  $('ai-setup-btn').addEventListener('click', () => openSettings());
  $('ai-clear').addEventListener('click', () => {
    if (busy) controller?.abort();
    clearHistory(storage, historyKey());
    messages = [];
    renderLog();
    paintForm();
  });
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.querySelector('dialog[open]')) { e.preventDefault(); close(); }
  });

  buildProblemSelect();
  paintForm();
  paintEngine();

  return {
    isOpen,
    open,
    close,
    toggle() {
      if (isOpen()) return close();
      const id = getCurrentProblemId?.();
      open(id ? { problemId: id } : {});
    },
    openSettings,
    /** Called when the page changes: keeps the topic in step, and forgets a problem from another topic. */
    onRoute(r) {
      route = r;
      const p = problemById.get(problemId);
      if (p && r.name === 'topic' && topics.find((t) => t.slug === r.slug)?.id !== p.topic) problemId = '';
      if (isOpen()) { reloadHistory(); syncProblemSelect(); renderLog(); paintForm(); }
    },
  };
}
