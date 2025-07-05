// src/panels/Game.tsx
import React from 'react';
import { Panel, PanelHeader } from '@vkontakte/vkui';
import type { ModalId } from '../App';
import { Icon24ChevronLeft } from '@vkontakte/icons';

/* карта «номер ⇒ компонент уровня» */
import { gameComponents } from '../levels';

/**
 * Проп-пакет, который уже передаёт <App/> своему Game-экрану
 */
export interface GameWrapperProps {
  currentLevel: number;
  openModal: (id: ModalId) => void;
  onLevelComplete: (lvl: number, timeSec: number) => void;
  completedLevels: number[];
  activeModal: ModalId;
}

  /* --- helpers ----------------------------------------------------------- */
  const back = () => window.location.hash = '/levels';


const Game: React.FC<GameWrapperProps> = (props) => {
  const LevelComponent = gameComponents[props.currentLevel];

  /* если уровень ещё не готов ─ показываем заглушку */
  if (!LevelComponent) {
    return (
      <Panel>
        <PanelHeader before={<Icon24ChevronLeft onClick={back} style={{ color:'#954B25', cursor:'pointer' }}/>}>Уровень {props.currentLevel}</PanelHeader>
        <div style={{ padding: 20, fontSize: 18, color: '#954B25', textAlign: 'center' }}>
          Этот уровень пока недоступен.<br />Ждите следующего обновления!
        </div>
      </Panel>
    );
  }

  /* иначе просто рендерим реальный компонент и пробрасываем ВСЕ пропсы */
  return <LevelComponent {...props} />;
};

export default Game;
