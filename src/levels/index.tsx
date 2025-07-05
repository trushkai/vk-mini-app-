import Level1 from './lvl1/level1';
import Level2 from './lvl2/level2';
import Level3 from './lvl3/level3';
import Level4 from './lvl4/level4';
import Level5 from './lvl5/level5';
import Level6 from './lvl6/level6';
import Level7 from './lvl7/level7';
import Level8 from './lvl8/level8';
import Level9 from './lvl9/level9';
import Level10 from './lvl10/level10';
import Level11 from './lvl11/level11';
import Level12 from './lvl12/level12';

import type { GameWrapperProps } from '../panels/Game';

export const gameComponents: Record<number, React.FC<GameWrapperProps>> = {
  1: Level1,  2: Level2,  3: Level3,  4: Level4,  5: Level5,
  6: Level6,  7: Level7,  8: Level8,  9: Level9,  10: Level10,
  11: Level11,  12: Level12,
};
