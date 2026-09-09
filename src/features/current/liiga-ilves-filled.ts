const SVG_NS = 'http://www.w3.org/2000/svg';

const replaceMark = (target: Element, pathData: string) => {
  if (target.getAttribute('data-liiga-ilves-filled') === 'true') return;

  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', pathData);
  path.setAttribute('class', 'liiga-team-mark__fill');
  path.setAttribute('fill-rule', 'evenodd');

  target.replaceChildren(path);
  target.setAttribute('data-liiga-ilves-filled', 'true');
};

// Keep the heading emblem on the same filled path as the inline Liiga marks.
const ensureHeadingMark = (root: Element, pathData: string) => {
  const heading = root.querySelector('.liiga-heading');
  if (!heading || heading.querySelector('[data-liiga-ilves-heading-mark]')) return;

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 48 48');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('class', 'liiga-heading__ilves-mark');
  svg.setAttribute('data-liiga-ilves-heading-mark', 'true');

  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', pathData);
  path.setAttribute('fill', 'currentColor');
  path.setAttribute('fill-rule', 'evenodd');

  svg.append(path);
  heading.append(svg);
};

const applyFilledIlves = (root: Element, pathData: string) => {
  ensureHeadingMark(root, pathData);

  const symbol = root.querySelector('#liiga-match-mark-ilves');
  if (symbol) replaceMark(symbol, pathData);

  root.querySelectorAll('svg[data-liiga-mark-id="ilves"]').forEach((svg) => {
    replaceMark(svg, pathData);
  });
};

export const initCurrentLiigaIlvesFilled = () => {
  const root = document.querySelector('[data-current-liiga]');
  if (!root) return;

  void import('./liiga-ilves-filled-path').then(({ ILVES_FILLED_PATH }) => {
    applyFilledIlves(root, ILVES_FILLED_PATH);

    const observer = new MutationObserver(() => {
      applyFilledIlves(root, ILVES_FILLED_PATH);
    });

    observer.observe(root, { childList: true, subtree: true });
  });
};
