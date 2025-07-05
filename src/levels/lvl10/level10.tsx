import React, { FC, useState, useEffect, useCallback } from 'react';
import {
  DndContext, useDraggable, useDroppable,
  DragStartEvent, DragEndEvent, DragOverlay,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Panel, PanelHeader, Snackbar } from '@vkontakte/vkui';
import { Icon24ChevronLeft, Icon16Cancel } from '@vkontakte/icons';

import type { GameWrapperProps } from '../../panels/Game';
import './level10.css';

/* — иконки верхней панели — */
import pauseIcon from '../../assets/pause.svg';
import hintIcon from '../../assets/hint.svg';

/* — предметы — */
import leaf from '../../assets/items/leaf.svg';
import flag from '../../assets/items/flag.svg';
import pirateHat from '../../assets/items/pirate-hat.svg';
import gold from '../../assets/items/gold.svg';
import greenCrystal from '../../assets/items/greenCrystal.png';
import compass from '../../assets/items/compass.svg';

/* — корзины — (широкие svg) */
import greenBasketImg from '../../assets/baskets/wide-green-basket.svg';
import blackBasketImg from '../../assets/baskets/wide-black-basket.svg';
import brownBasketImg from '../../assets/baskets/wide-brown-basket.svg';

/* ---------- типы ---------- */
type ItemType = 'green' | 'black' | 'brown';
interface DraggableItem {
  id: string;
  type: ItemType;
  img: string;
}

/* ---------- стартовый набор ---------- */
const initialItems: DraggableItem[] = [
  { id: '1', type: 'green', img: leaf }, 
  { id: '2', type: 'black', img: flag }, 
  { id: '3', type: 'black', img: pirateHat }, 
  { id: '4', type: 'brown', img: gold }, 
  { id: '5', type: 'green', img: greenCrystal }, 
  { id: '6', type: 'brown', img: compass },
];

/* ======================================================================= */
const Level10: FC<GameWrapperProps> = ({
  currentLevel, openModal, onLevelComplete, activeModal,
}) => {
  /* состояние предметов */
  const [items, setItems] = useState(initialItems);
  const [greenDone,setGreenDone] = useState<DraggableItem[]>([]); 
  const [blackDone,setBlackDone] = useState<DraggableItem[]>([]); 
  const [brownDone,setBrownDone] = useState<DraggableItem[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);

  /* таймер */
  const [sec, setSec] = useState(0);
  const paused = [
    'pause', 'settings', 'confirmRestart', 'confirmMenu',
    'confirmReset', 'confirmRestartGame', 'victoryModal',
  ].includes(String(activeModal));

  useEffect(() => {
    let t: number | undefined;
    if (!paused) t = window.setInterval(() => setSec(s => s + 1), 1000);
    return () => { if (t) clearInterval(t); };
  }, [paused]);
  const fmt = (s: number) => `${String(s / 60 | 0).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  /* ---------- dnd ---------- */
  const onDragStart = (e: DragStartEvent) =>
    setDragId(e.active.id as string);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) { setDragId(null); return; }

    const dragged = items.find(it => it.id === active.id);
    if (!dragged) { setDragId(null); return; }

    const basketId = `${dragged.type}-basket`;
    if (over.id === basketId) {
      /* кладём предмет в корзину */
      switch (dragged.type){ 
        case 'green': setGreenDone(p=>[...p,dragged]); break; 
        case 'black': setBlackDone(p=>[...p,dragged]); break; 
        case 'brown': setBrownDone(p=>[...p,dragged]); break; }
      setItems(arr => arr.filter(it => it.id !== dragged.id));
    }
    setDragId(null);
  };

  /* победа */
  useEffect(() => {
    if (!items.length)
      onLevelComplete(currentLevel, sec);
  }, [items]);

  /* helpers */
  const back = () => window.location.hash = '/levels';
  const [snack, setSnack] = useState<React.ReactNode>(null);

  /* ---------- UI ---------- */
  return (
    <Panel>
      <PanelHeader before={<Icon24ChevronLeft onClick={back}
        style={{ color: '#954B25', cursor: 'pointer' }} />}>
        Уровень 10
      </PanelHeader>

      <div className="game-container">
        {/* верхняя панель */}
        <div className="top-bar">
          <button className="icon-btn" style={{ background: `url(${pauseIcon})` }}
            onClick={() => openModal('pause')} />
          <div className="timer">{fmt(sec)}</div>
          <button className="icon-btn" style={{ background: `url(${hintIcon})` }}
            onClick={() => setSnack(
              <Snackbar before={<Icon16Cancel />}
                onClose={() => setSnack(null)}>
                Сортируй предметы по цвету корзин
                (зелёная, черная, коричневая)
              </Snackbar>
            )} />
        </div>

        <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
          {/* три корзины */}
          <div className="baskets-row">
            <div className="wide-green-basket"><Basket type="green" items={greenDone} /></div>
            <div className="wide-yellow-basket"><Basket type="black" items={blackDone} /></div>
            <div className="wide-pink-basket"><Basket type="brown" items={brownDone} /></div>
          </div>

          {/* предметы внизу */}
          <div className="items-container">
            {items.map(it => <Draggable key={it.id} item={it} />)}
          </div>

          {/* картинка под пальцем */}
          <DragOverlay>
            {dragId && (
              <img src={initialItems.find(i => i.id === dragId)?.img}
                className="dragged-item" />
            )}
          </DragOverlay>
        </DndContext>
      </div>
      {snack}
    </Panel>
  );
};

/* — sub-components — */
const Draggable: FC<{ item: DraggableItem }> = ({ item }) => {
  const { setNodeRef, attributes, listeners, transform, isDragging } =
    useDraggable({ id: item.id });
  const style: React.CSSProperties = {
    transform: transform ? CSS.Translate.toString(transform) : undefined, opacity: isDragging ? 0 : 1, transition: 'opacity .15s',
  };
  return (
    <div ref={setNodeRef} className="dnd-item"
      style={style} {...attributes}{...listeners}>
      <img src={item.img} className="item-image" />
    </div>
  );
};

const Basket: FC<{ type: ItemType; items: DraggableItem[] }> = ({ type, items }) => {
  const { setNodeRef } =
    useDroppable({ id: `${type}-basket` });

  const img = type === 'green'
    ? greenBasketImg
    : type === 'black'
      ? blackBasketImg
      : brownBasketImg;

  return (
    <div ref={setNodeRef} className="basket">
      <img src={img} className="basket-img" />
      <div className="items-in-basket">
        {items.map(it => (
          <img key={it.id} src={it.img} className="mini-item" />
        ))}
      </div>
    </div>
  );
};

export default Level10;
