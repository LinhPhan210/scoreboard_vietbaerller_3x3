import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Scoreboard from './components/Scoreboard/Scoreboard';
import ControllerTimer from './components/ControllerTimer/ControllerTimer';
import ControllerScore from './components/ControllerScore/ControllerScore';
import Log from './components/Log/Log';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/scoreboard" replace />} />
        <Route path="/scoreboard" element={<Scoreboard />} />
        <Route path="/controller-timer" element={<ControllerTimer />} />
        <Route path="/controller-score" element={<ControllerScore />} />
        <Route path="/log" element={<Log />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;