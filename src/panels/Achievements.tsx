// src\panels\Achievements.tsx
import React, { FC } from 'react';
import { Panel, PanelHeader, Div, Progress } from '@vkontakte/vkui';
import { Icon24ChevronLeft } from '@vkontakte/icons';

import './Achievements.css';

import coin from '../assets/coin.svg';

import { ACHIEVEMENTS, AchievementId } from '../achievements/data';
import type { ModalId } from '../App';

interface Props {
  coins: number;
  progress: Record<AchievementId, number>;
  rewarded: AchievementId[];
  onClaim: (id: AchievementId) => void;
  openModal: (id: ModalId) => void;
}

const Achievements: FC<Props> = ({ coins, progress, rewarded, onClaim, openModal }) => {
  const back = () => (window.location.hash = '/');
  const openSettings = () => openModal('settings');

  return (
    <Panel>
      <PanelHeader
        before={<Icon24ChevronLeft onClick={back} style={{ color: '#954B25' }} />}
      >
        Достижения
      </PanelHeader>

      <Div className="ach-page">
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

        {/* карточки */}
        {ACHIEVEMENTS.map(a => {
          const cur = progress[a.id] ?? 0;
          const ready = cur >= a.goal;
          const claimed = rewarded.includes(a.id);
          const percent = Math.min(100, (cur / a.goal) * 100);

          return (
            <div
              key={a.id}
              className={[
                'ach-card',
                ready && !claimed ? 'pulse' : '',
                claimed ? 'claimed' : '',
              ].join(' ')} onClick={() => ready && !claimed && onClaim(a.id)}
            >
              <div className="ach-top">
                <span className="ach-title">{a.title}</span>

                {!claimed &&
                  <span className="ach-reward">
                    +{a.reward}
                    <img src={coin} alt="" />
                  </span>}
              </div>

              {/* полоса + счётчик по центру */}
              <div className="ach-bar">
                <Progress value={percent} appearance="accent" />
                <span className="ach-count">
                  {Math.min(cur, a.goal)}/{a.goal}
                </span>
              </div>
            </div>
          );
        })}
      </Div>
    </Panel>
  );
};

export default Achievements;
