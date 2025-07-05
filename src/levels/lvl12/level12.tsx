import React, { FC, useState, useEffect } from 'react';
import {
  DndContext, useDraggable, useDroppable,
  DragStartEvent, DragEndEvent, DragOverlay,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Panel, PanelHeader, Snackbar } from '@vkontakte/vkui';
import { Icon24ChevronLeft, Icon16Cancel } from '@vkontakte/icons';

import type { GameWrapperProps } from '../../panels/Game';
import './level12.css';

/* ── ресурсы ─────────────────────────────────────────────── */
import pauseIcon      from '../../assets/pause.svg';
import hintIcon       from '../../assets/hint.svg';

import coconut        from '../../assets/items/coconut.svg';
import blueCrystal    from '../../assets/items/blueCrystal.png';
import telescope      from '../../assets/items/telescope.svg';
import pirateHat      from '../../assets/items/pirate-hat.svg';
import steeringWheel  from '../../assets/items/steeringWheel.svg';
import starfish       from '../../assets/items/starfish.svg';
import chest          from '../../assets/items/chest.svg';
import secretBottle   from '../../assets/items/secretBottle.svg';

import coconutSil        from '../../assets/placeholders/coconut-sil.svg';
import blueCrystalSil    from '../../assets/placeholders/blueCrystal-sil.svg';
import telescopeSil      from '../../assets/placeholders/telescope-sil.svg';
import pirateHatSil      from '../../assets/placeholders/pirateHat-sil.svg';
import steeringWheelSil  from '../../assets/placeholders/steeringWheel-sil.svg';
import starfishSil       from '../../assets/placeholders/starfish-sil.svg';
import chestSil          from '../../assets/placeholders/chest-sil.svg';
import secretBottleSil   from '../../assets/placeholders/secretBottle-sil.svg';

/* ── типы ────────────────────────────────────────────────── */
type ItemId =
  | 'coconut' | 'blueCrystal' | 'telescope' | 'pirateHat'
  | 'steeringWheel' | 'starfish' | 'chest' | 'secretBottle';

interface DraggableItem { id: ItemId; img: string; ph: string }

/* порядок СИЛУЭТОВ: слева-направо (от маленького к большому) */
const initial: DraggableItem[] = [
  { id:'coconut',       img:coconut,       ph:coconutSil },
  { id:'blueCrystal',   img:blueCrystal,   ph:blueCrystalSil },
  { id:'telescope',     img:telescope,     ph:telescopeSil },
  { id:'pirateHat',     img:pirateHat,     ph:pirateHatSil },
  { id:'steeringWheel', img:steeringWheel, ph:steeringWheelSil },
  { id:'starfish',      img:starfish,      ph:starfishSil },
  { id:'chest',         img:chest,         ph:chestSil },
  { id:'secretBottle',  img:secretBottle,  ph:secretBottleSil },
];

/* порядок ПРЕДМЕТОВ внизу – «хаотичный» */
const bottomOrder: ItemId[] = [
  'starfish','coconut','telescope','chest',
  'blueCrystal','pirateHat','secretBottle','steeringWheel',
];

/* ── компонент ──────────────────────────────────────────── */
const Level12: FC<GameWrapperProps> = ({
  currentLevel, openModal, onLevelComplete, activeModal,
}) => {
  const [items,  setItems ] = useState(
    bottomOrder.map(id => initial.find(it => it.id === id)!)
  );
  const [placed, setPlaced] = useState<ItemId[]>([]);
  const [dragId, setDragId] = useState<ItemId | null>(null);

  /* таймер */
  const [sec, setSec] = useState(0);
  const paused = [
    'pause','settings','confirmRestart','confirmMenu',
    'confirmReset','confirmRestartGame','victoryModal',
  ].includes(String(activeModal));

  useEffect(() => {
    let t: number | undefined;
    if (!paused) t = window.setInterval(() => setSec(s => s + 1), 1000);
    return () => { if (t) clearInterval(t); };
  }, [paused]);

  const fmt = (s: number) =>
    `${String((s / 60) | 0).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

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
      document.querySelector(`#slot-${id}`)?.classList.add('filled');
    }
  };

  /* победа */
  useEffect(() => {
    if (placed.length === initial.length)
      onLevelComplete(currentLevel, sec);
  }, [placed]);

  /* helpers */
  const back  = () => { window.location.hash = '/levels'; };
  const [snack, setSnack] = useState<React.ReactNode>(null);

  /* ── UI ── */
  return (
    <Panel>
      <PanelHeader before={<Icon24ChevronLeft onClick={back}
                          style={{ color:'#954B25', cursor:'pointer' }}/>}>
        Уровень 12
      </PanelHeader>

      <div className="game-container">
        {/* верхняя панель */}
        <div className="top-bar">
          <button className="icon-btn"
                  style={{ background:`url(${pauseIcon})` }}
                  onClick={() => openModal('pause')}/>
          <div className="timer">{fmt(sec)}</div>
          <button className="icon-btn"
                  style={{ background:`url(${hintIcon})` }}
                  onClick={() => setSnack(
                    <Snackbar before={<Icon16Cancel/>}
                              onClose={() => setSnack(null)}>
                      Сортируй предметы по форме!
                    </Snackbar>
                  )}/>
        </div>

        <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
          {/* СИЛУЭТЫ */}
          <div className="lvl7-placeholders-row">
            {initial.map(it => (
              <PlaceholderSlot key={it.id}
                               id={it.id}
                               ph={it.ph}
                               filled={placed.includes(it.id)}/>
            ))}
          </div>

          {/* ПРЕДМЕТЫ */}
          <div className="lvl7-items-container">
            {items.map(it => <Draggable key={it.id} item={it}/> )}
          </div>

          {/* «прилипший» элемент */}
          <DragOverlay>
            {dragId && (
              <img src={initial.find(i => i.id === dragId)!.img}
                   className="dragged-item"/>
            )}
          </DragOverlay>
        </DndContext>
      </div>
      {snack}
    </Panel>
  );
};

/* ── sub-components ─────────────────────────────────────── */
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
         {...attributes} {...listeners}>
      <img src={item.img} className="item-image"/>
    </div>
  );
};

const PlaceholderSlot: FC<{ id: ItemId; ph: string; filled: boolean }> = ({
  id, ph, filled,
}) => {
  const { setNodeRef, isOver } =
        useDroppable({ id: `slot-${id}` });
  return (
    <div ref={setNodeRef}
         id={`slot-${id}`}
         className={`lvl7-placeholder-slot${filled ? ' filled' : ''}`}
         style={{ filter: isOver ? 'drop-shadow(0 0 6px #f9d95b)' : 'none' }}>
      <img src={ph} className="placeholder-img"/>
    </div>
  );
};

export default Level12;
