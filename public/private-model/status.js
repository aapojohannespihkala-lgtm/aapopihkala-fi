const DATA_URL = '/private-model/status/data.json';
const POLL_MS = 30_000;

const DEVELOPMENT_STAGES = [
  { id: 'model', label: '3D-malli' },
  { id: 'viewer', label: 'Viewer' },
  { id: 'qa', label: 'Integraatio + QA' },
  { id: 'production', label: 'Tuotanto' },
  { id: 'human', label: 'Ihmisen vaihe' },
];

const JOURNEY_STAGE_TEXT = {
  model: '3D-mallia rakennetaan',
  viewer: 'Katselua valmistellaan',
  qa: 'Kokonaisuutta tarkistetaan',
  production: 'Viedään tuotantoon',
  human: 'Odottaa ihmisen vaihetta',
};

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

const stageForActive = (item) => {
  const code = item.laneCode || '';
  if (/^M[1-5](?:\s|$)/.test(code)) return 'model';
  if (/^V[1-3](?:\s|$)/.test(code)) return 'viewer';
  if (/^V4(?:\s|$)/.test(code) || /^OPS/.test(code)) return 'qa';
  if (/^V5(?:\s|$)/.test(code)) return 'production';
  return null;
};

const journeyItems = (data) => {
  const unique = new Map();

  for (const item of data.active) {
    const stage = stageForActive(item);
    if (!stage || /^(?:OPS|Muu\b)/.test(item.laneCode || '')) continue;

    const goal = (item.goal || item.title || '').trim();
    if (!goal) continue;

    const key = goal.toLocaleLowerCase('fi-FI');
    if (!unique.has(key)) unique.set(key, { ...item, stage, goal });
  }

  const items = [...unique.values()].slice(0, 6);
  if (data.humanAction) {
    items.unshift({
      id: 'human-action',
      lane: 'Ihmisen vaihe',
      laneCode: 'HUMAN',
      title: data.humanAction.detail,
      goal: 'Tarvitaan sinun arviointisi',
      state: 'ACTIVE',
      updatedAt: data.generatedAt,
      stage: 'human',
    });
  }

  return items.slice(0, 6);
};

const renderJourneys = (data) => {
  const root = $('journey-list');
  root.replaceChildren();

  const items = journeyItems(data);
  if (!items.length) {
    root.append(text(
      'p',
      'Ei aktiivista rakennus- tai viewer-tavoitetta juuri nyt. Tekniset tapahtumat näkyvät alempana.',
      'muted',
    ));
    return;
  }

  for (const item of items) {
    const currentIndex = DEVELOPMENT_STAGES.findIndex((stage) => stage.id === item.stage);
    const card = document.createElement('article');
    card.className = 'journey-card' + (item.stage === 'human' ? ' human' : '');

    const head = document.createElement('div');
    head.className = 'journey-head';
    head.append(
      text('h3', item.goal),
      text('span', item.stage === 'human' ? 'SINULTA TARVITAAN' : 'TYÖN ALLA', 'badge' + (item.stage === 'human' ? ' action' : '')),
    );

    const track = document.createElement('div');
    track.className = 'journey-track';
    track.setAttribute('role', 'list');
    track.setAttribute('aria-label', 'Matkan vaiheet');

    DEVELOPMENT_STAGES.forEach((stage, index) => {
      const step = document.createElement('div');
      const position = index < currentIndex ? 'before' : index === currentIndex ? 'current' : 'after';
      step.className = 'journey-step ' + position;
      step.setAttribute('role', 'listitem');
      if (position === 'current') step.setAttribute('aria-current', 'step');
      step.append(
        text('span', String(index + 1).padStart(2, '0'), 'journey-step-number'),
        text('span', stage.label, 'journey-step-label'),
      );
      track.append(step);
    });

    const remaining = DEVELOPMENT_STAGES.slice(currentIndex + 1).map((stage) => stage.label);
    const nowText = JOURNEY_STAGE_TEXT[item.stage] || 'Työ etenee';
    const remainingText = item.stage === 'human'
      ? 'Vielä puuttuu: käyttäjän tehtävän ratkaisu.'
      : remaining.length
        ? 'Vielä edessä tässä kehitysmallissa: ' + remaining.join(' → ') + '.'
        : 'Tämän kehitysmallin tekniset vaiheet on käyty läpi.';

    card.append(
      head,
      track,
      text('p', 'Nyt: ' + nowText + '.', 'journey-now'),
      text('p', item.title, 'journey-work muted'),
      text('p', remainingText, 'journey-remaining'),
    );
    root.append(card);
  }
};

const stageForEvent = (item) => {
  const lane = item.lane || '';
  if (lane.startsWith('3D -')) return 'model';
  if (lane === 'Viewer - tuotanto') return 'production';
  if (
    lane === 'Viewer - integraatio' ||
    lane.startsWith('Prosessi -') ||
    lane === 'Tilannepaneeli'
  ) {
    return 'qa';
  }
  if (lane.startsWith('Viewer -')) return 'viewer';
  return null;
};

const stageSnapshot = (data, stage) => {
  if (stage.id === 'human') {
    return {
      mode: data.humanAction ? 'human' : 'idle',
      label: data.humanAction ? 'SINULTA TARVITAAN' : 'EI AKTIIVISTA TEHTÄVÄÄ',
      active: [],
      recent: [],
      pass: null,
    };
  }

  const active = data.active.filter((item) => stageForActive(item) === stage.id);
  const recent = data.recent.filter((item) => stageForEvent(item) === stage.id).slice(0, 3);
  const pass = recent.find((item) => item.state === 'PASS') || null;

  if (active.length) return { mode: 'active', label: 'TYÖN ALLA', active, recent, pass };
  if (pass) return { mode: 'pass', label: 'VIIMEISIN PASS', active, recent, pass };
  return { mode: 'idle', label: 'EI AKTIIVISTA PAKETTIA', active, recent, pass };
};

const appendTreeItem = (root, title, detail = '', meta = '') => {
  const item = document.createElement('div');
  item.className = 'tree-item';
  item.append(text('strong', title));
  if (detail) item.append(text('p', detail));
  if (meta) item.append(text('p', meta));
  root.append(item);
};

const renderDevelopment = (data) => {
  const flow = $('development-flow');
  const tree = $('development-tree');
  flow.replaceChildren();
  tree.replaceChildren();

  DEVELOPMENT_STAGES.forEach((stage, index) => {
    const snapshot = stageSnapshot(data, stage);

    const card = document.createElement('article');
    card.className = 'development-stage ' + snapshot.mode;
    card.dataset.stage = stage.id;
    card.setAttribute('role', 'listitem');
    card.append(
      text('span', String(index + 1).padStart(2, '0'), 'stage-kicker'),
      text('strong', stage.label),
      text('span', snapshot.label, 'stage-state'),
    );
    flow.append(card);

    const details = document.createElement('details');
    details.dataset.stage = stage.id;
    if (snapshot.mode === 'active' || snapshot.mode === 'human') details.open = true;

    const summary = document.createElement('summary');
    summary.append(
      text('span', stage.label, 'tree-label'),
      text('span', snapshot.label, 'tree-status ' + snapshot.mode),
    );

    const branch = document.createElement('div');
    branch.className = 'tree-branch';

    if (stage.id === 'human') {
      if (data.humanAction) {
        appendTreeItem(branch, data.humanAction.title, data.humanAction.detail);
      } else {
        branch.append(text('p', 'Ei aktiivista ihmisen tehtävää.', 'muted'));
      }
    } else {
      for (const item of snapshot.active) {
        appendTreeItem(
          branch,
          item.title,
          item.goal,
          item.lane + ' - päivitetty ' + formatTime(item.updatedAt),
        );
      }

      if (snapshot.pass) {
        appendTreeItem(
          branch,
          'Viimeisin PASS - ' + snapshot.pass.title,
          snapshot.pass.detail,
          formatTime(snapshot.pass.time),
        );
      }

      if (!snapshot.active.length && !snapshot.pass) {
        branch.append(text('p', 'Ei aktiivista työpakettia tässä vaiheessa.', 'muted'));
      }
    }

    details.append(summary, branch);
    tree.append(details);
  });
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

  renderJourneys(data);
  renderDevelopment(data);
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
