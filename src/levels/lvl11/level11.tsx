/**
 * Level 11 — раскладываем телескопы по возрастанию длины
 * сделано «под копирку» с Level 3
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
import './level11.css';

/* ─ ресурсы ─ */
import pauseIcon from '../../assets/pause.svg';
import hintIcon from '../../assets/hint.svg';

import telescope from '../../assets/items/telescope.svg';
import telescopeSil from '../../assets/placeholders/center-telescope-sil.svg';

/* ─ типы ─ */
type ItemId = 't1' | 't2' | 't3' | 't4';
interface DraggableItem { id: ItemId; img: string; size: number }

const initial: DraggableItem[] = [
  { id: 't1', img: telescope, size: 80 },   // было 80
  { id: 't2', img: telescope, size: 110 },   // было 100
  { id: 't3', img: telescope, size: 130 },   // было 120
  { id: 't4', img: telescope, size: 150 },   // было 140
];


const Level11: FC<GameWrapperProps> = ({
  currentLevel, openModal, onLevelComplete, activeModal,
}) => {
  /* «хаотичный» порядок появления снизу */
  const bottomOrder: ItemId[] = ['t3', 't2', 't4', 't1'];

  const [items, setItems] = useState(() =>
    bottomOrder.map(id => initial.find(it => it.id === id)!)
  );
  const [placed, setPlaced] = useState<ItemId[]>([]);
  const [dragId, setDragId] = useState<ItemId | null>(null);

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
  const fmt = (s: number) =>
    `${String(s / 60 | 0).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  /* DnD */
  const onDragStart = (e: DragStartEvent) =>
    setDragId(e.active.id as ItemId);

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
        Уровень 11
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
                Разложи телескопы от короткого к длинному!
              </Snackbar>)} />
        </div>

        <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
          {/* тени  */}
          <div className="lvl11-placeholders-row">
            <div className="arrow-left-up" />
            {[...initial].map(it => (
              <Placeholder key={it.id}
                id={it.id}
                size={it.size}
                filled={placed.includes(it.id)} />
            ))}
          </div>

          {/* предметы внизу */}
          <div className="lvl11-items-container">
            {items.map(it => <Draggable key={it.id} item={it} />)}
          </div>

          <DragOverlay>
            {dragId && (
              <img src={telescope}
                style={{ width: initial.find(i => i.id === dragId)!.size }}
                className="dragged-item" />
            )}
          </DragOverlay>
        </DndContext>
      </div>
      {snack}
    </Panel>
  );
};

/* ─ sub-components ─ */
const Draggable: FC<{ item: DraggableItem }> = ({ item }) => {
  const {
    setNodeRef, attributes, listeners, transform,
    isDragging,
  } = useDraggable({ id: item.id });

  const style: React.CSSProperties = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    width: item.size,
    height: item.size,
    opacity: isDragging ? 0 : 1,
    transition: 'opacity .15s',
  };
  return (
    <div ref={setNodeRef} className="lvl11-dnd-item"
      style={style} {...attributes} {...listeners}>
      <img src={item.img} className="item-image" />
    </div>
  );
};

const Placeholder: FC<{ id: ItemId; size: number; filled: boolean }> = ({ id, size, filled }) => {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${id}` });
  return (
    <div ref={setNodeRef}
      id={`slot-${id}`}
      className={`lvl11-placeholder-slot${filled ? ' filled' : ''}`}
      style={{
        width: size, height: 30,
        filter: isOver ? 'drop-shadow(0 0 6px #f9d95b)' : 'none',
      }}>
      <img src={telescopeSil} className="lvl11-placeholder-img" />
    </div>
  );
};

export default Level11;
