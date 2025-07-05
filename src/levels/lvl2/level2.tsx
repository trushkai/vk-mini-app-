// src/levels/level2.tsx
import React, { FC, useState, useEffect, useCallback } from 'react';
import {
  DndContext, useDroppable, useDraggable,
  DragStartEvent, DragEndEvent, DragOverlay
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Panel, PanelHeader, Snackbar } from '@vkontakte/vkui';
import { Icon24ChevronLeft, Icon16Cancel } from '@vkontakte/icons';

import type { GameWrapperProps } from '../../panels/Game';

import './level2.css';           // используем тот же стиль фона
import pauseIcon   from '../../assets/pause.svg';
import hintIcon    from '../../assets/hint.svg';
import pirateHat   from '../../assets/items/pirate-hat.svg';
import banana      from '../../assets/items/banana.svg';
import flag        from '../../assets/items/flag.svg';
import money       from '../../assets/items/money.svg';
import telescope   from '../../assets/items/telescope.svg';
import crystal     from '../../assets/items/crystal.png';
import yellowBasket from '../../assets/baskets/yellow-basket.svg';
import blackBasket  from '../../assets/baskets/black-basket.svg';

/* --- типы ---------------------------------------------------------------- */
type ItemType = 'yellow' | 'black';
interface DraggableItem {
  id: string;
  type: ItemType;
  img: string;
}

/* --- стартовое состояние -------------------------------------------------- */
const initialItems: DraggableItem[] = [
  { id: '1', type: 'black',  img: pirateHat  },
  { id: '2', type: 'yellow', img: banana     },
  { id: '3', type: 'black',  img: flag       },
  { id: '4', type: 'yellow', img: money      },
  { id: '5', type: 'black',  img: telescope  },
  { id: '6', type: 'yellow', img: crystal    },
];

/* ------------------------------------------------------------------------- */
const Level2: FC<GameWrapperProps> = ({
  currentLevel,
  openModal,
  onLevelComplete,
  activeModal,
}) => {
  /* состояние игры */
  const [items,        setItems]        = useState(initialItems);
  const [yellowPlaced, setYellowPlaced] = useState<DraggableItem[]>([]);
  const [blackPlaced,  setBlackPlaced]  = useState<DraggableItem[]>([]);
  const [activeId,     setActiveId]     = useState<string | null>(null);

  /* таймер */
  const [time, setTime]     = useState(0);
  const [isPaused, setPaused] = useState(false);

  /* ставим/снимаем паузу, когда открываются модалки */
  useEffect(() => {
    const mustPause = [
      'pause','settings','confirmRestart','confirmMenu',
      'confirmReset','confirmRestartGame','victoryModal'
    ].includes(String(activeModal));
    setPaused(mustPause);
  }, [activeModal]);

  useEffect(() => {
    let id: number|undefined;
    if (!isPaused) id = window.setInterval(() => setTime(t => t + 1), 1000);
    return () => { if (id) clearInterval(id); };
  }, [isPaused]);

  /* победа */
  useEffect(() => {
    if (!items.length) onLevelComplete(currentLevel, time);
  }, [items]);

  /* --- DnD handlers ------------------------------------------------------- */
  const onDragStart = useCallback((e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  }, []);

  const onDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;

    const dragged = items.find(i => i.id === active.id);
    if (!dragged) return;

    const correctBasket = dragged.type === 'yellow'
      ? 'yellow-basket' : 'black-basket';

    if (over.id === correctBasket) {
      if (dragged.type === 'yellow')
        setYellowPlaced(p => [...p, dragged]);
      else
        setBlackPlaced(p => [...p, dragged]);

      setItems(p => p.filter(i => i.id !== dragged.id));
    }
    setActiveId(null);
  }, [items]);

  /* --- helpers ----------------------------------------------------------- */
  const fmt = (s: number) => `${String(s/60|0).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const back = () => window.location.hash = '/levels';
  const [snack, setSnack] = React.useState<React.ReactNode>(null);

  /* ------------------------------- UI ------------------------------------ */
  return (
    <Panel>
      <PanelHeader before={<Icon24ChevronLeft onClick={back} style={{ color:'#954B25', cursor:'pointer' }}/>}>
        Уровень 2
      </PanelHeader>

      <div className="game-container">
        <div className="top-bar">
          <button className="icon-btn" style={{ background:`url(${pauseIcon})`  }} onClick={()=>openModal('pause')}/>
          <div className="timer">{fmt(time)}</div>
          <button className="icon-btn" style={{ background:`url(${hintIcon})`   }} onClick={()=>
          setSnack(
            <Snackbar before={<Icon16Cancel />} onClose={() => setSnack(null)}>
              Сортируй предметы по цвету!
            </Snackbar>
          )}/>
        </div>

        <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
          {/* корзины */}
          <div className="baskets-row">
            <div className="yellow-basket"><Basket type="yellow" items={yellowPlaced}/></div>
            <div className="black-basket"><Basket type="black"  items={blackPlaced}/></div>
          </div>

          {/* исходные предметы */}
          <div className="items-container">
            {items.map(it => <Draggable key={it.id} item={it}/>)}
          </div>

          {/* курсор-overlay */}
          <DragOverlay>
            {activeId &&
              <img
                src={items.find(i => i.id === activeId)?.img}
                className="dragged-item"
                alt=""
              />}
          </DragOverlay>
        </DndContext>
      </div>
      {snack}
    </Panel>
  );
};

/* ---------------- вспомогательные компоненты ---------------------------- */
const Draggable: FC<{ item: DraggableItem }> = ({ item }) => {
  const { attributes, listeners, setNodeRef, transform , isDragging } = useDraggable({ id: item.id });
  const style: React.CSSProperties = { transform: transform ? CSS.Translate.toString(transform) : undefined, opacity: isDragging ? 0 : 1, transition: 'opacity .15s', };

  return (
    <div ref={setNodeRef} className="dnd-item" style={style} {...listeners} {...attributes}>
      <img src={item.img} className="item-image" alt=""/>
    </div>
  );
};

const Basket: FC<{ type: ItemType; items: DraggableItem[] }> = ({ type, items }) => {
  const { setNodeRef } = useDroppable({ id: type === 'yellow' ? 'yellow-basket' : 'black-basket' });
  const img = type === 'yellow' ? yellowBasket : blackBasket;

  return (
    <div ref={setNodeRef} className="basket">
      <img src={img} className="basket-img" alt=""/>
      <div className="items-in-basket">
        {items.map(it => <img key={it.id} src={it.img} className="mini-item" alt=""/>)}
      </div>
    </div>
  );
};

export default Level2;
