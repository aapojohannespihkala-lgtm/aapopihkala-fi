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

const applyFilledIlves = (root: Element, pathData: string) => {
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
