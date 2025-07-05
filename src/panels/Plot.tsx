import React from 'react';
import { Panel, PanelHeader, Div } from '@vkontakte/vkui';
import './Plot.css';

interface PlotProps {
  currentLevel: number;
  setCurrentLevel: (lvl: number) => void;
}

/* — тексты по уровням — */
const plotTexts: Record<number, string> = {
  1: 'Отличная работа!\n\nСпасибо за помощь, благодаря тебе мы всё ближе к сокровищам!',
  2: 'Так держать!\n\nТы отлично справляешься, но будь осторожен — впереди густые джунгли…',
  4: 'Вот это да!\n\nМы нашли карту, которая приведёт нас к сокровищам! Наша цель ещё на шаг ближе.',
  7: 'Ого-го!\n\nНам удалось найти ключ от сундука с сокровищами — вот это удача!',
  9: 'Свистать всех наверх!\n\nТы бодро продвигаешься, но будь на чеку — на острове обитают дикие звери…',
  12:'Ура!\n\nСундук с сокровищами у нас в руках! Звание помощника капитана теперь по праву твоё!',
};

const Plot: React.FC<PlotProps> = ({ currentLevel, setCurrentLevel }) => {
  const msg = plotTexts[currentLevel] ?? 'Продолжим приключение?';

  const handleContinue = () => {
    /* после финального (12) – на главное меню */
    if (currentLevel >= 12) {
      window.location.hash = '/';
    } else {
      /* переходим к выбору уровней и автоматически выделяем следующий */
      setCurrentLevel(currentLevel + 1);
      window.location.hash = '/levels';
    }
  };

  return (
    <Panel>
      <PanelHeader>Сюжет</PanelHeader>
      <Div className="Plot">
        <div className="plot-text">
          <p>{msg.split('\n').map((t, i) => <React.Fragment key={i}>{t}<br/></React.Fragment>)}</p>
          <button className="continue-btn" onClick={handleContinue}/>
        </div>
      </Div>
    </Panel>
  );
};

export default Plot;
