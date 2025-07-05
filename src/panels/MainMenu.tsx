// src\panels\MainMenu.tsx
import React, { useEffect } from 'react';
import { Panel, PanelHeader, Div } from '@vkontakte/vkui';
import './MainMenu.css';
import type { ModalId } from '../App';

interface MainMenuProps {
  coins: number;
  openModal: (id: ModalId) => void;
  hasNewAch: boolean;
}

const MainMenu: React.FC<MainMenuProps> = ({ coins, openModal, hasNewAch }) => {
  useEffect(() => {
    const visited = localStorage.getItem('firstVisit');
    if (!visited) {
      openModal('story');
      localStorage.setItem('firstVisit', 'true');
    }
  }, [openModal]);
  
  const goPlay = () => (window.location.hash = '/levels');
  const goShop = () => (window.location.hash = '/shop');
  const goAchievements = () => (window.location.hash = '/achievements');
  const openSettings = () => openModal('settings');



  return (
    <Panel>
      <PanelHeader>Лагуна приключений</PanelHeader>
      <Div className="MainMenu">
        {/* Кнопка настроек settings.svg) */}
        <button className="settings-btn" onClick={openSettings} aria-label="Настройки" />
        {/* Счётчик монет */}
        <div className="coin-counter">
          <span className="coin-count">{coins}</span>
        </div>

        <div className="main-buttons">
          <button className="menu-button" onClick={goPlay}>Играть</button>
          <button className="menu-button" onClick={goShop}>Магазин</button>
          <button className="menu-button" onClick={goAchievements}>{hasNewAch && <span className="menu-badge" />}Достижения</button>
        </div>
      </Div>
    </Panel>
  );
};

export default MainMenu;