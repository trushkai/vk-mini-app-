// src\panels\Loading.tsx
import React, { useEffect, useState } from 'react';
import { Panel, PanelHeader, Div, Spinner } from '@vkontakte/vkui';
import './Loading.css';

const Loading: React.FC = () => {
  return (
    <Panel id="loading">
      <PanelHeader>Загрузка</PanelHeader>
      <Div className="LoadingContainer">
        <Spinner size="large" />
      </Div>
    </Panel>
  );
};

export default Loading;
