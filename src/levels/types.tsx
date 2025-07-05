//src\levels\types.tsx
export interface LevelItem {
    id: string;
    img: string;          // картинка предмета
    placeholder: string;  // «тень»
    start:  { x: number; y: number };
    target: { x: number; y: number };
    snapRadius: number;   // во сколько px от target считается «попаданием»
  }
  
  export interface LevelConfig {
    id: number;
    bg: string;           // фон уровня
    timeLimit: number;    // лимит времени (0 – без лимита)
    items: LevelItem[];
  }
  