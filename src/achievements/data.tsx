// src\achievements\data.tsx
/* ----------------------------------------------------------
 *  Единый источник правды для всех достижений
 * ---------------------------------------------------------*/
export type AchievementId =
  | 'lvl5'   // пройти 5 уровней
  | 'lvl10'  // пройти 10 уровней
  | 'lvl12'  // пройти 12 уровней  
  | '5sec' // пройти уровень ≤ 5 с
  | 'hat1' // купить 1 шляпу
  | 'hatAll'; // купить все шляпы

export interface Achievement {
  id: AchievementId;
  title: string;
  goal: number;
  reward: number;  // монеты
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'lvl5',  title: 'Пройти 5 уровней',          goal: 5,  reward: 10 },
  { id: 'lvl10', title: 'Пройти 10 уровней',         goal: 10, reward: 10 },
  { id: 'lvl12', title: 'Пройти 12 уровней',         goal: 12, reward: 10 },  
  { id: '5sec',   title: 'Пройти уровень за 5 сек.',   goal: 1,  reward: 10 },
  { id: 'hat1',   title: 'Купить 1 шляпу в магазине',            goal: 1,  reward: 10 },
  { id: 'hatAll', title: 'Купить все шляпы в магазине',          goal: 3,  reward: 10 },
];
