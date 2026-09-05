export const initializeScrollReadout = () => {
  const scrollReadout = document.querySelector('[data-scroll-readout]');
  const scrollYLabel = document.querySelector('[data-scroll-y]');
  const scrollPercentLabel = document.querySelector('[data-scroll-percent]');

  if (
    !(scrollReadout instanceof HTMLElement) ||
    !(scrollYLabel instanceof HTMLElement) ||
    !(scrollPercentLabel instanceof HTMLElement)
  ) return;

  if (scrollReadout.dataset.scrollReadoutInitialized === 'true') return;
  scrollReadout.dataset.scrollReadoutInitialized = 'true';

  let scrollHideTimer = 0;
  let scrollFrame = 0;

  const updateScrollReadout = () => {
    scrollFrame = 0;

    const y = Math.max(0, Math.round(window.scrollY));
    const maximum = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight
    );
    const percent = Math.max(
      0,
      Math.min(100, Math.round((window.scrollY / maximum) * 100))
    );

    scrollYLabel.textContent = `Y ${String(y).padStart(4, '0')}`;
    scrollPercentLabel.textContent = `${percent}%`;
    scrollReadout.classList.add('is-visible');

    window.clearTimeout(scrollHideTimer);
    scrollHideTimer = window.setTimeout(() => {
      scrollReadout.classList.remove('is-visible');
    }, 900);
  };

  const handleScroll = () => {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(updateScrollReadout);
  };

  const cleanup = () => {
    window.clearTimeout(scrollHideTimer);
    if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
    window.removeEventListener('scroll', handleScroll);
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('pagehide', cleanup, { once: true });
};
