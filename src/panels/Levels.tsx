//src\panels\Levels.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Panel, PanelHeader, Div, Snackbar } from '@vkontakte/vkui';
import { Icon24ChevronLeft, Icon16Cancel } from '@vkontakte/icons';
import './Levels.css';
import type { ModalId } from '../App';

/* иконки */
import l1 from '../assets/levels/level1.svg';
import l1a from '../assets/levels/level1--active.svg';
import l2 from '../assets/levels/level2.svg';
import l2a from '../assets/levels/level2--active.svg';
import l3 from '../assets/levels/level3.svg';
import l3a from '../assets/levels/level3--active.svg';
import l4 from '../assets/levels/level4.svg';
import l4a from '../assets/levels/level4--active.svg';
import l5 from '../assets/levels/level5.svg';
import l5a from '../assets/levels/level5--active.svg';
import l6 from '../assets/levels/level6.svg';
import l6a from '../assets/levels/level6--active.svg';
import l7 from '../assets/levels/level7.svg';
import l7a from '../assets/levels/level7--active.svg';
import l8 from '../assets/levels/level8.svg';
import l8a from '../assets/levels/level8--active.svg';
import l9 from '../assets/levels/level9.svg';
import l9a from '../assets/levels/level9--active.svg';
import l10 from '../assets/levels/level10.svg';
import l10a from '../assets/levels/level10--active.svg';
import l11 from '../assets/levels/level11.svg';
import l11a from '../assets/levels/level11--active.svg';
import l12 from '../assets/levels/level12.svg';
import l12a from '../assets/levels/level12--active.svg';

interface LevelsProps {
  coins: number;
  unlockedLevel: number;
  setCurrentLevel: (lvl: number) => void;
  openModal: (id: ModalId) => void;
}

const iconsAll = [
  { lock: l12, open: l12a },
  { lock: l11, open: l11a },
  { lock: l10, open: l10a },
  { lock: l9, open: l9a },
  { lock: l8, open: l8a },
  { lock: l7, open: l7a },
  { lock: l6, open: l6a },
  { lock: l5, open: l5a },
  { lock: l4, open: l4a },
  { lock: l3, open: l3a },
  { lock: l2, open: l2a },
  { lock: l1, open: l1a },
];

const Levels: React.FC<LevelsProps> = ({
  coins,
  unlockedLevel,
  setCurrentLevel,
  openModal,
}) => {
  /* — ссылка на контейнер, чтобы скроллить из кода — */
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const [snack, setSnack] = useState<React.ReactNode>(null);

  const onBack = () => (window.location.hash = '/');
  const openSettings = () => openModal('settings');

  const handleLevelClick = (visualIdx: number) => {
    const realLevel = 12 - visualIdx;
    if (realLevel > unlockedLevel) {
      setSnack(
        <Snackbar before={<Icon16Cancel />} onClose={() => setSnack(null)}>
          Уровень пока закрыт
        </Snackbar>
      );
      return;
    }
    setCurrentLevel(realLevel);
    window.location.hash = '/game';
  };
  /* ───── автоскролл после монтирования ───── */
  useEffect(() => {
    if (!wrapperRef.current) return;

    // визуальный индекс кнопки («0» – уровень-12, «11» – уровень-1)
    const idx = 12 - unlockedLevel;
    const target = wrapperRef.current.querySelector(`.level-${idx}`);
    if (target) {
      // чуть позже, чтобы DOM успел дорисоваться
      setTimeout(() => {
        (target as HTMLElement).scrollIntoView({ behavior : 'smooth', block: 'center' });
      }, 50);
    }
  }, [unlockedLevel]);

  return (
    <Panel>
      <PanelHeader before={<Icon24ChevronLeft onClick={onBack} style={{ color: '#954B25', cursor: 'pointer' }} />}>Уровни</PanelHeader>

      <Div className="LevelsContainer" getRootRef={wrapperRef}>
        {/* верхние иконки */}
        <Div className="settings-coin-fixed">
          <button
            className="settings-btn-levels"
            style={{ zIndex: 2 }}
            onClick={openSettings}
          />
          <div className="coin-counter-levels">
            <span className="coin-count-levels">{coins}</span>
          </div>
        </Div>

        {/* сетка уровней */}
        <Div className="levels-path-container">
          <div className="levels-path">
            {iconsAll.map((icon, idx) => {
              const realLevel = 12 - idx;
              const isOpen = realLevel <= unlockedLevel;
              return (
                <div
                  key={idx}
                  className={`level-btn-loc level-${idx} ${isOpen ? 'open' : 'locked'}`}
                  onClick={() => handleLevelClick(idx)}
                >
                  <img src={isOpen ? icon.open : icon.lock} alt={`Уровень ${realLevel}`} />
                </div>
              );
            })}
          </div>
        </Div>
      </Div>

      {snack}
    </Panel>
  );


};

export default Levels;

