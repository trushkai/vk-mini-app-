import React, { FC, useState, useEffect } from 'react';
import {
  DndContext, useDroppable, useDraggable,
  DragStartEvent, DragEndEvent, DragOverlay,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Panel, PanelHeader, Snackbar } from '@vkontakte/vkui';
import { Icon24ChevronLeft, Icon16Cancel } from '@vkontakte/icons';

import type { GameWrapperProps } from '../../panels/Game';
import './level9.css';

import pauseIcon from '../../assets/pause.svg';
import hintIcon from '../../assets/hint.svg';

import bottle from '../../assets/items/secretBottle.svg';
import bottleSil from '../../assets/placeholders/center-secretBottle-sil.svg';

/* —— типы —— */
type ItemId = 'c1' | 'c2' | 'c3' | 'c4' | 'c5';
interface DraggableItem { id: ItemId; img: string; size: number }

/* макетные размеры + порядок снизу */
const BASE = [70, 85, 100, 115, 130];
const bottomOrder: ItemId[] = ['c3', 'c2', 'c4', 'c1', 'c5'];

/* динамически высчитываем размеры: от 60 до 130 px */
function makeInitial(): DraggableItem[] {
  const MIN = 54;
  const GAP = Math.max(2, window.innerWidth * 0.01);   // 1 % (2-8 px)
  const free = window.innerWidth - 32 /*padding*/ - GAP * 4 /*4 промежутка*/;
  const sum = BASE.reduce((a, b) => a + b);
  const k = Math.min(1, free / sum);
  const ids: ItemId[] = ['c1', 'c2', 'c3', 'c4', 'c5'];
  return ids.map((id, i) => {
    const size = Math.round(Math.max(MIN, BASE[i] * k));
    return { id, img: bottle, size };
  });
}

const Level9: FC<GameWrapperProps> = ({
  currentLevel, openModal, onLevelComplete, activeModal,
}) => {
  const [initial] = useState(makeInitial);
  const [items, setItems] = useState(
    () => bottomOrder.map(id => initial.find(it => it.id === id)!)
  );
  const [placed, setPlaced] = useState<ItemId[]>([]);
  const [dragId, setDragId] = useState<ItemId | null>(null);

  /* —— таймер —— */
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

  /* —— DnD —— */
  const onDragStart = (e: DragStartEvent) => setDragId(e.active.id as ItemId);
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e; setDragId(null);
    if (!over) return;
    const id = active.id as ItemId;
    if (over.id === `slot-${id}`) {
      setPlaced(p => [...p, id]);
      setItems(list => list.filter(it => it.id !== id));
      document.getElementById(`slot-${id}`)?.classList.add('filled');
    }
  };

  /* —— победа —— */
  useEffect(() => {
    if (placed.length === initial.length)
      onLevelComplete(currentLevel, sec);
  }, [placed]);

  /* —— UI —— */
  const back = () => window.location.hash = '/levels';
  const [snack, setSnack] = useState<React.ReactNode>(null);

  return (
    <Panel>
      <PanelHeader before={<Icon24ChevronLeft onClick={back}
        style={{ color: '#954B25', cursor: 'pointer' }} />}>
        Уровень 9
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
                Расставь бутылки от маленькой к большой
              </Snackbar>)} />
        </div>

        <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="lvl3-placeholders-row">
            <div className="arrow-diagonally-up" />
            {initial.map(it => (
              <Placeholder key={it.id}
                id={it.id}
                size={it.size}
                filled={placed.includes(it.id)} />
            ))}
          </div>

          <div className="lvl3-items-container">
            {items.map(it => <Draggable key={it.id} item={it} />)}
          </div>

          <DragOverlay>
            {dragId && (
              <img src={bottle}
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

/* ——— sub-components ——— */
const Draggable: FC<{ item: DraggableItem }> = ({ item }) => {
  const { setNodeRef, attributes, listeners, transform, isDragging } = useDraggable({ id: item.id });
  const style: React.CSSProperties = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    width: item.size, height: item.size, flex: `0 0 ${item.size}px`, opacity: isDragging ? 0 : 1, transition: 'opacity .15s',
  };
  return (
    <div ref={setNodeRef} className="dnd-item" style={style}
      {...attributes}{...listeners}>
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
        width: size, height: size, flex: `0 0 ${size}px`,
        filter: isOver ? 'drop-shadow(0 0 10px #ffe37f)' : 'none',
      }}>
      <img src={bottleSil} className="lvl3-placeholder-img" />
    </div>
  );
};

export default Level9;
