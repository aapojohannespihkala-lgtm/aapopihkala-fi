const DATA_URL = '/private-model/status/data.json';
const POLL_MS = 30_000;

const $ = (id) => {
  const element = document.getElementById(id);
  if (!element) throw new Error('Missing dashboard element: ' + id);
  return element;
};

const formatTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('fi-FI', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date);
};

const text = (tag, value, className = '') => {
  const node = document.createElement(tag);
  node.textContent = value;
  if (className) node.className = className;
  return node;
};

const renderActive = (items) => {
  const root = $('active-list');
  root.replaceChildren();
  if (!items.length) {
    root.append(text('p', 'Ei aktiivisia tekoälytyöpaketteja.', 'muted'));
    return;
  }
  for (const item of items) {
    const card = document.createElement('article');
    card.className = 'work';

    const head = document.createElement('div');
    head.className = 'work-head';
    const heading = text('h3', item.lane);
    const badge = text('span', item.state === 'ACTIVE' ? 'TYÖN ALLA' : 'VARATTU', 'badge');
    head.append(heading, badge);

    card.append(
      head,
      text('p', item.title),
      text('p', item.goal, 'goal muted'),
      text('p', 'Päivitetty ' + formatTime(item.updatedAt), 'meta'),
    );
    root.append(card);
  }
};

const renderEvents = (items) => {
  const root = $('events');
  root.replaceChildren();
  if (!items.length) {
    root.append(text('li', 'Ei viimeaikaisia tapahtumia.', 'muted'));
    return;
  }
  for (const item of items.slice(0, 12)) {
    const row = document.createElement('li');
    row.append(
      text('time', formatTime(item.time)),
      text('strong', item.state === 'PASS' ? 'PASS - ' + item.title : item.title),
    );
    if (item.detail) row.append(text('p', item.detail));
    root.append(row);
  }
};

const render = (data) => {
  $('freshness').classList.remove('error');
  $('active-packages').textContent = String(data.summary.activePackages);
  $('active-lines').textContent = String(data.summary.activeLines);
  $('passes-today').textContent = String(data.summary.passesToday);
  $('freshness').textContent =
    'Tilanne muodostettu ' + formatTime(data.generatedAt) +
    ' - handoff päivitetty ' + formatTime(data.source.modifiedTime) +
    ' - automaattinen päivitys noin 5 min välein.';

  renderActive(data.active);
  renderEvents(data.recent);

  const action = $('human-action');
  if (data.humanAction) {
    $('human-title').textContent = data.humanAction.title;
    $('human-detail').textContent = data.humanAction.detail;
    action.hidden = false;
  } else {
    action.hidden = true;
  }
};

const load = async () => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(DATA_URL, {
      cache: 'no-store',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('status ' + response.status);
    render(await response.json());
  } catch {
    $('freshness').textContent = 'Tilatietoa ei saatu ladattua. Päivitä sivu tai yritä hetken kuluttua uudelleen.';
    $('freshness').classList.add('error');
  } finally {
    window.clearTimeout(timeout);
  }
};

void load();
window.setInterval(() => void load(), POLL_MS);
