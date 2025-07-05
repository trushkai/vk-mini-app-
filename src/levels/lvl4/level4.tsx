/* 4-й уровень – flex + dnd-kit (как Level 1) */
import React, { FC, useState, useEffect } from 'react';
import {
  DndContext, useDroppable, useDraggable,
  DragStartEvent, DragEndEvent, DragOverlay,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

import { Panel, PanelHeader, Snackbar } from '@vkontakte/vkui';
import { Icon24ChevronLeft, Icon16Cancel } from '@vkontakte/icons';

import type { GameWrapperProps } from '../../panels/Game';
import './level4.css';

/* ── иконки/ресурсы ─────────────────────────── */
import pauseIcon from '../../assets/pause.svg';
import hintIcon  from '../../assets/hint.svg';

import map        from '../../assets/items/map.svg';
import whiteFlower from '../../assets/items/whiteFlower.svg';
import potion     from '../../assets/items/potion.svg';
import shell      from '../../assets/items/shell.svg';
import coins      from '../../assets/items/money.svg';
import leaf       from '../../assets/items/leaf.svg';

import mapSil        from '../../assets/placeholders/map-sil.svg';
import whiteFlowerSil from '../../assets/placeholders/whiteFlower-sil.svg';
import potionSil     from '../../assets/placeholders/potion-sil.svg';
import shellSil      from '../../assets/placeholders/shell-sil.svg';
import coinsSil      from '../../assets/placeholders/money-sil.svg';
import leafSil       from '../../assets/placeholders/leaf-sil.svg';

/* ── данные ─────────────────────────────────── */
type ItemId =
  | 'potion'
  | 'whiteFlower'
  | 'coins'
  | 'shell'
  | 'map'
  | 'leaf';

interface DraggableItem {
  id : ItemId;
  img: string;
  ph : string;
}

/* тени   – слева → направо от маленького к большому      */
export const placeholders: DraggableItem[] = [
  { id:'potion',      img:potion,      ph:potionSil      },
  { id:'whiteFlower', img:whiteFlower, ph:whiteFlowerSil },
  { id:'coins',       img:coins,       ph:coinsSil       },
  { id:'shell',       img:shell,       ph:shellSil       },
  { id:'map',         img:map,         ph:mapSil         },
  { id:'leaf',        img:leaf,        ph:leafSil        },
];

/* предметы внизу – в «хаотичном» порядке, отличном от теней */
const bottomOrder: ItemId[] = [
  'whiteFlower', 'leaf', 'shell', 'map', 'coins', 'potion'
];

/* ── компонент ──────────────────────────────── */
const Level4: FC<GameWrapperProps> = ({
  currentLevel, openModal, onLevelComplete, activeModal,
}) => {
  /* состояние dnd */
  const [items, setItems]   = useState<DraggableItem[]>(
    bottomOrder.map(id => placeholders.find(p => p.id === id)!)
  );
  const [placed, setPlaced] = useState<ItemId[]>([]);
  const [dragId, setDragId] = useState<ItemId | null>(null);

  /* таймер */
  const [sec, setSec] = useState(0);
  const modalOpen = [
    'pause','settings','confirmRestart','confirmMenu',
    'confirmReset','confirmRestartGame','victoryModal',
  ].includes(String(activeModal));

  useEffect(() => {
    let t: number | undefined;
    if (!modalOpen) t = window.setInterval(() => setSec(s => s + 1), 1000);
    return () => { if (t) clearInterval(t); };
  }, [modalOpen]);

  const fmt = (s:number) =>
    `${String(s/60|0).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  /* dnd */
  const onDragStart = (e: DragStartEvent) =>
    setDragId(e.active.id as ItemId);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setDragId(null);
    if (!over) return;
    const id = active.id as ItemId;
    if (over.id === `slot-${id}`) {
      setPlaced(p => [...p, id]);
      setItems(list => list.filter(it => it.id !== id));
    }
  };

  /* победа */
  useEffect(() => {
    if (placed.length === placeholders.length)
      onLevelComplete(currentLevel, sec);
  }, [placed]);

  /* helper UI */
  const back  = () => (window.location.hash = '/levels');
  const [snack, setSnack] = useState<React.ReactNode>(null);

  return (
    <Panel>
      <PanelHeader
        before={<Icon24ChevronLeft onClick={back}
               style={{ color:'#954B25', cursor:'pointer' }} />}
      >
        Уровень 4
      </PanelHeader>

      <div className="game-container">
        {/* ── top bar ───────────────────────── */}
        <div className="top-bar">
          <button className="icon-btn"
                  style={{ background:`url(${pauseIcon})` }}
                  onClick={() => openModal('pause')} />
          <div className="timer">{fmt(sec)}</div>
          <button className="icon-btn"
                  style={{ background:`url(${hintIcon})` }}
                  onClick={() => setSnack(
                    <Snackbar before={<Icon16Cancel />}
                              onClose={() => setSnack(null)}>
                      Разложи предметы по силуэтам!
                    </Snackbar>
                  )}/>
        </div>

        {/* ── dnd-контекст ─────────────────── */}
        <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
          {/* тени */}
          <div className="lvl4-placeholders-row">
            {placeholders.map(p => (
              <PlaceholderSlot key={p.id}
                               id={p.id}
                               ph={p.ph}
                               filled={placed.includes(p.id)} />
            ))}
          </div>

          {/* предметы */}
          <div className="lvl4-items-container">
            {items.map(it => <Draggable key={it.id} item={it} />)}
          </div>

          <DragOverlay>
            {dragId && (
              <img src={placeholders.find(p => p.id === dragId)!.img}
                   className="dragged-item" />
            )}
          </DragOverlay>
        </DndContext>
      </div>
      {snack}
    </Panel>
  );
};

/* ── helpers ──────────────────────────────── */
const Draggable: FC<{ item: DraggableItem }> = ({ item }) => {
  const { setNodeRef, attributes, listeners, transform, isDragging } =
        useDraggable({ id: item.id });
  const style: React.CSSProperties = {
    transform: transform ? CSS.Translate.toString(transform) : undefined, opacity: isDragging ? 0 : 1, transition: 'opacity .15s',
  };
  return (
    <div ref={setNodeRef}
         className="dnd-item"
         style={style}
         {...attributes}{...listeners}>
      <img src={item.img} className="item-image" />
    </div>
  );
};

const PlaceholderSlot: FC<{ id: ItemId; ph: string; filled: boolean }> = ({
  id, ph, filled,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id:`slot-${id}` });
  return (
    <div ref={setNodeRef}
         id={`slot-${id}`}
         className={`lvl4-placeholder-slot${filled ? ' filled' : ''}`}
         style={{ filter: isOver ? 'drop-shadow(0 0 6px #f9d95b)' : 'none' }}>
      <img src={ph} className="placeholder-img" />
    </div>
  );
};

export default Level4;
