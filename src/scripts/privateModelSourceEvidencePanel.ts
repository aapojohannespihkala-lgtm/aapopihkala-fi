import { sourceEvidenceLabels, type SelectionSourceEvidence } from './privateModelSourceCards';

const sourceRoleLabels: Record<string, string> = {
  drawing_label: 'Piirustuksen merkintä',
  group_name: 'Ryhmän nimi keskuskaaviosta',
  photo_relative_appearance: 'Valokuva: suhteellinen ulkonäkö',
  documented_measurement_and_limits: 'Kirjattu mitta ja tulkintarajat',
  documented_user_measurements_and_component_provenance: 'Kirjatut käyttäjämitat ja mallilähde',
  qa_and_partial_review: 'QA ja rajattu katselmus',
};

const element = <K extends keyof HTMLElementTagNameMap>(tag: K, value: string, className?: string) => {
  const node = document.createElement(tag);
  node.textContent = value;
  if (className) node.className = className;
  return node;
};

export const renderSelectionSourceEvidence = (
  section: HTMLElement | null | undefined, evidence: SelectionSourceEvidence | undefined, rawLinkCount: number,
) => {
  if (!section) return;
  section.replaceChildren();
  section.hidden = !evidence;
  if (!evidence) { delete section.dataset.state; return; }
  section.dataset.state = evidence.state;
  section.append(element('h3', 'Lähdekortti ja varmuus'));
  const status = evidence.state === 'matched' ? 'Kohdistettu tähän malliversioon'
    : evidence.state === 'mismatch' ? 'Kohdistus ei vahvistettu'
    : evidence.state === 'unavailable' ? 'Lähdekortit eivät ole saatavilla'
    : rawLinkCount ? 'Objektikohtaista lähdekorttia ei ole vielä kytketty.' : 'Ei yksilöityjä lähteitä';
  section.append(element('p', status, 'source-evidence-status'));
  section.append(element('p', 'Lähdeviite ei vahvista nykyistä sijaintia tai toteumaa.', 'source-evidence-note'));
  const version = element('details', '');
  version.append(element('summary', 'Malliversio ja kohdistus'), element('p', evidence.version));
  if (evidence.reason) version.append(element('p', evidence.reason));
  section.append(version);

  for (const card of evidence.cards) {
    const article = element('article', '', 'source-evidence-card');
    article.dataset.sourceCardId = card.id;
    article.append(element('h4', card.title), element('p', card.status, 'source-evidence-status'));
    const facts = element('dl', '', 'source-evidence-facts');
    for (const fact of card.facts) {
      const value = element('dd', fact.value);
      value.append(element('small', sourceEvidenceLabels[fact.kind], 'source-evidence-kind'));
      value.dataset.evidenceKind = fact.kind;
      value.title = fact.evidence;
      facts.append(element('dt', fact.label), value);
    }
    article.append(facts);
    if (card.conflicts.length) {
      const conflict = element('div', '', 'source-evidence-conflict');
      conflict.append(element('strong', 'Metatietoristiriita'));
      for (const value of card.conflicts) conflict.append(element('p', value));
      article.append(conflict);
    }
    const sources = element('ul', '', 'source-evidence-sources');
    for (const source of card.sources) {
      const item = element('li', '');
      const anchor = element('a', source.title);
      anchor.href = source.url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.referrerPolicy = 'no-referrer';
      const role = element('p', `Rooli: ${sourceRoleLabels[source.role] ?? source.role}`);
      role.dataset.sourceRole = source.role;
      item.append(anchor, role);
      if (source.supports.length) item.append(element('p', `Tukee: ${source.supports.join(', ')}`));
      if (source.limits.length) item.append(element('p', `Ei vahvista: ${source.limits.join(', ')}`));
      sources.append(item);
    }
    article.append(sources);
    for (const note of card.notes) article.append(element('p', note, 'source-evidence-note'));
    section.append(article);
  }
};
