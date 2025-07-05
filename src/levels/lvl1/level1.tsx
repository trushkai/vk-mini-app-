/** 1-й уровень: dnd-kit + flex-верстка (аналогично Level 2) */
import React, { FC, useState, useEffect } from 'react';
import {
  DndContext, useDroppable, useDraggable,
  DragStartEvent, DragEndEvent, DragOverlay,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

import { Panel, PanelHeader, Snackbar } from '@vkontakte/vkui';
import { Icon24ChevronLeft, Icon16Cancel } from '@vkontakte/icons';

import type { GameWrapperProps } from '../../panels/Game';
import './level1.css';                       // 🔹 Стили уровня

/* ── ресурсы ─────────────────────────────────────────────── */
import pauseIcon from '../../assets/pause.svg';
import hintIcon  from '../../assets/hint.svg';

import shell      from '../../assets/items/shell.svg';
import bananas    from '../../assets/items/banana.svg';
import compass    from '../../assets/items/compass.svg';
import flag       from '../../assets/items/flag.svg';
import coins      from '../../assets/items/money.svg';


import bananasSil from '../../assets/placeholders/banana-sil.svg';
import flagSil    from '../../assets/placeholders/flag-sil.svg';
import shellSil   from '../../assets/placeholders/shell-sil.svg';
import coinsSil   from '../../assets/placeholders/money-sil.svg';
import compassSil from '../../assets/placeholders/compass-sil.svg';

/* ── типы и стартовое состояние ─────────────────────────── */
type ItemId = 'shell'|'bananas'|'compass'|'flag'|'coins';
interface DraggableItem { id: ItemId; img: string; ph: string }

/* порядок: от маленького к большому — как на макете */
const initial: DraggableItem[] = [
  { id:'compass', img:compass, ph:compassSil },
  { id:'bananas', img:bananas, ph:bananasSil },
  { id:'coins',   img:coins,   ph:coinsSil   },
  { id:'flag',    img:flag,    ph:flagSil    },
  { id:'shell',   img:shell,   ph:shellSil   },
];

/* ── компонент уровня ───────────────────────────────────── */
const Level1: FC<GameWrapperProps> = ({
  currentLevel, openModal, onLevelComplete, activeModal,
}) => {

  /* состояние dnd */
  const bottomOrder: ItemId[] = ['flag', 'shell', 'compass', 'coins', "bananas"];
  const [items, setItems] = useState(() =>
      bottomOrder.map(id => initial.find(it => it.id === id)!)
    );       // ещё не уложенные
  const [placed, setPlaced] = useState<ItemId[]>([]);  // уже уложенные
  const [dragId, setDragId] = useState<ItemId|null>(null);

  /* таймер */
  const [sec,setSec] = useState(0);
  const paused = ['pause','settings','confirmRestart','confirmMenu',
                  'confirmReset','confirmRestartGame','victoryModal']
                  .includes(String(activeModal));
  useEffect(()=>{
    let id:number|undefined;
    if(!paused) id = window.setInterval(()=>setSec(s=>s+1),1000);
    return()=>{ if(id) clearInterval(id); };
  },[paused]);
  const fmt = (s:number)=>`${String(s/60|0).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  /* dnd-обработчики */
  const onDragStart = (e:DragStartEvent)=>setDragId(e.active.id as ItemId);
  const onDragEnd   = (e:DragEndEvent)=>{
    const { active, over } = e;
    setDragId(null);
    if(!over) return;
    const id = active.id as ItemId;
    if(over.id === `slot-${id}`){
      /* фиксируем предмет */
      setPlaced(p=>[...p,id]);
      setItems(list=>list.filter(it=>it.id!==id));
      /* прячем силуэт */
      document.getElementById(`slot-${id}`)
              ?.classList.add('filled');
    }
  };

  /* победа */
  useEffect(()=>{
    if(placed.length === initial.length){
      onLevelComplete(currentLevel, sec);
    }
  },[placed]);

  /* helpers */
  const back  = ()=>{ window.location.hash='/levels'; };
  const [snack,setSnack] = useState<React.ReactNode>(null);

  return (
    <Panel>
      <PanelHeader before={<Icon24ChevronLeft onClick={back}
                   style={{color:'#954B25',cursor:'pointer'}}/>}>
        Уровень 1
      </PanelHeader>

      <div className="game-container">
        {/* верхняя панель */}
        <div className="top-bar">
          <button className="icon-btn"
                  style={{background:`url(${pauseIcon})`}}
                  onClick={()=>openModal('pause')}/>
          <div className="timer">{fmt(sec)}</div>
          <button className="icon-btn"
                  style={{background:`url(${hintIcon})`}}
                  onClick={()=>setSnack(
                    <Snackbar before={<Icon16Cancel/>}
                              onClose={()=>setSnack(null)}>
                      Сортируй предметы по форме!
                    </Snackbar>
                  )}/>
        </div>

        <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
          {/* тени — flex-ряд */}
          <div className="lvl1-placeholders-row">
            {initial.map(it=>(
              <PlaceholderSlot key={it.id}
                               id={it.id}
                               ph={it.ph}
                               filled={placed.includes(it.id)} />
            ))}
          </div>

          {/* исходные предметы внизу */}
          <div className="lvl1-items-container">
            {items.map(it=> <Draggable key={it.id} item={it}/> )}
          </div>

          {/* «прилипшая» картинка под пальцем */}
          <DragOverlay>
            {dragId && (
              <img src={initial.find(i=>i.id===dragId)?.img}
                   className="dragged-item" />
            )}
          </DragOverlay>
        </DndContext>
      </div>
      {snack}
    </Panel>
  );
};

/* ── вспомогательные под-компоненты ─────────────────────── */
const Draggable:FC<{item:DraggableItem}> = ({ item })=>{
  const { setNodeRef, attributes, listeners, transform, isDragging } =
        useDraggable({ id:item.id });
  const style:React.CSSProperties = {
    transform: transform?CSS.Translate.toString(transform):undefined, opacity: isDragging ? 0 : 1, transition: 'opacity .15s',
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

const PlaceholderSlot:FC<{id:ItemId;ph:string;filled:boolean}> = ({ id, ph, filled })=>{
  const { setNodeRef, isOver } =
        useDroppable({ id:`slot-${id}` });
  return (
    <div ref={setNodeRef}
         id={`slot-${id}`}
         className={`placeholder-slot${filled ? ' filled':''}`}
         style={{filter:isOver?'drop-shadow(0 0 6px #f9d95b)':'none'}}>
      <img src={ph} className="placeholder-img" />
    </div>
  );
};

export default Level1;
