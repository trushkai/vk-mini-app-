/* Level 5 – сортируем по ЗЕЛЁНОЙ и РОЗОВОЙ корзинкам (аналог Level 2) */
import React, { FC, useState, useEffect } from 'react';
import {
  DndContext, useDroppable, useDraggable,
  DragStartEvent, DragEndEvent, DragOverlay,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Panel, PanelHeader, Snackbar } from '@vkontakte/vkui';
import { Icon24ChevronLeft, Icon16Cancel } from '@vkontakte/icons';

import type { GameWrapperProps } from '../../panels/Game';
import './level5.css';                         /* 🔹 стили уровня */

import pauseIcon from '../../assets/pause.svg';
import hintIcon  from '../../assets/hint.svg';

/* предметы (любые svg/png) */
import leaf         from '../../assets/items/leaf.svg';
import secretBottle from '../../assets/items/secretBottle.svg';
import greenCrystal from '../../assets/items/greenCrystal.png';
import pinkFlower   from '../../assets/items/pinkFlower.svg';
import pinkCrystal  from '../../assets/items/pinkCrystal.png';
import starfish     from '../../assets/items/starfish.svg';

/* корзины */
import greenBasket from '../../assets/baskets/green-basket.svg';
import pinkBasket  from '../../assets/baskets/pink-basket.svg';

/* ── типы ───────────────────────────── */
type ItemType = 'green' | 'pink';
interface DraggableItem {
  id : string;
  type: ItemType;
  img : string;
}

/* стартовый набор (пример – замените на свои) */
const initialItems: DraggableItem[] = [
  { id:'1', type:'pink' , img:starfish     },
  { id:'2', type:'green', img:leaf         },
  { id:'3', type:'green', img:secretBottle },
  { id:'4', type:'pink' , img:pinkCrystal  },
  { id:'5', type:'green' , img:greenCrystal },
  { id:'6', type:'pink', img:pinkFlower   },
  
];

/* ───────────────────────────────────── */
const Level5: FC<GameWrapperProps> = ({
  currentLevel, openModal, onLevelComplete, activeModal,
}) => {
  /* состояние */
  const [items,       setItems]       = useState(initialItems);
  const [greenPlaced, setGreenPlaced] = useState<DraggableItem[]>([]);
  const [pinkPlaced,  setPinkPlaced]  = useState<DraggableItem[]>([]);
  const [dragId,      setDragId]      = useState<string|null>(null);

  /* таймер */
  const [sec,setSec] = useState(0);
  const paused = [
    'pause','settings','confirmRestart','confirmMenu',
    'confirmReset','confirmRestartGame','victoryModal',
  ].includes(String(activeModal));

  useEffect(() => {
    let t:number|undefined;
    if(!paused) t = window.setInterval(()=>setSec(s=>s+1),1000);
    return ()=>{ if(t) clearInterval(t); };
  }, [paused]);

  const fmt = (s:number)=>
    `${String(s/60|0).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  /* dnd */
  const onDragStart = (e:DragStartEvent)=>setDragId(String(e.active.id));
  const onDragEnd   = (e:DragEndEvent)=>{
    const { active, over } = e;
    if(!over) { setDragId(null); return; }

    const item = items.find(it=>it.id===active.id);
    if(!item) { setDragId(null); return; }

    const correct = item.type === 'green' ? 'green-basket' : 'pink-basket';
    if(over.id === correct){
      if(item.type==='green') setGreenPlaced(p=>[...p,item]);
      else                    setPinkPlaced (p=>[...p,item]);
      setItems(list=>list.filter(it=>it.id!==item.id));
    }
    setDragId(null);
  };

  /* победа */
  useEffect(()=>{
    if(!items.length) onLevelComplete(currentLevel, sec);
  },[items]);

  /* UI helpers */
  const back  = () => (window.location.hash='/levels');
  const [snack,setSnack] = useState<React.ReactNode>(null);

  return (
    <Panel>
      <PanelHeader
        before={<Icon24ChevronLeft onClick={back}
               style={{color:'#954B25',cursor:'pointer'}}/>}>
        Уровень 5
      </PanelHeader>

      <div className="game-container">
        {/* ── шапка ───────────────────────────────── */}
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
                      Сортируй по цвету корзины — зелёная vs розовая!
                    </Snackbar>
                  )}/>
        </div>

        {/* ── игровая сцена ──────────────────────── */}
        <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
          {/* корзины */}
          <div className="baskets-row">
            <div className="green-basket">
              <Basket type="green" items={greenPlaced}/>
            </div>
            <div className="pink-basket">
              <Basket type="pink" items={pinkPlaced}/>
            </div>
          </div>

          {/* предметы */}
          <div className="items-container">
            {items.map(it => <Draggable key={it.id} item={it}/>)}
          </div>

          <DragOverlay>
            {dragId && (
              <img src={initialItems.find(i=>i.id===dragId)?.img}
                   className="dragged-item" />
            )}
          </DragOverlay>
        </DndContext>
      </div>
      {snack}
    </Panel>
  );
};

/* ── helpers ─────────────────────────── */
const Draggable:FC<{item:DraggableItem}> = ({ item })=>{
  const { setNodeRef, attributes, listeners, transform, isDragging } =
        useDraggable({ id:item.id });
  const style:React.CSSProperties={
    transform:transform?CSS.Translate.toString(transform):undefined, opacity: isDragging ? 0 : 1, transition: 'opacity .15s',
  };
  return(
    <div ref={setNodeRef}
         className="dnd-item"
         style={style}
         {...attributes}{...listeners}>
      <img src={item.img} className="item-image" />
    </div>
  );
};

const Basket:FC<{type:ItemType;items:DraggableItem[]}> = ({ type, items })=>{
  const { setNodeRef } = useDroppable({
    id: type==='green' ? 'green-basket' : 'pink-basket',
  });
  const img = type==='green' ? greenBasket : pinkBasket;
  return(
    <div ref={setNodeRef} className="basket">
      <img src={img} className="basket-img"/>
      <div className="items-in-basket">
        {items.map(it => (
          <img key={it.id} src={it.img} className="mini-item"/>
        ))}
      </div>
    </div>
  );
};

export default Level5;
