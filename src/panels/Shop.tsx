// src\panels\Shop.tsx
import React, { FC, useState } from 'react';
import { Panel, PanelHeader, Snackbar, Div } from '@vkontakte/vkui';
import { Icon24ChevronLeft, Icon16Cancel } from '@vkontakte/icons';
import bridge from '@vkontakte/vk-bridge';

import './Shop.css';

import type { ModalId } from '../App';
import {
  OWNED_HATS_KEY,
  COINS_STORAGE_KEY,
} from '../App';

/* ── изображения ──────────────────────────────── */
import parrot        from '../assets/shop/parrotShop.svg';
import parrotOrange  from '../assets/shop/parrotInOrangeHat.svg';
import parrotRed     from '../assets/shop/parrotInRedHat.svg';
import parrotPurple  from '../assets/shop/parrotInPurpleHat.svg';

import hatOrange     from '../assets/shop/hatOrange.svg';
import hatRed        from '../assets/shop/hatRed.svg';
import hatPurple     from '../assets/shop/hatPurple.svg';

import coinIcon      from '../assets/coin.svg';

/* ── типы и константы ─────────────────────────── */
type HatId = 'orange' | 'red' | 'purple';

interface ShopProps {
  coins: number;
  setCoins: (n: number) => void;
  selectedHat: HatId | null;
  setSelectedHat: React.Dispatch<React.SetStateAction<HatId | null>>;
  ownedHats: HatId[];
  setOwnedHats: React.Dispatch<React.SetStateAction<HatId[]>>;
  openModal: (id: ModalId) => void;
}

const hats = [
  { id: 'orange', img: hatOrange, price: 20 },
  { id: 'red',    img: hatRed,    price: 30 },
  { id: 'purple', img: hatPurple, price: 40 },
] as const;

const parrotByHat: Record<HatId, string> = {
  orange: parrotOrange,
  red:    parrotRed,
  purple: parrotPurple,
};

/* ── компонент ────────────────────────────────── */
const Shop: FC<ShopProps> = ({
  coins,           setCoins,
  selectedHat,     setSelectedHat,
  ownedHats,       setOwnedHats,
  openModal,
}) => {

  const [snack, setSnack] = useState<React.ReactNode>(null);
  const openSettings = () => openModal('settings');

  /* покупка / надевание шляпы */
  const buy = (id: HatId, listPrice: number) => {
    if (selectedHat === id) return;              // уже надета

    const alreadyOwned = ownedHats.includes(id);
    const price        = alreadyOwned ? 0 : listPrice;

    if (coins < price) {
      setSnack(
        <Snackbar before={<Icon16Cancel/>} onClose={() => setSnack(null)}>
          Не хватает монет!
        </Snackbar>
      );
      return;
    }

    /* если покупаем впервые — списываем и добавляем в owned */
    let left = coins;
    if (!alreadyOwned) {
      left = coins - price;
      setCoins(left);

      const newOwned = [...ownedHats, id];
      setOwnedHats(newOwned);

      bridge.send('VKWebAppStorageSet', {
        key: OWNED_HATS_KEY, value: JSON.stringify(newOwned),
      });
      bridge.send('VKWebAppStorageSet', {
        key: COINS_STORAGE_KEY, value: String(left),
      });
    }

    /* надеваем шляпу */
    setSelectedHat(id);
    bridge.send('VKWebAppStorageSet', { key: 'hat', value: id });

    setSnack(
      <Snackbar before={<Icon16Cancel/>} onClose={() => setSnack(null)}>
        {alreadyOwned ? 'Шляпа выбрана!' : 'Покупка успешна!'}
      </Snackbar>
    );
  };

  const back = () => (window.location.hash = '/');

  return (
    <Panel>
      <PanelHeader
        before={
          <Icon24ChevronLeft
            onClick={back}
            style={{ color: '#954B25', cursor: 'pointer' }}
          />
        }
      >
        Магазин
      </PanelHeader>

      <div className="shop-container">
        {/* Верхние иконки */}
        <Div className="settings-coin-fixed">
          <button
            className="settings-btn-levels"
            onClick={openSettings}
            style={{ zIndex: 2 }}
          />
          <div className="coin-counter-levels">
            <span className="coin-count-levels">{coins}</span>
          </div>
        </Div>

        {/* Попугай */}
        <div className="parrot-wrapper">
          <img
            key={selectedHat ?? 'none'}
            src={selectedHat ? parrotByHat[selectedHat] : parrot}
            className="parrot-img"
            alt="parrot"
          />
        </div>

        {/* Полка со шляпами */}
        <div className="hats-scroll">
          {hats.map(h => (
            <div key={h.id} className="hat-cards">
              <div className="hat-card">
                <img src={h.img} className="hat-img" alt={h.id} />
              </div>

              <button
                className="buy-btn"
                disabled={selectedHat === h.id}
                onClick={() => buy(h.id, h.price)}
              >
                {selectedHat === h.id
                  ? 'Надето'
                  : ownedHats.includes(h.id)
                  ? 'Выбрать'
                  : (
                    <>
                      Купить&nbsp;{h.price}&nbsp;
                      <img src={coinIcon} className="btn-coin" />
                    </>
                  )}
              </button>
            </div>
          ))}
        </div>
      </div>
      {snack}
    </Panel>
  );
};

export default Shop;
