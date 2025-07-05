//src\App.tsx
import { useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import bridge from '@vkontakte/vk-bridge';
import {
  View, Panel, SplitLayout, SplitCol, ScreenSpinner,
} from '@vkontakte/vkui';
import { useActiveVkuiLocation } from '@vkontakte/vk-mini-apps-router';
import './App.css';

import { DEFAULT_VIEW_PANELS } from './routes';
import { ACHIEVEMENTS, AchievementId } from './achievements/data';

/* панели */
import MainMenu from './panels/MainMenu';
import Loading from './panels/Loading';
import Levels from './panels/Levels';
import Game from './panels/Game';
import Plot from './panels/Plot';
import Achievements from './panels/Achievements';
import Shop from './panels/Shop';

/* ассеты модалок */
import coinVictory from '/src/assets/coin.svg';
import againVictory from '/src/assets/again.svg';
import startVictory from '/src/assets/start.svg';
import shareVictory from '/src/assets/share.svg';
import mapVictory from './assets/plotVictory/mapVictory.svg';
import keyVictory from './assets/plotVictory/keyVictory.svg';
import chestVictory from './assets/plotVictory/chestVictory.svg';

/* ——— Storage-ключи ——— */
export const COINS_STORAGE_KEY = 'coins';
export const PROGRESS_STORAGE_KEY = 'progress';
export const COMPLETED_LEVELS_KEY = 'completed_levels';
export const OWNED_HATS_KEY = 'owned_hats';
export const ACH_PROGRESS_KEY = 'ach_progress';
export const ACH_REWARD_KEY = 'ach_rewarded';

export type ModalId =
  | 'story' | 'pause' | 'settings'
  | 'confirmRestart' | 'confirmMenu' | 'confirmReset'
  | 'victoryModal' | 'confirmRestartGame'
  | null;

export const App = () => {
  /* текущее положение в роутере */
  const { panel: activePanel = DEFAULT_VIEW_PANELS.MAIN } = useActiveVkuiLocation();

  /* ── состояния ─────────────────────────────── */
  const [popout, setPopout] = useState<ReactNode>(<ScreenSpinner size="large" />);
  const [coins, setCoins] = useState(0);

  const [currentLevel, setCurrentLevel] = useState(1);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [bestTimes, setBestTimes] = useState<Record<number, number>>({});

  const [activeModal, setActiveModal] = useState<ModalId>(null);
  const [restartKey, setRestartKey] = useState(0);

  const [lastAwarded, setLastAwarded] = useState<boolean>(false);
  const [celebration, setCelebration] = useState<string | null>(null);

  const [selectedHat, setSelectedHat] = useState<'orange' | 'red' | 'purple' | null>(null);
  const [ownedHats, setOwnedHats] = useState<('orange' | 'red' | 'purple')[]>([]);

  const [achProgress, setAchProgress] = useState<Record<AchievementId, number>>({} as Record<AchievementId, number>);
  const [achRewarded, setAchRewarded] = useState<AchievementId[]>([]);
  const [newAch, setNewAch] = useState<AchievementId | null>(null);

  const returnToPause = useRef(false);

  // ───── 1. константа «пустой прогресс» ─────
  const EMPTY_PROGRESS: Record<AchievementId, number> = {
    lvl5: 0, lvl10: 0, lvl12: 0,
    '5sec': 0,
    hat1: 0, hatAll: 0,
  };

  /* ── инициализация ─────────────────────────── */
  useEffect(() => {
    (async () => {
      bridge.send('VKWebAppInit');
      const { keys } = await bridge.send('VKWebAppStorageGet', {
        keys: [
          COINS_STORAGE_KEY, PROGRESS_STORAGE_KEY, COMPLETED_LEVELS_KEY,
          'hat', OWNED_HATS_KEY, ACH_PROGRESS_KEY, ACH_REWARD_KEY
        ],
      });
      keys.forEach(({ key, value }) => {
        if (key === COINS_STORAGE_KEY) setCoins(Number(value || 0));
        if (key === PROGRESS_STORAGE_KEY) setUnlockedLevel(Math.max(1, Number(value || 1)));
        if (key === 'hat') { setSelectedHat(value ? (value as any) : null); }
        if (key === OWNED_HATS_KEY && value) setOwnedHats(JSON.parse(value));
        if (key === ACH_PROGRESS_KEY) {
          const raw = value ? JSON.parse(value) : {};
          setAchProgress({ ...EMPTY_PROGRESS, ...raw });
        }
        if (key === ACH_REWARD_KEY && value) setAchRewarded(JSON.parse(value));
      });

      const completedRaw = keys.find(k => k.key === COMPLETED_LEVELS_KEY)?.value;
      if (completedRaw) setCompletedLevels(JSON.parse(completedRaw));

      /* короткая задержка для плавности */
      await new Promise(r => setTimeout(r, 300));
      setPopout(null);
    })();
  }, []);

  /* ── показываем сюжет при первом входе ─────── */
  useEffect(() => {
    if (!localStorage.getItem('firstVisit')) {
      setActiveModal('story');
      localStorage.setItem('firstVisit', 'true');
    }
  }, []);

  /* ── helpers ───────────────────────────────── */
  const openModal = (m: ModalId) => setActiveModal(m);
  const closeModal = () => setActiveModal(null);
  const hasNewAch = ACHIEVEMENTS.some(
    a => (achProgress[a.id] ?? 0) >= a.goal && !achRewarded.includes(a.id)
  );

  /* ——— CHECK ACHIEVEMENTS ——— */
  const checkAchievements = (level: number, timeSec: number, first: boolean) => {
    const prog: Record<AchievementId, number> = { ...achProgress };

    /* общее число пройденных уровней */
    const total = first ? completedLevels.length + 1 : completedLevels.length;
    prog.lvl5 = Math.min(5, total);
    prog.lvl10 = Math.min(10, total);
    prog.lvl12 = Math.min(12, total);

    /* время */
    if (timeSec <= 5) prog['5sec'] = 1;

    setAchProgress(prog);
    bridge.send('VKWebAppStorageSet', { key: ACH_PROGRESS_KEY, value: JSON.stringify(prog) });

    /* ищем только одно новое достижение за раз */
    const fresh = ACHIEVEMENTS.find(a =>
      (prog[a.id] ?? 0) >= a.goal && !achRewarded.includes(a.id)
    );
    if (fresh) setNewAch(fresh.id);
  };

  /* отмечаем покупки шляп --------------------------------------------*/
  useEffect(() => {
    if (ownedHats.length === 0) return;

    const upd: Record<AchievementId, number> = { ...achProgress };
    if (ownedHats.length >= 1) upd.hat1 = 1;
    if (ownedHats.length === 3) upd.hatAll = 3;

    /* если ничего нового — выходим */
    if (JSON.stringify(upd) === JSON.stringify(achProgress)) return;

    setAchProgress(upd);
    bridge.send('VKWebAppStorageSet', { key: ACH_PROGRESS_KEY, value: JSON.stringify(upd) });

    const fresh = ACHIEVEMENTS.find(a => (upd[a.id] ?? 0) >= a.goal && !achRewarded.includes(a.id));
    if (fresh) setNewAch(fresh.id);
  }, [ownedHats]);

  /* ——— забрать награду ——— */
  const claimAch = (id: AchievementId) => {
    const a = ACHIEVEMENTS.find(x => x.id === id)!;

    const newCoins = coins + a.reward;
    setCoins(newCoins);
    bridge.send('VKWebAppStorageSet', { key: COINS_STORAGE_KEY, value: String(newCoins) });

    const rew = [...achRewarded, id];
    setAchRewarded(rew);
    bridge.send('VKWebAppStorageSet', { key: ACH_REWARD_KEY, value: JSON.stringify(rew) });

    setNewAch(null);
  };

  const resetAll = async () => {
    /* монеты и прогресс */
    setCoins(0);
    setUnlockedLevel(1);
    setCurrentLevel(1);

    /* обнуляем «пройденные» и лучшие времена */
    setCompletedLevels([]);
    setBestTimes({});

    /* сбрасываем купленную шляпу */
    setSelectedHat(null);

    /* стираем маркер «первый вход» – покажем сюжет ровно один раз после сброса */
    localStorage.removeItem('firstVisit');

    await Promise.all([
      bridge.send('VKWebAppStorageSet', { key: COINS_STORAGE_KEY, value: '0' }),
      bridge.send('VKWebAppStorageSet', { key: PROGRESS_STORAGE_KEY, value: '1' }),
      bridge.send('VKWebAppStorageSet', { key: COMPLETED_LEVELS_KEY, value: '[]' }),
      bridge.send('VKWebAppStorageSet', { key: OWNED_HATS_KEY, value: '[]' }),
      bridge.send('VKWebAppStorageSet', { key: 'hat', value: '' }),
      bridge.send('VKWebAppStorageSet', {
        key: ACH_PROGRESS_KEY,
        value: JSON.stringify(EMPTY_PROGRESS)
      }),
      bridge.send('VKWebAppStorageSet', { key: ACH_REWARD_KEY, value: '[]' }),
    ]);
    setOwnedHats([]);
    setAchProgress(EMPTY_PROGRESS);
    setAchRewarded([]);
    window.location.hash = '/';
  };

  /* если вернулись из настроек -> пауза */
  useEffect(() => {
    const h = () => {
      if (window.location.hash === '#game' && returnToPause.current) {
        openModal('pause'); returnToPause.current = false;
      }
    };
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);

  const finishLevel = useCallback(
    (level: number, timeSec: number) => {

      /* === 0. определяем, первое ли это прохождение === */
      const firstTime = !completedLevels.includes(level);
      /* 1. монеты – только при первом прохождении */
      if (firstTime) {
        const newCoins = coins + 20;
        setCoins(newCoins);
        bridge.send('VKWebAppStorageSet', {
          key: COINS_STORAGE_KEY, value: String(newCoins),
        });

        /* сохраняем уровень в список пройденных */
        const newCompleted = [...completedLevels, level];
        setCompletedLevels(newCompleted);
        bridge.send('VKWebAppStorageSet', {
          key: COMPLETED_LEVELS_KEY, value: JSON.stringify(newCompleted),
        });
      }

      /* 2. лучшее время  … (оставляем без изменений) */
      const oldBest = bestTimes[level] ?? Infinity;
      if (timeSec < oldBest) {
        const newBestTimes = { ...bestTimes, [level]: timeSec };
        setBestTimes(newBestTimes);
        bridge.send('VKWebAppStorageSet', {
          key: `best_time_${level}`, value: String(timeSec),
        });
      }

      /* 3. открываем следующий уровень  … (как было) */
      if (level === unlockedLevel && unlockedLevel < 12) {
        const next = unlockedLevel + 1;
        setUnlockedLevel(next);
        bridge.send('VKWebAppStorageSet', {
          key: PROGRESS_STORAGE_KEY, value: String(next),
        });
      }

      /* 4. запоминаем, была ли награда и открываем Victory */
      setLastAwarded(firstTime);
      const specials: Record<number, string> = { 4: mapVictory, 7: keyVictory, 12: chestVictory };

      const img = specials[level];
      if (img && firstTime) {          // показываем только при первом прохождении
        setCelebration(img);           // 1. выводим картинку
        setTimeout(() => {               // 2. через 1.4 с убираем и открываем Victory
          setCelebration(null);
          openModal('victoryModal');
        }, 2000);
      } else {
        openModal('victoryModal');
      }
      checkAchievements(level, timeSec, firstTime);
    },
    [coins, completedLevels, bestTimes, unlockedLevel]
  );



  /* ── UI ─────────────────────────────────────── */
  return (
    <SplitLayout popout={popout}>
      <SplitCol>
        <View activePanel={activePanel}>
          {/* LOADING (остался на случай переходов) */}
          <Panel id={DEFAULT_VIEW_PANELS.LOADING}><Loading /></Panel>

          {/* MENU */}
          <Panel id={DEFAULT_VIEW_PANELS.MAIN}>
            <MainMenu coins={coins} openModal={openModal} hasNewAch={hasNewAch} />
          </Panel>

          {/* LEVELS */}
          <Panel id={DEFAULT_VIEW_PANELS.LEVELS}>
            <Levels
              coins={coins}
              unlockedLevel={unlockedLevel}
              setCurrentLevel={setCurrentLevel}
              openModal={openModal}
            />
          </Panel>

          {/* GAME */}
          <Panel id={DEFAULT_VIEW_PANELS.GAME}>
            <Game
              key={restartKey}
              currentLevel={currentLevel}
              openModal={openModal}
              onLevelComplete={finishLevel}
              completedLevels={completedLevels}
              activeModal={activeModal}
            />
          </Panel>

          {/* PLOT */}
          <Panel id={DEFAULT_VIEW_PANELS.PLOT}>
            <Plot currentLevel={currentLevel} setCurrentLevel={setCurrentLevel} />
          </Panel>

          <Panel id={DEFAULT_VIEW_PANELS.ACHIEVEMENTS}>
            <Achievements
              coins={coins}
              progress={achProgress}
              rewarded={achRewarded}
              onClaim={claimAch}
              openModal={openModal}
            />
          </Panel>
          <Panel id={DEFAULT_VIEW_PANELS.SHOP}>
            <Shop
              coins={coins}
              setCoins={setCoins}
              selectedHat={selectedHat}
              setSelectedHat={setSelectedHat}
              ownedHats={ownedHats}
              setOwnedHats={setOwnedHats}
              openModal={openModal}
            />
          </Panel>
        </View>
        {celebration && (
          <div className="celebration-overlay">
            <img src={celebration} alt="" className="celebration-img" />
          </div>
        )}

      </SplitCol>



      {/* ───────────────────── модалки ───────────────────── */}
      {(() => {
        switch (activeModal) {
          case 'story':
            return (
              <div className="custom-modal">
                <div className="custom-modal-content">
                  <button className="modal-close-btn" onClick={closeModal} />
                  <p style={{ color: '#954B25', textAlign: 'center', fontSize: 16, fontWeight: 700, margin: '10px 30px' }}>
                    Привет!
                    <br /><br />
                    Меня зовут Финн, я юнга на пиратском корабле.
                    <br /><br />
                    Помоги мне найти сундук с сокровищами на этом острове,
                    чтобы получить звание помощника капитана.
                    <br /><br />
                    Сортируй предметы и продвигайся в глубь острова,
                    чтобы найти сокровища!
                  </p>
                </div>
                <span className='parrot'></span>
              </div>

            );

          case 'pause':
            return (
              <div className="custom-modal">
                <div className="custom-modal-content">
                  <button className="modal-close-btn" onClick={closeModal} />
                  <button className="menu-button" onClick={closeModal}>Продолжить</button>
                  <button className="menu-button" onClick={() => openModal('confirmRestart')}>Начать с начала</button>
                  <button className="menu-button" onClick={() => openModal('confirmMenu')}>На главную</button>
                  <button className="menu-button" onClick={() => {
                    closeModal(); returnToPause.current = true; openModal('settings');
                  }}>Настройки</button>
                </div>
              </div>
            );

          case 'settings':
            return (
              <div className="custom-modal">
                <div className="custom-modal-content">
                  <button className="modal-close-btn" onClick={() => {
                    closeModal();
                  }} />
                  <div className='container-menu-button-circle'>
                    <button className="menu-button-circle-music">
                      <p style={{ color: '#954B25', textAlign: 'center', fontSize: 12, fontWeight: 'bold', marginTop: 70 }}>Звук и музыка</p>
                    </button>
                    <button className="menu-button-circle-notifications">
                      <p style={{ color: '#954B25', textAlign: 'center', fontSize: 12, fontWeight: 'bold', marginTop: 70 }}>Уведомления</p>
                    </button>
                  </div>
                  <button className="menu-button" style={{ marginBottom: 8 }}>Сообщить об ошибке</button>
                  <button className="menu-button" style={{ marginBottom: 8 }}>Версия без рекламы</button>
                  <button className="menu-button" style={{ marginBottom: 8 }} onClick={() => openModal('confirmReset')}>
                    Сбросить все уровни
                  </button>
                </div>
              </div>
            );

          case 'confirmRestart':
            return (
              <div className="custom-modal">
                <div className="custom-modal-content-small" style={{ width: 295, height: 290 }}>
                  <button className="modal-close-btn" onClick={() => openModal('pause')} />
                  <p style={{ color: '#954B25', textAlign: 'center', fontSize: 24, fontWeight: 'bold', margin: '0 30px 20px' }}>Начать сначала?</p>
                  <p style={{ marginBottom: 20, textAlign: 'center', color: '#954B25', margin: '0 30px 20px' }}>Прогресс текущего уровня будет утерян.</p>
                  <div className="container-menu-button">
                    <button className="menu-button-yes-no" onClick={() => { closeModal(); setRestartKey(k => k + 1); window.location.hash = '/game'; }}>Да</button>
                    <button className="menu-button-yes-no" onClick={() => openModal('pause')}>Нет</button>
                  </div>
                </div>
              </div>
            );

          case 'confirmMenu':
            return (
              <div className="custom-modal">
                <div className="custom-modal-content-small" style={{ width: 295, height: 290 }}>
                  <button className="modal-close-btn" onClick={() => openModal('pause')} />
                  <p style={{ color: '#954B25', fontSize: 24, fontWeight: 'bold', textAlign: 'center', margin: '0 40px 20px' }}>
                    Вы точно хотите выйти из игры?
                  </p>
                  <p style={{ textAlign: 'center', color: '#954B25', margin: '0 40px 20px' }}>
                    Прогресс уровня будет утерян!
                  </p>
                  <div className="container-menu-button">
                    <button className="menu-button-yes-no" onClick={() => { closeModal(); window.location.hash = '/'; }}>Да</button>
                    <button className="menu-button-yes-no" onClick={() => openModal('pause')}>Нет</button>
                  </div>
                </div>
              </div>
            );

          case 'confirmRestartGame':
            return (
              <div className="custom-modal">
                <div className="custom-modal-content-small" style={{ width: 295, height: 290 }}>
                  <button className="modal-close-btn" onClick={() => openModal('pause')} />
                  <p style={{ color: '#954B25', textAlign: 'center', fontSize: 24, fontWeight: 'bold', margin: '0 30px 20px' }}>Начать заново?</p>
                  <p style={{ marginBottom: 20, textAlign: 'center', color: '#954B25', margin: '0 30px 20px' }}>Прогресс текущего уровня будет утерян.</p>
                  <div className="container-menu-button">
                    <button className="menu-button-yes-no" onClick={() => { closeModal(); setRestartKey(k => k + 1); window.location.hash = '/game'; }}>Да</button>
                    <button className="menu-button-yes-no" onClick={() => openModal('victoryModal')}>Нет</button>
                  </div>
                </div>
              </div>
            );

          case 'confirmReset':
            return (
              <div className="custom-modal">
                <div className="custom-modal-content-small" style={{ width: 295, height: 290 }}>
                  <button className="modal-close-btn" onClick={() => openModal('settings')} />
                  <p style={{ color: '#954B25', fontSize: 24, fontWeight: 'bold', textAlign: 'center', margin: '0 40px 20px' }}>
                    Сбросить все уровни?
                  </p>
                  <p style={{ textAlign: 'center', color: '#954B25', margin: '0 40px 20px' }}>
                    Вы точно хотите сбросить весь прогресс?
                  </p>
                  <div className="container-menu-button">
                    <button
                      className="menu-button-yes-no"
                      onClick={async () => {
                        await
                          await resetAll();       /* полный сброс */
                        openModal('story');     /* покажем ровно один раз */
                      }}
                    >Да</button>
                    <button className="menu-button-yes-no" onClick={() => openModal('settings')}>Нет</button>
                  </div>
                </div>
              </div>
            );

          case 'victoryModal':
            return (
              <div className="custom-modal">
                <div
                  className="custom-modal-content-small"
                  style={{ width: 295, height: 290 }}>
                  <p
                    style={{
                      color: '#954B25',
                      fontSize: 20,
                      fontWeight: 700,
                      textAlign: 'center',
                      marginBottom: 12,
                    }}>
                    Уровень пройден!</p>

                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                    <span style={{ color: '#954B25', fontSize: 24, fontWeight: 'bold' }}>+20</span>
                    <img src={coinVictory} style={{ width: 35, height: 35 }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
                    {/* AGAIN */}
                    <img
                      src={againVictory}
                      style={{ width: 50, height: 50, cursor: 'pointer' }}
                      onClick={() => openModal('confirmRestartGame')}
                    />

                    {/* START — закрываем Victory и уходим на Plot */}
                    <img
                      src={startVictory}
                      style={{ width: 50, height: 50, cursor: 'pointer' }}
                      onClick={() => {
                        /* если для уровня есть сюжет – переходим на /plot, иначе – сразу к уровням */
                        const plotLevels = [1, 2, 4, 7, 9, 12];
                        setActiveModal(null);
                        setTimeout(() => {
                          if (plotLevels.includes(currentLevel))
                            window.location.hash = '/plot';
                          else
                            window.location.hash = '/levels';
                        }, 0);
                      }}
                    />

                    {/* SHARE */}
                    <img
                      src={shareVictory}
                      style={{ width: 50, height: 50, cursor: 'pointer' }}
                      onClick={() => bridge.send('VKWebAppShare', {}).catch(console.error)}
                    />
                  </div>
                </div>
              </div>
            );

          default: return null;
        }
      })()}
      {/* всплывашка «Новое достижение» */}
      {newAch && (
        <div className="custom-modal">
          <div className="ach-modal">
            <button className="modal-close-btn" onClick={() => setNewAch(null)} />

            <h3>У вас новое достижение!</h3>
            <p>{ACHIEVEMENTS.find(a => a.id === newAch)!.title}</p>

            <div className="ach-modal-reward">
              +{ACHIEVEMENTS.find(a => a.id === newAch)!.reward}
              <img src={coinVictory} alt="" />
            </div>

            <button className="ach-menu-button" onClick={() => claimAch(newAch!)}>
              Забрать награду
            </button>

            <button
              className="ach-menu-button"
              style={{ marginTop: 10 }}
              onClick={() => bridge.send('VKWebAppShare', {}).catch(console.error)}
            >
              Поделиться
            </button>
          </div>
        </div>
      )}
    </SplitLayout>
  );
};
