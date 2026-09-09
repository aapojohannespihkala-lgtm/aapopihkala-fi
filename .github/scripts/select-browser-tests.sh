#!/usr/bin/env bash
# Emit existing Playwright spec paths, one per line, for a PR's changed paths.
set -euo pipefail
cd "$(dirname "$0")/../.."

declare -A selected=()
add() {
  local name
  for name in "$@"; do selected["tests/e2e/${name}.spec.ts"]=1; done
}
layout() { add current-section-boundaries current-horizontal-overflow current-mobile-viewports; }
electricity() { add current-electricity-alignment current-electricity-presentation current-electricity-summary current-electricity-tomorrow; }
weather() { add current-weather-solar-geometry current-weather-solar-presentation current-weather-timeout; }
markets() { add current-markets current-markets-default-order current-markets-fallback current-markets-timeout; }
liiga() { add current-liiga current-liiga-schedule current-snapshot-liiga; }
snapshot() { add current-snapshot current-snapshot-liiga current-snapshot-month-calendar; }
all_current() {
  layout; electricity; weather; markets; liiga; snapshot
  add current-news current-news-timeout current2-responsive
}

# An unknown/empty change set must not silently disable the construction guards.
if [[ $# -eq 0 ]]; then all_current; add meshy-poise-regression; fi

for file in "$@"; do
  case "$file" in
    .github/workflows/build-check.yml|.github/scripts/*|package.json|package-lock.json|playwright.config.ts|astro.config.mjs|tsconfig.json)
      all_current; add meshy-poise-regression ;;
    src/layouts/*|src/styles/global.css|src/components/Analytics.astro|src/components/SiteHeader.astro|src/components/SiteInteractionLayer.astro|src/components/NightModeToggle.astro|src/features/interactions/*|src/config/site.ts)
      all_current ;;
    src/components/current/CurrentSnapshot*|src/pages/current/snapshot/*|src/features/current/snapshot*)
      snapshot ;;
    src/components/current/CurrentLiiga*|src/pages/current/liiga/*|src/features/current/liiga*|src/styles/current-liiga*|src/config/liiga*|public/icons/current-*)
      liiga ;;
    src/components/current/CurrentElectricity*|src/pages/current/electricity/*|src/features/current/electricity*|src/styles/current-electricity*)
      layout; electricity; add current-snapshot ;;
    src/components/current/CurrentWeather*|src/pages/current/weather/*|src/features/current/weather*|src/features/current/solarPresentation.ts|src/styles/current-weather*|src/styles/current-solar*)
      layout; weather; add current-regression current-snapshot ;;
    src/components/current/CurrentMarkets*|src/components/current/CurrentRates*|src/pages/current/markets/*|src/pages/current/rates/*|src/features/current/market*|src/features/current/remedy*|src/styles/current-markets*)
      layout; markets; add current-snapshot ;;
    src/components/current/CurrentNews*|src/pages/current/news/*|src/features/current/news*)
      add current-news current-news-timeout ;;
    src/pages/current2/*|src/components/current/Current2*)
      add current2-responsive ;;
    src/features/current/chart*)
      layout; electricity; markets; add current-market-chart-presentation ;;
    src/components/current/*|src/pages/current/*|src/features/current/*|src/styles/current-*)
      all_current ;;
    functions/api/current/liiga*)
      liiga; add current-worker-regression ;;
    functions/api/current/electricity*)
      electricity; add current-worker-regression current-regression ;;
    functions/api/current/news*)
      add current-news current-news-timeout ;;
    functions/api/current/*|worker/*|wrangler.jsonc)
      add current-worker-regression current-portfolio-resilience current-markets-fallback current-markets-timeout ;;
    src/components/MeshyPixelatedPoise.astro|src/scripts/threeRuntime.ts)
      add meshy-poise-regression ;;
    tests/e2e/*.spec.ts)
      selected["$file"]=1 ;;
  esac
done

for file in "${!selected[@]}"; do
  # A removed spec must not make Playwright fail with a missing test argument.
  if [[ -f "$file" ]]; then printf '%s\n' "$file"; fi
done | sort
