/**
 * Уровень 3 — раскладываем компасы от маленького к большому
 * структура и логика полностью повторяют Level 2/Level 1
 */
import React, { FC, useState, useEffect } from 'react';
import {
  DndContext, useDroppable, useDraggable,
  DragStartEvent, DragEndEvent, DragOverlay,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

import { Panel, PanelHeader, Snackbar } from '@vkontakte/vkui';
import { Icon24ChevronLeft, Icon16Cancel } from '@vkontakte/icons';

import type { GameWrapperProps } from '../../panels/Game';
import './level3.css';                 /* 🔹 стили уровня (ниже) */

import pauseIcon from '../../assets/pause.svg';
import hintIcon from '../../assets/hint.svg';

/* один и тот же svg будем просто масштабировать */
import compass from '../../assets/items/compass.svg';
import compassSil from '../../assets/placeholders/compass-sil.svg';

/* ── типы ───────────────────────────────────────── */
type ItemId = 'c1' | 'c2' | 'c3' | 'c4';
interface DraggableItem { id: ItemId; img: string; size: number }

/* маленький → большой */
const initial: DraggableItem[] = [
  { id: 'c1', img: compass, size: 70 },
  { id: 'c2', img: compass, size: 85 },
  { id: 'c3', img: compass, size: 100 },
  { id: 'c4', img: compass, size: 115 },
];

/* ── компонент ─────────────────────────────────── */
const Level3: FC<GameWrapperProps> = ({
  currentLevel, openModal, onLevelComplete, activeModal,
}) => {
  const bottomOrder: ItemId[] = ['c3', 'c1', 'c4', 'c2'];
  const [items, setItems] = useState(() =>
    bottomOrder.map(id => initial.find(it => it.id === id)!)
  );
  const [placed, setPlaced] = useState<ItemId[]>([]);
  const [dragId, setDragId] = useState<ItemId | null>(null);

  /* таймер */
  const [sec, setSec] = useState(0);
  const paused = ['pause', 'settings', 'confirmRestart', 'confirmMenu',
    'confirmReset', 'confirmRestartGame', 'victoryModal']
    .includes(String(activeModal));
  useEffect(() => {
    let id: number | undefined;
    if (!paused) id = setInterval(() => setSec(s => s + 1), 1000);
    return () => { if (id) clearInterval(id); };
  }, [paused]);
  const fmt = (s: number) => `${String(s / 60 | 0).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  /* dnd */
  const onDragStart = (e: DragStartEvent) => setDragId(e.active.id as ItemId);
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e; setDragId(null);
    if (!over) return;
    const id = active.id as ItemId;
    if (over.id === `slot-${id}`) {
      setPlaced(p => [...p, id]);
      setItems(arr => arr.filter(it => it.id !== id));
      document.getElementById(`slot-${id}`)?.classList.add('filled');
    }
  };

  /* победа */
  useEffect(() => {
    if (placed.length === initial.length)
      onLevelComplete(currentLevel, sec);
  }, [placed]);

  /* helpers */
  const back = () => window.location.hash = '/levels';
  const [snack, setSnack] = useState<React.ReactNode>(null);

  return (
    <Panel>
      <PanelHeader before={<Icon24ChevronLeft onClick={back}
        style={{ color: '#954B25', cursor: 'pointer' }} />}>
        Уровень 3
      </PanelHeader>

      <div className="game-container">
        {/* верхняя панель */}
        <div className="top-bar">
          <button className="icon-btn" style={{ background: `url(${pauseIcon})` }}
            onClick={() => openModal('pause')} />
          <div className="timer">{fmt(sec)}</div>
          <button className="icon-btn" style={{ background: `url(${hintIcon})` }}
            onClick={() => setSnack(<Snackbar before={<Icon16Cancel />}
              onClose={() => setSnack(null)}>
              Выкладывай компасы по возрастанию размера!
            </Snackbar>)} />
        </div>

        <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
          {/* тени — flex-ряд вдоль «дорожки» */}
          <div className="lvl3-placeholders-row">
            <div className='arrow-diagonally-up'></div>
            {initial.map(it => (
              <Placeholder key={it.id}
                id={it.id}
                size={it.size}
                filled={placed.includes(it.id)} />
            ))}
          </div>

          {/* предметы внизу */}
          <div className="lvl3-items-container">
            {items.map(it => <Draggable key={it.id} item={it} />)}
          </div>

          <DragOverlay>
            {dragId && (
              <img src={compass}
                style={{
                  width: initial.find(i => i.id === dragId)!.size,
                  height: 'auto'
                }}
                className="dragged-item" />
            )}
          </DragOverlay>
        </DndContext>
      </div>
      {snack}
    </Panel>
  );
};

/* ── sub-components ───────────────────────────── */
const Draggable: FC<{ item: DraggableItem }> = ({ item }) => {
  const { setNodeRef, attributes, listeners, transform, isDragging } =
    useDraggable({ id: item.id });
  const style: React.CSSProperties = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    width: item.size, height: item.size, opacity: isDragging ? 0 : 1, transition: 'opacity .15s',
  };
  return (
    <div ref={setNodeRef} className="dnd-item"
      style={style} {...attributes}{...listeners}>
      <img src={item.img} className="item-image" />
    </div>
  );
};

const Placeholder: FC<{ id: ItemId; size: number; filled: boolean }> = ({ id, size, filled }) => {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${id}` });
  return (
    <div ref={setNodeRef}
      id={`slot-${id}`}
      className={`placeholder-slot${filled ? ' filled' : ''}`}
      style={{
        width: size, height: size,
        filter: isOver ? 'drop-shadow(0 0 6px #f9d95b)' : 'none',
      }}>
      <img src={compassSil}
        className="lvl3-placeholder-img" />
    </div>
  );
};

export default Level3;
