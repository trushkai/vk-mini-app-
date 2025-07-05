// /src/routes.ts

import {
  createHashRouter,
  createPanel,
  createRoot,
  createView,
  RoutesConfig,
} from '@vkontakte/vk-mini-apps-router';

export const DEFAULT_ROOT = 'default_root';

export const DEFAULT_VIEW = 'default_view';

export const DEFAULT_VIEW_PANELS = {
  LOADING: 'loading',
  MAIN: 'main',
  LEVELS: 'levels',
  GAME: 'game',
  VICTORY: 'victory',
  PLOT: 'plot',
  ACHIEVEMENTS: 'achievements',
  SHOP: 'shop',
} as const;

export const routes = RoutesConfig.create([
  createRoot(DEFAULT_ROOT, [
    createView(DEFAULT_VIEW, [
      createPanel(DEFAULT_VIEW_PANELS.LOADING, '/loading', []),
      createPanel(DEFAULT_VIEW_PANELS.MAIN, '/', []),  // на '/' главная
      createPanel(DEFAULT_VIEW_PANELS.LEVELS, '/levels', []),
      createPanel(DEFAULT_VIEW_PANELS.GAME, '/game', []),
      createPanel(DEFAULT_VIEW_PANELS.VICTORY, '/victory', []),
      createPanel(DEFAULT_VIEW_PANELS.PLOT, '/plot', []),
      createPanel(DEFAULT_VIEW_PANELS.ACHIEVEMENTS, '/achievements', []),
      createPanel(DEFAULT_VIEW_PANELS.SHOP, '/shop', []),
    ]),
  ]),
]);

export const router = createHashRouter(routes.getRoutes());
